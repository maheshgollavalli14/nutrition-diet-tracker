import { useEffect, useState } from 'react';
import { goalsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatNum, getErrorMessage } from '../utils/nutrition';

export default function GoalsPage() {
  const { showToast } = useToast();

  const [dailyCalories, setDailyCalories] = useState('2000');
  const [dailyCarbs, setDailyCarbs] = useState('250');
  const [dailyProtein, setDailyProtein] = useState('150');
  const [dailyFat, setDailyFat] = useState('65');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    goalsApi
      .get()
      .then((data) => {
        const g = data.goal;
        if (g) {
          setDailyCalories(String(g.dailyCalories));
          setDailyCarbs(String(g.dailyCarbs));
          setDailyProtein(String(g.dailyProtein));
          setDailyFat(String(g.dailyFat));
        }
      })
      .catch((err) => {
        showToast(getErrorMessage(err, 'Failed to load goals.'), 'error');
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  const macroCalorieEstimate =
    Number(dailyCarbs || 0) * 4 + Number(dailyProtein || 0) * 4 + Number(dailyFat || 0) * 9;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await goalsApi.update({
        dailyCalories: Number(dailyCalories),
        dailyCarbs: Number(dailyCarbs),
        dailyProtein: Number(dailyProtein),
        dailyFat: Number(dailyFat),
      });
      showToast('Daily nutrition goals updated!');
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to save nutrition goals.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <h1 className="page-title">Daily Nutrition Goals</h1>
          <p className="page-subtitle">Set your personal daily calorie and macronutrient targets.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 680 }}>
        {loading ? (
          <p>Loading your goals...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="goal-cal">Daily Calorie Goal (kcal)</label>
                <input
                  id="goal-cal"
                  type="number"
                  min="200"
                  max="10000"
                  step="1"
                  className="form-input"
                  value={dailyCalories}
                  onChange={(e) => setDailyCalories(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="goal-carbs">Daily Carbohydrates (g)</label>
                <input
                  id="goal-carbs"
                  type="number"
                  min="0"
                  max="2000"
                  step="0.5"
                  className="form-input"
                  value={dailyCarbs}
                  onChange={(e) => setDailyCarbs(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="goal-protein">Daily Protein (g)</label>
                <input
                  id="goal-protein"
                  type="number"
                  min="0"
                  max="1000"
                  step="0.5"
                  className="form-input"
                  value={dailyProtein}
                  onChange={(e) => setDailyProtein(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="goal-fat">Daily Fat (g)</label>
                <input
                  id="goal-fat"
                  type="number"
                  min="0"
                  max="500"
                  step="0.5"
                  className="form-input"
                  value={dailyFat}
                  onChange={(e) => setDailyFat(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="alert alert-info" style={{ marginBottom: 18, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <strong>Macro Energy Check (4/4/9): </strong>
                {formatNum(macroCalorieEstimate)} kcal from entered carbs, protein, and fat vs{' '}
                {formatNum(dailyCalories)} kcal calorie target.
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setDailyCalories(String(Math.round(macroCalorieEstimate)))}
              >
                Match Calories to Macros
              </button>
            </div>

            <p className="form-hint" style={{ marginBottom: 18 }}>
              Informational notice: Targets help track daily intake trends and do not substitute for individualized medical or clinical dietary advice.
            </p>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving Goals...' : 'Save Nutrition Goals'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
