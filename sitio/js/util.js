// Utilidades generales de la interfaz

export const $ = (id) => document.getElementById(id);

// Escapa texto del usuario antes de insertarlo en HTML
export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// "2026-12-19" -> "Sábado, 19 de diciembre"
export function fmtDate(d) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || '');
  if (!m) return '';
  const t = new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' });
  return t.charAt(0).toUpperCase() + t.slice(1);
}
