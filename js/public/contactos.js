(function () {
  'use strict';
  const { html, $, setHTML, icon } = CNJ.ui;
  const F = CNJ.forms;
  const { social, value } = CNJ.navigation;

  CNJ.settingsReady.then((s) => {
    const rows = [['mail', 'Email institucional', s.email, 'email@exemplo (por definir)'], ['phone', 'Telefone', s.telefone, '+244 000 000 000 (por definir)'], ['pin', 'Endereço', s.endereco, 'Endereço da sede (por definir)'], ['calendar', 'Horário de atendimento', s.horario, 'Horário por definir']];
    setHTML($('#contact-data'), rows.map(([i, label, v, placeholder]) => html`<li>${icon(i)}<div><strong>${label}</strong>${value(v, placeholder)}</div></li>`));
    setHTML($('#contact-social'), social(s));
  });

  $('#contact-notice').hidden = !CNJ.isDemo();
  const form = $('#contact-form');
  const result = $('#contact-result');
  F.liveValidation(form);
  const show = (type, message) => { result.className = `alert alert-${type}`; result.textContent = message; result.hidden = false; };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    result.hidden = true;
    if (!F.validate(form)) { show('error', 'Corrija os campos assinalados.'); return; }
    if (CNJ.isDemo()) {
      show('warning', 'A sua mensagem NÃO foi enviada. O serviço de envio ainda não está ligado. Utilize os contactos oficiais quando forem publicados.');
      return;
    }
    const button = form.querySelector('[type="submit"]');
    F.busy(button, true, 'A enviar…');
    try {
      await CNJ.repo.sendContact(F.values(form));
      form.reset();
      show('success', 'Mensagem recebida pelo servidor.');
    } catch (err) {
      show('error', `A mensagem não foi enviada. ${err.message}`);
    } finally {
      F.busy(button, false);
    }
  });
})();
