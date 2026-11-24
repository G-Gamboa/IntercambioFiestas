// Intercambio navideño - interfaz
// Vista del organizador + vista de entrega (pasar -> ver -> devolver -> siguiente)

import { $, esc, fmtDate } from './util.js';
import { I } from './iconos.js';
import { hacerSorteo, firstUnseen, nextUnseen } from './sorteo.js';
import { load, save } from './estado.js';

const S = load();
let pendingDraw = null;
let pinOk = null;

/* =========================================================
   Render general
   ========================================================= */
function render() {
  const done = !!S.result;
  const n = S.names.length;
  const seenN = done ? S.names.filter((x) => S.seen[x]).length : 0;
  const left = n - seenN;

  $('mainTitle').textContent = done ? 'Sorteo listo' : 'Participantes';
  $('count').textContent = done
    ? seenN + ' de ' + n + ' ya tienen su nombre'
    : n + (n === 1 ? ' participante' : ' participantes');
  $('sampleNote').hidden = !S.sample || done;
  $('doneHint').hidden = !done || !left;
  $('setup').hidden = done;
  $('turns').hidden = !done;

  if (done) {
    $('deliverBtn').hidden = !left;
    $('allDone').hidden = !!left;
    $('deliverBtn').innerHTML = I.arrow + (seenN ? 'Continuar la entrega (faltan ' + left + ')' : 'Entregar nombres');
  }

  renderGarland();
  renderSide();
  renderDelivery();
  save(S);
}

/* Cordón con una etiqueta por persona */
function renderGarland() {
  const g = $('garland');
  if (!S.names.length) {
    g.innerHTML = '<p class="empty">Todavía no hay nombres. Agrega al menos tres para hacer el sorteo.</p>';
    return;
  }
  g.innerHTML = S.names.map((n, i) => {
    const nm = esc(n);
    if (!S.result) {
      return '<div class="hang"><span class="tag"><span class="nm">' + nm + '</span>'
        + '<button type="button" class="x" data-rm="' + i + '" aria-label="Quitar a ' + nm + '">' + I.x + '</button></span></div>';
    }
    const s = !!S.seen[n];
    return '<button type="button" class="hang pick' + (s ? ' seen' : '') + '" data-i="' + i + '"' + (s ? ' disabled' : '')
      + ' aria-label="' + (s ? nm + ' ya tiene su nombre' : 'Empezar la entrega con ' + nm) + '">'
      + '<span class="tag"><span class="nm">' + nm + '</span><span class="st">' + (s ? I.lock + 'Ya lo vio' : 'Pendiente') + '</span></span></button>';
  }).join('');
}

/* Panel lateral: restricciones */
function renderSide() {
  const a = $('exA'), b = $('exB'), va = a.value, vb = b.value;
  const opts = S.names.map((n) => '<option value="' + esc(n) + '">' + esc(n) + '</option>').join('');
  a.innerHTML = opts;
  b.innerHTML = opts;
  if (S.names.includes(va)) a.value = va;
  if (S.names.includes(vb)) b.value = vb;
  else if (S.names.length > 1) b.selectedIndex = 1;
  [a, b, $('exAdd')].forEach((el) => { el.disabled = S.names.length < 2; });

  $('exList').innerHTML = S.excl.length
    ? S.excl.map(([x, y], i) => '<li class="chip">' + esc(x) + ' y ' + esc(y)
        + '<button type="button" data-ex="' + i + '" aria-label="Quitar restricción">' + I.x + '</button></li>').join('')
    : '<li class="chip-empty">Sin restricciones.</li>';
  $('exNote').hidden = !S.result;
  $('recip').checked = S.recip;
}

/* =========================================================
   Vista de entrega
   pass   -> verde: pásale el teléfono a X
   reveal -> rojo: X ve a quién le regala
   back   -> casi negro: devuelve el teléfono, siguiente
   done   -> todos terminaron
   ========================================================= */
let lastView = '';
function renderDelivery() {
  const v = $('dv');
  if (!S.del || !S.result) {
    v.hidden = true;
    document.body.style.overflow = '';
    lastView = '';
    return;
  }
  v.hidden = false;
  document.body.style.overflow = 'hidden';

  const n = S.names.length;
  const seenN = S.names.filter((x) => S.seen[x]).length;
  const { phase: p, cur } = S.del;

  $('dvProg').textContent = seenN + ' de ' + n;
  $('dvBar').style.width = (n ? (seenN / n) * 100 : 0) + '%';
  v.dataset.p = p;
  $('dvExit').hidden = p === 'reveal';

  const key = p + '|' + cur;
  if (key === lastView) return;
  lastView = key;

  const m = $('dvMain');
  const c = esc(cur || '');

  if (p === 'pass') {
    const nx = nextUnseen(S.names, S.seen, cur);
    m.innerHTML = '<p class="dvk">Pásale el teléfono a</p><h2 id="dvTitle" class="dvname">' + c + '</h2>'
      + '<span class="bigwrap"><span class="bigtag"><span class="from">De: ' + c + '</span><span class="para">Para</span><span class="big">?</span></span></span>'
      + '<button type="button" class="btn white" id="dvShow">' + I.eye + 'Ver a quién le regalo</button>'
      + (nx ? '<button type="button" class="link" id="dvSkip">Saltar por ahora</button>' : '');
  } else if (p === 'reveal') {
    const pair = S.result.find((x) => x[0] === cur);
    const f = fmtDate(S.date);
    m.innerHTML = '<p class="dvk">' + c + ', le regalas a</p><h2 id="dvTitle" class="sr">Tu resultado</h2>'
      + '<span class="bigwrap"><span class="bigtag swing"><span class="from">De: ' + c + '</span><span class="para">Para</span><span class="big">' + esc(pair ? pair[1] : '') + '</span></span></span>'
      + (S.budget ? '<p class="meta">Presupuesto: Q' + esc(S.budget) + '</p>' : '')
      + (f ? '<p class="meta">' + esc(f) + '</p>' : '')
      + '<button type="button" class="btn white" id="dvHide">' + I.hide + 'Ocultar</button>'
      + '<p class="dvsmall">Al ocultarla ya no se puede volver a ver.</p>';
  } else if (p === 'back') {
    const nx = nextUnseen(S.names, S.seen, cur);
    m.innerHTML = I.phone + '<h2 id="dvTitle" class="dvname sm">Devuélvele el teléfono a quien organiza</h2>'
      + '<button type="button" class="btn white" id="dvNext">' + (nx ? 'Siguiente: ' + esc(nx) : 'Terminar') + I.arrow + '</button>';
  } else {
    m.innerHTML = I.done + '<h2 id="dvTitle" class="dvname sm">Todos ya tienen su nombre</h2>'
      + '<p class="dvsmall">Que disfruten el intercambio.</p>'
      + '<button type="button" class="btn white" id="dvClose">Volver al organizador</button>';
  }

  const b = m.querySelector('.btn');
  if (b) b.focus({ preventScroll: true });
}

function startDelivery(name) {
  if (!name) return;
  S.del = { cur: name, phase: 'pass' };
  render();
}

/* =========================================================
   Lista de nombres y restricciones
   ========================================================= */
function addNames(text) {
  const parts = text.split(/[,;\n\r]+/).map((s) => s.trim().replace(/\s+/g, ' ').slice(0, 40)).filter(Boolean);
  if (!parts.length) return;
  if (S.sample) { S.names = []; S.excl = []; S.sample = false; }

  const have = new Set(S.names.map((n) => n.toLowerCase()));
  const dup = [];
  parts.forEach((p) => {
    const k = p.toLowerCase();
    if (have.has(k)) { dup.push(p); return; }
    have.add(k);
    S.names.push(p);
  });
  $('err').textContent = dup.length
    ? 'Ya estaba en la lista: ' + dup.join(', ') + '. Si son personas distintas, agrega un apellido o una inicial.'
    : '';
  render();
}

function removeName(i) {
  const n = S.names.splice(i, 1)[0];
  const ex = S.excl.filter((p) => p.includes(n));
  S.excl = S.excl.filter((p) => !p.includes(n));
  toast('Quitaste a ' + n + '.', () => { S.names.splice(i, 0, n); S.excl.push(...ex); render(); });
  render();
}

function addExclusion() {
  const a = $('exA').value, b = $('exB').value;
  if (!a || !b || a === b) return;
  if (!S.excl.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) S.excl.push([a, b]);
  render();
}

/* =========================================================
   Diálogos (PIN) y avisos
   ========================================================= */
let lastFocus = null;
function openDialog(html) {
  lastFocus = document.activeElement;
  $('dlg').innerHTML = html;
  $('ov').hidden = false;
  const f = $('dlg').querySelector('input,button');
  if (f) f.focus();
}
function closeDialog() {
  $('ov').hidden = true;
  $('dlg').innerHTML = '';
  pinOk = null;
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
}
const pinField = (id, label) =>
  '<label for="' + id + '">' + label + '<input id="' + id + '" class="pin" type="password" inputmode="numeric" maxlength="4" autocomplete="off"></label>';

function askPin(title, text, fn) {
  openDialog('<h2 id="dlgT">' + title + '</h2><p>' + text + '</p><form id="pinForm">'
    + pinField('pinIn', 'PIN del organizador')
    + '<p id="pinErr" class="err" role="alert"></p>'
    + '<div class="row center"><button class="btn" type="submit">Continuar</button><button type="button" class="btn ghost" data-close>Cancelar</button></div>'
    + '<button type="button" class="link" id="forgot">Olvidé el PIN</button></form>');
  pinOk = fn;
}

function startDraw() {
  const d = hacerSorteo(S);
  if (d.e) { $('err').textContent = d.e; return; }
  $('err').textContent = '';
  pendingDraw = d.r;
  openDialog('<h2 id="dlgT">Crea tu PIN de organizador</h2><p>Lo pedirá para empezar la entrega, repetir el sorteo o editar la lista.</p><form id="newPin">'
    + pinField('pin1', 'PIN de 4 números') + pinField('pin2', 'Repite el PIN')
    + '<p id="pinErr" class="err" role="alert"></p>'
    + '<div class="row center"><button class="btn" type="submit">Hacer sorteo</button><button type="button" class="btn ghost" data-close>Cancelar</button></div></form>');
}

let toastTimer = 0;
let undoFn = null;
function toast(text, fn) {
  undoFn = fn || null;
  $('toastT').textContent = text;
  $('undo').hidden = !fn;
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('toast').hidden = true; undoFn = null; }, 6000);
}

function resetDraw() {
  S.result = null; S.seen = {}; S.pin = ''; S.del = null;
}

/* =========================================================
   Eventos
   ========================================================= */
document.addEventListener('click', (e) => {
  const t = e.target.closest('button');
  if (!t) return;
  const d = t.dataset;

  if (d.rm !== undefined) return removeName(+d.rm);
  if (t.classList.contains('pick')) {
    const n = S.names[+d.i];
    if (!S.result || S.seen[n]) return;
    return askPin('Empezar con ' + esc(n), 'Escribe tu PIN y pásale el teléfono a ' + esc(n) + '.', () => startDelivery(n));
  }
  if (d.close !== undefined) return closeDialog();
  if (d.ex !== undefined) { S.excl.splice(+d.ex, 1); return render(); }

  switch (t.id) {
    case 'clearSample':
      S.names = []; S.excl = []; S.sample = false;
      render();
      return $('newName').focus();
    case 'draw':
      return startDraw();
    case 'deliverBtn':
      return askPin('Entregar nombres', 'Escribe tu PIN. Luego pásale el teléfono a cada persona; cuando te lo devuelva, tocas Siguiente.',
        () => startDelivery(firstUnseen(S.names, S.seen)));
    case 'exAdd':
      return addExclusion();

    // Vista de entrega
    case 'dvShow':
      if (!S.del || S.del.phase !== 'pass' || S.seen[S.del.cur]) return;
      S.seen[S.del.cur] = true;   // se marca al abrir: nunca se vuelve a mostrar
      S.del.phase = 'reveal';
      return render();
    case 'dvHide':
      if (S.del) S.del.phase = 'back';
      return render();
    case 'dvNext': {
      const nx = S.del && nextUnseen(S.names, S.seen, S.del.cur);
      S.del = nx ? { cur: nx, phase: 'pass' } : { cur: null, phase: 'done' };
      return render();
    }
    case 'dvSkip': {
      const nx = S.del && nextUnseen(S.names, S.seen, S.del.cur);
      if (nx) { S.del.cur = nx; render(); }
      return;
    }
    case 'dvExit':
    case 'dvClose':
      S.del = null;
      return render();

    // Acciones protegidas con PIN
    case 'redo':
      return askPin('Repetir sorteo', 'Se hará un sorteo nuevo con la misma lista. Quienes ya vieron su nombre tendrán que verlo otra vez.', () => {
        const r = hacerSorteo(S);
        if (r.e) return toast(r.e);
        S.result = r.r; S.seen = {}; S.del = null;
        render();
        toast('Sorteo nuevo listo.');
      });
    case 'edit':
      return askPin('Editar la lista', 'Se borrará el sorteo actual para que puedas cambiar los nombres. Después haces uno nuevo.', () => {
        resetDraw();
        render();
      });
    case 'forgot':
      return openDialog('<h2 id="dlgT">¿Olvidaste el PIN?</h2><p>Sin el PIN no se puede seguir entregando. Puedes borrar este sorteo y hacer uno nuevo; quienes ya vieron su nombre tendrán que verlo otra vez.</p>'
        + '<div class="row center"><button type="button" class="btn" id="wipe">Borrar sorteo</button><button type="button" class="btn ghost" data-close>Cancelar</button></div>');
    case 'wipe':
      resetDraw();
      closeDialog();
      render();
      return toast('Sorteo borrado. Puedes hacer uno nuevo.');
    case 'undo':
      if (undoFn) undoFn();
      undoFn = null;
      $('toast').hidden = true;
      return;
  }
});

document.addEventListener('submit', (e) => {
  const f = e.target;
  if (f.id === 'addForm') {
    e.preventDefault();
    const v = $('newName').value;
    $('newName').value = '';
    addNames(v);
    $('newName').focus();
    return;
  }
  if (f.id === 'pinForm') {
    e.preventDefault();
    if ($('pinIn').value === S.pin) {
      const fn = pinOk;
      closeDialog();
      if (fn) fn();
    } else {
      $('pinErr').textContent = 'PIN incorrecto.';
      $('pinIn').value = '';
      $('pinIn').focus();
    }
    return;
  }
  if (f.id === 'newPin') {
    e.preventDefault();
    const a = $('pin1').value, b = $('pin2').value;
    if (!/^\d{4}$/.test(a)) { $('pinErr').textContent = 'El PIN debe tener 4 números.'; return; }
    if (a !== b) { $('pinErr').textContent = 'Los dos PIN no coinciden.'; $('pin2').value = ''; $('pin2').focus(); return; }
    S.pin = a; S.result = pendingDraw; S.seen = {}; S.del = null; pendingDraw = null;
    closeDialog();
    render();
    toast('Sorteo listo. Toca Entregar nombres cuando estén todos.');
  }
});

$('ov').addEventListener('click', (e) => { if (e.target === $('ov')) closeDialog(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('ov').hidden) closeDialog(); });

$('newName').addEventListener('paste', (e) => {
  const tx = (e.clipboardData && e.clipboardData.getData('text')) || '';
  if (/[\n,;]/.test(tx)) { e.preventDefault(); addNames(tx); }
});
$('ev').addEventListener('input', (e) => { S.ev = e.target.value.trim(); save(S); });
$('budget').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); S.budget = e.target.value; save(S); });
$('date').addEventListener('input', (e) => { S.date = e.target.value; save(S); });
$('recip').addEventListener('change', (e) => { S.recip = e.target.checked; save(S); });

/* =========================================================
   Inicio
   ========================================================= */
$('ev').value = S.ev || '';
$('budget').value = S.budget || '';
$('date').value = S.date || '';
render();
