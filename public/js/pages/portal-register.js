/* portal-register.js — member registration page */

const RegisterPage = (() => {

  function render() {
    PUI.setContent(`
      <div class="auth-page" style="max-width:540px;">
        <div class="auth-card">
          <i class="fa-solid fa-user-plus" style="display:block;text-align:center;font-size:2rem;color:var(--p-primary);margin-bottom:.75rem;"></i>
          <h2>Criar conta</h2>
          <p class="auth-sub">Cadastre-se para reservar livros online</p>

          <form id="registerForm" novalidate>
            <div class="form-row">
              <div class="form-group" id="grpNome" style="grid-column:1/-1;">
                <label>Nome completo *</label>
                <input type="text" id="inputNome" placeholder="Seu nome completo" autocomplete="name" />
                <span class="field-error" id="errNome">Nome é obrigatório</span>
              </div>
            </div>

            <div class="form-group" id="grpCpf">
              <label>CPF *</label>
              <input type="text" id="inputCpf" placeholder="000.000.000-00" maxlength="14" autocomplete="off" />
              <span class="field-hint">O CPF será validado pelos dígitos verificadores</span>
              <span class="field-error" id="errCpf">CPF inválido</span>
            </div>

            <div class="form-row">
              <div class="form-group" id="grpEmail">
                <label>E-mail</label>
                <input type="email" id="inputEmail" placeholder="email@exemplo.com" autocomplete="email" />
                <span class="field-error" id="errEmail">E-mail inválido</span>
              </div>
              <div class="form-group" id="grpTelefone">
                <label>Telefone</label>
                <input type="text" id="inputTelefone" placeholder="(11) 99999-0000" maxlength="15" />
              </div>
            </div>

            <div class="form-group" id="grpTipo">
              <label>Tipo de membro *</label>
              <select id="inputTipo">
                <option value="Comum">Comum</option>
                <option value="Estudante">Estudante</option>
              </select>
              <span class="field-hint">Professores são cadastrados somente pelo balcão</span>
            </div>

            <div class="form-row">
              <div class="form-group" id="grpSenha">
                <label>Senha *</label>
                <input type="password" id="inputSenha" placeholder="Mín. 6 caracteres" autocomplete="new-password" />
                <span class="field-error" id="errSenha">Mín. 6 caracteres</span>
              </div>
              <div class="form-group" id="grpSenha2">
                <label>Confirmar senha *</label>
                <input type="password" id="inputSenha2" placeholder="Repita a senha" autocomplete="new-password" />
                <span class="field-error" id="errSenha2">Senhas não coincidem</span>
              </div>
            </div>

            <p id="registerError" style="color:var(--p-danger);font-size:.875rem;min-height:1.2rem;margin-bottom:.5rem;"></p>

            <button type="submit" class="pbtn pbtn-primary" style="width:100%;justify-content:center;" id="btnRegister">
              Criar conta
            </button>
          </form>

          <p class="auth-footer">
            Já tem conta? <a href="#" id="goLogin">Entrar</a>
          </p>
        </div>
      </div>
    `);

    // CPF mask + validation feedback
    const cpfInput = document.getElementById('inputCpf');
    cpfInput?.addEventListener('input', e => {
      e.target.value = maskCPF(e.target.value);
      const raw = e.target.value;
      if (raw.replace(/\D/g,'').length === 11) {
        if (validarCPF(raw)) {
          e.target.classList.add('cpf-valid');
          e.target.classList.remove('cpf-invalid');
        } else {
          e.target.classList.add('cpf-invalid');
          e.target.classList.remove('cpf-valid');
        }
      } else {
        e.target.classList.remove('cpf-valid', 'cpf-invalid');
      }
    });

    // Phone mask
    document.getElementById('inputTelefone')?.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g,'');
      if (v.length <= 10) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
      else v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
      e.target.value = v.slice(0, 15);
    });

    document.getElementById('registerForm')?.addEventListener('submit', async e => {
      e.preventDefault();
      document.getElementById('registerError').textContent = '';
      clearErrors();

      const nome   = document.getElementById('inputNome').value.trim();
      const cpf    = cpfInput.value.trim();
      const email  = document.getElementById('inputEmail').value.trim();
      const tel    = document.getElementById('inputTelefone').value.trim();
      const tipo   = document.getElementById('inputTipo').value;
      const senha  = document.getElementById('inputSenha').value;
      const senha2 = document.getElementById('inputSenha2').value;

      let valid = true;
      if (!nome || nome.length < 2) { showError('grpNome', 'errNome', 'Nome é obrigatório (mín. 2 caracteres).'); valid = false; }
      if (!validarCPF(cpf)) { showError('grpCpf', 'errCpf', 'CPF inválido. Verifique os dígitos.'); valid = false; }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('grpEmail', 'errEmail', 'E-mail inválido.'); valid = false; }
      if (senha.length < 6) { showError('grpSenha', 'errSenha', 'Mín. 6 caracteres.'); valid = false; }
      if (senha !== senha2) { showError('grpSenha2', 'errSenha2', 'Senhas não coincidem.'); valid = false; }
      if (!valid) return;

      const btn = document.getElementById('btnRegister');
      btn.disabled = true;
      btn.textContent = 'Cadastrando…';

      try {
        const data = await PortalAPI.register({ nome, cpf, email: email || undefined, telefone: tel || undefined, tipo, senha });
        localStorage.setItem('memberToken', data.token);
        localStorage.setItem('memberInfo', JSON.stringify(data.membro));
        PUI.toast(data.mensagem, 'success', 5000);
        updateHeaderActions();
        PortalRouter.go('minha-area');
      } catch (err) {
        document.getElementById('registerError').textContent = err.message;
        btn.disabled = false;
        btn.textContent = 'Criar conta';
      }
    });

    document.getElementById('goLogin')?.addEventListener('click', e => { e.preventDefault(); PortalRouter.go('login'); });
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
