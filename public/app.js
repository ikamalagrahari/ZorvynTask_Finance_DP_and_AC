const API_URL = '/api';

let token = localStorage.getItem('token') || null;
let user = JSON.parse(localStorage.getItem('user')) || null;
let authMode = 'login';
let currentPageInfo = { page: 1, limit: 10, totalPages: 1 };

// Cache DOM Elements map to avoid clutter
const D = {
    authScreen: document.getElementById('auth-screen'),
    dashScreen: document.getElementById('dashboard-screen'),
    navItems: document.querySelectorAll('.nav-item'),
    pages: document.querySelectorAll('.page'),
    
    // Modals
    recordModal: document.getElementById('record-modal'),
    userModal: document.getElementById('user-modal'),
    closeBtns: document.querySelectorAll('.close-modal-btn'),
    
    // Auth
    authForm: document.getElementById('auth-form'),
    tabLogin: document.getElementById('tab-login'),
    tabRegister: document.getElementById('tab-register'),
    authError: document.getElementById('auth-error'),
    logoutBtn: document.getElementById('logout-btn'),
    
    // Admin specific UI
    navUsers: document.getElementById('nav-users'),
    addRecordBtn: document.getElementById('add-record-btn'),
    
    // Data Tables
    recentTbody: document.getElementById('recent-records-tbody'),
    recordsTbody: document.getElementById('all-records-tbody'),
    usersTbody: document.getElementById('users-tbody'),
    
    // Filter & Paginate
    filterType: document.getElementById('filter-type'),
    filterStart: document.getElementById('filter-start'),
    filterEnd: document.getElementById('filter-end'),
    btnApplyFilters: document.getElementById('btn-apply-filters'),
    btnPrevPage: document.getElementById('btn-prev-page'),
    btnNextPage: document.getElementById('btn-next-page'),
    pageInfo: document.getElementById('page-info'),
};

function init() {
    setupEventListeners();
    if (token && user) {
        showApp();
    } else {
        showAuth();
    }
}

function showAuth() {
    D.authScreen.classList.remove('hidden');
    D.dashScreen.classList.add('hidden');
}

function showApp() {
    D.authScreen.classList.add('hidden');
    D.dashScreen.classList.remove('hidden');
    
    document.getElementById('user-name').innerText = user.name;
    document.getElementById('user-role').innerText = user.role.toUpperCase();
    document.getElementById('user-avatar').innerText = user.name.charAt(0).toUpperCase();

    // Permissions logic mapping to backend rules
    // Admin: Users tab, Add/Edit/Del overrides
    if (user.role === 'admin') {
        D.navUsers.classList.remove('hidden');
        D.addRecordBtn.classList.remove('hidden');
        document.querySelectorAll('.col-actions').forEach(el => el.classList.remove('hidden'));
    } else {
        D.navUsers.classList.add('hidden');
        D.addRecordBtn.classList.add('hidden');
        document.querySelectorAll('.col-actions').forEach(el => el.classList.add('hidden'));
    }

    // Default load dashboard
    switchPage('page-dashboard');
}

function setupEventListeners() {
    // Navigation
    D.navItems.forEach(nav => {
        nav.addEventListener('click', (e) => {
            e.preventDefault();
            D.navItems.forEach(n => n.classList.remove('active'));
            nav.classList.add('active');
            switchPage(nav.getAttribute('data-target'));
        });
    });

    // Modals
    D.closeBtns.forEach(btn => btn.addEventListener('click', closeAllModals));

    // Form Submits
    D.authForm.addEventListener('submit', handleAuth);
    document.getElementById('record-form').addEventListener('submit', handleSaveRecord);
    document.getElementById('user-form').addEventListener('submit', handleUpdateUser);
    
    // Actions
    D.logoutBtn.addEventListener('click', logout);
    D.addRecordBtn.addEventListener('click', () => openRecordModal());
    D.btnApplyFilters.addEventListener('click', () => loadRecordsData(1));
    D.btnPrevPage.addEventListener('click', () => {
        if (currentPageInfo.page > 1) loadRecordsData(currentPageInfo.page - 1);
    });
    D.btnNextPage.addEventListener('click', () => {
        if (currentPageInfo.page < currentPageInfo.totalPages) loadRecordsData(currentPageInfo.page + 1);
    });

    // Toggle Tabs
    D.tabLogin.addEventListener('click', () => toggleAuthTabs('login'));
    D.tabRegister.addEventListener('click', () => toggleAuthTabs('register'));
}

async function fetchAPI(endpoint, method = 'GET', body = null) {
    const headers = {
        'Authorization': `Bearer ${token}`
    };
    const options = { method, headers };
    if (body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }
    const res = await fetch(`${API_URL}${endpoint}`, options);
    const data = await res.json();
    if (res.status === 401 || res.status === 403) {
        if (res.status === 401) logout();
        throw new Error(data.message || 'Permission Denied');
    }
    if (!res.ok) throw new Error(data.message || 'API Error');
    return data;
}

function closeAllModals() {
    D.recordModal.classList.add('hidden');
    D.userModal.classList.add('hidden');
    document.getElementById('record-form').reset();
    document.getElementById('record-id').value = '';
    document.getElementById('record-error').innerText = '';
}

function switchPage(pageId) {
    D.pages.forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    if (pageId === 'page-dashboard') loadDashboardData();
    if (pageId === 'page-records') loadRecordsData(1);
    if (pageId === 'page-users' && user.role === 'admin') loadUsersData();
}

/** AUTHENTICATION */
function toggleAuthTabs(mode) {
    authMode = mode;
    D.tabLogin.classList.toggle('active', mode === 'login');
    D.tabRegister.classList.toggle('active', mode === 'register');
    document.getElementById('register-fields').classList.toggle('hidden', mode === 'login');
    document.getElementById('auth-submit').innerText = mode === 'login' ? 'Login ->' : 'Register ->';
    D.authError.innerText = '';
}

async function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    let payload = { email, password };
    let endpoint = `/auth/login`;

    if (authMode === 'register') {
        payload.name = document.getElementById('name').value;
        endpoint = `/auth/register`;
    }

    try {
        const data = await fetchAPI(endpoint, 'POST', payload);
        token = data.token;
        user = { name: data.name, email: data.email, role: data.role };
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        D.authForm.reset();
        showApp();
    } catch (err) {
        D.authError.innerText = err.message;
    }
}

function logout() {
    token = null; user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showAuth();
}

/** DASHBOARD (Aggregations) */
async function loadDashboardData() {
    try {
        document.getElementById('dashboard-error').innerText = '';
        if (user.role === 'viewer') {
            document.getElementById('dashboard-error').innerText = 'Viewers do not have access to aggregation dashboards.';
            return;
        }

        const sumData = await fetchAPI('/dashboard/summary');
        document.getElementById('total-income').innerText = `$${sumData.totalIncome.toLocaleString()}`;
        document.getElementById('total-expense').innerText = `$${sumData.totalExpense.toLocaleString()}`;
        document.getElementById('net-balance').innerText = `$${sumData.netBalance.toLocaleString()}`;

        const records = await fetchAPI('/dashboard/recent');
        D.recentTbody.innerHTML = records.map(r => `
            <tr>
                <td>${new Date(r.date).toLocaleDateString()}</td>
                <td style="text-transform: capitalize">${r.category}</td>
                <td style="font-weight: 600; color: ${r.type==='income'?'var(--success)':'var(--danger)'}">
                    ${r.type === 'income'?'+':'-'}$${r.amount.toLocaleString()}
                </td>
                <td><span class="status-badge ${r.type==='income'?'status-income':'status-expense'}">${r.type}</span></td>
            </tr>
        `).join('');

        const categories = await fetchAPI('/dashboard/category');
        const maxAmt = Math.max(...categories.map(c => c.totalAmount), 1);
        document.getElementById('category-bars').innerHTML = categories.map(c => `
            <div class="bar-row">
                <div class="bar-header"><span style="text-transform:capitalize">${c._id}</span><span>$${c.totalAmount.toLocaleString()}</span></div>
                <div class="bar-track"><div class="bar-fill" style="width: ${(c.totalAmount/maxAmt)*100}%"></div></div>
            </div>
        `).join('');

    } catch (err) {
        document.getElementById('dashboard-error').innerText = err.message;
    }
}

/** RECORDS (CRUD & Pagination/Filtering) */
async function loadRecordsData(page = 1) {
    try {
        const t = D.filterType.value;
        const s = D.filterStart.value;
        const e = D.filterEnd.value;
        let query = `?page=${page}&limit=10`;
        if (t) query += `&type=${t}`;
        if (s) query += `&startDate=${s}`;
        if (e) query += `&endDate=${e}`;

        const data = await fetchAPI(`/records${query}`);
        currentPageInfo = { page: data.page, totalPages: data.pages };
        D.pageInfo.innerText = `Page ${data.page} of ${data.pages || 1}`;
        
        D.recordsTbody.innerHTML = data.records.map(r => `
            <tr>
                <td>${new Date(r.date).toLocaleDateString()}</td>
                <td>${r.category}</td>
                <td>${r.notes || '-'}</td>
                <td>${r.userId.name}</td>
                <td style="font-weight: 600; color: ${r.type==='income'?'var(--success)':'var(--danger)'}">
                    $${r.amount.toLocaleString()}
                </td>
                <td><span class="status-badge ${r.type==='income'?'status-income':'status-expense'}">${r.type}</span></td>
                ${user.role === 'admin' ? `
                <td class="col-actions">
                    <div class="action-btns">
                        <button class="btn-edit" onclick='openRecordModal(${JSON.stringify(r)})'>Edit</button>
                        <button class="btn-danger" onclick="deleteRecord('${r._id}')">Del</button>
                    </div>
                </td>` : ''}
            </tr>
        `).join('');

    } catch (err) {
        alert(err.message);
    }
}

function openRecordModal(record = null) {
    if (user.role !== 'admin') return alert('Only admins can modify records');
    D.recordModal.classList.remove('hidden');
    document.getElementById('record-error').innerText = '';
    document.getElementById('record-modal-title').innerText = record ? 'Edit Record' : 'Add Record';
    
    if (record) {
        document.getElementById('record-id').value = record._id;
        document.getElementById('record-type').value = record.type;
        document.getElementById('record-amount').value = record.amount;
        document.getElementById('record-category').value = record.category;
        document.getElementById('record-notes').value = record.notes || '';
    }
}

async function handleSaveRecord(e) {
    e.preventDefault();
    const id = document.getElementById('record-id').value;
    const isEdit = !!id;
    
    const payload = {
        type: document.getElementById('record-type').value,
        amount: parseFloat(document.getElementById('record-amount').value),
        category: document.getElementById('record-category').value,
        notes: document.getElementById('record-notes').value
    };
    
    const dateInput = document.getElementById('record-date').value;
    if (dateInput) payload.date = new Date(dateInput).toISOString();

    try {
        if (isEdit) await fetchAPI(`/records/${id}`, 'PATCH', payload);
        else await fetchAPI(`/records`, 'POST', payload);
        
        closeAllModals();
        loadRecordsData(currentPageInfo.page);
    } catch (err) {
        document.getElementById('record-error').innerText = err.message;
    }
}

async function deleteRecord(id) {
    if(!confirm('Are you sure you want to soft delete this record?')) return;
    try {
        await fetchAPI(`/records/${id}`, 'DELETE');
        loadRecordsData(currentPageInfo.page); // reload
    } catch (err) { alert(err.message); }
}

/** USERS (Admin Only CRUD) */
async function loadUsersData() {
    try {
        const users = await fetchAPI('/users');
        D.usersTbody.innerHTML = users.map(u => `
            <tr>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td style="text-transform: capitalize">${u.role}</td>
                <td>${u.isActive ? '✅ Active' : '❌ Suspended'}</td>
                <td>
                    <button class="btn-secondary" style="padding:4px 8px;font-size:0.8rem" 
                        onclick='openUserModal(${JSON.stringify(u)})'>Manage</button>
                    <button class="btn-danger" style="margin-left: 4px; padding:4px 8px;font-size:0.8rem" 
                        onclick="deleteUser('${u._id}')">Del</button>
                </td>
            </tr>
        `).join('');
    } catch (err) { alert(err.message); }
}

function openUserModal(uTarget) {
    D.userModal.classList.remove('hidden');
    document.getElementById('edit-user-id').value = uTarget._id;
    document.getElementById('edit-user-role').value = uTarget.role;
    document.getElementById('edit-user-active').value = uTarget.isActive.toString();
}

async function handleUpdateUser(e) {
    e.preventDefault();
    const id = document.getElementById('edit-user-id').value;
    const role = document.getElementById('edit-user-role').value;
    const isActive = document.getElementById('edit-user-active').value === 'true';

    try {
        await fetchAPI(`/users/${id}`, 'PATCH', { role, isActive });
        closeAllModals();
        loadUsersData();
    } catch (err) { alert(err.message); }
}

async function deleteUser(id) {
    if(!confirm('Permanently delete this user?')) return;
    try {
        await fetchAPI(`/users/${id}`, 'DELETE');
        loadUsersData();
    } catch (err) { alert(err.message); }
}

init();
