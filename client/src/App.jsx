import React, { useEffect, useRef, useState } from 'react';
import TripFilters from './components/TripFilters.jsx';
import TripForm from './components/TripForm.jsx';
import TripList from './components/TripList.jsx';
import TripStats from './components/TripStats.jsx';

const STORAGE_KEY = 'itivp_lab4_trips';
const VALID_STATUSES = ['in_progress', 'completed', 'cancelled'];

function createDemoTrips() {
  const at = (offset, hour) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    date.setHours(hour, 0, 0, 0);
    return date.toISOString();
  };
  return [
    { id: 'demo-1', driverName: 'Алексей Морозов', vehicleNumber: 'А482МР 799', route: 'Москва — Тула — Москва', departureTime: at(-1, 7), returnTime: at(-1, 18), workHours: 10.5, fuelConsumed: 48.2, status: 'completed', notes: 'Доставка оборудования, документы сданы.' },
    { id: 'demo-2', driverName: 'Ирина Волкова', vehicleNumber: 'Е315КТ 77', route: 'Москва — Ярославль', departureTime: at(0, 8), returnTime: '', workHours: 5, fuelConsumed: 31.6, status: 'in_progress', notes: 'Плановый рейс.' },
    { id: 'demo-3', driverName: 'Дмитрий Соколов', vehicleNumber: 'М907ВХ 50', route: 'Москва — Калуга', departureTime: at(-2, 9), returnTime: '', workHours: 0, fuelConsumed: 0, status: 'cancelled', notes: 'Рейс отменен по погодным условиям.' }
  ];
}

function isTripArray(value) {
  return Array.isArray(value) && value.every((trip) => (
    trip && typeof trip === 'object'
    && (typeof trip.id === 'string' || typeof trip.id === 'number')
    && typeof trip.driverName === 'string'
    && typeof trip.vehicleNumber === 'string'
    && typeof trip.route === 'string'
    && typeof trip.departureTime === 'string' && !Number.isNaN(Date.parse(trip.departureTime))
    && typeof trip.returnTime === 'string' && (!trip.returnTime || !Number.isNaN(Date.parse(trip.returnTime)))
    && Number.isFinite(trip.workHours) && trip.workHours >= 0
    && Number.isFinite(trip.fuelConsumed) && trip.fuelConsumed >= 0
    && VALID_STATUSES.includes(trip.status)
    && typeof trip.notes === 'string'
  ));
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

function App() {
  const [items, setItems] = useState([]);
  const [formFields, setFormFields] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [storageError, setStorageError] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    let initialItems = createDemoTrips();
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (isTripArray(parsed)) initialItems = parsed;
      }
    } catch {
      setStorageError('Не удалось прочитать сохраненные данные. Загружены демонстрационные записи.');
    }
    setItems(initialItems);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) loadedRef.current = true;
  }, [isLoaded]);

  useEffect(() => {
    if (!loadedRef.current) return undefined;
    const timeoutId = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        setStorageError('');
      } catch {
        setStorageError('Не удалось сохранить данные в этом браузере.');
      }
    }, 500);
    return () => window.clearTimeout(timeoutId);
  }, [items]);

  useEffect(() => {
    document.title = `Путевые листы (${items.length}) | Диспетчерская`;
  }, [items.length]);

  const visibleItems = items.filter((trip) => {
    const query = searchQuery.trim().toLocaleLowerCase('ru');
    const matchesSearch = !query || trip.driverName.toLocaleLowerCase('ru').includes(query)
      || trip.vehicleNumber.toLocaleLowerCase('ru').includes(query);
    return matchesSearch && (statusFilter === 'all' || trip.status === statusFilter);
  });

  function createTripForm() {
    setEditingId(null);
    setFormFields(emptyForm());
    setFormErrors({});
    setNotice('');
    setIsFormOpen(true);
  }

  function editTripForm(trip) {
    setEditingId(trip.id);
    setFormFields({ ...trip, departureTime: localDateTime(trip.departureTime), returnTime: localDateTime(trip.returnTime), workHours: String(trip.workHours), fuelConsumed: String(trip.fuelConsumed) });
    setFormErrors({});
    setNotice('');
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingId(null);
    setFormErrors({});
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setFormFields((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: '' }));
  }

  function handleFormSubmit(event) {
    event.preventDefault();
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

    const trip = {
      id: editingId ?? (globalThis.crypto?.randomUUID?.() ?? `trip-${Date.now()}-${Math.random().toString(16).slice(2)}`),
      driverName: formFields.driverName.trim(),
      vehicleNumber: formFields.vehicleNumber.trim().toLocaleUpperCase('ru'),
      route: formFields.route.trim(),
      departureTime: new Date(formFields.departureTime).toISOString(),
      returnTime: formFields.returnTime ? new Date(formFields.returnTime).toISOString() : '',
      workHours, fuelConsumed, status: formFields.status, notes: formFields.notes.trim()
    };
    if (editingId !== null) {
      setItems((current) => current.map((item) => item.id === editingId ? trip : item));
      setNotice('Изменения путевого листа сохранены.');
    } else {
      setItems((current) => [trip, ...current]);
      setNotice('Путевой лист добавлен.');
    }
    setIsFormOpen(false);
    setEditingId(null);
    setFormErrors({});
  }

  function deleteTrip(trip) {
    if (!window.confirm(`Удалить путевой лист водителя ${trip.driverName}?`)) return;
    setItems((current) => current.filter((item) => item.id !== trip.id));
    setNotice('Путевой лист удален.');
    if (editingId === trip.id) closeForm();
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Линия, главная"><span className="brand-mark">П</span><span>Линия<span className="brand-period">.</span></span></a>
        <div className="topbar-meta"><span className="live-dot" />Локальный учет</div>
      </header>

      <section className="page-intro" id="top">
        <div>
          <p className="eyebrow">ДИСПЕТЧЕРСКАЯ / ПУТЕВЫЕ ЛИСТЫ</p>
          <h1>Рабочая смена<br /><span>под контролем.</span></h1>
          <p className="intro-copy">Путевые листы и рабочее время водителей в одном месте.</p>
        </div>
        <div className="intro-aside" aria-hidden="true"><span className="aside-number">04</span><span className="aside-caption">ЖУРНАЛ<br />РЕЙСОВ</span></div>
      </section>

      <section aria-label="Сводка по путевым листам"><TripStats items={items} /></section>

      <section className="workspace" aria-label="Журнал путевых листов">
        <div className="section-heading">
          <div><p className="eyebrow">ТЕКУЩИЙ ЖУРНАЛ</p><h2>Путевые листы <span className="count-pill">{items.length}</span></h2></div>
          <button className="button button-primary" type="button" onClick={createTripForm}><span className="button-icon">+</span>Новый путевой лист</button>
        </div>
        {storageError && <p className="message message-error" role="alert">{storageError}</p>}
        {notice && <p className="message message-success" role="status">{notice}</p>}
        {isFormOpen && <TripForm fields={formFields} errors={formErrors} isEditing={editingId !== null} onChange={handleFormChange} onSubmit={handleFormSubmit} onCancel={closeForm} />}
        <TripFilters searchQuery={searchQuery} statusFilter={statusFilter} onSearchChange={setSearchQuery} onStatusChange={setStatusFilter} />
        <TripList items={visibleItems} hasItems={items.length > 0} onEdit={editTripForm} onDelete={deleteTrip} onCreate={createTripForm} />
      </section>

      <footer className="page-footer"><span>ЛИНИЯ / УЧЕТ ПУТЕВЫХ ЛИСТОВ</span><span>Хранение в этом браузере · {isLoaded ? 'данные загружены' : 'загрузка данных'}</span></footer>
    </main>
  );
}

export default App;