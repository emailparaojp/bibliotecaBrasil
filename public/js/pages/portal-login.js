/* portal-login.js — member login page */

const LoginPage = (() => {

  function render(params = {}) {
    const redirect = params.redirect || '';
    PUI.setContent(`
      <div class="auth-page">
        <div class="auth-card">
          <i class="fa-solid fa-book-open" style="display:block;text-align:center;font-size:2rem;color:var(--p-primary);margin-bottom:.75rem;"></i>
          <h2>Entrar na BibliotecaBrasil</h2>
          <p class="auth-sub">Use seu CPF e senha para acessar sua conta</p>

          <form id="loginForm" novalidate>
            <input type="hidden" id="redirectParam" value="${esc(redirect)}">
            <div class="form-group" id="grpCpf">
              <label for="cpfInput">CPF</label>
              <input type="text" id="cpfInput" placeholder="000.000.000-00" maxlength="14" autocomplete="username" />
              <span class="field-error" id="errCpf">CPF inválido</span>
            </div>
            <div class="form-group" id="grpSenha">
              <label for="senhaInput">Senha</label>
              <input type="password" id="senhaInput" placeholder="Sua senha" autocomplete="current-password" />
              <span class="field-error" id="errSenha">Senha é obrigatória</span>
            </div>
            <p id="loginError" style="color:var(--p-danger);font-size:.875rem;min-height:1.2rem;margin-bottom:.5rem;"></p>
            <button type="submit" class="pbtn pbtn-primary" style="width:100%;justify-content:center;" id="btnLogin">
              Entrar
            </button>
          </form>

          <div class="auth-divider"><span>ou</span></div>

          <button class="pbtn pbtn-outline" style="width:100%;justify-content:center;" id="btnGoRegister">
            Criar conta
          </button>

          <p class="auth-footer">
            <a href="#catalog" style="color:var(--p-text-muted);">← Voltar ao acervo</a>
          </p>
        </div>
      </div>
    `);

    // CPF mask
    const cpfInput = document.getElementById('cpfInput');
    cpfInput?.addEventListener('input', e => {
      e.target.value = maskCPF(e.target.value);
    });

    document.getElementById('loginForm')?.addEventListener('submit', async e => {
      e.preventDefault();
      document.getElementById('loginError').textContent = '';
      clearErrors();

      const cpf = cpfInput.value.trim();
      const senha = document.getElementById('senhaInput').value;

      let valid = true;
      if (!validarCPF(cpf)) { showError('grpCpf', 'errCpf', 'CPF inválido.'); valid = false; }
      if (!senha) { showError('grpSenha', 'errSenha', 'Informe a senha.'); valid = false; }
      if (!valid) return;

      const btn = document.getElementById('btnLogin');
      btn.disabled = true;
      btn.textContent = 'Entrando…';

      try {
        const data = await PortalAPI.login({ cpf, senha });
        localStorage.setItem('memberToken', data.token);
        localStorage.setItem('memberInfo', JSON.stringify(data.membro));
        PUI.toast(`Bem-vindo, ${data.membro.nome.split(' ')[0]}!`, 'success');

        // Redireciona admin/bibliotecário para o painel administrativo
        if (data.membro.perfil === 'admin' || data.membro.perfil === 'bibliotecario') {
          try {
            const adminRes = await fetch('/api/admin/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cpf, senha }),
            });
            const adminData = await adminRes.json().catch(() => ({}));
            if (adminRes.ok) localStorage.setItem('adminToken', adminData.token);
          } catch (_) { /* ignora — vai pedir login no /admin */ }
          window.location.href = '/admin';
          return;
        }

        updateHeaderActions();
        const redir = document.getElementById('redirectParam').value;
        if (redir.startsWith('book:')) {
          PortalRouter.go('book', { id: redir.replace('book:', '') });
        } else {
          PortalRouter.go('minha-area');
        }
      } catch (err) {
        document.getElementById('loginError').textContent = err.message;
        btn.disabled = false;
        btn.textContent = 'Entrar';
      }
    });

    document.getElementById('btnGoRegister')?.addEventListener('click', () => PortalRouter.go('register'));
  }

  function clearErrors() {
    document.querySelectorAll('.form-group.has-error').forEach(g => g.classList.remove('has-error'));
  }
  function showError(grpId, errId, msg) {
    const grp = document.getElementById(grpId);
    const err = document.getElementById(errId);
    if (grp) grp.classList.add('has-error');
    if (err) err.textContent = msg;
  }

  return { render };
})();
