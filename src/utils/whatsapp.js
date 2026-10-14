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

  // whatsapp://send directly opens WhatsApp Desktop on PC or WhatsApp app on Mobile (No intermediate web page)
  const appUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`;
  const webUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  const waMeUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

  // Attempt to open the direct application protocol
  try {
    const a = document.createElement('a');
    a.href = appUrl;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (e) {
    window.location.href = appUrl;
  }

  return { appUrl, webUrl, waMeUrl, cleanPhone };
}
