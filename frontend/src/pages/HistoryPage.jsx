import { useCallback, useEffect, useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { foodLogsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import EditFoodLogModal from '../components/EditFoodLogModal';
import {
  formatDateTimeInTimeZone,
  formatNum,
  getErrorMessage,
  getTodayDateString,
} from '../utils/nutrition';

function subtractDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d - days));
  return dt.toISOString().slice(0, 10);
}

export default function HistoryPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const today = getTodayDateString(user?.timezone);
  const [startDate, setStartDate] = useState(() => subtractDays(today, 29));
  const [endDate, setEndDate] = useState(today);
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingLog, setEditingLog] = useState(null);

  const loadHistory = useCallback(async (sDate, eDate, pg) => {
    setLoading(true);
    setError('');
    try {
      const data = await foodLogsApi.getHistory({
        startDate: sDate,
        endDate: eDate,
        page: pg,
        limit: 25,
      });
      setHistory(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load nutrition history.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory(startDate, endDate, page);
  }, [startDate, endDate, page, loadHistory]);

  const applyPreset = (days) => {
    const end = getTodayDateString(user?.timezone);
    const start = subtractDays(end, days - 1);
    setStartDate(start);
    setEndDate(end);
    setPage(1);
  };

  const handleDelete = async (logId) => {
    if (!window.confirm('Delete this food log entry?')) return;
    try {
      await foodLogsApi.remove(logId);
      showToast('Food log deleted.');
      loadHistory(startDate, endDate, page);
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to delete log.'), 'error');
    }
  };

  const totals = history?.totals || { calories: 0, carbohydrates: 0, protein: 0, fat: 0 };
  const pagination = history?.pagination || { page: 1, totalPages: 1, totalItems: 0 };
  const logs = history?.logs || [];

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nutrition History</h1>
          <p className="page-subtitle">
            Inspect logged meals over any custom range up to 365 days.
          </p>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="hist-start">Start Date</label>
              <input
                id="hist-start"
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="hist-end">End Date</label>
              <input
                id="hist-end"
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => applyPreset(7)}>7 Days</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => applyPreset(30)}>30 Days</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => applyPreset(90)}>90 Days</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => applyPreset(365)}>365 Days</button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="grid-4">
        <div className="metric-card">
          <div className="metric-label">Range Calories</div>
          <div className="metric-value">{formatNum(totals.calories)} kcal</div>
          <div className="metric-sub">{pagination.totalItems} total logs</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Carbs</div>
          <div className="metric-value">{formatNum(totals.carbohydrates)}g</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Protein</div>
          <div className="metric-value">{formatNum(totals.protein)}g</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Fat</div>
          <div className="metric-value">{formatNum(totals.fat)}g</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <span>Logged Meals</span>
          <span className="form-hint">
            Page {pagination.page} of {pagination.totalPages}
          </span>
        </div>

        {loading ? (
          <p>Loading history...</p>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <h3>No food logs in this date range</h3>
            <p>Adjust your dates or add new meals from the Add Food page.</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date &amp; Time</th>
                    <th>Food</th>
                    <th>Portion</th>
                    <th>Calories</th>
                    <th>Carbs</th>
                    <th>Protein</th>
                    <th>Fat</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatDateTimeInTimeZone(log.loggedAt, user?.timezone)}</td>
                      <td><strong>{log.foodName}</strong></td>
                      <td>{formatNum(log.consumedQuantity)} {log.servingUnit}</td>
                      <td><strong>{formatNum(log.calories)}</strong> kcal</td>
                      <td>{formatNum(log.carbohydrates)}g</td>
                      <td>{formatNum(log.protein)}g</td>
                      <td>{formatNum(log.fat)}g</td>
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

            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {editingLog && (
        <EditFoodLogModal
          log={editingLog}
          onClose={() => setEditingLog(null)}
          onSaved={() => {
            setEditingLog(null);
            loadHistory(startDate, endDate, page);
          }}
        />
      )}
    </div>
  );
}
