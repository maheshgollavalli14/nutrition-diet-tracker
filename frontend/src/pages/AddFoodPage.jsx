import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PlusCircle, ScanBarcode, Search } from 'lucide-react';
import { foodLogsApi, foodsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import BarcodeScannerPanel from '../components/BarcodeScannerPanel';
import {
  computeNutritionPreview,
  formatNum,
  getErrorMessage,
  toDateTimeLocalValue,
} from '../utils/nutrition';

export default function AddFoodPage() {
  const [searchParams] = useSearchParams();
  const initialFoodId = searchParams.get('foodId');
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [tab, setTab] = useState('catalog');

  // Catalog search & logging state
  const [searchQuery, setSearchQuery] = useState('');
  const [foods, setFoods] = useState([]);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [selectedFood, setSelectedFood] = useState(null);
  const [catalogQty, setCatalogQty] = useState('100');
  const [catalogTime, setCatalogTime] = useState(() => toDateTimeLocalValue(new Date()));
  const [loggingCatalog, setLoggingCatalog] = useState(false);

  // Manual one-off food entry state
  const [manual, setManual] = useState({
    foodName: '',
    consumedQuantity: '100',
    servingUnit: 'g',
    calories: '',
    carbohydrates: '0',
    protein: '0',
    fat: '0',
    fiber: '0',
    sugar: '0',
    loggedAt: toDateTimeLocalValue(new Date()),
  });
  const [loggingManual, setLoggingManual] = useState(false);

  // Custom catalog creation state
  const [customFood, setCustomFood] = useState({
    name: '',
    barcode: '',
    nutritionBasis: 'PER_100G',
    servingSize: '100',
    servingUnit: 'g',
    calories: '',
    carbohydrates: '0',
    protein: '0',
    fat: '0',
    fiber: '0',
    sugar: '0',
    logImmediately: true,
    consumedQuantity: '100',
  });
  const [savingCustom, setSavingCustom] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadingFoods(true);
    foodsApi
      .list({ q: searchQuery })
      .then((data) => {
        if (!active) return;
        setFoods(data.items || []);
        if (initialFoodId && !selectedFood) {
          const match = (data.items || []).find((f) => String(f.id) === String(initialFoodId));
          if (match) {
            setSelectedFood(match);
            setCatalogQty(String(match.servingSize || 100));
          }
        }
      })
      .catch((err) => {
        if (active) showToast(getErrorMessage(err, 'Failed to load foods.'), 'error');
      })
      .finally(() => {
        if (active) setLoadingFoods(false);
      });
    return () => {
      active = false;
    };
  }, [searchQuery, initialFoodId, selectedFood, showToast]);

  const catalogPreview = computeNutritionPreview(selectedFood, catalogQty);

  const handleLogCatalog = async (e) => {
    e.preventDefault();
    if (!selectedFood) return;
    setLoggingCatalog(true);
    try {
      const parsedDt = catalogTime ? new Date(catalogTime) : new Date();
      await foodLogsApi.create({
        foodId: selectedFood.id,
        consumedQuantity: Number(catalogQty),
        servingUnit: selectedFood.servingUnit,
        loggedAt: parsedDt.toISOString(),
      });
      showToast(`Logged ${selectedFood.name} (${catalogQty}${selectedFood.servingUnit}).`);
      navigate('/dashboard');
    } catch (err) {
      showToast(getErrorMessage(err, 'Unable to log food.'), 'error');
    } finally {
      setLoggingCatalog(false);
    }
  };

  const handleLogManual = async (e) => {
    e.preventDefault();
    setLoggingManual(true);
    try {
      const parsedDt = manual.loggedAt ? new Date(manual.loggedAt) : new Date();
      await foodLogsApi.create({
        foodName: manual.foodName.trim(),
        consumedQuantity: Number(manual.consumedQuantity),
        servingUnit: manual.servingUnit.trim() || 'g',
        calories: Number(manual.calories),
        carbohydrates: Number(manual.carbohydrates || 0),
        protein: Number(manual.protein || 0),
        fat: Number(manual.fat || 0),
        fiber: Number(manual.fiber || 0),
        sugar: Number(manual.sugar || 0),
        loggedAt: parsedDt.toISOString(),
      });
      showToast(`Logged ${manual.foodName.trim()}.`);
      navigate('/dashboard');
    } catch (err) {
      showToast(getErrorMessage(err, 'Unable to log manual food.'), 'error');
    } finally {
      setLoggingManual(false);
    }
  };

  const handleCreateCustom = async (e) => {
    e.preventDefault();
    setSavingCustom(true);
    try {
      const created = await foodsApi.create({
        name: customFood.name.trim(),
        barcode: customFood.barcode.trim() || null,
        nutritionBasis: customFood.nutritionBasis,
        servingSize: Number(customFood.servingSize),
        servingUnit: customFood.servingUnit.trim() || 'g',
        calories: Number(customFood.calories),
        carbohydrates: Number(customFood.carbohydrates || 0),
        protein: Number(customFood.protein || 0),
        fat: Number(customFood.fat || 0),
        fiber: Number(customFood.fiber || 0),
        sugar: Number(customFood.sugar || 0),
      });

      if (customFood.logImmediately) {
        await foodLogsApi.create({
          foodId: created.food.id,
          consumedQuantity: Number(customFood.consumedQuantity || customFood.servingSize),
          servingUnit: created.food.servingUnit,
          loggedAt: new Date().toISOString(),
        });
        showToast(`Created custom food "${created.food.name}" and logged it to your diary!`);
        navigate('/dashboard');
      } else {
        showToast(`Saved "${created.food.name}" to your custom food catalog.`);
        setSelectedFood(created.food);
        setCatalogQty(String(created.food.servingSize));
        setTab('catalog');
      }
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to save custom food.'), 'error');
    } finally {
      setSavingCustom(false);
    }
  };

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <h1 className="page-title">Add Food</h1>
          <p className="page-subtitle">
            Search the food catalog, enter a custom meal manually, create reusable custom foods, or scan a barcode.
          </p>
        </div>
      </div>

      <div className="tab-bar" role="tablist">
        <button
          type="button"
          className={`tab-btn ${tab === 'catalog' ? 'active' : ''}`}
          onClick={() => setTab('catalog')}
        >
          <Search size={16} style={{ marginRight: 6 }} /> Food Catalog
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'manual' ? 'active' : ''}`}
          onClick={() => setTab('manual')}
        >
          <PlusCircle size={16} style={{ marginRight: 6 }} /> Manual Meal Entry
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'custom' ? 'active' : ''}`}
          onClick={() => setTab('custom')}
        >
          Save Custom Food
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'barcode' ? 'active' : ''}`}
          onClick={() => setTab('barcode')}
        >
          <ScanBarcode size={16} style={{ marginRight: 6 }} /> Scan Barcode
        </button>
      </div>

      {tab === 'catalog' && (
        <div className="grid-2">
          <div className="card">
            <h2 className="card-title">Search Food Catalog</h2>
            <div className="form-group">
              <label className="form-label" htmlFor="food-search-input">Search by name or barcode</label>
              <input
                id="food-search-input"
                type="text"
                className="form-input"
                placeholder="e.g. Chicken, Oats, Brown Rice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {loadingFoods ? (
              <p>Searching catalog...</p>
            ) : foods.length === 0 ? (
              <p className="form-hint">No matching foods found. Try creating a custom food or manual entry.</p>
            ) : (
              <div style={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {foods.map((food) => {
                  const isSelected = selectedFood?.id === food.id;
                  return (
                    <button
                      key={food.id}
                      type="button"
                      onClick={() => {
                        setSelectedFood(food);
                        setCatalogQty(String(food.servingSize || 100));
                      }}
                      style={{
                        textAlign: 'left',
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        background: isSelected ? 'var(--primary-pale)' : '#ffffff',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <strong>{food.name}</strong>
                        <span className="badge badge-green">
                          {formatNum(food.calories)} kcal / {formatNum(food.servingSize)}{food.servingUnit}
                        </span>
                      </div>
                      <div className="form-hint" style={{ marginTop: 4 }}>
                        C: {formatNum(food.carbohydrates)}g • P: {formatNum(food.protein)}g • F: {formatNum(food.fat)}g
                        {food.isCustom ? ' • My Custom Food' : ''}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="card-title">Log Selected Food</h2>
            {!selectedFood ? (
              <div className="empty-state">
                <p style={{ margin: 0 }}>Select a food from the list on the left to calculate portions and log it.</p>
              </div>
            ) : (
              <form onSubmit={handleLogCatalog}>
                <div className="alert alert-info" style={{ marginBottom: 16 }}>
                  <div>
                    <strong>{selectedFood.name}</strong>
                    <div style={{ fontSize: '0.88rem' }}>
                      Base: {formatNum(selectedFood.calories)} kcal per {formatNum(selectedFood.servingSize)}{selectedFood.servingUnit} ({selectedFood.nutritionBasis})
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="catalog-qty">
                    Consumed Quantity ({selectedFood.servingUnit})
                  </label>
                  <input
                    id="catalog-qty"
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-input"
                    value={catalogQty}
                    onChange={(e) => setCatalogQty(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="catalog-time">Meal Date &amp; Time</label>
                  <input
                    id="catalog-time"
                    type="datetime-local"
                    className="form-input"
                    value={catalogTime}
                    onChange={(e) => setCatalogTime(e.target.value)}
                    required
                  />
                </div>

                {catalogPreview && (
                  <div className="metric-card" style={{ background: '#f8fafc', marginBottom: 16 }}>
                    <div className="metric-label">Calculated Nutrition Snapshot</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 6 }}>
                      <span><strong>{catalogPreview.calories}</strong> kcal</span>
                      <span>Carbs: <strong>{catalogPreview.carbohydrates}g</strong></span>
                      <span>Protein: <strong>{catalogPreview.protein}g</strong></span>
                      <span>Fat: <strong>{catalogPreview.fat}g</strong></span>
                    </div>
                  </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loggingCatalog}>
                  {loggingCatalog ? 'Logging Food...' : 'Log Food to Diary'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {tab === 'manual' && (
        <div className="card">
          <h2 className="card-title">Direct Manual Food Entry</h2>
          <p className="form-hint" style={{ marginTop: 0, marginBottom: 16 }}>
            Log a single home-cooked meal or restaurant item directly without saving it permanently to the catalog.
          </p>

          <form onSubmit={handleLogManual}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="man-name">Meal / Food Name</label>
                <input
                  id="man-name"
                  className="form-input"
                  placeholder="e.g. Homemade Veggie Omelette"
                  value={manual.foodName}
                  onChange={(e) => setManual({ ...manual, foodName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="man-time">Date &amp; Time</label>
                <input
                  id="man-time"
                  type="datetime-local"
                  className="form-input"
                  value={manual.loggedAt}
                  onChange={(e) => setManual({ ...manual, loggedAt: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label" htmlFor="man-qty">Consumed Quantity</label>
                <input
                  id="man-qty"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-input"
                  value={manual.consumedQuantity}
                  onChange={(e) => setManual({ ...manual, consumedQuantity: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="man-unit">Serving Unit</label>
                <input
                  id="man-unit"
                  className="form-input"
                  placeholder="g, ml, plate, bowl"
                  value={manual.servingUnit}
                  onChange={(e) => setManual({ ...manual, servingUnit: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="man-kcal">Total Calories (kcal)</label>
                <input
                  id="man-kcal"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={manual.calories}
                  onChange={(e) => setManual({ ...manual, calories: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid-4">
              <div className="form-group">
                <label className="form-label" htmlFor="man-carbs">Carbs (g)</label>
                <input
                  id="man-carbs"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={manual.carbohydrates}
                  onChange={(e) => setManual({ ...manual, carbohydrates: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="man-protein">Protein (g)</label>
                <input
                  id="man-protein"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={manual.protein}
                  onChange={(e) => setManual({ ...manual, protein: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="man-fat">Fat (g)</label>
                <input
                  id="man-fat"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={manual.fat}
                  onChange={(e) => setManual({ ...manual, fat: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="man-fiber">Fiber (g)</label>
                <input
                  id="man-fiber"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={manual.fiber}
                  onChange={(e) => setManual({ ...manual, fiber: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loggingManual}>
              {loggingManual ? 'Logging...' : 'Log Manual Food'}
            </button>
          </form>
        </div>
      )}

      {tab === 'custom' && (
        <div className="card">
          <h2 className="card-title">Create Reusable Custom Food</h2>
          <form onSubmit={handleCreateCustom}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="cust-name">Food Name</label>
                <input
                  id="cust-name"
                  className="form-input"
                  placeholder="e.g. Protein Overnight Oats"
                  value={customFood.name}
                  onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="cust-barcode">Barcode (Optional)</label>
                <input
                  id="cust-barcode"
                  className="form-input"
                  placeholder="Optional UPC / EAN"
                  value={customFood.barcode}
                  onChange={(e) => setCustomFood({ ...customFood, barcode: e.target.value })}
                />
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label" htmlFor="cust-basis">Nutrition Basis</label>
                <select
                  id="cust-basis"
                  className="form-select"
                  value={customFood.nutritionBasis}
                  onChange={(e) => setCustomFood({ ...customFood, nutritionBasis: e.target.value })}
                >
                  <option value="PER_100G">Per 100g / 100ml</option>
                  <option value="PER_SERVING">Per Serving</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="cust-size">Serving Size</label>
                <input
                  id="cust-size"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-input"
                  value={customFood.servingSize}
                  onChange={(e) => setCustomFood({ ...customFood, servingSize: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="cust-unit">Serving Unit</label>
                <input
                  id="cust-unit"
                  className="form-input"
                  value={customFood.servingUnit}
                  onChange={(e) => setCustomFood({ ...customFood, servingUnit: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid-4">
              <div className="form-group">
                <label className="form-label" htmlFor="cust-kcal">Calories (kcal)</label>
                <input
                  id="cust-kcal"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={customFood.calories}
                  onChange={(e) => setCustomFood({ ...customFood, calories: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="cust-carbs">Carbs (g)</label>
                <input
                  id="cust-carbs"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={customFood.carbohydrates}
                  onChange={(e) => setCustomFood({ ...customFood, carbohydrates: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="cust-protein">Protein (g)</label>
                <input
                  id="cust-protein"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={customFood.protein}
                  onChange={(e) => setCustomFood({ ...customFood, protein: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="cust-fat">Fat (g)</label>
                <input
                  id="cust-fat"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={customFood.fat}
                  onChange={(e) => setCustomFood({ ...customFood, fat: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginBottom: 18 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={customFood.logImmediately}
                  onChange={(e) => setCustomFood({ ...customFood, logImmediately: e.target.checked })}
                />
                Also log a portion immediately
              </label>

              {customFood.logImmediately && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label htmlFor="cust-qty-now" className="form-label">Quantity ({customFood.servingUnit}):</label>
                  <input
                    id="cust-qty-now"
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-input"
                    style={{ width: 130 }}
                    value={customFood.consumedQuantity}
                    onChange={(e) => setCustomFood({ ...customFood, consumedQuantity: e.target.value })}
                  />
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" disabled={savingCustom}>
              {savingCustom ? 'Saving...' : 'Save Custom Food'}
            </button>
          </form>
        </div>
      )}

      {tab === 'barcode' && <BarcodeScannerPanel onLogged={() => navigate('/dashboard')} />}
    </div>
  );
}
