// Tests d'interface : node tests/interface.test.mjs (nécessite Playwright et Chromium).
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
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
lesson('l-gv',{1:{pre:s=>{act('ramp','30');s.LtSet=.7;}},3:{pre:s=>{s.LtSet=.9;}},4:{pre:s=>{act('areMode','man');s.areMan=Math.round(s.Wst*100-15)/100;}},6:{pre:s=>act('areMode','auto')}});
lesson('l-xe',{1:{pre:s=>{act('ramp','10');s.LtSet=.5;}},
  2:{t:15000,each:s=>{ if(!s.rea.run&&s.Tavg-s.Tref<-1.5){ act('reaMode','dil');act('reaQ','10');act('reaV','0.3');act('reaStart'); } }},
  3:{pre:s=>{act('ramp','5');s.LtSet=1;},t:3600,each:s=>{ if(!s.rea.run&&s.Tavg-s.Tref>1){ act('reaMode','bor');act('reaQ','5');act('reaV','0.1');act('reaStart'); } }},
  4:{pre:s=>act('aar'),t:37000}});
lesson('l-prot',{1:{pre:s=>{act('sprayMode','man');s.sprayMan=.4;}},2:{pre:s=>act('sprayMode','auto')}});
lesson('l-div',{1:{pre:s=>{act('rodSel','R');act('rod','100');}},2:{pre:s=>act('rod','40')},3:{pre:s=>act('rod','20')},
  4:{each:(()=>{ let l=0; return s=>{ if(s.t-l>40&&s.Td>300){ act('rod','2'); l=s.t; } }; })()},
  5:{each:s=>{ if(s.n>1e-7&&!s.srInhib) act('srInhib'); }},
  6:{t:7200,each:(()=>{ let l=0; return s=>{ if(s.t-l<25) return; l=s.t; const lo=Math.LN2/900, td=s.rate>0?Math.LN2/s.rate:1e9;
    if(s.n<0.006){ if(td>120) act('rod','1'); else if(td<50) act('rod','-1'); } else if(s.n>0.025&&s.rate>-lo) act('rod','-1'); else if(s.n<0.012&&s.rate<lo) act('rod','1');
    else if(s.n>=0.012&&s.n<=0.025){ if(s.rate>Math.LN2/400) act('rod','-1'); else if(s.rate<-Math.LN2/400) act('rod','1'); } }; })()}});
return out; })()`;

const browser = await chromium.launch();
for (const [w, h, scheme] of [[1440, 900, 'dark'], [390, 844, 'light'], [320, 700, 'dark']]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
  const pg = await ctx.newPage(); const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(url); await pg.waitForTimeout(300);
  check(`${w}px : fenêtre « À propos » à la première visite`, await pg.evaluate(() => !document.querySelector('#about').hidden));
  await pg.click('#abOk');
  for (const id of ['ihm', 'tuto', 'div', 'montee', 'tpa', 'libre']) {
    await pg.evaluate(i => launch(i), id); await pg.click('#goBtn');
    await pg.evaluate(() => setSpeed(300)); await pg.waitForTimeout(500); await pg.evaluate(() => finish());
  }
  await pg.evaluate(() => openTour(0));
  const nT = await pg.evaluate(() => TOUR.length); for (let i = 0; i < nT; i++) { await pg.evaluate(i => tourGo(i), i); await pg.waitForTimeout(120); }
  check(`${w}px : visite en 8 thèmes`, await pg.evaluate(() => new Set(TOUR.map(c => c.th)).size === 8));
  await pg.evaluate(() => { document.querySelector('#srcov').hidden = false; });
  await pg.evaluate(() => { closeTour(); openFB('new'); });
  const sw = await pg.evaluate(() => document.documentElement.scrollWidth);
  check(`${w}px : pas de défilement horizontal`, sw <= w, `${sw}px`);
  check(`${w}px : aucune erreur JavaScript`, errs.length === 0, errs.slice(0, 2).join(' | '));
  await ctx.close();
}
// Poste de pilotage sur ordinateur : tout tient dans l'écran, vues et familles, bandeau cliquable, cibles des leçons et des corrections atteignables.
for (const [w, h] of [[1280, 720], [1440, 900], [1920, 1080]]) {
  const pg = await browser.newPage({ viewport: { width: w, height: h } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(url); await pg.evaluate(() => { store('about', 1); document.querySelector('#about').hidden = true; launch('libre'); document.querySelector('#goBtn').click(); });
  await pg.waitForTimeout(400);
  const r = await pg.evaluate(() => {
    const vis = s => { const e = document.querySelector(s); return !!e && inView(e); }, o = {};
    o.noScroll = document.documentElement.scrollHeight <= innerHeight + 1 && document.documentElement.scrollWidth <= innerWidth;
    o.band = vis('#band');
    o.speeds = [...document.querySelectorAll('.spdseg button')].every(b => inView(b));
    o.blk = vis('#runAl') && vis('#runList') && vis('#runAuto');
    o.mission = vis('#mission'); o.synop = vis('.card[data-c="synop"]');
    { const sv = document.querySelector('#synw svg'), b = sv.getBoundingClientRect(), vb = sv.viewBox.baseVal; o.fill = Math.min(b.width / vb.width, b.height / vb.height) * vb.width / b.width; o.famW = document.querySelector('.fam').offsetWidth; }
    o.views = [...document.querySelectorAll('#vtabs button')].filter(b => b.getClientRects().length).every(b => { b.click(); const c = document.querySelector('.card[data-c="' + b.dataset.vue + '"]'); return inView(c); });
    o.fams = [...document.querySelectorAll('#ftabs button')].every(b => { b.click(); const cs = FAMS[b.dataset.fam].c.map(k => document.querySelector('.card[data-c="' + k + '"]')); const others = [...document.querySelectorAll('#famb>.card')].filter(c => !cs.includes(c)); return inView(cs[0]) && others.every(c => !c.getClientRects().length); });
    setVue('synop'); setFam('core');
    const sels = new Set(); for (const D of Object.values(DM)) for (const st of D.steps) for (const a of [].concat(st.a || [])) if (a && a.sel && a.sel !== '#mis-info') sels.add(a.sel);
    for (const sc of SCN) for (const st of sc.steps || []) for (const q of st.f || []) if (!/header\.top|#band$|#mis-info/.test(q)) sels.add(q);
    // les commandes propres à TMI n'existent à l'écran que pendant ce scénario
    document.body.classList.add('tmi');
    o.unreach = [...sels].filter(q => { const e = document.querySelector(q); if (!e) return true; reveal(e); e.scrollIntoView({ block: 'center' }); return !e.closest('header.top') && !inView(e); });
    document.body.classList.remove('tmi');
    launch('libre'); document.querySelector('#brief').hidden = true; act('reaMode', 'dil'); act('reaQ', '10'); act('reaV', '0.3'); act('reaStart'); updateUI(); updateRun();
    o.run = /Dilution/.test(document.querySelector('#runList').textContent) && /Dil\./.test(document.querySelector('#z-cb').textContent);
    setVue('synop'); updateUI();
    o.pal = Object.keys(SYC).filter(c => { const g = document.querySelector('#synw [data-sy="' + c + '"]'); g.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 300, clientY: 300 })); const p = document.querySelector('#synpal'); return !p || !p.textContent.includes(SYC[c].t) || !inView(p); });
    palOpen('pzr'); document.querySelector('#synpal .seg[data-key="heatMode"] button[data-v="on"]').click(); o.palAct = A.s.heatMode === 'on' && document.querySelector('.card[data-c="pzr"] .seg[data-key="heatMode"] button[data-v="on"]').classList.contains('on');
    palOpen('turb'); const rg = document.querySelector('#synpal [data-rng="#ltSet"]'); rg.value = 42; rg.dispatchEvent(new Event('input', { bubbles: true })); o.palRng = Math.round(A.s.LtSet * 100) === 42 && document.querySelector('#ltSet').value === '42';
    document.querySelector('#synpal [data-palfam]').click(); o.palFam = !document.querySelector('#synpal') && inView(document.querySelector('.card[data-c="turb"]'));
    A.s.asg = true; A.s.sebim = true; A.s.pumps[1] = false; updateUI();
    o.synSt = document.querySelector('#sy-asg').classList.contains('crit') && document.querySelector('#sp-asg').classList.contains('alarm') && document.querySelector('#sv-vseb').classList.contains('alarm') && document.querySelector('#sy-gm1').classList.contains('off');
    return o; });
  check(`${w}×${h} : synoptique sans grandes marges vides, la place restante va à la colonne de droite`, r.fill >= 0.85 && r.famW >= 360, `remplissage ${Math.round(r.fill * 100)} %, colonne ${r.famW}px`);
  if (w === 1440) {
    // Tutoriel de prise en main du poste : chaque étape se valide par le geste demandé, fait dans l'interface.
    const t = await pg.evaluate(async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms)), clk = q => document.querySelector(q).dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 300, clientY: 300 }));
      const okNow = async () => { for (let i = 0; i < 30 && !A.ctx.stepOk; i++) await wait(100); await wait(200); return A.ctx.stepOk; }, nx = async () => { document.querySelector('#tNext').click(); await wait(150); };
      launch('ihm'); document.querySelector('#goBtn').click(); await wait(200); const bad = [];
      const gest = [null, () => clk('#rd-pp'), () => clk('#sy-pp'), async () => { clk('#synpal .seg[data-key="heatMode"] button[data-v="on"]'); await wait(300); clk('#synpal .seg[data-key="heatMode"] button[data-v="auto"]'); },
        () => clk('#synpal [data-palfam]'), () => clk('#ftabs [data-fam="sec"]'), async () => { clk('#vtabs [data-vue="crv"]'); await wait(300); clk('#vtabs [data-vue="synop"]'); },
        () => { clk('#sy-cb'); for (const [k, v] of [['reaMode', 'bor'], ['reaQ', '5'], ['reaV', '0.1']]) clk('#synpal .seg[data-key="' + k + '"] button[data-v="' + v + '"]'); clk('#synpal [data-act="reaStart"]'); },
        async () => { await wait(300); ackAll(); }, () => setSpeed(300)];
      for (let i = 1; i < gest.length; i++) { await nx(); await gest[i](); if (!(await okNow())) bad.push(i + 1 + ' ' + A.scn.steps[A.ctx.step].t); }
      setSpeed(1); return { bad, n: A.scn.steps.length };
    });
    check(`${w}×${h} : tutoriel de prise en main du poste : chaque geste valide son étape`, t.bad.length === 0 && t.n >= 12, t.bad.join(' | '));
  }
  check(`${w}×${h} : synoptique, chaque équipement ouvre ses actions rapides`, r.pal.length === 0, r.pal.join(', '));
  check(`${w}×${h} : actions rapides : bouton et curseur agissent comme dans les cartes, lien vers la famille`, r.palAct && r.palRng && r.palFam);
  check(`${w}×${h} : synoptique : ASG, SEBIM et pompe arrêtée signalés en rouge`, r.synSt);
  r.bandClick = [];
  for (const [id, k] of await pg.evaluate(() => Object.entries(BAND_CARD))) { await pg.click('#rd-' + id); await pg.waitForTimeout(700); if (!await pg.evaluate(k => inView(document.querySelector('.card[data-c="' + k + '"]')), k)) r.bandClick.push(id); }
  await pg.evaluate(() => { launch('l-gv'); document.querySelector('#brief').hidden = true; A.paused = true; setFam('core'); enterStep(4); }); await pg.waitForTimeout(800);
  r.lesson = await pg.evaluate(() => inView(document.querySelector('[data-c="are"]')) && document.querySelector('.seg[data-key="areMode"]').classList.contains('focus') && inView(document.querySelector('.seg[data-key="areMode"]')));
  check(`${w}×${h} : tout tient dans l'écran, sans défiler`, r.noScroll);
  check(`${w}×${h} : bandeau, vitesses ×1 à ×300, bloc alarmes/actions/automatismes, consigne et synoptique visibles`, r.band && r.speeds && r.blk && r.mission && r.synop, JSON.stringify(r));
  check(`${w}×${h} : chaque onglet de vue montre sa carte`, r.views);
  check(`${w}×${h} : chaque famille de commandes montre ses cartes, et seulement elles`, r.fams);
  check(`${w}×${h} : chaque case du bandeau ouvre sa carte`, r.bandClick.length === 0, r.bandClick.join(', '));
  check(`${w}×${h} : toutes les cibles des leçons et des corrections commentées sont atteignables`, r.unreach.length === 0, r.unreach.join(' | '));
  check(`${w}×${h} : une étape de leçon ouvre la carte dont elle parle`, r.lesson);
  check(`${w}×${h} : appoint en cours affiché dans « Mes actions » et dans la case Bore`, r.run);
  check(`${w}×${h} : aucune erreur JavaScript`, errs.length === 0, errs.slice(0, 2).join(' | '));
  await pg.close();
}
{ const pg = await browser.newPage({ viewport: { width: 390, height: 844 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(url); await pg.evaluate(() => { store('about', 1); document.querySelector('#about').hidden = true; launch('libre'); document.querySelector('#goBtn').click(); });
  const r = await pg.evaluate(() => Object.entries(BAND_CARD).filter(([id, k]) => { const c = document.querySelector('#rd-' + id); if (!c.getClientRects().length) return false; c.click(); return document.body.dataset.tab !== tabOf(document.querySelector('.card[data-c="' + k + '"]')); }).map(([id]) => id));
  check('Téléphone : une case du bandeau ouvre l\'onglet de sa carte', r.length === 0, r.join(', '));
  check('Téléphone : aucune erreur JavaScript', errs.length === 0, errs.slice(0, 2).join(' | '));
  await pg.close(); }
{ const pg = await browser.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(url); await pg.evaluate(() => { store('about', 1); document.querySelector('#about').hidden = true; });
  for (const [id, ok, at] of await pg.evaluate(LESSONS)) check('Leçon ' + id + ' jouable de bout en bout', ok, at);
  const ec = await pg.evaluate(() => { const miss = SCN.filter(x => x.steps && x.steps.some(st => !st.e)).map(x => x.id);
    lvlSet('deb'); launch('l-cin'); document.querySelector('#brief').hidden = true; const d = !!document.querySelector('#mis-body .eclair');
    lvlSet('exp'); const e = !document.querySelector('#mis-body .eclair'); lvlSet('deb');
    launch('div'); const pl = !!document.querySelector('#mis-body details.plan'); return { miss, d, e, pl }; });
  const gv = await pg.evaluate(() => { const sc = byId('l-gv'), st = sc.steps; launch('l-gv'); document.querySelector('#brief').hidden = true; A.paused = true;
    let err = ''; st.forEach((x, i) => { try { enterStep(i); curInfo(sc, A.ctx, A.s); } catch (e) { err = x.t + ' : ' + e.message; } });
    return { n: st.length, are: st.filter(x => !x.last).every(x => x.show === '[data-c="are"]' && x.tab === 'cmd'), obs: st.filter(x => !x.last).every(x => /À observer/.test(x.h)), err }; });
  check('Leçon GV : 8 étapes courtes', gv.n === 8, gv.n + ' étapes');
  check('Leçon GV : carte Eau alimentaire montrée à chaque étape', gv.are);
  check('Leçon GV : une chose à observer à chaque étape', gv.obs);
  check('Leçon GV : lignes de mesures sans erreur', !gv.err, gv.err);
  check('Explication « En clair » pour chaque étape de leçon', ec.miss.length === 0, ec.miss.join(', '));
  check('Niveau Débutant / Confirmé appliqué à la consigne', ec.d && ec.e && ec.pl);
  const sp = await pg.evaluate(() => { document.querySelector('#sndBtn').click(); const open = !document.querySelector('#sndPop').hidden;
    const cb = document.querySelector('#sndPop [data-snd="amb"]'); const before = SND.pref.amb; cb.click(); const changed = SND.pref.amb === !before && document.querySelector('#menu [data-snd="amb"]').checked === SND.pref.amb; cb.click();
    document.body.click(); return open && changed && document.querySelector('#sndPop').hidden; });
  check('Pictogramme son : réglages d\'ambiance accessibles depuis le cockpit', sp);
  const dm = await pg.evaluate(() => DEMO_IDS.map(id => { demoStart(id, true); const s = A.s, c = A.ctx, scn = A.scn; let n = 0;
    while (!A.done && n < 8 * 3600 / DT) { step(s); evalAlarms(s); tick(s, c); demoTick(); n++; }
    const ko = scn.evaluate.call(scn, s, c).filter(x => !x.ok).map(x => x.t); demoStop(); A.done = false; return [id, A.s && ko.length === 0 && n < 8 * 3600 / DT, ko.join(', ')]; }));
  for (const [id, ok, ko] of dm) check('Correction commentée ' + id + ' : tous les critères atteints', ok, ko);
  const aw = await pg.evaluate(() => { const r = {}, w = document.querySelector('#aarw');
    launch('libre'); document.querySelector('#brief').hidden = true; A.paused = false; aarWatch();
    act('aar'); aarWatch(); r.man = !w.hidden && /AAR manuel/.test(w.textContent) && /Avant de réarmer/.test(w.textContent); r.run = A.paused === false;
    aarClose(); updateRun(); const b = document.querySelector('#runList [data-act="aarWhy"]'); r.enc = !!b; if (b) b.click(); r.reopen = !w.hidden;
    launch('l-gv'); document.querySelector('#brief').hidden = true; A.paused = true; aarWatch(); r.closed = w.hidden;
    const s = A.s; act('areMode', 'man'); s.areMan = 0; let n = 0; while (!s.tripped && n < 3600 / DT) { step(s); evalAlarms(s); tick(s, A.ctx); n++; }
    aarWatch(); const tx = w.textContent; r.gv = /Niveau GV très bas/.test(tx) && /seuil 15 %/.test(tx) && /ARE était en manuel/.test(tx);
    finish(); const d = document.querySelector('#dAar'); r.deb = !!d; aarClose(); if (d) d.click();
    r.top = !w.hidden && +getComputedStyle(w).zIndex > +getComputedStyle(document.querySelector('#debrief')).zIndex;
    return r; });
  check('Fenêtre « Pourquoi l\'AAR ? » ouverte à l\'AAR, avec les vérifications avant réarmement', aw.man);
  check('Fenêtre AAR : la simulation continue (pas de pause)', aw.run);
  check('Fenêtre AAR : rouvrable depuis « En cours »', aw.enc && aw.reopen);
  check('Fenêtre AAR : fermée au changement de séance', aw.closed);
  check('Fenêtre AAR : protection, valeur/seuil et origine probable (niveau GV très bas)', aw.gv);
  check('Fenêtre AAR : rouvrable depuis le débriefing, au-dessus de celui-ci', aw.deb && aw.top);
  check('Leçons : aucune erreur JavaScript', errs.length === 0, errs.slice(0, 2).join(' | ')); }
// Retours : envoi Netlify Forms et onglet « Retours publiés », servis par un petit serveur local comme sur Netlify.
{ const root = new URL('..', import.meta.url), posts = [];
  const sample = { maj: '2026-10-29', retours: [{ n: 1, date: '2026-10-20', niveau: 'incohérence', partie: 'Modèle physique', titre: 'Îlotage : Tmoy trop basse', description: 'Tmoy reste 5 °C sous Tref.', statut: 'ouvert', reponse: 'Bien vu, correction prévue.', date_reponse: '2026-10-22' }] };
  const srv = createServer((req, res) => {
    if (req.method === 'POST') { let b = ''; req.on('data', c => b += c); req.on('end', () => { posts.push({ path: req.url, type: req.headers['content-type'], body: new URLSearchParams(b) }); res.end('ok'); }); return; }
    if (req.url.startsWith('/retours.json')) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(sample)); return; }
    const path = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html', ext = path.split('.').pop();
    if (path.includes('..')) { res.statusCode = 404; res.end(); return; }
    try { const body = readFileSync(new URL(path, root)); res.setHeader('Content-Type', ({ css: 'text/css', js: 'text/javascript' }[ext] || 'text/html') + '; charset=utf-8'); res.end(body); } catch (e) { res.statusCode = 404; res.end(); }
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port + '/';
  const pg = await browser.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(base); await pg.evaluate(() => { store('about', 1); document.querySelector('#about').hidden = true; closeTour(); openFB('new'); });
  const html = readFileSync(new URL('index.html', root), 'utf8');
  check('Retours : formulaire statique détectable par Netlify', /<form name="retour" data-netlify="true" netlify-honeypot="bot-field"/.test(html));
  const site = [html, readFileSync(new URL('css/simulateur.css', root), 'utf8'), ...[...html.matchAll(/<script src="([^"]+)"/g)].map(m => readFileSync(new URL(m[1], root), 'utf8'))].join('\n');
  check('Retours : aucune mention du compte GitHub dans la page', !/github|pnp06/i.test(site));
  await pg.click('#fbSend');
  check('Retours : champs obligatoires signalés', /Il manque/.test(await pg.textContent('#fbErr')) && posts.length === 0);
  await pg.evaluate(() => { document.querySelector('input[name="fblv"]').checked = true; });
  await pg.fill('#fbTitle', 'Essai'); await pg.fill('#fbDesc', 'Description d\'essai');
  await pg.click('#fbSend'); await pg.waitForSelector('#fbReady:not([hidden])');
  const p = posts[0];
  check('Retours : envoi au formulaire Netlify « retour »', !!p && p.path === '/' && /x-www-form-urlencoded/.test(p.type) && p.body.get('form-name') === 'retour' && p.body.get('titre') === 'Essai' && p.body.get('niveau').startsWith('Critique') && /P nucléaire|Aucune simulation/.test(p.body.get('contexte')), p && p.body.toString().slice(0, 120));
  check('Retours : confirmation affichée et formulaire vidé', /bien été envoyé/.test(await pg.textContent('#fbReadyT')) && await pg.inputValue('#fbTitle') === '');
  await pg.evaluate(() => { FB.endpoint = '/introuvable-' + Date.now(); document.querySelector('input[name="fblv"]').checked = true; });
  await pg.route('**/introuvable-*', r => r.fulfill({ status: 404, body: '' }));
  await pg.fill('#fbTitle', 'Essai 2'); await pg.fill('#fbDesc', 'Texte conservé'); await pg.click('#fbSend');
  await pg.waitForFunction(() => document.querySelector('#fbReady').classList.contains('ko'));
  check('Retours : échec d\'envoi signalé, texte conservé et copiable', await pg.inputValue('#fbDesc') === 'Texte conservé' && await pg.isVisible('#fbCopy'));
  await pg.evaluate(() => fbTab('list')); await pg.waitForSelector('#fbItems .fbi');
  const li = await pg.evaluate(() => ({ t: document.querySelector('#fbItems .fbt').textContent, lv: document.querySelector('#fbItems .lvb').textContent }));
  await pg.click('#fbItems [data-fbc]');
  check('Retours publiés : lus dans retours.json, avec la réponse', li.t === 'Îlotage : Tmoy trop basse' && li.lv === 'Incohérence' && /correction prévue/.test(await pg.textContent('#fbcm-1')));
  const real = JSON.parse(readFileSync(new URL('retours.json', root), 'utf8'));
  check('retours.json du dépôt bien formé', Array.isArray(real.retours) && real.retours.every(x => x.titre && x.niveau && x.statut));
  check('Retours : aucune erreur JavaScript', errs.length === 0, errs.slice(0, 2).join(' | '));
  await pg.close(); srv.close(); }
// Alimentations électriques : zone du synoptique, vue Électrique, manque de tension externe, commandes des diesels.
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const pg = await browser.newPage({ viewport: { width: w, height: h } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(url); await pg.evaluate(() => { store('about', 1); document.querySelector('#about').hidden = true; launch('libre'); document.querySelector('#goBtn').click(); A.paused = true; });
  await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    const o = {}, q = x => document.querySelector(x), txt = x => q(x).textContent;
    if (!desk()) setTab('synop'); updateUI();
    o.zone = /TS · TS · TS/.test(txt('#sv-elt')) && /prêts/.test(txt('#sv-eld'));
    q('#sy-elt').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return o; });
  await pg.waitForTimeout(900);
  Object.assign(r, await pg.evaluate(() => {
    const o = {}, q = x => document.querySelector(x), txt = x => q(x).textContent;
    const cd = q('.card[data-c="elec"]'); o.open = !q('#synpal') && inView(cd) && (!desk() || A.vues.includes('elec'));
    updateUI(); o.normal = /6,6 kV · sur TS/.test(txt('#et-LHA')) && q('#eb-tsA').classList.contains('on');
    const s = A.s; s.grid = false; s.el.r225 = false; s.ilot = true; s.el.ilotRate = true;
    for (let i = 0; i < 60 / DT; i++) { step(s); evalAlarms(s); } updateUI();
    o.mdte = /sur diesel/.test(txt('#et-LHA')) && /sur diesel/.test(txt('#et-LHB')) && /hors tension/.test(txt('#et-LG')) && q('#eb-dgA').classList.contains('on') && q('#eld-LG0').classList.contains('al');
    if (!desk()) setTab('synop'); setVue('synop'); updateUI();
    o.syn = /✕ · DG · DG/.test(txt('#sv-elt')) && q('#sy-elt').classList.contains('crit') && q('#sy-gm0').classList.contains('off');
    o.alarm = !!(A.s.alarms.mdt||{}).on && !!(A.s.alarms.dgs||{}).on;
    act('dg', 'A'); o.refus = s.el.dg.A.st === 'service';
    s.el.dg.B.fail = true; for (let i = 0; i < 5 / DT; i++) step(s); updateUI();
    act('dus'); o.dus = s.el.dus.st === 'demarrage' && s.el.dus.voie === 'LHB';
    return o; }));
  check(`${w}px : synoptique : zone Électricité (réseaux, tableaux, diesels)`, r.zone);
  check(`${w}px : un clic sur la zone Électricité ouvre la vue Électrique`, r.open);
  check(`${w}px : vue Électrique en fonctionnement normal : tableaux sur le TS, disjoncteurs fermés`, r.normal);
  check(`${w}px : manque de tension externe : LHA et LHB sur diesel, tableaux normaux perdus`, r.mdte);
  check(`${w}px : synoptique en manque de tension : zone en rouge, GMPP arrêtées`, r.syn);
  check(`${w}px : alarmes « manque de tension » et « diesel en service »`, r.alarm);
  check(`${w}px : on ne peut pas arrêter un diesel qui alimente son tableau`, r.refus);
  check(`${w}px : DUS démarré sur la voie restée hors tension`, r.dus);
  check(`${w}px : vue Électrique sans erreur JavaScript`, errs.length === 0, errs.slice(0, 2).join(' | '));
  await pg.close();
}
// Accident historique TMI : scénario à part, commandes et alarmes propres invisibles ailleurs.
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const pg = await browser.newPage({ viewport: { width: w, height: h } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(url);
  const r = await pg.evaluate(() => {
    const o = {}, q = x => document.querySelector(x), vis = x => !!q(x) && q(x).offsetParent !== null;
    store('about', 1); q('#about').hidden = true;
    launch('libre'); q('#goBtn').click(); A.paused = true; updateUI();
    o.cache = !document.body.classList.contains('tmi') && !vis('#c-porvi') && !vis('#c-asgv');
    launch('tmi'); o.brief = !!q('.seg[data-key="era"]'); q('#goBtn').click(); A.paused = true;
    const s = A.s, c = A.ctx; updateUI();
    o.visible = document.body.classList.contains('tmi') && s.era79;
    for (let i = 0; i < 300 / DT; i++) { step(s); evalAlarms(s); tick(s, c); }
    updateUI();
    o.soupape = s.porvStuck && s.porvOpen && s.Ppzr < 150;
    renderMission(true); const mb = q('#mis-body').textContent;
    o.chaine = /Chaîne des événements/.test(mb) && /turbopompes alimentaires/.test(mb) && /bloquée ouverte/.test(mb) && /indique « fermée »/.test(mb);
    o.visite = ['tmichaine', 'tmivoir', 'tmiapres'].every(k => TOUR.some(ch => ch.inset === k && ch.th === 'surete'));
    o.masque = q('#b-sat').textContent === '—' && /1979/.test(q('#s-sat').textContent);
    act('porvIsol'); act('asgV');
    for (let i = 0; i < 600 / DT; i++) { step(s); evalAlarms(s); tick(s, c); }
    o.isole = s.porvIsol;
    finish(); o.debrief = /TMI/.test(document.body.textContent) && /Vous/.test(document.body.textContent);
    launch('libre'); q('#goBtn').click(); A.paused = true; updateUI();
    o.retour = !document.body.classList.contains('tmi') && !A.s.era79 && !A.s.tmi;
    return o; });
  check(`${w}px : TMI : commandes propres à TMI cachées hors du scénario`, r.cache);
  check(`${w}px : TMI : choix « salle de 1979 / après TMI » au briefing`, r.brief);
  check(`${w}px : TMI : commandes propres affichées dans le scénario`, r.visible);
  check(`${w}px : TMI : la soupape reste bloquée ouverte et le primaire se dépressurise`, r.soupape);
  check(`${w}px : TMI : marge à la saturation masquée en salle de 1979`, r.masque);
  check(`${w}px : TMI : chaîne des événements et de leurs conséquences affichée en direct`, r.chaine);
  check(`${w}px : TMI : trois chapitres dans le thème Sûreté de la visite`, r.visite);
  check(`${w}px : TMI : isolement de la soupape`, r.isole);
  check(`${w}px : TMI : débriefing comparé à 1979`, r.debrief);
  check(`${w}px : TMI : retour au pilotage libre sans trace du scénario`, r.retour);
  check(`${w}px : TMI : aucune erreur JavaScript`, errs.length === 0, errs.slice(0, 2).join(' | '));
  await pg.close();
}
await browser.close();
console.log(fails ? `\n${fails} test(s) en échec` : '\nTous les tests passent');
process.exit(fails ? 1 : 0);
