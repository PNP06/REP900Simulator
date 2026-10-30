/* Interface : application, actions opérateur, synchronisation, mission, corrections, débriefing, menu, aide des cartes, bandeau. */
'use strict';
/* ================= Application ================= */
const A={mwin:1800,s:null,scn:null,ctx:null,speed:1,paused:true,acc:0,done:false,win:1800,charts:['pw','tp','pp','lv'],tab:'synop'};
{ const c=store('charts'); if(Array.isArray(c)&&c.length) A.charts=c; }

function newCtx(scn,s){
  const st={maxN:s.n,minTd:Infinity,tw:0,tT:0,tDI:0,tR:0,aar:null,isT:null,turbTrip:null,rLow:false,rVeryLow:false,rampViol:false,sebim:false};
  return {scn,st,acts:{},o:{},k:{},af:{minLsg:s.Lsg,maxLsg:s.Lsg,minPp:s.Ppzr,maxPp:s.Ppzr,minLp:s.Lpzr,maxLp:s.Lpzr},fired:null,fireAt:null,hint:false,step:0,sk:{},
    win:scn.win||(x=>x.coupled&&!x.tripped&&x.n>0.15),tol:scn.tol||1.5};
}
function launch(id){
  if(A.demo) demoStop();
  let scn=byId(id), mystery=false;
  if(id==='myst'){ const real=byId(ALEA_IDS[Math.floor(Math.random()*ALEA_IDS.length)]); scn=Object.assign({},real,{mystery:true,realTitle:real.title,realId:real.id,title:'Aléa mystère',id:'myst'}); mystery=true; }
  A.s=makeState(scn.init); A.trk={}; A.scn=scn; A.ctx=newCtx(scn,A.s); A.done=false; A.acc=0;
  const c=A.ctx;
  if(scn.kind==='alea') c.fireAt=A.s.t+(scn.id==='rodwd'?25+Math.random()*20:45+Math.random()*60);
  if(scn.kind==='libre'){ c.rnd=$('#rndAlea').checked; c.nextAlea=600+Math.random()*900; c.fires=[]; }
  if(scn.steps) enterStep(0);
  setSpeed(scn.speed||1);
  logEv(A.s,'auto','Prise de quart — '+(mystery?'aléa mystère':scn.title));
  buildAnn(); syncAll(); updateUI(); drawCharts();
  $('#menu').hidden=true; $('#debrief').hidden=true; $('#fb').hidden=true; $('#about').hidden=true; if(!$('#tour').hidden){ $('#tour').hidden=true; cancelAnimationFrame(tourRAF); clearTimeout(TV.tm); }
  showBrief();
}
function showBrief(){
  const scn=A.scn;
  let h='<h2>'+({tuto:'Tutoriel',lecon:'Leçon guidée',exo:'Exercice',alea:'Aléa',libre:'Pilotage libre'}[scn.kind])+'</h2><div class="t">'+scn.title+'</div>';
  h+=lvlSeg();
  if(isDeb()&&scn.e&&scn.id!=='myst') h+=ecBox(scn.e)+(scn.plan?planBox(scn,true):'');
  if(scn.kind==='alea') h+=INTRO_ALEA+(scn.id==='rodwd'?"<p>État : réacteur tout juste critique à puissance nulle (GI ≈ 10⁻⁸ A), turbine découplée, groupes en manuel. Restez à ×1.</p>":'');
  else if(scn.kind==='libre') h+="<p>Aucun objectif imposé : manœuvrez librement. "+(A.ctx.rnd?'Des aléas aléatoires surviendront pendant le pilotage. ':'')+"Le bouton <kbd>Terminer</kbd> affiche un bilan.</p>";
  else h+=scn.brief||'';
  if(scn.obj){ h+='<h3>Objectifs</h3><ul class="crit">'+scn.obj.map(o=>'<li><span class="i">○</span><span>'+o.t+(o.w?'<small>'+o.w+'</small>':'')+'</span></li>').join('')+'</ul>'; }
  if(scn.tips) h+='<p class="note" style="font-size:14px">'+scn.tips+'</p>';
  h+='<p class="note">Vitesse de départ : ×'+(scn.speed||1)+'. Modifiable à tout moment en haut de l\'écran.</p>';
  h+='<div class="row" style="margin-top:14px"><button class="btn pri" id="goBtn">Prendre le quart</button><button class="btn" id="backMenu">Retour au menu</button></div>';
  $('#briefBox').innerHTML=h; $('#brief').hidden=false; A.paused=true; glossDom($('#briefBox'));
  $('#goBtn').onclick=()=>{ $('#brief').hidden=true; A.paused=false; syncAll(); };
  $('#backMenu').onclick=()=>{ $('#brief').hidden=true; openMenu(); };
}

/* tutoriel */
function snapK(s,k){ Object.assign(k,{n0:s.n,T0:s.Tavg,Tr0:s.Tref,P0:s.Ppzr,Lp0:s.Lpzr,Lg0:s.Lsg,Cb0:s.Cb,R0:s.rods.R.p,G0:s.rods.G.p,DI0:s.DI,Td0:s.Td,rh0:Object.assign({},s.rho),vD0:s.volDil,vB0:s.volBor,ts:s.t,Psg0:s.Psg,OT0:s.OTsp,minLg:s.Lsg,maxLg:s.Lsg,minP:s.Ppzr,maxP:s.Ppzr,minLp:s.Lpzr}); }
function enterStep(i){ const c=A.ctx; c.step=i; c.sk={}; c.stepOk=false; c.after=''; c.showHint=false; c.subM=''; const st=A.scn.steps[i]; snapK(A.s,c.sk); if(st.enter) st.enter(A.s,c,c.sk); renderMission(true); if(desk()){ reveal($$('.focus').filter(e=>!e.closest('header.top'))); requestAnimationFrame(()=>{ const f=$$('#famb .focus,#views .focus').find(e=>!inView(e)); if(f&&!st.show) f.scrollIntoView({block:'nearest',behavior:'smooth'}); }); } if(st.show) requestAnimationFrame(()=>{ const e=$(st.show); if(!e||!e.offsetParent) return; const f=desk()&&[...e.querySelectorAll('.focus')].find(x=>!inView(x)); (f||e).scrollIntoView({block:f?'center':'nearest',behavior:'smooth'}); }); }

/* tick de scénario (chaque pas) */
function tick(s,c){
  const st=c.st, scn=c.scn;
  st.maxN=Math.max(st.maxN,s.n);
  if(!s.tripped&&s.n>1e-9&&s.n<0.5) st.minTd=Math.min(st.minTd,s.Td);
  if(c.win(s,c)){ st.tw+=DT; if(Math.abs(s.Tavg-s.Tref)<=c.tol) st.tT+=DT; if(Math.abs(s.DI+1.5*s.n)<=5) st.tDI+=DT; if(s.rods.R.p>=150&&s.rods.R.p<=220) st.tR+=DT; }
  if(!s.tripped&&s.coupled&&s.rods.R.p<150) st.rLow=true;
  if(!s.tripped&&s.coupled&&s.rods.R.p<130) st.rVeryLow=true;
  if(scn.kind!=='alea'||c.fired!=null){ const a=c.af; a.minLsg=Math.min(a.minLsg,s.Lsg); a.maxLsg=Math.max(a.maxLsg,s.Lsg); a.minPp=Math.min(a.minPp,s.Ppzr); a.maxPp=Math.max(a.maxPp,s.Ppzr); a.minLp=Math.min(a.minLp,s.Lpzr); a.maxLp=Math.max(a.maxLp,s.Lpzr); }
  if(scn.kind==='alea'&&c.fired==null&&s.t>=c.fireAt){ c.fired=s.t; const a=c.af; a.minLsg=a.maxLsg=s.Lsg; a.minPp=a.maxPp=s.Ppzr; a.minLp=a.maxLp=s.Lpzr; scn.fire(s,c); renderMission(true); }
  if(scn.kind==='libre'&&c.rnd&&!c.cur&&s.t>=c.nextAlea&&s.coupled&&!s.tripped&&s.n>0.4){
    const pool=['tpa','ilot','drop','spray','leak','are','dil'];
    const id=pool[Math.floor(Math.random()*pool.length)], sc=byId(id);
    c.cur=id; c.fires.push({t:s.t,title:sc.title}); sc.fire(s,c); c.nextAlea=s.t+1500+Math.random()*1800;
  }
  if(scn.kind==='libre'&&c.cur){ const sc=byId(c.cur); if(sc.update) sc.update(s,c); }
  else if(scn.update) scn.update(s,c);
  if(scn.obj) for(const o of scn.obj) if(c.o[o.id]==null&&o.test(s,c)){ c.o[o.id]=s.t; c.dirty=true; SFX.obj(); }
  if(scn.steps){ const stp=scn.steps[c.step], k=c.sk; k.minLg=Math.min(k.minLg,s.Lsg); k.maxLg=Math.max(k.maxLg,s.Lsg); k.minP=Math.min(k.minP,s.Ppzr); k.maxP=Math.max(k.maxP,s.Ppzr); k.minLp=Math.min(k.minLp,s.Lpzr); if(stp.ok&&!c.stepOk&&stp.ok(s,c,k)){ c.stepOk=true; c.dirty=true; SFX.step(); try{ c.after=stp.after?stp.after(s,c,k):''; }catch(e){ c.after=''; } } }
  if(scn.end&&!A.done&&scn.end.call(scn,s,c)){ A.done=true; setTimeout(finish,600); }
}

/* ================= Actions opérateur ================= */
let toastT=null;
function toast(m){ const t=$('#toast'); t.textContent=m; t.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>t.hidden=true,3200); }
function op(txt){ logEv(A.s,'op',txt); }
function act(a,v){
  const s=A.s; if(!s) return;
  const R=s.rods;
  switch(a){
  case 'modeR':
    if(v==='auto'){ if(s.tripped) return toast('AAR non réarmé.'); if(!s.coupled) return toast('Mode auto indisponible : la turbine est découplée (pas de Tref).'); if(s.rodWd){ op('Groupe R en automatique (sans effet)'); return toast('Le groupe R continue de s\'extraire.'); } s.modeR='auto'; op('Groupe R en automatique'); }
    else { s.modeR='man'; if(!s.rodWd) R.R.tg=R.R.p; op('Groupe R en manuel'); ctxAct('modeRman'); if(s.rodWd) toast('Le groupe R continue de s\'extraire malgré le passage en manuel.'); }
    break;
  case 'modeG':
    if(v==='auto'){ if(s.tripped) return toast('AAR non réarmé.'); if(!s.coupled) return toast('Mode auto indisponible : la turbine est découplée.'); s.modeG='auto'; op('GCP en automatique (calibrage)'); }
    else { s.modeG='man'; R.G.tg=R.G.p; op('GCP en manuel'); }
    break;
  case 'rodSel': s.rodSel=v; break;
  case 'rodStopB': { const bk=R[v]; if(bk){ bk.tg=bk.p; op({SD:'Groupes d\'arrêt',G:'GCP',R:'Groupe R'}[v]+' : arrêt du mouvement'); } break; }
  case 'gctaZero': s.gctaMan=0; op('GCT-a manuel fermé'); break;
  case 'rod': case 'rodIn': case 'rodOut': case 'rodStop': {
    const b=s.rodSel, bk=R[b], nm={SD:'Groupes d\'arrêt',G:'GCP',R:'Groupe R'}[b];
    if(s.tripped) return toast('AAR non réarmé : les grappes restent en bas.');
    if(b==='R'&&s.modeR==='auto') return toast('Passez le groupe R en manuel.');
    if(b==='G'&&s.modeG==='auto') return toast('Passez les GCP en manuel.');
    if(a==='rodStop'){ bk.tg=bk.p; op(nm+' : arrêt du mouvement'); break; }
    const base=Math.abs(bk.tg-bk.p)<0.5?Math.round(bk.p):bk.tg;
    const tg=a==='rodIn'?0:a==='rodOut'?225:clamp(base+(+v),0,225);
    if(tg>bk.p&&(s.n>1.03||s.dropped||s.dtMargin<3)) toast('Extraction bloquée (haut flux, chute de grappe ou marge ΔT).');
    bk.tg=tg; op(nm+' → '+Math.round(tg)+' pas');
    break; }
  case 'reaMode': s.rea.mode=v; if(s.rea.run){ s.rea.run=false; op('Appoint interrompu (changement de mode)'); } break;
  case 'reaQ': s.rea.q=+v; break;
  case 'reaV': s.rea.vt=v==='inf'?Infinity:+v; break;
  case 'reaStart':
    if(s.reaIsol) return toast('Appoint REA isolé : rétablissez-le d\'abord.');
    s.rea.v=0; s.rea.run=true; op((s.rea.mode==='dil'?'Dilution':'Borication')+' '+s.rea.q+' m³/h, '+(s.rea.vt===Infinity?'continu':fmt(s.rea.vt*1000,0)+' L'));
    break;
  case 'reaStop': if(s.rea.run){ s.rea.run=false; op('Arrêt de l\'appoint ('+fmt(s.rea.v*1000,0)+' L)'); } break;
  case 'reaIsol':
    if(!s.reaIsol){ s.reaIsol=true; s.rea.run=false; if(s.dilFault){ s.dilFault=false; } op('Isolement de l\'appoint REA'); ctxAct('reaIsol'); }
    else { s.reaIsol=false; op('Appoint REA rétabli'); }
    break;
  case 'ramp': s.ramp=+v; break;
  case 'ltStep': s.LtSet=clamp(Math.round(s.LtSet*100)/100+(+v)/100,0,1); op('Consigne de charge '+fmt(s.LtSet*100,0)+' %'); break;
  case 'hold': s.LtSet=s.Lt; op('Maintien de la charge à '+fmt(s.Lt*100,1)+' %'); break;
  case 'couple':
    if(s.coupled) return toast('Déjà couplé.');
    if(s.tripped) return toast('Réacteur arrêté.');
    if(!s.grid) return toast('Réseau indisponible.');
    if(s.n<0.06) return toast('Puissance insuffisante : 6 % PN minimum pour coupler.');
    s.coupled=true; s.turbTripped=false; s.Lt=0.05; s.LtSet=0.05; op('Couplage de l\'alternateur (charge 5 %)'); ctxAct('couple');
    break;
  case 'decouple':
    if(!s.coupled) return toast('Turbine déjà découplée.');
    if(s.ilot) return toast('En îlotage : la turbine alimente les auxiliaires.');
    if(s.Lt>0.06) return toast('Réduisez la charge sous 6 % avant de découpler.');
    s.coupled=false; s.Lt=0; s.LtSet=0; s.modeR='man'; s.modeG='man'; R.R.tg=R.R.p; R.G.tg=R.G.p; op('Découplage — groupes passés en manuel');
    break;
  case 'recouple':
    if(!s.ilot) return toast('Pas d\'îlotage en cours.');
    if(!s.grid) return toast('Réseau toujours indisponible.');
    s.ilot=false; s.LtSet=s.Lt; op('Recouplage au réseau'); ctxAct('recouple');
    break;
  case 'ttrip': if(!s.coupled) return toast('Turbine non couplée.'); op('Déclenchement manuel de la turbine'); turbineTrip(s,'manuel'); break;
  case 'apd': s.apd=!s.apd; op(s.apd?'Démarrage motopompe APD':'Arrêt motopompe APD'); if(s.apd) ctxAct('apd'); break;
  case 'areMode': if(v==='man'){ s.areMode='man'; s.areMan=Math.round(s.Wf*100)/100; op('ARE en manuel'); ctxAct('areMan'); } else { s.areMode='auto'; s.Iare=0; op('ARE en automatique'); } break;
  case 'asg': if(s.asg){ s.asg=false; op('Arrêt ASG'); } else { s.asg=true; op('Démarrage ASG'); } break;
  case 'heatMode': s.heatMode=v; op('Chaufferettes : '+{auto:'auto',on:'marche forcée',off:'arrêt'}[v]); break;
  case 'sprayMode': s.sprayMode=v; if(v==='man') s.sprayMan=0; op('Aspersion en '+(v==='auto'?'automatique':'manuel')); break;
  case 'sprayIsol': s.sprayIsol=!s.sprayIsol; op(s.sprayIsol?'Isolement de l\'aspersion':'Aspersion rétablie'); if(s.sprayIsol) ctxAct('sprayIsol'); break;
  case 'chgMode': s.chgMode=v; if(v==='man') s.chgMan=Math.round(s.Qc*2)/2; else s.Ic=0; op('Charge RCV en '+(v==='auto'?'automatique':'manuel')); break;
  case 'ldIsol': s.ldIsolMan=!s.ldIsolMan; op(s.ldIsolMan?'Isolement de la décharge RCV':'Décharge RCV rétablie'); if(s.ldIsolMan) ctxAct('ldIsol'); break;
  case 'aarWhy': aarOpen(); return;
  case 'aar': if(s.tripped) return toast('Réacteur déjà arrêté.'); trip(s,'AAR manuel','op'); break;
  case 'rearm': {
    if(!s.tripped) return toast('Pas d\'AAR à réarmer.');
    if(s.is) return toast('IS en service : arrêtez l\'IS d\'abord.');
    if(Object.values(R).some(b=>b.p>1)) return toast('Grappes en cours de chute.');
    const c=protCause(s); if(c) return toast('Signal présent : '+c);
    s.tripped=false; s.tripCause=''; op('Réarmement de l\'AAR'); ctxAct('rearm'); break; }
  case 'srInhib':
    if(s.srInhib) return toast('Gamme source déjà inhibée.');
    if(s.n<1e-7) return toast('P6 non atteint (GI < 10⁻¹⁰ A).');
    s.srInhib=true; op('Inhibition de la gamme source (P6)'); ctxAct('srInhib'); break;
  case 'lowBlk':
    if(s.lowBlk) return toast('Seuil bas déjà bloqué.');
    if(!s.p10) return toast('P10 non atteint (puissance < 10 %) : le seuil bas de 25 % doit rester actif.');
    s.lowBlk=true; op('Blocage du seuil bas de haut flux (P10)'); ctxAct('lowBlk'); break;
  case 'is': startIS(s,'op'); break;
  case 'isStop':
    if(!s.is) return toast('IS non en service.');
    if(!(s.Ppzr>140&&s.Lpzr>20&&s.satMargin>20)) return toast('Critères d\'arrêt IS non remplis : P > 140 bar, niveau pressu > 20 %, marge saturation > 20 °C.');
    s.is=false; op('Arrêt de l\'injection de sécurité'); break;
  }
  syncAll(); updateUI();
}

/* boutons à double appui */
function twoStep(btn,label,armed,fn){
  let t=null;
  btn.addEventListener('click',()=>{
    if(btn.classList.contains('armed')){ clearTimeout(t); btn.classList.remove('armed'); btn.textContent=label; fn(); }
    else { btn.classList.add('armed'); btn.textContent=armed; t=setTimeout(()=>{ btn.classList.remove('armed'); btn.textContent=label; },3000); }
  });
}
twoStep($('#aarBtn'),'AAR manuel','Confirmer l\'AAR',()=>act('aar'));
twoStep($('#isBtn'),'IS manuelle','Confirmer l\'IS',()=>act('is'));

document.addEventListener('keydown',e=>{ if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('g')){ e.preventDefault(); showGloss(+e.target.dataset.g); } if(e.key==='Escape'){ if(!$('#gpop').hidden) $('#gpop').hidden=true; else if(!$('#help').hidden) closeHelp(); else if(!$('#srcov').hidden) $('#srcov').hidden=true; else if(!$('#about').hidden) $('#about').hidden=true; } });
document.addEventListener('click',e=>{
  if(e.target.closest('button,.seg button,.bank')&&!e.target.closest('#ackBtn,#alb-ack,#runAck,#tour')) SFX.tick();
  if(e.target.closest('[data-about]')){ $('#about').hidden=false; return; }
  if(e.target.closest('[data-src]')){ $('#srcov').hidden=false; return; }
  if(e.target.closest('#srcClose')||e.target.id==='srcov'){ $('#srcov').hidden=true; return; }
  const fo=e.target.closest('[data-fbopen]'); if(fo){ openFB(fo.dataset.fbopen); return; }
  const ft=e.target.closest('[data-fbt]'); if(ft){ fbTab(ft.dataset.fbt); return; }
  const ff=e.target.closest('[data-fbf]'); if(ff){ FB.filter=ff.dataset.fbf; fbRender(); return; }
  const fc=e.target.closest('[data-fbc]'); if(fc){ fbComments(+fc.dataset.fbc); return; }
  if(e.target.id==='fb'){ closeFB(); return; }
  const tg=e.target.closest('[data-tourgo]'); if(tg){ openTour(+tg.dataset.tourgo); return; }
  const tv=e.target.closest('[data-tv]'); if(tv){ TV.auto=false; tourGo(+tv.dataset.tv); return; }
  const pt=e.target.closest('#ptr'); if(pt){ const el=pt._el; if(el){ reveal(el); requestAnimationFrame(()=>el.scrollIntoView({behavior:'smooth',block:'center'})); } return; }
  const gq=e.target.closest('.g'); if(gq){ showGloss(+gq.dataset.g); return; }
  if(!e.target.closest('#gpop')) $('#gpop').hidden=true;
  if(e.target.closest('#lexBtn')){ openLex(); return; }
  if(e.target.closest('#alb-see,#runTab')){ openCard('alarm'); return; }
  if(e.target.closest('#alb-ack,#runAck')){ ackAll(); return; }
  const vt=e.target.closest('#vtabs button'); if(vt){ setVue(vt.dataset.vue); return; }
  const ftb=e.target.closest('#ftabs button'); if(ftb){ setFam(ftb.dataset.fam); return; }
  const rd=e.target.closest('#band .rd'); if(rd){ const k=BAND_CARD[rd.id.slice(3)]; if(k) openCard(k); return; }
  const fb=e.target.closest('.fold'); if(fb){ toggleFold(fb.closest('.card')); return; }
  const h2c=e.target.closest('.card[data-c] > h2'); if(h2c&&!desk()&&!e.target.closest('button,.seg,input,select')){ toggleFold(h2c.parentElement); return; }
  const hq=e.target.closest('[data-help]'); if(hq){ openHelp(hq.dataset.help); return; }
  if(e.target.id==='help'){ closeHelp(); return; }
  const b=e.target.closest('[data-act]'); if(b&&!b.closest('.seg')){ act(b.dataset.act,b.dataset.v); return; }
  const sg=e.target.closest('.seg button');
  if(sg){ const key=sg.parentElement.dataset.key, v=sg.dataset.v;
    if(key==='speed') setSpeed(+v);
    else if(key==='win'){ A.win=+v; syncAll(); drawCharts(); }
    else if(key==='mwin'){ A.mwin=+v; syncAll(); drawCharts(); }
    else if(key==='ptz'){ A.ptZoom=v==='1'; syncAll(); drawPT(); }
    else if(key==='theme'){ themeApply(v); }
    else act(key,v);
    return; }
  const bank=e.target.closest('.bank'); if(bank){ act('rodSel',bank.dataset.bank); return; }
  const tab=e.target.closest('#tabs button'); if(tab){ setTab(tab.dataset.tab); return; }
});
function bindRange(id,fn){ $(id).addEventListener('input',e=>{ if(A.s){ fn(+e.target.value); updateUI(); } }); }
bindRange('#ltSet',v=>{ A.s.LtSet=v/100; });
$('#ltSet').addEventListener('change',()=>{ if(A.s) op('Consigne de charge '+fmt(A.s.LtSet*100,0)+' %'); });
bindRange('#gcta',v=>{ A.s.gctaMan=v/100; });
$('#gcta').addEventListener('change',()=>{ if(A.s) op('GCT-a manuel '+fmt(A.s.gctaMan*100,0)+' %'); });
bindRange('#areMan',v=>{ A.s.areMan=v/100; if(A.s.areMode!=='man') toast('Passez l\'ARE en manuel pour que ce réglage agisse.'); });
bindRange('#sprayMan',v=>{ A.s.sprayMan=v/100; if(A.s.sprayMode!=='man') toast('Passez l\'aspersion en manuel pour que ce réglage agisse.'); });
bindRange('#chgMan',v=>{ A.s.chgMan=v; if(A.s.chgMode!=='man') toast('Passez la charge RCV en manuel pour que ce réglage agisse.'); });
function ackAll(){ if(!A.s) return; SFX.ack(); for(const a of Object.values(A.s.alarms)) if(a.on) a.ack=true; updateAlarms(); updateRun(); }
$('#ackBtn').onclick=ackAll;
$('#pauseBtn').onclick=()=>{ if(!A.s) return; A.paused=!A.paused; syncAll(); };
$('#menuBtn').onclick=()=>openMenu();
$('#spdSel').addEventListener('change',e=>setSpeed(+e.target.value));
$('#mis-fold').onclick=()=>{ $('#mission').classList.toggle('collapsed'); const cl=$('#mission').classList.contains('collapsed'); $('#mis-fold').innerHTML=cl?'<span class="lg2">Déplier</span><span class="sh2">▾</span>':'<span class="lg2">Réduire</span><span class="sh2">▴</span>'; $('#mis-fold').setAttribute('aria-label',cl?'Déplier la consigne':'Réduire la consigne'); };
function setSpeed(v){ A.speed=v; syncAll(); }
function setTab(t){ A.tab=t; document.body.dataset.tab=t; $$('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===t)); if(t==='trend') setTimeout(drawCharts,30); if(t==='synop') setTimeout(drawDI,30); }

/* ================= Poste de pilotage (ordinateur) : vues au centre, commandes par famille ================= */
/* Sur ordinateur, chaque carte reste à sa place : une vue au centre (onglets du bas), une famille de commandes à droite (onglets du haut).
   Leçons, pointeur, corrections commentées et clics du bandeau ouvrent la vue ou la famille de la carte visée. */
const VUE_NM={synop:'Synoptique',crv:'Courbes',di:'ΔI',pt:'P-T',react:'Réactivité',instr:'Neutronique',trend:'Tendances',alarm:'Alarmes',log:'Journal'};
const FAMS={core:{t:'Réactivité',c:['rods','bore']},prim:{t:'Primaire',c:['pzr']},sec:{t:'Secondaire',c:['turb','are']},saf:{t:'Sûreté',c:['prot']}};
const FAM_OF={}; for(const [f,o] of Object.entries(FAMS)) for(const c of o.c) FAM_OF[c]=f;
const TAB_NM={synop:'Surveiller',cmd:'Agir',trend:'Tendances',alarm:'Suivre'};
A.vues=['synop']; A.fams=['core'];
const desk=()=>innerWidth>=1080, wide=()=>innerWidth>=1700;
const col3=c=>c==='alarm'||c==='log';
function setVue(v){ A.vues=[].concat(v); applyVues(); }
function applyVues(){
  let vs=A.vues.filter(v=>VUE_NM[v]&&!(wide()&&col3(v))); if(!vs.length) vs=['synop'];
  const on=new Set(vs); if(vs.length===1&&vs[0]==='synop'&&innerHeight>=1000) on.add('crv');
  $$('#views>.card,#col3>.card').forEach(c=>c.classList.toggle('von',on.has(c.dataset.c)));
  document.body.classList.toggle('c3v',vs.every(col3));
  $$('#vtabs button').forEach(b=>b.classList.toggle('on',vs.includes(b.dataset.vue)));
  setTimeout(()=>{ drawCharts(); drawDI(); drawPT(); },30);
}
function setFam(f){ A.fams=[].concat(f); $$('#famb>.card').forEach(c=>c.classList.toggle('fon',A.fams.includes(FAM_OF[c.dataset.c]))); $$('#ftabs button').forEach(b=>b.classList.toggle('on',A.fams.includes(b.dataset.fam))); }
/* place d'une carte : vue, famille ou onglet mobile */
const cardOf=e=>e&&e.closest('.card[data-c]');
const tabOf=e=>{ const c=e&&e.closest('.card[data-t]'); return c?c.dataset.t:null; };
function placeOf(e){ const c=cardOf(e); if(!c) return null; const k=c.dataset.c; return FAM_OF[k]?{fam:FAM_OF[k]}:VUE_NM[k]&&!(wide()&&col3(k))?{vue:k}:null; }
/* rend visibles les cartes qui contiennent ces éléments ; renvoie vrai si l'affichage a changé */
function reveal(els){
  els=[].concat(els).filter(Boolean); if(!els.length) return false;
  if(!desk()){ const t=tabOf(els[0]); if(t&&t!==A.tab){ setTab(t); return true; } return false; }
  const vs=[], fs=[];
  for(const e of els){ const p=placeOf(e); if(!p) continue; if(p.vue&&!vs.includes(p.vue)) vs.push(p.vue); if(p.fam&&!fs.includes(p.fam)) fs.push(p.fam); }
  let ch=false;
  if(vs.length&&!vs.every(v=>A.vues.includes(v))){ setVue(vs.slice(0,2)); ch=true; }
  if(fs.length&&!fs.every(f=>A.fams.includes(f))){ setFam(fs); ch=true; }
  return ch;
}
/* partie réellement visible d'un élément : fenêtre, sous la barre du haut (et la consigne sur téléphone), dans ses conteneurs qui défilent */
function clipOf(e){
  const tb=$('#tabs'); let top=e.closest('header.top')?0:$('header.top').getBoundingClientRect().bottom, bot=innerHeight-(tb&&getComputedStyle(tb).display!=='none'?tb.getBoundingClientRect().height:0);
  if(!desk()&&!$('#mission').hidden) top=Math.max(top,$('#mission').getBoundingClientRect().bottom);
  for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement){ const o=getComputedStyle(p).overflowY; if(o==='auto'||o==='scroll'||o==='hidden'){ const r=p.getBoundingClientRect(); top=Math.max(top,r.top); bot=Math.min(bot,r.bottom); } }
  return {top,bot};
}
function inView(e){ if(!e||!e.getClientRects().length) return false; const r=e.getBoundingClientRect(), c=clipOf(e); return r.bottom>c.top+4&&r.top<c.bot-4; }
/* clic sur une case du bandeau : ouvre la carte liée */
const BAND_CARD={pn:'instr',td:'react',rg:'rods',di:'di',cb:'bore',tm:'crv',th:'synop',pp:'pzr',lp:'pzr',pe:'turb',psg:'are',lg:'are',dtm:'prot',sat:'pt'};
function openCard(k){
  const cd=document.querySelector('.card[data-c="'+k+'"]'); if(!cd) return;
  if(desk()){ reveal(cd); requestAnimationFrame(()=>{ if(!inView(cd)) cd.scrollIntoView({block:'nearest',behavior:'smooth'}); }); }
  else { if(cd.classList.contains('folded')) toggleFold(cd); setTab(tabOf(cd)); requestAnimationFrame(()=>{ const r=cd.getBoundingClientRect(), off=$('header.top').offsetHeight+($('#mission').hidden?0:$('#mission').offsetHeight)+10; scrollTo({top:scrollY+r.top-off,behavior:'smooth'}); }); }
  cd.classList.remove('flash'); void cd.offsetWidth; cd.classList.add('flash'); setTimeout(()=>cd.classList.remove('flash'),1400);
}

/* ================= Synchronisation de l'interface ================= */
function syncSeg(key,val){ $$('.seg[data-key="'+key+'"] button').forEach(b=>b.classList.toggle('on',b.dataset.v===String(val))); }
function syncAll(){
  const s=A.s;
  syncSeg('speed',A.speed); syncSeg('win',A.win); syncSeg('mwin',A.mwin); syncSeg('ptz',A.ptZoom?'1':'0');
  $('#pauseBtn').innerHTML=A.paused?'▶<span class="lab"> Reprendre</span>':'❚❚<span class="lab"> Pause</span>'; $('#pauseBtn').setAttribute('aria-label',A.paused?'Reprendre':'Pause'); $('#pauseBtn').classList.toggle('on',A.paused); $('#spdSel').value=String(A.speed);
  if(!s) return;
  syncSeg('modeR',s.modeR); syncSeg('modeG',s.modeG);
  syncSeg('reaMode',s.rea.mode); syncSeg('reaQ',s.rea.q); syncSeg('reaV',s.rea.vt===Infinity?'inf':s.rea.vt);
  syncSeg('ramp',s.ramp); syncSeg('areMode',s.areMode); syncSeg('heatMode',s.heatMode); syncSeg('sprayMode',s.sprayMode); syncSeg('chgMode',s.chgMode);
  $$('.bank').forEach(b=>b.classList.toggle('sel',b.dataset.bank===s.rodSel));
  $('#c-sel').textContent={SD:'Groupes d\'arrêt',G:'GCP',R:'Groupe R'}[s.rodSel];
  $('#c-reaiso').textContent=s.reaIsol?'Rétablir l\'appoint REA':'Isoler l\'appoint REA';
  $('#c-spri').textContent=s.sprayIsol?'Rétablir aspersion':'Isoler aspersion';
  $('#c-ldi').textContent=s.ldIsolMan?'Rétablir décharge':'Isoler décharge';
  $('#c-apd').textContent=s.apd?'Arrêter APD':'Démarrer APD';
  $('#c-asgb').textContent=s.asg?'Arrêter ASG':'Démarrer ASG';
  const setR=(id,v,o,txt)=>{ const el=$(id); if(document.activeElement!==el) el.value=v; $(o).textContent=txt; };
  setR('#ltSet',Math.round(s.LtSet*100),'#ltSetO',fmt(s.LtSet*100,0)+' %');
  setR('#gcta',Math.round(s.gctaMan*100),'#gctaO',fmt(s.gctaMan*100,0)+' %');
  setR('#areMan',Math.round(s.areMan*100),'#areManO',fmt(s.areMan*100,0)+' %');
  setR('#sprayMan',Math.round(s.sprayMan*100),'#sprayManO',fmt(s.sprayMan*100,0)+' %');
  setR('#chgMan',s.chgMan,'#chgManO',fmt(s.chgMan,1)+' m³/h');
}
const T=(id,v)=>{ const e=document.getElementById(id); if(e&&e.textContent!==v) e.textContent=v; };
const H=(id,v)=>{ const e=document.getElementById(id); if(e&&e.innerHTML!==v) e.innerHTML=v; };
function lamp(id,st){ const e=document.getElementById(id); e.className='lamp'+(st?' '+st:''); }

const TRK=[['b-pn',s=>s.n*100,0.3],['b-pe',s=>s.Qt*K.MWE,3],['b-tm',s=>s.Tavg,0.15],['b-pp',s=>s.Ppzr,0.25],['b-lg',s=>s.Lsg,0.5],['b-lp',s=>s.Lpzr,0.5],['b-cb',s=>s.Cb,0.3],['b-rho',s=>s.rho.tot,3],
 ['c-lt',s=>s.Lt*100,0.3],['c-gct',s=>s.gct*100,1],['c-lsg',s=>s.Lsg,0.5],['c-wf',s=>s.Wf*100,1],['c-wst',s=>s.Wst*100,1],['c-psg',s=>s.Psg,0.2],['c-pp',s=>s.Ppzr,0.25],['c-lp',s=>s.Lpzr,0.5],['c-heat',s=>s.hEff*1440,25],['c-spr',s=>s.spray*100,2],['c-qc',s=>s.Qc,0.5],['c-cb',s=>s.Cb,0.3],['i-pr',s=>s.n*100,0.3],['i-sat',s=>s.satMargin,0.3]];
function trackVar(s){
  const now=performance.now(); if(!A.trk) A.trk={};
  for(const [id,f,thr] of TRK){
    const v=f(s); let o=A.trk[id]; if(!o) o=A.trk[id]={smp:[],lc:-1e9,dir:0};
    o.smp.push([s.t,v]); while(o.smp.length>2&&o.smp[1][0]<=s.t-10) o.smp.shift();
    const d=v-o.smp[0][1]; if(Math.abs(d)>=thr){ o.lc=now; o.dir=d>0?1:-1; }
    const on=now-o.lc<1500, e=document.getElementById(id); if(!e) continue;
    e.classList.toggle('up',on&&o.dir>0); e.classList.toggle('dn',on&&o.dir<0);
  }
}
function updateUI(){
  const s=A.s; if(!s) return;
  trackVar(s);
  T('clock',hms(s.t));
  const st=s.is?'IS':s.tripped?'AAR':s.ilot?'Îlotage':s.coupled?'Puissance':(s.n>1e-7?'Critique':'Sous-crit.');
  T('b-state',st); lamp('b-lamp',s.is||s.tripped?'r':s.ilot||s.limitNow?'a':'g');
  updateBand(s);
  /* synoptique */
  T('m-pn',(s.n<0.001?fmt(s.n*100,3):fmt(s.n*100,1))+' %');
  T('m-tavg','Tmoy '+fmt(s.Tavg,1)+' °C');
  document.getElementById('m-core').setAttribute('opacity',String(clamp(0.18+0.75*Math.min(1,s.Qcore),0.18,0.95)));
  const rod=(id,p)=>{ const h=6+70*(1-p/225); document.getElementById(id).setAttribute('height',h.toFixed(1)); };
  rod('m-rSD',s.rods.SD.p); rod('m-rG',s.rods.G.p); rod('m-rR',s.rods.R.p);
  T('m-pp',fmt(s.Ppzr,1)+' bar'); T('m-lp','Niv. '+fmt(s.Lpzr,0)+' %');
  T('m-hs','Asp. '+fmt(s.spray*100,0)+' %');
  const pz=clamp(s.Lpzr,0,100)/100*54; const pf=document.getElementById('m-pzf'); pf.setAttribute('y',(26+54-pz).toFixed(1)); pf.setAttribute('height',pz.toFixed(1));
  T('m-th','Tch '+fmt(s.Thot,1)); T('m-tc','Tfr '+fmt(s.Tcold,1));
  const np=s.pumps.filter(Boolean).length; T('m-pumpt','GMPP '+np+'/3');
  document.getElementById('m-pump').setAttribute('class','pump '+(np===3?'on':'off'));
  const sg=clamp(s.Lsg,0,100)/100*156; const sf=document.getElementById('m-sgf'); sf.setAttribute('y',(43+156-sg).toFixed(1)); sf.setAttribute('height',sg.toFixed(1));
  T('m-psg',fmt(s.Psg,1)+' bar'); T('m-lsg','Niv. '+fmt(s.Lsg,0)+' %');
  document.getElementById('m-asg').style.fill=s.asg?'var(--warn)':'var(--dim)';
  T('m-mwe',s.coupled?fmt(s.Qt*K.MWE,0)+' MWe':(s.turbTripped?'Déclenchée':'Découplée'));
  document.getElementById('m-brk').setAttribute('class','brk'+(s.coupled&&!s.ilot?' on':''));
  T('m-grid',s.grid?'Réseau':'Réseau ✕'); document.getElementById('m-grid').style.fill=s.grid?'var(--mute)':'var(--crit)';
  document.getElementById('m-gctv').setAttribute('class','valve'+(s.gct>0.02?' open':''));
  T('m-gct','GCT-c '+fmt(s.gct/0.85*100,0)+' %');
  T('m-feed','ARE '+fmt(s.Wf*100,0)+' %'+(s.Wasg>0.005?' · ASG '+fmt(s.Wasg*100,0)+' %':''));
  document.getElementById('m-tpa').setAttribute('class','pump '+(s.tpa[0]&&s.tpa[1]?'on':(s.tpa[0]||s.tpa[1]?'':'off')));
  /* instrumentation */
  H('i-sr',s.srInhib?'<span style="color:var(--dim)">HT coupée</span>':fmt(s.n*1e10,0)+' c/s');
  H('i-ir',sci(Math.max(s.n*1e-3,1e-11))+' A');
  T('i-pr',s.n<0.005?'< 0,5 %':fmt(s.n*100,1)+' %');
  T('i-td',Number.isFinite(s.Td)&&s.Td<99999?fmt(s.Td,0)+' s':(s.rate<-1e-4?'décroissance':'stable'));
  T('i-dt',fmt(s.DTp,0)+' % · marge '+fmt(s.dtMargin,1));
  T('i-sat',fmt(s.satMargin,1)+' °C');
  T('i-dh',fmt(s.Qdh*100,2)+' %');
  /* réactivité */
  const rp=s.rho, scale=8000;
  const rb=(id,v)=>{ const e=document.getElementById(id); const w=clamp(Math.abs(v)/scale,0,1)*50; e.style.left=(v<0?50-w:50)+'%'; e.style.width=w+'%'; e.style.background=v<0?'var(--cold)':'var(--hot)'; };
  for(const k of ['rods','bore','mod','dop','xe','exc']){ T('r-'+k,sgn(rp[k],0)); rb('rb-'+k,rp[k]); }
  T('r-am','(α '+fmt(rp.am,1)+' pcm/°C)');
  T('r-tot',sgn(rp.tot,0)+' pcm'+(rp.tot<-500?' · marge d\'arrêt '+fmt(-rp.tot,0):''));
  /* commandes */
  for(const [b,id] of [['SD','sd'],['G','g'],['R','r']]){ const p=s.rods[b].p; T('c-'+id,fmt(p,0)+(Math.abs(s.rods[b].tg-p)>0.4?(s.rods[b].tg>p?' ▲':' ▼'):'')); document.getElementById('cb-'+id).style.width=(p/225*100)+'%'; }
  T('c-rodmsg',s.tripped?'AAR : grappes en bas, réarmement nécessaire.':(s.n>1.03||s.dropped||s.dtMargin<3)?'Extraction bloquée.':(!s.coupled&&(s.modeR==='auto'||s.modeG==='auto'))?'Auto inactif : turbine découplée.':'');
  T('c-cb',fmt(s.Cb,0)+' ppm');
  T('c-rea',s.reaIsol?'Isolé':(s.Qdil+s.Qbor>0?(s.Qdil>0?'Dil. ':'Bor. ')+fmt(s.Qdil+s.Qbor,0)+' m³/h':'Arrêt')+(s.rea.run?' · '+fmt(s.rea.v*1000,0)+' L':''));
  T('c-tst',s.ilot?'Îlotée':s.coupled?'Couplée':s.turbTripped?'Déclenchée':'Découplée');
  T('c-lt',fmt(s.Lt*100,1)+' %'); T('c-lts',fmt(s.LtSet*100,0)+' %');
  T('c-gct',fmt(s.gct/0.85*100,0)+' % '+(s.coupled?'T':'P'));
  T('c-lsg',fmt(s.Lsg,1)+' %'); T('c-wf',fmt(s.Wf*100,0)+' %'); T('c-wst',fmt(s.Wst*100,0)+' %'); T('c-psg',fmt(s.Psg,1)+' bar');
  lamp('l-tpa1',s.tpa[0]?'g':'r'); lamp('l-tpa2',s.tpa[1]?'g':'r'); lamp('l-apd',s.apd?'g':''); lamp('l-asg',s.asg?'a':'');
  T('c-wasg',s.asg?fmt(s.Wasg*100,1)+' %':'');
  T('c-pp',fmt(s.Ppzr,1)+' bar'); T('c-lp',fmt(s.Lpzr,0)+' / '+fmt(s.Lref,0)+' %');
  T('c-heat',fmt(s.hEff*1440,0)+' kW'); T('c-spr',fmt(s.spray*100,0)+' %');
  T('c-qc',fmt(s.Qc,1)+' m³/h'); T('c-qld',s.Qld>0?fmt(s.Qld,1)+' m³/h':'Isolée'); T('c-sebim',s.sebim?'Ouverte':'Fermée');
  s.pumps.forEach((p,i)=>lamp('l-p'+(i+1),p?'g':'r'));
  lamp('l-is',s.is?'r':''); lamp('l-sr',s.srInhib?'':'g'); T('c-srst',s.srInhib?'Gamme source inhibée':'Gamme source en service'); T('c-lbst',s.lowBlk?'Seuil bas 25 % bloqué':'Seuil bas 25 % actif'); lamp('l-lb',s.lowBlk?'':'g');
  T('c-trip',s.tripped?'AAR — '+s.tripCause:(s.limits.size?'Limites dépassées : '+[...s.limits].join(' ; '):'Réacteur non arrêté.'));
  updateAlarms(); renderMission(false);
}

function buildAnn(){ $('#ann').innerHTML=ALM.map(([id,lab,sev])=>'<div class="an '+sev+'" id="an-'+id+'">'+lab+'</div>').join(''); A.logN=-1; }
function updateAlarms(){
  const s=A.s; if(!s) return;
  evalAlarms(s);
  let nack=0;
  for(const [id,,sev] of ALM){ const a=s.alarms[id], e=document.getElementById('an-'+id); if(!e) continue; const on=a&&a.on; e.className='an '+sev+(on?' on':'')+(on&&!a.ack?' nack':''); if(on&&!a.ack) nack++; }
  const bd=$('#badge'); bd.hidden=nack===0; bd.textContent=nack;
  const rk={r:0,a:1,i:2}, act=ALM.filter(([id])=>s.alarms[id]&&s.alarms[id].on).map(([id,lab,sev])=>({lab,sev,ack:s.alarms[id].ack,t:s.alarms[id].since}));
  const show=act.filter(x=>x.sev!=='i'||!x.ack).sort((a,b)=>rk[a.sev]-rk[b.sev]||b.t-a.t);
  const ab=$('#alb');
  if(!show.length){ ab.hidden=true; }
  else{ ab.hidden=false; const w=show[0].sev; ab.className='alb '+w+(show.some(x=>!x.ack)?' nack':''); lamp('alb-l',w==='i'?'g':w); T('alb-n',show.length+(show.length>1?' alarmes':' alarme')); T('alb-t',show.slice(0,3).map(x=>x.lab).join(' · ')+(show.length>3?' …':'')); }
  if(A.logN!==s.log.length){ A.logN=s.log.length; const L=s.log.slice(-120).reverse(); $('#log').innerHTML=L.map(l=>'<div><span class="tm">'+hms(l.t)+'</span><span class="'+l.type+'">'+l.txt+'</span></div>').join(''); }
}

/* ================= Mission ================= */
function curInfo(scn,c,s){ if(scn.steps){ const st=scn.steps[c.step]; const f=st.info||scn.info; return f?f(s,c,c.sk):null; } return scn.info?scn.info(s,c):null; }
function renderMission(force){
  const s=A.s,c=A.ctx,scn=A.scn; if(!s||!c) return;
  if(A.demo){ if(!force&&A.demo.v===A.demo.rv){ const il=document.getElementById('mis-info'); const iv=curInfo(scn,c,s); if(il&&iv!=null) il.innerHTML=iv; return; } A.demo.rv=A.demo.v; $$('.focus').forEach(e=>e.classList.remove('focus','focus-sm')); A.ptrT=[]; demoMission(); return; }
  if(!force&&scn.steps){ const stp=scn.steps[c.step]; if(stp.sub&&!c.stepOk){ const m=stp.sub.map(x=>{ try{ return x[1](s,c,c.sk)?1:0; }catch(e){ return 0; } }).join(''); if(m!==c.subM){ c.subM=m; c.dirty=true; } } }
  if(!force&&scn.kind==='exo'&&COACH[scn.id]){ const t=(COACH[scn.id].find(x=>{ try{ return x[0](s,c); }catch(e){ return false; } })||[])[1]||''; if(t!==c.coach){ c.coach=t; c.dirty=true; } }
  if(!force&&!c.dirty&&!c.liveInfo&&c.lastFire===c.fired){ /* only refresh live info line */ const il=document.getElementById('mis-info'); const iv=curInfo(scn,c,s); if(il&&iv!=null) il.innerHTML=iv; return; }
  c.dirty=false; c.lastFire=c.fired;
  const tagTxt={tuto:'Tutoriel',lecon:'Leçon',exo:'Exercice',alea:'Aléa',libre:'Libre'}[scn.kind];
  T('mis-tag',tagTxt);
  let title=scn.title, body='', foot='';
  if(scn.steps){
    const stp=scn.steps[c.step], inf=curInfo(scn,c,s);
    title=(c.step+1)+' / '+scn.steps.length+' · '+stp.t;
    const sub=stp.sub&&!c.stepOk?'<ul class="subl">'+stp.sub.map(x=>{ let d=false; try{ d=x[1](s,c,c.sk); }catch(e){} return '<li class="'+(d?'done':'')+'">'+x[0]+'</li>'; }).join('')+'</ul>':'';
    const okb=c.stepOk?'<div class="aft"><div class="stepok">✓ Étape réalisée</div>'+(c.after?'<p>'+c.after+'</p>':'')+'</div>':'';
    const hb=stp.hint&&!c.stepOk?(c.showHint?'<div class="hintb"><b>Comment faire :</b> '+stp.hint+'</div>':''):'';
    body=(isDeb()&&stp.e?ecBox(stp.e):'')+stp.h+sub+hb+(inf!=null?'<div class="info" id="mis-info">'+inf+'</div>':'')+okb;
    foot='<div class="prog"><i style="width:'+((c.step+1)/scn.steps.length*100)+'%"></i></div>';
    if(stp.tab&&innerWidth<1080&&A.tab!==stp.tab) foot+='<button class="btn sm" id="tTab">Ouvrir '+({synop:'Surveiller',cmd:'Agir',trend:'Tendances',alarm:'Suivre'}[stp.tab])+'</button>';
    if(stp.hint&&!c.stepOk&&!c.showHint) foot+='<button class="btn sm" id="tHint"><span class="lg2">Comment faire ?</span><span class="sh2">Aide</span></button>';
    if(c.step>0) foot+='<button class="btn sm" id="tPrev" aria-label="Précédent"><span class="lg2">Précédent</span><span class="sh2">‹</span></button>';
    foot+=stp.last?'<button class="btn pri" id="tEnd">Terminer '+(scn.kind==='tuto'?'le tutoriel':'la leçon')+'</button>':'<button class="btn pri" id="tNext"'+(stp.ok&&!c.stepOk&&!stp.opt?' disabled':'')+'>Suivant ›</button>';
  } else if(scn.kind==='exo'){
    body=(isDeb()?planBox(scn,c.planOpen!==false):'')+'<ul class="obj">'+scn.obj.map(o=>'<li class="'+(c.o[o.id]!=null?'done':'')+'"><span>'+o.t+(o.w&&c.o[o.id]==null?'<small class="why">'+o.w+'</small>':'')+'</span></li>').join('')+'</ul>'+(scn.info?'<div class="info" id="mis-info">'+scn.info(s,c)+'</div>':'');
    if(c.coach) body+='<div class="coach"><b>Formateur :</b> '+c.coach+'</div>';
    foot='<button class="btn" id="mEnd">Terminer et débriefer</button>';
  } else if(scn.kind==='alea'){
    if(c.fired==null) body=(isDeb()&&scn.e&&!scn.mystery?ecBox(scn.e):'')+'<p>Fonctionnement normal. Surveillez la tranche : un aléa va survenir.</p>';
    else body='<p><b>Aléa en cours.</b> Identifiez-le, mettez la tranche en sécurité puis stabilisez.</p><p>Méthode : dans le journal, repérez la <b>première</b> alarme apparue, souvent la cause ; dans le bandeau, regardez quels paramètres varient (en gras, avec une flèche) et vers quel seuil ils vont ; puis cherchez quel équipement l\'explique.</p>'+(c.hintLv?'<div class="hintb">'+[...(scn.hints||[]),scn.hint].slice(0,c.hintLv).map((t,i)=>'<b>'+['Symptôme','Système en cause','Action'][i]+' :</b> '+t).join('<br>')+'</div>':'');
    foot=(c.fired!=null&&(c.hintLv||0)<3?'<button class="btn" id="mHint">'+['Indice : symptôme','Indice : système','Indice : action (−1 étoile)'][c.hintLv||0]+'</button>':'')+'<button class="btn" id="mEnd">Terminer et débriefer</button>';
  } else {
    body='<p>Pilotage libre'+(c.rnd?', aléas aléatoires activés':'')+'. Toutes les commandes sont disponibles.</p>';
    foot='<button class="btn" id="mEnd">Terminer</button>';
  }
  if(scn.kind!=='libre') foot='<button class="btn sm lvb'+(isDeb()?' on':'')+'" id="tLvl" title="Niveau des explications : Débutant ajoute une explication simple au-dessus du texte technique" aria-label="Explications '+(isDeb()?'débutant':'confirmé')+'"><span class="lg2">'+(isDeb()?'Débutant':'Confirmé')+'</span><span class="sh2">'+(isDeb()?'Déb.':'Conf.')+'</span></button>'+foot;
  T('mis-title',title); $('#mis-body').innerHTML=body; glossDom($('#mis-body')); $('#mis-foot').innerHTML=foot;
  const pd=$('#mis-body details.plan'); if(pd) pd.addEventListener('toggle',()=>{ c.planOpen=pd.open; });
  $$('.focus').forEach(e=>e.classList.remove('focus','focus-sm')); A.ptrT=[];
  if(scn.steps&&!c.stepOk){ const fs=scn.steps[c.step].f||[]; fs.forEach(q=>$$(q).forEach(e=>e.classList.add('focus'))); applyFocus(); } else document.body.classList.remove('bandfocus');
  const on=(id,f)=>{ const e=document.getElementById(id); if(e) e.onclick=f; };
  on('tNext',()=>{ if(c.step<scn.steps.length-1) enterStep(c.step+1); });
  on('tPrev',()=>enterStep(c.step-1));
  on('tHint',()=>{ c.showHint=true; renderMission(true); });
  on('tTab',()=>{ setTab(scn.steps[c.step].tab); renderMission(true); });
  on('tEnd',()=>finish());
  on('tLvl',()=>lvlSet(isDeb()?'exp':'deb'));
  on('mEnd',()=>finish());
  on('mHint',()=>{ c.hintLv=(c.hintLv||0)+1; c.hint=c.hintLv>=3; renderMission(true); });
}

/* ================= Corrections commentées (pilotage automatique) ================= */
const DA={
 look:(sel,ptr)=>({k:'look',sel,ptr}),
 btn:(a,v,n)=>({k:'click',sel:'[data-act="'+a+'"]'+(v!=null?'[data-v="'+v+'"]':''),n:n||1}),
 seg:(key,v)=>({k:'click',sel:'.seg[data-key="'+key+'"] button[data-v="'+v+'"]'}),
 range:(sel,v)=>({k:'range',sel,v}),
 speed:v=>({k:'click',sel:'.spdseg button[data-v="'+v+'"]',ptr:'#spdSel'}),
 bank:b=>({k:'click',sel:'.bank[data-bank="'+b+'"]'}),
 aar:()=>({k:'click',sel:'#aarBtn',n:2}),
 ack:()=>({k:'click',sel:'#alb-ack',ptr:'[data-c="alarm"] #ackBtn'}),
 bore:(m,q,v)=>[DA.seg('reaMode',m),DA.seg('reaQ',q),DA.seg('reaV',v),DA.btn('reaStart')]
};
const fd=d=>(s,c)=>c.fired!=null&&s.t-c.fired>=d;
const stableFor=(sec,tol)=>(s,c,k)=>{ if(Math.abs(s.rate)<(tol||0.0015)) k.st=(k.st||0)+DT; else k.st=0; return k.st>=sec; };
const reaIdle=s=>!s.rea.run;
const DM={
 tpa:{speed:1,intro:"À pleine puissance, une turbopompe alimentaire va déclencher. Regardez comment on la repère et pourquoi on baisse aussitôt la charge.",steps:[
  {w:fd(4),t:"Repérer l'aléa",why:"Le niveau des GV baisse et l'alarme d'écart de débit apparaît. Dans la carte Eau alimentaire, le voyant de la TPA B est éteint : il n'entre plus que 58 % du débit d'eau nécessaire.",a:[DA.look('#rd-lg'),DA.look('#l-tpa2'),DA.ack()]},
  {t:'Démarrer la motopompe APD',why:"Elle apporte un débit d'eau de secours. Seule, elle ne suffit pas à pleine puissance.",a:[DA.btn('apd')]},
  {t:'Baisser vite la charge vers 55 %',why:"Moins de vapeur demandée, c'est moins d'eau nécessaire. On vise sous la capacité restante, à la vitesse maximale de 30 %/min : chaque seconde compte.",a:[DA.seg('ramp','30'),DA.range('#ltSet',55)]},
  {w:s=>s.Lt<0.57,t:'Surveiller le niveau GV',why:"La baisse de charge provoque d'abord une contraction : le niveau descend encore un peu, puis remonte quand le débit d'eau redevient supérieur au débit vapeur.",a:[DA.look('#rd-lg')]},
  {w:(s,c)=>s.t-c.fired>140&&s.Lsg>35,t:'Situation stabilisée : accélérer',why:"Le niveau remonte vers 50 %, les groupes ont suivi la baisse en automatique. On accélère le temps pour la suite.",a:[DA.speed(10)]}]},
 ilot:{speed:1,intro:"Le réseau électrique va disparaître. Regardez la tranche se caler sur ses propres besoins, puis le recouplage.",steps:[
  {w:fd(3),t:"Comprendre : c'est un îlotage",why:"La charge turbine tombe vers 5 % sans demande et le GCT-c s'ouvre : le réseau a disparu, la turbine n'alimente plus que la centrale.",a:[DA.look('#c-tst'),DA.look('#c-gct'),DA.ack()]},
  {w:fd(25),t:'Vérifier les automatismes',why:"Les GCP et R s'insèrent pour réduire la puissance, l'excès de vapeur part au condenseur. On ne contrarie pas les automatismes : on vérifie qu'ils font leur travail.",a:[DA.look('[data-bank="G"]'),DA.look('#rd-pp'),DA.look('#rd-tm')]},
  {w:fd(60),t:'Laisser la régulation recaler la température',why:"R s'est enfoncé très bas pour compenser le défaut de puissance libéré par la baisse. Le xénon va maintenant s'accumuler et R remontera de lui-même : on ne bore pas, on surveille.",a:[DA.look('[data-bank="R"]'),DA.speed(5)]},
  {w:s=>s.Tavg-s.Tref<-1.2,t:'Tmoy passe sous Tref : on laisse faire',why:"Pendant le transitoire, les grappes se sont enfoncées plus que nécessaire et la puissance nucléaire est passée sous la charge. La régulation ressort R d'elle-même ; on surveille sans intervenir.",a:[DA.look('#rd-tm'),DA.look('[data-bank="R"]')]},
  {w:s=>s.grid,t:'Recoupler au réseau',why:"Le réseau est revenu. On recouple ; la charge reste d'abord à son niveau et Tmoy reste sur Tref.",a:[DA.btn('recouple'),DA.speed(2)]}]},
 drop:{speed:5,intro:"Une grappe va tomber dans le cœur à pleine puissance. Regardez pourquoi on fige les grappes et on agit sur la turbine.",steps:[
  {w:fd(3),t:'Repérer la chute de grappe',why:"Alarme rouge « Chute de grappe », puissance qui baisse d'un coup, Tmoy sous Tref. Le bilan de réactivité montre −280 pcm sur la ligne Grappes.",a:[DA.look('#alb'),DA.look('#rd-tm'),DA.ack()]},
  {t:'Passer les GCP en manuel',why:"L'extraction est bloquée : R ne peut pas compenser. En automatique, les GCP s'enfonceraient encore à chaque baisse de charge, et Tmoy resterait sous Tref. On les fige.",a:[DA.seg('modeG','man')]},
  {t:'Baisser la charge vers 80 % pour recaler Tmoy',why:"Moins de vapeur demandée : Tref baisse et le primaire se réchauffe un peu. L'écart Tmoy − Tref se referme d'environ 0,6 °C par % de charge.",a:[DA.seg('ramp','5'),DA.range('#ltSet',80)]},
  {w:s=>Math.abs(s.Tavg-s.Tref)<0.8,t:'Tmoy recalée : replier sous 50 %',why:"Une grappe tombée déséquilibre la puissance entre les quarts du cœur. On descend sous 50 % le temps du diagnostic ; R, en automatique, s'insère pour tenir la température.",a:[DA.range('#ltSet',45)]},
  {w:s=>s.n<0.5,t:'Repli atteint',why:"La tranche est sous 50 %, Tmoy sur Tref. On peut maintenant diagnostiquer et récupérer la grappe.",a:[DA.look('#rd-pn'),DA.look('#rd-tm')]}]},
 spray:{speed:1,intro:"Une vanne d'aspersion du pressuriseur va rester bloquée ouverte. Regardez comment on remonte du symptôme à la cause.",steps:[
  {w:fd(12),t:'Repérer',why:"La pression baisse régulièrement, environ 7 bar par minute, alors que les chaufferettes sont à fond.",a:[DA.look('#rd-pp'),DA.look('#c-heat'),DA.ack()]},
  {t:"Trouver l'origine",why:"L'aspersion est ouverte à 100 % malgré une pression basse : c'est elle qui condense la vapeur plus vite que les chaufferettes ne la produisent.",a:[DA.look('#c-spr')]},
  {t:"Isoler l'aspersion",why:"Fermer la vanne d'isolement de la ligne supprime la cause, avant que la protection n'arrête le réacteur.",a:[DA.btn('sprayIsol')]},
  {w:(s,c)=>s.t-c.acts.sprayIsol>20,t:'Surveiller la remontée',why:"Les chaufferettes remontent la pression vers 155 bar, environ 2 bar par minute.",a:[DA.look('#rd-pp'),DA.speed(5)]}]},
 leak:{speed:2,intro:"Une fuite va apparaître sur la ligne de décharge du RCV. Regardez comment le pressuriseur trahit une perte d'eau.",steps:[
  {w:fd(40),t:'Repérer',why:"Le niveau du pressuriseur baisse sans variation de température, et le débit de charge monte pour compenser : le primaire perd de l'eau.",a:[DA.look('#rd-lp'),DA.look('#c-qc'),DA.ack()]},
  {t:'Localiser la fuite',why:"La charge augmente mais la décharge reste à son débit habituel : l'eau se perd entre les deux, sur la ligne de décharge.",a:[DA.look('#c-qld')]},
  {t:'Isoler la décharge',why:"La fuite est en aval des vannes d'isolement : les fermer arrête la perte. La régulation de charge réduit ensuite son débit.",a:[DA.btn('ldIsol')]},
  {w:(s,c)=>s.t-c.acts.ldIsol>30,t:'Vérifier le retour à la normale',why:"Le niveau du pressuriseur se stabilise puis rejoint sa référence.",a:[DA.look('#rd-lp'),DA.speed(5)]}]},
 are:{speed:1,intro:"La régulation d'eau alimentaire va s'ouvrir en grand. Regardez comment on reprend la main.",steps:[
  {w:s=>s.Lsg>56,t:'Repérer',why:"Le niveau GV dépasse 55 % et continue de monter, sans changement de charge.",a:[DA.look('#rd-lg'),DA.ack()]},
  {t:'Comparer les débits',why:"Le débit d'eau alimentaire dépasse nettement le débit vapeur : la régulation ARE a ouvert en grand.",a:[DA.look('#c-wf'),DA.look('#c-wst')]},
  {t:"Reprendre l'ARE en manuel, débit réduit",why:"On fixe soi-même un débit inférieur au débit vapeur pour faire redescendre le niveau, loin du seuil très haut de 80 %.",a:[DA.seg('areMode','man'),DA.range('#areMan',85)]},
  {w:s=>s.Lsg<52,t:'Égaliser les débits',why:"Le niveau est revenu vers 50 % : on règle un débit égal au débit vapeur pour le stabiliser.",a:[DA.range('#areMan',100),DA.speed(5)]}]},
 dil:{speed:5,intro:"Une vanne d'eau d'appoint va s'ouvrir sans demande. C'est discret : regardez quel indice la trahit.",steps:[
  {w:(s,c)=>c.fired!=null&&s.rods.R.p<175,t:'Repérer',why:"Le groupe R descend lentement alors que la charge ne bouge pas : quelque chose ajoute de la réactivité.",a:[DA.look('[data-bank="R"]'),DA.look('#rd-cb')]},
  {t:"Trouver l'origine",why:"Le bore baisse et l'appoint REA est en service sans qu'on l'ait demandé : c'est une dilution intempestive.",a:[DA.look('#c-rea')]},
  {t:"Isoler l'appoint",why:"On coupe la ligne d'eau pure : la dilution s'arrête.",a:[DA.btn('reaIsol')]},
  {t:'Borer pour remonter R',why:"La vanne défaillante est isolée ; on remet l'appoint en service pour borer et reprendre la réactivité ajoutée. R remonte dans sa bande.",a:[DA.btn('reaIsol'),...DA.bore('bor','10','1')]},
  {w:(s,c)=>s.rods.R.p>=170,t:'R revenu dans sa bande',why:"R est revenu au-dessus de 170 pas : la régulation a de nouveau de la marge dans les deux sens.",a:[DA.look('[data-bank="R"]')]}]},
 rodwd:{speed:1,intro:"Juste après la divergence, le groupe R va s'extraire tout seul. Regardez pourquoi la seule bonne réponse est l'arrêt immédiat.",steps:[
  {w:(s,c)=>c.fired!=null&&s.Td<90,t:'Repérer',why:"Le temps de doublement raccourcit alors que personne ne touche aux grappes : R s'extrait seul.",a:[DA.look('#rd-td'),DA.look('[data-bank="R"]')]},
  {w:s=>s.Td<40,t:'AAR manuel immédiat',why:"Passer en manuel ne l'arrête pas, et à puissance nulle le combustible froid ne freinera pas la montée. On arrête le réacteur tout de suite, bien avant 25 %.",a:[DA.aar()]},
  {w:s=>s.tripped,t:"Vérifier l'arrêt",why:"Toutes les grappes sont en bas, la puissance décroît : l'excursion est stoppée.",a:[DA.look('[data-bank="R"]'),DA.ack()]}]},
 gmpp:{speed:2,intro:"Une pompe primaire va déclencher à pleine puissance. L'arrêt est automatique : regardez ce que l'opérateur vérifie ensuite.",steps:[
  {w:fd(2),t:"Lire la cause de l'arrêt",why:"Le journal indique « Bas débit primaire » : la pompe primaire 2 s'est arrêtée, la protection a arrêté le réacteur.",a:[DA.look('#l-p2'),DA.look('[data-c="log"]'),DA.ack()]},
  {t:"Vérifier l'arrêt",why:"Toutes les grappes sont en bas et la puissance décroît.",a:[DA.look('[data-bank="G"]'),DA.look('#rd-pn')]},
  {t:"Vérifier l'évacuation de la chaleur",why:"La turbine est déclenchée, l'ASG alimente les GV et le GCT-c tient 70 bar : la puissance résiduelle part au condenseur.",a:[DA.look('#l-asg'),DA.look('#c-gct'),DA.speed(5)]},
  {w:s=>Math.abs(s.Tavg-287)<3&&s.Lsg>35&&s.Lsg<65&&s.Ppzr>150&&s.Ppzr<158&&!protCause(s),t:"Réarmer l'arrêt automatique",why:"La tranche est stable et plus aucun signal d'arrêt n'est présent : on réarme. Les grappes restent en bas jusqu'à une nouvelle divergence.",a:[DA.btn('rearm')]}]},
 div:{speed:5,intro:"Démarrage depuis l'arrêt à chaud. Regardez l'approche par paliers, la prédiction avec 1/M, puis la stabilisation.",steps:[
  {t:'Lire la situation',why:"Réacteur sous-critique, R inséré, comptage gamme source stable. La position critique estimée est de 170 pas ± 25.",a:[DA.look('#mis-info'),DA.bank('R')]},
  {t:'Premier palier : R à 100 pas',why:"Loin de la criticité, on avance par grands paliers.",a:[DA.btn('rod','10',10)]},
  {w:stableFor(20),t:'Lire 1/M',why:"Le comptage s'est stabilisé : 1/M vaut environ 0,57. On est encore loin.",a:[DA.look('#mis-info')]},
  {t:'Deuxième palier : R à 140 pas',why:"On continue, mais plus prudemment.",a:[DA.btn('rod','10',4)]},
  {w:stableFor(20),t:'Prédire la cote critique',why:"1/M vaut environ 0,2. Entre 100 et 140 pas, il a perdu 0,37 : il reste une vingtaine de pas. Estimation : vers 160 pas.",a:[DA.look('#mis-info')]},
  {t:'Troisième palier : R à 160 pas',why:"On s'arrête avant la cote prédite.",a:[DA.btn('rod','10',2)]},
  {w:stableFor(20,0.0012),t:'Approche finale',why:"Près de la criticité, la stabilisation devient lente. On avance maintenant de 2 pas à la fois, en attendant chaque fois.",a:[DA.look('#rd-td')]},
  {ctl:{every:45,until:s=>s.Td<300&&s.n>2e-8,f:s=>s.Td>300?{t:'+2 pas',why:"Le comptage finit par se stabiliser : on avance encore de 2 pas.",a:[DA.btn('rod','1',2)]}:null},t:'Approche par pas de 2'},
  {t:'Le réacteur est critique',why:"Un temps de doublement constant apparaît : la réaction s'entretient seule. On n'extrait plus.",a:[DA.look('#rd-td')]},
  {w:s=>s.n>1e-7,t:'Inhiber la gamme source à P6',why:"Les compteurs de démarrage vont saturer : à l'alarme P6, on les inhibe, sinon ils arrêteraient le réacteur.",a:[DA.btn('srInhib')]},
  {ctl:{every:25,until:()=>false,f:s=>{ const lo=Math.LN2/900, td=s.rate>0?Math.LN2/s.rate:1e9;
    if(s.n<0.006){ if(td>120) return {t:'+1 pas',why:"Puissance encore faible et montée trop lente : on accélère un peu.",a:[DA.btn('rod','1')]}; if(td<50) return {t:'−1 pas',why:"La montée devient trop rapide : on ralentit.",a:[DA.btn('rod','-1')]}; return null; }
    if(s.n>0.025&&s.rate>-lo) return {t:'−1 pas',why:"On approche de 3 % : on freine d'un pas.",a:[DA.btn('rod','-1')]};
    if(s.n<0.012&&s.rate<lo) return {t:'+1 pas',why:"Le Doppler a freiné la montée trop tôt : un pas de plus.",a:[DA.btn('rod','1')]};
    if(s.n>=0.012&&s.n<=0.025){ if(s.rate>Math.LN2/400) return {t:'−1 pas',why:"Encore un peu trop vite : un pas en arrière.",a:[DA.btn('rod','-1')]}; if(s.rate<-Math.LN2/400) return {t:'+1 pas',why:"Elle redescend : un pas en avant.",a:[DA.btn('rod','1')]}; }
    return null; }},t:'Stabiliser entre 1 et 3 %'}]},
 montee:{speed:5,intro:"Couplage puis montée de 12 à 100 %. Regardez le rôle de chacun : turbine pour la charge, automatismes pour les grappes, opérateur pour le bore.",steps:[
  {t:"Coupler l'alternateur",why:"Le réacteur est à 12 % et la vapeur part au condenseur. On raccorde l'alternateur au réseau ; il prend 5 % de charge.",a:[DA.btn('couple')]},
  {t:'Monter la charge vers 14 %, à 3 %/min',why:"On aligne d'abord la turbine sur la puissance du réacteur (environ 13 %), à la vitesse maximale autorisée.",a:[DA.seg('ramp','3'),DA.range('#ltSet',14)]},
  {w:s=>s.Lt>=0.135,t:'GCP en automatique et borication de 1 m³',why:"Les GCP rejoignent leur position de calibrage pour cette charge. À ce bore, ils apportent environ 200 pcm de trop : on lance aussitôt une borication de 1 m³ qui les compense. R reste en manuel pour ne pas plonger ; le GCT-c évacue l'excédent de vapeur en attendant.",a:[DA.seg('modeG','auto'),...DA.bore('bor','20','1')]},
  {w:(s,c,k)=>{ if(!s.rea.run&&Math.abs(s.Tavg-s.Tref)<0.6) k.t=(k.t||0)+DT; else k.t=0; return k.t>30; },t:'R en automatique',why:"Tmoy est stable sur Tref : on confie R à la régulation sans à-coup. Les deux groupes sont en automatique : c'est le mode G.",a:[DA.seg('modeR','auto')]},
  {w:reaIdle,t:'Consigne 100 %',why:"La turbine monte à 3 %/min ; les GCP s'extraient avec la charge, R affine la température.",a:[DA.range('#ltSet',100)]},
  {ctl:{every:30,until:()=>false,f:s=>{ if(s.p10&&!s.lowBlk) return {t:'Rebloquer le seuil bas (P10)',why:"Au passage en automatique, la puissance est brièvement repassée sous 10 % : le blocage du seuil bas de 25 % s'est levé tout seul. On le rebloque, sinon l'arrêt automatique tomberait à 25 %.",a:[DA.btn('lowBlk')]}; if(s.rea.run) return null; if(s.rods.R.p<165) return {t:'Borication de 100 L',why:"R descend vers sa limite basse : un peu de bore le fait remonter.",a:DA.bore('bor','10','0.1')}; if(s.rods.R.p>205) return {t:'Dilution de 100 L',why:"R sort trop haut : un peu d'eau pure le fait redescendre.",a:DA.bore('dil','10','0.1')}; return null; }},t:'Suivre R pendant la montée'}]},
 suivi:{speed:60,intro:"Baisse à 50 %, palier de 2 heures, retour à 100 %. Regardez surtout les appoints : c'est le xénon qu'on compense.",steps:[
  {t:'Baisser à 50 %, à 5 %/min',why:"Le dispatching demande une baisse : on règle la vitesse puis la consigne, les automatismes suivent.",a:[DA.seg('ramp','5'),DA.range('#ltSet',50)]},
  {ctl:{every:60,until:(s,c)=>c.o.hold!=null,f:s=>{ if(s.rea.run) return null; const d=s.Tavg-s.Tref;
    if(s.rods.R.p>198||d<-0.8) return {t:'Dilution de 300 L à 30 m³/h',why:"Le xénon s'accumule et freine le réacteur : R remonte. On dilue tôt et franchement pour le garder dans sa bande.",a:DA.bore('dil','30','0.3')};
    if(s.rods.R.p<165||d>0.8) return {t:'Borication de 100 L',why:"R est descendu un peu bas : on reprend un peu de réactivité.",a:DA.bore('bor','10','0.1')}; return null; }},t:'Compenser le xénon pendant le palier'},
  {t:'Remonter à 100 %',why:"Le palier de 2 heures est tenu. On remonte ; le flux va maintenant brûler le xénon.",a:[DA.range('#ltSet',100)]},
  {ctl:{every:60,until:()=>false,f:s=>{ if(s.rea.run) return null; const d=s.Tavg-s.Tref;
    if(s.rods.R.p<165||d>0.8) return {t:'Borication de 100 L',why:"Le xénon brûle et libère de la réactivité : R s'enfonce. On bore.",a:DA.bore('bor','10','0.1')};
    if(s.rods.R.p>198||d<-0.8) return {t:'Dilution de 300 L',why:"R remonte trop : on dilue un peu.",a:DA.bore('dil','30','0.3')}; return null; }},t:'Suivre R pendant la remontée'}]},
 arret:{speed:5,intro:"Mise à l'arrêt à chaud depuis 30 %. Regardez l'ordre des opérations et le rôle du bore.",steps:[
  {t:'Baisser la charge à 5 %',why:"On ramène la turbine à son minimum avant de la séparer du réseau.",a:[DA.seg('ramp','5'),DA.range('#ltSet',5)]},
  {w:s=>s.Lt<=0.055,t:'Découpler',why:"La turbine est au minimum : on la sépare du réseau, la vapeur repart au condenseur et les groupes passent en manuel.",a:[DA.btn('decouple')]},
  {t:'Insérer les GCP',why:"On commence à retirer de la réactivité avec les grappes de commande.",a:[DA.bank('G'),DA.btn('rodIn')]},
  {w:s=>s.rods.G.p<5,t:'Insérer le groupe R',why:"Le réacteur devient sous-critique : la puissance décroît avec une période d'environ −80 s.",a:[DA.bank('R'),DA.btn('rodIn')]},
  {w:s=>s.n<0.001,t:"Borer jusqu'à la marge d'arrêt",why:"Les grappes ont arrêté la réaction ; le bore garantit qu'elle le restera. On bore en continu à 30 m³/h.",a:DA.bore('bor','30','inf')},
  {w:s=>-s.rho.tot>=3100,t:"Arrêter l'appoint",why:"La marge d'arrêt dépasse 3 000 pcm : le réacteur restera arrêté.",a:[DA.btn('reaStop')]},
  {t:'Vérifier la stabilisation',why:"Le GCT-c tient 70 bar dans les GV, Tmoy se stabilise vers 286 °C : c'est l'arrêt à chaud.",a:[DA.look('#rd-tm')]}]}
};
const DEMO_IDS=Object.keys(DM);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function demoStart(id,fast){
  launch(id); $('#brief').hidden=true;
  const sc=A.scn, c=A.ctx;
  A.demo={id,i:0,busy:false,k:{},done:[],cur:null,fast:!!fast,lastCtl:-1e9,v:1,rv:0};
  if(sc.kind==='alea') c.fireAt=A.s.t+15;
  document.body.classList.add('demo'); A.demoHold=false;
  setSpeed(DM[id].speed||sc.speed||1); A.paused=!!fast; syncAll(); renderMission(true);
  logEv(A.s,'auto','Correction commentée — pilotage automatique');
}
function demoStop(){ A.demo=null; A.demoHold=false; document.body.classList.remove('demo'); $('#dptr').hidden=true; $$('.dhl').forEach(e=>e.classList.remove('dhl')); }
function demoTick(){
  const d=A.demo; if(!d||d.busy||A.done) return;
  const s=A.s,c=A.ctx, st=DM[d.id].steps[d.i]; if(!st) return;
  if(st.ctl){
    if(st.ctl.until(s,c,d.k)){ d.done.push(st.t); d.i++; d.k={}; d.v++; return; }
    if(s.t-d.lastCtl>=st.ctl.every){ d.lastCtl=s.t; const r=st.ctl.f(s,c,d.k); if(r) demoDo(r.a,r.t,r.why,false); }
    return; }
  let ok=false; try{ ok=!st.w||st.w(s,c,d.k); }catch(e){ ok=false; }
  if(ok) demoDo(st.a||[],st.t,st.why,true);
}
function demoDo(acts,t,why,adv){
  const d=A.demo; d.busy=true; d.cur={t,why,tm:A.s.t}; d.v++;
  const fin=()=>{ if(A.demo!==d) return; if(!d.fast) $('#dptr').hidden=true; if(adv){ d.done.push(t); d.i++; d.k={}; } else d.done.push(t); d.cur=null; d.busy=false; A.demoHold=false; d.v++; renderMission(true); };
  if(d.fast){ acts.forEach(a=>demoExec(a)); fin(); return; }
  A.demoHold=true; renderMission(true);
  (async()=>{ await wait(700); for(const a of acts){ if(A.demo!==d) return; await demoAct(a); } await wait(500); fin(); })();
}
function demoExec(a){ const el=$(a.sel); if(!el) return; if(a.k==='click'){ for(let i=0;i<(a.n||1);i++) el.click(); } else if(a.k==='range'){ el.value=a.v; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); } }
async function demoAct(a){
  const el=$(a.sel); if(!el) return;
  const vis=e=>e&&e.getClientRects().length>0;
  let tg=vis(el)?el:(a.ptr&&vis($(a.ptr))?$(a.ptr):el);
  if(!vis(tg)){ const alt=a.ptr&&$(a.ptr); if(reveal(el)){ await wait(250); tg=el; } else if(alt&&reveal(alt)){ await wait(250); tg=alt; } }
  const fc=!desk()&&tg.closest('.card.folded'); if(fc){ toggleFold(fc); await wait(250); }
  if(!tg.closest('header.top')&&!tg.closest('#mission')){ const r=tg.getBoundingClientRect(), c=clipOf(tg); if(r.top<c.top+6||r.bottom>Math.min(c.bot,innerHeight-60)){ tg.scrollIntoView({behavior:'smooth',block:'center'}); await wait(650); } }
  const p=$('#dptr'), r=tg.getBoundingClientRect(); p.hidden=false; p.classList.remove('press');
  p.style.left=(r.left+r.width/2)+'px'; p.style.top=(r.top+r.height/2)+'px';
  tg.classList.add('dhl'); await wait(750);
  if(a.k==='look'){ await wait(1300); }
  else { for(let i=0;i<(a.n||1);i++){ p.classList.add('press'); if(a.k==='click') el.click(); else demoExec(a); await wait(a.n>2?220:380); p.classList.remove('press'); await wait(a.n>2?60:120); } }
  await wait(250); tg.classList.remove('dhl');
}
function demoMission(){
  const d=A.demo, s=A.s, c=A.ctx, scn=A.scn, D=DM[d.id], st=D.steps[d.i];
  T('mis-tag','Correction'); T('mis-title',scn.title+' — correction commentée');
  const inf=curInfo(scn,c,s);
  let b='<p class="dintro">'+D.intro+'</p>';
  if(d.done.length) b+='<ul class="dsteps">'+d.done.slice(-4).map(t=>'<li class="done">'+t+'</li>').join('')+'</ul>';
  if(d.cur) b+=ecBox('<b>'+d.cur.t+'.</b> '+d.cur.why,'En cours');
  else if(st) b+='<div class="dwait">'+(st.ctl?'<b>'+st.t+'</b> : le pilote surveille et corrige au besoin.':scn.kind==='alea'&&c.fired==null?'Fonctionnement normal : l\'aléa va survenir.':'Prochaine action : <b>'+st.t+'</b>')+'</div>';
  else b+='<div class="dwait">Toutes les actions sont faites : on laisse la tranche se stabiliser jusqu\'au débriefing.</div>';
  if(inf!=null) b+='<div class="info" id="mis-info">'+inf+'</div>';
  $('#mis-body').innerHTML=b; glossDom($('#mis-body'));
  $('#mis-foot').innerHTML='<button class="btn sm" id="dRetry"><span class="lg2">Essayer moi-même</span><span class="sh2">Essayer</span></button><button class="btn sm" id="dQuit">Quitter</button>';
  $('#dRetry').onclick=()=>{ const id=d.id; demoStop(); launch(id); };
  $('#dQuit').onclick=()=>{ demoStop(); openMenu(); };
}

/* ================= Débriefing ================= */
function finish(){
  const s=A.s,c=A.ctx,scn=A.scn; if(!s) return;
  const wasDemo=!!A.demo; if(wasDemo) demoStop();
  A.paused=true; A.done=true; syncAll();
  let h='', stars=null;
  const realTitle=scn.mystery?scn.realTitle:scn.title;
  if(scn.steps){
    const fin=c.step>=scn.steps.length-1, tu=scn.kind==='tuto';
    if(fin){ const d=store('done')||{}; d[scn.id]=1; store('done',d); }
    h='<h2>'+(tu?'Tutoriel':'Leçon guidée')+'</h2><div class="t">'+scn.title+(fin?' — terminé':' — interrompu')+'</div><p>Étapes parcourues : '+(c.step+1)+' / '+scn.steps.length+'.</p>'+(tu?'<p>Suite conseillée : les <b>leçons guidées</b> (cinétique, contre-réactions, ΔI, xénon…), puis l\'exercice <b>Divergence</b>.</p>':'<p>Les « ? » de chaque carte résument les notions de cette leçon.</p>');
  } else if(scn.kind==='libre'){
    h='<h2>Pilotage libre</h2><div class="t">Bilan du quart</div><p>Durée simulée : '+dur(s.t)+'.</p>';
    if(c.fires&&c.fires.length) h+='<h3>Aléas survenus</h3><ul>'+c.fires.map(f=>'<li>'+hms(f.t)+' — '+f.title+'</li>').join('')+'</ul>';
    h+=statsHTML(s,c);
  } else {
    if(scn.kind==='alea'&&c.fired==null){ h='<h2>Aléa</h2><div class="t">Quart interrompu</div><p>L\'aléa n\'était pas encore survenu.</p>'; }
    else{
      const cr=scn.evaluate.call(scn,s,c);
      const okN=cr.filter(x=>x.ok).length;
      stars=Math.round(okN/cr.length*3); if(c.hint&&stars>0) stars--; setTimeout(()=>{ if(stars===3) SFX.done(); else if(stars>0) SFX.obj(); },250);
      h='<h2>'+(wasDemo?'Correction commentée':'Débriefing')+(scn.mystery?' · aléa mystère':'')+'</h2><div class="t">'+realTitle+'</div>';
      if(wasDemo) h+='<p class="note">Résultat obtenu par le pilote automatique en appliquant la conduite attendue. À vous de jouer : « Essayer moi-même ».</p>';
      h+='<div class="bigstars" aria-label="'+stars+' sur 3">'+'★'.repeat(stars)+'<span style="color:var(--dim)">'+'★'.repeat(3-stars)+'</span></div>';
      h+='<p class="note">'+okN+' critère(s) sur '+cr.length+(c.hintLv?' · indices consultés : '+c.hintLv+' / 3'+(c.hint?' (le dernier retire une étoile)':''):'')+'</p>';
      h+='<ul class="crit">'+cr.map(x=>'<li class="'+(x.ok?'ok':'ko')+'"><span class="i">'+(x.ok?'✓':'✕')+'</span><span>'+x.t+(x.d?'<small>'+x.d+'</small>':'')+'</span></li>').join('')+'</ul>';
      if(c.st.aar) h+='<p>AAR '+(c.st.aar.src==='op'?'manuel':'automatique')+' à '+hms(c.st.aar.t)+' — '+c.st.aar.cause+'.</p>';
      if(isDeb()&&scn.d) h+=ecBox(scn.d,'En clair : ce qu\'il fallait comprendre');
      h+='<h3>Conduite attendue</h3><p>'+scn.expected+'</p>';
      h+=statsHTML(s,c);
      if(!wasDemo){ const best=store('best')||{}; const key=scn.mystery?'myst':scn.id; if(best[key]==null||stars>best[key]){ best[key]=stars; store('best',best); } }
    }
  }
  if(s.aars&&s.aars.length) h+='<div class="row" style="margin-top:10px"><button class="btn" id="dAar">Pourquoi l\'AAR ?</button>'+(s.aars.length>1?'<small style="color:var(--mute)">'+s.aars.length+' AAR pendant la séance</small>':'')+'</div>';
  const ops=s.log.filter(l=>l.type==='op').slice(-14);
  if(ops.length) h+='<h3>'+(wasDemo?'Actions du pilote automatique':'Vos dernières actions')+'</h3><div class="log" style="max-height:200px">'+ops.map(l=>'<div><span class="tm">'+hms(l.t)+'</span><span class="op">'+l.txt+'</span></div>').join('')+'</div>';
  const demoId=scn.realId||scn.id;
  h+='<div class="row" style="margin-top:16px"><button class="btn pri" id="dRe">'+(wasDemo?'Essayer moi-même':'Rejouer')+'</button>'+(DM[demoId]&&!scn.steps?'<button class="btn" id="dDemo">'+(wasDemo?'Revoir la correction':'Voir la correction')+'</button>':'')+'<button class="btn" data-fbopen="new">Signaler un problème</button><button class="btn" id="dCont">Continuer en libre</button><button class="btn" id="dMenu">Menu</button></div>';
  $('#debriefBox').innerHTML=h; $('#debrief').hidden=false; glossDom($('#debriefBox'));
  $('#dRe').onclick=()=>launch(wasDemo?demoId:(scn.mystery?'myst':scn.id));
  const dd=$('#dDemo'); if(dd) dd.onclick=()=>demoStart(demoId);
  $('#dMenu').onclick=()=>openMenu();
  const da=$('#dAar'); if(da) da.onclick=()=>aarOpen(0);
  $('#dCont').onclick=()=>{ A.scn=Object.assign({},byId('libre')); A.ctx=newCtx(A.scn,s); A.ctx.rnd=false; A.ctx.fires=[]; A.done=false; $('#debrief').hidden=true; A.paused=false; renderMission(true); syncAll(); };
}
function statsHTML(s,c){
  const a=c.af;
  return '<h3>Valeurs extrêmes</h3><table class="kv"><tr><td>Puissance max.</td><td class="v">'+fmt(c.st.maxN*100,1)+' % PN</td></tr><tr><td>Pression pressu</td><td class="v">'+fmt(a.minPp,1)+' – '+fmt(a.maxPp,1)+' bar</td></tr><tr><td>Niveau pressu</td><td class="v">'+fmt(a.minLp,0)+' – '+fmt(a.maxLp,0)+' %</td></tr><tr><td>Niveau GV</td><td class="v">'+fmt(a.minLsg,0)+' – '+fmt(a.maxLsg,0)+' %</td></tr></table>';
}

/* ================= Menu ================= */
function openMenu(){
  A.paused=true; syncAll();
  const best=store('best')||{}, done=store('done')||{};
  const card=x=>'<button class="sc" data-scn="'+x.id+'"><span class="t">'+x.title+'</span><span class="d">'+x.desc+'</span><span class="m"><span>'+(x.kind==='lecon'?'Leçon · '+(x.speed>=60?'longue (×300)':'15 à 25 min'):x.diff?'Difficulté '+'●'.repeat(x.diff)+'○'.repeat(3-x.diff):'Sans évaluation')+'</span>'+(done[x.id]?'<span class="done-tag">✓ terminé</span>':'')+(best[x.id]!=null?'<span class="stars">'+'★'.repeat(best[x.id])+'☆'.repeat(3-best[x.id])+'</span>':'')+'</span></button>';
  const grp=(t,f)=>'<div class="sec">'+t+'</div><div class="cards">'+SCN.filter(f).map(card).join('')+'</div>';
  $('#menuCards').innerHTML=(A.s&&!A.done?'<div class="row" style="margin-bottom:6px"><button class="btn pri" id="resume">Reprendre le quart en cours</button></div>':'')+'<div class="sec">Apprendre</div><div class="cards"><button class="sc tourc" data-tourgo="0"><span class="t">Découvrir la centrale <span class="reco">Pour commencer</span></span><span class="d">Visite illustrée, sans manipulation : fission, réaction en chaîne, circuits, pilotage, xénon, sûreté.</span><span class="m"><span>37 chapitres en 7 thèmes · 40 à 50 min</span>'+(done.tour?'<span class="done-tag">✓ vu</span>':'')+'</span></button>'+SCN.filter(x=>x.kind==='tuto').map(card).join('')+'</div>'+grp('Comprendre — leçons guidées',x=>x.kind==='lecon')+grp("S'entraîner",x=>x.kind==='exo')+grp('Gérer un aléa',x=>x.kind==='alea')+'<div class="sec">Corrections commentées</div><p class="note" style="margin:0 0 8px">Le pilote automatique joue l\'exercice ou l\'aléa devant vous, clique au bon endroit et explique chaque action.</p><div class="cards">'+DEMO_IDS.map(id=>{ const x=byId(id); return '<button class="sc dmc" data-demo="'+id+'"><span class="t">▶ '+x.title+'</span><span class="d">'+(x.kind==='exo'?'Exercice':'Aléa')+' corrigé pas à pas</span></button>'; }).join('')+'</div>'+grp('Pilotage libre',x=>x.kind==='libre');
  $('#menu').hidden=false; $('#debrief').hidden=true; $('#brief').hidden=true;
  const r=$('#resume'); if(r) r.onclick=()=>{ $('#menu').hidden=true; A.paused=false; syncAll(); };
}
$('#menuCards').addEventListener('click',e=>{ const dm=e.target.closest('[data-demo]'); if(dm){ demoStart(dm.dataset.demo); return; } const b=e.target.closest('[data-scn]'); if(b) launch(b.dataset.scn); });
{ const r=store('rnd'); if(r) $('#rndAlea').checked=true; $('#rndAlea').addEventListener('change',e=>store('rnd',e.target.checked)); }

/* ================= Aide des cartes ================= */
const HELP={
 synop:{t:'Synoptique',l:'tuto',h:`<h3>En bref</h3><p>C'est le plan de la centrale, en direct. Deux circuits d'eau ne se mélangent jamais : le <b>primaire</b>, qui traverse le cœur et sort à plus de 300 °C, et le <b>secondaire</b>, qui reçoit sa chaleur dans les générateurs de vapeur et fait tourner la turbine. Une comparaison utile : le primaire est le radiateur, le secondaire la casserole posée dessus.</p>
<h3>Ce que vous voyez</h3><ul><li><b>Cuve</b> : le cœur (sa couleur s'intensifie avec la puissance) et trois barres blanches, les groupes d'arrêt, les GCP et le groupe R. Plus une barre est longue, plus le groupe est inséré.</li><li><b>Branche chaude</b> en orange (Tch, sortie du cœur) et <b>branche froide</b> en bleu (Tfr, retour vers le cœur). Les trois boucles réelles sont regroupées en une.</li><li><b>Pressuriseur</b> : pression, niveau, aspersion. <b>GV</b> : niveau et pression vapeur.</li><li><b>Turbine</b> et alternateur ; le petit carré vert est le disjoncteur (vert = couplé au réseau).</li><li><b>GCT-c</b> : la vanne qui envoie la vapeur au condenseur sans passer par la turbine. <b>ARE</b> : l'eau alimentaire (en vert) qui retourne aux GV.</li></ul>
<h3>Pourquoi c'est important</h3><p>Toute la conduite consiste à équilibrer ce que produit le cœur et ce que consomme le secondaire. Si la turbine prend plus de vapeur que le cœur ne fournit, le primaire se refroidit ; dans le cas inverse, il chauffe. Le synoptique permet de voir où se situe le déséquilibre.</p>
<h3>Ordres de grandeur</h3><ul><li>Échauffement de l'eau dans le cœur : environ 37 °C à pleine puissance (286 → 323 °C).</li><li>Débit primaire : ~ 22 000 m³/h par boucle, soit environ 18 m³ par seconde pour les trois boucles : une piscine olympique toutes les 2 à 3 minutes.</li><li>Rendement : 2 785 MW de chaleur pour ~ 905 MW électriques.</li></ul>`},
 instr:{t:'Instrumentation neutronique',l:'l-cin',h:`<h3>En bref</h3><p>On ne mesure pas directement la puissance d'un réacteur : on compte les neutrons qui s'échappent de la cuve. Entre le réacteur arrêté et la pleine puissance, ce flux varie d'un facteur mille milliards. Aucun détecteur ne couvre une telle plage, d'où trois familles qui se relaient, comme les calibres d'un multimètre.</p>
<h3>Ce que vous voyez</h3><ul><li><b>Gamme source</b> (GS) : compteurs d'impulsions, de 1 à 10⁶ coups par seconde. Utilisée à l'arrêt et pendant la divergence ; coupée au-dessus de P6 car elle saturerait.</li><li><b>Gamme intermédiaire</b> (GI) : chambres d'ionisation en courant, de 10⁻¹¹ à 10⁻³ A.</li><li><b>Gamme puissance</b> (GP) : chambres longues à deux sections (haute et basse), de 0 à 120 % PN. Elles fournissent aussi le ΔI.</li><li><b>Temps de doublement</b> : durée pour que la puissance double au rythme actuel. « Stable » : puissance constante ; « décroissance » : elle baisse.</li><li><b>ΔT / marge protection</b> : la puissance thermique mesurée par l'échauffement de l'eau, et la distance au seuil d'AAR.</li><li><b>Marge à la saturation</b> et <b>puissance résiduelle</b>.</li></ul>
<h3>Pourquoi c'est important</h3><p>Le temps de doublement est le premier indicateur de sûreté lors d'une divergence : il dit à quelle vitesse la puissance évolue, avant même qu'elle ne soit élevée. La marge à la saturation dit si l'eau du cœur est loin de bouillir.</p>
<h3>Ordres de grandeur</h3><ul><li>Td de 45 s ≈ +100 pcm ; Td de 60 s ≈ +75 pcm ; Td sous 20 s (≈ +200 pcm) : alarme, on ralentit.</li><li>Puissance résiduelle : ~ 6,5 % juste après l'arrêt, 1 à 2 % au bout d'une heure, encore ~ 0,5 % après un jour.</li><li>Marge à la saturation normale : ~ 22 °C à 155 bar et 100 %.</li></ul>
<h3>Pièges fréquents</h3><ul><li>Juste après un mouvement de grappes, le temps de doublement affiché est faussé par le saut prompt : attendez quelques secondes avant de le lire.</li><li>Oublier d'inhiber la gamme source pendant une divergence provoque un AAR.</li></ul>`},
 react:{t:'Bilan de réactivité',l:'l-fb',h:`<h3>En bref</h3><p>Un réacteur est une population de neutrons. Chaque génération peut être un peu plus nombreuse que la précédente (la puissance monte), un peu moins nombreuse (elle baisse) ou exactement égale (elle reste stable). La <b>réactivité</b> mesure cet écart. C'est un compte en banque : chaque élément du cœur ajoute ou retire des pcm, et le solde dit si la puissance va monter, baisser ou rester stable.</p>
<h3>Ce que vous voyez</h3><ul><li><b>Réserve du cœur</b> : la réactivité que le combustible apporte (positive, constante ici).</li><li><b>Grappes</b>, <b>bore</b>, <b>modérateur</b>, <b>Doppler</b>, <b>xénon</b> : ce qui la consomme. Les barres partent du centre : bleu vers la gauche pour un terme négatif, orange vers la droite pour un positif.</li><li><b>Total ρ</b> : le solde. Sous-critique, il s'affiche avec la marge d'arrêt.</li></ul>
<h3>Pourquoi c'est important</h3><p>Ce tableau explique tout mouvement de puissance. Si la puissance baisse sans raison apparente, une ligne a changé : le xénon monte, le bore a varié, une grappe est tombée… L'opérateur raisonne en permanence en « qui ajoute, qui retire ».</p>
<h3>Ordres de grandeur</h3><ul><li>β = 600 pcm : au-delà, le réacteur est prompt-critique.</li><li>+100 pcm ≈ une période d'une minute.</li><li>Groupes d'arrêt 4 800 pcm, GCP 1 800, groupe R 1 100.</li><li>Bore : −9 pcm par ppm. Xénon à l'équilibre : −2 700 pcm. Défaut de puissance 0 → 100 % : ~ −1 400 pcm.</li></ul>
<h3>Pièges fréquents</h3><ul><li>Un total proche de zéro ne veut pas dire « peu de puissance » : critique signifie seulement que la puissance est constante, à n'importe quel niveau.</li><li>Le coefficient modérateur α dépend du bore : en début de cycle, le réacteur réagit moins aux variations de température.</li></ul>`},
 di:{t:'Diagramme ΔI',l:'l-di',h:`<h3>En bref</h3><p>La puissance ne se répartit pas uniformément sur la hauteur du cœur (environ 3,7 m). Le ΔI compare la moitié haute et la moitié basse. Une image : une bougie qui brûlerait plus fort en haut qu'en bas. Trop de déséquilibre, et un endroit du combustible travaille beaucoup plus que les autres.</p>
<h3>Ce que vous voyez</h3><ul><li>En ordonnée la puissance, en abscisse le ΔI en % de la puissance nominale.</li><li>La bande verte est le domaine autorisé : le ΔI de référence ± 5 %. Elle est inclinée parce que la référence suit la puissance.</li><li>Le point blanc est l'état actuel ; il devient ambre hors domaine. La trace grise montre la dernière heure.</li></ul>
<h3>Pourquoi c'est important</h3><p>Les marges de sûreté (crise d'ébullition, température du combustible en cas d'accident) sont calculées pour des formes de flux données. Rester dans le domaine garantit qu'elles restent valables. Un ΔI qui s'écarte réduit aussi le seuil de protection ΔT surtempérature.</p>
<h3>Ce qui le fait bouger</h3><ul><li><b>Les grappes</b>, qui entrent par le haut : les insérer écrase le flux en haut, le ΔI devient plus négatif.</li><li><b>Le xénon</b>, avec plusieurs heures de retard : il se forme là où le flux était fort et peut entretenir une oscillation haut-bas d'environ 24 h.</li><li><b>Le bore</b>, lui, agit partout pareil : il ne change pas le ΔI. C'est pourquoi on compense les variations lentes au bore plutôt qu'avec les grappes.</li></ul>
<h3>Pièges fréquents</h3><ul><li>Compenser le xénon en enfonçant R : la puissance est juste, mais le ΔI dérive.</li><li>Corriger trop tard une oscillation xénon : elle s'amplifie d'un cycle à l'autre.</li></ul>`},
 rods:{t:'Grappes de commande',l:'l-fb',h:`<h3>En bref</h3><p>Les grappes sont des faisceaux de crayons absorbants qui coulissent dans le combustible, comme un frein qu'on enfonce plus ou moins. Elles agissent vite et localement, et assurent l'arrêt d'urgence : relâchées, elles tombent par gravité en moins de 2 secondes.</p>
<h3>Ce que vous voyez</h3><ul><li><b>Groupes d'arrêt</b> (SA, SB, SC) : toujours extraits en fonctionnement. Ils sont la réserve qui garantit l'arrêt.</li><li><b>GCP</b> (G1, G2 dits « gris », N1, N2 « noirs », qui se chevauchent) : en mode G, ils prennent une position fixée par la charge turbine, la courbe de calibrage.</li><li><b>Groupe R</b> : il bouge seul pour tenir Tmoy sur Tref ; sa bande de manœuvre normale va de ~ 150 à 215 pas.</li><li>Position en <b>pas</b> extraits : 0 = complètement inséré, 225 = complètement extrait.</li></ul>
<h3>Pourquoi c'est important</h3><p>Les grappes servent aux variations <b>rapides</b> : suivre la turbine, réguler la température, arrêter le réacteur. Elles déforment le flux (ΔI) et leur efficacité n'est pas linéaire. On ne les laisse donc pas longtemps profondément insérées : c'est le bore qui prend le relais.</p>
<h3>Ordres de grandeur</h3><ul><li>Efficacité en <b>courbe en S</b> : presque nulle aux extrémités, maximale à mi-hauteur (~ 10 pcm par pas pour R).</li><li>Vitesses : 48 pas/min en manuel, 8 à 72 pas/min pour R en automatique.</li></ul>
<h3>Pièges fréquents</h3><ul><li>Un groupe R en butée haute ne peut plus compenser une baisse de réactivité : Tmoy décroche sous Tref.</li><li>L'extraction est bloquée automatiquement au-dessus de 103 %, après une chute de grappe ou si la marge ΔT est faible.</li></ul>`},
 bore:{t:'Bore — RCV / REA',l:'l-xe',h:`<h3>En bref</h3><p>L'eau du primaire contient de l'acide borique : le bore 10 absorbe les neutrons. Plus il y a de bore, moins le réacteur est réactif. Contrairement aux grappes, il agit partout à la fois et lentement, comme du sel dissous dans une casserole qu'on ne peut retirer qu'en ajoutant de l'eau.</p>
<h3>Ce que vous voyez</h3><ul><li>La <b>concentration</b> en ppm (milligrammes de bore par kilogramme d'eau).</li><li><b>Dilution</b> : on injecte de l'eau pure, le bore baisse, la réactivité monte.</li><li><b>Borication</b> : on injecte de l'eau très borée (7 700 ppm), le bore monte, la réactivité baisse.</li><li>Débit et volume : l'appoint s'arrête seul au volume choisi.</li><li><b>Isoler l'appoint REA</b> : ferme toutes les vannes d'appoint, y compris celles qui fuiraient.</li></ul>
<h3>Pourquoi c'est important</h3><p>Le bore compense ce qui évolue lentement : l'usure du combustible (de ~ 1 200 ppm en début de cycle à ~ 0 en fin), le xénon, et la position du groupe R. C'est le « réglage fin de long terme » de l'opérateur.</p>
<h3>Ordres de grandeur</h3><ul><li>Vers 800 ppm : 1 m³ de dilution ≈ −3 ppm ≈ +27 pcm ; 100 L de borication ≈ +2,5 ppm ≈ −23 pcm.</li><li>L'effet arrive au rythme du mélange dans 270 m³ d'eau : plusieurs minutes.</li></ul>
<h3>Pièges fréquents</h3><ul><li>Plus le bore est bas, plus une dilution coûte de volume pour le même effet.</li><li>Un bore élevé rend α moins négatif : le réacteur est moins autorégulé.</li><li>Une dilution qui continue sans demande (« Appoint REA en service » alors qu'on n'a rien lancé) est un incident classique.</li></ul>`},
 turb:{t:'Turbine — GCT',l:'l-fb',h:`<h3>En bref</h3><p>La turbine transforme la vapeur en rotation, l'alternateur en électricité. En France, on pilote les réacteurs en <b>mode G</b> : c'est la turbine qui commande. On règle la charge demandée par le réseau, et le réacteur suit automatiquement, un peu comme un régulateur de vitesse où l'on choisit la vitesse et où le moteur s'adapte.</p>
<h3>Ce que vous voyez</h3><ul><li><b>Charge</b> réelle et <b>consigne</b>, vitesse de variation en %/min, bouton <b>Maintenir</b> pour figer la charge.</li><li><b>Coupler / Découpler</b> l'alternateur ; <b>Recoupler au réseau</b> après un îlotage.</li><li><b>GCT-c</b> : contournement vers le condenseur. Turbine découplée, il règle la pression vapeur (mode P) ; couplée, il s'ouvre si le primaire est trop chaud (mode T).</li><li><b>GCT-a</b> : décharge de vapeur à l'atmosphère, utilisable à la main pour refroidir.</li></ul>
<h3>Pourquoi c'est important</h3><p>La charge fixe la température de consigne : <b>Tref = 286 + 18,5 × charge</b>. Elle fixe aussi la position des GCP et le débit de vapeur. Changer la charge, c'est demander au réacteur de changer de puissance.</p>
<h3>Ordres de grandeur</h3><ul><li>Couplage à partir de 6 % PN. Vitesses courantes : 1 à 5 %/min ; 30 %/min en baisse rapide.</li><li>GCT-c : jusqu'à 85 % du débit nominal ; GCT-a : 3 × 10 %.</li><li>Îlotage : la turbine tombe à ~ 5 % (les auxiliaires de la centrale) en une trentaine de secondes.</li></ul>
<h3>Pièges fréquents</h3><ul><li>Monter la charge plus vite que le xénon et le bore ne le permettent : R finit en butée et Tmoy décroche.</li><li>Découpler au-dessus de 6 % : refusé, il faut d'abord réduire.</li></ul>`},
 are:{t:'Eau alimentaire — ARE / ASG',l:'l-gv',h:`<h3>En bref</h3><p>Les générateurs de vapeur sont de grosses bouilloires : chaque kilogramme de vapeur qui part vers la turbine doit être remplacé par un kilogramme d'eau. C'est le rôle de l'ARE. Si l'eau manque, le GV s'assèche et ne refroidit plus le primaire ; s'il y en a trop, de l'eau part vers la turbine.</p>
<h3>Ce que vous voyez</h3><ul><li><b>Niveau GV</b> (gamme étroite), tenu vers 50 %. <b>Débit ARE</b> et <b>débit vapeur</b> en % du nominal : à l'équilibre, ils sont égaux.</li><li><b>Pression GV</b> : c'est la pression d'ébullition de l'eau du GV.</li><li>Pompes : deux <b>TPA</b>, la motopompe <b>APD</b>, et l'<b>ASG</b> de secours.</li></ul>
<h3>Pourquoi c'est important</h3><p>Le niveau GV est l'un des paramètres les plus nerveux de la tranche. Il est trompeur : quand la vapeur augmente, les bulles se multiplient et le niveau <b>monte</b> un instant alors qu'on perd de l'eau (gonflement). L'inverse se produit en baisse de charge (contraction). La régulation « trois éléments » combine niveau, débit vapeur et débit d'eau pour ne pas s'y laisser prendre.</p>
<h3>Ordres de grandeur</h3><ul><li>Chaque TPA fournit 58 % du débit, l'APD 12 %, l'ASG 10 % d'eau froide.</li><li>Pression vapeur : 57,5 bar à 100 %, 70 bar à 0 %.</li><li>AAR à 15 %, déclenchement turbine à 80 %. Avec un débit d'eau inférieur de 40 % au débit vapeur, on perd environ 0,3 % de niveau par seconde.</li></ul>
<h3>Pièges fréquents</h3><ul><li>Réagir au niveau seul pendant un transitoire : la contraction pousse à trop alimenter, puis le niveau dépasse.</li><li>Laisser l'ASG en service après stabilisation : l'eau froide refroidit inutilement le primaire.</li></ul>`},
 pzr:{t:'Pressuriseur — RCV',l:'l-pzr',h:`<h3>En bref</h3><p>Le primaire est plein d'eau à 300 °C qui doit rester liquide : il faut donc une forte pression (155 bar). Le pressuriseur est un grand réservoir relié au circuit, rempli en bas d'eau et en haut de vapeur. Comme dans une cocotte-minute, la pression dépend uniquement de la température de cette eau. On chauffe pour monter la pression, on refroidit pour la baisser.</p>
<h3>Ce que vous voyez</h3><ul><li><b>Pression</b> et <b>niveau</b>, avec la référence de niveau qui suit Tmoy.</li><li><b>Chaufferettes</b> : résistances électriques, en automatique, forcées ou arrêtées.</li><li><b>Aspersion</b> : pluie d'eau froide qui condense la vapeur ; isolable si une vanne reste bloquée.</li><li><b>RCV</b> : la <b>charge</b> injecte de l'eau, la <b>décharge</b> en retire. La différence fait varier le niveau.</li><li><b>SEBIM</b> : soupapes de protection.</li></ul>
<h3>Pourquoi c'est important</h3><p>Le pressuriseur est le « vase d'expansion » du primaire. Quand l'eau chauffe, elle se dilate et y entre (insurge) ; quand elle refroidit, elle en sort (outsurge). Tout écart de température se lit donc d'abord au pressuriseur. Un niveau qui baisse sans changement de température signale une perte d'eau : une fuite.</p>
<h3>Ordres de grandeur</h3><ul><li>1 °C de Tmoy ≈ 2,2 % de niveau et ~ 0,7 bar de pression.</li><li>Chaufferettes : 1 440 kW, soit ~ 1,5 bar/min. Aspersion pleine : ~ −9 bar/min.</li><li>AAR à 165 et 131 bar, SEBIM à 166,6 bar, IS à 119 bar.</li></ul>
<h3>Pièges fréquents</h3><ul><li>Sous 14 % de niveau, la décharge s'isole et les chaufferettes se coupent pour ne pas fonctionner à sec.</li><li>Sans les pompes primaires 1 ou 2, l'aspersion ne fonctionne plus.</li></ul>`},
 prot:{t:'Protection et sauvegarde',l:'l-prot',h:`<h3>En bref</h3><p>Le système de protection est un gardien automatique. Il compare en permanence des mesures redondantes à des seuils et, au moindre dépassement, arrête le réacteur ou injecte de l'eau, sans attendre l'opérateur. Les seuils sont fixés pour qu'aucun transitoire n'atteigne les limites physiques du combustible et du circuit.</p>
<h3>Ce que vous voyez</h3><ul><li>État des trois pompes primaires (<b>GMPP</b>), de l'injection de sécurité et de la gamme source.</li><li><b>AAR manuel</b> et <b>IS manuelle</b> : deux appuis, armer puis confirmer.</li><li><b>Réarmer l'AAR</b> : possible quand les grappes sont en bas et qu'aucun signal n'est présent.</li><li><b>Inhiber GS</b> pendant une divergence, après P6.</li><li>La cause du dernier AAR et les éventuelles limites dépassées.</li></ul>
<h3>Pourquoi c'est important</h3><p>Les protections couvrent les grands risques : excursion de puissance (haut flux), crise d'ébullition (ΔT surtempérature, basse pression), surpression du circuit (haute pression), perte de refroidissement (niveau GV, débit primaire). Les <b>permissifs</b> P6, P7 et P10 adaptent ces protections au niveau de puissance.</p>
<h3>Ordres de grandeur</h3><ul><li>Haut flux 109 % ; seuil bas 25 % tant que l'opérateur ne l'a pas bloqué, ce qui n'est permis qu'au-dessus de P10, gamme source 10⁵ c/s.</li><li>Simplification : ici, la perte d'une seule pompe primaire déclenche l'AAR dès P7. Sur une tranche réelle, le seuil dépend du nombre de boucles touchées (perte d'une boucle au-dessus d'un permissif plus élevé, P8).</li><li>Pression 165 / 131 bar, niveau pressu 92 %, niveau GV 15 %.</li><li>IS à 119 bar ; arrêt possible au-dessus de 140 bar, avec un niveau pressu supérieur à 20 % et une marge à la saturation supérieure à 20 °C.</li></ul>
<h3>Pièges fréquents</h3><ul><li>Arrêter l'IS trop tôt : si la fuite continue, la pression rechute.</li><li>Hésiter à faire un AAR manuel quand une situation échappe au contrôle : c'est l'action la plus sûre.</li></ul>`},
 pt:{t:'Domaine P-T « chaussette »',l:null,h:`<h3>En bref</h3><p>Le diagramme pression-température du circuit primaire, que l'on appelle souvent « la chaussette » à cause de sa forme. Il délimite les couples (température, pression) dans lesquels le primaire a le droit de se trouver. Le point est l'état actuel (température de branche chaude, pression pressuriseur) : blanc ou noir selon le thème, orange sous 15 °C de marge, rouge hors domaine, la trace grise montre la dernière heure.</p>
<h3>Les limites qui dessinent la chaussette</h3><ul><li><b>À droite, la saturation</b> (rouge) : au-delà, l'eau bout. On garde une <b>marge</b> d'au moins 10 °C (pointillés orange) ; l'alarme du simulateur se déclenche sous 15 °C. C'est la marge à la saturation du bandeau.</li><li><b>En haut à gauche, la rupture brutale</b> (violet) : à basse température, l'acier de la cuve devient fragile ; une forte pression pourrait la rompre sans déformation préalable. La pression permise est donc faible à froid et ne remonte qu'en chauffant.</li><li><b>En bas, la pression minimale des pompes primaires</b> (bleu) : leurs joints ont besoin d'environ 25 bar pour fonctionner.</li><li><b>En haut, la pression maximale</b> : soupapes du pressuriseur (pointillés) et limite de sûreté (172 bar ici).</li></ul>
<h3>Pourquoi c'est important</h3><p>Toutes les montées et descentes en température et pression (démarrage, refroidissement pour un arrêt) doivent rester dans la chaussette. La forme impose l'ordre des opérations : on ne met en pression qu'après avoir chauffé, et l'on dépressurise avant de trop refroidir. En puissance, le point reste dans le petit rectangle bleu du fonctionnement normal (155 bar, 286 à 325 °C).</p>
<h3>Ordres de grandeur</h3><ul><li>Fonctionnement : 155 bar ; Tch 323 °C à 100 %, soit ~22 °C de marge à la saturation.</li><li>Arrêt à froid : quelques dizaines de bar et moins de 90 °C.</li></ul>
<h3>Attention</h3><p>Le simulateur ne couvre que les états chauds (arrêt à chaud et puissance) : le point reste dans le coin supérieur droit, que le bouton « Zoom » agrandit. Les limites à basse température sont indicatives : les valeurs réelles dépendent de chaque tranche et de son vieillissement.</p>`},
 run:{t:'En cours',l:null,h:`<h3>En bref</h3><p>La carte de suivi de quart : ce qui est en train de se passer sur la tranche, qu'il s'agisse de vos actions ou des automatismes.</p><h3>Ce que vous voyez</h3><ul><li><b>Alarmes actives</b>, de la plus grave à la moins grave ; elles clignotent tant qu'elles ne sont pas acquittées. « Tableau » ouvre le tableau complet.</li><li><b>Mes actions</b> : rampe de charge, mouvements de grappes, appoints (avec leur avancement), modes manuels, isolements, équipements de secours, et les sauvegardes en cours (AAR, injection de sécurité). Le point indique l'origine : bleu pour une action de l'opérateur, ambre pour un écart, rouge pour une sauvegarde. Un bouton permet souvent d'arrêter ou de revenir en automatique directement.</li><li><b>Automatismes</b> : ce que les régulations font seules (groupe R, GCP, contournement GCT, ASG…).</li><li><b>Journal</b> (sur téléphone) : les trois dernières entrées ; sur ordinateur, le journal complet est dans la vue Journal.</li></ul><h3>Pourquoi c'est important</h3><p>Un opérateur doit toujours savoir ce qu'il a lancé et ce qui tourne en manuel. Une dilution oubliée ou un groupe laissé en manuel sont des causes classiques d'écart.</p>`},
 trend:{t:'Tendances',l:null,h:`<h3>En bref</h3><p>Un chiffre dit où l'on est, une courbe dit où l'on va. Les tendances enregistrent chaque seconde les grandeurs principales pour voir les dérives lentes et la forme des transitoires.</p>
<h3>Ce que vous voyez</h3><ul><li>Les puces choisissent les courbes ; la fenêtre va de 5 minutes à 8 heures.</li><li>Le point au bout de chaque courbe est la valeur actuelle ; les pointillés sont des références (Tref, ΔI de référence).</li></ul>
<h3>Bonnes associations</h3><ul><li><b>Puissance + Température</b> pour tout transitoire.</li><li><b>Grappes + Bore + Xénon</b> sur 8 h pour le suivi de charge.</li><li><b>Niveaux + Pression</b> pour les aléas d'eau alimentaire ou de RCV.</li></ul>`},
 alarm:{t:'Alarmes et journal',l:null,h:`<h3>En bref</h3><p>Les alarmes signalent un écart avant qu'il ne devienne grave. Le métier de l'opérateur consiste à les trier : laquelle est la cause, lesquelles en sont les conséquences.</p>
<h3>Ce que vous voyez</h3><ul><li><b>Rouge</b> : événement grave (AAR, IS, chute de grappe…). <b>Ambre</b> : écart à traiter. <b>Bleu</b> : information.</li><li>Une alarme qui apparaît <b>clignote</b> jusqu'à l'acquittement et s'éteint quand sa cause disparaît. L'avertisseur sonore suit la même séquence : <b>klaxon</b> pour une alarme rouge, <b>ronfleur</b> pour une ambre, répétés jusqu'à l'acquittement ; un carillon pour une information. Le bandeau en haut résume les alarmes en cours.</li><li>Le <b>journal de quart</b> horodate vos actions (bleu), les automatismes (ambre) et les alarmes.</li></ul>
<h3>Méthode</h3><p>Lisez le journal à rebours pour trouver la <b>première</b> alarme apparue : c'est souvent la cause. Regardez ensuite quels paramètres varient (en gras dans le bandeau) et vers quel seuil ils vont.</p>`},
};
const GLOSS=[
 ['prompt-critique','prompt-critiques?',1,"Réactivité supérieure ou égale à β : la réaction s'emballe sur les seuls neutrons prompts, en millisecondes, sans que les neutrons retardés puissent la freiner. Situation à ne jamais atteindre."],
 ['Saut prompt','sauts? prompts?( négatifs?)?',1,"Variation quasi instantanée de la puissance juste après un changement de réactivité, avant que les neutrons retardés n'imposent leur rythme plus lent. Environ ρ / (β − ρ) en valeur relative."],
 ['Neutrons retardés','neutrons retardés',1,"Environ 0,6 % des neutrons de fission sont émis avec un retard de 0,2 s à une minute par certains produits de fission. Ils ralentissent la réaction au point de la rendre pilotable par un humain."],
 ['Neutrons prompts','neutrons prompts',1,"Neutrons émis instantanément par la fission. Seuls, ils feraient évoluer la puissance en quelques millisecondes."],
 ['β (fraction de neutrons retardés)','β',0,"Fraction des neutrons de fission qui sont retardés : environ 600 pcm ici. C'est l'étalon de la réactivité : tant que ρ reste petit devant β, le réacteur évolue lentement."],
 ['pcm','pcm',0,"« Pour cent mille » : unité de réactivité. 1 pcm = 10⁻⁵, soit un écart de 0,001 % entre deux générations de neutrons. Repère : 600 pcm = β, +100 pcm ≈ une minute de période."],
 ['Réactivité (ρ)','réactivité|ρ',1,"Écart à la criticité : de combien la population de neutrons grossit (ρ > 0) ou diminue (ρ < 0) d'une génération à la suivante. Exprimée en pcm."],
 ['Antiréactivité','antiréactivité',1,"Réactivité négative, celle qu'apportent par exemple les grappes ou le bore."],
 ['Sous-critique','sous-critiques?|sous-criticité',1,"Le réacteur perd des neutrons d'une génération à l'autre (k < 1) : la puissance décroît, ou se maintient au niveau entretenu par la source de neutrons."],
 ['Surcritique','surcritiques?',1,"Le réacteur gagne des neutrons d'une génération à l'autre (k > 1) : la puissance augmente, au rythme fixé par la période."],
 ['Criticité','criticité|critique',1,"Chaque fission entraîne exactement une nouvelle fission en moyenne (k = 1) : la puissance reste constante, à n'importe quel niveau. « Critique » ne veut pas dire dangereux, c'est l'état normal en fonctionnement."],
 ['Divergence','divergence|divergez|diverger',1,"Démarrage du réacteur : passage de l'état sous-critique à l'état critique puis légèrement surcritique pour faire monter la puissance."],
 ['Période','périodes?',1,"Temps nécessaire pour que la puissance soit multipliée par e ≈ 2,72. Positive si la puissance monte, négative si elle baisse. La décroissance la plus rapide possible correspond à environ −80 s."],
 ['Temps de doublement','temps de doublement|Td',1,"Temps pour que la puissance double au rythme actuel ; c'est la période × 0,69. Indicateur clé pendant une divergence."],
 ['Doppler','doppler',1,"Quand le combustible chauffe, les noyaux d'uranium 238 s'agitent et capturent davantage de neutrons : la réactivité baisse immédiatement. C'est le premier frein naturel du réacteur (≈ −1,8 pcm/°C ici)."],
 ['Coefficient modérateur (α)','coefficient modérateur|α',1,"Variation de réactivité par degré de température de l'eau. Négatif dans un REP : si l'eau chauffe, elle ralentit moins bien les neutrons et la réactivité baisse. D'autant plus négatif que le bore est bas."],
 ['Modérateur','modérateur',1,"Ce qui ralentit les neutrons pour qu'ils provoquent efficacement des fissions : ici l'eau du primaire. Moins dense quand elle chauffe, elle ralentit moins bien."],
 ['Contre-réaction','contre-réactions?',1,"Effet par lequel l'état du réacteur agit sur sa propre réactivité. Négative, elle est stabilisante : la puissance monte, le combustible chauffe, la réactivité baisse."],
 ['Défaut de puissance','défaut de puissance',1,"Réactivité « consommée » par les contre-réactions quand on monte en puissance (combustible et eau plus chauds) : environ 1 400 pcm entre 0 et 100 % ici. Il faut la compenser par les GCP."],
 ['Point d\'échauffement nucléaire','point d\'échauffement nucléaire|point d\'échauffement',1,"Niveau de puissance (≈ 1 %) à partir duquel les fissions chauffent sensiblement le combustible : les contre-réactions apparaissent et la puissance se stabilise d'elle-même."],
 ['Autorégulation','autorégulation|autorégulée?',1,"Capacité du réacteur à se stabiliser seul grâce à ses contre-réactions négatives, sans action sur les grappes."],
 ['Réserve du cœur','réserve du cœur',1,"Réactivité apportée par le combustible au-delà de ce qui est nécessaire pour être critique. Elle diminue au fil du cycle à mesure que l'uranium s'use."],
 ['Bore / ppm','bore|ppm|acide borique',1,"Acide borique dissous dans l'eau du primaire ; le bore 10 absorbe les neutrons. Concentration en ppm (mg de bore par kg d'eau). Agit uniformément dans tout le cœur, avec environ −9 pcm par ppm ici."],
 ['Dilution','dilutions?|diluer|diluez',1,"Ajout d'eau pure dans le primaire : la concentration en bore baisse et la réactivité augmente."],
 ['Borication','borications?|borer|borez',1,"Ajout d'eau très chargée en bore (7 700 ppm) : la concentration monte et la réactivité baisse."],
 ['Xénon 135','xénon( 135)?',1,"Produit de fission qui absorbe énormément de neutrons. Il est surtout produit par la décroissance de l'iode 135 et détruit par le flux de neutrons. Son évolution sur plusieurs heures perturbe la réactivité après chaque changement de puissance."],
 ['Iode 135','iode( 135)?',1,"Produit de fission de demi-vie 6,6 h qui se transforme en xénon 135 : c'est le « réservoir » qui alimente le xénon après une baisse de puissance."],
 ['Empoisonnement','empoisonnement|poison',1,"Perte de réactivité due à des produits de fission très absorbants, principalement le xénon 135."],
 ['ΔI (différence axiale de puissance)','ΔI',0,"Puissance de la moitié haute du cœur moins celle de la moitié basse, en % de la puissance nominale. Mesure la forme verticale du flux ; on la garde dans un domaine autour d'une référence."],
 ['Axial offset (AO)','axial offset|AO',0,"ΔI divisé par la puissance : décrit la forme du flux indépendamment de son niveau."],
 ['Facteur de forme','facteur de forme',1,"Rapport entre la puissance au point le plus chaud du cœur et la puissance moyenne. Plus il est élevé, plus les marges thermiques sont réduites."],
 ['Oscillation xénon axiale','oscillations? xénon axiales?',1,"Balancement lent (~ 24 h) de la puissance entre le haut et le bas du cœur, entretenu par la formation et la destruction du xénon. Il peut s'amplifier si l'on ne l'amortit pas."],
 ['Grappe','grappes?',1,"Faisceau de crayons absorbants (argent-indium-cadmium) qui coulisse dans les assemblages de combustible. Insérée, elle absorbe des neutrons et réduit la réactivité."],
 ['Groupes d\'arrêt','groupes d\'arrêt|SA|SB|SC',0,"Grappes (SA, SB, SC) toujours extraites en fonctionnement : elles constituent la réserve qui garantit l'arrêt du réacteur."],
 ['GCP','GCP',0,"Groupes de compensation de puissance (G1, G2, N1, N2). En mode G, ils prennent une position fixée par la charge turbine pour compenser le défaut de puissance."],
 ['Groupe R','groupe R',0,"Groupe de régulation de température : il bouge automatiquement pour tenir Tmoy sur Tref. Bande de manœuvre normale ~ 150 à 215 pas."],
 ['Pas','(?<=\\d\\s?)pas',0,"Unité de déplacement des grappes : 225 pas sur toute la hauteur du cœur, soit ≈ 1,6 cm par pas. 0 = inséré, 225 = extrait."],
 ['Courbe en S','courbe en S',1,"Forme de l'efficacité intégrale d'une grappe : presque aucun effet près des extrémités, effet maximal quand elle est à mi-hauteur."],
 ['Courbe de calibrage','courbe de calibrage',1,"Position programmée des GCP en fonction de la charge turbine, calculée pour compenser le défaut de puissance."],
 ['Mode G','mode G',0,"Mode de pilotage des REP français : le réacteur suit la turbine. Les GCP sont positionnés selon la charge, R régule la température, le bore compense les évolutions lentes."],
 ['Tmoy','Tmoy',0,"Température moyenne de l'eau primaire, entre branche chaude et branche froide. Elle suit un programme : 286 °C à 0 %, 304,5 °C à 100 %."],
 ['Tref','Tref',0,"Température de consigne calculée à partir de la charge turbine. Le groupe R agit pour que Tmoy reste égale à Tref."],
 ['Branche chaude / froide','branches? (chaude|froide)',1,"Tuyauteries du primaire : la branche chaude va de la cuve au GV (≈ 323 °C à 100 %), la branche froide revient du GV à la cuve (≈ 286 °C)."],
 ['Primaire','primaire',1,"Circuit d'eau sous 155 bar qui traverse le cœur et cède sa chaleur aux GV. Fermé et radioactif."],
 ['Secondaire','secondaire',1,"Circuit eau-vapeur qui reçoit la chaleur dans les GV, fait tourner la turbine puis est recondensé. Il n'est pas en contact avec le cœur."],
 ['Pressuriseur','pressuriseur|pressu',1,"Réservoir relié au primaire, contenant de l'eau en bas et de la vapeur en haut. Il fixe la pression du circuit et absorbe les dilatations de l'eau."],
 ['Chaufferettes','chaufferettes',1,"Résistances électriques au fond du pressuriseur (1 440 kW) : elles vaporisent de l'eau pour faire monter la pression."],
 ['Aspersion','aspersion',1,"Pulvérisation d'eau de branche froide en haut du pressuriseur : elle condense de la vapeur et fait baisser la pression."],
 ['Insurge / outsurge','insurge|outsurge',1,"Entrée d'eau dans le pressuriseur quand le primaire se dilate (insurge), sortie quand il se contracte (outsurge)."],
 ['SEBIM','SEBIM',0,"Soupapes de protection du pressuriseur, qui s'ouvrent à 166,6 bar pour éviter la surpression."],
 ['RCV','RCV',0,"Circuit de contrôle chimique et volumétrique : il ajuste la quantité d'eau du primaire (charge et décharge) et sa composition, dont le bore."],
 ['REA','REA',0,"Circuit d'appoint qui fournit l'eau déminéralisée et l'acide borique injectés par le RCV."],
 ['Charge / décharge','charge RCV|décharge',1,"Débit d'eau injecté dans le primaire (charge) ou prélevé (décharge) par le RCV. Leur différence fait varier le niveau du pressuriseur."],
 ['GV (générateur de vapeur)','GV|générateurs? de vapeur',0,"Échangeur où l'eau primaire, circulant dans ~ 3 300 tubes en U, fait bouillir l'eau secondaire sans s'y mélanger. Trois GV sur un REP 900."],
 ['Gonflement / contraction','gonflement|contraction',1,"Variation apparente du niveau GV due aux bulles de vapeur. Quand le débit vapeur augmente, le niveau monte un instant (gonflement) alors qu'on perd de l'eau, et inversement (contraction)."],
 ['ARE','ARE',0,"Alimentation normale en eau des GV, régulée pour remplacer exactement la vapeur produite."],
 ['TPA','TPA',0,"Turbopompe alimentaire : grosse pompe de l'ARE entraînée par une petite turbine à vapeur. Deux TPA de 58 % chacune ici."],
 ['APD','APD',0,"Motopompe électrique de l'ARE (12 %), utilisée au démarrage ou en appoint."],
 ['ASG','ASG',0,"Alimentation de secours des GV, qui démarre automatiquement sur AAR ou niveau bas. Elle injecte de l'eau froide."],
 ['GCT-c','GCT-c',0,"Contournement de la turbine vers le condenseur : envoie la vapeur directement au condenseur quand la turbine ne la consomme pas."],
 ['GCT-a','GCT-a',0,"Décharge de vapeur à l'atmosphère, le panache visible sur le toit des bâtiments. Utilisée pour refroidir quand le condenseur n'est pas disponible."],
 ['Condenseur','condenseur',1,"Échangeur refroidi par l'eau d'une rivière ou de la mer, qui retransforme la vapeur en eau."],
 ['Îlotage','îlotage|îlotée',1,"Perte du réseau sans arrêt du réacteur : la tranche continue de tourner en alimentant seulement ses propres auxiliaires (~ 5 %)."],
 ['Couplage','couplage|coupler|couplée?',1,"Raccordement de l'alternateur au réseau électrique : la turbine commence alors à fournir de la puissance."],
 ['AAR','AAR',0,"Arrêt automatique du réacteur : toutes les grappes tombent en moins de 2 s, apportant plus de 7 000 pcm d'antiréactivité."],
 ['IS (injection de sécurité)','IS',0,"Injection d'eau borée dans le primaire en cas de chute de pression ou de perte d'eau, pour garder le cœur noyé et sous-critique."],
 ['Permissif','permissifs?',1,"Seuil de puissance qui active ou inhibe certaines protections, pour qu'elles ne s'appliquent que là où elles ont un sens."],
 ['P6','P6',0,"Permissif atteint quand la gamme intermédiaire dépasse 10⁻¹⁰ A : autorise l'inhibition de la gamme source."],
 ['P7','P7',0,"Permissif à 10 % de puissance : au-dessus, les AAR sur basse pression, niveau pressu haut, perte de pompe primaire et déclenchement turbine sont actifs."],
 ['P10','P10',0,"Permissif à 10 % en gamme puissance : au-dessus, l'opérateur peut bloquer le seuil bas de haut flux (25 %) pour poursuivre la montée. Le blocage se lève tout seul en redescendant sous P10."],
 ['Gamme source','gamme source|GS',0,"Détecteurs de neutrons les plus sensibles (1 à 10⁶ coups/s), utilisés à l'arrêt et pendant la divergence."],
 ['Gamme intermédiaire','gamme intermédiaire|GI',0,"Détecteurs couvrant les puissances intermédiaires, de 10⁻¹¹ à 10⁻³ A."],
 ['Gamme puissance','gamme puissance|GP',0,"Détecteurs de 0 à 120 % de puissance, à deux sections (haute et basse) qui donnent aussi le ΔI."],
 ['Marge à la saturation','marge à la saturation',1,"Écart entre la température d'ébullition à la pression actuelle et la température de la branche chaude. Si elle s'annule, l'eau bout dans le cœur."],
 ['Saturation','saturation|Tsat',1,"État où l'eau bout : à chaque pression correspond une température d'ébullition (345 °C à 155 bar, 286 °C à 70 bar)."],
 ['Crise d\'ébullition','crise d\'ébullition',1,"Régime où un film de vapeur isole la gaine du combustible de l'eau : la gaine n'est plus refroidie et surchauffe. Les protections ΔT et basse pression sont faites pour l'éviter."],
 ['Puissance résiduelle','puissance résiduelle',1,"Chaleur dégagée par la radioactivité des produits de fission, même réacteur arrêté : ~ 6,5 % juste après l'arrêt, 1 à 2 % au bout d'une heure. Il faut toujours l'évacuer."],
 ['ΔT surtempérature / surpuissance','ΔT surtempérature|ΔT surpuissance|surtempérature|surpuissance',1,"Protections calculées à partir de l'écart de température entre branches chaude et froide (image de la puissance). Le seuil de surtempérature baisse si Tmoy monte, si la pression baisse ou si le ΔI s'écarte."],
 ['PN','PN',0,"Puissance nominale : 100 % = 2 785 MW thermiques."],
 ['MWth / MWe','MWth|MWe',0,"Mégawatts thermiques produits par le cœur, mégawatts électriques fournis au réseau. Rendement d'environ 33 %."],
 ['1/M','1/M',0,"Inverse de la multiplication sous-critique. Il tend vers 0 à l'approche de la criticité ; en le prolongeant, on prédit la position critique des grappes."],
 ['Multiplication sous-critique','multiplication sous-critique|multiplication',1,"Amplification du comptage due aux chaînes de fission, qui s'éteignent d'autant plus lentement que le réacteur est proche du critique."],
 ['Marge d\'arrêt','marge d\'arrêt',1,"Antiréactivité dont dispose le réacteur arrêté : de combien il est sous-critique. Elle doit couvrir les évolutions futures (disparition du xénon, refroidissement)."],
 ['GMPP','GMPP|pompes? primaires?',0,"Groupes motopompes primaires : les trois grosses pompes (~ 6 MW chacune) qui font circuler l'eau du primaire."],
 ['KRT','KRT',0,"Chaînes de mesure de la radioactivité (air, eau, vapeur). Une hausse d'activité dans l'enceinte signale une fuite primaire."],
 ['Réarmement','réarmement|réarmer|réarmez',1,"Remise en service de la logique d'AAR après un arrêt, une fois les causes disparues : condition pour pouvoir extraire de nouveau les grappes."],
 ['Dispatching','dispatching',1,"Centre de conduite du réseau électrique qui demande aux centrales de moduler leur production selon la consommation."],
 ['Chaussette (domaine P-T)','chaussette|domaine P-T',1,"Diagramme pression-température du circuit primaire, à la forme de chaussette, qui délimite les états autorisés : marge à la saturation à droite, risque de rupture brutale de la cuve à froid en haut à gauche, pression minimale des pompes primaires en bas."],
 ['Rupture brutale','rupture brutale',1,"Rupture d'un acier devenu fragile à basse température, sans déformation préalable. Elle limite la pression admissible dans la cuve tant que le circuit est froid."],
 ['Cuve','cuve',1,"Récipient en acier de ~ 20 cm d'épaisseur qui contient le cœur et l'eau du primaire."],
 ['Arrêt à chaud','arrêt à chaud',1,"Réacteur sous-critique mais circuit primaire chaud et sous pression (286 °C, 155 bar) ; la chaleur résiduelle est évacuée par les GV. C'est l'état de départ d'une divergence."],
 ['États standards','états standards|APR|API|AN/RRA|AN/GV',0,"Étapes de fonctionnement d'une tranche, de la plus froide à la production : APR (arrêt pour rechargement), API (arrêt pour intervention), AN/RRA (arrêt normal refroidi par le RRA), AN/GV (arrêt normal refroidi par les GV) et RP (réacteur en production)."],
 ['RRA','RRA',0,"Circuit de refroidissement du réacteur à l'arrêt : il prend le relais des GV pour évacuer la puissance résiduelle quand le primaire est froid et à basse pression."],
 ['Marge d\'arrêt','marges? d\'arrêt',1,"Antiréactivité dont on dispose quand le réacteur est arrêté : de combien il est « sous » la criticité. On la garantit surtout par le bore."],
 ['Repli','repli|replier',1,"Manœuvre qui amène la tranche vers un état plus bas (moins de puissance, puis arrêt), programmée ou imposée par les règles d'exploitation."],
 ['Synchroscope','synchroscope',1,"Indicateur qui montre l'écart de phase entre l'alternateur et le réseau ; on ferme le disjoncteur quand son aiguille tourne lentement et passe en haut."],
 ['Réglage de fréquence','réglage (primaire |secondaire )?de fréquence|téléréglage',1,"Participation automatique des centrales à l'équilibre production-consommation : le réglage primaire corrige en moins de trente secondes, le réglage secondaire (téléréglage) en quelques minutes."],
 ['Seuil bas de haut flux','seuil bas( de haut flux)?',1,"Protection de démarrage qui arrête le réacteur à 25 % de puissance. Au-dessus de P10, l'opérateur la bloque pour poursuivre la montée ; elle se réarme seule en redescendant."],
];
const GRE=GLOSS.map(([k,p,ci,d])=>({k,d,re:new RegExp('(?<![\\p{L}\\p{N}_])(?:'+p+')(?![\\p{L}\\p{N}_])','u'+(ci?'i':''))}));
function glossDom(root){
  if(!root) return;
  const used=new Set();
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement.closest('.g,kbd,button,.info,h2,h3,.t,.mis-title,.stepok,.tag,.bigstars,.log,.why-no,small.num,table')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  const nodes=[]; while(w.nextNode()) nodes.push(w.currentNode);
  for(const node of nodes){
    let txt=node.nodeValue, parts=[], changed=false;
    for(;;){
      let best=null;
      GRE.forEach((g,i)=>{ if(used.has(i)) return; const m=g.re.exec(txt); if(m&&(!best||m.index<best.m.index||(m.index===best.m.index&&m[0].length>best.m[0].length))) best={m,i}; });
      if(!best) break;
      used.add(best.i); changed=true;
      parts.push(document.createTextNode(txt.slice(0,best.m.index)));
      const sp=document.createElement('span'); sp.className='g'; sp.dataset.g=best.i; sp.tabIndex=0; sp.textContent=best.m[0]; parts.push(sp);
      txt=txt.slice(best.m.index+best.m[0].length);
    }
    if(changed){ parts.push(document.createTextNode(txt)); const f=document.createDocumentFragment(); parts.forEach(x=>f.appendChild(x)); node.parentNode.replaceChild(f,node); }
  }
}
function showGloss(i){ const g=GRE[i]; if(!g) return; $('#gpop').innerHTML='<div class="gp-h"><b>'+g.k+'</b><button class="ib" id="gpX" aria-label="Fermer">✕</button></div><p>'+g.d+'</p><button class="gp-l" id="gpL">Tout le lexique</button>'; $('#gpop').hidden=false; $('#gpX').onclick=()=>$('#gpop').hidden=true; $('#gpL').onclick=()=>{ $('#gpop').hidden=true; openLex(); }; }
function openLex(){
  if(A.s){ helpWasPaused=$('#help').hidden?A.paused:helpWasPaused; A.paused=true; syncAll(); }
  const L=GRE.map(g=>g).sort((a,b)=>a.k.localeCompare(b.k,'fr'));
  $('#helpBox').innerHTML='<h2>Lexique</h2><div class="t">Les mots de la salle de commande</div><p>Dans tous les textes, les termes soulignés en pointillés renvoient ici : touchez-les pour leur définition.</p><dl class="lex">'+L.map(g=>'<dt>'+g.k+'</dt><dd>'+g.d+'</dd>').join('')+'</dl><div class="row" style="margin-top:14px"><button class="btn" id="hClose">Fermer</button></div>';
  $('#help').hidden=false; $('#hClose').onclick=closeHelp;
}

let helpWasPaused=true;
function openHelp(k){
  const x=HELP[k]; if(!x) return;
  helpWasPaused=A.paused; A.paused=true; syncAll();
  const ls=x.l?byId(x.l):null;
  $('#helpBox').innerHTML='<h2>Aide</h2><div class="t">'+x.t+'</div>'+x.h+'<div class="row" style="margin-top:14px">'+(ls?'<button class="btn pri" id="hLes">Leçon guidée : '+ls.title+'</button>':'')+'<button class="btn" id="hLex">Lexique</button><button class="btn" id="hClose">Fermer</button></div>';
  $('#help').hidden=false; glossDom($('#helpBox'));
  $('#hClose').onclick=closeHelp; $('#hLex').onclick=openLex;
  if(ls) $('#hLes').onclick=()=>{ $('#help').hidden=true; launch(ls.id); };
}
function closeHelp(){ $('#help').hidden=true; if(A.s) A.paused=helpWasPaused; syncAll(); }



/* ================= Bandeau ================= */
/* Chaque case : pictogramme et libellé, valeur, courbe des dernières minutes derrière la valeur (sp), une ligne d'état (z : puces, mode, mini-diagramme),
   la ligne secondaire (sb, ou v2 à côté de la valeur quand la place manque) et la plage de fonctionnement en bas (gz). Un clic ouvre la carte liée. */
const TdS=s=>Number.isFinite(s.Td)&&s.Td<9999?fmt(s.Td,0)+' s':(s.rate<-1e-4?'décroiss.':'∞');
const PIC={
  pn:'<circle cx="12" cy="12" r="2"/><path d="M12 10V3a9 9 0 0 1 7.8 4.5L13.7 11M10.3 11 4.2 7.5A9 9 0 0 1 12 3M13.7 13l6.1 3.5A9 9 0 0 1 4.2 16.5L10.3 13"/>',
  td:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  rg:'<path d="M6 3v12M12 3v8M18 3v15M4 21h16"/>',
  di:'<path d="M4 20V4M4 20h16"/><path d="M9 18 13 6h4l-4 12z"/>',
  cb:'<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M7.5 15h9"/>',
  tm:'<path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0z"/><path d="M12 9v7"/>',
  th:'<path d="M4 8h12l-3-3M20 16H8l3 3"/>',
  pp:'<circle cx="12" cy="12" r="8"/><path d="m12 12 4-4"/>',
  lp:'<path d="M8 3h8v18H8z"/><path d="M8 13h8"/>',
  pe:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  psg:'<path d="M7 20c-2-3 2-5 0-8s2-5 0-8M12 20c-2-3 2-5 0-8s2-5 0-8M17 20c-2-3 2-5 0-8s2-5 0-8"/>',
  lg:'<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
  dtm:'<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
  sat:'<path d="M4 8a3 3 0 0 1 5-1 3 3 0 0 1 5 0 3 3 0 0 1 5 1"/><path d="M6 20c0-4 3-4 3-8M12 20c0-4 3-4 3-8M18 20c0-4 3-4 3-8"/>',
  heat:'<path d="M12 21c-4 0-6-3-6-6 0-4 4-6 4-11 3 2 7 6 7 11 0 3-2 6-5 6z"/>',
  spr:'<path d="M5 9h14"/><path d="M12 4v5M7 13l-1 3M12 13v3M17 13l1 3M9 19l-.5 1.5M15 19l.5 1.5"/>'
};
const pic=(k,c)=>'<svg class="'+(c||'pic')+'" viewBox="0 0 24 24" aria-hidden="true">'+(PIC[k]||'')+'</svg>';
const chip=(cls,t,ic,p)=>'<span class="bchip '+cls+'"'+(p!=null?' style="--p:'+(p*100).toFixed(1)+'%"':'')+'>'+(ic?pic(ic,'ci'):'<i class="dot"></i>')+'<span>'+t+'</span></span>';
const rampOn=s=>s.coupled&&!s.ilot&&Math.abs(s.LtSet-s.Lt)>0.002;
const BG=[
 {g:'core',t:'Cœur',c:[
  {id:'pn',k:'P nucléaire',u:'%',m:1,v:s=>s.n<0.001?fmt(s.n*100,3):fmt(s.n*100,1),sb:s=>s.coupled?'turb. '+fmt(s.Qt*100,0)+' %':(s.tripped?'résid. '+fmt(s.Qdh*100,1)+' %':'découplée'),gz:{min:0,max:120,lo:0,hi:103,tr:[109],x:s=>s.n*100},st:s=>s.n>1.09?'crit':s.n>1.03?'warn':'',sp:{k:'pn',k2:'pt',span:2}},
  {id:'td',vid:'rho',k:'Réactivité',u:'pcm',m:1,v:s=>sgn(s.rho.tot,0),sb:s=>'Td '+TdS(s),v2:s=>'Td '+TdS(s),st:s=>s.tripped?'':s.Td<12?'crit':s.Td<30?'warn':'',z:s=>{ const r=clamp(s.rho.tot,-60,60), w=Math.abs(r)/60*50; return '<span class="ctr"><i class="ok"></i><i class="b" style="left:'+(r<0?50-w:50)+'%;width:'+w+'%"></i><i class="o"></i></span>'; }},
  {id:'rg',vid:'r',k:'Groupe R · GCP',u:'pas',v:s=>fmt(s.rods.R.p,0),sb:s=>'GCP '+fmt(s.rods.G.p,0),v2:s=>'GCP '+fmt(s.rods.G.p,0),gz:{min:0,max:225,lo:150,hi:215,x:s=>s.rods.R.p},st:s=>!s.tripped&&s.coupled&&(s.rods.R.p<130)?'crit':!s.tripped&&s.coupled&&(s.rods.R.p<150||s.rods.R.p>215)?'warn':'',
   z:s=>{ const r=s.rods.R, mv=Math.abs(r.tg-r.p)>0.4?(r.tg>r.p?' ▲':' ▼'):''; return s.tripped?chip('cr','En bas'):'<span class="pill'+(s.modeR==='man'?' man':'')+'">R '+(s.modeR==='man'?'manuel':'auto')+mv+'</span><span class="pill'+(s.modeG==='man'?' man':'')+'">GCP '+(s.modeG==='man'?'man.':'auto')+'</span>'; }},
  {id:'di',k:'ΔI',u:'% PN',v:s=>fmt(s.DI,1),sb:s=>'écart '+sgn(s.DI+1.5*s.n,1),v2:s=>'écart '+sgn(s.DI+1.5*s.n,1),gz:{min:-10,max:10,lo:-5,hi:5,x:s=>s.DI+1.5*s.n},st:s=>!s.tripped&&s.n>0.15&&Math.abs(s.DI+1.5*s.n)>5?'warn':'',dg:1},
  {id:'cb',k:'Bore',u:'ppm',m:1,v:s=>fmt(s.Cb,0),sb:s=>'α '+fmt(s.rho.am,1),
   z:s=>{ if(s.reaIsol) return chip('warn','REA isolé'); if(s.rea.run){ const d=s.rea.mode==='dil'; return chip('live pg '+(d?'dil':'bor'),(d?'Dil. ':'Bor. ')+fmt(s.rea.v*1000,0)+(s.rea.vt===Infinity?' L':'/'+fmt(s.rea.vt*1000,0)),null,s.rea.vt===Infinity?null:clamp(s.rea.v/s.rea.vt,0,1)); }
    if(s.Qdil>0) return chip('warn live','Eau d\'appoint '+fmt(s.Qdil,0)+' m³/h'); return chip('off','Arrêt'); }}]},
 {g:'prim',t:'Primaire',c:[
  {id:'tm',k:'Tmoy',u:'°C',m:1,v:s=>fmt(s.Tavg,1),sb:s=>s.coupled?'écart '+sgn(s.Tavg-s.Tref,1):'pas de Tref',v2:s=>s.coupled?sgn(s.Tavg-s.Tref,1):'',gz:{min:-5,max:5,lo:-1.5,hi:1.5,x:s=>s.coupled?s.Tavg-s.Tref:0},st:s=>s.coupled&&!s.tripped&&Math.abs(s.Tavg-s.Tref)>3?'crit':s.coupled&&!s.tripped&&Math.abs(s.Tavg-s.Tref)>1.5?'warn':'',sp:{k:'ta',k2:'tr',span:1}},
  {id:'th',k:'Tch · Tfr',u:'°C',v:s=>fmt(s.Thot,1),sb:s=>'Tfr '+fmt(s.Tcold,1),v2:s=>'Tfr '+fmt(s.Tcold,1),sp:{k:'th',span:1}},
  {id:'pp',k:'Pression pressu',u:'bar',m:1,v:s=>fmt(s.Ppzr,1),sb:s=>s.sebim?'SEBIM !':'cons. 155',gz:{min:125,max:170,lo:152,hi:157.5,tr:[131,165],x:s=>s.Ppzr},st:s=>s.Ppzr>164||s.Ppzr<132?'crit':s.Ppzr>157.5||s.Ppzr<152?'warn':'',sp:{k:'pp',span:1},
   z:s=>s.sebim?chip('cr live','SEBIM ouvertes'):chip(s.hEff>0.04?'heat':'off',fmt(s.hEff*100,0),'heat')+chip(s.spray>0.005?'spr':'off',fmt(s.spray*100,0),'spr'),zt:s=>'Chaufferettes '+fmt(s.hEff*1440,0)+' kW · aspersion '+fmt(s.spray*100,0)+' %'},
  {id:'lp',k:'Niveau pressu',u:'%',m:1,v:s=>fmt(s.Lpzr,0),sb:s=>'réf. '+fmt(s.Lref,0)+' %',v2:s=>'réf. '+fmt(s.Lref,0),gz:{min:0,max:100,lo:s=>s.Lref-5,hi:s=>s.Lref+5,tr:[14,92],x:s=>s.Lpzr},st:s=>s.Lpzr<15||s.Lpzr>90?'crit':Math.abs(s.Lpzr-s.Lref)>5?'warn':''}]},
 {g:'sec',t:'Secondaire',c:[
  {id:'pe',k:'P électrique',u:'MWe',m:1,v:s=>fmt(s.Qt*K.MWE,0),zt:s=>rampOn(s)?'rampe '+s.ramp+' %/min':'',sb:s=>s.ilot?'îlotage':s.coupled?(Math.abs(s.LtSet-s.Lt)>0.002?'→ '+fmt(s.LtSet*100,0)+' %':'charge '+fmt(s.Lt*100,0)+' %'):'découplée',sp:{k:'pt',span:2},
   z:s=>s.ilot?chip('warn live','Îlotage'):!s.coupled?chip('off',s.turbTripped?'Déclenchée':'Découplée'):rampOn(s)?chip('live pg tu','→ '+fmt(s.LtSet*100,0)+' %'):chip('off','Charge '+fmt(s.Lt*100,0)+' % stable')},
  {id:'psg',k:'Pression GV',u:'bar',v:s=>fmt(s.Psg,1),sb:s=>s.qa>0.005?'GCT-a ouvert':'GCT-c '+fmt(s.gct/0.85*100,0)+' %',v2:s=>s.qa>0.005?'GCT-a':'GCT-c '+fmt(s.gct/0.85*100,0)+' %',sp:{k:'sg',span:1}},
  {id:'lg',k:'Niveau GV',u:'%',m:1,v:s=>fmt(s.Lsg,0),sb:s=>fmt((s.Wf+s.Wasg)*100,0)+' / '+fmt(s.Wst*100,0)+' %',v2:s=>fmt((s.Wf+s.Wasg)*100,0)+'/'+fmt(s.Wst*100,0),gz:{min:0,max:100,lo:40,hi:60,tr:[15,80],x:s=>s.Lsg},st:s=>s.Lsg<20||s.Lsg>75?'crit':s.Lsg<40||s.Lsg>60?'warn':''}]},
 {g:'saf',t:'Sûreté',c:[
  {id:'dtm',k:'Marge ΔT',u:'%',v:s=>s.tripped?'—':fmt(s.dtMargin,1),sb:s=>'seuil '+fmt(Math.min(s.OTsp,s.OPsp),0)+' %',gz:{min:0,max:30,lo:5,hi:30,tr:[0],x:s=>s.tripped?30:s.dtMargin},st:s=>s.tripped?'':s.dtMargin<3?'crit':s.dtMargin<5?'warn':''},
  {id:'sat',k:'Marge saturation',u:'°C',v:s=>fmt(s.satMargin,1),sb:s=>'Tsat '+fmt(tsat(s.Ppzr),1),gz:{min:0,max:50,lo:15,hi:50,tr:[10],x:s=>s.satMargin},st:s=>s.satMargin<10?'crit':s.satMargin<15?'warn':''}]},
];
const BAND_TIP={pn:'Instrumentation neutronique',td:'Bilan de réactivité',rg:'Grappes de commande',di:'Diagramme de pilotage ΔI',cb:'Bore — RCV / REA',tm:'Courbes clés',th:'Synoptique',pp:'Pressuriseur — RCV',lp:'Pressuriseur — RCV',pe:'Turbine — GCT',psg:'Eau alimentaire — ARE / ASG',lg:'Eau alimentaire — ARE / ASG',dtm:'Protection et sauvegarde',sat:'Chaussette P-T'};
function buildBand(){
  $('#band').innerHTML=BG.map(g=>'<div class="bg" data-g="'+g.g+'" style="--n:'+g.c.length+'"><div class="bgh">'+g.t+'</div><div class="bgc">'+g.c.map(c=>'<div class="rd'+(c.m?' mb':'')+(c.sp?' hsp':'')+(c.z?' hz':'')+(c.dg?' hdg':'')+'" id="rd-'+c.id+'" role="button" tabindex="0" aria-label="'+c.k+' : ouvrir la carte « '+BAND_TIP[c.id]+' »">'+(c.sp?'<div class="bsp" id="sp-'+c.id+'"></div>':'')+(c.dg?'<div class="bdg" id="dg-'+c.id+'"></div>':'')+'<div class="k">'+pic(c.id)+'<span>'+c.k+'</span></div><div class="v"><span id="b-'+(c.vid||c.id)+'">—</span><small>'+c.u+'</small>'+(c.v2?'<em class="v2" id="v2-'+c.id+'"></em>':'')+'</div>'+(c.z?'<div class="z" id="z-'+c.id+'"></div>':'')+'<div class="sb" id="s-'+c.id+'"></div>'+(c.gz?'<div class="gz" id="g-'+c.id+'"><i class="n"></i>'+(c.gz.tr||[]).map(()=>'<i class="t"></i>').join('')+'<b></b></div>':'')+'</div>').join('')+'</div></div>').join('');
  for(const g of BG) for(const c of g.c) if(c.gz){ const z=c.gz, el=document.getElementById('g-'+c.id), pc=v=>clamp((v-z.min)/(z.max-z.min)*100,0,100); [...el.querySelectorAll('.t')].forEach((t,i)=>t.style.left=pc(z.tr[i])+'%'); }
}
function updateBand(s){
  for(const g of BG) for(const c of g.c){
    T('b-'+(c.vid||c.id),c.v(s)); if(c.sb) T('s-'+c.id,c.sb(s)); if(c.v2) T('v2-'+c.id,c.v2(s)); if(c.z) H('z-'+c.id,c.z(s));
    const st=c.st?c.st(s):''; const cell=document.getElementById('rd-'+c.id); cell.classList.toggle('warn',st==='warn'); cell.classList.toggle('crit',st==='crit');
    const zt=c.zt?c.zt(s):'', tip=(c.sb?c.sb(s)+(zt?' · '+zt:'')+' — ':'')+'clic : carte « '+BAND_TIP[c.id]+' »'; if(cell.title!==tip) cell.title=tip;
    if(c.gz){ const z=c.gz, el=document.getElementById('g-'+c.id), pc=v=>clamp((v-z.min)/(z.max-z.min)*100,0,100);
      const lo=typeof z.lo==='function'?z.lo(s):z.lo, hi=typeof z.hi==='function'?z.hi(s):z.hi, n=el.firstChild;
      n.style.left=pc(lo)+'%'; n.style.width=Math.max(0,pc(hi)-pc(lo))+'%'; el.lastChild.style.left=pc(z.x(s))+'%'; }
  }
}
/* courbes derrière les valeurs et mini-diagramme ΔI (toutes les 0,5 s) : 5 min de temps simulé, plus long en accéléré */
function drawBand(){
  const s=A.s; if(!s) return; const H0=s.hist; if(!H0.length) return;
  const win=Math.min(A.speed>=300?7200:A.speed>=60?1800:300,Math.max(30,s.t-H0[0].t)), t0=s.t-win;
  let i0=H0.length-1; while(i0>0&&H0[i0-1].t>=t0) i0--;
  const pts=H0.slice(i0), st=Math.max(1,Math.ceil(pts.length/140)), P=[]; for(let i=0;i<pts.length;i+=st) P.push(pts[i]); if(P[P.length-1]!==pts[pts.length-1]) P.push(pts[pts.length-1]);
  const W=100,Hh=30, X=t=>((t-t0)/win*W).toFixed(1);
  for(const g of BG) for(const c of g.c){
    if(c.sp){ const el=document.getElementById('sp-'+c.id); if(!el||!el.getClientRects().length) continue;
      const k=c.sp.k, k2=c.sp.k2; let mn=Infinity,mx=-Infinity; for(const p of P){ for(const q of [k,k2]) if(q){ const v=p[q]; if(v<mn) mn=v; if(v>mx) mx=v; } }
      if(!Number.isFinite(mn)) continue; if(mx-mn<c.sp.span){ const m=(mx+mn)/2; mn=m-c.sp.span/2; mx=m+c.sp.span/2; } const pd=(mx-mn)*.12; mn-=pd; mx+=pd;
      const Y=v=>(Hh-(clamp((v-mn)/(mx-mn),0,1))*Hh).toFixed(1), ln=P.map(p=>X(p.t)+','+Y(p[k])).join(' ');
      el.innerHTML='<svg viewBox="0 0 '+W+' '+Hh+'" preserveAspectRatio="none" aria-hidden="true"><polygon class="a" points="'+X(P[0].t)+','+Hh+' '+ln+' '+X(P[P.length-1].t)+','+Hh+'"/>'+(k2?'<polyline class="r" points="'+P.map(p=>X(p.t)+','+Y(p[k2])).join(' ')+'"/>':'')+'<polyline class="l" points="'+ln+'"/></svg>'; }
    if(c.dg){ const el=document.getElementById('dg-'+c.id); if(!el||!el.getClientRects().length) continue;
      const Xd=d=>((clamp(d,-15,10)+15)/25*W).toFixed(1), Yp=p=>(Hh-clamp(p,0,110)/110*Hh).toFixed(1);
      const band=[[-5,0],[-6.65,110],[3.35,110],[5,0]].map(([d,p])=>Xd(d)+','+Yp(p)).join(' ');
      const n=Math.min(H0.length,3600), tr=[]; for(let i=H0.length-n;i<H0.length;i+=30) tr.push(Xd(H0[i].di)+','+Yp(H0[i].pn));
      const ok=Math.abs(s.DI+1.5*s.n)<=5;
      el.innerHTML='<svg viewBox="0 0 '+W+' '+Hh+'" preserveAspectRatio="none" aria-hidden="true"><polygon class="ok" points="'+band+'"/><line class="ax" x1="'+Xd(0)+'" x2="'+Xd(0)+'" y1="0" y2="'+Hh+'"/><polyline class="tr" points="'+tr.join(' ')+'"/><path class="pt'+(ok?'':' out')+'" d="M'+Xd(s.DI)+' '+Yp(s.n*100)+'l0 .01"/></svg>'; }
  }
}
