// Estado de la app y guardado en el navegador (localStorage)

const KEY = 'intercambio-navideno-v3';

function defaults() {
  return {
    names: ['Ana', 'Luis', 'María José', 'Carlos', 'Sofía', 'Diego', 'Valeria', 'Andrés'],
    sample: true,                 // true mientras la lista sea la de ejemplo
    excl: [['Ana', 'Luis']],      // parejas que no se pueden tocar
    recip: true,                  // evitar A->B y B->A
    ev: 'Intercambio de la oficina',
    budget: '150',
    date: '2026-12-19',
    result: null,                 // [[quienRegala, aQuien], ...]
    seen: {},                     // { nombre: true } cuando ya vio su etiqueta
    pin: '',                      // PIN del organizador
    del: null,                    // entrega en curso: { cur, phase: 'pass' | 'reveal' | 'back' | 'done' }
  };
}

export function load() {
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem(KEY)); } catch (e) { /* sin almacenamiento */ }
  const valid = stored && typeof stored === 'object' && Array.isArray(stored.names);
  const S = Object.assign(defaults(), valid ? stored : {});

  // Si se recargó con una etiqueta abierta (o ya vista), nunca se vuelve a mostrar
  if (S.del && (S.del.phase === 'reveal' || (S.del.phase === 'pass' && S.seen[S.del.cur]))) {
    S.del.phase = 'back';
  }
  return S;
}

export function save(S) {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* sin almacenamiento */ }
}
