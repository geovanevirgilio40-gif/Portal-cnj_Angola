(function () {
  'use strict';
  const { $, showFlash } = CNJ.ui;
  const F = CNJ.forms;
  const form = $('#login-form');
  const password = $('#password');
  const toggle = $('#toggle-password');
  const result = $('#login-result');
  const show = (type, message) => { result.className = `alert alert-${type}`; result.textContent = message; result.hidden = false; };

  F.liveValidation(form);
  showFlash();
  $('#demo-entry').hidden = !CNJ.isDemo();

  toggle.addEventListener('click', () => {
    const visible = password.type === 'text';
    password.type = visible ? 'password' : 'text';
    toggle.textContent = visible ? 'Mostrar' : 'Ocultar';
    toggle.setAttribute('aria-pressed', String(!visible));
    toggle.setAttribute('aria-label', `${visible ? 'Mostrar' : 'Ocultar'} palavra-passe`);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    result.hidden = true;
    if (!F.validate(form)) return;
    if (CNJ.isDemo()) {
      password.value = '';
      show('error', 'Não é possível iniciar sessão: o serviço de autenticação ainda não está ligado. As credenciais não foram verificadas nem enviadas.');
      return;
    }
    const button = form.querySelector('[type="submit"]');
    F.busy(button, true, 'A entrar…');
    try {
      const { email, password: secret } = F.values(form);
      await CNJ.auth.login(email, secret);
      location.assign('dashboard.html');
    } catch (err) {
      password.value = '';
      show('error', err.status === 401 ? 'Email ou palavra-passe incorrectos.' : err.message);
      F.busy(button, false);
    }
  });
})();
