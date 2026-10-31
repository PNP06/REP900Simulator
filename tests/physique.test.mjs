// Tests de non-régression du modèle physique. Usage : node tests/physique.test.mjs
// Le modèle physique (js/physique.js) est exécuté seul, sans navigateur.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const src = f => readFileSync(fileURLToPath(new URL('../js/' + f, import.meta.url)), 'utf8');
const js = src('electrique.js') + '\n' + src('physique.js');
const ctx = { console, Math, Infinity, NaN, Number, Set, Object, Array };
vm.createContext(ctx);
vm.runInContext("const clamp=(x,a,b)=>x<a?a:x>b?b:x;const fmt=(x,d=1)=>x.toFixed(d);const A={ctx:null};\n" + js +
  "\nthis.M={makeState,step,trip,rhoParts,psat,tsat,DT,BETA};", ctx);
const { makeState, step, trip, psat, tsat, DT, BETA } = ctx.M;

let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'ÉCHEC') + ' ' + name + (info ? ' — ' + info : '')); if (!ok) fails++; };
const run = (s, sec) => { for (let i = 0; i < sec / DT; i++) step(s); };
const near = (x, y, tol) => Math.abs(x - y) <= tol;
const P100 = { P: 1, xe: 1, R: 180, G: 225, coupled: true, modeR: 'auto', modeG: 'auto' };

check('β = 600 pcm', near(BETA * 1e5, 600, 1), (BETA * 1e5).toFixed(1));
check('Tsat(155 bar) ≈ 345 °C', near(tsat(155), 345, 1.5), tsat(155).toFixed(1));
check('Psat(273 °C) ≈ 57,5 bar', near(psat(273), 57.5, 1.5), psat(273).toFixed(1));

{ const s = makeState(P100); run(s, 600);
  check('100 % stable 10 min', near(s.n, 1, 0.005) && near(s.Tavg, 304.5, 0.3) && near(s.Ppzr, 155, 0.5) && near(s.Lsg, 50, 1), `n=${(s.n*100).toFixed(2)} Tmoy=${s.Tavg.toFixed(2)} P=${s.Ppzr.toFixed(2)}`);
  check('Tch ≈ 323 °C, Tfr ≈ 286 °C', near(s.Thot, 323, 1) && near(s.Tcold, 286, 1), `${s.Thot.toFixed(1)} / ${s.Tcold.toFixed(1)}`);
  check('Pression GV ≈ 57,5 bar', near(s.Psg, 57.5, 1.5), s.Psg.toFixed(1));
  check('Xénon d\'équilibre ≈ −2 700 pcm', near(s.rho.xe, -2700, 60), s.rho.xe.toFixed(0));
  check('Marge à la saturation 15–30 °C', s.satMargin > 15 && s.satMargin < 30, s.satMargin.toFixed(1)); }

{ const s = makeState(P100); run(s, 5); trip(s, 'test', 'op'); const t0 = s.t; let pmin = 999;
  const at = {}; for (const T of [3, 3600, 86400]) { while (s.t - t0 < T) { step(s); pmin = Math.min(pmin, s.Ppzr); } at[T] = s.Qcore * 100; }
  check('AAR : marge d\'arrêt > 5 000 pcm', -s.rho.tot > 5000, (-s.rho.tot).toFixed(0));
  check('AAR : Tmoy → 286 °C', near(s.Tavg, 286, 1.5), s.Tavg.toFixed(1));
  check('AAR : pas d\'IS (P mini > 119 bar)', pmin > 119 && !s.is, pmin.toFixed(1));
  check('Puissance résiduelle ≈ 1 % à 1 h', near(at[3600], 1.0, 0.25), at[3600].toFixed(2) + ' %');
  check('Puissance résiduelle ≈ 0,4 % à 1 jour', near(at[86400], 0.44, 0.12), at[86400].toFixed(2) + ' %'); }

{ const s = makeState(P100); s.ramp = 5; s.LtSet = 0.5; run(s, 660);
  check('Baisse 100 → 50 % sans AAR, Tmoy suit Tref', !s.tripped && near(s.Tavg, s.Tref, 1.0) && near(s.n, 0.5, 0.03), `Tmoy−Tref=${(s.Tavg-s.Tref).toFixed(2)}`); }

{ const s = makeState(P100); s.pumps[1] = false; run(s, 5);
  check('Perte d\'une pompe primaire > P7 → AAR', s.tripped, s.tripCause); }

{ const s = makeState({ P: 0, critR: 170, R: 170, G: 'cal', SD: 225, coupled: false, xe: 0 }); run(s, 30); s.srInhib = true;
  check('Arrêt à chaud critique à R = 170', Math.abs(s.rho.tot) < 5, s.rho.tot.toFixed(1) + ' pcm'); }

{ const s = makeState({ P: 1e-5, critR: 110, R: 110, G: 'cal', coupled: false, xe: 0, modeR: 'man', modeG: 'man' }); s.rodWd = true; let pmax = 0;
  for (let i = 0; i < 300 / DT && !s.tripped; i++) { step(s); pmax = Math.max(pmax, s.n); }
  check('Retrait incontrôlé à puissance nulle : AAR par le seuil bas (25 %) non bloqué', s.tripped && /seuil bas/.test(s.tripCause) && pmax < 0.6, s.tripCause + ', max ' + (pmax * 100).toFixed(0) + ' %'); }

{ // Scénario TMI transposé : soupape de tête du pressuriseur bloquée ouverte après une perte totale d'eau alimentaire
  const tmi = (acts, sec = 4 * 3600) => {
    const s = makeState(P100); run(s, 20); s.tpa = [false, false]; s.asgV = false;
    const t0 = s.t, o = { satT: null, burstT: null, minH: 9, maxUncPompes: 0 }; let i = 0;
    acts = [[30, s => { s.porvOpen = true; }], ...acts];
    while (s.t - t0 < sec) { const t = s.t - t0; while (i < acts.length && t >= acts[i][0]) acts[i++][1](s);
      step(s); if (o.satT == null && s.sat) o.satT = t; if (o.burstT == null && s.rdpBurst) o.burstT = t;
      if (s.pumps.some(Boolean)) o.maxUncPompes = Math.max(o.maxUncPompes, s.unc);
      if (Math.abs(t - 300) < DT / 2) o.W5 = s.Wasg;
      if (Math.abs(t - 900) < DT / 2) { o.L15 = s.Lpzr; o.V15 = s.Vv; o.W15 = s.Wasg; o.T15 = s.Tdech; }
      o.minH = Math.min(o.minH, s.hCuve); }
    o.s = s; return o; };
  const histo = [[270, s => { s.isThr = 0.1; }], [480, s => { s.asgV = true; }], [4440, s => { s.pumps[0] = s.pumps[1] = false; }],
    [6060, s => { s.pumps[2] = false; }], [8520, s => { s.porvIsol = true; }], [12000, s => { s.isThr = 1; }]];
  const h = tmi(histo);
  check('TMI : le primaire atteint la saturation entre 3 et 10 min', h.satT > 180 && h.satT < 600, (h.satT / 60).toFixed(1) + ' min');
  check('TMI : à 15 min, pressuriseur presque plein alors que le circuit a perdu de l\'eau', h.L15 > 95 && h.V15 > 20, `Lpzr=${h.L15.toFixed(0)} % vide=${h.V15.toFixed(0)} m³`);
  check('TMI : ligne de décharge chaude (> 120 °C) avec voyant de commande fermé', h.T15 > 120, h.T15.toFixed(0) + ' °C');
  check('TMI : disque du réservoir de décharge rompu entre 10 et 45 min', h.burstT > 600 && h.burstT < 2700, (h.burstT / 60).toFixed(0) + ' min');
  check('TMI : cœur refroidi tant que les GMPP tournent', h.maxUncPompes === 0);
  check('TMI : cœur découvert après l\'arrêt des GMPP, fusion partielle', h.minH < -1 && h.s.coreDmg === 3 && h.s.fondu > 0.15 && h.s.fondu < 0.7, `niveau mini ${h.minH.toFixed(1)} m, fondu ${(h.s.fondu * 100).toFixed(0)} %, H2 ${h.s.H2.toFixed(0)} kg`);
  const iso = tmi([[60, s => { s.porvIsol = true; }], [480, s => { s.asgV = true; }]], 3600);
  check('TMI : soupape isolée à 1 min → ni saturation ni dégât', iso.satT == null && iso.s.Vv === 0 && iso.s.coreDmg === 0, `P=${iso.s.Ppzr.toFixed(0)} bar`);
  const is = tmi([[480, s => { s.asgV = true; }], [4440, s => { s.pumps[0] = s.pumps[1] = false; }], [6060, s => { s.pumps[2] = false; }]]);
  check('TMI : IS laissée en service → cœur jamais découvert, même GMPP arrêtées', is.minH > 0 && is.s.coreDmg === 0, `niveau mini ${is.minH.toFixed(1)} m`);
  const tot = tmi([[420, s => { s.pumps = [false, false, false]; }], [480, s => { s.asgV = true; }]]);
  check('TMI : GMPP arrêtées tôt (7 min, circuit encore plein d\'eau), IS en service → cœur jamais découvert', tot.satT < 420 && tot.minH > 0 && tot.s.coreDmg === 0, `niveau mini ${tot.minH.toFixed(1)} m`);
  const pp = tmi([[270, s => { s.isThr = 0.1; }], [480, s => { s.asgV = true; }]]);
  check('TMI : GMPP maintenues → cœur refroidi 4 h malgré l\'IS réduite', pp.maxUncPompes === 0 && pp.s.coreDmg === 0, `taux de vide ${(pp.s.alpha * 100).toFixed(0)} %`);
  check('TMI : vannes ASG consignées → pas de débit ASG, puis débit à leur ouverture', h.W5 < 1e-3 && h.W15 > 0.02, `${h.W5.toFixed(3)} puis ${h.W15.toFixed(3)}`);
}

{ // pic xénon après arrêt
  const lI=2.87e-5,lX=2.09e-5,sg=7.5e-5,gI=0.0639,gX=0.00237; let I=1,X=1,mx=1,tm=0;
  for (let t=0;t<=48*3600;t+=60){ I+=lI*(0-I)*60; X+=((lX+sg)*(gI*I)/(gI+gX)-lX*X)*60; if(X>mx){mx=X;tm=t/3600;} }
  check('Pic xénon après arrêt entre 7 et 11 h', tm > 7 && tm < 11, tm.toFixed(1) + ' h, ' + (-2700*mx).toFixed(0) + ' pcm'); }

/* ---- Alimentations électriques (js/electrique.js) ---- */
{ const s = makeState(P100); run(s, 5);
  check('Élec : à 100 %, tableaux normaux et secourus sur le TS', s.el.src.LG === 'ts' && s.el.src.LHA === 'ts' && s.el.src.LHB === 'ts');
  trip(s, 'test', 'op'); run(s, 5);
  check('Élec : après AAR, basculement sur le TA, GMPP toujours en service', s.el.src.LG === 'ta' && s.el.src.LHA === 'ta' && s.pumps.every(Boolean), s.el.src.LG); }

{ const s = makeState(P100); run(s, 5); s.grid = false; s.ilot = true; run(s, 120);
  check('Élec : îlotage réussi, auxiliaires sur le TS, rien ne s\'arrête', s.coupled && s.el.src.LG === 'ts' && s.pumps.every(Boolean) && !s.tripped); }

/* îlotage depuis 100 % : Tmoy reste près de Tref pendant le transitoire ; ensuite le xénon impose de diluer */
{ const s = makeState(P100); run(s, 5); s.grid = false; s.ilot = true; const t0 = s.t; let dmin = 99, dmax = -99;
  while (s.t - t0 < 720) { step(s); if (s.t - t0 > 90) { const d = s.Tavg - s.Tref; dmin = Math.min(dmin, d); dmax = Math.max(dmax, d); } }
  check('Îlotage : Tmoy à ±1,5 °C de Tref de 1 min 30 à 12 min, sans AAR', dmin > -1.5 && dmax < 1.5 && !s.tripped, `écart ${dmin.toFixed(2)} à ${dmax.toFixed(2)} °C`);
  let last = -1e9; dmin = 99; dmax = -99;
  while (s.t - t0 < 2700) { step(s); const t = s.t - t0, d = s.Tavg - s.Tref;
    if (t - last >= 60 && !s.rea.run) { last = t; if (s.rods.R.p > 215 || (d < -0.8 && s.rods.R.p > 200)) Object.assign(s.rea, { mode: 'dil', q: 30, vt: 1, v: 0, run: true }); }
    dmin = Math.min(dmin, d); dmax = Math.max(dmax, d); }
  check('Îlotage : avec dilutions de 1 m³ quand R est en haut, Tmoy tenue à ±1,5 °C jusqu\'à 45 min', dmin > -1.5 && dmax < 1.5, `écart ${dmin.toFixed(2)} à ${dmax.toFixed(2)} °C, ${s.volDil.toFixed(1)} m³ dilués`); }

/* manque de tension externe : 400 et 225 kV perdus, îlotage raté */
const mdte = (failA, failB, dur) => { const s = makeState(P100); run(s, 5); s.el.dg.A.fail = failA; s.el.dg.B.fail = failB;
  s.grid = false; s.el.r225 = false; s.ilot = true; s.el.ilotRate = true; const t0 = s.t; let tA = null, fmin = 9, fmax = 0;
  while (s.t - t0 < dur) { step(s); if (tA == null && s.el.src.LHA) tA = s.t - t0; if (s.t - t0 > 300) { fmin = Math.min(fmin, s.flow); fmax = Math.max(fmax, s.flow); } }
  return { s, tA, fmin, fmax }; };
{ const { s, tA, fmin, fmax } = mdte(false, false, 1800);
  check('MDTE : AAR (îlotage raté), GMPP et TPA arrêtées', s.tripped && /turbine|Sous-tension/.test(s.aars[0].cause) && !s.pumps.some(Boolean) && !s.tpa.some(Boolean), s.aars[0].cause);
  check('MDTE : le diesel A reprend LHA en moins de 15 s', tA != null && tA < 15, tA && tA.toFixed(1) + ' s');
  check('MDTE : IS, charge RCV et ASG réalimentées par les diesels', s.el.av.is === 1 && s.el.av.chg === 1 && s.el.av.asg === 1);
  check('MDTE : circulation naturelle entre 2 et 6 % du débit nominal', fmin > 0.02 && fmax < 0.06, `${(fmin*100).toFixed(1)}–${(fmax*100).toFixed(1)} %`);
  check('MDTE : 30 min après, primaire refroidi par les GV, cœur intact', s.Tavg < 300 && s.coreDmg === 0 && s.satMargin > 10, `Tmoy=${s.Tavg.toFixed(1)} °C, marge ${s.satMargin.toFixed(0)} °C`); }
{ const { s } = mdte(true, false, 600);
  check('MDTE + échec du diesel A : LHA hors tension, LHB sur diesel B', s.el.dg.A.st === 'defaut' && !s.el.src.LHA && s.el.src.LHB === 'dg' && s.el.av.is === 1); }
{ const { s } = mdte(true, true, 1800);
  check('H3 : plus aucun tableau secouru, LLS en service, batteries en décharge', !s.el.src.LHA && !s.el.src.LHB && s.el.lls && s.el.bat < 0.6 && s.el.bat > 0.4, `batteries ${(s.el.bat*100).toFixed(0)} %`);
  check('H3 : la turbopompe ASG tient le niveau des GV', s.el.av.asg === 1 && s.Wasg > 0.005 && s.Lsg > 30, `niveau GV ${s.Lsg.toFixed(0)} %`);
  check('H3 : pas d\'IS ni de charge RCV possibles', s.el.av.is === 0 && s.el.av.chg === 0 && s.Qc < 0.5); }

/* ---- Disponibilités et contrats (audits du 30/10/2026) ---- */
{ // APD et appoint REA soumis à leurs alimentations
  const { s } = mdte(true, true, 120); const cap0 = s.areCap;
  s.apd = true; run(s, 5);
  check('Sans tableaux normaux, une APD commandée n\'apporte aucun débit', s.areCap === cap0, `capacité ${s.areCap.toFixed(3)}`);
  const cb0 = s.Cb; Object.assign(s.rea, { mode: 'dil', q: 30, vt: Infinity, v: 0, run: true }); run(s, 120);
  check('Sans pompe de charge RCV, une dilution demandée ne change pas le bore', Math.abs(s.Cb - cb0) < 1e-6, `${(s.Cb - cb0).toFixed(4)} ppm en 120 s`); }
{ // diesel dont le réservoir se vide
  const { s } = mdte(false, false, 60); s.el.dg.A.fuel = 1e-6; run(s, 5);
  check('Diesel à réservoir vide : il s\'arrête et ne tient plus son tableau', s.el.dg.A.st === 'defaut' && s.el.src.LHA !== 'dg', s.el.dg.A.st); }
{ // pic xénon calculé par le moteur lui-même après un AAR depuis 100 %
  const s = makeState(P100); run(s, 5); trip(s, 'test', 'op'); const t0 = s.t; let mx = 0, tm = 0, nx = 0;
  while (s.t - t0 < 14 * 3600) { step(s); if (s.t >= nx) { nx = s.t + 60; if (s.X > mx) { mx = s.X; tm = (s.t - t0) / 3600; } } }
  check('Pic xénon du moteur après AAR entre 7 et 11 h, entre −4 500 et −5 500 pcm', tm > 7 && tm < 11 && -2700 * mx < -4500 && -2700 * mx > -5500, tm.toFixed(1) + ' h, ' + (-2700 * mx).toFixed(0) + ' pcm'); }

{ // perte totale de l'eau alimentaire après AAR : les GV s'assèchent et ne refroidissent plus le primaire
  const s = makeState(P100); run(s, 5); trip(s, 'test', 'op'); const t0 = s.t; let tSec = null;
  while (s.t - t0 < 5400) { s.areIsol = true; s.asgV = false; step(s); if (tSec == null && s.gvMouil < 0.05) tSec = (s.t - t0) / 60; }
  check('GV sans eau alimentaire : asséchés entre 40 et 90 min, ils ne refroidissent plus le primaire', tSec != null && tSec > 40 && tSec < 90 && s.Qsg < 1e-3 && s.Tavg > 320,
    `asséchés à ${tSec && tSec.toFixed(0)} min ; à 1 h 30 Qsg ${(s.Qsg * 100).toFixed(2)} %, Tmoy ${s.Tavg.toFixed(0)} °C`);
  while (s.t - t0 < 9000) { s.areIsol = true; s.asgV = false; step(s); }
  check('GV secs, soupapes SEBIM : le primaire reste à saturation au lieu de dépasser 360 °C, et se vide', s.Tavg < 360 && s.Vv > 0, `Tmoy ${s.Tavg.toFixed(0)} °C, vide ${s.Vv.toFixed(0)} m³`); }
{ // batteries : l'épuisement est bien signalé par le moteur
  const { s } = mdte(true, true, 60); s.el.bat = 1e-6; run(s, 2);
  check('Batteries vides : état « contrôle-commande perdu » levé', s.el.batVide === true); }

console.log(fails ? `\n${fails} test(s) en échec` : '\nTous les tests passent');
process.exit(fails ? 1 : 0);
