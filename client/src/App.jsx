import React, { useEffect, useRef, useState } from 'react';
import TripFilters from './components/TripFilters.jsx';
import TripForm from './components/TripForm.jsx';
import TripList from './components/TripList.jsx';
import TripStats from './components/TripStats.jsx';
import { ApiError, createTrip, deleteTrip as deleteTripRequest, getTrips, login, updateTrip } from './api.js';

const TOKEN_KEY = 'itivp_jwt';
const USER_KEY = 'itivp_user';
const VALID_STATUSES = ['in_progress', 'completed', 'cancelled'];

function getStoredSession() {
  try {
    const token = window.sessionStorage.getItem(TOKEN_KEY);
    const user = JSON.parse(window.sessionStorage.getItem(USER_KEY));
    return token && user && typeof user.role === 'string' ? { token, user } : null;
  } catch {
    return null;
  }
}

function emptyForm() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return { driverName: '', vehicleNumber: '', route: '', departureTime: date.toISOString().slice(0, 16), returnTime: '', workHours: '0', fuelConsumed: '0', status: 'in_progress', notes: '' };
}

function localDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function errorMessage(error) {
  if (error instanceof ApiError && error.status === 401) return 'Сеанс завершён или токен недействителен. Войдите снова.';
  if (error instanceof ApiError && error.status === 403) return 'Недостаточно прав для выполнения этой операции.';
  return error.message || 'Не удалось выполнить запрос.';
}

function App() {
  const [session, setSession] = useState(getStoredSession);
  const token = session?.token || null;
  const user = session?.user || null;
  const isAdmin = user?.role === 'admin';
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [loadError, setLoadError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [formFields, setFormFields] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [noticeIsError, setNoticeIsError] = useState(false);
  const [pendingIds, setPendingIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const requestVersion = useRef(0);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedQuery(searchQuery.trim().toLocaleLowerCase('ru')), 300);
    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    if (!token) {
      setItems([]);
      setIsLoading(false);
      setLoadError('');
      return undefined;
    }

    const controller = new AbortController();
    const version = ++requestVersion.current;
    setIsLoading(true);
    setLoadError('');
    getTrips(token, { signal: controller.signal })
      .then((trips) => {
        if (version === requestVersion.current) setItems(trips);
      })
      .catch((error) => {
        if (error.name === 'AbortError' || version !== requestVersion.current) return;
        if (error instanceof ApiError && error.status === 401) {
          window.sessionStorage.removeItem(TOKEN_KEY);
          window.sessionStorage.removeItem(USER_KEY);
          setSession(null);
          setNotice(errorMessage(error));
          return;
        }
        setLoadError(errorMessage(error));
      })
      .finally(() => {
        if (version === requestVersion.current) setIsLoading(false);
      });

    return () => controller.abort();
  }, [token, retryCount]);

  useEffect(() => {
    document.title = `Путевые листы (${items.length}) | Диспетчерская`;
  }, [items.length]);

  const visibleItems = items.filter((trip) => {
    const matchesSearch = !debouncedQuery
      || trip.driverName.toLocaleLowerCase('ru').includes(debouncedQuery)
      || trip.vehicleNumber.toLocaleLowerCase('ru').includes(debouncedQuery);
    return matchesSearch && (statusFilter === 'all' || trip.status === statusFilter);
  });

  async function handleLogin(event) {
    event.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const response = await login(loginEmail.trim(), loginPassword);
      window.sessionStorage.setItem(TOKEN_KEY, response.token);
      window.sessionStorage.setItem(USER_KEY, JSON.stringify(response.user));
      setLoginPassword('');
      setItems([]);
      setIsLoading(true);
      setSession({ token: response.token, user: response.user });
      setNotice('');
      setNoticeIsError(false);
    } catch (error) {
      setLoginError(error.message || 'Не удалось войти. Повторите попытку.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  function handleLogout(message = '') {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(USER_KEY);
    setSession(null);
    setItems([]);
    setNotice(message);
    setNoticeIsError(Boolean(message));
    setLoadError('');
    setIsFormOpen(false);
    setEditingId(null);
  }

  function handleProtectedError(error) {
    const message = errorMessage(error);
    if (error instanceof ApiError && error.status === 401) {
      handleLogout(message);
    } else {
      setNotice(message);
      setNoticeIsError(true);
    }
  }

  function createTripForm() {
    if (!isAdmin) return;
    setEditingId(null);
    setFormFields(emptyForm());
    setFormErrors({});
    setNotice('');
    setNoticeIsError(false);
    setIsFormOpen(true);
  }

  function editTripForm(trip) {
    if (!isAdmin || pendingIds.includes(trip.id)) return;
    setEditingId(trip.id);
    setFormFields({
      ...trip,
      route: trip.route || '',
      notes: trip.notes || '',
      departureTime: localDateTime(trip.departureTime),
      returnTime: localDateTime(trip.returnTime),
      workHours: String(trip.workHours),
      fuelConsumed: String(trip.fuelConsumed)
    });
    setFormErrors({});
    setNotice('');
    setNoticeIsError(false);
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSubmitting) return;
    setIsFormOpen(false);
    setEditingId(null);
    setFormErrors({});
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setFormFields((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: '' }));
  }

  async function handleFormSubmit(event) {
    event.preventDefault();
    if (!isAdmin || isSubmitting) return;
    const errors = {};
    if (!formFields.driverName.trim()) errors.driverName = 'Укажите ФИО водителя.';
    if (!formFields.vehicleNumber.trim()) errors.vehicleNumber = 'Укажите номер автомобиля.';
    if (!formFields.route.trim()) errors.route = 'Укажите маршрут.';
    if (!formFields.departureTime) errors.departureTime = 'Укажите время выезда.';
    const workHours = Number(formFields.workHours);
    const fuelConsumed = Number(formFields.fuelConsumed);
    if (formFields.workHours === '' || !Number.isFinite(workHours) || workHours < 0) errors.workHours = 'Введите неотрицательное число часов.';
    if (formFields.fuelConsumed === '' || !Number.isFinite(fuelConsumed) || fuelConsumed < 0) errors.fuelConsumed = 'Введите неотрицательный расход топлива.';
    if (formFields.returnTime && formFields.departureTime && new Date(formFields.returnTime) < new Date(formFields.departureTime)) errors.returnTime = 'Возвращение не может быть раньше выезда.';
    if (!VALID_STATUSES.includes(formFields.status)) errors.status = 'Выберите статус путевого листа.';
    if (Object.values(errors).some(Boolean)) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      driverName: formFields.driverName.trim(),
      vehicleNumber: formFields.vehicleNumber.trim().toLocaleUpperCase('ru'),
      route: formFields.route.trim(),
      departureTime: new Date(formFields.departureTime).toISOString(),
      returnTime: formFields.returnTime ? new Date(formFields.returnTime).toISOString() : null,
      workHours,
      fuelConsumed,
      status: formFields.status,
      notes: formFields.notes.trim() || null
    };

    setIsSubmitting(true);
    setFormErrors({});
    setNotice('');
    if (editingId !== null) {
      const original = items.find((item) => item.id === editingId);
      if (!original) {
        setIsSubmitting(false);
        setNotice('Редактируемая запись больше не найдена. Обновите список.');
        return;
      }
      setPendingIds((current) => [...current, editingId]);
      setItems((current) => current.map((item) => item.id === editingId ? { ...item, ...payload } : item));
      try {
        const updated = await updateTrip(token, editingId, payload);
        setItems((current) => current.map((item) => item.id === editingId ? updated : item));
        setNotice('Изменения путевого листа сохранены.');
        setNoticeIsError(false);
        setIsFormOpen(false);
        setEditingId(null);
      } catch (error) {
        setItems((current) => current.map((item) => item.id === editingId ? original : item));
        handleProtectedError(error);
      } finally {
        setPendingIds((current) => current.filter((id) => id !== editingId));
        setIsSubmitting(false);
      }
    } else {
      const temporaryId = `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const optimisticTrip = { id: temporaryId, ...payload, notes: payload.notes || '', returnTime: payload.returnTime || '', workHours, fuelConsumed };
      setPendingIds((current) => [...current, temporaryId]);
      setItems((current) => [optimisticTrip, ...current]);
      try {
        const created = await createTrip(token, payload);
        setItems((current) => current.map((item) => item.id === temporaryId ? created : item));
        setNotice('Путевой лист создан на сервере.');
        setNoticeIsError(false);
        setIsFormOpen(false);
      } catch (error) {
        setItems((current) => current.filter((item) => item.id !== temporaryId));
        handleProtectedError(error);
      } finally {
        setPendingIds((current) => current.filter((id) => id !== temporaryId));
        setIsSubmitting(false);
      }
    }
  }

  async function handleDeleteTrip(trip) {
    if (!isAdmin) return;
    if (String(trip.id).startsWith('temp-')) {
      setNotice('Дождитесь сохранения путевого листа перед удалением.');
      return;
    }
    if (pendingIds.includes(trip.id)) return;
    if (!window.confirm(`Удалить путевой лист водителя ${trip.driverName}?`)) return;
    const originalIndex = items.findIndex((item) => item.id === trip.id);
    if (originalIndex < 0) return;
    setPendingIds((current) => [...current, trip.id]);
    setItems((current) => current.filter((item) => item.id !== trip.id));
    setNotice('');
    setNoticeIsError(false);
    try {
      await deleteTripRequest(token, trip.id);
      setNotice('Путевой лист удалён.');
      setNoticeIsError(false);
    } catch (error) {
      setItems((current) => {
        if (current.some((item) => item.id === trip.id)) return current;
        const restored = [...current];
        restored.splice(Math.min(originalIndex, restored.length), 0, trip);
        return restored;
      });
      handleProtectedError(error);
    } finally {
      setPendingIds((current) => current.filter((id) => id !== trip.id));
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Линия, главная"><span className="brand-mark">П</span><span>Линия<span className="brand-period">.</span></span></a>
        <div className="topbar-meta"><span className="live-dot" />{token ? 'Серверный учет' : 'Вход в систему'}</div>
      </header>

      <section className="page-intro" id="top">
        <div>
          <p className="eyebrow">ДИСПЕТЧЕРСКАЯ / ПУТЕВЫЕ ЛИСТЫ</p>
          <h1>Рабочая смена<br /><span>под контролем.</span></h1>
          <p className="intro-copy">Путевые листы и рабочее время водителей в одном месте.</p>
        </div>
        <div className="intro-aside" aria-hidden="true"><span className="aside-number">05</span><span className="aside-caption">ЖУРНАЛ<br />РЕЙСОВ</span></div>
      </section>

      {!token ? (
        <section className="login-panel" aria-labelledby="login-title">
          <p className="eyebrow">АВТОРИЗАЦИЯ</p>
          <h2 id="login-title">Войти в систему</h2>
          {notice && <p className="message message-error" role="alert">{notice}</p>}
          {loginError && <p className="message message-error" role="alert">{loginError}</p>}
          <form className="login-form" onSubmit={handleLogin}>
            <label className="form-control"><span>Email</span><input type="email" autoComplete="username" required value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} /></label>
            <label className="form-control"><span>Пароль</span><input type="password" autoComplete="current-password" required value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} /></label>
            <button className="button button-primary" type="submit" disabled={isLoggingIn}>{isLoggingIn ? 'Вход...' : 'Войти'}</button>
          </form>
        </section>
      ) : (
        <>
          {!isLoading && !loadError && <section aria-label="Сводка по путевым листам"><TripStats items={items} /></section>}
          <section className="workspace" aria-label="Журнал путевых листов">
            <div className="section-heading">
              <div><p className="eyebrow">ТЕКУЩИЙ ЖУРНАЛ</p><h2>Путевые листы <span className="count-pill">{items.length}</span></h2></div>
              <div className="heading-actions">{isAdmin && <button className="button button-primary" type="button" onClick={createTripForm}><span className="button-icon">+</span>Новый путевой лист</button>}<button className="button button-quiet" type="button" onClick={() => handleLogout()}>Выйти</button></div>
            </div>
            {notice && <p className={`message ${noticeIsError ? 'message-error' : 'message-success'}`} role={noticeIsError ? 'alert' : 'status'}>{notice}</p>}
            {loadError && <p className="message message-error" role="alert">{loadError}<button className="button button-quiet retry-button" type="button" onClick={() => { setLoadError(''); setIsLoading(true); setRetryCount((count) => count + 1); }}>Повторить</button></p>}
            {isLoading ? <p className="load-state" role="status">Загрузка путевых листов...</p> : loadError ? null : (
              <>
                {isAdmin && isFormOpen && <TripForm fields={formFields} errors={formErrors} isEditing={editingId !== null} isSubmitting={isSubmitting} onChange={handleFormChange} onSubmit={handleFormSubmit} onCancel={closeForm} />}
                <TripFilters searchQuery={searchQuery} statusFilter={statusFilter} onSearchChange={setSearchQuery} onStatusChange={setStatusFilter} />
                <TripList items={visibleItems} hasItems={items.length > 0} canManage={isAdmin} pendingIds={pendingIds} onEdit={editTripForm} onDelete={handleDeleteTrip} onCreate={createTripForm} />
              </>
            )}
          </section>
        </>
      )}

      <footer className="page-footer"><span>ЛИНИЯ / УЧЕТ ПУТЕВЫХ ЛИСТОВ</span><span>{token ? 'Данные загружаются из сервера' : 'Войдите для доступа к журналу'}</span></footer>
    </main>
  );
}

export default App;
