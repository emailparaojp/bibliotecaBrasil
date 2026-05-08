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

function navigate() {
  const hash = location.hash.replace('#', '') || 'dashboard';
  const entry = PAGES[hash] || PAGES.dashboard;

  // Update topbar title
  document.getElementById('topbarTitle').textContent = entry.title;

  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(a => {
    a.classList.toggle('active', a.dataset.page === hash);
  });

  // Render page
  if (entry.sub) {
    entry.page.render(entry.sub);
  } else {
    entry.page.render();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Sidebar collapse toggle
  const sidebar = document.getElementById('sidebar');
  document.getElementById('btnMenu').addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    document.querySelector('.app-layout').classList.toggle('sidebar-collapsed');
  });

  // Modal: close on backdrop click
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) UI.closeModal();
  });

  // Modal: close button
  document.getElementById('modalClose').addEventListener('click', () => UI.closeModal());

  // Route on hash change
  window.addEventListener('hashchange', navigate);

  // Default route
  if (!location.hash || location.hash === '#') {
    location.hash = '#dashboard';
  } else {
    navigate();
  }
});
