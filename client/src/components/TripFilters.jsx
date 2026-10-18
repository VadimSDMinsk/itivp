import React from 'react';

function TripFilters({ searchQuery, statusFilter, onSearchChange, onStatusChange }) {
  return (
    <div className="filter-bar">
      <label className="search-field">
        <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.7" cy="8.7" r="5.7" /><path d="m13 13 4 4" /></svg>
        <span className="visually-hidden">Поиск по водителю или автомобилю</span>
        <input type="search" value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Водитель или госномер" />
        {searchQuery && <button type="button" className="clear-search" onClick={() => onSearchChange('')} aria-label="Очистить поиск">×</button>}
      </label>
      <label className="status-filter"><span>Статус</span><select value={statusFilter} onChange={(event) => onStatusChange(event.target.value)}><option value="all">Все записи</option><option value="in_progress">В рейсе</option><option value="completed">Завершенные</option><option value="cancelled">Отмененные</option></select></label>
    </div>
  );
}

export default TripFilters;