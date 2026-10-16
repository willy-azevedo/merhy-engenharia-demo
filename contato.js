(() => {
  const form = document.querySelector('.contact-message-form');
  const requiredFields = [...form.querySelectorAll('[required]')];
  requiredFields.forEach(field => field.addEventListener('input', () => field.setCustomValidity('')));
  form.hidden = false;
  form.addEventListener('submit', event => {
    event.preventDefault();
    requiredFields.forEach(field => field.setCustomValidity(field.value.trim() ? '' : 'Preencha este campo.'));
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const name = String(data.get('name')).trim();
    const message = String(data.get('message')).trim();
    const email = String(data.get('email') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const interest = String(data.get('interest') || '').trim();
    const text = [`Olá! Meu nome é ${name}.`, email ? `E-mail: ${email}` : '', phone ? `Telefone: ${phone}` : '', interest ? `Tenho interesse em: ${interest}.` : '', message].filter(Boolean).join('\n\n');
    window.open(`https://wa.me/5542988039529?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  });
})();
