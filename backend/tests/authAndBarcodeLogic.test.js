const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const { extractOpenFoodFactsProduct, lookupBarcode } = require('../src/services/barcodeService');

function requestJson(server, method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: addr.port,
        path,
        method,
        headers: {
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(raw), raw });
          } catch {
            resolve({ status: res.statusCode, body: null, raw });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

test('bcrypt verifies both newly hashed passwords and Spring Boot $2a$ hashes', async () => {
  const newHash = await bcrypt.hash('StrongPass123!', 10);
  assert.equal(await bcrypt.compare('StrongPass123!', newHash), true);
  assert.equal(await bcrypt.compare('WrongPass', newHash), false);

  // Convert $2b$ prefix to $2a$ to verify cross-compatibility with existing Spring Boot BCrypt hashes
  const springCompatHash = `$2a$${newHash.slice(4)}`;
  assert.equal(await bcrypt.compare('StrongPass123!', springCompatHash), true);
});

test('extractOpenFoodFactsProduct handles energy-kcal_100g, kJ fallback, and per-serving fallback', () => {
  const per100FromKj = extractOpenFoodFactsProduct('12345678', {
    product_name: 'Oat Drink',
    brands: 'FreshCo',
    nutriments: {
      energy_100g: 418.4,
      carbohydrates_100g: 12,
      proteins_100g: 3,
      fat_100g: 2.5,
      fiber_100g: 1.5,
      sugars_100g: 4,
    },
  });

  assert.equal(per100FromKj.name, 'FreshCo - Oat Drink');
  assert.equal(per100FromKj.nutritionBasis, 'PER_100G');
  assert.equal(per100FromKj.calories, 100);

  const perServing = extractOpenFoodFactsProduct('87654321', {
    product_name: 'Protein Cookie',
    serving_quantity: 50,
    serving_quantity_unit: 'g',
    nutriments: {
      'energy-kcal_serving': 210,
      carbohydrates_serving: 20,
      proteins_serving: 16,
      fat_serving: 7,
    },
  });

  assert.equal(perServing.nutritionBasis, 'PER_SERVING');
  assert.equal(perServing.servingSize, 50);
  assert.equal(perServing.calories, 210);
  assert.equal(perServing.protein, 16);
});

test('API rejects unauthenticated protected requests, invalid registration, and never leaks secrets on /api/health', async (t) => {
  const server = app.listen(0);
  t.after(() => server.close());

  const protectedEndpoints = [
    '/api/dashboard/summary',
    '/api/foods',
    '/api/food-logs/today',
    '/api/goals',
    '/api/auth/me',
    '/api/barcode/3017620422003',
  ];

  for (const endpoint of protectedEndpoints) {
    const res = await requestJson(server, 'GET', endpoint);
    assert.equal(res.status, 401, `Expected 401 for unauthenticated ${endpoint}`);
  }

  const badTokenRes = await requestJson(server, 'GET', '/api/goals', null, {
    Authorization: 'Bearer invalid.jwt.token',
  });
  assert.equal(badTokenRes.status, 401);

  const invalidReg = await requestJson(server, 'POST', '/api/auth/register', {
    fullName: 'A',
    email: 'not-an-email',
    password: '123',
    confirmPassword: '456',
  });
  assert.equal(invalidReg.status, 400);
  assert.equal(invalidReg.body.error, 'VALIDATION_ERROR');

  const healthRes = await requestJson(server, 'GET', '/api/health');
  assert.ok([200, 503].includes(healthRes.status));
  assert.equal(healthRes.body.service, 'nutrition-tracker-api');
  assert.ok(healthRes.body.database);
  assert.equal('password' in healthRes.body.database, false);
  assert.equal(healthRes.raw.includes('JWT_SECRET'), false);
});

test('lookupBarcode successfully retrieves product details for 8901725007102 and 3017620422003', async () => {
  const resultBingo = await lookupBarcode(1, '8901725007102');
  assert.equal(resultBingo.found, true);
  assert.equal(resultBingo.food.barcode, '8901725007102');
  assert.ok(resultBingo.food.name.toLowerCase().includes('bingo'));
  assert.equal(resultBingo.food.calories, 531);
  assert.equal(resultBingo.food.protein, 7.1);
  assert.equal(resultBingo.food.carbohydrates, 50.5);
  assert.equal(resultBingo.food.fat, 33.4);
  assert.ok(resultBingo.food.ingredients);
  assert.ok(resultBingo.food.allergens);

  const resultNutella = await lookupBarcode(1, '3017620422003');
  assert.equal(resultNutella.found, true);
  assert.equal(resultNutella.food.barcode, '3017620422003');
  assert.ok(resultNutella.food.name.toLowerCase().includes('nutella'));
  assert.equal(resultNutella.food.calories, 539);

  await assert.rejects(
    async () => lookupBarcode(1, '0000000000000'),
    { name: 'NotFoundError' }
  );

  await assert.rejects(
    async () => lookupBarcode(1, '!!'),
    { name: 'ValidationError' }
  );
});
