// Tests d'interface : node tests/interface.test.mjs (nécessite Playwright et Chromium).
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const url = 'file://' + fileURLToPath(new URL('../index.html', import.meta.url));

let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'ÉCHEC') + ' ' + name + (info ? ' — ' + info : '')); if (!ok) fails++; };

// Déroule une leçon en appliquant, étape par étape, les actions d'un opérateur.
const LESSONS = String.raw`(()=>{
const out=[];
function run(sec,f){ const s=A.s,c=A.ctx; for(let i=0;i<sec/DT;i++){ step(s); evalAlarms(s); tick(s,c); f&&f(s); if(c.stepOk) return true; } return c.stepOk; }
function lesson(id,plan){
  launch(id); $('#brief').hidden=true; A.paused=true;
  const sc=A.scn; let ok=true, at='';
  for(let i=0;i<sc.steps.length;i++){ const st=sc.steps[i]; if(st.last) break; const p=plan[i]||{}; if(p.pre) p.pre(A.s);
    const r=st.ok?run(p.t||3600,p.each):true; if(!r&&!st.opt){ ok=false; at=st.t; break; } enterStep(i+1); }
  out.push([id,ok,at]);
}
lesson('l-cin',{1:{pre:s=>{act('rodSel','R');act('rod','5');}},2:{t:2000},3:{pre:s=>act('rod','-10')},4:{pre:s=>act('rod','6'),t:3000,each:s=>{ if(s.rate>0.0015) act('rod','-1'); else if(s.rate<-0.0015) act('rod','1'); }}});
lesson('l-fb',{1:{pre:s=>{act('modeR','man');act('modeG','man');}},2:{pre:s=>{act('ramp','5');s.LtSet=.6;}},3:{pre:s=>act('modeG','auto')},4:{pre:s=>act('modeR','auto')}});
lesson('l-di',{1:{pre:s=>{act('modeR','man');act('rodSel','R');for(let i=0;i<4;i++)act('rod','-10');}},2:{pre:s=>{act('reaMode','dil');act('reaQ','30');act('reaV','inf');act('reaStart');},each:s=>{ if(s.rea.run&&s.volDil>1&&Math.abs(s.Tavg-s.Tref)<0.4) act('reaStop'); }},3:{pre:s=>{act('modeR','auto');act('reaMode','bor');act('reaQ','10');act('reaV','inf');act('reaStart');},each:s=>{ if(s.rea.run&&s.rods.R.p>=186) act('reaStop'); }}});
lesson('l-pzr',{1:{pre:s=>{act('ramp','10');s.LtSet=.8;}},2:{pre:s=>act('heatMode','on')},3:{pre:s=>act('heatMode','auto')},4:{pre:s=>{act('chgMode','man');s.chgMan=5;}},5:{pre:s=>act('chgMode','auto')}});
lesson('l-gv',{1:{pre:s=>{act('ramp','30');s.LtSet=.7;}},2:{pre:s=>{act('areMode','man');s.areMan=.55;}},3:{pre:s=>act('areMode','auto')}});
lesson('l-prot',{1:{pre:s=>{act('sprayMode','man');s.sprayMan=.4;}},2:{pre:s=>act('sprayMode','auto')}});
return out; })()`;

const browser = await chromium.launch();
for (const [w, h, scheme] of [[1440, 900, 'dark'], [390, 844, 'light'], [320, 700, 'dark']]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
  const pg = await ctx.newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(url); await pg.waitForTimeout(300);
  check(`${w}px : fenêtre « À propos » à la première visite`, await pg.evaluate(() => !document.querySelector('#about').hidden));
  await pg.click('#abOk');
  for (const id of ['tuto', 'div', 'montee', 'tpa', 'libre']) {
    await pg.evaluate(i => launch(i), id); await pg.click('#goBtn');
    await pg.evaluate(() => setSpeed(300)); await pg.waitForTimeout(500); await pg.evaluate(() => finish());
  }
  await pg.evaluate(() => openTour(0));
  for (let i = 0; i < 19; i++) { await pg.evaluate(i => tourGo(i), i); await pg.waitForTimeout(120); }
  await pg.evaluate(() => { closeTour(); openFB('new'); });
  const sw = await pg.evaluate(() => document.documentElement.scrollWidth);
  check(`${w}px : pas de défilement horizontal`, sw <= w, `${sw}px`);
  check(`${w}px : aucune erreur JavaScript`, errs.length === 0, errs.slice(0, 2).join(' | '));
  await ctx.close();
}
{ const pg = await browser.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(url); await pg.evaluate(() => { store('about', 1); document.querySelector('#about').hidden = true; });
  for (const [id, ok, at] of await pg.evaluate(LESSONS)) check('Leçon ' + id + ' jouable de bout en bout', ok, at);
  check('Leçons : aucune erreur JavaScript', errs.length === 0, errs.slice(0, 2).join(' | ')); }
await browser.close();
console.log(fails ? `\n${fails} test(s) en échec` : '\nTous les tests passent');
process.exit(fails ? 1 : 0);
