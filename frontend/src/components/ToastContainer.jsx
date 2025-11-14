import React, { useEffect, useState } from 'react';

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Слушаем пользовательское событие для добавления toast уведомлений
    const handleAddToast = (event) => {
      const { id, title, message, type, duration } = event.detail;
      
      setToasts(prev => [...prev, { id, title, message, type, duration, removing: false }]);

      // Удаляем toast после истечения времени (если указано)
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    };

    window.addEventListener('addToast', handleAddToast);
    return () => window.removeEventListener('addToast', handleAddToast);
  }, []);

  const removeToast = (id) => {
    setToasts(prev =>
      prev.map(toast =>
        toast.id === id ? { ...toast, removing: true } : toast
      )
    );

    // Удаляем после анимации
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 300);
  };

  const getIcon = (type) => {
    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠'
    };
    return icons[type] || icons.info;
  };

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast ${toast.type} ${toast.removing ? 'removing' : ''}`}
        >
          <div className="toast-icon">{getIcon(toast.type)}</div>
          <div className="toast-content">
            <div className="toast-title">{toast.title}</div>
            {toast.message && <div className="toast-message">{toast.message}</div>}
          </div>
          <button
            className="toast-close"
            onClick={() => removeToast(toast.id)}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
