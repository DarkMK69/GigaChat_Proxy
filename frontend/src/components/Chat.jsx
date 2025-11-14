import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';
import { showSuccessNotification, showErrorNotification, showInfoNotification } from '../utils/notifications';

/**
 * Кодирует строку в Base64, поддерживая UTF-8
 */
function encodeBase64(str) {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (error) {
    console.error('Ошибка кодирования:', error);
    throw new Error('Ошибка при обработке учетных данных');
  }
}

const Chat = ({ dialog, onUpdateDialog, credentials }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [dialog.messages, streamingMessage]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    };

    onUpdateDialog(dialog.id, userMessage);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + encodeBase64(`${credentials.username}:${credentials.password}`)
        },
        body: JSON.stringify({
          message: userMessage.content,
          dialog_id: dialog.id,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      const streamMessageId = Date.now() + 1;
      
      // Сразу добавляем пустое сообщение в диалог
      const initialStreamMessage = {
        id: streamMessageId,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        isStreaming: true
      };
      
      onUpdateDialog(dialog.id, initialStreamMessage);
      setStreamingMessage(initialStreamMessage);

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.chunk) {
                accumulatedText += data.chunk;
                
                // Обновляем сообщение в состоянии диалога
                const updatedMessage = {
                  id: streamMessageId,
                  content: accumulatedText,
                  role: 'assistant',
                  timestamp: new Date(),
                  isStreaming: !data.done
                };
                
                // ОБНОВЛЯЕМ ДИАЛОГ, а не только локальное состояние
                onUpdateDialog(dialog.id, updatedMessage, true); // true = это обновление существующего сообщения
                setStreamingMessage(updatedMessage);
              }

              if (data.done) {
                // Финальное сообщение без флага streaming
                const finalMessage = {
                  id: streamMessageId,
                  content: accumulatedText,
                  role: 'assistant',
                  timestamp: new Date()
                };
                
                onUpdateDialog(dialog.id, finalMessage, true);
                setStreamingMessage(null);
                setIsLoading(false);
                showSuccessNotification('Ответ получен', 'Сообщение успешно обработано');
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Удаляем потоковое сообщение при ошибке
      if (streamingMessage) {
        onUpdateDialog(dialog.id, streamingMessage, 'remove');
      }
      
      let errorMsg = 'Не удалось отправить сообщение';
      
      // Обработка разных типов ошибок
      if (error instanceof TypeError) {
        if (error.message.includes('Failed to fetch')) {
          errorMsg = 'Ошибка подключения к серверу';
        } else {
          errorMsg = 'Ошибка сети';
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        content: `Ошибка: ${errorMsg}`,
        role: 'error',
        timestamp: new Date()
      };
      onUpdateDialog(dialog.id, errorMessage);
      setStreamingMessage(null);
      setIsLoading(false);
      
      showErrorNotification('Ошибка отправки', errorMsg);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat">
      <div className="chat-header">
        <h3>{dialog.name}</h3>
        <small>Режим: Потоковый (SSE)</small>
      </div>
      
      <div className="messages">
        {dialog.messages
          .filter(message => !message.isStreaming || message.content) // Фильтруем пустые streaming сообщения
          .map(message => (
            <Message 
              key={message.id} 
              message={message} 
              isStreaming={message.isStreaming}
            />
          ))}
        
        {/* Индикатор загрузки только если нет активного streaming */}
        {isLoading && !streamingMessage && (
          <div className="message loading">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Введите ваше сообщение..."
          disabled={isLoading}
          rows={3}
        />
        <button 
          onClick={sendMessage} 
          disabled={!inputMessage.trim() || isLoading}
        >
          {isLoading ? 'Отправка...' : 'Отправить'}
        </button>
      </div>
    </div>
  );
};

export default Chat;