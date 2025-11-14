import React, { useState, useEffect } from 'react';

const Login = ({ onLogin, authError }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Очищаем ошибки валидации при изменении полей
  useEffect(() => {
    setValidationErrors({});
  }, [username, password]);

  const validateForm = () => {
    const errors = {};
    
    if (!username.trim()) {
      errors.username = 'Имя пользователя не может быть пустым';
    } else if (username.trim().length < 3) {
      errors.username = 'Имя пользователя должно быть минимум 3 символа';
    }
    
    if (!password) {
      errors.password = 'Пароль не может быть пустым';
    } else if (password.length < 6) {
      errors.password = 'Пароль должен быть минимум 6 символов';
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setIsLoading(true);
    setValidationErrors({});
    await onLogin(username, password);
    setIsLoading(false);
  };

  const handleQuickLogin = async (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setValidationErrors({});
    setIsLoading(true);
    await onLogin(user, pass);
    setIsLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">💬</div>
          <h1>GigaChat</h1>
          <p>Вопросно ответная система</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className={`form-group ${validationErrors.username ? 'error' : ''}`}>
            <label htmlFor="username">
              Имя пользователя
              {validationErrors.username && <span className="error-label"> *</span>}
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите имя пользователя"
              required
              disabled={isLoading}
              autoComplete="username"
              className={validationErrors.username ? 'input-error' : ''}
            />
            {validationErrors.username && (
              <span className="field-error">{validationErrors.username}</span>
            )}
          </div>
          
          <div className={`form-group password-group ${validationErrors.password ? 'error' : ''}`}>
            <label htmlFor="password">
              Пароль
              {validationErrors.password && <span className="error-label"> *</span>}
            </label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                required
                disabled={isLoading}
                autoComplete="current-password"
                className={validationErrors.password ? 'input-error' : ''}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {validationErrors.password && (
              <span className="field-error">{validationErrors.password}</span>
            )}
          </div>

          {authError && (
            <div className="auth-error">
              <span className="error-icon">⚠️</span>
              <div className="error-content">
                <span className="error-title">Ошибка входа</span>
                <span className="error-message">{authError}</span>
              </div>
            </div>
          )}
          
          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading || !username || !password}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Вход...
              </>
            ) : (
              'Войти'
            )}
          </button>
        </form>

        <div className="demo-credentials">
          <p>Демо-учетные данные:</p>
          <div className="credentials-list">
            <button
              type="button"
              className="demo-btn"
              onClick={() => handleQuickLogin('admin', 'password123')}
              disabled={isLoading}
              title="Быстрый вход как администратор"
            >
              <span className="demo-user">👤 admin</span>
              <span className="demo-pass">password123</span>
            </button>
            <button
              type="button"
              className="demo-btn"
              onClick={() => handleQuickLogin('user', 'chat123')}
              disabled={isLoading}
              title="Быстрый вход как пользователь"
            >
              <span className="demo-user">👤 user</span>
              <span className="demo-pass">chat123</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;