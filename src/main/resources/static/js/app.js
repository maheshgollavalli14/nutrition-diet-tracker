/**
 * Nutrition & Diet Tracker - Frontend Application
 * Vanilla JavaScript Single Page Application
 */

const API_BASE = '/api';

// Global Application State
const state = {
    currentUser: null,
    currentGoal: null,
    currentDate: new Date().toISOString().split('T')[0],
    activeView: 'dashboard',
    weeklyChart: null,
    macroChart: null,
    historyChart: null,
    codeReader: null,
    isScanning: false,
    selectedFoodForLog: null,
    scannedProduct: null,
    currentSearchResults: []
};

// Helper: Read CSRF cookie
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Wrapper for fetch requests with automatic CSRF token & credentials
async function apiFetch(url, options = {}) {
    const opts = Object.assign({ credentials: 'same-origin' }, options);
    opts.headers = Object.assign({}, options.headers);

    const method = (opts.method || 'GET').toUpperCase();
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        let csrfToken = getCookie('XSRF-TOKEN');
        if (!csrfToken) {
            try {
                const csrfResp = await fetch(`${API_BASE}/auth/csrf`, { credentials: 'same-origin' });
                if (csrfResp.ok) {
                    const data = await csrfResp.json();
                    csrfToken = data.token;
                }
            } catch (e) {
                // Ignore fallback
            }
        }
        if (csrfToken) {
            opts.headers['X-XSRF-TOKEN'] = csrfToken;
        }
        if (opts.body && typeof opts.body === 'string' && !opts.headers['Content-Type']) {
            opts.headers['Content-Type'] = 'application/json';
        }
    }

    return fetch(url, opts);
}

// DOM Content Loaded - Initialization
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initAuthForms();
    initEditLogModal();
    checkAuthSession();
});

// Toast notification helper
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';
    if (type === 'danger') icon = '❌';

    toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4500);
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.innerText = String(text);
    return div.innerHTML;
}

// Navigation & View Routing
function initNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link, .action-card-btn[data-target]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const target = link.getAttribute('data-target') || link.getAttribute('href')?.replace('#', '');
            if (!target) return;
            e.preventDefault();

            if (target === 'logout') {
                handleLogout();
                return;
            }

            switchView(target);

            // Close mobile sidebar if open
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.remove('open');
        });
    });

    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.toggle('open');
        });
    }
}

function switchView(viewName) {
    state.activeView = viewName;

    // Stop barcode scanner camera if moving away from scanner
    if (viewName !== 'scan-barcode' && state.isScanning) {
        stopBarcodeScanner();
    }

    // Update active nav link
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
        if (link.getAttribute('data-target') === viewName) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Hide all views, show targeted view
    document.querySelectorAll('.view-section').forEach(view => {
        view.style.display = 'none';
    });

    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
        targetSection.style.display = 'block';
    }

    // Load data for the active view
    switch (viewName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'food-diary':
            loadDiaryData(state.currentDate);
            break;
        case 'add-food':
            initAddFoodView();
            break;
        case 'scan-barcode':
            initBarcodeScannerView();
            break;
        case 'history':
            loadHistoryData();
            break;
        case 'goals':
            loadGoalsView();
            break;
        case 'food-database':
            loadFoodDatabase();
            break;
        case 'profile':
            loadProfileView();
            break;
    }
}

// Authentication Handlers
async function checkAuthSession() {
    try {
        const resp = await apiFetch(`${API_BASE}/auth/me`);
        if (resp.ok) {
            state.currentUser = await resp.json();
            updateUserUI();
            closeAuthModal();
            switchView('dashboard');
        } else {
            openAuthModal();
        }
    } catch (err) {
        console.warn('Authentication check failed:', err);
        openAuthModal();
    }
}

function openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('active');
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('active');
}

function initAuthForms() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const toggleToRegister = document.getElementById('toggle-to-register');
    const toggleToLogin = document.getElementById('toggle-to-login');

    if (toggleToRegister) {
        toggleToRegister.addEventListener('click', () => {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        });
    }

    if (toggleToLogin) {
        toggleToLogin.addEventListener('click', () => {
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('login-submit-btn');
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            if (!email || !password) {
                showToast('Please enter both email and password.', 'warning');
                return;
            }

            if (submitBtn) submitBtn.disabled = true;

            try {
                const resp = await apiFetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });

                if (resp.ok) {
                    state.currentUser = await resp.json();
                    updateUserUI();
                    closeAuthModal();
                    showToast('Successfully signed in!', 'success');
                    switchView('dashboard');
                } else {
                    const err = await resp.json();
                    showToast(err.message || 'Invalid credentials. Please try again.', 'danger');
                }
            } catch (error) {
                showToast('Unable to connect to server. Ensure MySQL is running on port 3307.', 'danger');
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('reg-submit-btn');
            const fullName = document.getElementById('reg-fullname').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password')?.value;
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

            if (!fullName || !email || !password) {
                showToast('Please fill in all required fields.', 'warning');
                return;
            }

            if (password !== confirmPassword) {
                showToast('Passwords do not match. Please verify your password.', 'warning');
                return;
            }

            if (password.length < 6) {
                showToast('Password must be at least 6 characters long.', 'warning');
                return;
            }

            if (submitBtn) submitBtn.disabled = true;

            try {
                const resp = await apiFetch(`${API_BASE}/auth/register`, {
                    method: 'POST',
                    body: JSON.stringify({ fullName, email, password, confirmPassword, timezone })
                });

                if (resp.ok) {
                    showToast('Account created successfully! Please log in with your credentials.', 'success');
                    registerForm.reset();
                    registerForm.style.display = 'none';
                    loginForm.style.display = 'block';
                    document.getElementById('login-email').value = email;
                } else {
                    const err = await resp.json();
                    showToast(err.message || 'Registration failed. Email may already be registered.', 'danger');
                }
            } catch (error) {
                showToast('Unable to reach server. Please check your network.', 'danger');
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }
}

async function handleLogout() {
    try {
        await apiFetch(`${API_BASE}/auth/logout`, { method: 'POST' });
    } catch (e) {
        // ignore
    }
    state.currentUser = null;
    showToast('You have been logged out.', 'info');
    openAuthModal();
}

function updateUserUI() {
    if (!state.currentUser) return;
    const userNameElements = document.querySelectorAll('.current-user-name');
    const userEmailElements = document.querySelectorAll('.current-user-email');
    const userAvatarElements = document.querySelectorAll('.user-avatar');

    const name = state.currentUser.fullName || 'User';
    const email = state.currentUser.email || '';
    const initial = name.charAt(0).toUpperCase();

    userNameElements.forEach(el => el.textContent = name);
    userEmailElements.forEach(el => el.textContent = email);
    userAvatarElements.forEach(el => el.textContent = initial);

    const tzBadge = document.getElementById('timezone-badge');
    if (tzBadge) {
        tzBadge.textContent = state.currentUser.timezone || 'UTC';
    }
}

// DASHBOARD VIEW
async function loadDashboardData() {
    const today = new Date();
    const dateFormatted = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const headerDate = document.getElementById('dashboard-header-date');
    if (headerDate) headerDate.textContent = dateFormatted;

    try {
        const [dailyResp, weeklyResp] = await Promise.all([
            apiFetch(`${API_BASE}/summary/daily?date=${state.currentDate}`),
            apiFetch(`${API_BASE}/summary/weekly?endDate=${state.currentDate}`)
        ]);

        if (dailyResp.ok) {
            const dailyData = await dailyResp.json();
            renderDashboardMetrics(dailyData);
            renderMacroChart(dailyData);
            renderRecentLogsTable(dailyData.logs);
        }

        if (weeklyResp.ok) {
            const weeklyData = await weeklyResp.json();
            renderWeeklyChart(weeklyData);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function renderDashboardMetrics(dailyData) {
    const consumed = Number(dailyData.totalCalories) || 0;
    const goal = Number(dailyData.calorieGoal) || 2000;
    const remaining = Number(dailyData.remainingCalories) || (goal - consumed);
    const pct = goal > 0 ? Math.min(Math.round((consumed / goal) * 100), 100) : 0;

    // Calories Card
    const consumedEl = document.getElementById('dash-consumed-calories');
    const goalEl = document.getElementById('dash-goal-calories');
    const fillEl = document.getElementById('dash-calorie-progress-fill');
    const remEl = document.getElementById('dash-remaining-calories');
    const pctEl = document.getElementById('dash-percent-goal');

    if (consumedEl) consumedEl.textContent = consumed.toFixed(0);
    if (goalEl) goalEl.textContent = goal.toFixed(0);
    if (fillEl) fillEl.style.width = `${pct}%`;
    if (pctEl) pctEl.textContent = `${pct}%`;

    if (remEl) {
        if (remaining >= 0) {
            remEl.textContent = `${remaining.toFixed(0)} kcal remaining`;
            remEl.style.color = 'var(--text-primary)';
        } else {
            remEl.textContent = `${Math.abs(remaining).toFixed(0)} kcal over goal`;
            remEl.style.color = '#dc2626';
        }
    }

    // Calorie Goal Alert Banner
    const alertBanner = document.getElementById('dash-calorie-alert');
    if (alertBanner) {
        if (dailyData.goalExceeded) {
            alertBanner.style.display = 'block';
            alertBanner.innerHTML = `⚠️ <strong>Daily Goal Exceeded:</strong> You have consumed ${consumed.toFixed(0)} kcal (${Math.abs(remaining).toFixed(0)} kcal over your ${goal.toFixed(0)} kcal target).`;
        } else {
            alertBanner.style.display = 'none';
        }
    }

    // Carbs
    const carbs = Number(dailyData.totalCarbs) || 0;
    const carbsGoal = Number(dailyData.carbsGoal) || 250;
    const carbsPct = carbsGoal > 0 ? Math.min(Math.round((carbs / carbsGoal) * 100), 100) : 0;
    document.getElementById('dash-carb-val').textContent = `${carbs.toFixed(1)}g`;
    document.getElementById('dash-carb-goal').textContent = `${carbsGoal.toFixed(0)}`;
    document.getElementById('dash-carb-fill').style.width = `${carbsPct}%`;

    // Protein
    const protein = Number(dailyData.totalProtein) || 0;
    const proteinGoal = Number(dailyData.proteinGoal) || 150;
    const proteinPct = proteinGoal > 0 ? Math.min(Math.round((protein / proteinGoal) * 100), 100) : 0;
    document.getElementById('dash-prot-val').textContent = `${protein.toFixed(1)}g`;
    document.getElementById('dash-prot-goal').textContent = `${proteinGoal.toFixed(0)}`;
    document.getElementById('dash-prot-fill').style.width = `${proteinPct}%`;

    // Fat
    const fat = Number(dailyData.totalFat) || 0;
    const fatGoal = Number(dailyData.fatGoal) || 65;
    const fatPct = fatGoal > 0 ? Math.min(Math.round((fat / fatGoal) * 100), 100) : 0;
    document.getElementById('dash-fat-val').textContent = `${fat.toFixed(1)}g`;
    document.getElementById('dash-fat-goal').textContent = `${fatGoal.toFixed(0)}`;
    document.getElementById('dash-fat-fill').style.width = `${fatPct}%`;
}

function renderWeeklyChart(weeklyData) {
    const ctx = document.getElementById('weeklyCalorieChart');
    if (!ctx) return;

    if (state.weeklyChart) {
        state.weeklyChart.destroy();
    }

    const labels = (weeklyData.dailyTotals || []).map(d => {
        const parts = d.date.split('-');
        return `${parts[1]}/${parts[2]}`;
    });
    const calorieValues = (weeklyData.dailyTotals || []).map(d => Number(d.calories));
    const goalLine = (weeklyData.dailyTotals || []).map(() => Number(weeklyData.targetCalories) || 2000);

    state.weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length > 0 ? labels : ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Today'],
            datasets: [
                {
                    label: 'Consumed (kcal)',
                    data: calorieValues.length > 0 ? calorieValues : [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: '#2d6a4f',
                    borderRadius: 6,
                    barPercentage: 0.6
                },
                {
                    type: 'line',
                    label: 'Daily Target',
                    data: goalLine.length > 0 ? goalLine : [2000, 2000, 2000, 2000, 2000, 2000, 2000],
                    borderColor: '#f59e0b',
                    borderWidth: 2,
                    borderDash: [4, 4],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: val => `${val} kcal`
                    }
                }
            }
        }
    });
}

function renderMacroChart(dailyData) {
    const ctx = document.getElementById('macroBreakdownChart');
    if (!ctx) return;

    if (state.macroChart) {
        state.macroChart.destroy();
    }

    const carbs = Number(dailyData.totalCarbs) || 0;
    const protein = Number(dailyData.totalProtein) || 0;
    const fat = Number(dailyData.totalFat) || 0;
    const hasData = (carbs + protein + fat) > 0;

    state.macroChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: hasData ? ['Carbohydrates', 'Protein', 'Fat'] : ['No entries yet'],
            datasets: [{
                data: hasData ? [carbs, protein, fat] : [1],
                backgroundColor: hasData
                    ? ['#38bdf8', '#34d399', '#fbbf24']
                    : ['#e2e8f0'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { boxWidth: 12, padding: 14 }
                }
            }
        }
    });
}

function renderRecentLogsTable(logs) {
    const tbody = document.getElementById('recent-logs-tbody');
    if (!tbody) return;

    if (!logs || logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#64748b; padding:24px;">No food entries logged today. Click "Add Food" to log your first meal!</td></tr>`;
        return;
    }

    tbody.innerHTML = logs.slice(0, 5).map(l => {
        const timeStr = new Date(l.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `
            <tr>
                <td><strong>${timeStr}</strong></td>
                <td><strong>${escapeHtml(l.foodName)}</strong></td>
                <td>${Number(l.consumedQuantity).toFixed(1)} ${escapeHtml(l.servingUnit)}</td>
                <td><strong style="color:var(--primary);">${Number(l.calories).toFixed(0)} kcal</strong></td>
                <td>${Number(l.carbohydrates).toFixed(1)}g</td>
                <td>${Number(l.protein).toFixed(1)}g</td>
                <td>${Number(l.fat).toFixed(1)}g</td>
            </tr>
        `;
    }).join('');
}

// ADD FOOD VIEW
function initAddFoodView() {
    const searchInput = document.getElementById('food-search-input');
    const customFoodToggle = document.getElementById('toggle-custom-food');
    const customFoodDiv = document.getElementById('custom-food-form');
    const customFoodForm = document.getElementById('create-custom-food-form');
    const logFoodForm = document.getElementById('log-food-form');

    // Default timestamp to current local time
    const timeInput = document.getElementById('add-food-time');
    if (timeInput) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        timeInput.value = now.toISOString().slice(0, 16);
    }

    if (customFoodToggle && customFoodDiv) {
        customFoodToggle.onclick = () => {
            const isHidden = customFoodDiv.style.display === 'none';
            customFoodDiv.style.display = isHidden ? 'block' : 'none';
            customFoodToggle.textContent = isHidden ? '← Hide Custom Food Form' : '+ Or Create New Custom Food';
        };
    }

    let debounceTimer;
    if (searchInput) {
        searchInput.oninput = () => {
            clearTimeout(debounceTimer);
            const query = searchInput.value.trim();
            debounceTimer = setTimeout(() => searchFoodCatalog(query), 250);
        };
        // Initial search load
        searchFoodCatalog('');
    }

    // Attach listeners for live preview calculation
    ['add-food-qty', 'add-food-unit', 'add-food-cal', 'add-food-carb', 'add-food-prot', 'add-food-fat'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.oninput = updateNutritionPreview;
    });

    if (logFoodForm) {
        logFoodForm.onsubmit = handleLogFoodSubmission;
    }

    if (customFoodForm) {
        customFoodForm.onsubmit = handleCreateCustomFood;
    }
}

async function searchFoodCatalog(keyword) {
    const resultsContainer = document.getElementById('food-search-results');
    if (!resultsContainer) return;

    try {
        const resp = await apiFetch(`${API_BASE}/foods/search?q=${encodeURIComponent(keyword)}`);
        if (!resp.ok) return;
        const foods = await resp.json();
        state.currentSearchResults = foods;

        if (foods.length === 0) {
            resultsContainer.innerHTML = `<div style="padding:14px; color:#64748b;">No catalog items match "${escapeHtml(keyword)}". You can type details directly into the form or create a custom food!</div>`;
            return;
        }

        resultsContainer.innerHTML = '';
        foods.forEach((f, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'card';
            itemDiv.style.cssText = 'padding:12px 16px; margin-bottom:8px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition:background 0.15s ease;';
            itemDiv.innerHTML = `
                <div>
                    <strong style="font-size:1.02rem; color:var(--primary-dark);">${escapeHtml(f.name)}</strong>
                    <div style="font-size:0.83rem; color:var(--text-muted); margin-top:3px;">
                        Basis: ${f.nutritionBasis === 'PER_100G' ? 'Per 100g' : `Per Serving (${f.servingSize} ${escapeHtml(f.servingUnit)})`} •
                        <span style="color:#2d6a4f; font-weight:600;">${Number(f.calories).toFixed(0)} kcal</span> •
                        C: ${Number(f.carbohydrates).toFixed(1)}g | P: ${Number(f.protein).toFixed(1)}g | F: ${Number(f.fat).toFixed(1)}g
                    </div>
                </div>
                <button type="button" class="btn btn-outline" style="min-height:34px; padding:4px 12px; font-size:0.85rem;">Select</button>
            `;
            itemDiv.onclick = () => selectFoodFromCatalog(index);
            resultsContainer.appendChild(itemDiv);
        });
    } catch (e) {
        console.error('Food search error:', e);
    }
}

function selectFoodFromCatalog(index) {
    const food = state.currentSearchResults[index];
    if (!food) return;

    state.selectedFoodForLog = food;

    const selectedBox = document.getElementById('selected-food-box');
    const selectedTitle = document.getElementById('selected-food-title');
    const nameInput = document.getElementById('add-food-name');
    const unitInput = document.getElementById('add-food-unit');
    const qtyInput = document.getElementById('add-food-qty');
    const calInput = document.getElementById('add-food-cal');
    const carbInput = document.getElementById('add-food-carb');
    const protInput = document.getElementById('add-food-prot');
    const fatInput = document.getElementById('add-food-fat');

    if (selectedBox) selectedBox.style.display = 'block';
    if (selectedTitle) selectedTitle.textContent = food.name;
    if (nameInput) nameInput.value = food.name;
    if (unitInput) unitInput.value = food.servingUnit || 'g';
    if (qtyInput) qtyInput.value = food.nutritionBasis === 'PER_100G' ? '100' : (food.servingSize || '1');
    if (calInput) calInput.value = Number(food.calories).toFixed(0);
    if (carbInput) carbInput.value = Number(food.carbohydrates).toFixed(1);
    if (protInput) protInput.value = Number(food.protein).toFixed(1);
    if (fatInput) fatInput.value = Number(food.fat).toFixed(1);

    updateNutritionPreview();
    showToast(`Loaded "${food.name}". Adjust consumed quantity or click Save.`, 'info');
}

function updateNutritionPreview() {
    const qty = parseFloat(document.getElementById('add-food-qty')?.value) || 0;
    const unit = (document.getElementById('add-food-unit')?.value || 'g').trim();
    const baseCal = parseFloat(document.getElementById('add-food-cal')?.value) || 0;
    const baseCarb = parseFloat(document.getElementById('add-food-carb')?.value) || 0;
    const baseProt = parseFloat(document.getElementById('add-food-prot')?.value) || 0;
    const baseFat = parseFloat(document.getElementById('add-food-fat')?.value) || 0;

    let factor = 1.0;
    if (unit.toLowerCase() === 'g' || unit.toLowerCase() === 'ml') {
        factor = qty / 100.0;
    } else {
        const servingSize = state.selectedFoodForLog?.servingSize || 1;
        factor = servingSize > 0 ? (qty / servingSize) : qty;
    }

    const prevCal = document.getElementById('preview-cal');
    const prevCarb = document.getElementById('preview-carb');
    const prevProt = document.getElementById('preview-prot');
    const prevFat = document.getElementById('preview-fat');

    if (prevCal) prevCal.textContent = (baseCal * factor).toFixed(0);
    if (prevCarb) prevCarb.textContent = `${(baseCarb * factor).toFixed(1)}g`;
    if (prevProt) prevProt.textContent = `${(baseProt * factor).toFixed(1)}g`;
    if (prevFat) prevFat.textContent = `${(baseFat * factor).toFixed(1)}g`;
}

async function handleLogFoodSubmission(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('add-food-submit-btn');

    const foodName = document.getElementById('add-food-name')?.value.trim();
    const qty = parseFloat(document.getElementById('add-food-qty')?.value);
    const unit = (document.getElementById('add-food-unit')?.value || 'g').trim();
    const baseCal = parseFloat(document.getElementById('add-food-cal')?.value);
    const baseCarb = parseFloat(document.getElementById('add-food-carb')?.value) || 0;
    const baseProt = parseFloat(document.getElementById('add-food-prot')?.value) || 0;
    const baseFat = parseFloat(document.getElementById('add-food-fat')?.value) || 0;
    const timeVal = document.getElementById('add-food-time')?.value;

    if (!foodName) {
        showToast('Please enter a food name.', 'warning');
        return;
    }

    if (!qty || qty <= 0) {
        showToast('Consumed quantity must be greater than zero.', 'warning');
        return;
    }

    if (isNaN(baseCal) || baseCal < 0) {
        showToast('Please enter valid calories.', 'warning');
        return;
    }

    const is100gBasis = (unit.toLowerCase() === 'g' || unit.toLowerCase() === 'ml');
    const basis = state.selectedFoodForLog?.nutritionBasis || (is100gBasis ? 'PER_100G' : 'PER_SERVING');
    const servingSize = state.selectedFoodForLog?.servingSize || (is100gBasis ? 100 : 1);

    const payload = {
        foodId: (state.selectedFoodForLog && state.selectedFoodForLog.name === foodName) ? state.selectedFoodForLog.id : null,
        foodName: foodName,
        consumedQuantity: qty,
        servingUnit: unit,
        nutritionBasis: basis,
        servingSize: servingSize,
        calories: baseCal,
        carbohydrates: baseCarb,
        protein: baseProt,
        fat: baseFat,
        loggedAt: timeVal ? new Date(timeVal).toISOString() : new Date().toISOString()
    };

    if (submitBtn) submitBtn.disabled = true;

    try {
        const resp = await apiFetch(`${API_BASE}/logs`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (resp.ok) {
            showToast(`Logged "${foodName}" successfully!`, 'success');
            state.selectedFoodForLog = null;
            const box = document.getElementById('selected-food-box');
            if (box) box.style.display = 'none';
            document.getElementById('log-food-form').reset();
            switchView('food-diary');
        } else {
            const err = await resp.json();
            showToast(err.message || 'Failed to save food log.', 'danger');
        }
    } catch (e) {
        showToast('Network error while saving log.', 'danger');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

async function handleCreateCustomFood(e) {
    e.preventDefault();
    const name = document.getElementById('custom-food-name').value.trim();
    const barcode = document.getElementById('custom-food-barcode').value.trim();
    const unit = document.getElementById('custom-food-unit').value.trim();
    const basis = document.getElementById('custom-food-basis').value;
    const servingSize = parseFloat(document.getElementById('custom-food-size').value) || 100;
    const calories = parseFloat(document.getElementById('custom-food-cal').value) || 0;
    const carbs = parseFloat(document.getElementById('custom-food-carb').value) || 0;
    const protein = parseFloat(document.getElementById('custom-food-prot').value) || 0;
    const fat = parseFloat(document.getElementById('custom-food-fat').value) || 0;
    const fiber = parseFloat(document.getElementById('custom-food-fiber').value) || 0;
    const sugar = parseFloat(document.getElementById('custom-food-sugar').value) || 0;

    const payload = {
        name, barcode: barcode || null, servingUnit: unit, nutritionBasis: basis,
        servingSize, calories, carbohydrates: carbs, protein, fat, fiber, sugar
    };

    try {
        const resp = await apiFetch(`${API_BASE}/foods`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (resp.ok) {
            const created = await resp.json();
            showToast(`Custom food "${name}" saved to catalog!`, 'success');
            document.getElementById('create-custom-food-form').reset();
            document.getElementById('custom-food-form').style.display = 'none';
            document.getElementById('toggle-custom-food').textContent = '+ Or Create New Custom Food';

            state.currentSearchResults = [created];
            selectFoodFromCatalog(0);
        } else {
            const err = await resp.json();
            showToast(err.message || 'Failed to create custom food.', 'danger');
        }
    } catch (e) {
        showToast('Error saving custom food.', 'danger');
    }
}

// BARCODE SCANNING
function initBarcodeScannerView() {
    const startBtn = document.getElementById('start-scanner-btn');
    const stopBtn = document.getElementById('stop-scanner-btn');
    const manualLookupBtn = document.getElementById('manual-barcode-btn');
    const scannedForm = document.getElementById('scanned-product-form');

    if (startBtn) startBtn.onclick = startBarcodeScanner;
    if (stopBtn) stopBtn.onclick = stopBarcodeScanner;
    if (manualLookupBtn) manualLookupBtn.onclick = handleManualBarcodeLookup;
    if (scannedForm) scannedForm.onsubmit = handleLogScannedProduct;

    ['scanned-product-qty', 'scanned-cal-input', 'scanned-carb-input', 'scanned-prot-input', 'scanned-fat-input'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.oninput = updateScannedProductPreview;
    });
}

async function startBarcodeScanner() {
    const errorBox = document.getElementById('scanner-error-message');
    if (errorBox) errorBox.style.display = 'none';

    // Verify browser support for media devices
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (errorBox) {
            errorBox.style.display = 'block';
            errorBox.innerHTML = `
                <strong>Camera Access Unsupported:</strong> Camera access requires a secure origin (localhost or HTTPS).<br>
                <em>Please use the manual barcode lookup below to fetch Open Food Facts nutrition data.</em>
            `;
        }
        showToast('Camera unsupported or non-secure origin. Use manual barcode lookup.', 'warning');
        return;
    }

    if (!window.ZXing) {
        showToast('Barcode scanner library is loading. Please wait a moment...', 'warning');
        return;
    }

    try {
        state.codeReader = new ZXing.BrowserMultiFormatReader();
        const videoInputDevices = await state.codeReader.listVideoInputDevices();

        const cameraSelect = document.getElementById('camera-select');
        if (cameraSelect) {
            cameraSelect.innerHTML = videoInputDevices.map((d, i) =>
                `<option value="${d.deviceId}">${d.label || `Camera ${i + 1}`}</option>`
            ).join('');
            cameraSelect.style.display = videoInputDevices.length > 1 ? 'block' : 'none';
        }

        const selectedDeviceId = cameraSelect?.value || videoInputDevices[0]?.deviceId;

        state.isScanning = true;
        document.getElementById('start-scanner-btn').style.display = 'none';
        document.getElementById('stop-scanner-btn').style.display = 'inline-flex';

        state.codeReader.decodeFromVideoDevice(selectedDeviceId, 'barcode-video', (result, err) => {
            if (result) {
                const barcode = result.getText();
                showToast(`Barcode detected: ${barcode}`, 'success');
                stopBarcodeScanner();
                lookupBarcode(barcode);
            }
        });
    } catch (err) {
        console.error('Camera access error:', err);
        stopBarcodeScanner();
        if (errorBox) {
            errorBox.style.display = 'block';
            errorBox.innerHTML = `
                <strong>Camera Access Issue:</strong> ${escapeHtml(err.message || 'Unable to access webcam.')}<br>
                <em>Note: Modern web browsers require localhost or HTTPS to grant camera permissions. You can also use the manual barcode lookup below.</em>
            `;
        }
        showToast('Unable to access camera. Please enter barcode manually.', 'warning');
    }
}

function stopBarcodeScanner() {
    if (state.codeReader) {
        try {
            state.codeReader.reset();
        } catch (e) {
            // ignore
        }
        state.codeReader = null;
    }

    // Explicitly release camera hardware tracks on video element
    const video = document.getElementById('barcode-video');
    if (video && video.srcObject) {
        try {
            const stream = video.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            video.srcObject = null;
        } catch (e) {
            // ignore
        }
    }

    state.isScanning = false;
    const startBtn = document.getElementById('start-scanner-btn');
    const stopBtn = document.getElementById('stop-scanner-btn');
    if (startBtn) startBtn.style.display = 'inline-flex';
    if (stopBtn) stopBtn.style.display = 'none';
}

async function handleManualBarcodeLookup() {
    const barcodeInput = document.getElementById('manual-barcode-input');
    const barcode = barcodeInput?.value.trim();
    if (!barcode) {
        showToast('Please enter a barcode number.', 'warning');
        return;
    }
    lookupBarcode(barcode);
}

async function lookupBarcode(barcode) {
    const card = document.getElementById('scanned-product-card');
    const errorBox = document.getElementById('scanner-error-message');
    if (errorBox) errorBox.style.display = 'none';

    showToast(`Looking up barcode: ${barcode}...`, 'info');

    try {
        const resp = await apiFetch(`${API_BASE}/barcode/${encodeURIComponent(barcode)}`);
        if (!resp.ok) {
            showToast('Failed to contact barcode lookup service.', 'danger');
            return;
        }

        const product = await resp.json();
        if (!product.found) {
            if (errorBox) {
                errorBox.style.display = 'block';
                errorBox.innerHTML = `
                    <strong>Product Not Found:</strong> ${escapeHtml(product.message || 'No product found for barcode ' + barcode)}.<br>
                    <button type="button" class="btn btn-primary" style="margin-top:10px;" onclick="switchView('add-food')">Enter Food Manually</button>
                `;
            }
            showToast(product.message || 'Product not found in Open Food Facts.', 'warning');
            if (card) card.style.display = 'none';
            return;
        }

        state.scannedProduct = product;
        renderScannedProduct(product);
    } catch (e) {
        showToast('Network error during barcode lookup.', 'danger');
    }
}

function renderScannedProduct(product) {
    const card = document.getElementById('scanned-product-card');
    if (!card) return;

    card.style.display = 'block';
    document.getElementById('scanned-title').textContent = product.productName;
    document.getElementById('scanned-brand').textContent = product.brands ? `Brand: ${product.brands}` : '';
    document.getElementById('scanned-basis-desc').textContent = `Nutrition basis: ${product.servingSize || 100} ${product.servingUnit || 'g'}`;

    const img = document.getElementById('scanned-image');
    if (img) {
        if (product.imageUrl) {
            img.src = product.imageUrl;
            img.style.display = 'block';
        } else {
            img.style.display = 'none';
        }
    }

    document.getElementById('scanned-name-input').value = product.productName || '';
    document.getElementById('scanned-product-qty').value = '100';
    document.getElementById('scanned-unit-input').value = product.servingUnit || 'g';
    document.getElementById('scanned-cal-input').value = Number(product.calories || 0).toFixed(0);
    document.getElementById('scanned-carb-input').value = Number(product.carbohydrates || 0).toFixed(1);
    document.getElementById('scanned-prot-input').value = Number(product.protein || 0).toFixed(1);
    document.getElementById('scanned-fat-input').value = Number(product.fat || 0).toFixed(1);

    updateScannedProductPreview();
}

function updateScannedProductPreview() {
    const qty = parseFloat(document.getElementById('scanned-product-qty')?.value) || 0;
    const baseCal = parseFloat(document.getElementById('scanned-cal-input')?.value) || 0;
    const baseCarb = parseFloat(document.getElementById('scanned-carb-input')?.value) || 0;
    const baseProt = parseFloat(document.getElementById('scanned-prot-input')?.value) || 0;
    const baseFat = parseFloat(document.getElementById('scanned-fat-input')?.value) || 0;

    const factor = qty / 100.0;

    document.getElementById('scanned-calc-cal').textContent = (baseCal * factor).toFixed(0);
    document.getElementById('scanned-calc-carb').textContent = `${(baseCarb * factor).toFixed(1)}g`;
    document.getElementById('scanned-calc-prot').textContent = `${(baseProt * factor).toFixed(1)}g`;
    document.getElementById('scanned-calc-fat').textContent = `${(baseFat * factor).toFixed(1)}g`;
}

async function handleLogScannedProduct(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('log-scanned-product-btn');

    const foodName = document.getElementById('scanned-name-input')?.value.trim();
    const qty = parseFloat(document.getElementById('scanned-product-qty')?.value);
    const unit = (document.getElementById('scanned-unit-input')?.value || 'g').trim();
    const baseCal = parseFloat(document.getElementById('scanned-cal-input')?.value) || 0;
    const baseCarb = parseFloat(document.getElementById('scanned-carb-input')?.value) || 0;
    const baseProt = parseFloat(document.getElementById('scanned-prot-input')?.value) || 0;
    const baseFat = parseFloat(document.getElementById('scanned-fat-input')?.value) || 0;

    if (!foodName || !qty || qty <= 0) {
        showToast('Please verify food name and quantity.', 'warning');
        return;
    }

    const payload = {
        foodName: foodName,
        consumedQuantity: qty,
        servingUnit: unit,
        nutritionBasis: 'PER_100G',
        servingSize: 100,
        calories: baseCal,
        carbohydrates: baseCarb,
        protein: baseProt,
        fat: baseFat,
        loggedAt: new Date().toISOString()
    };

    if (submitBtn) submitBtn.disabled = true;

    try {
        const resp = await apiFetch(`${API_BASE}/logs`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (resp.ok) {
            showToast(`Logged "${foodName}" successfully!`, 'success');
            state.scannedProduct = null;
            document.getElementById('scanned-product-card').style.display = 'none';
            switchView('food-diary');
        } else {
            const err = await resp.json();
            showToast(err.message || 'Failed to save scanned food log.', 'danger');
        }
    } catch (e) {
        showToast('Network error while saving log.', 'danger');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

// FOOD DIARY VIEW & EDIT MODAL
function initEditLogModal() {
    const editForm = document.getElementById('edit-log-form');
    if (editForm) {
        editForm.onsubmit = handleUpdateFoodLog;
    }
}

function openEditLogModal(id, foodName, qty, unit, loggedAt) {
    const modal = document.getElementById('edit-log-modal');
    if (!modal) return;

    document.getElementById('edit-log-id').value = id;
    document.getElementById('edit-log-food-name').value = foodName;
    document.getElementById('edit-log-qty').value = qty;
    document.getElementById('edit-log-unit').value = unit;

    const dateObj = new Date(loggedAt);
    dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
    document.getElementById('edit-log-time').value = dateObj.toISOString().slice(0, 16);

    modal.classList.add('active');
}

function closeEditLogModal() {
    const modal = document.getElementById('edit-log-modal');
    if (modal) modal.classList.remove('active');
}

async function handleUpdateFoodLog(e) {
    e.preventDefault();
    const id = document.getElementById('edit-log-id').value;
    const qty = parseFloat(document.getElementById('edit-log-qty').value);
    const unit = document.getElementById('edit-log-unit').value.trim();
    const timeVal = document.getElementById('edit-log-time').value;

    if (!qty || qty <= 0) {
        showToast('Quantity must be greater than zero.', 'warning');
        return;
    }

    const payload = {
        consumedQuantity: qty,
        servingUnit: unit,
        loggedAt: timeVal ? new Date(timeVal).toISOString() : new Date().toISOString()
    };

    const submitBtn = document.getElementById('edit-log-submit-btn');
    if (submitBtn) submitBtn.disabled = true;

    try {
        const resp = await apiFetch(`${API_BASE}/logs/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        if (resp.ok) {
            closeEditLogModal();
            showToast('Food entry updated successfully!', 'success');
            loadDiaryData(state.currentDate);
        } else {
            const err = await resp.json();
            showToast(err.message || 'Failed to update entry.', 'danger');
        }
    } catch (e) {
        showToast('Network error while updating entry.', 'danger');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

async function loadDiaryData(date) {
    state.currentDate = date;
    const dateInput = document.getElementById('diary-date-picker');
    if (dateInput) dateInput.value = date;

    const prevBtn = document.getElementById('diary-prev-day-btn');
    const nextBtn = document.getElementById('diary-next-day-btn');
    const todayBtn = document.getElementById('diary-today-btn');

    if (prevBtn) prevBtn.onclick = () => {
        const d = new Date(state.currentDate);
        d.setDate(d.getDate() - 1);
        loadDiaryData(d.toISOString().split('T')[0]);
    };

    if (nextBtn) nextBtn.onclick = () => {
        const d = new Date(state.currentDate);
        d.setDate(d.getDate() + 1);
        loadDiaryData(d.toISOString().split('T')[0]);
    };

    if (todayBtn) todayBtn.onclick = () => {
        loadDiaryData(new Date().toISOString().split('T')[0]);
    };

    if (dateInput) dateInput.onchange = (e) => {
        loadDiaryData(e.target.value);
    };

    try {
        const resp = await apiFetch(`${API_BASE}/summary/daily?date=${date}`);
        if (!resp.ok) return;
        const data = await resp.json();

        // Render summary pill
        document.getElementById('diary-sum-cal').textContent = `${Number(data.totalCalories).toFixed(0)} kcal`;
        document.getElementById('diary-sum-carb').textContent = `${Number(data.totalCarbs).toFixed(1)}g`;
        document.getElementById('diary-sum-prot').textContent = `${Number(data.totalProtein).toFixed(1)}g`;
        document.getElementById('diary-sum-fat').textContent = `${Number(data.totalFat).toFixed(1)}g`;

        const tbody = document.getElementById('diary-table-tbody');
        if (!tbody) return;

        if (!data.logs || data.logs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#64748b; padding:32px;">No food entries logged for this date. Click "Add Food" to log a meal!</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        data.logs.forEach(l => {
            const time = new Date(l.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${time}</strong></td>
                <td><strong>${escapeHtml(l.foodName)}</strong></td>
                <td>${Number(l.consumedQuantity).toFixed(1)} ${escapeHtml(l.servingUnit)}</td>
                <td><strong style="color:var(--primary);">${Number(l.calories).toFixed(0)} kcal</strong></td>
                <td>${Number(l.carbohydrates).toFixed(1)}g</td>
                <td>${Number(l.protein).toFixed(1)}g</td>
                <td>${Number(l.fat).toFixed(1)}g</td>
                <td>
                    <div style="display:flex; gap:6px;">
                        <button type="button" class="btn btn-outline" style="min-height:30px; padding:2px 8px; font-size:0.82rem;" title="Edit Entry">✏️ Edit</button>
                        <button type="button" class="btn-icon" title="Delete Entry" style="font-size:1rem; cursor:pointer;">🗑️</button>
                    </div>
                </td>
            `;

            const editBtn = tr.querySelector('.btn-outline');
            const delBtn = tr.querySelector('.btn-icon');

            editBtn.onclick = () => openEditLogModal(l.id, l.foodName, l.consumedQuantity, l.servingUnit, l.loggedAt);
            delBtn.onclick = () => deleteFoodLog(l.id);

            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Failed to load diary:', e);
    }
}

async function deleteFoodLog(id) {
    if (!confirm('Are you sure you want to delete this food entry?')) return;
    try {
        const resp = await apiFetch(`${API_BASE}/logs/${id}`, { method: 'DELETE' });
        if (resp.ok) {
            showToast('Food entry deleted.', 'info');
            loadDiaryData(state.currentDate);
        } else {
            showToast('Unable to delete food entry.', 'danger');
        }
    } catch (e) {
        showToast('Network error while deleting entry.', 'danger');
    }
}

// HISTORY VIEW (UP TO 1 YEAR)
async function loadHistoryData() {
    const today = new Date().toISOString().split('T')[0];
    const defaultStart = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    const startInput = document.getElementById('history-start-date');
    const endInput = document.getElementById('history-end-date');
    const filterBtn = document.getElementById('history-filter-btn');

    if (startInput && !startInput.value) startInput.value = defaultStart;
    if (endInput && !endInput.value) endInput.value = today;

    // Presets
    document.querySelectorAll('.history-preset-btn').forEach(btn => {
        btn.onclick = () => {
            const days = parseInt(btn.getAttribute('data-days'));
            const sDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
            if (startInput) startInput.value = sDate;
            if (endInput) endInput.value = today;
            fetchHistorySlice(sDate, today, 0);
        };
    });

    if (filterBtn) {
        filterBtn.onclick = () => {
            fetchHistorySlice(startInput.value, endInput.value, 0);
        };
    }

    fetchHistorySlice(startInput?.value || defaultStart, endInput?.value || today, 0);
}

async function fetchHistorySlice(startDate, endDate, page = 0) {
    try {
        const resp = await apiFetch(`${API_BASE}/summary/history?startDate=${startDate}&endDate=${endDate}&page=${page}&size=15`);
        if (!resp.ok) {
            const err = await resp.json();
            showToast(err.message || 'Failed to load historical data.', 'danger');
            return;
        }

        const data = await resp.json();

        // Render aggregated summary cards
        document.getElementById('hist-total-cal').textContent = `${Number(data.totalCalories).toFixed(0)} kcal`;
        document.getElementById('hist-total-entries').textContent = data.totalEntries;
        document.getElementById('hist-total-carb').textContent = `${Number(data.totalCarbs).toFixed(0)}g`;
        document.getElementById('hist-total-prot').textContent = `${Number(data.totalProtein).toFixed(0)}g`;
        document.getElementById('hist-total-fat').textContent = `${Number(data.totalFat).toFixed(0)}g`;

        // Render history logs table
        const tbody = document.getElementById('history-table-tbody');
        if (tbody) {
            if (data.entries.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#64748b; padding:24px;">No logs found for this date range.</td></tr>`;
            } else {
                tbody.innerHTML = data.entries.map(l => {
                    const dateStr = new Date(l.loggedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                    const timeStr = new Date(l.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return `
                        <tr>
                            <td><strong>${dateStr}</strong> <span style="color:#64748b; font-size:0.85rem;">${timeStr}</span></td>
                            <td><strong>${escapeHtml(l.foodName)}</strong></td>
                            <td>${Number(l.consumedQuantity).toFixed(1)} ${escapeHtml(l.servingUnit)}</td>
                            <td><strong style="color:var(--primary);">${Number(l.calories).toFixed(0)} kcal</strong></td>
                            <td>${Number(l.carbohydrates).toFixed(1)}g</td>
                            <td>${Number(l.protein).toFixed(1)}g</td>
                            <td>${Number(l.fat).toFixed(1)}g</td>
                        </tr>
                    `;
                }).join('');
            }
        }

        // Pagination controls
        const paginationInfo = document.getElementById('history-pagination-info');
        const prevBtn = document.getElementById('history-prev-page');
        const nextBtn = document.getElementById('history-next-page');

        if (paginationInfo) paginationInfo.textContent = `Page ${data.page + 1} of ${Math.max(data.totalPages, 1)}`;
        if (prevBtn) {
            prevBtn.disabled = data.page <= 0;
            prevBtn.onclick = () => fetchHistorySlice(startDate, endDate, data.page - 1);
        }
        if (nextBtn) {
            nextBtn.disabled = data.page >= data.totalPages - 1;
            nextBtn.onclick = () => fetchHistorySlice(startDate, endDate, data.page + 1);
        }
    } catch (e) {
        console.error('History fetch error:', e);
    }
}

// GOALS VIEW
async function loadGoalsView() {
    try {
        const resp = await apiFetch(`${API_BASE}/goals`);
        if (!resp.ok) return;
        const goal = await resp.json();
        state.currentGoal = goal;

        document.getElementById('goal-cal-input').value = Number(goal.dailyCalories).toFixed(0);
        document.getElementById('goal-carb-input').value = Number(goal.dailyCarbs).toFixed(0);
        document.getElementById('goal-prot-input').value = Number(goal.dailyProtein).toFixed(0);
        document.getElementById('goal-fat-input').value = Number(goal.dailyFat).toFixed(0);

        updateGoalCalculator();

        const form = document.getElementById('goals-form');
        if (form) {
            form.onsubmit = handleSaveGoals;
        }

        ['goal-cal-input', 'goal-carb-input', 'goal-prot-input', 'goal-fat-input'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', updateGoalCalculator);
        });
    } catch (e) {
        console.error('Failed to load goals:', e);
    }
}

function updateGoalCalculator() {
    const carb = parseFloat(document.getElementById('goal-carb-input')?.value) || 0;
    const prot = parseFloat(document.getElementById('goal-prot-input')?.value) || 0;
    const fat = parseFloat(document.getElementById('goal-fat-input')?.value) || 0;

    const carbKcal = carb * 4;
    const protKcal = prot * 4;
    const fatKcal = fat * 9;
    const totalMacroKcal = carbKcal + protKcal + fatKcal;

    document.getElementById('calc-macro-total-kcal').textContent = `${totalMacroKcal.toFixed(0)} kcal`;
    document.getElementById('calc-carb-split').textContent = `${carbKcal.toFixed(0)} kcal (${totalMacroKcal > 0 ? ((carbKcal/totalMacroKcal)*100).toFixed(0) : 0}%)`;
    document.getElementById('calc-prot-split').textContent = `${protKcal.toFixed(0)} kcal (${totalMacroKcal > 0 ? ((protKcal/totalMacroKcal)*100).toFixed(0) : 0}%)`;
    document.getElementById('calc-fat-split').textContent = `${fatKcal.toFixed(0)} kcal (${totalMacroKcal > 0 ? ((fatKcal/totalMacroKcal)*100).toFixed(0) : 0}%)`;
}

async function handleSaveGoals(e) {
    e.preventDefault();
    const dailyCalories = parseFloat(document.getElementById('goal-cal-input').value);
    const dailyCarbs = parseFloat(document.getElementById('goal-carb-input').value);
    const dailyProtein = parseFloat(document.getElementById('goal-prot-input').value);
    const dailyFat = parseFloat(document.getElementById('goal-fat-input').value);

    try {
        const resp = await apiFetch(`${API_BASE}/goals`, {
            method: 'PUT',
            body: JSON.stringify({ dailyCalories, dailyCarbs, dailyProtein, dailyFat })
        });

        if (resp.ok) {
            state.currentGoal = await resp.json();
            showToast('Daily calorie targets updated successfully!', 'success');
        } else {
            const err = await resp.json();
            showToast(err.message || 'Failed to update goals.', 'danger');
        }
    } catch (e) {
        showToast('Network error while saving goals.', 'danger');
    }
}

// FOOD DATABASE VIEW
async function loadFoodDatabase(page = 0) {
    const searchInput = document.getElementById('food-db-search');
    const search = searchInput ? searchInput.value.trim() : '';

    try {
        const resp = await apiFetch(`${API_BASE}/foods?page=${page}&size=12&search=${encodeURIComponent(search)}`);
        if (!resp.ok) return;
        const pageData = await resp.json();

        const grid = document.getElementById('food-db-grid');
        if (!grid) return;

        if (pageData.content.length === 0) {
            grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:32px; color:#64748b;">No foods match your search query.</div>`;
            return;
        }

        grid.innerHTML = '';
        pageData.content.forEach((f) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.style.cssText = 'display:flex; flex-direction:column; justify-content:space-between;';
            card.innerHTML = `
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                        <h4 style="font-size:1.05rem; font-weight:700; color:var(--primary-dark);">${escapeHtml(f.name)}</h4>
                        ${f.isCustom ? '<span class="badge badge-info">Custom</span>' : '<span class="badge badge-success">Verified</span>'}
                    </div>
                    <div style="font-size:0.85rem; color:#64748b; margin-bottom:12px;">
                        Serving basis: <strong>${f.nutritionBasis === 'PER_100G' ? '100g' : `${f.servingSize} ${escapeHtml(f.servingUnit)}`}</strong>
                        ${f.barcode ? `• Barcode: <code>${escapeHtml(f.barcode)}</code>` : ''}
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; background:#f8fafc; padding:10px; border-radius:8px; text-align:center; font-size:0.82rem; margin-bottom:14px;">
                        <div><strong style="color:var(--primary); font-size:1rem; display:block;">${Number(f.calories).toFixed(0)}</strong>kcal</div>
                        <div><strong style="display:block;">${Number(f.carbohydrates).toFixed(1)}g</strong>Carb</div>
                        <div><strong style="display:block;">${Number(f.protein).toFixed(1)}g</strong>Protein</div>
                        <div><strong style="display:block;">${Number(f.fat).toFixed(1)}g</strong>Fat</div>
                    </div>
                </div>
                <button type="button" class="btn btn-outline" style="width:100%; min-height:38px;">+ Quick Log This Food</button>
            `;

            const btn = card.querySelector('.btn-outline');
            btn.onclick = () => {
                switchView('add-food');
                setTimeout(() => {
                    state.currentSearchResults = [f];
                    selectFoodFromCatalog(0);
                }, 100);
            };

            grid.appendChild(card);
        });

        const pagination = document.getElementById('food-db-pagination');
        if (pagination) {
            pagination.innerHTML = '';
            const prev = document.createElement('button');
            prev.className = 'btn btn-secondary';
            prev.style.cssText = 'min-height:36px; padding:6px 14px;';
            prev.disabled = pageData.first;
            prev.textContent = '← Prev';
            prev.onclick = () => loadFoodDatabase(pageData.number - 1);

            const span = document.createElement('span');
            span.style.cssText = 'font-weight:600; color:#475569;';
            span.textContent = `Page ${pageData.number + 1} of ${Math.max(pageData.totalPages, 1)}`;

            const next = document.createElement('button');
            next.className = 'btn btn-secondary';
            next.style.cssText = 'min-height:36px; padding:6px 14px;';
            next.disabled = pageData.last;
            next.textContent = 'Next →';
            next.onclick = () => loadFoodDatabase(pageData.number + 1);

            pagination.appendChild(prev);
            pagination.appendChild(span);
            pagination.appendChild(next);
        }
    } catch (e) {
        console.error('Failed to load food database:', e);
    }
}

// PROFILE VIEW
function loadProfileView() {
    if (!state.currentUser) return;
    document.getElementById('profile-name-input').value = state.currentUser.fullName || '';
    document.getElementById('profile-email-input').value = state.currentUser.email || '';
    document.getElementById('profile-tz-input').value = state.currentUser.timezone || 'UTC';

    const form = document.getElementById('profile-form');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('profile-name-input').value.trim();
            const timezone = document.getElementById('profile-tz-input').value.trim();

            try {
                const resp = await apiFetch(`${API_BASE}/auth/profile`, {
                    method: 'PUT',
                    body: JSON.stringify({ fullName, timezone })
                });

                if (resp.ok) {
                    state.currentUser = await resp.json();
                    updateUserUI();
                    showToast('Profile updated successfully!', 'success');
                } else {
                    const err = await resp.json();
                    showToast(err.message || 'Failed to update profile.', 'danger');
                }
            } catch (err) {
                showToast('Network error updating profile.', 'danger');
            }
        };
    }
}
