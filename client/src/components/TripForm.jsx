import React from 'react';

const statuses = [
  { value: 'in_progress', label: 'В рейсе' },
  { value: 'completed', label: 'Завершен' },
  { value: 'cancelled', label: 'Отменен' }
];

function TripForm({ fields, errors, isEditing, onChange, onSubmit, onCancel }) {
  const controlClass = (name) => errors[name] ? 'form-control has-error' : 'form-control';
  return (
    <section className="form-panel" aria-labelledby="form-title">
      <div className="form-heading">
        <div><p className="eyebrow">{isEditing ? 'ИЗМЕНЕНИЕ ЗАПИСИ' : 'НОВАЯ ЗАПИСЬ'}</p><h3 id="form-title">{isEditing ? 'Редактировать путевой лист' : 'Добавить путевой лист'}</h3></div>
        <button className="icon-button close-button" type="button" onClick={onCancel} aria-label="Закрыть форму" title="Закрыть">×</button>
      </div>
      <form onSubmit={onSubmit} noValidate>
        <div className="form-grid">
          <label className={controlClass('driverName')}><span>ФИО водителя <i>*</i></span><input name="driverName" value={fields.driverName} onChange={onChange} placeholder="Например, Иван Петров" autoComplete="name" />{errors.driverName && <small>{errors.driverName}</small>}</label>
          <label className={controlClass('vehicleNumber')}><span>Госномер автомобиля <i>*</i></span><input name="vehicleNumber" value={fields.vehicleNumber} onChange={onChange} placeholder="А123БВ 77" />{errors.vehicleNumber && <small>{errors.vehicleNumber}</small>}</label>
          <label className={controlClass('route')}><span>Маршрут <i>*</i></span><input name="route" value={fields.route} onChange={onChange} placeholder="Москва — Тула — Москва" />{errors.route && <small>{errors.route}</small>}</label>
          <label className={controlClass('departureTime')}><span>Время выезда <i>*</i></span><input type="datetime-local" name="departureTime" value={fields.departureTime} onChange={onChange} />{errors.departureTime && <small>{errors.departureTime}</small>}</label>
          <label className={controlClass('returnTime')}><span>Время возвращения</span><input type="datetime-local" name="returnTime" value={fields.returnTime} onChange={onChange} />{errors.returnTime && <small>{errors.returnTime}</small>}</label>
          <label className={controlClass('workHours')}><span>Рабочие часы</span><div className="input-with-unit"><input type="number" name="workHours" min="0" step="0.5" value={fields.workHours} onChange={onChange} /><span>ч</span></div>{errors.workHours && <small>{errors.workHours}</small>}</label>
          <label className={controlClass('fuelConsumed')}><span>Расход топлива</span><div className="input-with-unit"><input type="number" name="fuelConsumed" min="0" step="0.1" value={fields.fuelConsumed} onChange={onChange} /><span>л</span></div>{errors.fuelConsumed && <small>{errors.fuelConsumed}</small>}</label>
          <label className={controlClass('status')}><span>Статус</span><select name="status" value={fields.status} onChange={onChange}>{statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>{errors.status && <small>{errors.status}</small>}</label>
          <label className="form-control form-control-wide"><span>Примечание</span><textarea name="notes" value={fields.notes} onChange={onChange} rows="3" placeholder="Детали рейса, замечания, документы" /></label>
        </div>
        <div className="form-actions"><span className="form-hint"><i>*</i> Обязательные поля</span><div><button className="button button-quiet" type="button" onClick={onCancel}>Отмена</button><button className="button button-primary" type="submit">{isEditing ? 'Сохранить изменения' : 'Добавить запись'}</button></div></div>
      </form>
    </section>
  );
}

export default TripForm;