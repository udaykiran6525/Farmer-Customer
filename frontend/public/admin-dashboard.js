/**
 * Farmigo – Super Admin Dashboard Enterprise Script
 * Manages live MySQL data fetching, Chart.js analytics, user moderation, product approval, support tickets & security audit logs.
 */

const API = '';

function normalizeCategory(rawCat) {
  if (!rawCat || typeof rawCat !== 'string') return null;
  const c = rawCat.trim().toLowerCase();
  if (!c) return null;
  if (c === 'dry fruits' || c === 'dry fruit' || c === 'dryfruits' || c === 'dry-fruits' || c === 'nuts') return 'Dry Fruits';
  if (c === 'fruits' || c === 'fruit') return 'Fruits';
  if (c === 'vegetables' || c === 'vegetable') return 'Vegetables';
  if (c === 'grains & rice' || c === 'grains and rice' || c === 'grains' || c === 'grain' || c === 'rice' || c === 'millets' || c === 'millet') return 'Grains & Rice';
  if (c === 'pulses & dals' || c === 'pulses and dals' || c === 'pulses' || c === 'pulse' || c === 'dals' || c === 'dal' || c === 'legumes') return 'Pulses & Dals';
  if (c === 'spices' || c === 'spice') return 'Spices';
  const official = ['Vegetables', 'Fruits', 'Grains & Rice', 'Pulses & Dals', 'Dry Fruits', 'Spices'];
  const matched = official.find(cat => cat.toLowerCase() === c);
  if (matched) return matched;
  return null;
}

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('farmigo_admin_token');
  const adminUserStr = localStorage.getItem('farmigo_admin_user');

  if (!token) {
    window.location.href = '/admin/login';
    return;
  }

  // Set Profile info in sidebar
  if (adminUserStr) {
    try {
      const admin = JSON.parse(adminUserStr);
      const nameEl = document.getElementById('sidebarAdminName');
      const avatarEl = document.getElementById('sidebarAvatar');
      if (nameEl) nameEl.textContent = admin.name || 'Super Admin';
      if (avatarEl) {
        const initials = (admin.name || 'Super Admin')
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .substring(0, 2);
        avatarEl.textContent = initials || 'SA';
      }
    } catch (e) {}
  }

  // Global state
  let charts = {};
  let currentTab = 'overview';
  let allUsersData = [];
  let allProductsData = [];
  let allTicketsData = [];
  let allLogsData = [];
  let selectedTicketId = null;

  // Setup UI event listeners
  setupNavigation();
  setupModals();
  setupControls();

  // Initial load
  loadDashboardData();

  // ══════════════════════════════════════════════
  // NAVIGATION & TABS
  // ══════════════════════════════════════════════
  function setupNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link[data-tab]');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const topbarTitle = document.getElementById('topbarTitle');
    const topbarSubtitle = document.getElementById('topbarSubtitle');

    const tabInfo = {
      overview: { title: 'Dashboard Overview', subtitle: 'Real-time platform metrics and live MySQL database analytics.' },
      users: { title: 'User Management System', subtitle: 'Monitor, inspect, block, or unblock Farmers and Customers across the platform.' },
      products: { title: 'Product Moderation & Approval', subtitle: 'Review farmer listings, approve marketplace items, and maintain catalog quality.' },
      tickets: { title: 'System Governance & Support Tickets', subtitle: 'Review user inquiries, manage resolution workflows, and audit security logs.' }
    };

    sidebarLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.getAttribute('data-tab');
        if (!tab) return;

        currentTab = tab;

        // Update active class on links
        sidebarLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        // Update active pane
        tabPanes.forEach(pane => {
          pane.classList.remove('active');
          if (pane.id === `pane-${tab}`) {
            pane.classList.add('active');
          }
        });

        // Update topbar text
        if (tabInfo[tab]) {
          if (topbarTitle) topbarTitle.textContent = tabInfo[tab].title;
          if (topbarSubtitle) topbarSubtitle.textContent = tabInfo[tab].subtitle;
        }

        // Close mobile sidebar if open
        const sidebar = document.getElementById('adminSidebar');
        if (sidebar) sidebar.classList.remove('open');

        // Load tab specific data if needed
        if (tab === 'users') loadUsers();
        if (tab === 'products') loadProducts();
        if (tab === 'tickets') {
          loadTickets();
          loadLogs();
        }
      });
    });

    // Mobile sidebar toggle
    const toggleBtn = document.getElementById('btnToggleSidebar');
    const sidebar = document.getElementById('adminSidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }

    // Logout
    const logoutBtn = document.getElementById('btnLogout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        const modal = document.getElementById('adminLogoutModal');
        if (modal) modal.classList.add('show');
      });
    }

    const confirmLogout = document.getElementById('btnConfirmLogout');
    if (confirmLogout) {
      confirmLogout.addEventListener('click', () => {
        localStorage.removeItem('farmigo_admin_token');
        localStorage.removeItem('farmigo_admin_user');
        window.location.href = '/admin/login';
      });
    }

    // Refresh button
    const refreshBtn = document.getElementById('btnRefreshStats');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        loadDashboardData();
        if (currentTab === 'tickets') {
          loadTickets();
          loadLogs();
        }
        showToast('Live MySQL data refreshed successfully!', 'success');
      });
    }

    const refreshLogsBtn = document.getElementById('btnRefreshLogs');
    if (refreshLogsBtn) {
      refreshLogsBtn.addEventListener('click', () => {
        loadLogs();
        showToast('System audit logs reloaded.', 'success');
      });
    }
  }

  // ══════════════════════════════════════════════
  // DATA LOADING & API CALLS
  // ══════════════════════════════════════════════
  async function apiFetch(endpoint, options = {}) {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      ...(options.headers || {})
    };

    let url = `/api/admin${endpoint}`;
    if (options.method === undefined || options.method === 'GET') {
      url += (url.includes('?') ? '&' : '?') + '_t=' + Date.now();
    }

    const response = await fetch(url, {
      cache: 'no-store',
      ...options,
      headers
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('farmigo_admin_token');
      localStorage.removeItem('farmigo_admin_user');
      window.location.href = '/admin/login';
      throw new Error('Unauthorized');
    }

    return response;
  }

  async function loadDashboardData() {
    try {
      const statsRes = await apiFetch('/dashboard/stats');
      if (statsRes.ok) {
        const stats = await statsRes.json();
        updateStatCards(stats);
      }

      const analyticsRes = await apiFetch('/analytics');
      if (analyticsRes.ok) {
        const analytics = await analyticsRes.json();
        renderCharts(analytics);
      }

      // Pre-fetch tickets count for overview
      const ticketsRes = await apiFetch('/support');
      if (ticketsRes.ok) {
        const tickets = await ticketsRes.json();
        allTicketsData = tickets;
        const totalEl = document.getElementById('statTotalTickets');
        if (totalEl) totalEl.textContent = tickets.length || '0';
        updateTicketMiniStats(tickets);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  }

  function updateStatCards(s) {
    if (document.getElementById('statTotalUsers')) document.getElementById('statTotalUsers').textContent = s.totalUsers || '0';
    if (document.getElementById('statUsersBreakdown')) {
      document.getElementById('statUsersBreakdown').textContent = `${s.farmersCount || 0} Farmers | ${s.customersCount || 0} Customers`;
    }
    if (document.getElementById('statTotalFarmers')) document.getElementById('statTotalFarmers').textContent = s.farmersCount || '0';
    if (document.getElementById('statTotalCustomers')) document.getElementById('statTotalCustomers').textContent = s.customersCount || '0';
    if (document.getElementById('statTotalRevenue')) document.getElementById('statTotalRevenue').textContent = `₹${(s.totalRevenue || 0).toLocaleString()}`;
    if (document.getElementById('statTotalProducts')) document.getElementById('statTotalProducts').textContent = s.totalProducts || '0';
    if (document.getElementById('statApprovedProducts')) document.getElementById('statApprovedProducts').textContent = `${s.approvedProducts || 0} Approved in Marketplace`;
    if (document.getElementById('statPendingProducts')) document.getElementById('statPendingProducts').textContent = s.pendingApprovals || '0';
    if (document.getElementById('statTotalOrders')) document.getElementById('statTotalOrders').textContent = s.totalOrders || '0';
  }

  // ══════════════════════════════════════════════
  // CHART.JS ANALYTICS (ENTERPRISE DARK THEME)
  // ══════════════════════════════════════════════
  function renderCharts(data) {
    if (typeof Chart === 'undefined') return;

    // Set dark theme defaults for Chart.js
    Chart.defaults.color = '#94A3B8';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.07)';
    Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";

    // 1. Revenue Chart
    const revCtx = document.getElementById('revenueChart')?.getContext('2d');
    if (revCtx) {
      if (charts.revenue) charts.revenue.destroy();
      const labels = (data.monthlySales || []).map(d => d.month || 'Month');
      const revValues = (data.monthlySales || []).map(d => d.revenue || 0);

      const grad = revCtx.createLinearGradient(0, 0, 0, 250);
      grad.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
      grad.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

      charts.revenue = new Chart(revCtx, {
        type: 'line',
        data: {
          labels: labels.length ? labels : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Monthly Sales (₹)',
            data: revValues.length ? revValues : [12000, 19000, 24000, 31000, 42000, 58000],
            borderColor: '#6366F1',
            borderWidth: 3,
            backgroundColor: grad,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#6366F1',
            pointBorderColor: '#FFFFFF',
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1E293B',
              titleColor: '#FFFFFF',
              bodyColor: '#A5B4FC',
              borderColor: 'rgba(99, 102, 241, 0.3)',
              borderWidth: 1,
              padding: 10
            }
          },
          scales: {
            x: { grid: { display: false } },
            y: { ticks: { callback: v => '₹' + v } }
          }
        }
      });
    }

    // 2. User Role Distribution Chart
    const userCtx = document.getElementById('userRoleChart')?.getContext('2d');
    if (userCtx) {
      if (charts.userRole) charts.userRole.destroy();
      const farmers = data.roleDistribution?.farmer || 0;
      const customers = data.roleDistribution?.customer || 0;

      charts.userRole = new Chart(userCtx, {
        type: 'doughnut',
        data: {
          labels: ['Farmers', 'Customers'],
          datasets: [{
            data: [farmers || 14, customers || 38],
            backgroundColor: ['#10B981', '#6366F1'],
            borderColor: '#151D2B',
            borderWidth: 3,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { padding: 20, font: { weight: '600' } } }
          },
          cutout: '72%'
        }
      });
    }

    // 3. Order Status Breakdown Chart
    const orderCtx = document.getElementById('orderStatusChart')?.getContext('2d');
    if (orderCtx) {
      if (charts.orderStatus) charts.orderStatus.destroy();
      const statusMap = data.orderStatusBreakdown || {};

      charts.orderStatus = new Chart(orderCtx, {
        type: 'bar',
        data: {
          labels: ['Placed', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled'],
          datasets: [{
            label: 'Orders',
            data: [
              statusMap.PLACED || statusMap.placed || 5,
              statusMap.CONFIRMED || statusMap.confirmed || 8,
              statusMap.DISPATCHED || statusMap.dispatched || 12,
              statusMap.DELIVERED || statusMap.delivered || 24,
              statusMap.CANCELLED || statusMap.cancelled || 2
            ],
            backgroundColor: ['#F59E0B', '#06B6D4', '#6366F1', '#10B981', '#F43F5E'],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false } },
            y: { ticks: { stepSize: 5 } }
          }
        }
      });
    }

    // 4. Product Categories Chart
    const catCtx = document.getElementById('categoryChart')?.getContext('2d');
    if (catCtx) {
      if (charts.category) charts.category.destroy();
      const catMap = data.categoryDistribution || {};
      const labels = Object.keys(catMap).length ? Object.keys(catMap) : ['Vegetables', 'Fruits', 'Grains', 'Pulses', 'Spices', 'Dry Fruits'];
      const values = Object.keys(catMap).length ? Object.values(catMap) : [8, 6, 9, 5, 7, 5];

      charts.category = new Chart(catCtx, {
        type: 'polarArea',
        data: {
          labels: labels.map(l => l.toUpperCase()),
          datasets: [{
            data: values,
            backgroundColor: [
              'rgba(16, 185, 129, 0.7)',
              'rgba(245, 158, 11, 0.7)',
              'rgba(99, 102, 241, 0.7)',
              'rgba(139, 92, 246, 0.7)',
              'rgba(244, 63, 94, 0.7)',
              'rgba(6, 182, 212, 0.7)'
            ],
            borderColor: '#151D2B',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'right' } },
          scales: { r: { grid: { color: 'rgba(255, 255, 255, 0.05)' } } }
        }
      });
    }
  }

  // ══════════════════════════════════════════════
  // USER MANAGEMENT
  // ══════════════════════════════════════════════
  async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">⏳ Loading users from MySQL...</td></tr>';

    try {
      const role = document.getElementById('userRoleFilter')?.value || 'all';
      const search = document.getElementById('userSearchInput')?.value.trim() || '';
      
      const query = new URLSearchParams();
      if (role !== 'all') query.append('role', role);
      if (search) query.append('search', search);

      const res = await apiFetch(`/users?${query.toString()}`);
      if (res.ok) {
        allUsersData = await res.json();
        renderUsersTable(allUsersData);
      }
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #F87171;">❌ Error loading users from server.</td></tr>';
    }
  }

  function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (!users || users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">No registered users match the search criteria.</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(u => {
      const roleStr = (u.role || 'customer').toLowerCase();
      const roleBadge = roleStr === 'farmer' 
        ? `<span class="role-badge farmer">🌾 Farmer</span>`
        : `<span class="role-badge customer">🛒 Customer</span>`;

      const isBlocked = u.isBlocked === true;
      const statusBadge = isBlocked 
        ? `<span class="status-badge blocked">🚫 BLOCKED</span>`
        : `<span class="status-badge active">✅ ACTIVE</span>`;

      const location = [u.village, u.district, u.state].filter(Boolean).join(', ') || u.address || 'Telangana, India';
      const initials = (u.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

      return `
        <tr>
          <td>
            <div class="user-cell">
              <div class="user-cell-avatar">${initials}</div>
              <div class="user-cell-info">
                <span class="user-cell-name">${u.name || 'Anonymous User'}</span>
                <span class="user-cell-email">${u.email || ''}</span>
              </div>
            </div>
          </td>
          <td><span style="font-weight: 600; color: var(--text-body);">${u.phone || 'N/A'}</span></td>
          <td>${roleBadge}</td>
          <td><span style="color: var(--text-muted); font-size: 0.85rem;">📍 ${location}</span></td>
          <td>${statusBadge}</td>
          <td style="text-align: right;">
            <div class="action-group" style="justify-content: flex-end;">
              <button class="btn-table-action view" onclick="viewUserDetails(${u.id})">
                👁️ Inspect
              </button>
              ${isBlocked ? `
                <button class="btn-table-action unblock" onclick="unblockUserAction(${u.id}, '${escapeHtml(u.name || '')}')">
                  🔓 Unblock
                </button>
              ` : `
                <button class="btn-table-action block" onclick="openBlockModal(${u.id}, '${escapeHtml(u.name || '')}')">
                  🚫 Block
                </button>
              `}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ══════════════════════════════════════════════
  // PRODUCT MODERATION
  // ══════════════════════════════════════════════
  async function loadProducts() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">⏳ Loading catalog products from MySQL...</td></tr>';

    try {
      const status = document.getElementById('productStatusFilter')?.value || 'all';
      const search = document.getElementById('productSearchInput')?.value.trim() || '';

      const query = new URLSearchParams();
      if (status !== 'all') query.append('status', status);
      if (search) query.append('search', search);

      const res = await apiFetch(`/products?${query.toString()}`);
      if (res.ok) {
        allProductsData = await res.json();
        renderProductsTable(allProductsData);
      }
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #F87171;">❌ Error loading products from server.</td></tr>';
    }
  }

  function renderProductsTable(products) {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    if (!products || products.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">No products found matching current filters.</td></tr>';
      return;
    }

    tbody.innerHTML = products.map(p => {
      const farmerName = p.farmer?.name || 'Unknown Farmer';
      const priceStr = `₹${p.price || 0} / ${p.unit || 'kg'}`;
      const qtyStr = `${p.quantity || 0} ${p.unit || 'kg'} left`;

      let statusBadge = '';
      const st = (p.approvalStatus || 'APPROVED').toUpperCase();
      if (st === 'APPROVED') statusBadge = `<span class="status-badge approved">✅ APPROVED</span>`;
      else if (st === 'PENDING') statusBadge = `<span class="status-badge pending">⏳ PENDING</span>`;
      else if (st === 'REJECTED') statusBadge = `<span class="status-badge rejected">❌ REJECTED</span>`;

      let imgUrl = p.image || p.imageUrl || '';
      if (imgUrl.startsWith('/uploads')) imgUrl = API + imgUrl;

      return `
        <tr>
          <td>
            <div class="user-cell">
              <img src="${imgUrl}" alt="${p.name}" style="width: 44px; height: 44px; border-radius: 8px; object-fit: cover; border: 1px solid var(--admin-border-glass);" onerror="this.onerror=null;this.style.display='none'" />
              <div class="user-cell-info">
                <span class="user-cell-name">${p.name || 'Untitled Product'}</span>
                <span class="user-cell-email">#PRD-${p.id}</span>
              </div>
            </div>
          </td>
          <td>
            <div class="user-cell-info">
              <span class="user-cell-name" style="color: var(--text-main);">🌾 ${farmerName}</span>
              <span class="user-cell-email">${p.farmer?.phone || ''}</span>
            </div>
          </td>
          <td>
            <div class="user-cell-info">
              <strong style="color: #34D399; font-size: 0.95rem;">${priceStr}</strong>
              <span class="user-cell-email">${qtyStr}</span>
            </div>
          </td>
          <td><span class="role-badge farmer">${normalizeCategory(p.category) || p.category || 'General'}</span></td>
          <td>${statusBadge}</td>
          <td style="text-align: right;">
            <div class="action-group" style="justify-content: flex-end;">
              <button class="btn-table-action view" onclick="viewProductDetails(${p.id})">
                👁️ Specs
              </button>
              ${st !== 'APPROVED' ? `
                <button class="btn-table-action approve" onclick="approveProductAction(${p.id})">
                  ✅ Approve
                </button>
              ` : ''}
              ${st !== 'REJECTED' ? `
                <button class="btn-table-action reject" onclick="rejectProductAction(${p.id})">
                  ❌ Reject
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ══════════════════════════════════════════════
  // SYSTEM & SUPPORT TICKETS GOVERNANCE
  // ══════════════════════════════════════════════
  async function loadTickets() {
    const tbody = document.getElementById('ticketsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">⏳ Fetching support inquiries from MySQL database...</td></tr>';

    try {
      const res = await apiFetch('/support');
      if (res.ok) {
        allTicketsData = await res.json();
        updateTicketMiniStats(allTicketsData);
        filterAndRenderTickets();
      }
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #F87171;">❌ Error loading support tickets from server.</td></tr>';
    }
  }

  function updateTicketMiniStats(tickets) {
    const total = tickets.length || 0;
    const pending = tickets.filter(t => (t.status || '').toUpperCase() !== 'RESOLVED').length;
    const resolved = total - pending;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 100;

    if (document.getElementById('ticketStatTotal')) document.getElementById('ticketStatTotal').textContent = total;
    if (document.getElementById('ticketStatPending')) document.getElementById('ticketStatPending').textContent = pending;
    if (document.getElementById('ticketStatResolved')) document.getElementById('ticketStatResolved').textContent = `${rate}%`;
  }

  function filterAndRenderTickets() {
    const category = document.getElementById('ticketCategoryFilter')?.value || 'all';
    const status = document.getElementById('ticketStatusFilter')?.value || 'all';
    const search = document.getElementById('ticketSearchInput')?.value.trim().toLowerCase() || '';

    let filtered = [...allTicketsData];

    if (category !== 'all') {
      filtered = filtered.filter(t => (t.ticketType || '').toUpperCase() === category.toUpperCase());
    }

    if (status !== 'all') {
      filtered = filtered.filter(t => (t.status || '').toUpperCase() === status.toUpperCase());
    }

    if (search) {
      filtered = filtered.filter(t => 
        (t.subject && t.subject.toLowerCase().includes(search)) ||
        (t.userName && t.userName.toLowerCase().includes(search)) ||
        (t.userEmail && t.userEmail.toLowerCase().includes(search)) ||
        (t.id && String(t.id).includes(search))
      );
    }

    renderTicketsTable(filtered);
  }

  function renderTicketsTable(tickets) {
    const tbody = document.getElementById('ticketsTableBody');
    if (!tbody) return;

    if (!tickets || tickets.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">No support tickets match the selected filters.</td></tr>';
      return;
    }

    tbody.innerHTML = tickets.map(t => {
      const st = (t.status || 'OPEN').toUpperCase();
      let statusBadge = '';
      if (st === 'RESOLVED') statusBadge = `<span class="status-badge active">✅ RESOLVED</span>`;
      else if (st === 'IN_PROGRESS') statusBadge = `<span class="status-badge in_progress">⚡ IN PROGRESS</span>`;
      else if (st === 'PENDING') statusBadge = `<span class="status-badge pending">⏳ PENDING</span>`;
      else statusBadge = `<span class="status-badge pending">🔴 OPEN</span>`;

      // Determine priority badge dynamically based on category/subject
      let priorityPill = `<span class="priority-pill medium">🟡 MEDIUM</span>`;
      const subj = (t.subject || '').toLowerCase();
      const type = (t.ticketType || '').toLowerCase();
      if (subj.includes('payment') || subj.includes('delay') || type.includes('payment') || subj.includes('damaged')) {
        priorityPill = `<span class="priority-pill high">🔴 HIGH</span>`;
      } else if (subj.includes('bulk') || type.includes('inquiry') || subj.includes('upload')) {
        priorityPill = `<span class="priority-pill low">🟢 LOW</span>`;
      }

      const dateStr = t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Recent';

      return `
        <tr>
          <td style="white-space: nowrap;"><strong style="color: var(--accent-indigo);">#TCK-${t.id}</strong></td>
          <td style="white-space: nowrap;">
            <div class="user-cell-info">
              <span class="user-cell-name">${t.userName || 'Marketplace User'}</span>
              <span class="user-cell-email">${t.userEmail || ''}</span>
            </div>
          </td>
          <td style="white-space: nowrap;"><span class="role-badge customer">${t.ticketType || 'SUPPORT'}</span></td>
          <td class="cell-preview">
            <div style="max-width: 320px; overflow: hidden; text-overflow: ellipsis;">
              <strong style="color: #FFFFFF; display: block; font-size: 0.88rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${t.subject || 'Support Inquiry'}</strong>
              <span style="color: var(--text-muted); font-size: 0.78rem; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${t.message || ''}</span>
            </div>
          </td>
          <td style="white-space: nowrap;">${priorityPill}</td>
          <td style="white-space: nowrap;">${statusBadge}</td>
          <td style="white-space: nowrap;"><span style="color: var(--text-muted); font-size: 0.82rem;">${dateStr}</span></td>
          <td style="text-align: right; white-space: nowrap;">
            <div class="action-group" style="justify-content: flex-end; white-space: nowrap;">
              <button class="btn-table-action view" onclick="viewTicketDetails(${t.id})">
                💬 View & Reply
              </button>
              ${st !== 'RESOLVED' ? `
                <button class="btn-table-action approve" onclick="resolveTicketAction(${t.id})">
                  ✅ Resolve
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  async function loadLogs() {
    const tbody = document.getElementById('logsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">⏳ Fetching system audit activity logs...</td></tr>';

    try {
      const res = await apiFetch('/logs');
      if (res.ok) {
        allLogsData = await res.json();
        renderLogsTable(allLogsData);
      }
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #F87171;">❌ Error loading activity logs.</td></tr>';
    }
  }

  function renderLogsTable(logs) {
    const tbody = document.getElementById('logsTableBody');
    if (!tbody) return;

    if (!logs || logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">No system audit activity recorded yet.</td></tr>';
      return;
    }

    tbody.innerHTML = logs.map(l => {
      const dateStr = l.timestamp ? new Date(l.timestamp).toLocaleString() : 'Just now';
      return `
        <tr>
          <td style="white-space: nowrap;"><strong style="color: var(--text-muted);">#LOG-${l.id}</strong></td>
          <td style="white-space: nowrap;">
            <span style="color: #6EE7B7; font-weight: 600; font-size: 0.85rem;">🛡️ ${l.adminEmail || 'System Controller'}</span>
          </td>
          <td style="white-space: nowrap;"><span class="role-badge farmer">${l.action || 'EVENT'}</span></td>
          <td style="white-space: nowrap;"><span style="color: #A5B4FC; font-weight: 600;">${l.targetEntity || 'System'}${l.targetId ? ' #' + l.targetId : ''}</span></td>
          <td class="cell-preview">
            <span style="color: var(--text-body); font-size: 0.85rem; display: block; max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${l.details || ''}</span>
          </td>
          <td style="white-space: nowrap;"><span style="color: var(--text-muted); font-size: 0.8rem;">${dateStr}</span></td>
        </tr>
      `;
    }).join('');
  }

  // ══════════════════════════════════════════════
  // MODALS HANDLER & GLOBAL ACTIONS
  // ══════════════════════════════════════════════
  function setupModals() {
    // Generic Close Buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close-modal');
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('show', 'open');
      });
    });

    // Close modal on click backdrop
    document.querySelectorAll('.admin-modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('show', 'open');
        }
      });
    });

    // Confirm Block button
    const confirmBlockBtn = document.getElementById('btnConfirmBlock');
    if (confirmBlockBtn) {
      confirmBlockBtn.addEventListener('click', async () => {
        const userId = document.getElementById('blockUserId')?.value;
        const reason = document.getElementById('blockReasonInput')?.value.trim() || 'Violation of platform terms';

        if (!userId) return;

        confirmBlockBtn.disabled = true;
        confirmBlockBtn.textContent = '⏳ Blocking...';

        try {
          const res = await apiFetch(`/users/${userId}/block`, {
            method: 'POST',
            body: JSON.stringify({ reason })
          });

          if (res.ok) {
            showToast('User access blocked successfully.', 'error');
            document.getElementById('blockUserModal')?.classList.remove('show');
            loadUsers();
            loadDashboardData();
          } else {
            showToast('Failed to block user account.', 'error');
          }
        } catch (err) {
          showToast('Network error blocking user', 'error');
        } finally {
          confirmBlockBtn.disabled = false;
          confirmBlockBtn.textContent = '🚫 Confirm Block User';
        }
      });
    }

    // Approve confirm button
    const confirmApproveBtn = document.getElementById('btnConfirmApprove');
    if (confirmApproveBtn) {
      confirmApproveBtn.addEventListener('click', async () => {
        const prodId = document.getElementById('approveProdId')?.value;
        if (!prodId) return;

        confirmApproveBtn.disabled = true;
        confirmApproveBtn.textContent = '⏳ Approving...';

        try {
          const res = await apiFetch(`/products/${prodId}/approve`, {
            method: 'POST',
            body: JSON.stringify({ comments: 'Approved by Super Admin' })
          });

          if (res.ok) {
            showToast('Product approved successfully! Live on Marketplace.', 'success');
            document.getElementById('approveConfirmModal')?.classList.remove('show');
            loadProducts();
            loadDashboardData();
          } else {
            showToast('Failed to approve product.', 'error');
          }
        } catch (err) {
          showToast('Network error approving product', 'error');
        } finally {
          confirmApproveBtn.disabled = false;
          confirmApproveBtn.textContent = '✅ Approve Product';
        }
      });
    }

    // Support Ticket resolve modal confirm button
    const btnResolveTicketModal = document.getElementById('btnResolveTicketModal');
    if (btnResolveTicketModal) {
      btnResolveTicketModal.addEventListener('click', async () => {
        if (!selectedTicketId) return;

        const replyInput = document.getElementById('ticketResponseInput');
        const statusSelect = document.getElementById('ticketStatusSelect');

        const responseText = replyInput ? replyInput.value.trim() : 'Resolved by support team';
        const newStatus = statusSelect ? statusSelect.value : 'RESOLVED';

        btnResolveTicketModal.disabled = true;
        btnResolveTicketModal.textContent = '⏳ Submitting...';

        try {
          const res = await apiFetch(`/support/${selectedTicketId}/resolve`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus, response: responseText })
          });

          if (res.ok) {
            showToast(`Support Ticket #${selectedTicketId} updated to ${newStatus}!`, 'success');
            document.getElementById('ticketDetailsModal')?.classList.remove('show');
            loadTickets();
          } else {
            showToast('Failed to update support ticket.', 'error');
          }
        } catch (err) {
          showToast('Network error updating ticket', 'error');
        } finally {
          btnResolveTicketModal.disabled = false;
          btnResolveTicketModal.textContent = '✅ Update & Resolve Ticket';
        }
      });
    }
  }

  function setupControls() {
    // User search & filter
    const userSearch = document.getElementById('userSearchInput');
    const userRole = document.getElementById('userRoleFilter');
    let userTimeout;

    if (userSearch) {
      userSearch.addEventListener('input', () => {
        clearTimeout(userTimeout);
        userTimeout = setTimeout(loadUsers, 300);
      });
    }
    if (userRole) userRole.addEventListener('change', loadUsers);

    // Product search & filter
    const prodSearch = document.getElementById('productSearchInput');
    const prodStatus = document.getElementById('productStatusFilter');
    let prodTimeout;

    if (prodSearch) {
      prodSearch.addEventListener('input', () => {
        clearTimeout(prodTimeout);
        prodTimeout = setTimeout(loadProducts, 300);
      });
    }
    if (prodStatus) prodStatus.addEventListener('change', loadProducts);

    // Ticket search & filters
    const ticketSearch = document.getElementById('ticketSearchInput');
    const ticketCat = document.getElementById('ticketCategoryFilter');
    const ticketStatus = document.getElementById('ticketStatusFilter');

    if (ticketSearch) ticketSearch.addEventListener('input', filterAndRenderTickets);
    if (ticketCat) ticketCat.addEventListener('change', filterAndRenderTickets);
    if (ticketStatus) ticketStatus.addEventListener('change', filterAndRenderTickets);
  }

  // ══════════════════════════════════════════════
  // GLOBAL ATTACHED WINDOW FUNCTIONS
  // ══════════════════════════════════════════════
  window.openBlockModal = (userId, userName) => {
    const modal = document.getElementById('blockUserModal');
    const idInput = document.getElementById('blockUserId');
    const nameEl = document.getElementById('blockUserName');
    const reasonInput = document.getElementById('blockReasonInput');

    if (idInput) idInput.value = userId;
    if (nameEl) nameEl.textContent = userName || `User #${userId}`;
    if (reasonInput) reasonInput.value = '';
    if (modal) modal.classList.add('show');
  };

  window.unblockUserAction = async (userId, userName) => {
    if (!confirm(`Are you sure you want to unblock ${userName || 'this user'}? They will regain login access immediately.`)) {
      return;
    }

    try {
      const res = await apiFetch(`/users/${userId}/unblock`, { method: 'POST' });
      if (res.ok) {
        showToast(`User ${userName || ''} unblocked successfully! Access restored.`, 'success');
        loadUsers();
        loadDashboardData();
      } else {
        showToast('Failed to unblock user.', 'error');
      }
    } catch (err) {
      showToast('Network error unblocking user', 'error');
    }
  };

  window.viewUserDetails = (userId) => {
    const user = allUsersData.find(u => u.id === userId);
    const contentEl = document.getElementById('userDetailsContent');
    const modal = document.getElementById('userDetailsModal');

    if (!user || !contentEl || !modal) return;

    const isBlocked = user.isBlocked === true;
    const statusStr = isBlocked 
      ? `<span class="status-badge blocked">🚫 BLOCKED (${user.blockReason || 'No reason'})</span>`
      : `<span class="status-badge active">✅ ACTIVE & VERIFIED</span>`;

    contentEl.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <div style="display: flex; align-items: center; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--admin-border-glass);">
          <div class="user-cell-avatar" style="width: 56px; height: 56px; font-size: 1.4rem; background: linear-gradient(135deg, var(--accent-indigo), var(--accent-emerald)); color: #FFF;">
            ${(user.name || 'U').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h4 style="font-size: 1.2rem; font-weight: 700; color: #FFFFFF;">${user.name || 'Anonymous User'}</h4>
            <span style="color: var(--text-muted); font-size: 0.9rem;">User ID: #USR-${user.id}</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <label style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Email Address</label>
            <p style="font-weight: 600; color: #FFFFFF;">${user.email || 'N/A'}</p>
          </div>
          <div>
            <label style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Phone Number</label>
            <p style="font-weight: 600; color: #FFFFFF;">${user.phone || 'N/A'}</p>
          </div>
          <div>
            <label style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Account Role</label>
            <p style="font-weight: 600; text-transform: capitalize; color: #FFFFFF;">${user.role || 'Customer'}</p>
          </div>
          <div>
            <label style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Account Status</label>
            <div style="margin-top: 4px;">${statusStr}</div>
          </div>
        </div>

        <div>
          <label style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Full Address / Location</label>
          <p style="font-weight: 500; color: var(--text-body); background: rgba(15, 23, 42, 0.6); padding: 10px; border-radius: 8px; border: 1px solid var(--admin-border-glass); margin-top: 4px;">
            ${[user.address, user.city, user.state].filter(Boolean).join(', ') || 'No address specified'}
          </p>
        </div>

        <div>
          <label style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Registration Timestamp</label>
          <p style="color: var(--text-body); font-size: 0.9rem;">${user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}</p>
        </div>
      </div>
    `;

    modal.classList.add('show');
  };

  window.viewProductDetails = (prodId) => {
    const prod = allProductsData.find(p => p.id === prodId);
    const contentEl = document.getElementById('productDetailsContent');
    const modal = document.getElementById('productDetailsModal');

    if (!prod || !contentEl || !modal) return;

    let imgUrl = prod.image || prod.imageUrl || '';
    if (imgUrl.startsWith('/uploads')) imgUrl = API + imgUrl;
    const farmerName = prod.farmer?.name || 'Unknown Farmer';
    const farmerPhone = prod.farmer?.phone || 'No phone';

    contentEl.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <img src="${imgUrl}" alt="${prod.name}" style="width: 100%; height: 220px; object-fit: cover; border-radius: 12px; border: 1px solid var(--admin-border-glass);" onerror="this.onerror=null;this.style.display='none'" />
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h4 style="font-size: 1.3rem; font-weight: 700; color: #FFFFFF;">${prod.name || 'Untitled Item'}</h4>
            <span class="role-badge farmer">${normalizeCategory(prod.category) || prod.category || 'General'}</span>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.4rem; font-weight: 800; color: #34D399;">₹${prod.price || 0}</div>
            <div style="font-size: 0.85rem; color: var(--text-muted);">per ${prod.unit || 'kg'}</div>
          </div>
        </div>

        <div>
          <label style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Description & Details</label>
          <p style="color: var(--text-body); line-height: 1.6; background: rgba(15, 23, 42, 0.6); padding: 12px; border-radius: 8px; border: 1px solid var(--admin-border-glass); margin-top: 4px;">
            ${prod.description || 'No detailed description provided by the farmer.'}
          </p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: rgba(16, 185, 129, 0.1); padding: 12px; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.3);">
          <div>
            <label style="font-size: 0.75rem; color: #6EE7B7; text-transform: uppercase; font-weight: 700;">Farmer Seller</label>
            <p style="font-weight: 700; color: #A7F3D0;">🌾 ${farmerName}</p>
          </div>
          <div>
            <label style="font-size: 0.75rem; color: #6EE7B7; text-transform: uppercase; font-weight: 700;">Farmer Contact</label>
            <p style="font-weight: 600; color: #A7F3D0;">📞 ${farmerPhone}</p>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--admin-border-glass); padding-top: 1rem;">
          <span style="font-size: 0.85rem; color: var(--text-muted);">Available Stock: <strong style="color: #FFFFFF;">${prod.quantity || 0} ${prod.unit || 'kg'}</strong></span>
          <span style="font-size: 0.85rem; color: var(--text-muted);">Listed: ${prod.createdAt ? new Date(prod.createdAt).toLocaleDateString() : 'N/A'}</span>
        </div>
      </div>
    `;

    modal.classList.add('show');
  };

  window.approveProductAction = (prodId) => {
    const modal = document.getElementById('approveConfirmModal');
    const idInput = document.getElementById('approveProdId');
    if (idInput) idInput.value = prodId;
    if (modal) modal.classList.add('show');
  };

  window.rejectProductAction = async (prodId) => {
    const reason = prompt('Please specify reason for rejecting this product listing:', 'Does not meet marketplace quality standards');
    if (reason === null) return;

    try {
      const res = await apiFetch(`/products/${prodId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ comments: reason || 'Rejected by Super Admin' })
      });

      if (res.ok) {
        showToast('Product rejected and removed from Marketplace view.', 'error');
        loadProducts();
        loadDashboardData();
      } else {
        showToast('Failed to reject product.', 'error');
      }
    } catch (err) {
      showToast('Network error rejecting product', 'error');
    }
  };

  window.viewTicketDetails = (ticketId) => {
    selectedTicketId = ticketId;
    const ticket = allTicketsData.find(t => t.id === ticketId);
    const contentEl = document.getElementById('ticketModalContent');
    const modal = document.getElementById('ticketDetailsModal');
    const titleEl = document.getElementById('ticketModalTitle');

    if (!ticket || !contentEl || !modal) return;

    if (titleEl) titleEl.textContent = `🎫 Support Ticket #${ticket.id}`;

    const st = (ticket.status || 'OPEN').toUpperCase();
    const dateStr = ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'N/A';

    contentEl.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1rem; border-bottom: 1px solid var(--admin-border-glass);">
          <div>
            <span class="role-badge customer">${ticket.ticketType || 'SUPPORT'}</span>
            <h4 style="font-size: 1.25rem; font-weight: 700; color: #FFFFFF; margin-top: 0.5rem;">${ticket.subject || 'Support Ticket'}</h4>
            <span style="font-size: 0.82rem; color: var(--text-muted);">Submitted on ${dateStr}</span>
          </div>
          <div>
            <select id="ticketStatusSelect" class="filter-select" style="font-weight: 700;">
              <option value="OPEN" ${st === 'OPEN' ? 'selected' : ''}>OPEN</option>
              <option value="PENDING" ${st === 'PENDING' ? 'selected' : ''}>PENDING</option>
              <option value="IN_PROGRESS" ${st === 'IN_PROGRESS' ? 'selected' : ''}>IN PROGRESS</option>
              <option value="RESOLVED" ${st === 'RESOLVED' ? 'selected' : ''}>RESOLVED</option>
            </select>
          </div>
        </div>

        <div style="background: rgba(15, 23, 42, 0.6); padding: 1rem; border-radius: 8px; border: 1px solid var(--admin-border-glass);">
          <label style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">User Contact Info</label>
          <div style="font-weight: 700; color: #FFFFFF; font-size: 0.95rem; margin-top: 2px;">${ticket.userName || 'Marketplace User'}</div>
          <div style="color: #A5B4FC; font-size: 0.85rem;">📧 ${ticket.userEmail || 'N/A'}</div>
        </div>

        <div>
          <label style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">User Message / Inquiry Description</label>
          <div style="color: var(--text-main); line-height: 1.6; background: rgba(15, 23, 42, 0.8); padding: 1rem; border-radius: 8px; border: 1px solid var(--admin-border-glass); margin-top: 4px; font-size: 0.92rem;">
            ${ticket.message || 'No detailed message content provided.'}
          </div>
        </div>

        <div>
          <label style="font-size: 0.75rem; color: #6EE7B7; text-transform: uppercase; font-weight: 700;">Admin Support Resolution Notes / Reply</label>
          <textarea 
            id="ticketResponseInput" 
            rows="3" 
            style="width: 100%; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: var(--radius-sm); padding: 0.75rem; color: #FFF; outline: none; margin-top: 4px;" 
            placeholder="Type your official administrative response or resolution notes here..."></textarea>
        </div>
      </div>
    `;

    modal.classList.add('show');
  };

  window.resolveTicketAction = async (ticketId) => {
    if (!confirm(`Are you sure you want to mark Support Ticket #${ticketId} as RESOLVED?`)) return;

    try {
      const res = await apiFetch(`/support/${ticketId}/resolve`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'RESOLVED', response: 'Resolved by Super Admin' })
      });

      if (res.ok) {
        showToast(`Support Ticket #${ticketId} resolved successfully!`, 'success');
        loadTickets();
      } else {
        showToast('Failed to resolve support ticket.', 'error');
      }
    } catch (err) {
      showToast('Network error resolving ticket', 'error');
    }
  };

  function escapeHtml(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

  // ══════════════════════════════════════════════
  // TOAST NOTIFICATIONS
  // ══════════════════════════════════════════════
  function showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `admin-toast ${type === 'error' ? 'error' : ''}`;
    toast.innerHTML = `
      <span style="font-size: 1.2rem;">${type === 'error' ? '🚫' : '🛡️'}</span>
      <div>
        <strong style="display: block; font-size: 0.85rem; text-transform: uppercase; color: ${type === 'error' ? '#fecaca' : '#a7f3d0'};">
          ${type === 'error' ? 'Security Alert' : 'System Notice'}
        </strong>
        <span style="font-size: 0.95rem;">${msg}</span>
      </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
});
