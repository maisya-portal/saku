// Utility for WhatsApp Direct Messaging & Protocol Launching
// Bypasses intermediate landing pages and directly launches WhatsApp application

export function formatPhoneNumber(phone) {
  if (!phone) return '';
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (!clean.startsWith('62') && clean.length >= 8) {
    clean = '62' + clean;
  }
  return clean;
}

export function openWhatsAppDirect(phone, text) {
  const cleanPhone = formatPhoneNumber(phone);
  const encodedText = encodeURIComponent(text);

  const waMeUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;
  const appUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`;
  const webUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;

  // Attempt to open wa.me in a new tab/window safely
  try {
    const opened = window.open(waMeUrl, '_blank', 'noopener,noreferrer');
    if (!opened || opened.closed || typeof opened.closed === 'undefined') {
      const a = document.createElement('a');
      a.href = waMeUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  } catch (e) {
    window.location.href = waMeUrl;
  }

  return { appUrl, webUrl, waMeUrl, cleanPhone };
}
