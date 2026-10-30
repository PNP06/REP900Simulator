// Instantané de non-régression : rejoue chaque scénario 30 minutes sans action opérateur (hasard fixé)
// et enregistre l'état final, avec une empreinte des chapitres, de l'aide, du lexique et des corrections.
// Usage : node tests/instantane.mjs fichier.json        (écrit l'instantané de la version actuelle)
//         node tests/instantane.mjs --compare a.json b.json
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);

if (process.argv[2] === '--compare') {
  const a = JSON.parse(readFileSync(process.argv[3], 'utf8')), b = JSON.parse(readFileSync(process.argv[4], 'utf8'));
  let n = 0;
  for (const e of [...a.errs, ...b.errs]) { console.log('Erreur de page : ' + e); n++; }
  for (const k of Object.keys(a.out)) {
    if (k === '__ui') { for (const kk of Object.keys(a.out[k])) if (JSON.stringify(a.out[k][kk]) !== JSON.stringify(b.out[k]?.[kk])) { console.log('Différence : ' + kk); n++; } }
    else if (JSON.stringify(a.out[k]) !== JSON.stringify(b.out[k])) { console.log('Différence : ' + k + '\n  avant ' + JSON.stringify(a.out[k]) + '\n  après ' + JSON.stringify(b.out[k])); n++; }
  }
  console.log(n ? n + ' différence(s)' : 'Identique (' + (Object.keys(a.out).length - 1) + ' scénarios)');
  process.exit(n ? 1 : 0);
}

const { chromium } = require('playwright');
const url = 'file://' + fileURLToPath(new URL('../index.html', import.meta.url));
const browser = await chromium.launch();
const pg = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.goto(url); await pg.waitForTimeout(300);
const out = await pg.evaluate(() => {
  const res = {}, fn = (k, v) => typeof v === 'function' ? String(v) : v;
  const h = x => { let v = 0; const t = typeof x === 'string' ? x : JSON.stringify(x, fn); for (let i = 0; i < t.length; i++) v = (v * 31 + t.charCodeAt(i)) | 0; return v; };
  const r = v => typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v;
  for (const id of SCN.map(x => x.id).filter(id => id !== 'myst')) {
    let seed = 12345; Math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    try {
      launch(id); document.querySelector('#brief').hidden = true; A.paused = true;
      const s = A.s, c = A.ctx;
      for (let i = 0; i < Math.round(1800 / DT) && !A.done; i++) { step(s); evalAlarms(s); tick(s, c); }
      res[id] = { t: r(s.t), n: r(s.n), Tavg: r(s.Tavg), Ppzr: r(s.Ppzr), Lpzr: r(s.Lpzr), Lsg: r(s.Lsg), Cb: r(s.Cb), X: r(s.X), R: r(s.rods.R.p), G: r(s.rods.G.p),
        tripped: s.tripped, is: s.is, Vv: r(s.Vv), Tg: r(s.Tg), log: s.log.length, lim: [...s.limits].join('|'), done: A.done };
    } catch (e) { res[id] = { err: String(e) }; }
  }
  res.__ui = { tour: TOUR.map(c => [c.t, c.th, c.k, c.inset || '', h(c.h), !!c.last]), themes: THEMES.map(t => t[0] + ':' + t[1]),
    help: Object.keys(HELP).map(k => k + ':' + h(HELP[k])), gloss: h(GLOSS), dm: Object.keys(DM).map(k => k + ':' + h(DM[k])),
    scn: SCN.map(x => x.id + ':' + h(x)), stepx: h(STEPX), eclair: h(ECLAIR), coach: h(COACH),
    body: h(document.body.innerHTML.replace(/<script[^>]*><\/script>/g, '').replace(/\s+/g, ' ')) };
  return res;
});
await browser.close();
writeFileSync(process.argv[2] || 'instantane.json', JSON.stringify({ out, errs }, null, 1));
console.log('Instantané écrit : ' + (process.argv[2] || 'instantane.json') + (errs.length ? ' (' + errs.length + ' erreur(s) de page)' : ''));
