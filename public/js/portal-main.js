/* portal-main.js — Portal router and global nav */

const PORTAL_PAGES = {
  catalog:      CatalogPage,
  book:         BookPage,
  login:        LoginPage,
  register:     RegisterPage,
  'minha-area': MinhaAreaPage,
};

const PortalRouter = {
  _params: {},
  go(page, params = {}) {
    this._params = params;
    const hash = params && Object.keys(params).length
      ? '#' + page + '?' + new URLSearchParams(params).toString()
      : '#' + page;
    if (location.hash === hash) {
      navigate();
    } else {
      location.hash = hash;
    }
  },
  getParams() { return this._params; },
};

function parseHash() {
  const raw = location.hash.slice(1) || 'catalog';
  const [page, qs] = raw.split('?');
  const params = {};
  if (qs) new URLSearchParams(qs).forEach((v, k) => { params[k] = v; });
  return { page, params };
}

function navigate() {
  const { page, params } = parseHash();
  const merged = { ...PortalRouter._params, ...params };
  PortalRouter._params = {};

  // Highlight nav link
  document.querySelectorAll('.pnav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });

  const handler = PORTAL_PAGES[page] || PORTAL_PAGES.catalog;
  handler.render(merged);
}

// Update header: show login/register or member name + logout
function updateHeaderActions() {
  const container = document.getElementById('headerActions');
  if (!container) return;

  const member = getMemberFromStorage();
  if (member) {
    // Show member name + minha area link + logout
    document.getElementById('navMinhaArea').style.display = '';
    container.innerHTML = `
      <span style="font-size:.875rem;color:var(--p-text-muted);">
        <i class="fa-solid fa-user-circle" style="color:var(--p-primary);"></i>
        ${esc(member.nome.split(' ')[0])}
      </span>
      <button class="pbtn pbtn-ghost pbtn-sm" id="btnLogout">
        <i class="fa-solid fa-right-from-bracket"></i> Sair
      </button>
    `;
    document.getElementById('btnLogout')?.addEventListener('click', () => {
      localStorage.removeItem('memberToken');
      localStorage.removeItem('memberInfo');
      updateHeaderActions();
      PUI.toast('Sessão encerrada.', 'info');
      PortalRouter.go('catalog');
    });
  } else {
    document.getElementById('navMinhaArea').style.display = 'none';
    container.innerHTML = `
      <button class="pbtn pbtn-ghost pbtn-sm" id="btnNavLogin">
        <i class="fa-solid fa-right-to-bracket"></i> Entrar
      </button>
      <button class="pbtn pbtn-primary pbtn-sm" id="btnNavRegister">
        <i class="fa-solid fa-user-plus"></i> Cadastrar
      </button>
    `;
    document.getElementById('btnNavLogin')?.addEventListener('click', () => PortalRouter.go('login'));
    document.getElementById('btnNavRegister')?.addEventListener('click', () => PortalRouter.go('register'));
  }
}

function getMemberFromStorage() {
  try { return JSON.parse(localStorage.getItem('memberInfo')); } catch { return null; }
}

document.addEventListener('DOMContentLoaded', () => {
  // Modal close
  document.getElementById('portalModalBackdrop')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) PUI.closeModal();
  });
  document.getElementById('portalModalClose')?.addEventListener('click', () => PUI.closeModal());

  // Admin link
  document.querySelector('.portal-brand')?.addEventListener('click', () => {});

  window.addEventListener('hashchange', navigate);
  updateHeaderActions();
  navigate();
});
