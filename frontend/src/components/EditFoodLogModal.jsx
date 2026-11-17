import { useEffect, useState } from 'react';
import { foodLogsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { getErrorMessage, toDateTimeLocalValue } from '../utils/nutrition';

export default function EditFoodLogModal({ log, onClose, onSaved }) {
  const { showToast } = useToast();
  const isManual = !log?.foodId;

  const [foodName, setFoodName] = useState(log?.foodName || '');
  const [consumedQuantity, setConsumedQuantity] = useState(String(log?.consumedQuantity ?? ''));
  const [calories, setCalories] = useState(String(log?.calories ?? ''));
  const [carbohydrates, setCarbohydrates] = useState(String(log?.carbohydrates ?? '0'));
  const [protein, setProtein] = useState(String(log?.protein ?? '0'));
  const [fat, setFat] = useState(String(log?.fat ?? '0'));
  const [fiber, setFiber] = useState(String(log?.fiber ?? '0'));
  const [sugar, setSugar] = useState(String(log?.sugar ?? '0'));
  const [loggedAtLocal, setLoggedAtLocal] = useState(
    toDateTimeLocalValue(log?.loggedAt || new Date())
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const qty = Number(consumedQuantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }

    const parsedDate = loggedAtLocal ? new Date(loggedAtLocal) : new Date(log.loggedAt);
    if (Number.isNaN(parsedDate.getTime())) {
      setError('Please enter a valid date and time.');
      return;
    }

    const payload = {
      consumedQuantity: qty,
      loggedAt: parsedDate.toISOString(),
    };

    if (isManual) {
      payload.foodName = foodName.trim();
      payload.calories = Number(calories);
      payload.carbohydrates = Number(carbohydrates || 0);
      payload.protein = Number(protein || 0);
      payload.fat = Number(fat || 0);
      payload.fiber = Number(fiber || 0);
      payload.sugar = Number(sugar || 0);
    }

    setSubmitting(true);
    try {
      const res = await foodLogsApi.update(log.id, payload);
      showToast('Food log updated successfully.');
      onSaved(res.log);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update food log.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="edit-log-title">
      <div className="modal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 id="edit-log-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            Edit Food Log
          </h2>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            Close
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="edit-food-name">
              Food Name
            </label>
            <input
              id="edit-food-name"
              className="form-input"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              disabled={!isManual}
              required
            />
            {!isManual && (
              <span className="form-hint">
                Catalog food: calories and macros recalculate automatically from your updated quantity.
              </span>
            )}
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="edit-quantity">
                Quantity ({log.servingUnit})
              </label>
              <input
                id="edit-quantity"
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                value={consumedQuantity}
                onChange={(e) => setConsumedQuantity(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-logged-at">
                Date &amp; Time
              </label>
              <input
                id="edit-logged-at"
                type="datetime-local"
                className="form-input"
                value={loggedAtLocal}
                onChange={(e) => setLoggedAtLocal(e.target.value)}
                required
              />
            </div>
          </div>

          {isManual && (
            <>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-cal">Calories (kcal)</label>
                  <input
                    id="edit-cal"
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-carbs">Carbs (g)</label>
                  <input
                    id="edit-carbs"
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={carbohydrates}
                    onChange={(e) => setCarbohydrates(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-protein">Protein (g)</label>
                  <input
                    id="edit-protein"
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-fat">Fat (g)</label>
                  <input
                    id="edit-fat"
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
