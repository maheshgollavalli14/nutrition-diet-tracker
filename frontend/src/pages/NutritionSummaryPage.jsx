import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MacroDoughnutChart, WeeklyCaloriesChart } from '../components/Charts';
import { formatHumanDate, formatNum, getErrorMessage, getTodayDateString } from '../utils/nutrition';

export default function NutritionSummaryPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => getTodayDateString(user?.timezone));
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSummary = useCallback(async (date) => {
    setLoading(true);
    setError('');
    try {
      const data = await dashboardApi.getSummary(date);
      setSummary(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load nutrition summary.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary(selectedDate);
  }, [selectedDate, loadSummary]);

  const totals = summary?.totals || { calories: 0, carbohydrates: 0, protein: 0, fat: 0, fiber: 0, sugar: 0 };
  const goal = summary?.goal || { dailyCalories: 2000, dailyCarbs: 250, dailyProtein: 150, dailyFat: 65 };
  const macro = summary?.macroBreakdown || { carbsPercent: 0, proteinPercent: 0, fatPercent: 0 };
  const weekly = summary?.weekly || { days: [], loggedDaysCount: 0, averageCaloriesOnLoggedDays: 0 };

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nutrition Summary</h1>
          <p className="page-subtitle">
            Macro balance, caloric ratios, fiber &amp; sugar intake for {formatHumanDate(selectedDate)}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="date"
            aria-label="Summary Date"
            className="form-input"
            style={{ width: 'auto', minHeight: 42 }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <Link to="/goals" className="btn btn-secondary">
            Edit Goals
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="card">Loading nutrition summary...</div>
      ) : (
        <>
          <div className="grid-4">
            <div className="metric-card">
              <div className="metric-label">Carbs Ratio</div>
              <div className="metric-value" style={{ color: 'var(--carbs-color)' }}>
                {formatNum(macro.carbsPercent)}%
              </div>
              <div className="metric-sub">
                {formatNum(totals.carbohydrates)}g / {formatNum(goal.dailyCarbs)}g goal
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Protein Ratio</div>
              <div className="metric-value" style={{ color: 'var(--protein-color)' }}>
                {formatNum(macro.proteinPercent)}%
              </div>
              <div className="metric-sub">
                {formatNum(totals.protein)}g / {formatNum(goal.dailyProtein)}g goal
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Fat Ratio</div>
              <div className="metric-value" style={{ color: 'var(--fat-color)' }}>
                {formatNum(macro.fatPercent)}%
              </div>
              <div className="metric-sub">
                {formatNum(totals.fat)}g / {formatNum(goal.dailyFat)}g goal
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Fiber &amp; Sugar</div>
              <div className="metric-value" style={{ fontSize: '1.35rem' }}>
                {formatNum(totals.fiber)}g <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>fiber</span>
              </div>
              <div className="metric-sub">Sugar: {formatNum(totals.sugar)}g</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <h2 className="card-title">Daily Macro Caloric Share</h2>
              <MacroDoughnutChart totals={totals} />
            </div>

            <div className="card">
              <div className="card-title">
                <span>7-Day Calorie Trend</span>
                <span className="badge badge-green">
                  Avg ({weekly.loggedDaysCount} logged days): {formatNum(weekly.averageCaloriesOnLoggedDays)} kcal
                </span>
              </div>
              <WeeklyCaloriesChart days={weekly.days} goalCalories={goal.dailyCalories} />
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">7-Day Daily Breakdown</h2>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Entries</th>
                    <th>Calories</th>
                    <th>Carbs</th>
                    <th>Protein</th>
                    <th>Fat</th>
                    <th>Fiber</th>
                  </tr>
                </thead>
                <tbody>
                  {(weekly.days || []).map((day) => (
                    <tr key={day.date}>
                      <td><strong>{day.date}</strong></td>
                      <td>{day.logCount}</td>
                      <td>
                        <strong style={{ color: day.isOverCalories ? 'var(--danger)' : 'inherit' }}>
                          {formatNum(day.calories)} kcal
                        </strong>
                      </td>
                      <td>{formatNum(day.carbohydrates)}g</td>
                      <td>{formatNum(day.protein)}g</td>
                      <td>{formatNum(day.fat)}g</td>
                      <td>{formatNum(day.fiber)}g</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
