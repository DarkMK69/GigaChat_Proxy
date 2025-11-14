import React, { useMemo } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import { processMessageText, extractCodeBlocks, extractFormulas } from '../utils/textProcessor';

const Message = ({ message, isStreaming = false }) => {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Обрабатываем и форматируем текст сообщения
  const processedContent = useMemo(() => {
    return processMessageText(message.content);
  }, [message.content]);

  // Разбиваем текст на части (код, формулы, текст)
  const parts = useMemo(() => {
    return extractCodeBlocks(processedContent);
  }, [processedContent]);

  const renderContent = (content) => {
    // Для кодовых блоков
    if (typeof content === 'object' && content.type === 'code') {
      return (
        <pre className={`code-block language-${content.language}`}>
          <code>{content.content}</code>
        </pre>
      );
    }

    // Для обычного текста - ищем формулы
    const formulas = extractFormulas(content);
    
    return formulas.map((part, idx) => {
      if (part.type === 'formula') {
        // Render with KaTeX (BlockMath for display, InlineMath for inline)
        return part.isDisplay ? (
          <div key={idx} className="formula formula-display">
            <BlockMath>{part.content}</BlockMath>
          </div>
        ) : (
          <span key={idx} className="formula formula-inline">
            <InlineMath>{part.content}</InlineMath>
          </span>
        );
      } else {
        // Форматируем обычный текст с переносами строк
        return (
          <span key={idx} className="text-content">
            {part.content.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i < part.content.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </span>
        );
      }
    });
  };

  return (
    <div className={`message ${message.role} ${isStreaming ? 'streaming' : ''}`}>
      <div className="message-content">
        <div className="message-text">
          {parts.map((part, idx) => (
            <React.Fragment key={idx}>
              {part.type === 'code' ? (
                <pre className={`code-block language-${part.language}`}>
                  <code>{part.content}</code>
                </pre>
              ) : (
                renderContent(part.content)
              )}
            </React.Fragment>
          ))}
          {isStreaming && (
            <span className="streaming-cursor">|</span>
          )}
        </div>
        <div className="message-time">
          {formatTime(message.timestamp)}
          {isStreaming && ' • Набирается...'}
        </div>
      </div>
    </div>
  );
};

export default Message;