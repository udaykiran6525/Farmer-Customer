/**
 * Farmigo – Dedicated Products Catalog JavaScript
 * Handles pagination, advanced filtering, sorting, rotating placeholder, and cart/wishlist
 */

'use strict';

const API = '';
let currentUser = null;
let cartData = { items: [], total: 0, itemCount: 0 };
let wishlistIds = new Set();
let allCatalogProducts = [];
let filteredProducts = [];
let currentCategory = 'all';
let currentSearch = '';
let currentPage = 1;
const ITEMS_PER_PAGE = 6;

/* Voice assistant globals */
let voicePanelOpen = false;
let isListening    = false;
let recognition    = null;

const getToken = () => localStorage.getItem('farmigo_token');
const setToken = (t) => localStorage.setItem('farmigo_token', t);
const removeToken = () => localStorage.removeItem('farmigo_token');

const OFFICIAL_CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Grains & Rice',
  'Pulses & Dals',
  'Dry Fruits',
  'Spices'
];

function normalizeCategory(rawCat) {
  if (!rawCat || typeof rawCat !== 'string') return null;
  const c = rawCat.trim().toLowerCase();
  if (!c) return null;

  // Strict mapping:
  // 1. Dry Fruits - MUST be matched before fruits to avoid substring or prefix confusion
  if (c === 'dry fruits' || c === 'dry fruit' || c === 'dryfruits' || c === 'dry-fruits' || c === 'nuts') {
    return 'Dry Fruits';
  }
  // 2. Fruits - fresh fruits only
  if (c === 'fruits' || c === 'fruit') {
    return 'Fruits';
  }
  // 3. Vegetables
  if (c === 'vegetables' || c === 'vegetable') {
    return 'Vegetables';
  }
  // 4. Grains & Rice
  if (c === 'grains & rice' || c === 'grains and rice' || c === 'grains' || c === 'grain' || c === 'rice' || c === 'millets' || c === 'millet') {
    return 'Grains & Rice';
  }
  // 5. Pulses & Dals
  if (c === 'pulses & dals' || c === 'pulses and dals' || c === 'pulses' || c === 'pulse' || c === 'dals' || c === 'dal' || c === 'legumes') {
    return 'Pulses & Dals';
  }
  // 6. Spices
  if (c === 'spices' || c === 'spice') {
    return 'Spices';
  }

  // Exact match against official categories
  const matched = OFFICIAL_CATEGORIES.find(cat => cat.toLowerCase() === c);
  if (matched) return matched;

  // Unknown or invalid category
  return null;
}

function capitalize(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''; }

function getCategoryImg(cat) {
  const norm = normalizeCategory(cat);
  const imgs = {
    'Vegetables': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&q=80',
    'Fruits': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&q=80',
    'Grains & Rice': 'https://images.unsplash.com/photo-1586201375761-83865001e8b7?w=500&q=80',
    'Pulses & Dals': 'https://images.unsplash.com/photo-1612187870-40fe2ddad9b2?w=500&q=80',
    'Dry Fruits': 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=500&q=80',
    'Spices': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&q=80',
    default: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=500&q=80'
  };
  return imgs[norm] || imgs.default;
}

function getProductImg(p) {
  // Priority: imageUrl field (DB column) > image alias > nothing
  if (p) {
    let url = (p.imageUrl || p.image || '').trim();
    if (url) {
      if (url.includes('localhost:5000')) url = url.substring(url.indexOf('/uploads'));
      if (url.includes('127.0.0.1:5000')) url = url.substring(url.indexOf('/uploads'));
      return url.startsWith('/uploads') ? (API + url) : url;
    }
  }
  return getCategoryImg(p ? p.category : 'default');
}

async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (options.body instanceof FormData) delete headers['Content-Type'];

  let url = API + endpoint;
  if (options.method === undefined || options.method === 'GET') {
    url += (url.includes('?') ? '&' : '?') + '_t=' + Date.now();
  }

  try {
    const res = await fetch(url, { cache: 'no-store', ...options, headers });
    return await res.json();
  } catch (err) {
    console.error('API Error:', endpoint, err);
    return { success: false, message: 'Network error. Please check backend server.' };
  }
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || '✅'}</span><span class="toast-msg">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* Rotating Placeholders */
const searchPlaceholders = [
  "Search Potatoes...", "Search Apples...", "Search Rice...",
  "Search Groundnuts...", "Search Oranges...", "Search Garlic...",
  "Search Fresh Vegetables...", "Search Dry Fruits..."
];
let placeholderIndex = 0;
let charIndex = 0;
let isDeleting = false;

function initCatalogPlaceholder() {
  const input = document.getElementById('catalogSearchInput');
  if (!input) return;

  function typeStep() {
    const currentWord = searchPlaceholders[placeholderIndex];
    let displayText = isDeleting ? currentWord.substring(0, charIndex - 1) : currentWord.substring(0, charIndex + 1);
    charIndex += isDeleting ? -1 : 1;
    input.setAttribute('placeholder', displayText || 'Search...');

    let speed = isDeleting ? 40 : 80;
    if (!isDeleting && charIndex === currentWord.length) { speed = 2000; isDeleting = true; }
    else if (isDeleting && charIndex === 0) { isDeleting = false; placeholderIndex = (placeholderIndex + 1) % searchPlaceholders.length; speed = 500; }
    setTimeout(typeStep, speed);
  }
  typeStep();
}

/* Fetch & Pagination */
async function fetchCatalogProducts() {
  const grid = document.getElementById('catalogGrid');
  if (!grid) return;

  grid.innerHTML = Array(6).fill(0).map(() => `
    <div class="skeleton-card"><div class="skeleton skeleton-img"></div><div class="skeleton-body"><div class="skeleton skeleton-line w-full"></div><div class="skeleton skeleton-line w-3/4"></div></div></div>`).join('');

  // Fetch all active products once
  const data = await apiRequest('/api/products');
  if (!data.success) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">😕</div><h3>Failed to load catalog</h3><p>${data.message}</p></div>`;
    return;
  }

  allCatalogProducts = data.products || [];
  applyCatalogFilters();
}

function renderCatalogPage() {
  const grid = document.getElementById('catalogGrid');
  const count = document.getElementById('catalogCount');
  const pageText = document.getElementById('pageInfoText');
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');

  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  if (currentPage > totalPages) currentPage = totalPages || 1;

  if (count) count.textContent = `${totalItems} total products`;
  if (pageText) pageText.textContent = `Page ${currentPage} of ${totalPages}`;
  if (prevBtn) prevBtn.disabled = currentPage <= 1;
  if (nextBtn) nextBtn.disabled = currentPage >= totalPages;

  if (!totalItems) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🌱</div><h3>No products match your filter</h3><p>Try searching for another crop or reset categories</p></div>`;
    return;
  }

  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filteredProducts.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  grid.innerHTML = pageItems.map((p, idx) => renderProductCard(p, startIdx + idx)).join('');
}

function changePage(delta) {
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const newPage = currentPage + delta;
  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    renderCatalogPage();
    window.scrollTo({ top: 100, behavior: 'smooth' });
  }
}

function filterCatalogCategory(cat) {
  currentCategory = cat;
  
  const normCurrent = (cat && cat !== 'all') ? normalizeCategory(cat) : 'all';

  // Update UI tabs
  document.querySelectorAll('.cat-tab').forEach(tab => {
    const tabCat = tab.getAttribute('data-cat');
    const isMatch = (normCurrent === 'all' && (tabCat === 'all' || !tabCat)) ||
                    (normalizeCategory(tabCat) === normCurrent) ||
                    (tabCat === cat);
    tab.classList.toggle('active', isMatch);
  });
  
  applyCatalogFilters();
}

function applyCatalogFilters() {
  filteredProducts = [...allCatalogProducts];

  // 1. Strict Category Matching
  if (currentCategory && currentCategory !== 'all') {
    const targetCat = normalizeCategory(currentCategory);
    if (targetCat) {
      filteredProducts = filteredProducts.filter(p => {
        const prodCat = normalizeCategory(p.category);
        if (!prodCat) {
          console.warn(`[Farmigo Category Filter] Product "${p.name}" (ID: ${p._id || p.id}) has invalid or unassigned category: "${p.category}". Excluded from category filters.`);
          return false;
        }
        return prodCat === targetCat;
      });
    }
  }

  // 2. Filter by search text
  if (currentSearch) {
    const term = currentSearch.toLowerCase().trim();
    filteredProducts = filteredProducts.filter(p => p.name && p.name.toLowerCase().includes(term));
  }

  // 3. Sort
  const sort = document.getElementById('sortSelect')?.value;
  if (sort === 'price_low') filteredProducts.sort((a, b) => a.price - b.price);
  if (sort === 'price_high') filteredProducts.sort((a, b) => b.price - a.price);
  if (sort === 'rating') filteredProducts.sort((a, b) => (b.ratings || 0) - (a.ratings || 0));
  if (sort === 'name') filteredProducts.sort((a, b) => a.name.localeCompare(b.name));

  currentPage = 1;
  renderCatalogPage();
}

function renderProductCard(p, idx = 0) {
  const imgSrc = getProductImg(p);
  const farmerName = p.farmer?.name || 'Local Farmer';
  const location = [p.farmer?.district, p.farmer?.state].filter(Boolean).join(', ') || 'Telangana, India';
  const stars = '★'.repeat(Math.round(p.ratings || 5)) + '☆'.repeat(5 - Math.round(p.ratings || 5));
  const inWishlist = wishlistIds.has(p._id || p.id);

  // Strikethrough Original Price (20% higher than current price)
  const originalPrice = Math.round(p.price * 1.25);
  
  // Natural Offer Badge Distribution Logic
  let offerBadgeHtml = '';
  if (p.isOrganic) {
    offerBadgeHtml = `<span class="badge badge-organic">🌱 100% Organic</span>`;
  } else if (idx % 3 === 1) {
    const promoBadges = ['Best Seller', "Today's Deal", 'Fresh Arrival', 'Hot Deal', 'Limited Stock', '20% OFF'];
    const bType = promoBadges[Math.floor(idx / 3) % promoBadges.length];
    offerBadgeHtml = `<span class="badge badge-offer">${bType}</span>`;
  }

  const displayCategory = normalizeCategory(p.category) || p.category || 'Produce';

  return `
    <div class="product-card fade-in" data-id="${p._id || p.id}">
      <div class="product-img-wrap">
        <img src="${imgSrc}" alt="${p.name}" loading="lazy" onerror="this.onerror=null;this.src='${getCategoryImg(p.category)}'" />
        <div class="product-badges">
          ${offerBadgeHtml}
          <span class="badge badge-category">${displayCategory}</span>
        </div>
        <button class="product-wishlist-btn ${inWishlist ? 'active' : ''}" onclick="toggleWishlist('${p._id || p.id}', this)" title="Wishlist">
          <svg viewBox="0 0 24 24" fill="${inWishlist ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>
      <div class="product-body">
        <div class="product-farmer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          ${farmerName}
        </div>
        <div class="product-name">${p.name}</div>
        <div class="product-location">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${location}
        </div>
        <div class="product-stars">
          <span class="stars">${stars}</span>
          <span class="product-rating-text">${(p.ratings || 4.9).toFixed(1)} (${p.reviewCount || 42})</span>
        </div>
        <div class="product-price-row">
          <div class="price-wrap">
            <div class="product-price">₹${p.price}<span>/${p.unit}</span></div>
            <div class="original-price">₹${originalPrice}</div>
          </div>
          <div class="product-stock">${p.quantity} ${p.unit} left</div>
        </div>
        <div class="product-actions">
          <button class="btn-cart" onclick="addToCart('${p._id || p.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            Add to Cart
          </button>
          <button class="btn-buy" onclick="buyNow('${p._id || p.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="5 12 12 19 19 12"/></svg>
            Buy Now
          </button>
          <button class="btn-details" onclick="openProductDetail('${p._id || p.id}')">View Details →</button>
        </div>
      </div>
    </div>`;
}

async function openProductDetail(productId) {
  const modal = document.getElementById('productModal');
  if (!modal) return;
  modal.classList.add('open');
  const body = document.getElementById('productModalBody');
  if (body) body.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--gray-500);">Loading details...</div>';

  const data = await apiRequest(`/api/products/${productId}`);
  if (!data.success) {
    if (body) body.innerHTML = '<p style="color:red;">Failed to load product details.</p>';
    return;
  }

  const p = data.product;
  const imgSrc = getProductImg(p);
  const location = [p.farmer?.district, p.farmer?.state].filter(Boolean).join(', ') || 'Telangana, India';
  const stars = '★'.repeat(Math.round(p.ratings || 5)) + '☆'.repeat(5 - Math.round(p.ratings || 5));
  const originalPrice = Math.round(p.price * 1.25);

  const title = document.getElementById('productModalTitle');
  if (title) title.textContent = p.name;
  if (body) {
    body.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1.1fr;gap:2rem;align-items:start;">
        <div style="border-radius:var(--radius-lg);overflow:hidden;border:2px solid var(--orange-200);box-shadow:var(--shadow-sm);">
          <img src="${imgSrc}" alt="${p.name}" style="width:100%;height:300px;object-fit:cover;" />
        </div>
        <div>
          <div style="display:flex;gap:0.5rem;margin-bottom:0.75rem;">
            ${p.isOrganic ? '<span class="badge badge-organic">🌱 100% Organic</span>' : ''}
            <span class="badge badge-offer">🔥 Best Seller</span>
          </div>
          <div style="font-size:0.85rem;color:var(--gray-500);text-transform:capitalize;margin-bottom:0.3rem;">Category: ${normalizeCategory(p.category) || p.category}</div>
          <h3 style="font-size:1.6rem;font-weight:900;color:var(--gray-900);margin-bottom:0.5rem;">${p.name}</h3>
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem;">
            <span style="color:var(--amber-400);font-size:1.1rem;">${stars}</span>
            <span style="font-size:0.85rem;color:var(--gray-500);font-weight:600;">${(p.ratings||4.9).toFixed(1)} (${p.reviewCount||42} customer reviews)</span>
          </div>
          <div style="display:flex;align-items:baseline;gap:0.75rem;margin-bottom:0.5rem;">
            <span style="font-size:2.2rem;font-weight:900;color:var(--orange-600);">₹${p.price}<span style="font-size:1rem;color:var(--gray-500);font-weight:600;">/${p.unit}</span></span>
            <span style="font-size:1.2rem;color:var(--gray-400);text-decoration:line-through;font-weight:700;">₹${originalPrice}</span>
            <span style="background:var(--orange-100);color:var(--orange-700);padding:0.2rem 0.6rem;border-radius:var(--radius-full);font-size:0.8rem;font-weight:800;">20% OFF</span>
          </div>
          <div style="font-size:0.85rem;color:var(--green-700);font-weight:700;margin-bottom:1.2rem;">✔ In Stock: ${p.quantity} ${p.unit} available for immediate dispatch</div>
          ${p.description ? `<p style="font-size:0.95rem;color:var(--gray-600);line-height:1.7;margin-bottom:1.5rem;">${p.description}</p>` : ''}
          <div style="background:var(--orange-50);border:1px solid var(--orange-200);border-radius:var(--radius-md);padding:1rem;margin-bottom:1.5rem;">
            <div style="font-size:0.85rem;font-weight:800;color:var(--orange-700);margin-bottom:0.4rem;">🌾 Verified Farmer Profile</div>
            <div style="font-size:0.85rem;color:var(--gray-700);">
              <strong>👨‍🌾 ${p.farmer?.name || 'Local Farmer'}</strong><br/>
              📍 Farm Location: ${location}<br/>
              📞 Contact: ${p.farmer?.phone || 'Verified Direct Number'}
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
            <button class="btn-cart" style="padding:0.9rem;" onclick="addToCart('${p._id || p.id}');closeProductModal();">Add to Cart 🛒</button>
            <button class="btn-buy" style="padding:0.9rem;" onclick="buyNow('${p._id || p.id}');closeProductModal();">Buy Now ⚡</button>
          </div>
        </div>
      </div>`;
  }
}

function closeProductModal() {
  const modal = document.getElementById('productModal');
  if (modal) modal.classList.remove('open');
}


function openAuthModal() { document.getElementById('authModal').classList.add('open'); }
function closeAuthModal() { document.getElementById('authModal').classList.remove('open'); }

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t, i) => t.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register')));
  document.getElementById('loginForm').classList.toggle('active', tab === 'login');
  document.getElementById('registerForm').classList.toggle('active', tab === 'register');
}

async function loginCustomer() {
  const identifier = document.getElementById('loginIdentifier').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!identifier || !password) return showToast('Please enter email and password', 'warning');

  const data = await apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) });
  if (!data.success) return showToast(data.message, 'error');

  if (data.user.role === 'farmer') {
    showToast('Farmer accounts use the Farmer Portal!', 'warning');
    return;
  }

  setToken(data.token);
  currentUser = data.user;
  updateNavForUser(currentUser);
  closeAuthModal();
  showToast(`Welcome back, ${currentUser.name}!`);
  await loadCart();
  await loadWishlist();
}

async function registerCustomer() {
  const name = document.getElementById('regName')?.value.trim() || '';
  const phone = document.getElementById('regPhone')?.value.trim() || '';
  const email = document.getElementById('regEmail')?.value.trim() || '';
  const password = document.getElementById('regPassword')?.value || '';
  const city = document.getElementById('regCity')?.value.trim() || '';
  const state = document.getElementById('regState')?.value.trim() || '';

  if (!name || !phone || !email || !password) {
    return showToast('Please fill all required fields', 'warning');
  }

  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(phone)) {
    return showToast('Please enter a valid 10-digit mobile number', 'warning');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return showToast('Please enter a valid email address', 'warning');
  }

  if (password.length < 6) {
    return showToast('Password must be at least 6 characters long', 'warning');
  }

  const data = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, phone, email, password, role: 'customer', city, state })
  });

  if (!data.success) {
    let msg = data.message || 'Registration failed. Please try again.';
    if (msg.toLowerCase().includes('email') && msg.toLowerCase().includes('already')) {
      msg = 'This email is already registered. Please log in.';
    } else if (msg.toLowerCase().includes('phone') && msg.toLowerCase().includes('already')) {
      msg = 'This phone number is already registered. Please log in.';
    }
    return showToast(msg, 'error');
  }

  switchAuthTab('login');
  const loginIdInput = document.getElementById('loginIdentifier');
  if (loginIdInput) {
    loginIdInput.value = email || phone;
  }

  showRegistrationSuccessNotification();
}

function logout(confirmed = false) {
  if (confirmed !== true) {
    showLogoutConfirmModal('customer');
    return;
  }
  removeToken();
  currentUser = null;
  localStorage.removeItem('farmigo_token');
  localStorage.removeItem('farmigo_user');
  localStorage.removeItem('token');
  localStorage.removeItem('jwt');
  localStorage.removeItem('user');
  sessionStorage.clear();
  cartData = { items: [], total: 0, itemCount: 0 };
  wishlistIds.clear();
  updateNavForUser(null);
  updateCartBadge(0);
  updateWishlistBadge(0);
  showToast('Logged out successfully');
  const userDropdown = document.getElementById('userDropdown');
  if (userDropdown) userDropdown.classList.remove('open');

  closeLogoutConfirmModal();
  if (window.location.pathname !== '/' && !window.location.pathname.endsWith('index.html') && window.location.pathname !== '') {
    window.location.href = '/';
  } else {
    window.location.reload();
  }
}

function showLogoutConfirmModal(role = 'customer') {
  window.pendingLogoutRole = role;
  let modal = document.getElementById('logoutConfirmModal');
  if (!modal) {
    const div = document.createElement('div');
    div.id = 'logoutConfirmModal';
    div.className = 'logout-modal-overlay';
    div.setAttribute('onclick', 'if(event.target === this) closeLogoutConfirmModal()');
    div.innerHTML = `
      <div class="logout-modal-card">
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 5px; background: linear-gradient(90deg, #2E7D32, #FF9800, #EF4444);"></div>
        <div style="width: 68px; height: 68px; border-radius: 50%; background: rgba(239, 68, 68, 0.15); border: 2px solid rgba(239, 68, 68, 0.4); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.3rem auto; box-shadow: 0 8px 20px rgba(239, 68, 68, 0.25);">
          <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width: 32px; height: 32px; transform: translateX(2px);">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </div>
        <h3 style="font-family: 'Poppins', 'Inter', sans-serif; font-size: 1.6rem; font-weight: 800; color: #fff; margin: 0 0 0.8rem 0; letter-spacing: -0.5px;">Sign Out</h3>
        <p style="font-size: 0.98rem; color: #CBD5E1; line-height: 1.6; margin: 0 0 1.8rem 0; font-weight: 400;">
          Are you sure you want to log out of your Farmigo account?<br><br>
          <span style="color: #FFB74D; font-weight: 600; font-size: 0.92rem; background: rgba(255, 152, 0, 0.12); padding: 0.35rem 0.8rem; border-radius: 8px; display: inline-block;">
            ⚠️ You will need to sign in again to access your dashboard.
          </span>
        </p>
        <div style="display: flex; gap: 1rem; align-items: center; justify-content: center;">
          <button type="button" class="btn-logout-cancel" id="btnCancelLogout" onclick="closeLogoutConfirmModal()" style="flex: 1; padding: 0.85rem 1.2rem; border-radius: 14px; border: none; background: #334155; color: #F8FAFC; font-size: 0.98rem; font-weight: 700; cursor: pointer; transition: all 0.25s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
            Cancel
          </button>
          <button type="button" class="btn-logout-confirm" id="btnConfirmLogout" onclick="performLogout()" style="flex: 1; padding: 0.85rem 1.2rem; border-radius: 14px; border: none; background: linear-gradient(135deg, #FF5722 0%, #DC2626 100%); color: #ffffff; font-size: 0.98rem; font-weight: 700; cursor: pointer; transition: all 0.25s ease; box-shadow: 0 6px 18px rgba(220, 38, 38, 0.4); display: flex; align-items: center; justify-content: center; gap: 0.4rem;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(div);
    modal = div;
  }

  const btnConfirm = document.getElementById('btnConfirmLogout');
  if (btnConfirm) {
    btnConfirm.disabled = false;
    btnConfirm.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
      </svg>
      Logout
    `;
    btnConfirm.style.opacity = '1';
  }

  modal.style.display = 'flex';
  setTimeout(() => {
    modal.classList.add('open');
  }, 10);
}

function closeLogoutConfirmModal() {
  const modal = document.getElementById('logoutConfirmModal');
  if (modal) {
    modal.classList.remove('open');
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }
}

let isLoggingOut = false;
function performLogout() {
  if (isLoggingOut) return;
  isLoggingOut = true;
  const btn = document.getElementById('btnConfirmLogout');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span style="display:inline-block;animation:spin 1s linear infinite;margin-right:0.4rem;">⏳</span> Logging out...`;
    btn.style.opacity = '0.7';
  }

  setTimeout(() => {
    const role = window.pendingLogoutRole || 'customer';
    if (role === 'farmer' && typeof logoutFarmer === 'function') {
      logoutFarmer(true);
    } else {
      logout(true);
    }
    isLoggingOut = false;
  }, 400);
}

window.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' || e.keyCode === 27) {
    const modal = document.getElementById('logoutConfirmModal');
    if (modal && (modal.classList.contains('open') || modal.style.display === 'flex')) {
      closeLogoutConfirmModal();
    }
  }
});


function updateNavForUser(user) {
  const loginBtn = document.getElementById('navLoginBtn');
  const userBtn = document.getElementById('navUserBtn');
  const navUserName = document.getElementById('navUserName');
  const navUserAvatar = document.getElementById('navUserAvatar');

  if (user) {
    loginBtn.style.display = 'none';
    userBtn.style.display = 'flex';
    navUserName.textContent = user.name;
    navUserAvatar.src = user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f97316&color=fff&size=64`;
  } else {
    loginBtn.style.display = 'flex';
    userBtn.style.display = 'none';
  }
}

function showRegistrationSuccessNotification() {
  let card = document.getElementById('regSuccessCard');
  if (!card) {
    card = document.createElement('div');
    card.id = 'regSuccessCard';
    card.className = 'reg-success-card';
    card.innerHTML = `
      <div class="reg-success-icon">✓</div>
      <div class="reg-success-content">
        <div class="reg-success-title">Success</div>
        <div class="reg-success-msg">Account created successfully. Please log in to continue.</div>
      </div>
    `;
    document.body.appendChild(card);
  }
  
  void card.offsetWidth;
  card.classList.add('show');
  
  setTimeout(() => {
    card.classList.remove('show');
  }, 4000);
}

function openCustomerDashboard() {
  if (!currentUser) return openAuthModal();
  if (window.location.pathname.includes('products.html')) {
    window.location.href = '/index.html#products';
  } else {
    const productsSec = document.getElementById('products') || document.getElementById('home');
    if (productsSec) productsSec.scrollIntoView({ behavior: 'smooth' });
    showToast('Welcome to your Customer Dashboard! Explore fresh products below. 🛒', 'success');
  }
}

/* ══════════════════════════════════════════
   PROFILE MODAL
══════════════════════════════════════════ */
function openProfileModal() {
  if (!currentUser) return openAuthModal();
  document.getElementById('userDropdown').classList.remove('open');
  document.getElementById('profileModal').classList.add('open');

  const u = currentUser;
  document.getElementById('profileModalBody').innerHTML = `
    <div style="text-align:center;margin-bottom:1.5rem;">
      <img src="${u.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=f97316&color=fff&size=128`}"
        alt="${u.name}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--orange-500);margin-bottom:0.75rem;" />
      <div style="font-size:1.1rem;font-weight:800;">${u.name}</div>
      <div style="font-size:0.85rem;color:var(--gray-500);">${u.email}</div>
      <div style="font-size:0.85rem;color:var(--gray-500);">${u.phone}</div>
    </div>
    <div style="display:grid;gap:1rem;margin-bottom:1.5rem;">
      <div class="form-group">
        <label class="form-label">Full Name</label>
        <input type="text" class="form-control" id="profileName" value="${u.name}" />
      </div>
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input type="text" class="form-control" id="profilePhone" value="${u.phone}" />
      </div>
      <div class="form-group">
        <label class="form-label">City</label>
        <input type="text" class="form-control" id="profileCity" value="${u.city || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Full Delivery Address</label>
        <input type="text" class="form-control" id="profileAddress" value="${u.address || ''}" />
      </div>
    </div>
    <button class="btn-submit" onclick="updateProfile()">Save Profile Changes 💾</button>`;
}

function closeProfileModal() { document.getElementById('profileModal').classList.remove('open'); }

async function updateProfile() {
  const name = document.getElementById('profileName').value.trim();
  const phone = document.getElementById('profilePhone').value.trim();
  const city = document.getElementById('profileCity').value.trim();
  const address = document.getElementById('profileAddress').value.trim();

  const data = await apiRequest('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify({ name, phone, city, address })
  });

  if (!data.success) return showToast(data.message, 'error');

  currentUser = { ...currentUser, ...data.user };
  updateNavForUser(currentUser);
  closeProfileModal();
  showToast('Profile updated! ✅');
}

/* ══════════════════════════════════════════
   CART
══════════════════════════════════════════ */
function openCart() {
  document.getElementById('cartOverlay').classList.add('open');
  document.getElementById('cartDrawer').classList.add('open');
  if (currentUser) loadCart();
  else renderCartEmpty(true);
}

function closeCart() {
  document.getElementById('cartOverlay').classList.remove('open');
  document.getElementById('cartDrawer').classList.remove('open');
}

async function loadCart() {
  if (!currentUser) return;
  const data = await apiRequest('/api/cart');
  if (!data.success) return;

  cartData = data.cart;
  updateCartBadge(cartData.itemCount);
  renderCartItems();
}

function renderCartItems() {
  const body = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');
  const countEl = document.getElementById('cartItemCount');

  if (!cartData.items || !cartData.items.length) {
    countEl.textContent = '';
    footer.style.display = 'none';
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Add products to get started!</p>
      </div>`;
    return;
  }

  countEl.textContent = `(${cartData.itemCount} items)`;
  footer.style.display = 'block';

  body.innerHTML = cartData.items.map(item => {
    const p = item.product;
    const imgSrc = getProductImg(p);
    return `
      <div class="cart-item">
        <img src="${imgSrc}" alt="${p.name}" class="cart-item-img" onerror="this.onerror=null;this.src='${getCategoryImg(p.category)}'" />
        <div class="cart-item-info">
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-farmer">By ${p.farmer?.name || 'Verified Farmer'}</div>
          <div class="cart-item-price">₹${(p.price * item.quantity).toFixed(0)}</div>
          <div class="cart-qty">
            <button class="qty-btn" onclick="updateCartQty('${item._id}', ${item.quantity - 1})">−</button>
            <span class="qty-num">${item.quantity}</span>
            <button class="qty-btn" onclick="updateCartQty('${item._id}', ${item.quantity + 1})">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="removeCartItem('${item._id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg></button>
      </div>`;
  }).join('');

  const deliveryFee = 40;
  document.getElementById('cartSummary').innerHTML = `
    <div class="cart-summary-row"><span>Subtotal (${cartData.itemCount} items)</span><span>₹${cartData.total}</span></div>
    <div class="cart-summary-row"><span>Delivery Fee</span><span>₹${deliveryFee}</span></div>
    <div class="cart-summary-row"><span>Total Amount</span><span>₹${cartData.total + deliveryFee}</span></div>`;
}

function renderCartEmpty(notLoggedIn = false) {
  const body = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');
  footer.style.display = 'none';
  body.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">${notLoggedIn ? '🔐' : '🛒'}</div>
      <h3>${notLoggedIn ? 'Please Login' : 'Cart is Empty'}</h3>
      <p>${notLoggedIn ? 'Login to view your saved items' : 'Add fresh farm products to get started!'}</p>
      ${notLoggedIn ? `<button class="btn-primary" style="margin:1rem auto 0;justify-content:center;" onclick="closeCart();openAuthModal();">Login / Register</button>` : ''}
    </div>`;
}

async function addToCart(productId) {
  if (!currentUser) { openAuthModal(); showToast('Please login to add items to cart', 'warning'); return; }
  const data = await apiRequest('/api/cart', { method: 'POST', body: JSON.stringify({ productId: String(productId), quantity: 1 }) });
  if (!data.success) return showToast(data.message, 'error');
  cartData = data.cart;
  updateCartBadge(cartData.itemCount);
  showToast('Added to cart! 🛒');
  
  if (document.getElementById('cartDrawer').classList.contains('open')) {
    renderCartItems();
  }
}

async function updateCartQty(itemId, newQty) {
  if (newQty < 1) { removeCartItem(itemId); return; }
  const data = await apiRequest(`/api/cart/${itemId}`, { method: 'PUT', body: JSON.stringify({ quantity: newQty }) });
  if (!data.success) return showToast(data.message, 'error');
  await loadCart();
}

async function removeCartItem(itemId) {
  const data = await apiRequest(`/api/cart/${itemId}`, { method: 'DELETE' });
  if (!data.success) return showToast(data.message, 'error');
  showToast('Item removed from cart');
  await loadCart();
}

function updateCartBadge(count) {
  const badge = document.getElementById('cartBadge');
  badge.textContent = count;
  badge.classList.toggle('show', count > 0);
}

function openCheckout() {
  if (!cartData.items?.length) { showToast('Your cart is empty', 'warning'); return; }
  closeCart();
  if (currentUser?.address) document.getElementById('checkoutAddress').value = currentUser.address;

  const deliveryFee = 40;
  document.getElementById('checkoutSummary').innerHTML = `
    <div class="cart-summary-row"><span>Subtotal</span><span>₹${cartData.total}</span></div>
    <div class="cart-summary-row"><span>Delivery</span><span>₹${deliveryFee}</span></div>
    <div class="cart-summary-row"><span>Total Payable</span><span>₹${cartData.total + deliveryFee}</span></div>`;
  document.getElementById('checkoutModal').classList.add('open');
}

function closeCheckoutModal() { document.getElementById('checkoutModal').classList.remove('open'); }

async function placeOrder() {
  const address = document.getElementById('checkoutAddress').value.trim();
  const payment = document.getElementById('checkoutPayment').value;

  if (!address) return showToast('Please enter delivery address', 'warning');

  const data = await apiRequest('/api/orders/checkout', {
    method: 'POST',
    body: JSON.stringify({ shippingAddress: address, paymentMethod: payment })
  });

  if (!data.success) return showToast(data.message, 'error');

  closeCheckoutModal();
  cartData = { items: [], total: 0, itemCount: 0 };
  updateCartBadge(0);
  const orderIdStr = data.order && data.order._id ? `ORD-${String(data.order._id).slice(-8).toUpperCase()}` : 'ORD-SUCCESS';
  showOrderSuccessModal(orderIdStr);
}

function showOrderSuccessModal(orderIdStr) {
  const display = document.getElementById('successOrderIdDisplay');
  if (display) display.textContent = `Order ID: ${orderIdStr}`;
  const modal = document.getElementById('orderSuccessModal');
  if (modal) modal.classList.add('open');
}

function closeOrderSuccessModal() {
  const modal = document.getElementById('orderSuccessModal');
  if (modal) modal.classList.remove('open');
}

/* ══════════════════════════════════════════
   WISHLIST
══════════════════════════════════════════ */
function openWishlist() {
  document.getElementById('wishlistOverlay').classList.add('open');
  document.getElementById('wishlistDrawer').classList.add('open');
  if (currentUser) renderWishlist();
  else {
    document.getElementById('wishlistBody').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔐</div>
        <h3>Please Login</h3>
        <p>Login to view your saved wishlist</p>
        <button class="btn-primary" style="margin:1rem auto 0;justify-content:center;" onclick="closeWishlist();openAuthModal();">Login</button>
      </div>`;
  }
}

function closeWishlist() {
  document.getElementById('wishlistOverlay').classList.remove('open');
  document.getElementById('wishlistDrawer').classList.remove('open');
}

async function loadWishlist() {
  if (!currentUser) return;
  const data = await apiRequest('/api/wishlist');
  if (!data.success) return;
  wishlistIds = new Set(data.wishlist.map(p => String(p._id)));
  updateWishlistBadge(wishlistIds.size);
  document.querySelectorAll('.product-wishlist-btn').forEach(btn => {
    const card = btn.closest('.product-card');
    if (!card) return;
    const pid = card.dataset.id;
    if (wishlistIds.has(pid)) {
      btn.classList.add('active');
      btn.querySelector('svg').setAttribute('fill', 'currentColor');
    }
  });
}

async function renderWishlist() {
  const body = document.getElementById('wishlistBody');
  body.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--gray-500);">Loading wishlist...</div>';

  const data = await apiRequest('/api/wishlist');
  if (!data.success) { body.innerHTML = '<p style="padding:1rem;color:red;">Failed to load</p>'; return; }

  const items = data.wishlist;
  wishlistIds = new Set(items.map(p => String(p._id)));
  updateWishlistBadge(wishlistIds.size);

  if (!items.length) {
    body.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❤️</div>
        <h3>No items in wishlist</h3>
        <p>Click the heart icon on products to save them</p>
      </div>`;
    return;
  }

  body.innerHTML = items.map(p => {
    const img = getProductImg(p);
    return `
      <div class="cart-item">
        <img src="${img}" alt="${p.name}" class="cart-item-img" onerror="this.onerror=null;this.src='${getCategoryImg(p.category)}'" />
        <div class="cart-item-info">
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-farmer">${normalizeCategory(p.category) || p.category}</div>
          <div class="cart-item-price">₹${p.price}/${p.unit}</div>
          <button class="btn-cart" style="margin-top:0.5rem;padding:0.4rem 0.8rem;width:100%;" onclick="addToCart('${p._id}');showToast('Added to cart!');">Add to Cart 🛒</button>
        </div>
        <button class="cart-item-remove" onclick="removeFromWishlist('${p._id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg></button>
      </div>`;
  }).join('');
}

async function toggleWishlist(productId, btn) {
  if (!currentUser) { openAuthModal(); showToast('Please login first', 'warning'); return; }

  productId = String(productId); // Ensure it's a string

  const data = await apiRequest(`/api/wishlist/${productId}`, { method: 'POST' });
  if (!data.success) return showToast(data.message, 'error');

  if (data.inWishlist) {
    wishlistIds.add(productId);
    btn.classList.add('active');
    btn.querySelector('svg').setAttribute('fill', 'currentColor');
    showToast('Added to wishlist! ❤️');
  } else {
    wishlistIds.delete(productId);
    btn.classList.remove('active');
    btn.querySelector('svg').setAttribute('fill', 'none');
    showToast('Removed from wishlist');
  }
  updateWishlistBadge(wishlistIds.size);
}

async function removeFromWishlist(productId) {
  productId = String(productId);
  await apiRequest(`/api/wishlist/${productId}`, { method: 'DELETE' });
  wishlistIds.delete(productId);
  updateWishlistBadge(wishlistIds.size);
  renderWishlist();
  showToast('Removed from wishlist');
}

function updateWishlistBadge(count) {
  const badge = document.getElementById('wishlistBadge');
  badge.textContent = count;
  badge.classList.toggle('show', count > 0);
}

async function buyNow(productId) {
  if (!currentUser) { openAuthModal(); showToast('Please login to buy', 'warning'); return; }
  await addToCart(productId);
  openCheckout();
}

/* ══════════════════════════════════════════
   ORDERS
══════════════════════════════════════════ */
function openOrdersDrawer() {
  if (!currentUser) { openAuthModal(); return; }
  document.getElementById('userDropdown').classList.remove('open');
  document.getElementById('ordersOverlay').classList.add('open');
  document.getElementById('ordersDrawer').classList.add('open');
  loadOrders();
}

function closeOrdersDrawer() {
  document.getElementById('ordersOverlay').classList.remove('open');
  document.getElementById('ordersDrawer').classList.remove('open');
}

let lastCustomerOrders = [];
async function loadOrders() {
  const body = document.getElementById('ordersBody');
  body.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--gray-500);">Loading your orders...</div>';

  try {
    const data = await apiRequest('/api/orders');
    if (!data.success) { body.innerHTML = '<p style="padding:1rem;color:red;">Failed to load orders.</p>'; return; }

    const orders = data.orders || [];
    lastCustomerOrders = orders;
    if (orders.length === 0) {
      body.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <h3>No orders placed yet</h3>
          <p>Start shopping to see your live order tracking here!</p>
          <button class="btn-primary" style="margin:1rem auto 0;justify-content:center;" onclick="closeOrdersDrawer();document.getElementById('products').scrollIntoView({behavior:'smooth'});">Shop Fresh Produce</button>
        </div>`;
      return;
    }

    renderOrdersListSilently(orders);
  } catch (error) {
    console.error("Error parsing orders:", error);
    body.innerHTML = `
      <div style="text-align:center;padding:2rem;">
        <p style="color:red;margin-bottom:1rem;">An error occurred while loading orders.</p>
        <button class="btn-outline" onclick="loadOrders()">Retry</button>
      </div>`;
  }
}

function renderOrdersListSilently(orders) {
  const body = document.getElementById('ordersBody');
  if (!body) return;
  body.innerHTML = orders.map(o => {
    const statusClass = `status-${o.status}`;
    let statusLabel = capitalize(o.status);
    if (o.status === 'pending') statusLabel = '🟡 Pending';
    else if (o.status === 'delivered') statusLabel = '🟢 Delivered';
    else if (o.status === 'confirmed') statusLabel = '🔵 Confirmed';
    else if (o.status === 'shipped' || o.status === 'out_for_delivery') statusLabel = '🚚 Out for Delivery';
    else if (o.status === 'cancelled') statusLabel = '❌ Cancelled';
    
    let dateStr = "Unknown Date";
    try {
      if (o.createdAt) {
        dateStr = new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch (e) { dateStr = String(o.createdAt); }

    const orderIdStr = String(o._id || o.id || "");
    const shortId = orderIdStr.slice(-8).toUpperCase();

    const items = Array.isArray(o.items) ? o.items : [];
    const images = items.slice(0, 3).map(item =>
      `<img src="${getProductImg(item)}" alt="${item.name}" class="order-item-thumb" onerror="this.style.display='none'" />`
    ).join('');

    return `
      <div class="order-card" onclick="openOrderDetailsModal('${orderIdStr}')" style="cursor:pointer; transition:transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 15px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='none';this.style.boxShadow='0 1px 4px rgba(0,0,0,0.05)';">
        <div class="order-header">
          <div>
            <div class="order-id">Order #${shortId}</div>
            <div class="order-date">${dateStr}</div>
          </div>
          <span class="order-status ${statusClass}" style="transition: opacity 0.4s ease, background-color 0.5s ease, color 0.5s ease;">${statusLabel}</span>
        </div>
        <div class="order-items-preview">${images}</div>
        <div style="font-size:0.85rem;color:var(--gray-700);margin-bottom:0.75rem;">
          ${items.map(i => `${i.name} (${i.quantity} ${i.unit || 'kg'})`).join(', ')}
        </div>
        <div class="order-footer" onclick="event.stopPropagation()">
          <div>
            <div class="order-total">₹${o.totalAmount + (o.deliveryFee || 40)}</div>
          </div>
          ${o.status !== 'cancelled' && o.status !== 'delivered' ?
            `<button class="btn-outline" style="padding:0.3rem 0.8rem;border-color:var(--red-500);color:var(--red-500);font-size:0.8rem;" onclick="cancelOrder('${orderIdStr}')">Cancel</button>` : ''}
        </div>
      </div>`;
  }).join('');
}

async function cancelOrder(orderId) {
  if (!confirm('Are you sure you want to cancel this order?')) return;
  const data = await apiRequest(`/api/orders/${orderId}/cancel`, { method: 'PUT' });
  if (!data.success) return showToast(data.message, 'error');
  showToast('Order cancelled');
  loadOrders();
}

/* ══════════════════════════════════════════
   ORDER DETAILS MODAL (PREMIUM TRACKING UI)
══════════════════════════════════════════ */
function closeOrderDetailsModal() {
  const modal = document.getElementById('orderDetailsModal');
  if (modal) modal.remove();
}

async function openOrderDetailsModal(orderId) {
  // Show loading overlay
  closeOrdersDrawer();
  const loadingHtml = `<div id="orderDetailsModal" class="modal-overlay open" style="z-index: 99999;">
    <div class="modal" style="text-align:center;padding:3rem;">
      <div class="spinner"></div>
      <p style="margin-top:1rem;color:var(--gray-500);">Fetching live updates...</p>
      <button class="btn-outline" style="margin-top:1rem;" onclick="closeOrderDetailsModal()">Cancel</button>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', loadingHtml);

  try {
    const data = await apiRequest(`/api/orders`);
    if (!data.success) throw new Error('Failed to fetch orders');
    const order = data.orders.find(o => String(o._id || o.id) === String(orderId));
    if (!order) throw new Error('Order not found');
    
    renderOrderDetailsModal(order);
  } catch (error) {
    document.getElementById('orderDetailsModal').innerHTML = `
      <div class="modal" style="text-align:center;padding:3rem;">
        <p style="color:var(--red-500);margin-bottom:1rem;">Failed to load order details.</p>
        <button class="btn-outline" onclick="closeOrderDetailsModal()">Close</button>
      </div>
    `;
  }
}

function renderOrderDetailsModal(order) {
  const modal = document.getElementById('orderDetailsModal');
  if (modal) modal.setAttribute('data-order-id', String(order._id || order.id));
  
  const shortId = String(order._id || order.id).slice(-8).toUpperCase();
  const total = order.totalAmount + (order.deliveryFee || 40);
  const status = (order.status || 'pending').toLowerCase();
  
  const statuses = ['pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered'];
  let currentStep = statuses.indexOf(status);
  // Default to pending if unknown status
  if (currentStep === -1) currentStep = 0;
  // If cancelled, show unique UI
  const isCancelled = status === 'cancelled';

  const itemsHtml = (order.items || []).map(item => `
    <div style="display:flex;align-items:center;margin-bottom:1rem;background:var(--gray-50);padding:0.75rem;border-radius:10px;">
      <img src="${getProductImg(item)}" style="width:50px;height:50px;border-radius:8px;object-fit:cover;margin-right:1rem;" onerror="this.style.display='none'"/>
      <div style="flex:1;">
        <div style="font-weight:600;color:var(--gray-800);">${item.name}</div>
        <div style="font-size:0.8rem;color:var(--gray-500);">${item.quantity} ${item.unit || 'kg'}</div>
      </div>
      <div style="font-weight:700;color:var(--primary-color);">₹${item.price * item.quantity}</div>
    </div>
  `).join('');

  let trackerHtml = '';
  if (isCancelled) {
    trackerHtml = `
      <div style="text-align:center;padding:1.5rem;background:#fee2e2;border-radius:12px;color:#991b1b;font-weight:600;">
        🚫 This order has been cancelled.
      </div>
    `;
  } else {
    trackerHtml = `
      <div class="timeline" style="display:flex;justify-content:space-between;position:relative;margin:2rem 0;">
        <div style="position:absolute;top:15px;left:5%;right:5%;height:4px;background:var(--gray-200);z-index:1;"></div>
        <div style="position:absolute;top:15px;left:5%;width:${(currentStep/(statuses.length-1))*90}%;height:4px;background:var(--primary-color);z-index:2;transition:width 0.5s ease-in-out;"></div>
        
        ${statuses.map((s, i) => {
          const isActive = i <= currentStep;
          const isCurrent = i === currentStep;
          const labels = {
            'pending': 'Placed',
            'confirmed': 'Confirmed',
            'packed': 'Packed',
            'out_for_delivery': 'Out for Delivery',
            'delivered': 'Delivered'
          };
          const emojis = {
            'pending': '🟡',
            'confirmed': '🔵',
            'packed': '🟣',
            'out_for_delivery': '🟠',
            'delivered': '🟢'
          };
          return `
            <div style="position:relative;z-index:3;text-align:center;width:60px;">
              <div style="width:34px;height:34px;border-radius:50%;margin:0 auto 0.5rem;background:${isActive ? 'var(--primary-color)' : 'var(--white)'};border:3px solid ${isActive ? 'var(--primary-color)' : 'var(--gray-300)'};display:flex;align-items:center;justify-content:center;color:${isActive ? 'white' : 'transparent'};box-shadow:${isCurrent ? '0 0 0 4px rgba(34,197,94,0.2)' : 'none'};transition:all 0.3s;">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="3" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <div style="font-size:0.7rem;font-weight:${isActive ? '700' : '500'};color:${isActive ? 'var(--gray-800)' : 'var(--gray-400)'};line-height:1.2;">
                ${emojis[s]}<br/>${labels[s]}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  modal.innerHTML = `
    <div class="modal" style="max-width:600px;width:95%;max-height:90vh;overflow-y:auto;padding:2rem;">
      <button class="close-modal" onclick="closeOrderDetailsModal()" style="position:absolute;right:1rem;top:1rem;background:none;border:none;font-size:1.5rem;cursor:pointer;">&times;</button>
      
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;border-bottom:1px solid var(--gray-200);padding-bottom:1rem;">
        <div>
          <h2 style="font-size:1.4rem;color:var(--gray-900);">Order #${shortId}</h2>
          <p style="font-size:0.85rem;color:var(--gray-500);">Placed on ${new Date(order.createdAt).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'})}</p>
        </div>
        <div style="font-size:1.5rem;font-weight:800;color:var(--primary-color);">₹${total}</div>
      </div>

      ${trackerHtml}

      <div style="margin-top:2rem;">
        <h4 style="margin-bottom:1rem;color:var(--gray-800);border-left:4px solid var(--primary-color);padding-left:8px;">Items</h4>
        ${itemsHtml}
      </div>

      <div style="margin-top:1.5rem;background:var(--gray-50);padding:1.5rem;border-radius:12px;display:flex;gap:2rem;">
        <div style="flex:1;">
          <h5 style="color:var(--gray-500);font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:0.5rem;">Shipping Details</h5>
          <p style="font-size:0.9rem;color:var(--gray-800);line-height:1.5;">
            ${order.shippingAddress || 'No address provided'}
          </p>
        </div>
        <div style="flex:1;">
          <h5 style="color:var(--gray-500);font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:0.5rem;">Payment Method</h5>
          <p style="font-size:0.9rem;color:var(--gray-800);font-weight:600;">
            ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
          </p>
        </div>
      </div>

      <div style="margin-top:2rem;display:flex;gap:1rem;justify-content:center;">
        ${(order.status === 'shipped' || order.status === 'out_for_delivery' || order.status === 'confirmed') ? `
          <button class="btn-primary" style="flex:1;background:#2E7D32;border-color:#2E7D32;justify-content:center;" onclick="confirmCustomerDelivery('${String(order._id || order.id)}')">
            ✅ Confirm Delivery Received
          </button>
        ` : ''}
        <button class="btn-outline" onclick="closeOrderDetailsModal()" style="flex:1;justify-content:center;">Close details</button>
      </div>
    </div>
  `;
}

async function confirmCustomerDelivery(orderId) {
  if (!confirm('Have you received your fresh produce order in good condition?')) return;
  const data = await apiRequest(`/api/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'delivered' })
  });
  if (!data.success) return showToast(data.message, 'error');
  showToast('Order confirmed as delivered! 📦🎉', 'success');
  closeOrderDetailsModal();
  if (typeof loadOrders === 'function') loadOrders();
}

/* ══════════════════════════════════════════
   CONTACT FORM
══════════════════════════════════════════ */
function submitContactForm(e) {
  e.preventDefault();
  const name = document.getElementById('contactName').value;
  const email = document.getElementById('contactEmail').value;
  const subject = document.getElementById('contactSubject').value;
  const message = document.getElementById('contactMessage').value;

  if (!name || !email || !subject || !message) return showToast('Please fill all fields', 'warning');
  showToast(`Thank you ${name}! We'll get back to you within 24 hours. 📧`);
  document.getElementById('contactForm').reset();
}

/* ══════════════════════════════════════════
   STATS COUNTER ANIMATION
══════════════════════════════════════════ */
function initCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target);
      let start = 0;
      const duration = 2000;
      const step = target / (duration / 16);
      const timer = setInterval(() => {
        start = Math.min(start + step, target);
        el.textContent = Math.floor(start).toLocaleString('en-IN') + '+';
        if (start >= target) clearInterval(timer);
      }, 16);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => observer.observe(c));
}

/* ══════════════════════════════════════════
   SCROLL REVEAL ANIMATION
══════════════════════════════════════════ */
function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 0.1}s`;
    observer.observe(el);
  });
}

/* ══════════════════════════════════════════
   AI VOICE ASSISTANT
══════════════════════════════════════════ */
function toggleVoicePanel() {
  voicePanelOpen = !voicePanelOpen;
  const panel = document.getElementById('voicePanel');
  panel.classList.toggle('open', voicePanelOpen);
  if (voicePanelOpen) {
    const chat = document.getElementById('voiceChat');
    if (chat.children.length === 0) {
      addVoiceMsg('bot', "నమస్తే! Farmigo కి స్వాగతం.\n\nమీరు Telugu లో మాట్లాడవచ్చు:\n• \"Vegetables chupinchu\"\n• \"Tomatoes kavali\"\n• \"Cart open cheyi\"\n• \"Farmer login\"\n• \"Help cheyi\"");
    }
  }
}

function closeVoicePanel() {
  voicePanelOpen = false;
  document.getElementById('voicePanel').classList.remove('open');
  if (isListening) stopListening();
  window.speechSynthesis && window.speechSynthesis.cancel();
}

function setVoiceLang() {
  if (isListening) { stopListening(); startListening(); }
}

function addVoiceMsg(type, text) {
  const chat = document.getElementById('voiceChat');
  const div = document.createElement('div');
  div.className = `voice-msg voice-msg-${type}`;
  div.innerHTML = text.replace(/\n/g, '<br>');
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function setVoiceStatus(status) {
  const el = document.getElementById('voiceStatusText');
  const mic = document.getElementById('voiceMicMain');
  const viz = document.getElementById('voiceVisualizer');
  const fab = document.getElementById('voiceFabBtn');
  if (!el) return;
  if (status === 'listening') {
    el.textContent = 'Listening...';
    mic && (mic.style.background = '#ef4444');
    viz && viz.classList.add('active');
    fab && fab.classList.add('listening');
  } else if (status === 'processing') {
    el.textContent = 'Processing...';
    mic && (mic.style.background = '#f59e0b');
    viz && viz.classList.remove('active');
    fab && fab.classList.remove('listening');
  } else if (status === 'speaking') {
    el.textContent = 'Speaking...';
    mic && (mic.style.background = '#16a34a');
    viz && viz.classList.add('active');
    fab && fab.classList.remove('listening');
  } else {
    el.textContent = 'Click mic to speak';
    mic && (mic.style.background = '');
    viz && viz.classList.remove('active');
    fab && fab.classList.remove('listening');
  }
}

function speak(text, onDone) {
  if (!window.speechSynthesis) { onDone && onDone(); return; }
  window.speechSynthesis.cancel();
  const lang = document.getElementById('voiceLang') ? document.getElementById('voiceLang').value : 'en-IN';
  const cleanText = text.replace(/[\u{1F300}-\u{1FFFF}]/gu, '').replace(/[\u2600-\u27FF]/g, '').trim();
  const utt = new SpeechSynthesisUtterance(cleanText);
  utt.lang = lang;
  utt.rate = 0.92;
  utt.pitch = 1.05;
  utt.volume = 1;
  setVoiceStatus('speaking');
  utt.onend = () => { setVoiceStatus('idle'); onDone && onDone(); };
  utt.onerror = () => { setVoiceStatus('idle'); onDone && onDone(); };
  window.speechSynthesis.speak(utt);
}

/* ─── Voice Engine State (module-level so it persists across restarts) ───── */
let _voiceRetryCount    = 0;
let _voiceSilenceCount  = 0;
let _voiceUserStopped   = false;
const MAX_NETWORK_RETRIES  = 8;
const MAX_SILENCE_RESTARTS = 6;

function _resetVoiceCounters() {
  _voiceRetryCount   = 0;
  _voiceSilenceCount = 0;
  _voiceUserStopped  = false;
}

function toggleListening() {
  if (isListening) stopListening();
  else startListening();
}

function startListening() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    addVoiceMsg('bot', '⚠️ Voice recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
    setVoiceStatus('idle');
    return;
  }
  if (isListening) return;

  _resetVoiceCounters();

  if (window.speechSynthesis && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    setTimeout(_doStartRecognition, 400);
  } else {
    _doStartRecognition();
  }
}

function _doStartRecognition() {
  if (_voiceUserStopped || isListening) return;

  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) return;

  if (recognition) {
    try { recognition.abort(); } catch(e) {}
    recognition = null;
  }

  recognition = new SpeechRec();
  const langEl = document.getElementById('voiceLang');
  recognition.lang            = langEl ? langEl.value : 'en-IN';
  recognition.continuous      = true;
  recognition.interimResults  = false;
  recognition.maxAlternatives = 1;

  let resultReceived = false;

  /* ── onstart ── */
  recognition.onstart = () => {
    isListening    = true;
    resultReceived = false;
    setVoiceStatus('listening');
    console.log('[Voice] Recognition started | lang:', recognition.lang);
  };

  /* ── onresult ── */
  recognition.onresult = (event) => {
    const idx = event.results.length - 1;
    if (!event.results[idx].isFinal) return;
    const transcript = event.results[idx][0].transcript.toLowerCase().trim();
    if (!transcript) return;

    resultReceived = true;
    console.log('[Voice] Transcript:', transcript);
    setVoiceStatus('processing');
    addVoiceMsg('user', transcript);

    const rec = recognition;
    isListening = false;
    recognition = null;
    try { rec.stop(); } catch(e) {}

    processVoiceCommand(transcript);
  };

  /* ── onerror ── */
  recognition.onerror = (event) => {
    const err = event.error;
    console.warn('[Voice] Error:', err, '| retries:', _voiceRetryCount, '| silences:', _voiceSilenceCount);
    isListening = false;
    recognition = null;

    switch (err) {
      case 'not-allowed':
      case 'service-not-allowed':
        addVoiceMsg('bot', '🔒 Microphone permission denied. Please click the lock icon in your browser address bar, allow microphone, then refresh and try again.');
        _voiceUserStopped = true;
        setVoiceStatus('idle');
        break;

      case 'audio-capture':
        addVoiceMsg('bot', '🎤 No microphone found. Please connect a microphone and try again.');
        _voiceUserStopped = true;
        setVoiceStatus('idle');
        break;

      case 'network':
        _voiceRetryCount++;
        if (_voiceRetryCount <= MAX_NETWORK_RETRIES) {
          const delay = Math.min(500 * _voiceRetryCount, 3000);
          console.log(`[Voice] Network error – retrying in ${delay}ms (attempt ${_voiceRetryCount}/${MAX_NETWORK_RETRIES})`);
          setVoiceStatus('listening');
          setTimeout(_doStartRecognition, delay);
        } else {
          addVoiceMsg('bot',
            '🌐 Cannot reach the speech service. This usually means:\n' +
            '• You are on http:// — Chrome requires https:// for speech on non-localhost origins\n' +
            '• The Google Speech server is temporarily unavailable\n\n' +
            'Try: Open Chrome in Incognito mode, or switch to https://, then click the mic again.');
          setVoiceStatus('idle');
        }
        break;

      case 'no-speech':
        _voiceSilenceCount++;
        if (_voiceSilenceCount <= MAX_SILENCE_RESTARTS) {
          setTimeout(_doStartRecognition, 200);
        } else {
          addVoiceMsg('bot', '🤫 I didn\'t hear anything. Click the mic again when you\'re ready to speak.');
          setVoiceStatus('idle');
        }
        break;

      case 'aborted':
        setVoiceStatus('idle');
        break;

      default:
        console.warn('[Voice] Unhandled error:', err);
        setVoiceStatus('idle');
        break;
    }
  };

  /* ── onend ── */
  recognition.onend = () => {
    console.log('[Voice] onend | wasListening:', isListening, '| userStopped:', _voiceUserStopped);
    const wasListening = isListening;
    isListening = false;
    recognition = null;

    if (_voiceUserStopped || resultReceived) {
      setVoiceStatus('idle');
      return;
    }

    if (wasListening) {
      _voiceSilenceCount++;
      if (_voiceSilenceCount <= MAX_SILENCE_RESTARTS) {
        console.log('[Voice] Restarting after unexpected end (silence', _voiceSilenceCount, ')');
        setTimeout(_doStartRecognition, 250);
      } else {
        addVoiceMsg('bot', '🤫 I didn\'t catch that. Click the mic and speak clearly.');
        setVoiceStatus('idle');
      }
    } else {
      setVoiceStatus('idle');
    }
  };

  /* ── Start ── */
  try {
    recognition.start();
    console.log('[Voice] recognition.start() called');
  } catch (e) {
    console.error('[Voice] start() threw:', e);
    isListening = false;
    recognition = null;
    if (_voiceRetryCount < 3) {
      _voiceRetryCount++;
      setTimeout(_doStartRecognition, 500);
    } else {
      addVoiceMsg('bot', '⚠️ Could not start the microphone. Please refresh the page and try again.');
      setVoiceStatus('idle');
    }
  }
}

function stopListening() {
  _voiceUserStopped = true;
  isListening = false;
  if (recognition) {
    try { recognition.stop(); } catch(e) {}
    recognition = null;
  }
  setVoiceStatus('idle');
}

function doStartRecognition() { _doStartRecognition(); }


/* ══════════════════════════════════════════
   ADVANCED AI VOICE ASSISTANT – NLP ENGINE
   Supports: English | Telugu | Tanglish
══════════════════════════════════════════ */

// ── Telugu → Concept dictionary ──────────────────────────────────────────────
const TELUGU_MAP = {
  // Greetings
  'namaste': 'hello', 'vanakkam': 'hello', 'bagunara': 'hello',
  // Actions
  'chupinchu': 'show', 'chupinchandi': 'show', 'open cheyi': 'open',
  'open cheyyi': 'open', 'open cheyyandi': 'open', 'teesukellu': 'open',
  'vellali': 'go', 'vellu': 'go', 'vellandi': 'go',
  'kavali': 'want', 'kaavali': 'want',
  'vethukonu': 'search', 'vethukutu': 'search', 'vethikipettandi': 'search',
  'cheyyi': 'do', 'cheyandi': 'do', 'cheyi': 'do', 'cheyali': 'do',
  'logout cheyi': 'logout', 'logout avu': 'logout', 'bayatapadu': 'logout',
  'register avvali': 'register', 'register cheyi': 'register',
  'em unnayo': 'show all', 'em unnayi': 'show all', 'enti': 'what is',
  'order cheyali': 'order', 'order cheyi': 'order',
  'nunchi': 'from', 'ki': 'to', 'lo': 'in',
  // Products & Categories
  'kuragaralu': 'vegetables', 'kooragaayalu': 'vegetables', 'kooragayalu': 'vegetables',
  'palakura': 'spinach', 'tomato': 'tomato', 'vankaya': 'brinjal',
  'beerakaya': 'ridge gourd', 'bendakaya': 'okra', 'potlakaya': 'snake gourd',
  'carrot': 'carrot', 'cabbagey': 'cabbage',
  'pandlu': 'fruits', 'pallu': 'fruits',
  'mangoes': 'mango', 'mamidipandlu': 'mango', 'aandam': 'mango',
  'annam': 'rice', 'biyyam': 'rice', 'biyyapu': 'rice',
  'pappu': 'dal', 'pesarapappu': 'moong dal', 'kandipappu': 'toor dal',
  'verusenaga': 'groundnut', 'pallilu': 'groundnuts', 'palli': 'groundnuts',
  'jeedi pappu': 'cashew', 'jeedipappu': 'cashew', 'badam': 'almond',
  'endu pandlu': 'dry fruits', 'endupandlu': 'dry fruits',
  'miriyalu': 'pepper', 'karam': 'spices', 'masala': 'spices',
  // Navigation keywords
  'cart': 'cart', 'kart': 'cart', 'basket': 'cart',
  'wishlist': 'wishlist', 'saved': 'wishlist',
  'orders': 'orders', 'ordarlu': 'orders',
  'profile': 'profile', 'settings': 'settings',
  'home': 'home', 'illu': 'home',
  'farmer': 'farmer', 'rythu': 'farmer',
  'customer': 'customer', 'kొనుgoलु': 'customer',
  'government': 'government', 'schemes': 'schemes', 'yojana': 'schemes',
  'analytics': 'analytics', 'weather': 'weather', 'varsha': 'weather',
  'predictor': 'predictor', 'demand': 'demand',
  // General question words
  'ela': 'how', 'evarike': 'who', 'emi': 'what', 'deniki': 'why', 'enduku': 'why',
  'website': 'website', 'farmigo': 'farmigo', 'ante': 'means',
  'help cheyi': 'help', 'sahayam': 'help',
};

// ── Normalize: convert Telugu phrases to English concepts ───────────────────
function normalizeToEnglish(raw) {
  let s = raw.toLowerCase().trim();
  // Multi-word replacements first
  const multiWords = Object.keys(TELUGU_MAP).filter(k => k.includes(' ')).sort((a,b) => b.length - a.length);
  for (const key of multiWords) {
    s = s.split(key).join(TELUGU_MAP[key]);
  }
  // Single-word replacements
  const words = s.split(/s+/);
  const mapped = words.map(w => TELUGU_MAP[w] || w);
  return mapped.join(' ');
}

// ── Intent definitions with keyword sets and responses ─────────────────────
const INTENTS = [
  // ── GREETINGS ──────────────────────────────────────────────────────────────
  {
    id: 'greeting',
    keywords: ['hello','hi','hey','namaste','vanakkam','bagunara','good morning','good evening'],
    telugu: ['namaste','vanakkam','bagunara','hello'],
    response: () => currentUser
      ? `నమస్తే ${currentUser.name}! మీకు ఎలా సహాయం చేయగలను?`
      : 'నమస్తే! Farmigo కి స్వాగతం. మీకు ఎలా సహాయం చేయగలను?',
    action: null,
  },

  // ── HELP ───────────────────────────────────────────────────────────────────
  {
    id: 'help',
    keywords: ['help','what can you do','commands','assist','sahayam','help cheyi','voice assistant help'],
    telugu: ['help','sahayam','ela'],
    response: () => 'నేను మీకు సహాయం చేయగలను! మీరు చెప్పవచ్చు: "vegetables chupinchu", "tomatoes kavali", "cart open cheyi", "farmer login", "register cheyi", లేదా ఏదైనా product పేరు చెప్పండి.',
    action: null,
  },

  // ── ABOUT / FAQ ─────────────────────────────────────────────────────────────
  {
    id: 'about_farmigo',
    keywords: ['farmigo','website','deniki','what is farmigo','farmigo ante','platform','ee website'],
    telugu: ['farmigo','website','deniki','ante'],
    response: () => 'Farmigo అనేది direct farmer-to-customer marketplace. Farmers తమ fresh produce ని directly customers కి అమ్ముతారు — middlemen లేకుండా, fair prices తో.',
    action: null,
  },
  {
    id: 'how_to_order',
    keywords: ['order','ela order','how to order','ela konali','purchase','buy','konugovadam'],
    telugu: ['order','ela','konali','konugovadam'],
    response: () => 'Order చేయడం చాలా easy! Products browse చేసి, cart కి add చేయండి, తర్వాత checkout చేయండి. Account లేకుంటే register cheyyandi.',
    action: null,
  },
  {
    id: 'how_to_register',
    keywords: ['how to register','ela register','register avvali','ela account create','create account how'],
    telugu: ['ela','register','account','create'],
    response: () => 'Register అవ్వడానికి పైన Login button నొక్కి, Register tab select చేయండి. మీ details fill చేసి submit చేయండి.',
    action: () => { openAuthModal(); },
  },
  {
    id: 'how_farmer_upload',
    keywords: ['farmer upload','products upload','ela products','farmer ela','add product how','upload cheyyadam'],
    telugu: ['farmer','ela','products','upload','add'],
    response: () => 'Farmer గా products add చేయడానికి, Farmer Dashboard లో My Products section కి వెళ్ళి "+ Add Product" button నొక్కండి.',
    action: null,
  },

  // ── CATEGORIES ─────────────────────────────────────────────────────────────
  {
    id: 'cat_vegetables',
    keywords: ['vegetable','vegetables','kuragaralu','kooragaayalu','sabzi','greens','veggies','em unnayo kuragaralu'],
    telugu: ['kuragaralu','kooragaayalu','sabzi','vegetables','veggies'],
    response: () => 'సరే. ప్రస్తుతం అందుబాటులో ఉన్న కూరగాయలను చూపిస్తున్నాను.',
    action: () => { filterByCategory('vegetables'); scrollToProducts(); },
  },
  {
    id: 'cat_fruits',
    keywords: ['fruit','fruits','pandlu','pallu','fresh fruits','em unnayi fruits'],
    telugu: ['pandlu','pallu','fruits'],
    response: () => 'సరే. అందుబాటులో ఉన్న తాజా పండ్లను చూపిస్తున్నాను.',
    action: () => { filterByCategory('fruits'); scrollToProducts(); },
  },
  {
    id: 'cat_grains',
    keywords: ['grain','grains','rice','annam','biyyam','wheat','biyyapu'],
    telugu: ['annam','biyyam','biyyapu','grains'],
    response: () => 'సరే. Grains & Rice products చూపిస్తున్నాను.',
    action: () => { filterByCategory('grains'); scrollToProducts(); },
  },
  {
    id: 'cat_pulses',
    keywords: ['pulse','pulses','dal','pappu','lentil','lentils','pesarapappu','kandipappu'],
    telugu: ['pappu','pesarapappu','kandipappu','dal','pulses'],
    response: () => 'సరే. Pulses & Dals చూపిస్తున్నాను.',
    action: () => { filterByCategory('pulses'); scrollToProducts(); },
  },
  {
    id: 'cat_dry_fruits',
    keywords: ['dry fruit','dry fruits','endu pandlu','endupandlu','badam','almond','cashew','jeedipappu','kismis','dates'],
    telugu: ['endupandlu','endu pandlu','jeedipappu','badam'],
    response: () => 'సరే. Dry Fruits చూపిస్తున్నాను.',
    action: () => { filterByCategory('dry fruits'); scrollToProducts(); },
  },
  {
    id: 'cat_spices',
    keywords: ['spice','spices','miriyalu','karam','masala','turmeric','pasupu','jeelakarra'],
    telugu: ['miriyalu','karam','masala','pasupu','spices'],
    response: () => 'సరే. Spices & Masala products చూపిస్తున్నాను.',
    action: () => { filterByCategory('spices'); scrollToProducts(); },
  },
  {
    id: 'cat_dry_fruits',
    keywords: ['dry fruit', 'dry fruits', 'cashew', 'almond', 'pistachio', 'walnut', 'dates', 'raisins', 'dried figs'],
    telugu: ['dry fruits', 'jeedipappu', 'badam'],
    response: () => 'Sure. Showing Dry Fruits products.',
    action: () => { filterByCategory('dry fruits'); scrollToProducts(); },
  },

  // ── PRODUCT SEARCHES ────────────────────────────────────────────────────────
  {
    id: 'search_tomato',
    keywords: ['tomato','tomatoes','tamata'],
    response: () => 'సరే. Tomato products వెతుకుతున్నాను.',
    action: () => { doSearch('Tomato'); },
  },
  {
    id: 'search_onion',
    keywords: ['onion','onions','ulli','pyaz','ullipaya'],
    response: () => 'సరే. Onion products చూపిస్తున్నాను.',
    action: () => { doSearch('Onion'); },
  },
  {
    id: 'search_potato',
    keywords: ['potato','potatoes','aloo','bangaladumpa'],
    response: () => 'సరే. Potato products చూపిస్తున్నాను.',
    action: () => { doSearch('Potato'); },
  },
  {
    id: 'search_carrot',
    keywords: ['carrot','carrots','gajar'],
    response: () => 'సరే. Carrot products వెతుకుతున్నాను.',
    action: () => { doSearch('Carrot'); },
  },
  {
    id: 'search_rice',
    keywords: ['rice','annam','biyyam','chawal'],
    response: () => 'సరే. Rice products చూపిస్తున్నాను.',
    action: () => { doSearch('Rice'); },
  },
  {
    id: 'search_mango',
    keywords: ['mango','mangoes','mamidi','mamidipandlu','aam'],
    response: () => 'సరే. Mango products వెతుకుతున్నాను.',
    action: () => { doSearch('Mango'); },
  },
  {
    id: 'search_cashew',
    keywords: ['cashew','cashews','jeedipappu','jeedi'],
    response: () => 'సరే. Cashew products చూపిస్తున్నాను.',
    action: () => { doSearch('Cashew'); },
  },
  {
    id: 'search_almond',
    keywords: ['almond','almonds','badam'],
    response: () => 'సరే. Almond products వెతుకుతున్నాను.',
    action: () => { doSearch('Almond'); },
  },
  {
    id: 'search_groundnut',
    keywords: ['groundnut','groundnuts','peanut','peanuts','pallilu','palli','verusenaga'],
    response: () => 'సరే. Groundnut products చూపిస్తున్నాను.',
    action: () => { doSearch('Groundnut'); },
  },
  {
    id: 'search_spinach',
    keywords: ['spinach','palakura','palak'],
    response: () => 'సరే. Spinach products వెతుకుతున్నాను.',
    action: () => { doSearch('Spinach'); },
  },
  {
    id: 'search_apple',
    keywords: ['apple','apples','seb'],
    response: () => 'సరే. Apple products చూపిస్తున్నాను.',
    action: () => { doSearch('Apple'); },
  },
  {
    id: 'search_banana',
    keywords: ['banana','bananas','arati pandu','aratipandu'],
    response: () => 'సరే. Banana products వెతుకుతున్నాను.',
    action: () => { doSearch('Banana'); },
  },

  // ── NAVIGATION ─────────────────────────────────────────────────────────────
  {
    id: 'nav_home',
    keywords: ['home','home page','main page','top','go home','home ki','illu'],
    telugu: ['home','illu'],
    response: () => 'సరే. Home కి తీసుకువెళ్తున్నాను.',
    action: () => { const el = document.getElementById('home'); el ? el.scrollIntoView({behavior:'smooth'}) : window.scrollTo({top:0,behavior:'smooth'}); },
  },
  {
    id: 'nav_categories',
    keywords: ['categor','categories','category section','shop by category'],
    response: () => 'సరే. Categories section తెరుస్తున్నాను.',
    action: () => { const el = document.getElementById('categories'); if(el) el.scrollIntoView({behavior:'smooth'}); },
  },
  {
    id: 'nav_products',
    keywords: ['products section','all products','product section','marketplace','market','browse products'],
    response: () => 'సరే. Products section తెరుస్తున్నాను.',
    action: () => { scrollToProducts(); },
  },
  {
    id: 'nav_features',
    keywords: ['feature','features','features section'],
    response: () => 'సరే. Features section తెరుస్తున్నాను.',
    action: () => { const el = document.getElementById('features'); if(el) el.scrollIntoView({behavior:'smooth'}); },
  },
  {
    id: 'nav_contact',
    keywords: ['contact','contact us','contact section','reach us','mail','phone'],
    telugu: ['contact'],
    response: () => 'సరే. Contact section కి వెళ్తున్నాను.',
    action: () => { const el = document.getElementById('contact'); if(el) el.scrollIntoView({behavior:'smooth'}); },
  },
  {
    id: 'nav_about',
    keywords: ['about','about us','about farmigo','about section','company'],
    telugu: ['about'],
    response: () => 'సరే. About section తెరుస్తున్నాను.',
    action: () => { const el = document.getElementById('about'); if(el) el.scrollIntoView({behavior:'smooth'}); },
  },

  // ── CART ───────────────────────────────────────────────────────────────────
  {
    id: 'open_cart',
    keywords: ['cart','basket','shopping bag','my cart','open cart','cart open','kart'],
    telugu: ['cart','basket'],
    response: () => 'సరే. మీ Cart తెరుస్తున్నాను.',
    action: () => { openCart(); },
  },

  // ── WISHLIST ───────────────────────────────────────────────────────────────
  {
    id: 'open_wishlist',
    keywords: ['wishlist','wish list','saved','saved items','favorites','heart','liked'],
    telugu: ['wishlist','saved'],
    response: () => 'సరే. మీ Wishlist తెరుస్తున్నాను.',
    action: () => { openWishlist(); },
  },

  // ── ORDERS ─────────────────────────────────────────────────────────────────
  {
    id: 'open_orders',
    keywords: ['orders','my orders','order history','purchase','bought','ordarlu','order cheyali'],
    telugu: ['orders','ordarlu'],
    response: () => 'సరే. మీ Orders తెరుస్తున్నాను.',
    action: () => { if(typeof openOrdersDrawer === 'function') openOrdersDrawer(); },
  },

  // ── PROFILE ────────────────────────────────────────────────────────────────
  {
    id: 'open_profile',
    keywords: ['profile','my profile','account','my account','personal details'],
    telugu: ['profile','account'],
    response: () => 'సరే. Profile తెరుస్తున్నాను.',
    action: () => { if(typeof openProfileModal === 'function') openProfileModal(); },
  },

  // ── AUTH ───────────────────────────────────────────────────────────────────
  {
    id: 'farmer_login',
    keywords: ['farmer login','farmer dashboard','farmer portal','rythu login','go to farmer','farmer ki vellali'],
    telugu: ['farmer','rythu','login'],
    score_boost: ['farmer'],
    response: () => 'సరే. Farmer Dashboard తెరుస్తున్నాను.',
    action: () => { window.location.href = '/farmer-dashboard.html'; },
  },
  {
    id: 'register',
    keywords: ['register','sign up','create account','new account','account create','register avvali','register cheyi'],
    telugu: ['register','account','create'],
    response: () => 'సరే. Registration page తెరుస్తున్నాను.',
    action: () => { openAuthModal(); setTimeout(() => { const t = document.querySelector('[onclick*="register"]'); if(t) t.click(); }, 300); },
  },
  {
    id: 'login',
    keywords: ['login','sign in','customer login','log in','enter account','signin'],
    telugu: ['login'],
    response: () => 'సరే. Login page తెరుస్తున్నాను.',
    action: () => { openAuthModal(); },
  },
  {
    id: 'logout',
    keywords: ['logout','log out','sign out','exit','bayatapadu','logout cheyi','logout avu','signout'],
    telugu: ['logout','bayatapadu'],
    response: () => 'సరే. మిమ్మల్ని సురక్షితంగా logout చేస్తున్నాను.',
    action: () => { if(typeof logoutUser === 'function') logoutUser(); else { removeToken(); currentUser = null; window.location.reload(); } },
  },

  // ── GOVERNMENT SCHEMES ─────────────────────────────────────────────────────
  {
    id: 'schemes',
    keywords: ['government scheme','schemes','yojana','subsidy','pm kisan','fasal bima','kcc','soil health','enam'],
    telugu: ['government','schemes','yojana'],
    response: () => 'సరే. Government Schemes తెరుస్తున్నాను.',
    action: () => { window.location.href = '/farmer-dashboard.html'; },
  },
];

// ── Utility: scroll to products ────────────────────────────────────────────
function scrollToProducts() {
  const el = document.getElementById('products');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// ── Utility: search and show products ─────────────────────────────────────
function doSearch(term) {
  const si = document.getElementById('productsSearch');
  const hi = document.getElementById('heroSearchInput');
  if (si) si.value = term;
  if (hi) hi.value = term;
  currentSearch = term;
  fetchProducts();
  scrollToProducts();
}

// ── Extract generic search term from query ─────────────────────────────────
function extractSearchTerm(raw) {
  // Patterns like "search for X", "find X", "X kavali", "X chupinchu", "X show me"
  let s = raw.toLowerCase();
  const patterns = [
    /search for (.+)/i, /search (.+)/i,
    /find (.+)/i, /look for (.+)/i,
    /(.+?) kavali/i, /(.+?) kaavali/i,
    /(.+?) chupinchu/i, /(.+?) chupinchandi/i,
    /(.+?) vethukonu/i, /(.+?) products/i,
    /naku (.+?) kavali/i, /naku (.+?) kaavali/i,
    /(.+?) em unnayo/i, /(.+?) em unnayi/i,
  ];
  for (const p of patterns) {
    const m = s.match(p);
    if (m && m[1]) {
      let term = m[1].trim().replace(/(open|show|cheyi|kavali|chupinchu|products?|available|available|anni)/gi, '').trim();
      if (term.length > 1) return term;
    }
  }
  return null;
}

// ── Intent scoring engine ──────────────────────────────────────────────────
function classifyIntent(raw) {
  const normalized = normalizeToEnglish(raw);
  const combined = (raw + ' ' + normalized).toLowerCase();

  let bestIntent = null;
  let bestScore = 0;

  for (const intent of INTENTS) {
    let score = 0;
    for (const kw of intent.keywords) {
      if (combined.includes(kw.toLowerCase())) {
        score += kw.includes(' ') ? kw.split(' ').length * 2 : 1;
      }
    }
    // Boost for Telugu keywords
    if (intent.telugu) {
      for (const tw of intent.telugu) {
        if (raw.toLowerCase().includes(tw.toLowerCase())) score += 2;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  return bestScore >= 1 ? bestIntent : null;
}

// ── Main command processor ─────────────────────────────────────────────────
function processVoiceCommand(cmd) {
  const raw = cmd;

  // 1. Try intent classification
  const intent = classifyIntent(raw);

  if (intent) {
    const response = typeof intent.response === 'function' ? intent.response() : intent.response;
    const action = typeof intent.action === 'function' ? intent.action : null;
    addVoiceMsg('bot', response);
    speak(response, null);
    if (action) setTimeout(action, 500);
    return;
  }

  // 2. Try generic search extraction (catch-all for "X kavali", "X chupinchu" etc.)
  const searchTerm = extractSearchTerm(raw);
  if (searchTerm && searchTerm.length > 1) {
    const response = `సరే. "${searchTerm}" కోసం వెతుకుతున్నాను.`;
    addVoiceMsg('bot', response);
    speak(response, null);
    setTimeout(() => doSearch(searchTerm), 500);
    return;
  }

  // 3. Fallback
  const fallback = 'అర్థం కాలేదు. దయచేసి మళ్ళీ చెప్పండి. "vegetables chupinchu", "tomatoes kavali", లేదా "help cheyi" అని చెప్పండి.';
  addVoiceMsg('bot', fallback);
  speak(fallback, null);
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
});

function startProductPolling() {
  setInterval(() => {
    if (!document.hidden) fetchProducts();
  }, 30000);
}

async function restoreSession() {
  const token = getToken();
  if (!token) return;

  const data = await apiRequest('/api/auth/me');
  if (!data.success) { removeToken(); return; }

  currentUser = data.user;
  if (currentUser.role === 'farmer') {
    updateNavForUser(currentUser);
    return;
  }
  updateNavForUser(currentUser);
  await loadCart();
  await loadWishlist();
}

/* ══════════════════════════════════════════
   INITIALIZATION
══════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", async () => {
  initCatalogPlaceholder();
  await fetchCatalogProducts();
  const token = getToken();
  if (token) {
    const d = await apiRequest('/api/auth/me');
    if (d.success) { currentUser = d.user; updateNavForUser(currentUser); loadCart(); }
  }
  console.log('%c📦 Farmigo Catalog Page Loaded!', 'color:#f97316;font-size:1.2rem;font-weight:bold;');
});

/* ══════════════════════════════════════════
   REAL-TIME ORDER STATUS POLLING (DEMO FLOW)
══════════════════════════════════════════ */
async function pollCustomerOrders() {
  if (!getToken() || !currentUser) return;
  const drawerOpen = document.getElementById('ordersDrawer') && document.getElementById('ordersDrawer').classList.contains('open');
  const modalOpen = document.getElementById('orderDetailsModal') && document.getElementById('orderDetailsModal').classList.contains('open');
  if (!drawerOpen && !modalOpen) return;

  try {
    const data = await apiRequest('/api/orders');
    if (!data.success) return;
    const orders = data.orders || [];
    
    let statusChanged = false;
    orders.forEach(o => {
      const old = lastCustomerOrders.find(oldO => String(oldO._id || oldO.id) === String(o._id || o.id));
      if (old && old.status !== o.status) {
        statusChanged = true;
      }
    });

    if (statusChanged) {
      if (drawerOpen) {
        const body = document.getElementById('ordersBody');
        if (body) {
          body.style.transition = 'opacity 0.4s ease';
          body.style.opacity = '0';
          setTimeout(() => {
            renderOrdersListSilently(orders);
            body.style.opacity = '1';
          }, 300);
        }
      }
      if (modalOpen) {
        const modal = document.getElementById('orderDetailsModal');
        if (modal) {
          const currentModalId = modal.getAttribute('data-order-id');
          if (currentModalId) {
            const updatedOrder = orders.find(o => String(o._id || o.id) === String(currentModalId));
            if (updatedOrder) {
              modal.style.transition = 'opacity 0.4s ease';
              modal.style.opacity = '0';
              setTimeout(() => {
                renderOrderDetailsModal(updatedOrder);
                modal.style.opacity = '1';
              }, 300);
            }
          }
        }
      }
    }
    lastCustomerOrders = orders;
  } catch (e) {
    console.error("Error polling orders:", e);
  }
}
setInterval(pollCustomerOrders, 3000);

async function pollCatalogProducts() {
  try {
    const data = await apiRequest('/api/products');
    if (data && data.success && data.products) {
      const newProducts = data.products;
      if (JSON.stringify(newProducts) !== JSON.stringify(allCatalogProducts)) {
        allCatalogProducts = newProducts;
        applyCatalogFilters();
        if (document.getElementById('wishlistModal')?.style.display !== 'none' && typeof renderWishlist === 'function') {
          renderWishlist();
        }
        if (document.getElementById('cartModal')?.style.display !== 'none' && typeof renderCart === 'function') {
          renderCart();
        }
      }
    }
  } catch (e) {
    console.error("Error polling catalog products:", e);
  }
}
setInterval(pollCatalogProducts, 3000);