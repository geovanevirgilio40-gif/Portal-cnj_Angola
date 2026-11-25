CNJ.admin.start(async () => {
  'use strict';
  const { $, loading, errorState, toast, confirmDialog, flash } = CNJ.ui;
  const F = CNJ.forms;
  const form = $('#settings-form');
  const status = $('#settings-status');
  F.liveValidation(form);

  async function load() {
    form.hidden = true;
    loading(status);
    try {
      const s = await CNJ.repo.getSettings();
      [...form.elements].forEach((el) => { if (el.name && el.name in s) { el.value = s[el.name]; el.defaultValue = s[el.name]; } });
      const picker = CNJ.imagePicker($('#logo-picker'), { initial: s.logotipo ? [s.logotipo] : [], max: 1, label: 'Logótipo oficial' });
      status.innerHTML = '';
      form.hidden = false;
      form.onsubmit = async (e) => {
        e.preventDefault();
        if (!F.validate(form)) { toast('Corrija os campos assinalados.', 'error'); return; }
        const button = form.querySelector('[type="submit"]');
        F.busy(button, true, 'A guardar…');
        try {
          const [logotipo = ''] = await picker.commit('logotipo');
          await CNJ.repo.saveSettings({ ...F.values(form), logotipo });
          toast(CNJ.isDemo() ? 'Configurações guardadas neste navegador. O rodapé e os contactos já as mostram.' : 'Configurações guardadas.', 'success');
        } catch (err) { toast(`Não foi possível guardar. ${err.message}`, 'error'); }
        finally { F.busy(button, false); }
      };
    } catch (err) { errorState(status, err, load); }
  }

  $('#demo-tools').hidden = !CNJ.isDemo();
  $('#reset-demo').addEventListener('click', async () => {
    if (!await confirmDialog({ title: 'Repor dados de demonstração?', message: 'Tudo o que criou ou alterou neste navegador será apagado.', confirmText: 'Repor dados', danger: true })) return;
    CNJ.repo.resetDemo();
    flash('Dados de demonstração repostos.', 'success');
    location.reload();
  });
  load();
});
