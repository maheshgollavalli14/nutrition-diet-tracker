const https = require('node:https');
const http = require('node:http');
const env = require('../config/env');
const foodModel = require('../models/foodModel');
const { round2 } = require('../utils/nutritionCalculator');
const { BadGatewayError, NotFoundError, ValidationError } = require('../utils/errors');

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : null;
}

function parseServingSize(product) {
  const qty = toFiniteNumber(product.serving_quantity);
  if (qty && qty > 0) {
    return {
      servingSize: round2(qty),
      servingUnit: String(product.serving_quantity_unit || 'g').trim() || 'g',
    };
  }
  return { servingSize: 100, servingUnit: 'g' };
}

function extractOpenFoodFactsProduct(barcode, product) {
  const nutriments = product.nutriments || {};
  const rawName = product.product_name || product.product_name_en || product.generic_name || '';
  const brand = product.brands ? String(product.brands).split(',')[0].trim() : '';
  const name = rawName
    ? brand && !rawName.toLowerCase().includes(brand.toLowerCase())
      ? `${brand} - ${rawName}`
      : rawName
    : `Packaged Food (${barcode})`;

  const kcal100 = toFiniteNumber(nutriments['energy-kcal_100g']);
  const kj100 = toFiniteNumber(nutriments.energy_100g);
  const calories100 = kcal100 !== null ? kcal100 : kj100 !== null ? round2(kj100 / 4.184) : null;

  const kcalServing = toFiniteNumber(nutriments['energy-kcal_serving']);
  const kjServing = toFiniteNumber(nutriments.energy_serving);
  const caloriesServing =
    kcalServing !== null ? kcalServing : kjServing !== null ? round2(kjServing / 4.184) : null;

  const parsedServing = parseServingSize(product);
  const servingLabel = product.serving_size || null;
  const productQuantity = product.quantity || null;
  const imageUrl =
    product.image_front_small_url ||
    product.image_front_url ||
    product.image_url ||
    product.image_small_url ||
    product.image_ingredients_small_url ||
    product.image_ingredients_url ||
    null;

  const ingredients = product.ingredients_text || product.ingredients_text_en || null;
  let allergens = product.allergens || null;
  if (!allergens && Array.isArray(product.allergens_tags) && product.allergens_tags.length > 0) {
    allergens = product.allergens_tags.map((t) => t.replace(/^[a-z]+:/, '')).join(', ');
  }

  // Distinct nutrient values per 100g (null means value is missing/unreported, NOT zero)
  const salt100 = toFiniteNumber(nutriments.salt_100g);
  const sodium100 = toFiniteNumber(nutriments.sodium_100g);

  const per100g = {
    calories: calories100 !== null ? round2(calories100) : null,
    carbohydrates:
      toFiniteNumber(nutriments.carbohydrates_100g) !== null
        ? round2(toFiniteNumber(nutriments.carbohydrates_100g))
        : null,
    protein:
      toFiniteNumber(nutriments.proteins_100g) !== null
        ? round2(toFiniteNumber(nutriments.proteins_100g))
        : null,
    fat:
      toFiniteNumber(nutriments.fat_100g) !== null
        ? round2(toFiniteNumber(nutriments.fat_100g))
        : null,
    saturatedFat:
      toFiniteNumber(nutriments['saturated-fat_100g']) !== null
        ? round2(toFiniteNumber(nutriments['saturated-fat_100g']))
        : null,
    fiber:
      toFiniteNumber(nutriments.fiber_100g) !== null
        ? round2(toFiniteNumber(nutriments.fiber_100g))
        : null,
    sugar:
      toFiniteNumber(nutriments.sugars_100g) !== null
        ? round2(toFiniteNumber(nutriments.sugars_100g))
        : null,
    salt:
      salt100 !== null
        ? round2(salt100)
        : sodium100 !== null
        ? round2(sodium100 * 2.5)
        : null,
    sodium:
      sodium100 !== null
        ? round2(sodium100)
        : salt100 !== null
        ? round2(salt100 / 2.5)
        : null,
  };

  // Distinct nutrient values per serving when present
  const saltServing = toFiniteNumber(nutriments.salt_serving);
  const sodiumServing = toFiniteNumber(nutriments.sodium_serving);

  const hasServingData =
    caloriesServing !== null ||
    toFiniteNumber(nutriments.proteins_serving) !== null ||
    toFiniteNumber(nutriments.carbohydrates_serving) !== null;

  const perServing = hasServingData
    ? {
        calories: caloriesServing !== null ? round2(caloriesServing) : null,
        carbohydrates:
          toFiniteNumber(nutriments.carbohydrates_serving) !== null
            ? round2(toFiniteNumber(nutriments.carbohydrates_serving))
            : null,
        protein:
          toFiniteNumber(nutriments.proteins_serving) !== null
            ? round2(toFiniteNumber(nutriments.proteins_serving))
            : null,
        fat:
          toFiniteNumber(nutriments.fat_serving) !== null
            ? round2(toFiniteNumber(nutriments.fat_serving))
            : null,
        saturatedFat:
          toFiniteNumber(nutriments['saturated-fat_serving']) !== null
            ? round2(toFiniteNumber(nutriments['saturated-fat_serving']))
            : null,
        fiber:
          toFiniteNumber(nutriments.fiber_serving) !== null
            ? round2(toFiniteNumber(nutriments.fiber_serving))
            : null,
        sugar:
          toFiniteNumber(nutriments.sugars_serving) !== null
            ? round2(toFiniteNumber(nutriments.sugars_serving))
            : null,
        salt:
          saltServing !== null
            ? round2(saltServing)
            : sodiumServing !== null
            ? round2(sodiumServing * 2.5)
            : null,
        sodium:
          sodiumServing !== null
            ? round2(sodiumServing)
            : saltServing !== null
            ? round2(saltServing / 2.5)
            : null,
      }
    : null;

  const isPer100g = calories100 !== null || !hasServingData;

  return {
    name: String(name).slice(0, 190),
    brand: brand || null,
    barcode,
    productQuantity: productQuantity || null,
    nutritionBasis: isPer100g ? 'PER_100G' : 'PER_SERVING',
    servingSize: isPer100g ? 100 : parsedServing.servingSize,
    servingUnit: isPer100g ? 'g' : parsedServing.servingUnit,
    servingLabel,
    calories: isPer100g ? round2(calories100 || 0) : round2(caloriesServing || 0),
    carbohydrates: isPer100g ? (per100g.carbohydrates ?? 0) : (perServing?.carbohydrates ?? 0),
    protein: isPer100g ? (per100g.protein ?? 0) : (perServing?.protein ?? 0),
    fat: isPer100g ? (per100g.fat ?? 0) : (perServing?.fat ?? 0),
    fiber: isPer100g ? (per100g.fiber ?? 0) : (perServing?.fiber ?? 0),
    sugar: isPer100g ? (per100g.sugar ?? 0) : (perServing?.sugar ?? 0),
    saturatedFat: isPer100g ? per100g.saturatedFat : perServing?.saturatedFat ?? null,
    salt: isPer100g ? per100g.salt : perServing?.salt ?? null,
    sodium: isPer100g ? per100g.sodium : perServing?.sodium ?? null,
    imageUrl,
    ingredients,
    allergens,
    per100g,
    perServing,
  };
}

const OFF_FIELDS = [
  'code',
  'product_name',
  'product_name_en',
  'generic_name',
  'brands',
  'quantity',
  'serving_size',
  'serving_quantity',
  'serving_quantity_unit',
  'image_front_small_url',
  'image_front_url',
  'image_url',
  'image_small_url',
  'image_ingredients_small_url',
  'image_ingredients_url',
  'nutriments',
  'ingredients_text',
  'ingredients_text_en',
  'allergens',
  'allergens_tags',
].join(',');

function buildCandidateUrls(barcode) {
  const encoded = encodeURIComponent(barcode);
  const candidates = [];

  const rawBase = (env.openFoodFactsBaseUrl || 'https://world.openfoodfacts.org/api/v2/product/').trim();
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

  // For Indian barcodes (prefix 890), prioritize the in.openfoodfacts.org regional mirror
  if (barcode.startsWith('890')) {
    candidates.push(`https://in.openfoodfacts.org/api/v2/product/${encoded}?fields=${OFF_FIELDS}`);
    candidates.push(`https://in.openfoodfacts.org/api/v0/product/${encoded}.json?fields=${OFF_FIELDS}`);
  }

  if (base.includes('/v0/')) {
    candidates.push(`${base}${encoded}.json?fields=${OFF_FIELDS}`);
  } else {
    candidates.push(`${base}${encoded}?fields=${OFF_FIELDS}`);
  }

  // Classic v0 endpoint fallback
  candidates.push(`https://world.openfoodfacts.org/api/v0/product/${encoded}.json?fields=${OFF_FIELDS}`);

  return [...new Set(candidates)];
}

function requestJsonWithIpv4(targetUrl, { headers = {}, timeout = 8000 } = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const transport = parsed.protocol === 'https:' ? https : http;

    const req = transport.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: 'GET',
        family: 4, // Explicitly force IPv4 to prevent IPv6 NAT64 stalls/timeouts
        headers: {
          Accept: 'application/json',
          ...headers,
        },
        timeout,
      },
      (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          try {
            const data = JSON.parse(raw);
            resolve({
              ok: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode,
              statusText: res.statusMessage,
              data,
            });
          } catch (parseErr) {
            reject(
              new Error(`Failed to parse JSON response from Open Food Facts: ${parseErr.message}`)
            );
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error(`Connection to Open Food Facts timed out after ${timeout}ms`));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

async function fetchFromOpenFoodFacts(barcode) {
  const candidates = buildCandidateUrls(barcode);
  const userAgent =
    'NutritionDietTracker - Node.js/Windows - Version 1.0 (https://github.com/nutrition-tracker; support@nutritiontracker.local)';
  let lastError = null;

  for (let i = 0; i < candidates.length; i++) {
    const url = candidates[i];
    try {
      const res = await requestJsonWithIpv4(url, {
        headers: { 'User-Agent': userAgent },
        timeout: 10000,
      });

      if (res.status === 404) {
        throw new NotFoundError(`No product found for barcode ${barcode}. Enter details manually.`);
      }

      if (!res.ok) {
        lastError = new Error(`Open Food Facts returned HTTP ${res.status}`);
        if (i < candidates.length - 1) {
          await new Promise((r) => setTimeout(r, 300));
        }
        continue;
      }

      const payload = res.data;
      if (!payload || payload.status === 0 || !payload.product) {
        throw new NotFoundError(
          `Barcode ${barcode} was not found in the local catalog or Open Food Facts.`
        );
      }

      return payload.product;
    } catch (err) {
      if (err instanceof NotFoundError) {
        throw err;
      }
      lastError = err;
      if (i < candidates.length - 1) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }
  }

  throw new BadGatewayError(
    `Unable to reach Open Food Facts service right now (${lastError?.message || 'Network timeout'}). You can still enter the nutrition details manually.`
  );
}

async function lookupBarcode(userId, rawBarcode) {
  const barcode = String(rawBarcode || '').trim();
  if (!/^[A-Za-z0-9_-]{3,100}$/.test(barcode)) {
    throw new ValidationError('Barcode must be 3 to 100 alphanumeric characters.');
  }

  const localFood = await foodModel.findByBarcodeVisible(barcode, userId);
  if (localFood) {
    return {
      found: true,
      source: 'LOCAL_CATALOG',
      food: localFood,
    };
  }

  const product = await fetchFromOpenFoodFacts(barcode);
  const extracted = extractOpenFoodFactsProduct(barcode, product);
  return {
    found: true,
    source: 'OPEN_FOOD_FACTS',
    food: extracted,
  };
}

module.exports = {
  extractOpenFoodFactsProduct,
  lookupBarcode,
};
