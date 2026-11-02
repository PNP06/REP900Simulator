/* Bandeau du haut : pictogrammes, cases de grandeurs, mini-courbes et jauges. */
'use strict';

/* ================= Bandeau ================= */
/* Chaque case : pictogramme et libellé (forme courte ks si la place manque), valeur, courbe des dernières minutes sous la valeur (sp), une ligne d'état (z : puces, mode, mini-diagramme),
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
  {id:'pn',ks:'P nucl.',k:'P nucléaire',u:'%',m:1,v:s=>s.n<1e-5?sciTxt(s.n*100):s.n<0.001?fmt(s.n*100,3):fmt(s.n*100,1),sb:s=>s.coupled?'turb. '+fmt(s.Qt*100,0)+' %':(s.tripped?'résid. '+fmt(s.Qdh*100,1)+' %':'découplée'),gz:{min:0,max:120,lo:0,hi:103,tr:[109],x:s=>s.n*100},st:s=>s.n>1.09?'crit':s.n>1.03?'warn':'',sp:{k:'pn',k2:'pt',span:2}},
  {id:'td',ks:'Réactiv.',vid:'rho',k:'Réactivité',u:'pcm',m:1,v:s=>sgn(s.rho.tot,0),sb:s=>'Td '+TdS(s),v2:s=>'Td '+TdS(s),st:s=>s.tripped?'':s.Td<12?'crit':s.Td<30?'warn':'',z:s=>{ const r=clamp(s.rho.tot,-60,60), w=Math.abs(r)/60*50; return '<span class="ctr"><i class="ok"></i><i class="b" style="left:'+(r<0?50-w:50)+'%;width:'+w+'%"></i><i class="o"></i></span>'; }},
  {id:'rg',ks:'R · GCP',vid:'r',k:'Groupe R · GCP',u:'pas',v:s=>fmt(s.rods.R.p,0),sb:s=>'GCP '+fmt(s.rods.G.p,0),v2:s=>'GCP '+fmt(s.rods.G.p,0),gz:{min:0,max:225,lo:150,hi:215,x:s=>s.rods.R.p},st:s=>!s.tripped&&s.coupled&&(s.rods.R.p<130)?'crit':!s.tripped&&s.coupled&&(s.rods.R.p<150||s.rods.R.p>215)?'warn':'',
   z:s=>{ const r=s.rods.R, mv=Math.abs(r.tg-r.p)>0.4?(r.tg>r.p?' ▲':' ▼'):''; return s.tripped?chip('cr','En bas'):'<span class="pill'+(s.modeR==='man'?' man':'')+'" title="Groupe R en '+(s.modeR==='man'?'manuel':'automatique')+'">R '+(s.modeR==='man'?'man.':'auto')+mv+'</span><span class="pill'+(s.modeG==='man'?' man':'')+'" title="GCP en '+(s.modeG==='man'?'manuel':'automatique')+'">GCP '+(s.modeG==='man'?'man.':'auto')+'</span>'; }},
  {id:'di',k:'ΔI (% PN)',ks:'ΔI',u:'% PN',v:s=>fmt(s.DI,1),sb:s=>'écart '+sgn(s.DI+1.5*s.n,1),v2:s=>'écart '+sgn(s.DI+1.5*s.n,1),gz:{min:-10,max:10,lo:-5,hi:5,x:s=>s.DI+1.5*s.n},st:s=>!s.tripped&&s.n>0.15&&Math.abs(s.DI+1.5*s.n)>5?'warn':'',dg:1},
  {id:'cb',k:'Bore',u:'ppm',m:1,v:s=>fmt(s.Cb,0),sb:s=>'α '+fmt(s.rho.am,1),
   z:s=>{ if(s.reaIsol) return chip('warn','REA isolé'); if(s.rea.run){ const d=s.rea.mode==='dil'; return chip('live pg '+(d?'dil':'bor'),(d?'Dil. ':'Bor. ')+fmt(s.rea.v*1000,0)+(s.rea.vt===Infinity?' L':'/'+fmt(s.rea.vt*1000,0)),null,s.rea.vt===Infinity?null:clamp(s.rea.v/s.rea.vt,0,1)); }
    if(s.Qdil>0) return chip('warn live','Eau d\'appoint '+fmt(s.Qdil,0)+' m³/h'); return chip('off','Arrêt'); }}]},
 {g:'prim',t:'Primaire',c:[
  {id:'tm',k:'Tmoy',u:'°C',m:1,v:s=>fmt(s.Tavg,1),sb:s=>s.coupled?'écart '+sgn(s.Tavg-s.Tref,1):'pas de Tref',v2:s=>s.coupled?sgn(s.Tavg-s.Tref,1):'',gz:{min:-5,max:5,lo:-1.5,hi:1.5,x:s=>s.coupled?s.Tavg-s.Tref:0},st:s=>s.coupled&&!s.tripped&&Math.abs(s.Tavg-s.Tref)>3?'crit':s.coupled&&!s.tripped&&Math.abs(s.Tavg-s.Tref)>1.5?'warn':'',sp:{k:'ta',k2:'tr',span:1}},
  {id:'th',k:'Tch · Tfr',u:'°C',v:s=>fmt(s.Thot,1),sb:s=>'Tfr '+fmt(s.Tcold,1),v2:s=>'Tfr '+fmt(s.Tcold,1),sp:{k:'th',span:1}},
  {id:'pp',ks:'P pressu',k:'Pression pressu',u:'bar',m:1,v:s=>fmt(s.Ppzr,1),sb:s=>s.sebim?'SEBIM !':'cons. 155',gz:{min:125,max:170,lo:152,hi:157.5,tr:[131,165],x:s=>s.Ppzr},st:s=>s.Ppzr>164||s.Ppzr<132?'crit':s.Ppzr>157.5||s.Ppzr<152?'warn':'',sp:{k:'pp',span:1},
   z:s=>s.sebim?chip('cr live','SEBIM ouvertes'):chip(s.hEff>0.04?'heat':'off',fmt(s.hEff*100,0),'heat')+chip(s.spray>0.005?'spr':'off',fmt(s.spray*100,0),'spr'),zt:s=>'Chaufferettes '+fmt(s.hEff*1440,0)+' kW · aspersion '+fmt(s.spray*100,0)+' %'},
  {id:'lp',ks:'Niv. pressu',k:'Niveau pressu',u:'%',m:1,v:s=>fmt(s.Lpzr,0),sb:s=>'réf. '+fmt(s.Lref,0)+' %',v2:s=>'réf. '+fmt(s.Lref,0),gz:{min:0,max:100,lo:s=>s.Lref-5,hi:s=>s.Lref+5,tr:[14,92],x:s=>s.Lpzr},st:s=>s.Lpzr<15||s.Lpzr>90?'crit':Math.abs(s.Lpzr-s.Lref)>5?'warn':''}]},
 {g:'sec',t:'Secondaire',c:[
  {id:'pe',ks:'P élec.',k:'P électrique',u:'MWe',m:1,v:s=>fmt(s.Qt*K.MWE,0),zt:s=>rampOn(s)?'rampe '+s.ramp+' %/min':'',sb:s=>s.ilot?'îlotage':s.coupled?(Math.abs(s.LtSet-s.Lt)>0.002?'→ '+fmt(s.LtSet*100,0)+' %':'charge '+fmt(s.Lt*100,0)+' %'):'découplée',sp:{k:'pt',span:2},
   z:s=>s.ilot?chip('warn live','Îlotage'):!s.coupled?chip('off',s.turbTripped?'Déclenchée':'Découplée'):rampOn(s)?chip('live pg tu','→ '+fmt(s.LtSet*100,0)+' %'):chip('off','Stable à '+fmt(s.Lt*100,0)+' %')},
  {id:'psg',ks:'P GV',k:'Pression GV',u:'bar',v:s=>fmt(s.Psg,1),sb:s=>s.qa>0.005?'GCT-a ouvert':'GCT-c '+fmt(s.gct/0.85*100,0)+' %',v2:s=>s.qa>0.005?'GCT-a':'GCT-c '+fmt(s.gct/0.85*100,0)+' %',sp:{k:'sg',span:1}},
  {id:'lg',ks:'Niv. GV',k:'Niveau GV',u:'%',m:1,v:s=>fmt(s.Lsg,0),sb:s=>fmt((s.Wf+s.Wasg)*100,0)+' / '+fmt(s.Wst*100,0)+' %',v2:s=>fmt((s.Wf+s.Wasg)*100,0)+'/'+fmt(s.Wst*100,0),gz:{min:0,max:100,lo:40,hi:60,tr:[15,80],x:s=>s.Lsg},st:s=>s.Lsg<20||s.Lsg>75?'crit':s.Lsg<40||s.Lsg>60?'warn':''}]},
 {g:'saf',t:'Sûreté',c:[
  {id:'dtm',k:'Marge ΔT',u:'%',v:s=>s.tripped?'—':fmt(s.dtMargin,1),sb:s=>'seuil '+fmt(Math.min(s.OTsp,s.OPsp),0)+' %',gz:{min:0,max:30,lo:5,hi:30,tr:[0],x:s=>s.tripped?30:s.dtMargin},st:s=>s.tripped?'':s.dtMargin<3?'crit':s.dtMargin<5?'warn':''},
  {id:'sat',ks:'Marge sat.',k:'Marge saturation',u:'°C',v:s=>s.era79?'—':fmt(s.satMargin,1),sb:s=>s.era79?'non affichée en 1979':'Tsat '+fmt(tsat(s.Ppzr),1),gz:{min:0,max:50,lo:15,hi:50,tr:[10],x:s=>s.era79?50:s.satMargin},st:s=>s.era79?'':s.satMargin<10?'crit':s.satMargin<15?'warn':''}]},
];
const BAND_TIP={pn:'Instrumentation neutronique',td:'Bilan de réactivité',rg:'Grappes de commande',di:'Diagramme de pilotage ΔI',cb:'Bore — RCV / REA',tm:'Courbes clés',th:'Synoptique',pp:'Pressuriseur — RCV',lp:'Pressuriseur — RCV',pe:'Turbine — GCT',psg:'Eau alimentaire — ARE / ASG',lg:'Eau alimentaire — ARE / ASG',dtm:'Protection et sauvegarde',sat:'Chaussette P-T'};
function buildBand(){
  $('#band').innerHTML=BG.map(g=>'<div class="bg" data-g="'+g.g+'" style="--n:'+g.c.length+'"><div class="bgh">'+g.t+'</div><div class="bgc">'+g.c.map(c=>'<div class="rd'+(c.m?' mb':'')+(c.sp?' hsp':'')+(c.z?' hz':'')+(c.dg?' hdg':'')+'" id="rd-'+c.id+'" role="button" tabindex="0" aria-label="'+c.k+' : ouvrir la carte « '+BAND_TIP[c.id]+' »">'+(c.sp?'<div class="bsp" id="sp-'+c.id+'"></div>':'')+(c.dg?'<div class="bdg" id="dg-'+c.id+'"></div>':'')+'<div class="k">'+pic(c.id)+'<span'+(c.ks?' data-ks="'+c.ks+'"':'')+'>'+c.k+'</span></div><div class="v"><span class="vu"><span id="b-'+(c.vid||c.id)+'">—</span><small>'+c.u+'</small></span>'+(c.v2?'<em class="v2" id="v2-'+c.id+'"></em>':'')+'</div>'+(c.z?'<div class="z" id="z-'+c.id+'"></div>':'')+'<div class="sb" id="s-'+c.id+'"></div>'+(c.gz?'<div class="gz" id="g-'+c.id+'"><i class="n"></i>'+(c.gz.tr||[]).map(()=>'<i class="t"></i>').join('')+'<b></b></div>':'')+'</div>').join('')+'</div></div>').join('');
  for(const g of BG) for(const c of g.c) if(c.gz){ const z=c.gz, el=document.getElementById('g-'+c.id), pc=v=>clamp((v-z.min)/(z.max-z.min)*100,0,100); [...el.querySelectorAll('.t')].forEach((t,i)=>t.style.left=pc(z.tr[i])+'%'); }
  fitBand();
}
/* libellé complet quand il tient, forme courte sinon (le libellé complet reste dans l'info-bulle et pour les lecteurs d'écran) */
function fitBand(){
  for(const g of BG) for(const c of g.c){ if(!c.ks) continue; const sp=document.querySelector('#rd-'+c.id+' .k span'); if(!sp) continue;
    sp.textContent=c.k; const w=sp.getBoundingClientRect().width; if(!w) continue;
    const rg=document.createRange(); rg.selectNodeContents(sp); if(rg.getBoundingClientRect().width>w+0.05) sp.textContent=c.ks; }
}
function updateBand(s){
  for(const g of BG) for(const c of g.c){
    T('b-'+(c.vid||c.id),c.v(s)); if(c.sb) T('s-'+c.id,c.sb(s)); if(c.v2) T('v2-'+c.id,c.v2(s)); if(c.z) H('z-'+c.id,c.z(s));
    const st=c.st?c.st(s):''; const cell=document.getElementById('rd-'+c.id); cell.classList.toggle('warn',st==='warn'); cell.classList.toggle('crit',st==='crit');
    const zt=c.zt?c.zt(s):'', tip=c.k+' · '+(c.sb?c.sb(s)+(zt?' · '+zt:'')+' — ':'')+'clic : carte « '+BAND_TIP[c.id]+' »'; if(cell.title!==tip) cell.title=tip;
    if(c.gz){ const z=c.gz, el=document.getElementById('g-'+c.id), pc=v=>clamp((v-z.min)/(z.max-z.min)*100,0,100);
      const lo=typeof z.lo==='function'?z.lo(s):z.lo, hi=typeof z.hi==='function'?z.hi(s):z.hi, n=el.firstChild;
      n.style.left=pc(lo)+'%'; n.style.width=Math.max(0,pc(hi)-pc(lo))+'%'; el.lastChild.style.left=pc(z.x(s))+'%'; }
  }
}
/* mini-courbes sous les valeurs (derrière sur téléphone) et mini-diagramme ΔI (toutes les 0,5 s) : 5 min de temps simulé, plus long en accéléré */
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
