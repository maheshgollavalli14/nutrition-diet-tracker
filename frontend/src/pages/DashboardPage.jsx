import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpen,
  Edit2,
  PlusCircle,
  ScanBarcode,
  Target,
  Trash2,
  Utensils,
} from 'lucide-react';
import { dashboardApi, foodLogsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MacroDoughnutChart, WeeklyCaloriesChart } from '../components/Charts';
import EditFoodLogModal from '../components/EditFoodLogModal';
import {
  formatHumanDate,
  formatNum,
  formatTimeInTimeZone,
  getErrorMessage,
  getTodayDateString,
} from '../utils/nutrition';

export default function DashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [selectedDate, setSelectedDate] = useState(() => getTodayDateString(user?.timezone));
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingLog, setEditingLog] = useState(null);

  const loadDashboard = useCallback(async (date) => {
    setLoading(true);
    setError('');
    try {
      const data = await dashboardApi.getSummary(date);
      setSummary(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load dashboard summary.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard(selectedDate);
  }, [selectedDate, loadDashboard]);

  const handleDeleteLog = async (logId) => {
    if (!window.confirm('Delete this food log entry?')) return;
    try {
      await foodLogsApi.remove(logId);
      showToast('Food log deleted.');
      loadDashboard(selectedDate);
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to delete food log.'), 'error');
    }
  };

  const goal = summary?.goal || { dailyCalories: 2000, dailyCarbs: 250, dailyProtein: 150, dailyFat: 65 };
  const totals = summary?.totals || { calories: 0, carbohydrates: 0, protein: 0, fat: 0 };
  const progress = summary?.progress || {
    remainingCalories: goal.dailyCalories,
    caloriePercentage: 0,
    isOverCalories: false,
    exceededCaloriesBy: 0,
  };
  const todayLogs = summary?.todayLogs || [];
  const barWidth = Math.min(Math.max(progress.caloriePercentage || 0, 0), 100);

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.fullName}</h1>
          <p className="page-subtitle">
            {formatHumanDate(selectedDate)}
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <input
            type="date"
            aria-label="Dashboard Date"
            className="form-input"
            style={{ width: 'auto', minHeight: 46 }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <Link to="/add-food" className="btn btn-primary">
            <PlusCircle size={18} /> Add Food
          </Link>
          <Link to="/scan-barcode" className="btn btn-secondary">
            <ScanBarcode size={18} /> Barcode Scanner
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {progress.isOverCalories && (
        <div className="alert alert-danger" role="alert">
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Daily Calorie Goal Exceeded: </strong>
            You have consumed {formatNum(totals.calories)} kcal, exceeding your{' '}
            {formatNum(goal.dailyCalories)} kcal goal by{' '}
            {formatNum(progress.exceededCaloriesBy)} kcal.
          </div>
        </div>
      )}

      {/* Main Calorie & Macro Cards */}
      <div className="grid-4">
        <div className="metric-card">
          <div className="metric-label">Calories Consumed</div>
          <div className="metric-value">
            {formatNum(totals.calories)} <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>kcal</span>
          </div>
          <div className="metric-sub">Goal: {formatNum(goal.dailyCalories)} kcal</div>
          <div className="progress-track" style={{ marginTop: 10 }}>
            <div
              className={`progress-fill ${progress.isOverCalories ? 'over' : ''}`}
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <div className="metric-sub">
            {progress.isOverCalories
              ? `Over by ${formatNum(progress.exceededCaloriesBy)} kcal`
              : `${formatNum(progress.remainingCalories)} kcal remaining (${formatNum(progress.caloriePercentage)}%)`}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Carbohydrates</div>
          <div className="metric-value" style={{ color: 'var(--carbs-color)' }}>
            {formatNum(totals.carbohydrates)}g
          </div>
          <div className="metric-sub">Target: {formatNum(goal.dailyCarbs)}g</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Protein</div>
          <div className="metric-value" style={{ color: 'var(--protein-color)' }}>
            {formatNum(totals.protein)}g
          </div>
          <div className="metric-sub">Target: {formatNum(goal.dailyProtein)}g</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Fat</div>
          <div className="metric-value" style={{ color: 'var(--fat-color)' }}>
            {formatNum(totals.fat)}g
          </div>
          <div className="metric-sub">Target: {formatNum(goal.dailyFat)}g</div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid-4">
        <Link to="/add-food" className="quick-action-card">
          <div className="quick-action-icon">
            <PlusCircle size={22} />
          </div>
          <strong>Add Food</strong>
          <span className="form-hint">Search catalog or enter manual meal</span>
        </Link>

        <Link to="/scan-barcode" className="quick-action-card">
          <div className="quick-action-icon">
            <ScanBarcode size={22} />
          </div>
          <strong>Scan Barcode</strong>
          <span className="form-hint">Camera scan or Open Food Facts lookup</span>
        </Link>

        <Link to="/diary" className="quick-action-card">
          <div className="quick-action-icon">
            <BookOpen size={22} />
          </div>
          <strong>View Food Diary</strong>
          <span className="form-hint">Edit or remove logged entries</span>
        </Link>

        <Link to="/goals" className="quick-action-card">
          <div className="quick-action-icon">
            <Target size={22} />
          </div>
          <strong>Set Goals</strong>
          <span className="form-hint">Adjust calorie and macro targets</span>
        </Link>
      </div>

      {/* Charts */}
      <div className="grid-2">
        <div className="card">
          <h2 className="card-title">Macronutrient Breakdown</h2>
          <MacroDoughnutChart totals={totals} />
        </div>
        <div className="card">
          <h2 className="card-title">7-Day Calorie Trend</h2>
          <WeeklyCaloriesChart
            days={summary?.weekly?.days || []}
            goalCalories={goal.dailyCalories}
          />
        </div>
      </div>

      {/* Today's Food Diary */}
      <div className="card">
        <div className="card-title">
          <span>Food Diary ({selectedDate})</span>
          <Link to="/diary" className="btn btn-outline btn-sm">
            Full Diary View
          </Link>
        </div>

        {loading ? (
          <p>Loading today&apos;s entries...</p>
        ) : todayLogs.length === 0 ? (
          <div className="empty-state">
            <Utensils size={34} color="var(--primary)" />
            <h3>No food logged for {selectedDate} yet</h3>
            <p>Start by adding a food from the catalog, scanning a barcode, or logging a manual meal.</p>
            <Link to="/add-food" className="btn btn-primary">
              + Add Your First Food
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Food</th>
                  <th>Qty</th>
                  <th>Calories</th>
                  <th>Carbs</th>
                  <th>Protein</th>
                  <th>Fat</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {todayLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatTimeInTimeZone(log.loggedAt, user?.timezone)}</td>
                    <td>
                      <strong>{log.foodName}</strong>
                    </td>
                    <td>
                      {formatNum(log.consumedQuantity)} {log.servingUnit}
                    </td>
                    <td>
                      <strong>{formatNum(log.calories)}</strong> kcal
                    </td>
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
                          onClick={() => handleDeleteLog(log.id)}
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
            loadDashboard(selectedDate);
          }}
        />
      )}
    </div>
  );
}
