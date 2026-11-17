import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Edit2, PlusCircle, Trash2 } from 'lucide-react';
import { foodLogsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import EditFoodLogModal from '../components/EditFoodLogModal';
import {
  formatHumanDate,
  formatNum,
  formatTimeInTimeZone,
  getErrorMessage,
  getTodayDateString,
} from '../utils/nutrition';

function shiftDate(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export default function FoodDiaryPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [selectedDate, setSelectedDate] = useState(() => getTodayDateString(user?.timezone));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingLog, setEditingLog] = useState(null);

  const loadDiary = useCallback(async (date) => {
    setLoading(true);
    setError('');
    try {
      const res = await foodLogsApi.getToday(date);
      setData(res);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load food diary.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDiary(selectedDate);
  }, [selectedDate, loadDiary]);

  const handleDelete = async (logId) => {
    if (!window.confirm('Delete this food log entry?')) return;
    try {
      await foodLogsApi.remove(logId);
      showToast('Food log deleted.');
      loadDiary(selectedDate);
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to delete entry.'), 'error');
    }
  };

  const totals = data?.totals || { calories: 0, carbohydrates: 0, protein: 0, fat: 0, fiber: 0, sugar: 0 };
  const logs = data?.logs || [];

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <h1 className="page-title">Food Diary</h1>
          <p className="page-subtitle">{formatHumanDate(selectedDate)} • Logged meals &amp; portions</p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setSelectedDate((d) => shiftDate(d, -1))}
            aria-label="Previous day"
          >
            <ChevronLeft size={18} />
          </button>
          <input
            type="date"
            aria-label="Select diary date"
            className="form-input"
            style={{ width: 'auto', minHeight: 42 }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setSelectedDate((d) => shiftDate(d, 1))}
            aria-label="Next day"
          >
            <ChevronRight size={18} />
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setSelectedDate(getTodayDateString(user?.timezone))}
          >
            Today
          </button>
          <Link to="/add-food" className="btn btn-primary">
            <PlusCircle size={18} /> Add Food
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="grid-4">
        <div className="metric-card">
          <div className="metric-label">Day Calories</div>
          <div className="metric-value">{formatNum(totals.calories)} kcal</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Carbohydrates</div>
          <div className="metric-value">{formatNum(totals.carbohydrates)}g</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Protein</div>
          <div className="metric-value">{formatNum(totals.protein)}g</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Fat</div>
          <div className="metric-value">{formatNum(totals.fat)}g</div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Entries ({logs.length})</h2>
        {loading ? (
          <p>Loading entries...</p>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <h3>No entries on {selectedDate}</h3>
            <p>Your diary for this day is empty.</p>
            <Link to="/add-food" className="btn btn-primary">
              + Log Food
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Food Item</th>
                  <th>Portion</th>
                  <th>Calories</th>
                  <th>Carbs</th>
                  <th>Protein</th>
                  <th>Fat</th>
                  <th>Fiber</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatTimeInTimeZone(log.loggedAt, user?.timezone)}</td>
                    <td>
                      <strong>{log.foodName}</strong>
                      {!log.foodId && (
                        <div>
                          <span className="badge badge-gray">Manual Entry</span>
                        </div>
                      )}
                    </td>
                    <td>
                      {formatNum(log.consumedQuantity)} {log.servingUnit}
                    </td>
                    <td><strong>{formatNum(log.calories)}</strong> kcal</td>
                    <td>{formatNum(log.carbohydrates)}g</td>
                    <td>{formatNum(log.protein)}g</td>
                    <td>{formatNum(log.fat)}g</td>
                    <td>{formatNum(log.fiber)}g</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => setEditingLog(log)}
                          aria-label={`Edit ${log.foodName}`}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(log.id)}
                          aria-label={`Delete ${log.foodName}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingLog && (
        <EditFoodLogModal
          log={editingLog}
          onClose={() => setEditingLog(null)}
          onSaved={() => {
            setEditingLog(null);
            loadDiary(selectedDate);
          }}
        />
      )}
    </div>
  );
}
