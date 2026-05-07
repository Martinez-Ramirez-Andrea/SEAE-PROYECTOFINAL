/* ================================================================
   SEAE — app.js
   VPN · CAE · TIR · Comparación · Reporte PDF formal completo
   Incluye: datos, fórmula, procedimiento paso a paso, interpretación
   ================================================================ */

const store = {};
const $   = id => document.getElementById(id);
const v   = id => parseFloat($(id).value) || 0;
const vi  = id => Math.max(1, parseInt($(id).value) || 1);
const str = id => ($(id).value || '').trim();

const money = n => '$' + Number(n).toLocaleString('es-SV', { minimumFractionDigits:2, maximumFractionDigits:2 });
const pct   = n => n.toFixed(4) + '%';
const dec   = (n, d=4) => Number(n).toFixed(d);

/* ── Navegación ─────────────────────────────────────────────── */
function openApp() {
  $('welcome-screen').style.display = 'none';
  $('app-screen').style.display     = 'flex';
  showSection('vpn', document.querySelector('.nav-item[data-sec="vpn"]'));
}
function backToWelcome() {
  $('app-screen').style.display     = 'none';
  $('welcome-screen').style.display = 'flex';
}
function showSection(id, el) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  $('sec-' + id).classList.add('active');
  if (el) el.classList.add('active');
  const meta = {
    vpn:      ['Valor Presente Neto',           'Determina si el proyecto genera valor sobre la inversión inicial'],
    cae:      ['Costo Anual Equivalente',        'Convierte todos los costos en una cuota anual uniforme comparable'],
    tir:      ['Tasa Interna de Retorno',        'Tasa a la que el VPN del proyecto es exactamente cero'],
    comparar: ['Comparación de Alternativas',    'Evalúa dos proyectos lado a lado con recomendación automática'],
    reporte:  ['Reporte del Análisis',           'Resumen completo de todos los cálculos de la sesión'],
  };
  if (meta[id]) {
    $('topbar-h').textContent   = meta[id][0];
    $('topbar-sub').textContent = meta[id][1];
  }
  if (id === 'reporte') renderReport();
}

/* ── Render pasos ───────────────────────────────────────────── */
function renderSteps(cid, steps) {
  $(cid).innerHTML = steps.map((s, i) => `
    <div class="step">
      <div class="step-num">${i + 1}</div>
      <div class="step-body">
        <div class="step-desc">${s.desc}</div>
        <div class="step-formula">${s.formula}</div>
        ${s.result ? `<div class="step-valor">→ ${s.result}</div>` : ''}
      </div>
    </div>`).join('');
}

function renderFinal(cid, value, label, verdict) {
  const cls = verdict === 'accept' ? 'verdict-accept'
            : verdict === 'reject' ? 'verdict-reject'
            : 'verdict-neutral';
  const txt = verdict === 'accept' ? '✔ ACEPTAR'
            : verdict === 'reject' ? '✘ RECHAZAR'
            : '↔ COMPARAR';
  $(cid).innerHTML = `
    <div class="final-result">
      <div>
        <div class="final-rlabel">${label}</div>
        <div class="final-value">${value}</div>
      </div>
      <div class="final-verdict ${cls}">${txt}</div>
    </div>`;
}

function renderInterp(cid, title, html) {
  $(cid).innerHTML = `
    <div class="interp-box">
      <div class="interp-title">${title}</div>
      <div class="interp-text">${html}</div>
    </div>`;
}

/* ================================================================
   VPN
   ================================================================ */
function calcVPN() {
  const I  = v('vpn-inv');
  const FC = v('vpn-flujo');
  const i  = v('vpn-tasa') / 100;
  const n  = vi('vpn-vida');
  const VR = v('vpn-rescate');

  const factorVA = i > 0 ? (1 - Math.pow(1 + i, -n)) / i : n;
  let vaFlujos = 0;
  for (let t = 1; t <= n; t++) vaFlujos += FC / Math.pow(1 + i, t);
  const vaRescate = VR / Math.pow(1 + i, n);
  const vpn = -I + vaFlujos + vaRescate;
  const verdict = vpn >= 0 ? 'accept' : 'reject';

  renderSteps('vpn-steps', [
    {
      desc:    'Datos del proyecto',
      formula: `I₀ = ${money(I)}   FC = ${money(FC)}   i = ${dec(i * 100)}%   n = ${n} años   VR = ${money(VR)}`,
    },
    {
      desc:    'Factor de Valor Actual  (P/A, i, n)',
      formula: `(P/A) = [ 1 − (1 + ${dec(i * 100)}%)⁻${n} ] ÷ ${dec(i * 100)}%`,
      result:  dec(factorVA),
    },
    {
      desc:    'Valor actual de los flujos de efectivo',
      formula: `VA_FC = FC × (P/A) = ${money(FC)} × ${dec(factorVA)}`,
      result:  money(vaFlujos),
    },
    {
      desc:    'Valor actual del rescate  (P/F, i, n)',
      formula: `VA_VR = VR ÷ (1 + i)ⁿ = ${money(VR)} ÷ (1 + ${dec(i * 100)}%)${n}`,
      result:  money(vaRescate),
    },
    {
      desc:    'Valor Presente Neto',
      formula: `VPN = −I₀ + VA_FC + VA_VR = −${money(I)} + ${money(vaFlujos)} + ${money(vaRescate)}`,
      result:  money(vpn),
    },
    {
      desc:    'Criterio de decisión',
      formula: vpn >= 0
        ? `VPN = ${money(vpn)} > $0.00  →  Proyecto ACEPTABLE`
        : `VPN = ${money(vpn)} < $0.00  →  Proyecto NO ACEPTABLE`,
    },
  ]);

  renderFinal('vpn-final', money(vpn), 'Resultado — VPN', verdict);

  const interpHtml = vpn >= 0
    ? `El proyecto genera un excedente neto de <strong>${money(vpn)}</strong> sobre la inversión
       inicial de ${money(I)}, evaluado a una tasa de descuento del <strong>${dec(i * 100, 2)}%</strong>
       durante <strong>${n} año(s)</strong>. Esto significa que el proyecto <strong>crea valor</strong>
       para la organización y recupera la inversión superando el rendimiento mínimo requerido.
       Se <strong>recomienda aceptarlo</strong>.`
    : `El proyecto genera un déficit de <strong>${money(Math.abs(vpn))}</strong> al evaluarlo con
       la tasa de descuento del <strong>${dec(i * 100, 2)}%</strong>. Esto indica que
       <strong>no se recupera la inversión inicial</strong> de ${money(I)} bajo las condiciones
       actuales. Se <strong>recomienda rechazarlo</strong> o revisar los flujos de efectivo proyectados.`;

  renderInterp('vpn-interp', 'Interpretación del resultado', interpHtml);

  store.vpn = {
    I, FC, i: i * 100, n, VR, vpn, vaFlujos, vaRescate, factorVA,
    interp: interpHtml.replace(/<[^>]+>/g, ''),
  };
}

function clearVPN() {
  ['vpn-inv', 'vpn-flujo', 'vpn-tasa', 'vpn-vida', 'vpn-rescate']
    .forEach(id => $(id).value = '');
  ['vpn-steps', 'vpn-final', 'vpn-interp']
    .forEach(id => $(id).innerHTML = '');
  delete store.vpn;
}

/* ================================================================
   CAE
   ================================================================ */
function calcCAE() {
  const P   = v('cae-inv');
  const CAO = v('cae-op');
  const i   = v('cae-tasa') / 100;
  const n   = vi('cae-vida');
  const VS  = v('cae-salvamento');

  const fn     = Math.pow(1 + i, n);
  const crr    = i > 0 ? (i * fn) / (fn - 1) : 1 / n;
  const vaVS   = VS / fn;
  const caeCap = (P - VS) * crr;
  const caeOp  = VS * i;
  const cae    = caeCap + caeOp + CAO;

  renderSteps('cae-steps', [
    {
      desc:    'Datos del proyecto',
      formula: `P = ${money(P)}   CAO = ${money(CAO)}   i = ${dec(i * 100)}%   n = ${n} años   VS = ${money(VS)}`,
    },
    {
      desc:    'Factor de Recuperación de Capital  (A/P, i, n)',
      formula: `CRR = i·(1+i)ⁿ ÷ ((1+i)ⁿ − 1) = ${dec(i * 100)}% × ${dec(fn)} ÷ (${dec(fn)} − 1)`,
      result:  dec(crr),
    },
    {
      desc:    'Costo de capital anual equivalente',
      formula: `C_cap = (P − VS) × CRR = (${money(P)} − ${money(VS)}) × ${dec(crr)}`,
      result:  money(caeCap),
    },
    {
      desc:    'Costo de oportunidad del valor de salvamento',
      formula: `C_VS = VS × i = ${money(VS)} × ${dec(i * 100)}%`,
      result:  money(caeOp),
    },
    {
      desc:    'Costo Anual Equivalente total',
      formula: `CAE = C_cap + C_VS + CAO = ${money(caeCap)} + ${money(caeOp)} + ${money(CAO)}`,
      result:  money(cae),
    },
    {
      desc:    'Criterio de decisión',
      formula: `Menor CAE = alternativa más económica. CAE de esta alternativa = ${money(cae)}`,
    },
  ]);

  renderFinal('cae-final', money(cae), 'Resultado — CAE anual', 'neutral');

  const interpHtml =
    `El costo anual equivalente de esta alternativa es <strong>${money(cae)}/año</strong>.
     Este valor representa el costo promedio anual que incluye:
     la recuperación del capital invertido (<strong>${money(caeCap)}/año</strong>),
     el costo de oportunidad del valor de salvamento (<strong>${money(caeOp)}/año</strong>)
     y los costos de operación anuales (<strong>${money(CAO)}/año</strong>).
     Para seleccionar entre alternativas, se debe elegir aquella con el
     <strong>menor CAE</strong>, ya que representa el menor costo económico anual para la organización.`;

  renderInterp('cae-interp', 'Interpretación del resultado', interpHtml);

  store.cae = {
    P, CAO, i: i * 100, n, VS, cae, crr, caeCap, caeOp, vaVS,
    interp: interpHtml.replace(/<[^>]+>/g, ''),
  };
}

function clearCAE() {
  ['cae-inv', 'cae-op', 'cae-tasa', 'cae-vida', 'cae-salvamento']
    .forEach(id => $(id).value = '');
  ['cae-steps', 'cae-final', 'cae-interp']
    .forEach(id => $(id).innerHTML = '');
  delete store.cae;
}

/* ================================================================
   TIR — bisección numérica (600 iteraciones)
   ================================================================ */
function calcTIR() {
  const I    = v('tir-inv');
  const FC   = v('tir-flujo');
  const n    = vi('tir-vida');
  const VR   = v('tir-rescate');
  const TMAR = v('tir-tmar') / 100;

  function vpnAt(r) {
    let s = -I;
    for (let t = 1; t <= n; t++) s += FC / Math.pow(1 + r, t);
    return s + VR / Math.pow(1 + r, n);
  }

  let lo = 0.0001, hi = 50, tir = 0;
  if (vpnAt(lo) * vpnAt(hi) > 0) hi = 500;
  for (let k = 0; k < 600; k++) {
    const mid = (lo + hi) / 2;
    if (Math.abs(vpnAt(mid)) < 0.0001) { tir = mid; break; }
    vpnAt(lo) * vpnAt(mid) < 0 ? (hi = mid) : (lo = mid);
    tir = mid;
  }

  const vpnTMAR = vpnAt(TMAR);
  const vpnTIR  = vpnAt(tir);
  const diff    = (tir - TMAR) * 100;
  const verdict = tir >= TMAR ? 'accept' : 'reject';

  renderSteps('tir-steps', [
    {
      desc:    'Datos del proyecto',
      formula: `I₀ = ${money(I)}   FC = ${money(FC)}   n = ${n} años   VR = ${money(VR)}   TMAR = ${dec(TMAR * 100)}%`,
    },
    {
      desc:    'Planteamiento: despejar TIR cuando VPN = 0',
      formula: `0 = −${money(I)} + Σ [ ${money(FC)} ÷ (1+TIR)ᵗ ]   t=1..${n}   + ${money(VR)} ÷ (1+TIR)${n}`,
    },
    {
      desc:    'Verificación: VPN evaluado a la TMAR',
      formula: `VPN(${dec(TMAR * 100)}%) = −${money(I)} + Σ[FC÷(1+TMAR)ᵗ] + VR÷(1+TMAR)${n}`,
      result:  money(vpnTMAR),
    },
    {
      desc:    'Método numérico de bisección (600 iteraciones)',
      formula: `Se acotó la raíz en el intervalo [lo, hi] reduciendo hasta |VPN(r)| < 0.0001`,
      result:  `TIR ≈ ${dec(tir * 100)}%`,
    },
    {
      desc:    'Verificación: VPN evaluado a la TIR (debe ser ≈ 0)',
      formula: `VPN(${dec(tir * 100)}%) = −${money(I)} + Σ[FC÷(1+TIR)ᵗ] + VR÷(1+TIR)${n}`,
      result:  money(vpnTIR) + '  ≈ $0.00 ✓',
    },
    {
      desc:    'Criterio de decisión',
      formula: tir >= TMAR
        ? `TIR (${dec(tir * 100)}%) > TMAR (${dec(TMAR * 100)}%)   Diferencia: +${dec(diff)}%   →   PROYECTO RENTABLE`
        : `TIR (${dec(tir * 100)}%) < TMAR (${dec(TMAR * 100)}%)   Diferencia: ${dec(diff)}%   →   PROYECTO NO RENTABLE`,
    },
  ]);

  renderFinal('tir-final', dec(tir * 100) + '%', 'Tasa Interna de Retorno', verdict);

  const interpHtml = tir >= TMAR
    ? `La TIR calculada es <strong>${dec(tir * 100, 2)}%</strong>, valor que supera la
       Tasa Mínima Atractiva de Retorno (TMAR) de ${dec(TMAR * 100, 2)}% en
       <strong>+${dec(diff, 2)} puntos porcentuales</strong>. Esto indica que el proyecto
       genera un rendimiento mayor al mínimo exigido por la organización, por lo que se
       <strong>recomienda aceptarlo</strong>. A mayor diferencia entre TIR y TMAR,
       más atractivo resulta el proyecto desde el punto de vista financiero.`
    : `La TIR calculada es <strong>${dec(tir * 100, 2)}%</strong>, valor que no alcanza
       la Tasa Mínima Atractiva de Retorno (TMAR) de ${dec(TMAR * 100, 2)}%.
       La diferencia negativa de <strong>${dec(Math.abs(diff), 2)} puntos porcentuales</strong>
       indica que el proyecto <strong>no genera el rendimiento mínimo requerido</strong>.
       Se <strong>recomienda rechazarlo</strong> o buscar alternativas que mejoren los flujos de efectivo.`;

  renderInterp('tir-interp', 'Interpretación del resultado', interpHtml);

  store.tir = {
    I, FC, n, VR, tmar: TMAR * 100, tir: tir * 100, diff, vpnTMAR, vpnTIR,
    interp: interpHtml.replace(/<[^>]+>/g, ''),
  };
}

function clearTIR() {
  ['tir-inv', 'tir-flujo', 'tir-vida', 'tir-rescate', 'tir-tmar']
    .forEach(id => $(id).value = '');
  ['tir-steps', 'tir-final', 'tir-interp']
    .forEach(id => $(id).innerHTML = '');
  delete store.tir;
}

/* ================================================================
   COMPARACIÓN
   ================================================================ */
function vpnSimple(I, FC, i, n, VR) {
  let s = -I;
  for (let t = 1; t <= n; t++) s += FC / Math.pow(1 + i, t);
  return s + VR / Math.pow(1 + i, n);
}

function compararAlt() {
  const nomA = str('comp-a-nom') || 'Alternativa A';
  const nomB = str('comp-b-nom') || 'Alternativa B';
  const vA = vpnSimple(v('comp-a-inv'), v('comp-a-flujo'), v('comp-a-tasa') / 100, vi('comp-a-vida'), v('comp-a-rescate'));
  const vB = vpnSimple(v('comp-b-inv'), v('comp-b-flujo'), v('comp-b-tasa') / 100, vi('comp-b-vida'), v('comp-b-rescate'));

  $('comp-res-a-nom').textContent = nomA;
  $('comp-res-b-nom').textContent = nomB;
  $('comp-vpn-a').textContent = money(vA);
  $('comp-vpn-b').textContent = money(vB);

  const win    = vA >= vB ? 'A' : 'B';
  const winNom = win === 'A' ? nomA : nomB;
  const losNom = win === 'A' ? nomB : nomA;
  const winVal = win === 'A' ? vA : vB;
  const losVal = win === 'A' ? vB : vA;

  $('comp-res-a').className = 'card' + (win === 'A' ? ' compare-winner' : '');
  $('comp-res-b').className = 'card' + (win === 'B' ? ' compare-winner' : '');

  const box = $('comp-conclusion');
  box.style.display = 'flex';
  box.innerHTML = `★ Se recomienda <strong style="color:var(--sky);margin:0 4px;">${winNom}</strong>
    <em>porque presenta el mayor VPN de</em>
    <strong style="color:var(--sky);margin:0 4px;">${money(winVal)}</strong>
    <em>frente a ${money(losVal)} de ${losNom}.</em>`;

  store.comp = {
    nomA, nomB, vA, vB, winner: winNom, loser: losNom, winVal, losVal,
    invA: v('comp-a-inv'), flujoA: v('comp-a-flujo'), tasaA: v('comp-a-tasa'), vidaA: vi('comp-a-vida'), rescateA: v('comp-a-rescate'),
    invB: v('comp-b-inv'), flujoB: v('comp-b-flujo'), tasaB: v('comp-b-tasa'), vidaB: vi('comp-b-vida'), rescateB: v('comp-b-rescate'),
  };
}


/* ================================================================
   COMPARACIÓN COMPLETA — VPN + CAE + TIR
   ================================================================ */
function comparar3Metodos() {

  const nomA = str('comp-a-nom') || 'Alternativa A';
  const nomB = str('comp-b-nom') || 'Alternativa B';

  /* =========================
     DATOS A
     ========================= */
  const invA      = v('comp-a-inv');
  const flujoA    = v('comp-a-flujo');
  const tasaA     = v('comp-a-tasa') / 100;
  const vidaA     = vi('comp-a-vida');
  const rescateA  = v('comp-a-rescate');

  /* =========================
     DATOS B
     ========================= */
  const invB      = v('comp-b-inv');
  const flujoB    = v('comp-b-flujo');
  const tasaB     = v('comp-b-tasa') / 100;
  const vidaB     = vi('comp-b-vida');
  const rescateB  = v('comp-b-rescate');

  /* =========================================================
     VPN
     ========================================================= */
  const vpnA = vpnSimple(invA, flujoA, tasaA, vidaA, rescateA);
  const vpnB = vpnSimple(invB, flujoB, tasaB, vidaB, rescateB);

  /* =========================================================
     CAE
     ========================================================= */
  function caeCalc(P, FC, i, n, VS) {
    const fn  = Math.pow(1 + i, n);
    const crr = i > 0 ? (i * fn) / (fn - 1) : 1 / n;

    const caeCap = (P - VS) * crr;
    const caeOp  = VS * i;

    return caeCap + caeOp + FC;
  }

  const caeA = caeCalc(invA, flujoA, tasaA, vidaA, rescateA);
  const caeB = caeCalc(invB, flujoB, tasaB, vidaB, rescateB);

  /* =========================================================
     TIR
     ========================================================= */
  function tirCalc(I, FC, n, VR) {

    function vpnAt(r) {
      let s = -I;

      for (let t = 1; t <= n; t++) {
        s += FC / Math.pow(1 + r, t);
      }

      return s + VR / Math.pow(1 + r, n);
    }

    let lo = 0.0001;
    let hi = 50;
    let tir = 0;

    if (vpnAt(lo) * vpnAt(hi) > 0) {
      hi = 500;
    }

    for (let k = 0; k < 600; k++) {

      const mid = (lo + hi) / 2;

      if (Math.abs(vpnAt(mid)) < 0.0001) {
        tir = mid;
        break;
      }

      vpnAt(lo) * vpnAt(mid) < 0
        ? (hi = mid)
        : (lo = mid);

      tir = mid;
    }

    return tir * 100;
  }

  const tirA = tirCalc(invA, flujoA, vidaA, rescateA);
  const tirB = tirCalc(invB, flujoB, vidaB, rescateB);

  /* =========================================================
     GANADORES
     ========================================================= */

  const ganadorVPN = vpnA >= vpnB ? nomA : nomB;
  const ganadorCAE = caeA <= caeB ? nomA : nomB;
  const ganadorTIR = tirA >= tirB ? nomA : nomB;

  let puntosA = 0;
  let puntosB = 0;

  if (ganadorVPN === nomA) puntosA++; else puntosB++;
  if (ganadorCAE === nomA) puntosA++; else puntosB++;
  if (ganadorTIR === nomA) puntosA++; else puntosB++;

  const ganadorFinal = puntosA >= puntosB ? nomA : nomB;

  /* =========================================================
     MOSTRAR RESULTADOS
     ========================================================= */

  $('comp-vpn-a').textContent = money(vpnA);
  $('comp-vpn-b').textContent = money(vpnB);

  $('comp-cae-a').textContent = money(caeA);
  $('comp-cae-b').textContent = money(caeB);

  $('comp-tir-a').textContent = dec(tirA) + '%';
  $('comp-tir-b').textContent = dec(tirB) + '%';

  $('comp-res-a-nom').textContent = nomA;
  $('comp-res-b-nom').textContent = nomB;

  $('comp-conclusion').style.display = 'flex';

  $('comp-conclusion').innerHTML = `

    <div style="width:100%;">

      <div style="font-size:18px;font-weight:800;margin-bottom:14px;color:var(--sky);">
        Resultado General
      </div>

      <div style="margin-bottom:10px;">
        ✔ Mejor VPN: <strong>${ganadorVPN}</strong>
      </div>

      <div style="margin-bottom:10px;">
        ✔ Mejor CAE: <strong>${ganadorCAE}</strong>
      </div>

      <div style="margin-bottom:10px;">
        ✔ Mejor TIR: <strong>${ganadorTIR}</strong>
      </div>

      <div style="margin-top:18px;padding:14px;border-radius:12px;background:#0B2D4E;">

        <div style="font-size:22px;font-weight:900;color:#56B9F2;">
          ★ Alternativa Recomendada: ${ganadorFinal}
        </div>

        <div style="margin-top:8px;color:#D6EAF8;font-size:14px;line-height:1.7;">
          La alternativa recomendada es <strong>${ganadorFinal}</strong>
          porque obtuvo mejores resultados en la mayor cantidad
          de métodos financieros evaluados (VPN, CAE y TIR).
        </div>

      </div>

    </div>
  `;

  /* =========================================================
     GUARDAR
     ========================================================= */

  store.comp = {

    nomA,
    nomB,

    vpnA,
    vpnB,

    caeA,
    caeB,

    tirA,
    tirB,

    ganadorVPN,
    ganadorCAE,
    ganadorTIR,
    ganadorFinal
  };
}




function clearComp() {

  $('comp-conclusion').style.display = 'none';

  $('comp-res-a').className = 'card';
  $('comp-res-b').className = 'card';

  [
    'comp-vpn-a',
    'comp-vpn-b',
    'comp-cae-a',
    'comp-cae-b',
    'comp-tir-a',
    'comp-tir-b'
  ].forEach(id => $(id).textContent = '—');

  delete store.comp;
}

/* ================================================================
   REPORTE — panel interno
   ================================================================ */
function renderReport() {
  const c = $('reporte-contenido');
  let html = '';

  if (store.vpn) {
    html += `<div class="section-divider">Valor Presente Neto (VPN)</div>`;
    html += row('Inversión inicial (I₀)',      money(store.vpn.I));
    html += row('Flujo de efectivo anual (FC)', money(store.vpn.FC));
    html += row('Tasa de descuento (i)',        dec(store.vpn.i) + '%');
    html += row('Vida útil (n)',                store.vpn.n + ' años');
    html += row('Valor de rescate (VR)',        money(store.vpn.VR));
    html += row('Factor VA (P/A, i, n)',        dec(store.vpn.factorVA));
    html += row('VA flujos de efectivo',        money(store.vpn.vaFlujos));
    html += row('VA valor de rescate',          money(store.vpn.vaRescate));
    html += row('VPN calculado',                money(store.vpn.vpn));
    html += row('Decisión',                     store.vpn.vpn >= 0 ? '✔ ACEPTAR' : '✘ RECHAZAR');
  }
  if (store.cae) {
    html += `<div class="section-divider">Costo Anual Equivalente (CAE)</div>`;
    html += row('Costo inicial (P)',             money(store.cae.P));
    html += row('Costo anual operación (CAO)',   money(store.cae.CAO));
    html += row('Tasa de descuento (i)',         dec(store.cae.i) + '%');
    html += row('Vida útil (n)',                 store.cae.n + ' años');
    html += row('Valor de salvamento (VS)',      money(store.cae.VS));
    html += row('Factor CRR (A/P, i, n)',        dec(store.cae.crr));
    html += row('Costo de capital anual',        money(store.cae.caeCap));
    html += row('Costo oportunidad del VS',      money(store.cae.caeOp));
    html += row('CAE calculado',                 money(store.cae.cae));
  }
  if (store.tir) {
    html += `<div class="section-divider">Tasa Interna de Retorno (TIR)</div>`;
    html += row('Inversión inicial (I₀)',        money(store.tir.I));
    html += row('Flujo de efectivo anual (FC)',  money(store.tir.FC));
    html += row('Vida útil (n)',                 store.tir.n + ' años');
    html += row('Valor de rescate (VR)',         money(store.tir.VR));
    html += row('TMAR ingresada',               dec(store.tir.tmar) + '%');
    html += row('VPN @ TMAR',                   money(store.tir.vpnTMAR));
    html += row('TIR calculada',                dec(store.tir.tir) + '%');
    html += row('Diferencia TIR − TMAR',        (store.tir.diff >= 0 ? '+' : '') + dec(store.tir.diff) + '%');
    html += row('Decisión',                     store.tir.tir >= store.tir.tmar ? '✔ RENTABLE' : '✘ NO RENTABLE');
  }
  if (store.comp) {

  html += `<div class="section-divider">Comparación de Alternativas</div>`;

  html += row(store.comp.nomA + ' — VPN', money(store.comp.vpnA));
  html += row(store.comp.nomB + ' — VPN', money(store.comp.vpnB));

  html += row(store.comp.nomA + ' — CAE', money(store.comp.caeA));
  html += row(store.comp.nomB + ' — CAE', money(store.comp.caeB));

  html += row(store.comp.nomA + ' — TIR', dec(store.comp.tirA) + '%');
  html += row(store.comp.nomB + ' — TIR', dec(store.comp.tirB) + '%');

  html += row('Mejor VPN', store.comp.ganadorVPN);
  html += row('Mejor CAE', store.comp.ganadorCAE);
  html += row('Mejor TIR', store.comp.ganadorTIR);

  html += row(
    'Alternativa recomendada',
    '★ ' + store.comp.ganadorFinal
  );
}
  c.innerHTML = html ||
    '<p style="color:var(--ink-soft);font-size:13px;">Realiza cálculos en VPN, CAE o TIR para ver el reporte.</p>';
}

function row(k, vl) {
  return `<div class="report-row">
    <span class="report-key">${k}</span>
    <span class="report-val">${vl}</span>
  </div>`;
}

/* ================================================================
   PDF FORMAL COMPLETO
   Incluye por cada método:
     A. Datos del proyecto
     B. Fórmula aplicada
     C. Desarrollo del procedimiento paso a paso
     D. Resultado y criterio de decisión
     E. Interpretación financiera
   ================================================================ */
function exportarPDF() {
  const now   = new Date();
  const fecha = now.toLocaleDateString('es-SV', { year: 'numeric', month: 'long', day: 'numeric' });
  const hora  = now.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' });

  if (!store.vpn && !store.cae && !store.comp) {
    showToast('No hay cálculos para exportar'); return;
  }

  let body = '';

  /* ── VPN ── */
  if (store.vpn) {
    const s = store.vpn;

    /* Tabla de flujos por año */
    let filasFlujos = '';
    for (let t = 1; t <= s.n; t++) {
      const pv = s.FC / Math.pow(1 + s.i / 100, t);
      filasFlujos += `<tr>
        <td>${t}</td>
        <td>${money(s.FC)}</td>
        <td>${dec(Math.pow(1 + s.i / 100, t))}</td>
        <td>${money(pv)}</td>
      </tr>`;
    }

    body += `
    <div class="sec">
      <div class="sec-hdr">
        <div class="sec-num">01</div>
        <div>
          <div class="sec-name">Valor Presente Neto</div>
          <div class="sec-abv">Método VPN — Evaluación de rentabilidad por flujos descontados</div>
        </div>
      </div>
      <div class="sec-body">

        <div class="blk-title">A. Datos del proyecto</div>
        <table class="tbl">
          <tr><td>Inversión inicial (I₀)</td><td>${money(s.I)}</td></tr>
          <tr><td>Flujo de efectivo anual (FC)</td><td>${money(s.FC)}</td></tr>
          <tr><td>Tasa de descuento (i)</td><td>${dec(s.i)}%</td></tr>
          <tr><td>Vida útil del proyecto (n)</td><td>${s.n} años</td></tr>
          <tr><td>Valor de rescate (VR)</td><td>${money(s.VR)}</td></tr>
        </table>

        <div class="blk-title">B. Fórmula aplicada</div>
        <div class="formula-blk">
          VPN = −I₀ + Σ [ FC ÷ (1 + i)ᵗ ]  +  VR ÷ (1 + i)ⁿ<br>
          donde el Factor de Valor Actual (P/A, i, n) = [ 1 − (1 + i)⁻ⁿ ] ÷ i
        </div>

        <div class="blk-title">C. Desarrollo del procedimiento</div>
        <p class="proc-intro">Cálculo del Factor de Valor Actual:</p>
        <table class="tbl">
          <tr>
            <td>(P/A, ${dec(s.i)}%, ${s.n})</td>
            <td>[ 1 − (1 + ${dec(s.i)}%)⁻${s.n} ] ÷ ${dec(s.i)}% = <strong>${dec(s.factorVA)}</strong></td>
          </tr>
        </table>
        <p class="proc-intro" style="margin-top:10px;">Valor presente de cada flujo anual:</p>
        <table class="tbl">
          <thead>
            <tr>
              <th>Año (t)</th>
              <th>Flujo FC</th>
              <th>Factor (1+i)ᵗ</th>
              <th>Valor Presente</th>
            </tr>
          </thead>
          <tbody>${filasFlujos}</tbody>
        </table>
        <table class="tbl" style="margin-top:8px;">
          <tr><td>Suma VA flujos (VA_FC)</td><td>${money(s.vaFlujos)}</td></tr>
          <tr><td>VA del rescate = ${money(s.VR)} ÷ (1+${dec(s.i)}%)${s.n}</td><td>${money(s.vaRescate)}</td></tr>
          <tr><td>VPN = −${money(s.I)} + ${money(s.vaFlujos)} + ${money(s.vaRescate)}</td>
              <td class="${s.vpn >= 0 ? 'td-accept' : 'td-reject'}">${money(s.vpn)}</td></tr>
        </table>

        <div class="blk-title">D. Resultado y criterio de decisión</div>
        <div class="result-blk ${s.vpn >= 0 ? 'rb-accept' : 'rb-reject'}">
          <div class="rb-value">${money(s.vpn)}</div>
          <div class="rb-label">
            ${s.vpn >= 0
              ? 'VPN > $0.00  →  Proyecto ACEPTABLE: genera valor económico'
              : 'VPN < $0.00  →  Proyecto RECHAZADO: destruye valor económico'}
          </div>
        </div>

        <div class="blk-title">E. Interpretación financiera</div>
        <div class="interp-blk">${s.interp}</div>
      </div>
    </div>`;
  }

  /* ── CAE ── */
  if (store.cae) {
    const s = store.cae;
    body += `
    <div class="sec">
      <div class="sec-hdr">
        <div class="sec-num">02</div>
        <div>
          <div class="sec-name">Costo Anual Equivalente</div>
          <div class="sec-abv">Método CAE — Comparación anualizada de alternativas con distinta vida útil</div>
        </div>
      </div>
      <div class="sec-body">

        <div class="blk-title">A. Datos del proyecto</div>
        <table class="tbl">
          <tr><td>Costo inicial (P)</td><td>${money(s.P)}</td></tr>
          <tr><td>Costo anual de operación (CAO)</td><td>${money(s.CAO)}</td></tr>
          <tr><td>Tasa de descuento (i)</td><td>${dec(s.i)}%</td></tr>
          <tr><td>Vida útil (n)</td><td>${s.n} años</td></tr>
          <tr><td>Valor de salvamento (VS)</td><td>${money(s.VS)}</td></tr>
        </table>

        <div class="blk-title">B. Fórmula aplicada</div>
        <div class="formula-blk">
          CAE = (P − VS) · CRR  +  VS · i  +  CAO<br>
          donde CRR (A/P, i, n) = i · (1 + i)ⁿ ÷ [ (1 + i)ⁿ − 1 ]
        </div>

        <div class="blk-title">C. Desarrollo del procedimiento</div>
        <table class="tbl">
          <tr>
            <td>Cálculo de (1 + i)ⁿ</td>
            <td>(1 + ${dec(s.i)}%)${s.n} = ${dec(Math.pow(1 + s.i / 100, s.n))}</td>
          </tr>
          <tr>
            <td>Factor CRR (A/P, ${dec(s.i)}%, ${s.n})</td>
            <td>${dec(s.i)}% × ${dec(Math.pow(1 + s.i / 100, s.n))} ÷ (${dec(Math.pow(1 + s.i / 100, s.n))} − 1) = <strong>${dec(s.crr)}</strong></td>
          </tr>
          <tr>
            <td>Costo de capital anual = (P − VS) × CRR</td>
            <td>(${money(s.P)} − ${money(s.VS)}) × ${dec(s.crr)} = ${money(s.caeCap)}</td>
          </tr>
          <tr>
            <td>Costo de oportunidad del VS = VS × i</td>
            <td>${money(s.VS)} × ${dec(s.i)}% = ${money(s.caeOp)}</td>
          </tr>
          <tr>
            <td>CAE = ${money(s.caeCap)} + ${money(s.caeOp)} + ${money(s.CAO)}</td>
            <td class="td-neutral"><strong>${money(s.cae)}/año</strong></td>
          </tr>
        </table>

        <div class="blk-title">D. Resultado y criterio de decisión</div>
        <div class="result-blk rb-neutral">
          <div class="rb-value">${money(s.cae)}/año</div>
          <div class="rb-label">Alternativa con MENOR CAE es la económicamente preferible en la comparación</div>
        </div>

        <div class="blk-title">E. Interpretación financiera</div>
        <div class="interp-blk">${s.interp}</div>
      </div>
    </div>`;
  }

  /* ── TIR ── */
  if (store.tir) {
    const s = store.tir;
    body += `
    <div class="sec">
      <div class="sec-hdr">
        <div class="sec-num">03</div>
        <div>
          <div class="sec-name">Tasa Interna de Retorno</div>
          <div class="sec-abv">Método TIR — Evaluación de rentabilidad por tasa de rendimiento</div>
        </div>
      </div>
      <div class="sec-body">

        <div class="blk-title">A. Datos del proyecto</div>
        <table class="tbl">
          <tr><td>Inversión inicial (I₀)</td><td>${money(s.I)}</td></tr>
          <tr><td>Flujo de efectivo anual (FC)</td><td>${money(s.FC)}</td></tr>
          <tr><td>Vida útil (n)</td><td>${s.n} años</td></tr>
          <tr><td>Valor de rescate (VR)</td><td>${money(s.VR)}</td></tr>
          <tr><td>TMAR — Tasa Mínima Atractiva de Retorno</td><td>${dec(s.tmar)}%</td></tr>
        </table>

        <div class="blk-title">B. Fórmula aplicada</div>
        <div class="formula-blk">
          0 = −I₀ + Σ [ FC ÷ (1 + TIR)ᵗ ]  +  VR ÷ (1 + TIR)ⁿ<br>
          Se despeja TIR mediante método numérico de bisección (600 iteraciones)
        </div>

        <div class="blk-title">C. Desarrollo del procedimiento</div>
        <table class="tbl">
          <tr>
            <td>Planteamiento de la ecuación</td>
            <td>0 = −${money(s.I)} + Σ [${money(s.FC)} ÷ (1+TIR)ᵗ] + ${money(s.VR)} ÷ (1+TIR)${s.n}</td>
          </tr>
          <tr>
            <td>VPN evaluado a la TMAR (${dec(s.tmar)}%)</td>
            <td>${money(s.vpnTMAR)}</td>
          </tr>
          <tr>
            <td>Método de bisección numérica (600 iter.)</td>
            <td>Se acotó la raíz hasta |VPN(r)| &lt; 0.0001</td>
          </tr>
          <tr>
            <td>TIR obtenida</td>
            <td class="${s.tir >= s.tmar ? 'td-accept' : 'td-reject'}"><strong>${dec(s.tir)}%</strong></td>
          </tr>
          <tr>
            <td>Verificación: VPN @ TIR (debe ≈ $0.00)</td>
            <td>${money(s.vpnTIR)} ✓</td>
          </tr>
          <tr>
            <td>Diferencia TIR − TMAR</td>
            <td class="${s.tir >= s.tmar ? 'td-accept' : 'td-reject'}">${(s.diff >= 0 ? '+' : '') + dec(s.diff)}%</td>
          </tr>
        </table>

        <div class="blk-title">D. Resultado y criterio de decisión</div>
        <div class="result-blk ${s.tir >= s.tmar ? 'rb-accept' : 'rb-reject'}">
          <div class="rb-value">TIR = ${dec(s.tir)}%</div>
          <div class="rb-label">
            ${s.tir >= s.tmar
              ? `TIR (${dec(s.tir)}%) > TMAR (${dec(s.tmar)}%)  →  Proyecto RENTABLE — ACEPTAR`
              : `TIR (${dec(s.tir)}%) < TMAR (${dec(s.tmar)}%)  →  Proyecto NO RENTABLE — RECHAZAR`}
          </div>
        </div>

        <div class="blk-title">E. Interpretación financiera</div>
        <div class="interp-blk">${s.interp}</div>
      </div>
    </div>`;
  }

  /* =========================================================
   COMPARACIÓN DE ALTERNATIVAS
   ========================================================= */

const nombreA = document.getElementById("comp-a-nom").value || "Alternativa A";
const nombreB = document.getElementById("comp-b-nom").value || "Alternativa B";

const invA = parseFloat(document.getElementById("comp-a-inv").value) || 0;
const flujoA = parseFloat(document.getElementById("comp-a-flujo").value) || 0;
const tasaA = parseFloat(document.getElementById("comp-a-tasa").value) || 0;
const vidaA = parseFloat(document.getElementById("comp-a-vida").value) || 0;
const rescateA = parseFloat(document.getElementById("comp-a-rescate").value) || 0;

const invB = parseFloat(document.getElementById("comp-b-inv").value) || 0;
const flujoB = parseFloat(document.getElementById("comp-b-flujo").value) || 0;
const tasaB = parseFloat(document.getElementById("comp-b-tasa").value) || 0;
const vidaB = parseFloat(document.getElementById("comp-b-vida").value) || 0;
const rescateB = parseFloat(document.getElementById("comp-b-rescate").value) || 0;

/* VPN ALTERNATIVA A */
let vpnA = -invA;

for(let t=1; t<=vidaA; t++){
  vpnA += flujoA / Math.pow(1 + tasaA/100, t);
}

vpnA += rescateA / Math.pow(1 + tasaA/100, vidaA);

/* VPN ALTERNATIVA B */
let vpnB = -invB;

for(let t=1; t<=vidaB; t++){
  vpnB += flujoB / Math.pow(1 + tasaB/100, t);
}

vpnB += rescateB / Math.pow(1 + tasaB/100, vidaB);

const mejor =
  vpnA > vpnB
    ? nombreA
    : nombreB;

const mejorVPN =
  vpnA > vpnB
    ? vpnA
    : vpnB;

/* =========================================================
   COMPARACIÓN DE ALTERNATIVAS
   VPN + CAE + TIR
   ========================================================= */

if (store.comp) {

const s = store.comp;

body += `

<div class="sec">

  <div class="sec-hdr">
    <div class="sec-num">04</div>

    <div>
      <div class="sec-name">
        Comparación de Alternativas
      </div>

      <div class="sec-abv">
        Evaluación financiera integral mediante VPN, CAE y TIR
      </div>
    </div>
  </div>

  <div class="sec-body">

    <div class="blk-title">
      A. Datos generales de las alternativas
    </div>

    <table class="tbl">

      <thead>
        <tr>
          <th>Parámetro</th>
          <th>${s.nomA}</th>
          <th>${s.nomB}</th>
        </tr>
      </thead>

      <tbody>

        <tr>
          <td>VPN</td>
          <td>${money(s.vpnA)}</td>
          <td>${money(s.vpnB)}</td>
        </tr>

        <tr>
          <td>CAE</td>
          <td>${money(s.caeA)}</td>
          <td>${money(s.caeB)}</td>
        </tr>

        <tr>
          <td>TIR</td>
          <td>${dec(s.tirA)}%</td>
          <td>${dec(s.tirB)}%</td>
        </tr>

      </tbody>

    </table>

    <div class="blk-title">
      B. Evaluación por método financiero
    </div>

    <table class="tbl">

      <thead>
        <tr>
          <th>Método</th>
          <th>Mejor alternativa</th>
          <th>Criterio aplicado</th>
        </tr>
      </thead>

      <tbody>

        <tr>
          <td>VPN</td>
          <td>${s.ganadorVPN}</td>
          <td>Mayor VPN</td>
        </tr>

        <tr>
          <td>CAE</td>
          <td>${s.ganadorCAE}</td>
          <td>Menor CAE</td>
        </tr>

        <tr>
          <td>TIR</td>
          <td>${s.ganadorTIR}</td>
          <td>Mayor TIR</td>
        </tr>

      </tbody>

    </table>

    <div class="blk-title">
      C. Resultado final
    </div>

    <div class="result-blk rb-neutral">

      <div class="rb-value">
        ${s.ganadorFinal}
      </div>

      <div class="rb-label">
        Alternativa recomendada por obtener mejores resultados
        en la mayoría de métodos financieros evaluados.
      </div>

    </div>

    <div class="blk-title">
      D. Interpretación financiera
    </div>

    <div class="interp-blk">

      La comparación integral entre
      <strong>${s.nomA}</strong> y
      <strong>${s.nomB}</strong>
      se realizó utilizando los métodos:

      VPN, CAE y TIR.

      La alternativa recomendada es
      <strong>${s.ganadorFinal}</strong>
      debido a que presentó ventajas financieras
      en la mayoría de criterios analizados.

      El análisis conjunto permite tomar una decisión
      más confiable considerando:
      rentabilidad, recuperación económica
      y costo anual equivalente.

    </div>

  </div>

</div>

`;
}
  /* ── Plantilla PDF completa ── */
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Reporte SEAE — ${fecha}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Nunito', sans-serif;
    font-size: 12px;
    background: #EBF4FB;
    color: #0A1E30;
    padding: 16px 20px;
  }

  /* ── Portada ── */
  .cover {
    background: #0B2D4E;
    border-radius: 10px;
    padding: 18px 24px;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .cover-logo { font-size: 42px; font-weight: 800; color: #FFFFFF; letter-spacing: -2px; line-height: 1; }
  .cover-fullname {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px; letter-spacing: .14em; text-transform: uppercase;
    color: rgba(200,225,245,0.50); margin-top: 5px;
  }
  .cover-desc {
    font-size: 11.5px; color: rgba(200,225,245,0.60); margin-top: 4px; max-width: 380px;
  }
  .cover-right { text-align: right; }
  .cover-tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8px; letter-spacing: .12em; text-transform: uppercase;
    color: rgba(200,225,245,0.35); margin-bottom: 4px;
  }
  .cover-date { font-size: 15px; font-weight: 800; color: #56B9F2; }
  .cover-time { font-size: 11px; color: rgba(200,225,245,0.4); margin-top: 2px; }
  .cover-line {
    margin-top: 10px; padding-top: 10px;
    border-top: 1px solid rgba(86,185,242,0.2);
    display: flex; gap: 8px;
  }
  .cover-badge {
    background: rgba(45,156,219,0.15);
    border: 1px solid rgba(45,156,219,0.3);
    border-radius: 4px; padding: 3px 10px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; font-weight: 500; color: #56B9F2;
  }

  /* ── Secciones ── */
  .sec {
    background: #D6EAF8;
    border: 1px solid #A8CCEB;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 10px;
  }
  .sec-hdr {
    background: #1460A8;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .sec-num {
    font-size: 22px; font-weight: 800;
    color: rgba(200,225,245,0.15);
    font-family: 'JetBrains Mono', monospace;
    line-height: 1;
  }
  .sec-name { font-size: 14px; font-weight: 800; color: #EBF4FB; }
  .sec-abv {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8px; letter-spacing: .11em; text-transform: uppercase;
    color: rgba(200,225,245,0.4); margin-top: 2px;
  }
  .sec-body { padding: 10px 14px; }

  /* ── Bloques ── */
  .blk-title {
    font-size: 10px; font-weight: 800; text-transform: uppercase;
    letter-spacing: .08em; color: #1460A8;
    margin: 8px 0 5px;
    padding-bottom: 3px;
    border-bottom: 1.5px solid #2D9CDB;
  }
  .blk-title:first-child { margin-top: 0; }

  .proc-intro {
    font-size: 11px; color: #2C4A62; font-weight: 600; margin-bottom: 4px;
  }

  /* ── Tablas ── */
  .tbl {
    width: 100%; border-collapse: collapse;
    background: #C5DEF5; border-radius: 6px; overflow: hidden;
  }
  .tbl thead tr { background: #0B2D4E; }
  .tbl thead th {
    padding: 5px 10px; font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .06em;
    color: #56B9F2; text-align: left;
  }
  .tbl td {
    padding: 5px 10px;
    border-bottom: 1px solid #A8CCEB;
    font-size: 11.5px;
  }
  .tbl tr:last-child td { border-bottom: none; }
  .tbl td:first-child { color: #2C4A62; font-weight: 600; }
  .tbl td:last-child { font-weight: 700; text-align: right; color: #0A1E30; }
  .tbl td:nth-child(2):not(:last-child) { font-weight: 700; color: #0A1E30; }
  .tbl tr:nth-child(even) td { background: #B0CEEA; }

  .td-accept { color: #0F7B55 !important; background: rgba(15,123,85,0.12) !important; }
  .td-reject { color: #C0392B !important; background: rgba(192,57,43,0.10) !important; }
  .td-neutral { color: #1460A8 !important; }

  /* ── Fórmula ── */
  .formula-blk {
    background: #0B2D4E;
    border-radius: 6px;
    padding: 8px 14px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11.5px;
    color: #56B9F2;
    line-height: 1.65;
  }

  /* ── Resultado ── */
  .result-blk {
    border-radius: 6px;
    padding: 9px 14px;
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .rb-accept { background: #0F7B55; }
  .rb-reject { background: #8B1A1A; }
  .rb-neutral { background: #1460A8; }
  .rb-value {
    font-size: 22px; font-weight: 800;
    color: #EBF4FB; white-space: nowrap;
  }
  .rb-label {
    font-size: 12px; font-weight: 700;
    color: rgba(235,244,251,0.88);
    line-height: 1.4;
  }

  /* ── Interpretación ── */
  .interp-blk {
    background: #B0CEEA;
    border-left: 3px solid #2D9CDB;
    border-radius: 0 6px 6px 0;
    padding: 8px 12px;
    font-size: 11.5px; font-weight: 500;
    color: #0A1E30; line-height: 1.65;
  }

  /* ── Footer ── */
  .ftr {
    margin-top: 12px; text-align: center;
    font-size: 10px; font-weight: 600;
    color: #5A7A92;
    border-top: 1px solid #A8CCEB;
    padding-top: 8px; letter-spacing: .04em;
  }

  @media print {
    body { padding: 8px 12px; background: #fff; }
    .sec { page-break-inside: avoid; }
    .cover, .sec-hdr, .rb-accept, .rb-reject, .rb-neutral, .formula-blk {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
</style>
</head>
<body>

<!-- PORTADA -->
<div class="cover">
  <div>
    <div class="cover-logo">SEAE</div>
    <div class="cover-fullname">Sistema de Evaluación de Alternativas Económicas</div>
    <div class="cover-desc">
      Evaluación financiera de proyectos mediante métodos de Ingeniería Económica:
      Valor Presente Neto (VPN), Costo Anual Equivalente (CAE) y Tasa Interna de Retorno (TIR).
    </div>
    <div class="cover-line">
      ${store.vpn ? '<div class="cover-badge">VPN</div>' : ''}
      ${store.cae ? '<div class="cover-badge">CAE</div>' : ''}
      ${store.tir ? '<div class="cover-badge">TIR</div>' : ''}
      ${store.comp ? '<div class="cover-badge">Comparación</div>' : ''}
    </div>
  </div>
  <div class="cover-right">
    <div class="cover-tag">Reporte generado</div>
    <div class="cover-date">${fecha}</div>
    <div class="cover-time">${hora} hrs</div>
  </div>
</div>

${body}

<div class="ftr">
  SEAE — Sistema de Evaluación de Alternativas Económicas &nbsp;·&nbsp; ${fecha} &nbsp;·&nbsp; ${hora} hrs
</div>

<script>window.onload = () => window.print();<\/script>
</body>
</html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  showToast('Reporte PDF generado');
}

/* ── Toast ─────────────────────────────────────────────────── */
function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}