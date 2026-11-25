/** Validação de formulários e tratamento de imagens. */
(function () {
  'use strict';
  const { $, $$ } = CNJ.ui;
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  let uid = 0;

  function errorFor(input) {
    const value = input.value.trim();
    const label = input.dataset.label || input.closest('.field')?.querySelector('label')?.textContent.replace(/\s*\(.*\)/, '').trim() || 'Este campo';
    if (input.required && (input.type === 'checkbox' ? !input.checked : !value)) return `Preencha o campo «${label}».`;
    if (!value) return '';
    if (input.type === 'email' && !EMAIL.test(value)) return 'Indique um endereço de email válido (ex.: nome@dominio.ao).';
    if (input.type === 'url' && !CNJ.ui.safeUrl(value)) return 'A ligação deve começar por https:// ou http://.';
    if (input.type === 'tel' && !/^[+\d][\d\s()-]{6,}$/.test(value)) return 'Indique um número de telefone válido.';
    const min = Number(input.getAttribute('minlength'));
    if (min && value.length < min) return `«${label}» deve ter pelo menos ${min} caracteres.`;
    return '';
  }

  function setError(input, message) {
    const field = input.closest('.field');
    if (!field) return;
    let box = field.querySelector('.field-error');
    if (!box) {
      box = document.createElement('span');
      box.className = 'field-error';
      box.id = `err-${++uid}`;
      field.appendChild(box);
      input.setAttribute('aria-describedby', [input.getAttribute('aria-describedby'), box.id].filter(Boolean).join(' '));
    }
    box.textContent = message;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  const controls = (form) => $$('input, select, textarea', form).filter((i) => i.name && i.type !== 'file');

  /** Valida o formulário, mostra os erros e foca o primeiro campo inválido. */
  function validate(form) {
    let first = null;
    controls(form).forEach((input) => {
      const message = errorFor(input);
      setError(input, message);
      if (message && !first) first = input;
    });
    first?.focus();
    return !first;
  }

  /** Corrige o estado de erro à medida que o utilizador escreve. */
  function liveValidation(form) {
    form.noValidate = true;
    form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target, errorFor(e.target)); });
  }

  function values(form) {
    const data = {};
    controls(form).forEach((i) => { if (i.type !== 'checkbox') data[i.name] = i.type === 'password' ? i.value : i.value.trim(); });
    return data;
  }

  function busy(button, isBusy, text = 'A processar…') {
    if (isBusy) { button.dataset.text = button.textContent; button.textContent = text; }
    else if (button.dataset.text) button.textContent = button.dataset.text;
    button.disabled = isBusy;
    button.setAttribute('aria-busy', String(isBusy));
  }

  /* ---------- Imagens ---------- */
  function checkImage(file) {
    const { TYPES, MAX_BYTES } = CNJ.config.UPLOAD;
    if (!TYPES.includes(file.type)) return `«${file.name}»: formato não aceite. Use JPG, PNG ou WebP.`;
    if (file.size > MAX_BYTES) return `«${file.name}»: excede o limite de ${MAX_BYTES / 1048576} MB.`;
    return '';
  }

  /** Reduz a imagem antes de a guardar no protótipo local (o localStorage é pequeno). */
  function compressToDataURL(file, maxSide = 900, quality = 0.72) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`Não foi possível ler a imagem «${file.name}».`)); };
      img.src = url;
    });
  }

  CNJ.forms = { validate, liveValidation, values, setError, busy, checkImage, compressToDataURL };
})();
