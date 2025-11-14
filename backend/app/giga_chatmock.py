import asyncio
import random
import json
from fastapi import HTTPException

class GigaChatProxy:
    def __init__(self, api_key: str):
        self.api_key = api_key
    
    async def send_message(self, message: str):
        """Обычный метод для обратной совместимости"""
        # Имитация задержки сети
        delay = random.uniform(0.5, 2.0)
        await asyncio.sleep(delay)
        
        response_text = self._generate_response(message)
        return {"response": response_text}
    
    async def send_message_stream(self, message: str):
        """Потоковый метод с SSE"""
        response_text = self._generate_response(message)
        
        # Разбиваем ответ на chunks для имитации потоковой передачи
        words = response_text.split()
        chunks = []
        
        # Создаем chunks по 1-3 слова для плавной передачи
        for i in range(0, len(words), random.randint(1, 3)):
            chunk = ' '.join(words[i:i+3])
            chunks.append(chunk)
        
        # Отправляем chunks с задержкой
        for i, chunk in enumerate(chunks):
            # Имитация задержки сети между chunks
            await asyncio.sleep(random.uniform(0.05, 0.2))
            
            # Формируем SSE событие
            event_data = {
                "chunk": chunk + " ",
                "done": i == len(chunks) - 1
            }
            
            # Формат SSE: data: {json}\n\n
            yield f"data: {json.dumps(event_data, ensure_ascii=False)}\n\n"
    
    def _generate_response(self, message: str):
        """Генератор ответов (общий для обоих методов)"""
        message_lower = message.lower()
        
        if any(word in message_lower for word in ['привет', 'здравствуй', 'hello', 'hi']):
            response_text = "Привет! Я виртуальный помощник. Рад вас видеть! Чем могу помочь?"
        
        elif any(word in message_lower for word in ['как дела', 'как ты', 'how are you']):
            responses = [
                "У меня всё отлично! Готов помочь вам с любыми вопросами.",
                "Всё прекрасно! А у вас как дела?",
                "Работаю в штатном режиме. Чем могу быть полезен?"
            ]
            response_text = random.choice(responses)
        
        elif any(word in message_lower for word in ['погода', 'weather']):
            response_text = "К сожалению, в демо-режиме я не могу предоставить актуальные данные о погоде. Но могу порекомендовать посмотреть специализированные сервисы!"
        
        elif any(word in message_lower for word in ['время', 'time', 'который час']):
            from datetime import datetime
            current_time = datetime.now().strftime("%H:%M:%S")
            response_text = f"Сейчас {current_time}. Но помните, это время на сервере, а не ваше локальное время!"
        
        elif any(word in message_lower for word in ['помощь', 'help', 'команды']):
            response_text = "Я могу ответить на ваши вопросы в демо-режиме. Попробуйте спросить о чём-нибудь! Для полной функциональности потребуется API ключ GigaChat."
        
        elif any(word in message_lower for word in message_lower for word in ['пока', 'прощай', 'bye', 'goodbye']):
            response_text = "До свидания! Было приятно пообщаться. Возвращайтесь снова!"
        
        elif '?' in message:
            responses = [
                "Интересный вопрос! В реальном режиме я мог бы дать более развернутый ответ.",
                "Хороший вопрос. К сожалению, в демо-режиме мои возможности ограничены.",
                "Сложный вопрос! Для точного ответа мне потребуется доступ к реальной модели GigaChat.",
                "Отличный вопрос! Рекомендую задать его при подключенном API для получения точного ответа."
            ]
            response_text = random.choice(responses)
        
        else:
            responses = [
                f"Вы сказали: '{message}'. Интересно! В реальном режиме я мог бы обсудить это подробнее.",
                f"Я понял ваше сообщение: '{message}'. Это демо-версия чата. Для полной функциональности нужен API ключ GigaChat.",
                f"Спасибо за сообщение! Вы написали: '{message}'. В реальном режиме я бы дал более содержательный ответ.",
                "Интересное сообщение! К сожалению, в демо-режиме мои ответы ограничены. Для полной версии укажите API ключ в файле .env"
            ]
            response_text = random.choice(responses)
        
        # Добавляем информацию о демо-режиме в некоторые ответы
        if random.random() < 0.3:
            response_text += "\n\nℹ️ Это демо-режим. Для подключения к реальному GigaChat API укажите ваш API ключ в файле .env"
        
        return response_text