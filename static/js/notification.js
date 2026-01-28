// 现代化通知系统
class NotificationSystem {
  constructor() {
    this.container = document.getElementById('notification-container');
    this.notifications = [];
  }

  show(message, type = 'info', duration = 5000, title = '') {
    const notification = this.createNotification(message, type, title);
    this.container.appendChild(notification);
    this.notifications.push(notification);

    // 触发显示动画
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    // 进度条动画
    const progress = notification.querySelector('.notification-progress');
    if (duration > 0) {
      progress.style.width = '100%';
      progress.style.transitionDuration = duration + 'ms';

      setTimeout(() => {
        progress.style.width = '0%';
      }, 100);

      // 自动关闭
      setTimeout(() => {
        this.close(notification);
      }, duration);
    }

    return notification;
  }

  createNotification(message, type, title) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };

    const titles = {
      success: title || t('success'),
      error: title || t('error'),
      warning: title || t('warning'),
      info: title || t('info'),
    };

    notification.innerHTML = `
      <div class="notification-header">
        <div class="notification-icon">${icons[type]}</div>
        <div class="notification-title">${titles[type]}</div>
        <button class="notification-close" onclick="notificationSystem.close(this.closest('.notification'))">×</button>
      </div>
      <div class="notification-message">${message}</div>
      <div class="notification-progress"></div>
    `;

    return notification;
  }

  close(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
        this.notifications = this.notifications.filter((n) => n !== notification);
      }
    }, 400);
  }

  success(message, title, duration = 5000) {
    return this.show(message, 'success', duration, title);
  }

  error(message, title, duration = 8000) {
    return this.show(message, 'error', duration, title);
  }

  warning(message, title, duration = 6000) {
    return this.show(message, 'warning', duration, title);
  }

  info(message, title, duration = 5000) {
    return this.show(message, 'info', duration, title);
  }
}
