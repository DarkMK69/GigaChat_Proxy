import httpx
import os
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
import json
import ssl

class GigaChatProxy:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://gigachat.devices.sberbank.ru/api/v1"
        self.access_token = None
    
    async def _get_access_token(self):
        """Получение access token для GigaChat API"""
        # Создаем SSL контекст с отключенной проверкой для разработки
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        async with httpx.AsyncClient(verify=ssl_context) as client:
            response = await client.post(
                "https://ngw.devices.sberbank.ru:9443/api/v2/oauth",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "RqUID": "123e4567-e89b-12d3-a456-426614174000",
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                data={"scope": "GIGACHAT_API_PERS"},
                timeout=30.0
            )
            
            if response.status_code == 200:
                self.access_token = response.json()["access_token"]
            else:
                raise HTTPException(status_code=500, detail=f"Failed to get access token: {response.text}")
    
    async def send_message(self, message: str):
        """Обычный метод для обратной совместимости"""
        if not self.access_token:
            await self._get_access_token()
        
        # Создаем SSL контекст с отключенной проверкой для разработки
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = True
        ssl_context.verify_mode = ssl.CERT_NONE
        
        async with httpx.AsyncClient(verify=ssl_context) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.access_token}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "GigaChat",
                        "messages": [{"role": "user", "content": message}],
                        "stream": False,
                        "temperature": 0.7,
                        "max_tokens": 1024
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return {"response": result["choices"][0]["message"]["content"]}
                else:
                    raise HTTPException(status_code=response.status_code, detail=f"GigaChat API error: {response.text}")
                    
            except httpx.ConnectError as e:
                raise HTTPException(status_code=500, detail=f"Connection error: {str(e)}")
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
    
    async def send_message_stream(self, message: str):
        """Потоковый метод с SSE для реального GigaChat API"""
        if not self.access_token:
            await self._get_access_token()
        
        # Создаем SSL контекст с отключенной проверкой для разработки
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        async with httpx.AsyncClient(verify=ssl_context) as client:
            try:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.access_token}",
                        "Content-Type": "application/json",
                        "Accept": "text/event-stream"
                    },
                    json={
                        "model": "GigaChat",
                        "messages": [{"role": "user", "content": message}],
                        "stream": True,  # Включаем потоковый режим
                        "temperature": 0.7,
                        "max_tokens": 1024
                    },
                    timeout=30.0
                ) as response:
                    
                    if response.status_code != 200:
                        error_text = await response.aread()
                        yield f"data: {json.dumps({'error': f'GigaChat API error: {error_text.decode()}'})}\n\n"
                        return
                    
                    accumulated_content = ""
                    
                    async for chunk in response.aiter_bytes():
                        try:
                            # Декодируем chunk
                            chunk_text = chunk.decode('utf-8')
                            lines = chunk_text.strip().split('\n')
                            
                            for line in lines:
                                if line.startswith('data: '):
                                    data_str = line[6:].strip()
                                    
                                    if data_str == '[DONE]':
                                        # Завершаем поток
                                        yield f"data: {json.dumps({'chunk': '', 'done': True})}\n\n"
                                        return
                                    
                                    try:
                                        data = json.loads(data_str)
                                        
                                        # Извлекаем контент из ответа GigaChat
                                        if (data.get('choices') and 
                                            len(data['choices']) > 0 and 
                                            'delta' in data['choices'][0] and 
                                            'content' in data['choices'][0]['delta']):
                                            
                                            content_chunk = data['choices'][0]['delta']['content']
                                            
                                            if content_chunk:
                                                accumulated_content += content_chunk
                                                
                                                # Отправляем chunk через SSE
                                                yield f"data: {json.dumps({
                                                    'chunk': content_chunk,
                                                    'accumulated': accumulated_content,
                                                    'done': False
                                                })}\n\n"
                                        
                                        # Проверяем завершение
                                        if (data.get('choices') and 
                                            len(data['choices']) > 0 and 
                                            data['choices'][0].get('finish_reason')):
                                            
                                            yield f"data: {json.dumps({
                                                'chunk': '',
                                                'accumulated': accumulated_content,
                                                'done': True
                                            })}\n\n"
                                            return
                                            
                                    except json.JSONDecodeError:
                                        # Пропускаем некорректные JSON
                                        continue
                                        
                        except Exception as e:
                            yield f"data: {json.dumps({'error': f'Error processing chunk: {str(e)}'})}\n\n"
                            return
                
            except httpx.ConnectError as e:
                yield f"data: {json.dumps({'error': f'Connection error: {str(e)}'})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': f'Unexpected error: {str(e)}'})}\n\n"
    
    async def _fallback_stream(self, message: str):
        """Fallback метод на случай проблем с реальным API"""
        import asyncio
        import random
        
        # Генерируем ответ как в mock версии
        responses = [
            f"Вы спросили: '{message}'. Это реальный ответ от GigaChat API через SSE.",
            f"Вопрос: '{message}'. Ответ передается в реальном времени через потоковую передачу.",
            f"Сообщение '{message}' получено. Обрабатываю через GigaChat API с SSE...",
        ]
        
        response_text = random.choice(responses)
        words = response_text.split()
        
        # Имитируем потоковую передачу
        for i in range(0, len(words), 2):
            chunk = ' '.join(words[i:i+2]) + ' '
            await asyncio.sleep(0.1)
            
            yield f"data: {json.dumps({
                'chunk': chunk,
                'accumulated': ' '.join(words[:i+2]),
                'done': i + 2 >= len(words)
            })}\n\n"