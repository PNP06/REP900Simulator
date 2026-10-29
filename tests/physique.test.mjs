// Tests de non-régression du modèle physique. Usage : node tests/physique.test.mjs
// Le modèle physique (js/physique.js) est exécuté seul, sans navigateur.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const js = readFileSync(fileURLToPath(new URL('../js/physique.js', import.meta.url)), 'utf8');
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

{ // pic xénon après arrêt
  const lI=2.87e-5,lX=2.09e-5,sg=7.5e-5,gI=0.0639,gX=0.00237; let I=1,X=1,mx=1,tm=0;
  for (let t=0;t<=48*3600;t+=60){ I+=lI*(0-I)*60; X+=((lX+sg)*(gI*I)/(gI+gX)-lX*X)*60; if(X>mx){mx=X;tm=t/3600;} }
  check('Pic xénon après arrêt entre 7 et 11 h', tm > 7 && tm < 11, tm.toFixed(1) + ' h, ' + (-2700*mx).toFixed(0) + ' pcm'); }

console.log(fails ? `\n${fails} test(s) en échec` : '\nTous les tests passent');
process.exit(fails ? 1 : 0);
