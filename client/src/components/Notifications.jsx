import React, { useEffect, useRef, useState } from 'react';
import {
  ApiError,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead
} from '../api.js';
import { connectSocket } from '../socket.js';

const MAX_VISIBLE_NOTIFICATIONS = 100;
const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

function notificationId(notification) {
  return notification?.id === undefined || notification?.id === null
    ? null
    : String(notification.id);
}

function mergeNotifications(current, incoming) {
  const byId = new Map();
  for (const notification of [...incoming, ...current]) {
    const id = notificationId(notification);
    if (id !== null) byId.set(id, notification);
  }

  return [...byId.values()]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, MAX_VISIBLE_NOTIFICATIONS);
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Дата неизвестна' : dateFormatter.format(date);
}

function getErrorMessage(error) {
  if (error instanceof ApiError && error.status === 401) {
    return 'Сеанс завершён. Войдите снова, чтобы загрузить уведомления.';
  }
  return error.message || 'Не удалось выполнить запрос уведомлений.';
}

function Notifications({ token }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [pendingIds, setPendingIds] = useState(new Set());
  const [error, setError] = useState('');
  const notificationsRef = useRef([]);
  const notificationIdsRef = useRef(new Set());
  const pendingIdsRef = useRef(new Set());
  const socketEventVersion = useRef(0);
  const activeRef = useRef(false);
  const retryControllerRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    activeRef.current = true;
    const socket = connectSocket(token);

    notificationsRef.current = [];
    notificationIdsRef.current.clear();
    socketEventVersion.current = 0;
    pendingIdsRef.current.clear();
    setPendingIds(new Set());
    setIsMarkingAll(false);
    setNotifications([]);
    setUnreadCount(0);
    setError('');
    setIsLoading(true);

    const handleNewNotification = (notification) => {
      const id = notificationId(notification);
      if (id === null || notificationIdsRef.current.has(id)) return;

      notificationIdsRef.current.add(id);
      socketEventVersion.current += 1;
      const next = mergeNotifications(notificationsRef.current, [notification]);
      notificationsRef.current = next;
      setNotifications(next);
      if (!notification.readAt) {
        setUnreadCount((current) => current + 1);
      }
    };

    socket?.on('notification:new', handleNewNotification);

    async function loadNotifications() {
      try {
        const history = await getNotifications(token, { signal: controller.signal });
        if (!active) return;

        for (const notification of history) {
          const id = notificationId(notification);
          if (id !== null) notificationIdsRef.current.add(id);
        }
        const merged = mergeNotifications(notificationsRef.current, history);
        notificationsRef.current = merged;
        setNotifications(merged);

        let count;
        for (let attempt = 0; attempt < 2; attempt += 1) {
          const eventVersionAtRequest = socketEventVersion.current;
          count = await getUnreadNotificationCount(token, { signal: controller.signal });
          if (!active) return;
          if (eventVersionAtRequest === socketEventVersion.current) break;
        }

        setUnreadCount(count);
      } catch (requestError) {
        if (requestError.name !== 'AbortError' && active) {
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadNotifications();

    return () => {
      active = false;
      activeRef.current = false;
      controller.abort();
      retryControllerRef.current?.abort();
      socket?.off('notification:new', handleNewNotification);
    };
  }, [token]);

  async function handleMarkRead(notification) {
    const id = notificationId(notification);
    const currentNotification = notificationsRef.current.find(item => notificationId(item) === id);
    if (!id || !currentNotification || currentNotification.readAt || pendingIdsRef.current.has(id) || isMarkingAll) return;

    pendingIdsRef.current.add(id);
    setPendingIds(new Set(pendingIdsRef.current));
    setError('');

    try {
      const updated = await markNotificationRead(token, id);
      if (!activeRef.current) return;
      const readAt = updated.readAt || new Date().toISOString();
      const next = notificationsRef.current.map(item => (
        notificationId(item) === id ? { ...item, readAt } : item
      ));
      notificationsRef.current = next;
      setNotifications(next);
      setUnreadCount(current => Math.max(0, current - 1));
    } catch (requestError) {
      if (activeRef.current) setError(getErrorMessage(requestError));
    } finally {
      pendingIdsRef.current.delete(id);
      if (activeRef.current) setPendingIds(new Set(pendingIdsRef.current));
    }
  }

  async function handleMarkAllRead() {
    if (isMarkingAll || pendingIdsRef.current.size > 0 || unreadCount === 0) return;

    setIsMarkingAll(true);
    setError('');
    try {
      await markAllNotificationsRead(token);
      if (!activeRef.current) return;
      const readAt = new Date().toISOString();
      const next = notificationsRef.current.map(notification => (
        notification.readAt ? notification : { ...notification, readAt }
      ));
      notificationsRef.current = next;
      setNotifications(next);
      setUnreadCount(0);
    } catch (requestError) {
      if (activeRef.current) setError(getErrorMessage(requestError));
    } finally {
      if (activeRef.current) setIsMarkingAll(false);
    }
  }

  async function handleRetry() {
    setError('');
    setIsLoading(true);
    retryControllerRef.current?.abort();
    const controller = new AbortController();
    retryControllerRef.current = controller;
    try {
      const history = await getNotifications(token, { signal: controller.signal });
      if (!activeRef.current) return;
      for (const notification of history) {
        const id = notificationId(notification);
        if (id !== null) notificationIdsRef.current.add(id);
      }
      const next = mergeNotifications(notificationsRef.current, history);
      notificationsRef.current = next;
      setNotifications(next);
      const count = await getUnreadNotificationCount(token, { signal: controller.signal });
      if (!activeRef.current) return;
      setUnreadCount(count);
    } catch (requestError) {
      if (requestError.name !== 'AbortError' && activeRef.current) setError(getErrorMessage(requestError));
    } finally {
      if (retryControllerRef.current === controller) retryControllerRef.current = null;
      if (activeRef.current) setIsLoading(false);
    }
  }

  return (
    <div className="notifications">
      <button
        className="notifications-toggle"
        type="button"
        aria-label={unreadCount > 0 ? `Уведомления, непрочитанных: ${unreadCount}` : 'Уведомления'}
        aria-expanded={isOpen}
        aria-controls="notifications-panel"
        onClick={() => setIsOpen(open => !open)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </svg>
        {unreadCount > 0 && (
          <span className="notifications-count" aria-live="polite">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <section className="notifications-panel" id="notifications-panel" aria-label="Уведомления">
          <div className="notifications-heading">
            <div>
              <p className="eyebrow">СОБЫТИЯ</p>
              <h2>Уведомления</h2>
            </div>
            <button
              className="button button-quiet notifications-read-all"
              type="button"
              onClick={handleMarkAllRead}
              disabled={isLoading || isMarkingAll || unreadCount === 0 || pendingIds.size > 0}
            >
              {isMarkingAll ? 'Сохранение...' : 'Отметить все прочитанными'}
            </button>
          </div>

          {error && (
            <div className="notifications-error" role="alert">
              <span>{error}</span>
              <button type="button" className="button button-quiet" onClick={handleRetry} disabled={isLoading}>
                Повторить
              </button>
            </div>
          )}

          {isLoading ? (
            <p className="notifications-state" role="status">Загрузка уведомлений...</p>
          ) : notifications.length === 0 ? (
            <p className="notifications-state">Уведомлений пока нет.</p>
          ) : (
            <ul className="notifications-list">
              {notifications.map((notification) => {
                const id = notificationId(notification);
                const isUnread = !notification.readAt;
                const isPending = pendingIds.has(id);
                return (
                  <li
                    className={`notification-item${isUnread ? ' notification-unread' : ''}`}
                    key={id}
                  >
                    <div className="notification-item-heading">
                      <h3>{notification.title}</h3>
                      {isUnread && <span className="notification-unread-dot" aria-label="Непрочитано" />}
                    </div>
                    <p>{notification.message}</p>
                    <div className="notification-item-footer">
                      <time dateTime={notification.createdAt}>{formatDate(notification.createdAt)}</time>
                      {isUnread && (
                        <button
                          className="notification-read-button"
                          type="button"
                          onClick={() => handleMarkRead(notification)}
                          disabled={isPending || isMarkingAll}
                        >
                          {isPending ? 'Сохранение...' : 'Отметить прочитанным'}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

export default Notifications;
