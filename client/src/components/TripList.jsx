import React from 'react';

const labels = { in_progress: 'В рейсе', completed: 'Завершен', cancelled: 'Отменен' };
const dateFormatter = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

function TripList({ items, hasItems, canManage, pendingIds, onEdit, onDelete, onCreate }) {
  if (!items.length) return (
    <div className="empty-state">
      <span className="empty-symbol" aria-hidden="true">{hasItems ? '⌕' : '+'}</span>
      <h3>{hasItems ? 'Ничего не найдено' : 'Журнал пока пуст'}</h3>
      <p>{hasItems ? 'Измените поисковый запрос или фильтр статуса.' : 'Добавьте первый путевой лист, чтобы начать учет смен.'}</p>
      {!hasItems && canManage && <button className="button button-primary" type="button" onClick={onCreate}>Добавить путевой лист</button>}
    </div>
  );

  return (
    <div className="table-wrap">
      <table className="trip-table">
        <thead><tr><th scope="col">Водитель / автомобиль</th><th scope="col">Маршрут</th><th scope="col">Выезд · возврат</th><th scope="col" className="numeric-cell">Часы</th><th scope="col" className="numeric-cell">Топливо</th><th scope="col">Статус</th>{canManage && <th scope="col"><span className="visually-hidden">Действия</span></th>}</tr></thead>
        <tbody>
          {items.map((trip) => {
            const isPending = pendingIds.includes(trip.id);
            return (
            <tr key={trip.id}>
              <td><div className="driver-cell"><span className="driver-avatar" aria-hidden="true">{trip.driverName.trim().charAt(0).toLocaleUpperCase('ru') || '?'}</span><span><strong>{trip.driverName}</strong><small>{trip.vehicleNumber}</small>{isPending && <small className="pending-label">Сохранение...</small>}</span></div></td>
              <td><span className="route-text">{trip.route || 'Маршрут не указан'}</span></td>
              <td><span className="date-pair">{formatDate(trip.departureTime)}</span><small className="date-return">{trip.returnTime ? formatDate(trip.returnTime) : 'Возврат не отмечен'}</small></td>
              <td className="numeric-cell"><strong>{trip.workHours.toLocaleString('ru-RU')}</strong><small>ч</small></td>
              <td className="numeric-cell"><strong>{trip.fuelConsumed.toLocaleString('ru-RU')}</strong><small>л</small></td>
              <td><span className={`status-badge status-${trip.status}`}><span />{labels[trip.status]}</span></td>
              {canManage && <td><div className="row-actions">
                <button className="icon-button" type="button" disabled={isPending} onClick={() => onEdit(trip)} aria-label={`Редактировать путевой лист: ${trip.driverName}`} title="Редактировать"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m13.8 3.2 3 3M4 16l3.3-.7L17 5.6a1.4 1.4 0 0 0-2-2L5.3 13.3 4 16Z" /></svg></button>
                <button className="icon-button danger-action" type="button" disabled={isPending} onClick={() => onDelete(trip)} aria-label={`Удалить путевой лист: ${trip.driverName}`} title="Удалить"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 6h11M8 6V4h4v2m2 0-.6 10H6.6L6 6m2.5 2v5m3-5v5" /></svg></button>
              </div></td>}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default TripList;