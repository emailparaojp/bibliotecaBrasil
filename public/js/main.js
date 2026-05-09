/* main.js — router and navigation */
const PAGES = {
  dashboard:   { page: DashboardPage,    title: 'Dashboard' },
  livros:      { page: LivrosPage,       title: 'Livros' },
  autores:     { page: CatalogoPage,     title: 'Autores',     sub: 'autores' },
  editoras:    { page: CatalogoPage,     title: 'Editoras',    sub: 'editoras' },
  categorias:  { page: CatalogoPage,     title: 'Categorias',  sub: 'categorias' },
  membros:     { page: MembrosPage,      title: 'Membros' },
  emprestimos: { page: EmprestimosPage,  title: 'Empréstimos' },
  reservas:    { page: ReservasPage,     title: 'Reservas' },
  multas:      { page: MultasPage,       title: 'Multas' },
  relatorios:  { page: RelatoriosPage,   title: 'Relatórios' },
};

// Helper usado por outros módulos: Router.go('emprestimos')
const Router = {
  go(page) { location.hash = '#' + page; }
};

function navigate() {
  const hash = location.hash.replace('#', '') || 'dashboard';
  const entry = PAGES[hash] || PAGES.dashboard;

  document.getElementById('topbarTitle').textContent = entry.title;

  document.querySelectorAll('.nav-item').forEach(a => {
    a.classList.toggle('active', a.dataset.page === hash);
  });

  if (entry.sub) {
    entry.page.render(entry.sub);
  } else {
    entry.page.render();
  }
}

// ── Admin Login ────────────────────────────────────────────────────────────────
function showAdminLogin() {
  document.getElementById('adminLoginOverlay').style.display = 'flex';
  document.getElementById('adminUserName').textContent = '';
}
function hideAdminLogin() {
  document.getElementById('adminLoginOverlay').style.display = 'none';
}

function isTokenValid(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now() && payload.role === 'admin';
  } catch { return false; }
}

function getAdminNome() {
  try {
    const token = localStorage.getItem('adminToken');
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.nome || '';
  } catch { return ''; }
}

function maskCPFAdmin(val) {
  return val.replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2}).*/, '$1.$2.$3-$4');
}

document.addEventListener('DOMContentLoaded', () => {
  // CPF mask on overlay input
  const cpfInput = document.getElementById('adminCpfInput');
  if (cpfInput) {
    cpfInput.addEventListener('input', e => {
      e.target.value = maskCPFAdmin(e.target.value);
    });
  }

  // Admin login form
  const loginForm = document.getElementById('adminLoginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const cpf   = document.getElementById('adminCpfInput').value.trim();
      const senha = document.getElementById('adminSenhaInput').value;
      const errEl = document.getElementById('adminLoginError');
      errEl.textContent = '';
      try {
        const data = await API.adminLogin(cpf, senha);
        localStorage.setItem('adminToken', data.token);
        hideAdminLogin();
        document.getElementById('adminUserName').textContent = data.nome || '';
        navigate();
      } catch (err) {
        errEl.textContent = err.message;
      }
    });
  }

  // Logout button
  const btnLogout = document.getElementById('btnAdminLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('adminToken');
      showAdminLogin();
    });
  }

  // Sidebar collapse toggle
  const sidebar = document.getElementById('sidebar');
  document.getElementById('btnMenu').addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    document.querySelector('.app-layout').classList.toggle('sidebar-collapsed');
  });

  // Modal: close on backdrop click (id is "modalBackdrop" in the HTML)
  document.getElementById('modalBackdrop').addEventListener('click', e => {
    if (e.target === e.currentTarget) UI.closeModal();
  });

  // Modal: close button
  document.getElementById('modalClose').addEventListener('click', () => UI.closeModal());

  // Route on hash change
  window.addEventListener('hashchange', navigate);

  // Check admin auth
  const token = localStorage.getItem('adminToken');
  if (!isTokenValid(token)) {
    showAdminLogin();
    return;
  }

  // Show user name in topbar
  document.getElementById('adminUserName').textContent = getAdminNome();

  // Default route
  if (!location.hash || location.hash === '#') {
    location.hash = '#dashboard';
  } else {
    navigate();
  }
});
