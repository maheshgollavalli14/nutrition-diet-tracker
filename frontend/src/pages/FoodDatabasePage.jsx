import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { foodsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatNum, getErrorMessage } from '../utils/nutrition';

export default function FoodDatabasePage() {
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    foodsApi
      .list({ q: query, filter })
      .then((data) => {
        if (active) setFoods(data.items || []);
      })
      .catch((err) => {
        if (active) showToast(getErrorMessage(err, 'Failed to load food catalog.'), 'error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query, filter, showToast]);

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <h1 className="page-title">Food Database</h1>
          <p className="page-subtitle">
            Browse standard reference foods and your personal custom food entries.
          </p>
        </div>
        <Link to="/add-food" className="btn btn-primary">
          <PlusCircle size={18} /> Add / Create Food
        </Link>
      </div>

      <div className="card">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <input
            type="text"
            aria-label="Filter foods"
            className="form-input"
            style={{ maxWidth: 360 }}
            placeholder="Search by food name or barcode..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="tab-bar" style={{ marginBottom: 0 }}>
            <button
              type="button"
              className={`tab-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({foods.length})
            </button>
            <button
              type="button"
              className={`tab-btn ${filter === 'reference' ? 'active' : ''}`}
              onClick={() => setFilter('reference')}
            >
              Standard Foods
            </button>
            <button
              type="button"
              className={`tab-btn ${filter === 'custom' ? 'active' : ''}`}
              onClick={() => setFilter('custom')}
            >
              My Custom Foods
            </button>
          </div>
        </div>

        {loading ? (
          <p>Loading food catalog...</p>
        ) : foods.length === 0 ? (
          <div className="empty-state">
            <h3>No foods found</h3>
            <p>Try clearing your search or create a custom food item.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Basis / Base</th>
                  <th>Calories</th>
                  <th>Carbs</th>
                  <th>Protein</th>
                  <th>Fat</th>
                  <th>Fiber</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {foods.map((food) => (
                  <tr key={food.id}>
                    <td>
                      <strong>{food.name}</strong>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        <span className={`badge ${food.isCustom ? 'badge-green' : 'badge-gray'}`}>
                          {food.isCustom ? 'Custom' : 'Reference'}
                        </span>
                        {food.barcode && <span className="badge badge-gray">#{food.barcode}</span>}
                      </div>
                    </td>
                    <td>
                      {formatNum(food.servingSize)} {food.servingUnit} ({food.nutritionBasis})
                    </td>
                    <td><strong>{formatNum(food.calories)}</strong> kcal</td>
                    <td>{formatNum(food.carbohydrates)}g</td>
                    <td>{formatNum(food.protein)}g</td>
                    <td>{formatNum(food.fat)}g</td>
                    <td>{formatNum(food.fiber)}g</td>
                    <td>
                      <Link to={`/add-food?foodId=${food.id}`} className="btn btn-secondary btn-sm">
                        Log Portion
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
