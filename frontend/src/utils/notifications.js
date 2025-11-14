export const NotificationType = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
};

export const isNotificationSupported = () => 'Notification' in window;

export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    console.warn('Notification API не поддерживается');
    return false;
  }

  console.log('Текущее разрешение:', Notification.permission);

  if (Notification.permission === 'granted') {
    console.log('Разрешение на уведомления уже получено');
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('Разрешение на уведомления было запрещено пользователем');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('Результат запроса разрешения:', permission);
    return permission === 'granted';
  } catch (error) {
    console.error('Ошибка при запросе разрешения:', error);
    return false;
  }
};

export const askPermission = requestNotificationPermission;

const getIconForType = (type) => {
  const icons = {
    [NotificationType.SUCCESS]: '✓',
    [NotificationType.ERROR]: '✕',
    [NotificationType.INFO]: 'ℹ',
    [NotificationType.WARNING]: '⚠'
  };
  return icons[type] || icons[NotificationType.INFO];
};

export const showNotification = (title, options = {}) => {
  if (!isNotificationSupported()) {
    console.warn('Notification API не поддерживается, используем fallback');
    showFallbackNotification(title, options.body || '');
    return;
  }

  console.log('Показываем уведомление:', title, 'Разрешение:', Notification.permission);

  if (Notification.permission !== 'granted') {
    console.warn('Нет разрешения на уведомления, используем fallback');
    showFallbackNotification(title, options.body || '');
    return;
  }

  try {
    const {
      body = '',
      type = NotificationType.INFO,
      duration = 4000,
      icon = '/favicon.ico',
      tag = undefined
    } = options;

    const notification = new Notification(title, {
      body,
      icon: icon || getIconForType(type),
      tag: tag || `notification-${Date.now()}`,
      requireInteraction: type === NotificationType.ERROR,
      ...options
    });

    // Автоматически закрывать уведомление
    if (duration > 0) {
      setTimeout(() => notification.close(), duration);
    }

    console.log('Уведомление успешно показано');
    return notification;
  } catch (error) {
    console.error('Ошибка при показе уведомления:', error);
    showFallbackNotification(title, options.body || '');
  }
};

/**
 * Отправить событие для показа toast уведомления
 */
const emitToast = (title, message = '', type = NotificationType.INFO, duration = 4000) => {
  const event = new CustomEvent('addToast', {
    detail: {
      id: `toast-${Date.now()}-${Math.random()}`,
      title,
      message,
      type,
      duration
    }
  });
  window.dispatchEvent(event);
};

/**
 * Fallback уведомление через toast (вместо alert)
 */
const showFallbackNotification = (title, body) => {
  emitToast(title, body, NotificationType.INFO, 4000);
  console.log('Toast notification:', title, body);
};

export const showSuccessNotification = (title, body = '') => {
  return showNotification(title, {
    body,
    type: NotificationType.SUCCESS
  }) || emitToast(title, body, NotificationType.SUCCESS, 4000);
};

export const showErrorNotification = (title, body = '') => {
  return showNotification(title, {
    body,
    type: NotificationType.ERROR,
    duration: 0
  }) || emitToast(title, body, NotificationType.ERROR, 0);
};

export const showInfoNotification = (title, body = '') => {
  return showNotification(title, {
    body,
    type: NotificationType.INFO
  }) || emitToast(title, body, NotificationType.INFO, 4000);
};

export const showWarningNotification = (title, body = '') => {
  return showNotification(title, {
    body,
    type: NotificationType.WARNING,
    duration: 5000
  }) || emitToast(title, body, NotificationType.WARNING, 5000);
};