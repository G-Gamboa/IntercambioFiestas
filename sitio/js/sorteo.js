// Lógica del sorteo (sin dependencias de la interfaz)

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Asigna a cada persona alguien a quien regalar.
 * - Nadie se saca a sí mismo.
 * - Se respetan las parejas excluidas (en ambos sentidos).
 * - Si recip es true y hay más de 2 personas, se evita A->B y B->A.
 * Devuelve un arreglo de índices (to[i] = a quién le regala i) o null si no hay solución.
 */
export function solve(names, excl, recip) {
  const n = names.length;
  const ban = new Set();
  excl.forEach(([a, b]) => { ban.add(a + '\u001f' + b); ban.add(b + '\u001f' + a); });

  const order = shuffle([...Array(n).keys()]);
  const to = Array(n).fill(-1);
  const used = Array(n).fill(false);
  let steps = 0;

  const go = (k) => {
    if (k === n) return true;
    if (++steps > 300000) return false;
    const g = order[k];
    for (const c of shuffle([...Array(n).keys()])) {
      if (c === g || used[c] || ban.has(names[g] + '\u001f' + names[c])) continue;
      if (recip && n > 2 && to[c] === g) continue;
      to[g] = c; used[c] = true;
      if (go(k + 1)) return true;
      to[g] = -1; used[c] = false;
    }
    return false;
  };

  return go(0) ? to : null;
}

// Devuelve { r: [[quienRegala, aQuien], ...] } o { e: 'mensaje de error' }
export function hacerSorteo({ names, excl, recip }) {
  if (names.length < 3) return { e: 'Se necesitan al menos tres personas para el sorteo.' };
  const to = solve(names, excl, recip);
  if (!to) return { e: 'No se pudo hacer el sorteo con esas restricciones. Quita alguna e intenta de nuevo.' };
  return { r: names.map((g, i) => [g, names[to[i]]]) };
}

// Primera persona que todavía no ha visto su nombre
export const firstUnseen = (names, seen) => names.find((x) => !seen[x]) || null;

// Siguiente persona pendiente después de "cur", dando la vuelta a la lista
export function nextUnseen(names, seen, cur) {
  const n = names.length;
  const i = names.indexOf(cur);
  for (let k = 1; k <= n; k++) {
    const x = names[(i + k) % n];
    if (x !== cur && !seen[x]) return x;
  }
  return null;
}
