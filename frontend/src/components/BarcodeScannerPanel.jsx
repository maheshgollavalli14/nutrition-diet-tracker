import { useCallback, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CameraOff,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  Package,
  Search,
  Sparkles,
  Upload,
} from 'lucide-react';
import { barcodeApi, foodLogsApi, foodsApi } from '../services/api';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { useToast } from '../context/ToastContext';
import {
  computeNutritionPreview,
  getErrorMessage,
  round2,
  toDateTimeLocalValue,
} from '../utils/nutrition';

function parseNutritionLabelText(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  const text = rawText.toLowerCase();

  const extractNumber = (patterns) => {
    for (const pat of patterns) {
      const match = text.match(pat);
      if (match && match[1]) {
        const val = parseFloat(match[1].replace(',', '.'));
        if (Number.isFinite(val) && val >= 0) return val;
      }
    }
    return null;
  };

  const calories = extractNumber([
    /(?:calories|energy|energie|calorie|kcal)[\s\:\-\=]*([0-9]+(?:[\.\,][0-9]+)?)\s*(?:kcal)?/i,
    /([0-9]+(?:[\.\,][0-9]+)?)\s*(?:kcal|calories)/i,
  ]);
  const protein = extractNumber([
    /(?:protein|proteins|proteines|protéines)[\s\:\-\=]*([0-9]+(?:[\.\,][0-9]+)?)\s*g?/i,
  ]);
  const carbs = extractNumber([
    /(?:carbohydrate|carbohydrates|carbs|glucides|total carbohydrate)[\s\:\-\=]*([0-9]+(?:[\.\,][0-9]+)?)\s*g?/i,
  ]);
  const sugar = extractNumber([
    /(?:sugars|sugar|total sugars|sucres)[\s\:\-\=]*([0-9]+(?:[\.\,][0-9]+)?)\s*g?/i,
  ]);
  const fat = extractNumber([
    /(?:total fat|fat|lipides|matières grasses)[\s\:\-\=]*([0-9]+(?:[\.\,][0-9]+)?)\s*g?/i,
  ]);
  const satFat = extractNumber([
    /(?:saturated fat|saturated|sat fat|dont acides gras saturés)[\s\:\-\=]*([0-9]+(?:[\.\,][0-9]+)?)\s*g?/i,
  ]);
  const fiber = extractNumber([
    /(?:dietary fiber|fiber|fibre|fibres alimentaires)[\s\:\-\=]*([0-9]+(?:[\.\,][0-9]+)?)\s*g?/i,
  ]);
  const sodium = extractNumber([
    /(?:sodium|na)[\s\:\-\=]*([0-9]+(?:[\.\,][0-9]+)?)\s*(?:mg|g)?/i,
  ]);
  const salt = extractNumber([
    /(?:salt|sel)[\s\:\-\=]*([0-9]+(?:[\.\,][0-9]+)?)\s*g?/i,
  ]);
  const servingSize = extractNumber([
    /(?:serving size|portion)[\s\:\-\=]*([0-9]+(?:[\.\,][0-9]+)?)\s*g?/i,
  ]);

  return {
    calories,
    protein,
    carbohydrates: carbs,
    sugar,
    fat,
    saturatedFat: satFat,
    fiber,
    sodium,
    salt,
    servingSize: servingSize || 100,
  };
}

export default function BarcodeScannerPanel({ onLogged }) {
  const { showToast } = useToast();

  const [barcodeInput, setBarcodeInput] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [lookupSource, setLookupSource] = useState('');
  const [detectedBadge, setDetectedBadge] = useState('');

  // Draft product information
  const [draftFood, setDraftFood] = useState(null);
  const [portionMode, setPortionMode] = useState('grams'); // 'grams' or 'servings'
  const [consumedQuantity, setConsumedQuantity] = useState('100');
  const [numServings, setNumServings] = useState('1');
  const [loggedAtLocal, setLoggedAtLocal] = useState(() => toDateTimeLocalValue(new Date()));
  const [saving, setSaving] = useState(false);

  // Fallback OCR section state
  const [showOcrFallback, setShowOcrFallback] = useState(false);
  const [ocrRawText, setOcrRawText] = useState('');
  const [ocrImagePreview, setOcrImagePreview] = useState(null);

  // Duplicate request prevention ref
  const inFlightRef = useRef(false);
  const lastScannedCodeRef = useRef('');
  const lastScannedTimeRef = useRef(0);

  const performLookup = useCallback(
    async (rawCode) => {
      const code = String(rawCode || '').trim();
      if (!code) {
        setLookupError('Please enter or scan a barcode.');
        return;
      }

      // Prevent duplicate concurrent requests
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      setBarcodeInput(code);
      setLookingUp(true);
      setLookupError('');
      setLookupSource('');
      setDetectedBadge(code);

      try {
        const data = await barcodeApi.lookup(code);
        const item = data.food;
        setLookupSource(data.source);

        setDraftFood({
          id: item.id || null,
          name: item.name || '',
          brand: item.brand || '',
          barcode: item.barcode || code,
          productQuantity: item.productQuantity || '',
          imageUrl: item.imageUrl || null,
          ingredients: item.ingredients || '',
          allergens: item.allergens || '',
          servingLabel: item.servingLabel || '',
          nutritionBasis: item.nutritionBasis || 'PER_100G',
          servingSize: String(item.servingSize ?? 100),
          servingUnit: item.servingUnit || 'g',
          // Core values
          calories: item.calories !== null && item.calories !== undefined ? String(item.calories) : '',
          carbohydrates: item.carbohydrates !== null && item.carbohydrates !== undefined ? String(item.carbohydrates) : '',
          protein: item.protein !== null && item.protein !== undefined ? String(item.protein) : '',
          fat: item.fat !== null && item.fat !== undefined ? String(item.fat) : '',
          fiber: item.fiber !== null && item.fiber !== undefined ? String(item.fiber) : '',
          sugar: item.sugar !== null && item.sugar !== undefined ? String(item.sugar) : '',
          saturatedFat: item.saturatedFat !== null && item.saturatedFat !== undefined ? String(item.saturatedFat) : '',
          salt: item.salt !== null && item.salt !== undefined ? String(item.salt) : '',
          sodium: item.sodium !== null && item.sodium !== undefined ? String(item.sodium) : '',
          // Detailed per100g and perServing breakdown
          per100g: item.per100g || null,
          perServing: item.perServing || null,
        });

        const initialSize = item.servingSize ?? 100;
        setConsumedQuantity(String(initialSize));
        setNumServings('1');
        setPortionMode('grams');
        setShowOcrFallback(false);
      } catch (err) {
        const msg = getErrorMessage(
          err,
          `Product for barcode ${code} not found in database or Open Food Facts.`
        );
        setLookupError(`${msg} You can enter details manually or use the Nutrition Label OCR fallback below.`);
        setLookupSource('NOT_FOUND');
        setShowOcrFallback(true);

        setDraftFood({
          id: null,
          name: '',
          brand: '',
          barcode: code,
          productQuantity: '',
          imageUrl: null,
          ingredients: '',
          allergens: '',
          servingLabel: '',
          nutritionBasis: 'PER_100G',
          servingSize: '100',
          servingUnit: 'g',
          calories: '',
          carbohydrates: '',
          protein: '',
          fat: '',
          fiber: '',
          sugar: '',
          saturatedFat: '',
          salt: '',
          sodium: '',
          per100g: null,
          perServing: null,
        });
      } finally {
        setLookingUp(false);
        inFlightRef.current = false;
      }
    },
    []
  );

  const {
    videoRef,
    scanning,
    cameras,
    selectedDeviceId,
    setSelectedDeviceId,
    cameraError,
    startScanning,
    stopScanning,
  } = useBarcodeScanner({
    onDetected: (detectedCode) => {
      const now = Date.now();
      // Debounce identical scans within 3 seconds
      if (detectedCode === lastScannedCodeRef.current && now - lastScannedTimeRef.current < 3000) {
        return;
      }
      lastScannedCodeRef.current = detectedCode;
      lastScannedTimeRef.current = now;

      showToast(`Barcode detected: ${detectedCode}`, 'info');
      performLookup(detectedCode);
    },
  });

  const handleFieldChange = (field, value) => {
    setDraftFood((prev) => ({
      ...prev,
      id: null,
      [field]: value,
    }));
  };

  // Handle portion selection (grams vs servings)
  const handlePortionModeChange = (mode) => {
    setPortionMode(mode);
    const baseServingSize = Number(draftFood?.servingSize || 100);
    if (mode === 'servings') {
      const servings = Math.max(1, round2(Number(consumedQuantity) / (baseServingSize || 100)));
      setNumServings(String(servings));
    } else {
      const grams = round2(Number(numServings) * baseServingSize);
      setConsumedQuantity(String(grams || baseServingSize));
    }
  };

  const handleServingsChange = (servingsStr) => {
    setNumServings(servingsStr);
    const count = Number(servingsStr);
    if (Number.isFinite(count) && count > 0) {
      const baseSize = Number(draftFood?.servingSize || 100);
      setConsumedQuantity(String(round2(count * baseSize)));
    }
  };

  const effectiveGrams = Number(consumedQuantity || 0);

  // Compute live preview based on user-entered quantity
  const preview = draftFood
    ? computeNutritionPreview(
        {
          nutritionBasis: draftFood.nutritionBasis,
          servingSize: Number(draftFood.servingSize || 100),
          calories: Number(draftFood.calories || 0),
          carbohydrates: Number(draftFood.carbohydrates || 0),
          protein: Number(draftFood.protein || 0),
          fat: Number(draftFood.fat || 0),
          fiber: Number(draftFood.fiber || 0),
          sugar: Number(draftFood.sugar || 0),
        },
        effectiveGrams
      )
    : null;

  // OCR Label parser action
  const handleOcrExtract = () => {
    if (!ocrRawText.trim()) {
      showToast('Please paste or enter printed nutrition label text.', 'error');
      return;
    }
    const extracted = parseNutritionLabelText(ocrRawText);
    if (!extracted) {
      showToast('Could not find nutrition values in the provided text.', 'error');
      return;
    }

    setDraftFood((prev) => ({
      ...prev,
      calories: extracted.calories !== null ? String(extracted.calories) : prev.calories,
      protein: extracted.protein !== null ? String(extracted.protein) : prev.protein,
      carbohydrates: extracted.carbohydrates !== null ? String(extracted.carbohydrates) : prev.carbohydrates,
      sugar: extracted.sugar !== null ? String(extracted.sugar) : prev.sugar,
      fat: extracted.fat !== null ? String(extracted.fat) : prev.fat,
      saturatedFat: extracted.saturatedFat !== null ? String(extracted.saturatedFat) : prev.saturatedFat,
      fiber: extracted.fiber !== null ? String(extracted.fiber) : prev.fiber,
      sodium: extracted.sodium !== null ? String(extracted.sodium) : prev.sodium,
      salt: extracted.salt !== null ? String(extracted.salt) : prev.salt,
      servingSize: extracted.servingSize ? String(extracted.servingSize) : prev.servingSize,
    }));
    showToast('Nutrition label extracted! Review the fields below before saving.', 'success');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setOcrImagePreview(reader.result);
      showToast('Image uploaded. If your browser supports text extraction, paste the text or fill in the numbers.', 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAndLog = async (e, saveCatalogOnly = false) => {
    e.preventDefault();
    if (!draftFood) return;

    if (!draftFood.name.trim()) {
      showToast('Product name is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      let foodId = draftFood.id;
      if (!foodId) {
        const created = await foodsApi.create({
          name: draftFood.name.trim(),
          barcode: draftFood.barcode.trim() || null,
          nutritionBasis: draftFood.nutritionBasis,
          servingSize: Number(draftFood.servingSize || 100),
          servingUnit: draftFood.servingUnit.trim() || 'g',
          calories: Number(draftFood.calories || 0),
          carbohydrates: Number(draftFood.carbohydrates || 0),
          protein: Number(draftFood.protein || 0),
          fat: Number(draftFood.fat || 0),
          fiber: Number(draftFood.fiber || 0),
          sugar: Number(draftFood.sugar || 0),
        });
        foodId = created.food.id;
        setDraftFood((prev) => ({ ...prev, id: foodId }));
      }

      if (saveCatalogOnly) {
        showToast('Saved packaged food to your catalog.');
        return;
      }

      const qty = Number(consumedQuantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        showToast('Consumed quantity must be greater than zero.', 'error');
        return;
      }

      const parsedDt = loggedAtLocal ? new Date(loggedAtLocal) : new Date();
      await foodLogsApi.create({
        foodId,
        consumedQuantity: qty,
        servingUnit: draftFood.servingUnit || 'g',
        loggedAt: parsedDt.toISOString(),
      });

      showToast(`Logged ${draftFood.name} to your food diary.`);
      if (onLogged) onLogged();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to save or log food.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  // Helper to render nutrition table cell with distinction between missing vs zero
  const renderNutrientCell = (val, unit = 'g') => {
    if (val === null || val === undefined || val === '') {
      return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>— (Not reported)</span>;
    }
    const num = Number(val);
    if (Number.isFinite(num) && num === 0) {
      return <span style={{ fontWeight: 600 }}>0 {unit}</span>;
    }
    return <span style={{ fontWeight: 600 }}>{val} {unit}</span>;
  };

  return (
    <div className="stack-lg">
      <div className="grid-2">
        {/* Camera Barcode Scanner Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 className="card-title" style={{ margin: 0 }}>Camera Barcode Scanner</h2>
            <span className="badge badge-green" style={{ fontSize: '0.78rem' }}>
              EAN-13 • EAN-8 • UPC-A • UPC-E
            </span>
          </div>

          <div className="scanner-video-box" style={{ marginBottom: 14 }}>
            <video
              ref={videoRef}
              muted
              playsInline
              style={{
                display: scanning ? 'block' : 'none',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 'inherit',
              }}
            />
            {!scanning && (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Camera size={44} style={{ marginBottom: 10, opacity: 0.65, color: 'var(--primary)' }} />
                <p style={{ margin: 0, fontWeight: 500 }}>
                  Click &ldquo;Start Camera&rdquo; to scan any packaged food barcode.
                </p>
                <p className="form-hint" style={{ marginTop: 4 }}>
                  Hold the barcode steady inside the frame in normal lighting.
                </p>
              </div>
            )}
          </div>

          {cameras.length > 1 && (
            <div className="form-group">
              <label className="form-label" htmlFor="camera-select">
                Camera Device
              </label>
              <select
                id="camera-select"
                className="form-select"
                value={selectedDeviceId}
                onChange={(e) => {
                  setSelectedDeviceId(e.target.value);
                  if (scanning) startScanning(e.target.value);
                }}
              >
                {cameras.map((cam, idx) => (
                  <option key={cam.deviceId || idx} value={cam.deviceId}>
                    {cam.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {cameraError && (
            <div className="alert alert-warning" style={{ marginBottom: 14 }}>
              {cameraError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {!scanning ? (
              <button type="button" className="btn btn-primary" onClick={() => startScanning()}>
                <Camera size={18} /> Start Camera
              </button>
            ) : (
              <button type="button" className="btn btn-danger" onClick={stopScanning}>
                <CameraOff size={18} /> Stop Camera
              </button>
            )}

            {detectedBadge && (
              <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={14} /> Scanned: {detectedBadge}
              </span>
            )}
          </div>
        </div>

        {/* Manual Barcode Lookup Card */}
        <div className="card">
          <h2 className="card-title">Manual Barcode Lookup</h2>
          <p className="form-hint" style={{ marginTop: 0, marginBottom: 14 }}>
            Directly enters a barcode number to query your local catalog and Open Food Facts.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              performLookup(barcodeInput);
            }}
          >
            <div className="form-group">
              <label className="form-label" htmlFor="manual-barcode-input">
                Barcode Number (EAN / UPC)
              </label>
              <input
                id="manual-barcode-input"
                type="text"
                className="form-input"
                placeholder="e.g. 8901725007102 or 3017620422003"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={lookingUp}>
              <Search size={18} /> {lookingUp ? 'Extracting Information...' : 'Lookup Barcode'}
            </button>
          </form>

          {lookupError && (
            <div className="alert alert-warning" style={{ marginTop: 16 }}>
              {lookupError}
            </div>
          )}

          <div style={{ marginTop: 18, borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem', width: '100%', justifyContent: 'center' }}
              onClick={() => setShowOcrFallback((prev) => !prev)}
            >
              <FileText size={16} />
              {showOcrFallback ? 'Hide Nutrition Label OCR Fallback' : 'Open Nutrition Label OCR Fallback'}
              {showOcrFallback ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Fallback Nutrition Label OCR & Image Upload Section */}
      {showOcrFallback && (
        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Sparkles size={20} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Nutrition Label OCR &amp; Fallback Extractor</h3>
          </div>
          <p className="form-hint" style={{ marginTop: 0, marginBottom: 16 }}>
            If a barcode is unlisted or missing on Open Food Facts, upload a photo of the printed Nutrition Facts panel or paste the text.
          </p>

          <div className="grid-2">
            <div>
              <div className="form-group">
                <label className="form-label" htmlFor="label-image-upload">
                  Upload Nutrition Label Image
                </label>
                <input
                  id="label-image-upload"
                  type="file"
                  accept="image/*"
                  className="form-input"
                  onChange={handleImageUpload}
                />
              </div>

              {ocrImagePreview && (
                <div style={{ marginBottom: 14, textAlign: 'center' }}>
                  <img
                    src={ocrImagePreview}
                    alt="Uploaded Nutrition Label"
                    style={{ maxHeight: 180, maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border-color)' }}
                  />
                </div>
              )}
            </div>

            <div>
              <div className="form-group">
                <label className="form-label" htmlFor="ocr-text-input">
                  Paste / Edit Printed Label Text
                </label>
                <textarea
                  id="ocr-text-input"
                  className="form-input"
                  rows={4}
                  placeholder="e.g. Energy 531 kcal, Protein 7.1g, Carbohydrates 50.5g, Sugars 1.5g, Fat 33.4g, Saturated Fat 14.2g, Sodium 820mg"
                  value={ocrRawText}
                  onChange={(e) => setOcrRawText(e.target.value)}
                />
              </div>
              <button type="button" className="btn btn-secondary" onClick={handleOcrExtract}>
                <Sparkles size={16} /> Extract Nutrition from Text
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Product Details Screen */}
      {draftFood && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16, borderBottom: '1px solid var(--border-color)', paddingBottom: 14 }}>
            <div>
              <h2 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={22} color="var(--primary)" />
                {draftFood.name || 'Packaged Product Details'}
              </h2>
              {draftFood.brand && (
                <div style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.95rem', marginTop: 4 }}>
                  Brand: {draftFood.brand} {draftFood.productQuantity && `• Net Qty: ${draftFood.productQuantity}`}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="badge badge-green">
                {lookupSource === 'LOCAL_CATALOG'
                  ? 'Local Catalog'
                  : lookupSource === 'OPEN_FOOD_FACTS'
                  ? 'Open Food Facts Verified'
                  : 'Manual / OCR Entry'}
              </span>
              {draftFood.barcode && <span className="badge badge-blue">Barcode: {draftFood.barcode}</span>}
            </div>
          </div>

          {/* Product Image & Key Attributes */}
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 20 }}>
            {draftFood.imageUrl ? (
              <img
                src={draftFood.imageUrl}
                alt={draftFood.name}
                style={{ width: 90, height: 90, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--border-color)', background: '#fff' }}
              />
            ) : (
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 8,
                  border: '1px dashed var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-card)',
                  color: 'var(--text-muted)',
                }}
              >
                <ImageIcon size={32} opacity={0.4} />
              </div>
            )}

            <div style={{ flex: 1, minWidth: 260 }}>
              {draftFood.ingredients && (
                <div style={{ fontSize: '0.88rem', marginBottom: 8 }}>
                  <strong>Ingredients: </strong>
                  <span style={{ color: 'var(--text-secondary)' }}>{draftFood.ingredients}</span>
                </div>
              )}
              {draftFood.allergens && (
                <div style={{ fontSize: '0.88rem' }}>
                  <strong style={{ color: '#b91c1c' }}>Allergens: </strong>
                  <span style={{ color: '#b91c1c' }}>{draftFood.allergens}</span>
                </div>
              )}
            </div>
          </div>

          {/* Nutrition Table: Comparing per 100g and per Serving */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '1rem', color: 'var(--primary-dark)' }}>
              Extracted Nutrition Facts Panel
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ fontSize: '0.88rem', width: '100%', marginBottom: 8 }}>
                <thead>
                  <tr>
                    <th>Nutrient</th>
                    <th>Per 100g / 100ml</th>
                    <th>Per Serving {draftFood.servingLabel ? `(${draftFood.servingLabel})` : ''}</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Energy / Calories</strong></td>
                    <td>{renderNutrientCell(draftFood.per100g?.calories ?? draftFood.calories, 'kcal')}</td>
                    <td>{renderNutrientCell(draftFood.perServing?.calories, 'kcal')}</td>
                    <td>
                      {draftFood.calories !== '' ? (
                        <span className="badge badge-green">Available</span>
                      ) : (
                        <span className="badge badge-amber">Unreported</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Carbohydrates</td>
                    <td>{renderNutrientCell(draftFood.per100g?.carbohydrates ?? draftFood.carbohydrates, 'g')}</td>
                    <td>{renderNutrientCell(draftFood.perServing?.carbohydrates, 'g')}</td>
                    <td>
                      {draftFood.carbohydrates !== '' ? (
                        <span className="badge badge-green">Available</span>
                      ) : (
                        <span className="badge badge-amber">Unreported</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: 24 }}>Total Sugars</td>
                    <td>{renderNutrientCell(draftFood.per100g?.sugar ?? draftFood.sugar, 'g')}</td>
                    <td>{renderNutrientCell(draftFood.perServing?.sugar, 'g')}</td>
                    <td>
                      {draftFood.sugar !== '' ? (
                        <span className="badge badge-green">Available</span>
                      ) : (
                        <span className="badge badge-amber">Unreported</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Protein</td>
                    <td>{renderNutrientCell(draftFood.per100g?.protein ?? draftFood.protein, 'g')}</td>
                    <td>{renderNutrientCell(draftFood.perServing?.protein, 'g')}</td>
                    <td>
                      {draftFood.protein !== '' ? (
                        <span className="badge badge-green">Available</span>
                      ) : (
                        <span className="badge badge-amber">Unreported</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Total Fat</td>
                    <td>{renderNutrientCell(draftFood.per100g?.fat ?? draftFood.fat, 'g')}</td>
                    <td>{renderNutrientCell(draftFood.perServing?.fat, 'g')}</td>
                    <td>
                      {draftFood.fat !== '' ? (
                        <span className="badge badge-green">Available</span>
                      ) : (
                        <span className="badge badge-amber">Unreported</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingLeft: 24 }}>Saturated Fat</td>
                    <td>{renderNutrientCell(draftFood.per100g?.saturatedFat ?? draftFood.saturatedFat, 'g')}</td>
                    <td>{renderNutrientCell(draftFood.perServing?.saturatedFat, 'g')}</td>
                    <td>
                      {draftFood.saturatedFat ? (
                        <span className="badge badge-green">Available</span>
                      ) : (
                        <span className="badge badge-amber">Unreported</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Dietary Fibre</td>
                    <td>{renderNutrientCell(draftFood.per100g?.fiber ?? draftFood.fiber, 'g')}</td>
                    <td>{renderNutrientCell(draftFood.perServing?.fiber, 'g')}</td>
                    <td>
                      {draftFood.fiber !== '' ? (
                        <span className="badge badge-green">Available</span>
                      ) : (
                        <span className="badge badge-amber">Unreported</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Sodium / Salt</td>
                    <td>
                      {draftFood.per100g?.salt !== null && draftFood.per100g?.salt !== undefined
                        ? `${draftFood.per100g.salt} g salt`
                        : draftFood.per100g?.sodium !== null && draftFood.per100g?.sodium !== undefined
                        ? `${draftFood.per100g.sodium} g sodium`
                        : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>— (Not reported)</span>}
                    </td>
                    <td>
                      {draftFood.perServing?.salt !== null && draftFood.perServing?.salt !== undefined
                        ? `${draftFood.perServing.salt} g salt`
                        : draftFood.perServing?.sodium !== null && draftFood.perServing?.sodium !== undefined
                        ? `${draftFood.perServing.sodium} g sodium`
                        : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>—</span>}
                    </td>
                    <td>
                      {draftFood.salt || draftFood.sodium ? (
                        <span className="badge badge-green">Available</span>
                      ) : (
                        <span className="badge badge-amber">Unreported</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
              <span className="form-hint">
                Note: Missing nutrients are explicitly flagged as &ldquo;Unreported&rdquo; and are never treated as zero.
              </span>
            </div>
          </div>

          {/* Editable Confirmation Form */}
          <form onSubmit={(e) => handleSaveAndLog(e, false)}>
            <h4 style={{ margin: '14px 0 10px', fontSize: '1rem', color: 'var(--primary-dark)' }}>
              Edit &amp; Confirm Product Information
            </h4>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="scan-name">Product Name</label>
                <input
                  id="scan-name"
                  className="form-input"
                  value={draftFood.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="scan-barcode">Barcode</label>
                <input
                  id="scan-barcode"
                  className="form-input"
                  value={draftFood.barcode}
                  onChange={(e) => handleFieldChange('barcode', e.target.value)}
                />
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label" htmlFor="scan-basis">Nutrition Basis</label>
                <select
                  id="scan-basis"
                  className="form-select"
                  value={draftFood.nutritionBasis}
                  onChange={(e) => handleFieldChange('nutritionBasis', e.target.value)}
                >
                  <option value="PER_100G">Per 100g / 100ml</option>
                  <option value="PER_SERVING">Per Serving</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="scan-size">Base Size</label>
                <input
                  id="scan-size"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-input"
                  value={draftFood.servingSize}
                  onChange={(e) => handleFieldChange('servingSize', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="scan-unit">Unit</label>
                <input
                  id="scan-unit"
                  className="form-input"
                  value={draftFood.servingUnit}
                  onChange={(e) => handleFieldChange('servingUnit', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid-4">
              <div className="form-group">
                <label className="form-label" htmlFor="scan-kcal">Calories (kcal)</label>
                <input
                  id="scan-kcal"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={draftFood.calories}
                  onChange={(e) => handleFieldChange('calories', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="scan-carbs">Carbs (g)</label>
                <input
                  id="scan-carbs"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={draftFood.carbohydrates}
                  onChange={(e) => handleFieldChange('carbohydrates', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="scan-protein">Protein (g)</label>
                <input
                  id="scan-protein"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={draftFood.protein}
                  onChange={(e) => handleFieldChange('protein', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="scan-fat">Fat (g)</label>
                <input
                  id="scan-fat"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  value={draftFood.fat}
                  onChange={(e) => handleFieldChange('fat', e.target.value)}
                />
              </div>
            </div>

            {/* Quantity Selection in Grams or Servings */}
            <div style={{ background: 'var(--bg-body)', padding: 16, borderRadius: 'var(--radius-md)', marginBottom: 18, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                <strong>Select Consumed Portion:</strong>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className={`btn ${portionMode === 'grams' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                    onClick={() => handlePortionModeChange('grams')}
                  >
                    In Grams ({draftFood.servingUnit})
                  </button>
                  <button
                    type="button"
                    className={`btn ${portionMode === 'servings' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                    onClick={() => handlePortionModeChange('servings')}
                  >
                    In Servings
                  </button>
                </div>
              </div>

              <div className="grid-2">
                {portionMode === 'grams' ? (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="scan-consume-qty">
                      Amount Consumed ({draftFood.servingUnit})
                    </label>
                    <input
                      id="scan-consume-qty"
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-input"
                      value={consumedQuantity}
                      onChange={(e) => setConsumedQuantity(e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="scan-num-servings">
                      Number of Servings ({draftFood.servingSize} {draftFood.servingUnit} / serving)
                    </label>
                    <input
                      id="scan-num-servings"
                      type="number"
                      step="0.1"
                      min="0.1"
                      className="form-input"
                      value={numServings}
                      onChange={(e) => handleServingsChange(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="scan-logged-at">Meal Date &amp; Time</label>
                  <input
                    id="scan-logged-at"
                    type="datetime-local"
                    className="form-input"
                    value={loggedAtLocal}
                    onChange={(e) => setLoggedAtLocal(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Real-time Calculated Nutrition Preview */}
            {preview && (
              <div className="alert alert-info" style={{ marginBottom: 18 }}>
                <div>
                  <strong>Calculated Nutrition for {consumedQuantity}{draftFood.servingUnit} {portionMode === 'servings' ? `(${numServings} serving${Number(numServings) !== 1 ? 's' : ''})` : ''}: </strong>
                  {preview.calories} kcal • {preview.carbohydrates}g Carbs • {preview.protein}g Protein •{' '}
                  {preview.fat}g Fat • {preview.fiber}g Fiber • {preview.sugar}g Sugar
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save & Log to Food Diary'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={saving}
                onClick={(e) => handleSaveAndLog(e, true)}
              >
                Save Only to Food Catalog
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
