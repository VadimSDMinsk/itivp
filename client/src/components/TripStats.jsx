import React from 'react';

const formatNumber = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });

function TripStats({ items }) {
  const active = items.filter((trip) => trip.status === 'in_progress').length;
  const completed = items.filter((trip) => trip.status === 'completed').length;
  const hours = items.reduce((total, trip) => total + trip.workHours, 0);
  const stats = [
    { label: 'Всего путевых листов', value: items.length, detail: 'в журнале', tone: 'green', mark: '01' },
    { label: 'Активные рейсы', value: active, detail: 'сейчас в пути', tone: 'orange', mark: '02' },
    { label: 'Завершенные', value: completed, detail: 'рейсы закрыты', tone: 'blue', mark: '03' },
    { label: 'Рабочие часы', value: formatNumber.format(hours), unit: 'ч', detail: 'суммарно', tone: 'dark', mark: '04' }
  ];
  return <div className="stats-grid">{stats.map((stat) => <article className={`stat-card stat-${stat.tone}`} key={stat.label}><div className="stat-topline"><span>{stat.label}</span><span className="stat-mark">{stat.mark}</span></div><div className="stat-value">{stat.value}<small>{stat.unit || ''}</small></div><div className="stat-bottomline"><span className="stat-rule" />{stat.detail}</div></article>)}</div>;
}

export default TripStats;