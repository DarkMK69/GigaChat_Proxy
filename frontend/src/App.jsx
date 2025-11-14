import React, { useState, useEffect } from 'react';
import Chat from './components/Chat';
import DialogList from './components/DialogList';
import Login from './components/login';
import ToastContainer from './components/ToastContainer';
import { requestNotificationPermission, showSuccessNotification, showErrorNotification, showInfoNotification } from './utils/notifications';
import './styles/main.css';

/**
 * Кодирует строку в Base64, поддерживая UTF-8
 */
function encodeBase64(str) {
  try {
    // Конвертируем UTF-8 строку в бинарный формат
    return btoa(unescape(encodeURIComponent(str)));
  } catch (error) {
    console.error('Ошибка кодирования:', error);
    throw new Error('Ошибка при обработке учетных данных');
  }
}

function App() {
  const [dialogs, setDialogs] = useState([]);
  const [currentDialog, setCurrentDialog] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [authError, setAuthError] = useState('');

  // Запрашиваем разрешение на уведомления при загрузке
  useEffect(() => {
    console.log('Запрашиваем разрешение на уведомления...');
    requestNotificationPermission().then(granted => {
      console.log('Разрешение на уведомления:', granted);
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated && credentials) {
      const initialDialog = {
        id: 'default',
        name: 'Новый диалог',
        messages: [],
        createdAt: new Date()
      };
      
      setDialogs([initialDialog]);
      setCurrentDialog(initialDialog);
      showSuccessNotification('Добро пожаловать!', `Вы вошли как ${credentials.username}`);
    }
  }, [isAuthenticated, credentials]);

  const handleLogin = async (username, password) => {
    try {
      setAuthError('');
      
      // Валидация перед отправкой
      if (!username?.trim() || !password) {
        throw new Error('Введите имя пользователя и пароль');
      }

      // Проверяем credentials перед установкой авторизации
      const basicAuth = 'Basic ' + encodeBase64(`${username}:${password}`);
      
      const testResponse = await fetch('http://localhost:8000/', {
        method: 'GET',
        headers: {
          'Authorization': basicAuth
        }
      });

      if (!testResponse.ok) {
        if (testResponse.status === 401) {
          throw new Error('Неверное имя пользователя или пароль');
        } else if (testResponse.status === 500) {
          throw new Error('Ошибка сервера. Проверьте, запущен ли бэкенд');
        } else {
          throw new Error(`Ошибка подключения (${testResponse.status})`);
        }
      }

      // Если запрос прошел успешно, устанавливаем авторизацию
      setCredentials({ username, password });
      setIsAuthenticated(true);
      
    } catch (error) {
      let errorMsg = 'Ошибка при входе';
      
      // Обработка разных типов ошибок
      if (error instanceof TypeError) {
        if (error.message.includes('Failed to fetch')) {
          errorMsg = 'Не удалось подключиться к серверу. Убедитесь, что бэкенд запущен на http://localhost:8000';
        } else {
          errorMsg = 'Ошибка сети. Проверьте подключение к интернету';
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setAuthError(errorMsg);
      showErrorNotification('Ошибка входа', errorMsg);
      console.error('Auth error:', error);
    }
  };

  const handleLogout = () => {
    setCredentials(null);
    setIsAuthenticated(false);
    setDialogs([]);
    setCurrentDialog(null);
    setAuthError('');
    showSuccessNotification('До свидания!', 'Вы вышли из системы');
  };

  const createNewDialog = () => {
    const newDialog = {
      id: `dialog-${Date.now()}`,
      name: `Диалог ${dialogs.length + 1}`,
      messages: [],
      createdAt: new Date()
    };
    
    setDialogs(prev => [...prev, newDialog]);
    setCurrentDialog(newDialog);
    showInfoNotification('Новый диалог', `Создан диалог "${newDialog.name}"`);
  };

  const updateDialog = (dialogId, newMessage, isUpdate = false) => {
    setDialogs(prev => prev.map(dialog => {
      if (dialog.id === dialogId) {
        if (isUpdate === 'remove') {
          return {
            ...dialog,
            messages: dialog.messages.filter(msg => msg.id !== newMessage.id)
          };
        } else if (isUpdate) {
          return {
            ...dialog,
            messages: dialog.messages.map(msg => 
              msg.id === newMessage.id ? newMessage : msg
            )
          };
        } else {
          return {
            ...dialog,
            messages: [...dialog.messages, newMessage]
          };
        }
      }
      return dialog;
    }));

    if (currentDialog && currentDialog.id === dialogId) {
      setCurrentDialog(prev => {
        if (!prev) return prev;
        
        if (isUpdate === 'remove') {
          return {
            ...prev,
            messages: prev.messages.filter(msg => msg.id !== newMessage.id)
          };
        } else if (isUpdate) {
          return {
            ...prev,
            messages: prev.messages.map(msg => 
              msg.id === newMessage.id ? newMessage : msg
            )
          };
        } else {
          return {
            ...prev,
            messages: [...prev.messages, newMessage]
          };
        }
      });
    }
  };

  const switchDialog = (dialog) => {
    setCurrentDialog(dialog);
  };

  if (!isAuthenticated) {
    return (
      <>
        <Login onLogin={handleLogin} authError={authError} />
        <ToastContainer />
      </>
    );
  }

  return (
    <>
      <div className="app">
        <div className="sidebar">
          <div className="sidebar-header">
            <button className="new-dialog-btn" onClick={createNewDialog}>
              + Новый диалог
            </button>
            <button 
              className="logout-btn" 
              onClick={handleLogout}
              title="Выйти"
            >
              Выйти ({credentials?.username})
            </button>
          </div>
          <DialogList 
            dialogs={dialogs} 
            currentDialog={currentDialog}
            onSwitchDialog={switchDialog}
          />
        </div>
        <div className="main-content">
          {currentDialog ? (
            <Chat 
              dialog={currentDialog}
              onUpdateDialog={updateDialog}
              credentials={credentials}
            />
          ) : (
            <div className="no-dialog">Выберите диалог</div>
          )}
        </div>
      </div>
      <ToastContainer />
    </>
  );
}

export default App;