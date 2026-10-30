/* Synoptique de la tranche : équipements en gris, couleur réservée aux états, valeurs dans des étiquettes ; un clic sur un équipement ouvre ses actions rapides. */
'use strict';
/* équipements cliquables : titre et famille de commandes */
const SYC={
  core:{t:'Cuve, cœur et grappes',fam:'core',card:'rods'}, pzr:{t:'Pressuriseur',fam:'prim',card:'pzr'}, rcv:{t:'Bore, appoint REA et RCV',fam:'core',card:'bore'},
  gv:{t:'Générateurs de vapeur',fam:'sec',card:'are'}, turb:{t:'Turbine et alternateur',fam:'sec',card:'turb'}, gct:{t:'Contournement turbine (GCT)',fam:'sec',card:'turb'},
  are:{t:'Eau alimentaire ARE',fam:'sec',card:'are'}, asg:{t:'Alimentation de secours ASG',fam:'sec',card:'are'}, pump:{t:'Pompes primaires GMPP',fam:'saf',card:'prot'}, is:{t:'Injection de sécurité',fam:'saf',card:'prot'}
};
/* étiquettes : id, x, y, largeur, libellé, équipement */
const SYT=[
 ['rods',8,150,104,'Groupe R','core'],['pn',8,214,104,'P nucléaire','core'],['cb',8,262,104,'Bore','rcv'],['rea',8,486,118,'Appoint REA','rcv'],
 ['th',222,196,104,'Tch','core'],['tm',222,282,104,'Tmoy · écart','core'],['tf',222,362,104,'Tfr','core'],
 ['pp',378,34,112,'Pression pressu','pzr'],['lp',378,74,112,'Niveau / réf.','pzr'],['hs',378,114,140,'Chauff. · asp.','pzr'],
 ['psg',530,196,112,'Pression GV','gv'],['lg',530,236,112,'Niveau GV','gv'],['wf',530,276,112,'Eau / vapeur','gv'],
 ['gctc',698,206,122,'GCT-c condenseur','gct'],['gcta',530,96,116,'GCT-a atmosphère','gct'],
 ['pe',852,110,128,'P électrique','turb'],['ch',852,150,128,'Charge','turb'],
 ['are',652,560,112,'ARE · TPA','are'],['asg',530,404,128,'ASG','asg'],
 ['rcv',296,566,160,'RCV charge · décharge','rcv'],['is',466,566,150,'IS','is']
];
const SYR=[['S','SD'],['G1','G'],['G2','G'],['N1','G'],['N2','G'],['R','R']];
function synSVG(){
  const tg=([id,x,y,w,lb,c])=>'<g class="stg" id="sy-'+id+'" data-sy="'+c+'" role="button" tabindex="0" aria-label="'+lb+' : actions rapides"><rect x="'+x+'" y="'+y+'" width="'+w+'" height="34" rx="4"/><text x="'+(x+7)+'" y="'+(y+12)+'" class="tl">'+lb+'</text><text x="'+(x+7)+'" y="'+(y+28)+'" class="tv" id="sv-'+id+'">—</text></g>';
  const rods=SYR.map(([n,k],i)=>{ const x=128+i*12; return '<rect x="'+x+'" y="206" width="7" height="200" rx="2" class="eqh"/><rect class="rod" data-k="'+k+'" x="'+x+'" y="206" width="7" height="0" rx="2"/><text x="'+(x+3.5)+'" y="200" text-anchor="middle" class="tiny">'+n+'</text>'; }).join('')
   +'<text x="131.5" y="420" text-anchor="middle" class="tiny num" id="sy-pS">—</text><text x="170" y="420" text-anchor="middle" class="tiny num" id="sy-pG">—</text><text x="203.5" y="420" text-anchor="middle" class="tiny num" id="sy-pR">—</text>';
  const pump=(x,y,id,lb)=>'<g class="pmp" id="'+id+'"><circle cx="'+x+'" cy="'+y+'" r="9"/><path d="M'+(x-4)+' '+(y+4)+' L'+x+' '+(y-5)+' L'+(x+4)+' '+(y+4)+'z"/>'+(lb?'<text x="'+x+'" y="'+(y+21)+'" text-anchor="middle" class="tiny">'+lb+'</text>':'')+'</g>';
  const vlv=(x,y,id,vert)=>'<path class="vlv" id="'+id+'" d="'+(vert?'M'+(x-6)+' '+(y-7)+' L'+(x+6)+' '+(y-7)+' L'+(x-6)+' '+(y+7)+' L'+(x+6)+' '+(y+7)+'z':'M'+(x-7)+' '+(y-6)+' L'+(x-7)+' '+(y+6)+' L'+(x+7)+' '+(y-6)+' L'+(x+7)+' '+(y+6)+'z')+'"/>';
  const ln=(id,cls,d)=>'<path class="ln '+cls+'" id="sp-'+id+'" d="'+d+'"/><path class="flow" id="sf-'+id+'" d="'+d+'"/>';
  return '<svg class="syn2" viewBox="0 0 990 610" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Synoptique de la tranche : cliquez un équipement pour ses actions rapides">'
  +ln('hot','hot','M212 250 H340 V210 H434')+'<path class="ln hot thin" d="M340 210 V156"/>'
  +ln('cold','cold','M454 488 V520 H262 V420 H212')
  +ln('st','steam','M488 182 V170 H690 V96 H730')
  +'<g class="comp" data-sy="gct"><rect class="hl" x="590" y="70" width="126" height="320" rx="6"/>'+ln('gctc','steam thin','M690 170 V360 H738')+vlv(690,300,'sv-vgctc',true)+ln('gcta','steam thin','M610 170 V136')+vlv(610,150,'sv-vgcta',true)+'</g>'
  +'<path class="ln steam thin" d="M780 128 V340"/>'
  +ln('are','feed','M790 380 V540 H600 V440 H516')
  +'<g class="comp" data-sy="asg"><rect class="hl" x="516" y="396" width="132" height="62" rx="6"/>'+ln('asg','feed thin','M560 452 V458 H516')+'</g>'
  +ln('dech','bore thin','M262 470 H242 V575 H232')+ln('chg','bore thin','M290 590 H300 V520')+ln('rea','bore thin','M126 522 H140 V578 H170')
  +'<g class="comp" data-sy="is"><rect class="hl" x="360" y="526" width="234" height="80" rx="6"/>'+ln('is','isl thin','M470 583 H360 V520')+vlv(410,583,'sv-vis',false)+'</g>'
  +'<g class="comp" data-sy="core"><rect class="hl" x="112" y="160" width="106" height="270" rx="12"/><rect x="118" y="168" width="92" height="320" rx="40" class="eq"/><rect x="124" y="300" width="80" height="106" rx="4" class="core" id="sy-coreR"/>'+rods+'<text x="164" y="156" text-anchor="middle" class="nm">Cuve</text></g>'
  +'<g class="comp" data-sy="pzr"><rect class="hl" x="310" y="14" width="64" height="146" rx="12"/><rect x="318" y="44" width="44" height="108" rx="20" class="eq"/><rect x="320" y="100" width="40" height="50" rx="4" class="lvl" id="sy-pzL"/><path class="ln thin" id="sp-seb" d="M340 44 V26"/>'+vlv(340,30,'sv-vseb',true)+'<text x="352" y="22" class="tiny" id="sy-seb">SEBIM</text><text x="340" y="172" text-anchor="middle" class="nm">Pressu</text></g>'
  +'<g class="comp" data-sy="gv"><rect class="hl" x="426" y="170" width="94" height="326" rx="20"/><rect x="434" y="182" width="78" height="306" rx="36" class="eq"/><rect x="440" y="300" width="66" height="160" rx="8" class="lvl sec" id="sy-gvL"/><path d="M452 470 V250 a21 21 0 0 1 42 0 V470" class="tube"/><text x="473" y="508" text-anchor="middle" class="nm">GV ×3</text></g>'
  +'<g class="comp" data-sy="turb"><rect class="hl" x="722" y="58" width="262" height="136" rx="8"/><path d="M730 68 L800 82 V114 L730 128 Z" class="eq"/><line x1="800" y1="98" x2="830" y2="98" class="shaft"/><circle cx="850" cy="98" r="20" class="eq"/><text x="850" y="103" text-anchor="middle" class="nm" style="font-size:14px">~</text><line x1="870" y1="98" x2="930" y2="98" class="shaft" id="sy-res"/><rect x="896" y="92" width="10" height="12" class="brk" id="sy-brk"/><text x="934" y="102" class="tiny" id="sy-grid">Réseau</text><text x="765" y="56" text-anchor="middle" class="nm">Turbine</text></g>'
  +'<rect x="738" y="340" width="104" height="40" rx="6" class="eq"/><text x="790" y="364" text-anchor="middle" class="nm">Condenseur</text>'
  +'<g class="comp" data-sy="are"><rect class="hl" x="572" y="522" width="76" height="40" rx="16"/>'+pump(588,540,'sy-tpa0','A')+pump(632,540,'sy-tpa1','B')+'<text x="610" y="516" text-anchor="middle" class="tiny" id="sy-apd"></text></g>'
  +'<g class="comp" data-sy="pump"><rect class="hl" x="300" y="506" width="76" height="46" rx="14"/>'+pump(316,520,'sy-gm0')+pump(338,520,'sy-gm1')+pump(360,520,'sy-gm2')+'<text x="338" y="548" text-anchor="middle" class="tiny" id="sy-gmt">GMPP 1 · 2 · 3</text></g>'
  +'<g class="comp" data-sy="rcv"><rect class="hl" x="166" y="560" width="124" height="44" rx="6"/><rect x="172" y="566" width="112" height="32" rx="5" class="eq"/><text x="228" y="587" text-anchor="middle" class="nm">RCV</text></g>'
  +SYT.map(tg).join('')+'</svg>';
}
function buildSyn(){ const w=$('#synw'); if(w&&!w.firstElementChild) w.innerHTML=synSVG(); }
const SY={pal:null,at:null};
function sTag(id,txt,st){ const g=document.getElementById('sy-'+id); if(!g) return; T('sv-'+id,txt); const c='stg'+(st?' '+st:'')+(SY.pal&&g.dataset.sy===SY.pal?' on':''); if(g.getAttribute('class')!==c) g.setAttribute('class',c); }
function sLine(id,on,red){ const p=document.getElementById('sp-'+id), f=document.getElementById('sf-'+id); if(p){ p.classList.toggle('off',!on); p.classList.toggle('alarm',!!(on&&red)); } if(f) f.classList.toggle('off',!on); }
function sVlv(id,open,red){ const v=document.getElementById('sv-v'+id); if(!v) return; v.classList.toggle('open',!!open); v.classList.toggle('alarm',!!(open&&red)); }
function updSyn(s){
  const w=$('#synw'); if(!w||!w.getClientRects().length) return;
  const R=s.rods, mv=b=>Math.abs(b.tg-b.p)>0.4?(b.tg>b.p?' ▲':' ▼'):'';
  $$('#synw .rod').forEach(e=>{ const p=R[e.dataset.k].p; e.setAttribute('height',((225-p)/225*200).toFixed(1)); });
  T('sy-pS',fmt(R.SD.p,0)); T('sy-pG',fmt(R.G.p,0)); T('sy-pR',fmt(R.R.p,0));
  sTag('rods',s.tripped?'en bas':fmt(R.R.p,0)+' pas'+mv(R.R)+(s.modeR==='man'?' MAN':''),s.tripped?'crit':s.coupled&&R.R.p<130?'crit':(s.coupled&&(R.R.p<150||R.R.p>215))||s.modeR==='man'?'warn':'');
  sTag('pn',(s.n<0.001?fmt(s.n*100,3):s.n<0.1?fmt(s.n*100,2):fmt(s.n*100,1))+' %',s.n>1.09?'crit':s.n>1.03?'warn':'');
  sTag('cb',fmt(s.Cb,0)+' ppm','');
  const app=s.Qdil+s.Qbor>0;
  sTag('rea',s.reaIsol?'isolé':s.rea.run?(s.rea.mode==='dil'?'Dil. ':'Bor. ')+fmt(s.rea.v*1000,0)+(s.rea.vt===Infinity?' L':'/'+fmt(s.rea.vt*1000,0)+' L'):s.Qdil>0?'eau '+fmt(s.Qdil,0)+' m³/h':'arrêt',s.reaIsol?'warn':s.rea.run?'info':s.Qdil>0?'warn':''); sLine('rea',app);
  sTag('th',fmt(s.Thot,1)+' °C',''); sTag('tf',fmt(s.Tcold,1)+' °C','');
  const dT=s.Tavg-s.Tref, cpl=s.coupled&&!s.tripped; sTag('tm',fmt(s.Tavg,1)+(s.coupled?' ('+sgn(dT,1)+')':''),cpl&&Math.abs(dT)>3?'crit':cpl&&Math.abs(dT)>1.5?'warn':'');
  sTag('pp',fmt(s.Ppzr,1)+' bar',s.Ppzr>164||s.Ppzr<132?'crit':s.Ppzr>157.5||s.Ppzr<152?'warn':'');
  sTag('lp',fmt(s.Lpzr,0)+' / '+fmt(s.Lref,0)+' %',s.Lpzr<15||s.Lpzr>90?'crit':Math.abs(s.Lpzr-s.Lref)>5?'warn':'');
  const hsMan=s.heatMode!=='auto'||s.sprayMode==='man'||s.sprayIsol;
  sTag('hs',fmt(s.hEff*1440,0)+' kW · '+fmt(s.spray*100,0)+' %'+(hsMan?' MAN':''),hsMan?'warn':'');
  sVlv('seb',s.sebim,1); sLine('seb',s.sebim,1); const sb=$('#sy-seb'); sb.classList.toggle('al',!!s.sebim); T('sy-seb',s.sebim?'SEBIM OUVERTES':'SEBIM');
  const pz=clamp(s.Lpzr,0,100)*.5; $('#sy-pzL').setAttribute('y',(150-pz).toFixed(1)); $('#sy-pzL').setAttribute('height',pz.toFixed(1));
  sTag('psg',fmt(s.Psg,1)+' bar',s.qa>0.005?'warn':'');
  sTag('lg',fmt(s.Lsg,0)+' %',s.Lsg<20||s.Lsg>75?'crit':s.Lsg<40||s.Lsg>60?'warn':'');
  const win=(s.Wf+s.Wasg)*100, wst=s.Wst*100; sTag('wf',fmt(win,0)+' / '+fmt(wst,0)+' %',Math.abs(win-wst)>8?'warn':'');
  const gv=clamp(s.Lsg,0,100)*2.6; $('#sy-gvL').setAttribute('y',(460-gv).toFixed(1)); $('#sy-gvL').setAttribute('height',gv.toFixed(1));
  sTag('pe',s.coupled?fmt(s.Qt*K.MWE,0)+' MWe':s.turbTripped?'déclenchée':'découplée',s.ilot?'warn':s.turbTripped?'crit':'');
  const rmp=s.coupled&&!s.ilot&&Math.abs(s.LtSet-s.Lt)>0.002;
  sTag('ch',s.ilot?'îlotage '+fmt(s.Lt*100,0)+' %':s.coupled?fmt(s.Lt*100,0)+' %'+(rmp?' → '+fmt(s.LtSet*100,0)+' %':''):'—',s.ilot?'warn':rmp?'info':'');
  $('#sy-res').classList.toggle('off',!s.grid); $('#sy-brk').setAttribute('class','brk'+(s.coupled&&!s.ilot?' on':'')); T('sy-grid',s.grid?'Réseau':'Réseau ✕'); $('#sy-grid').classList.toggle('al',!s.grid);
  sLine('st',s.Wst>0.005||s.gct>0.02); sLine('hot',s.pumps.some(Boolean)); sLine('cold',s.pumps.some(Boolean));
  const gc=s.gct>0.02; sLine('gctc',gc); sVlv('gctc',gc); sTag('gctc',gc?fmt(s.gct/0.85*100,0)+' % · mode '+(s.coupled?'T':'P'):'fermé',gc?'info':'');
  const ga=s.qa>0.005; sLine('gcta',ga,1); sVlv('gcta',ga,1); sTag('gcta',ga?fmt(s.qa*100,1)+' % vapeur':'fermé',ga?'crit':'');
  const tp=s.tpa.filter(Boolean).length; sLine('are',s.Wf>0.005); sTag('are',(s.areIsol?'isolée':fmt(s.Wf*100,0)+' %')+(tp<2?' · '+tp+' TPA':'')+(s.areMode==='man'?' MAN':''),s.areIsol||tp<2?'crit':s.areMode==='man'?'warn':'');
  s.tpa.forEach((on,i)=>$('#sy-tpa'+i).classList.toggle('off',!on)); T('sy-apd',s.apd?'APD en service':'');
  sLine('asg',s.asg,1); sTag('asg',s.asg?'service '+fmt(s.Wasg*100,1)+' %':'prête',s.asg?'crit':'');
  sLine('is',s.is,1); sVlv('is',s.is,1); sTag('is',s.is?'service '+fmt(s.Qis,0)+' m³/h':'prête',s.is?'crit':'');
  const np=s.pumps.filter(Boolean).length; s.pumps.forEach((on,i)=>$('#sy-gm'+i).classList.toggle('off',!on)); T('sy-gmt','GMPP '+np+'/3'); $('#sy-gmt').classList.toggle('al',np<3);
  sLine('chg',s.Qc>0.05); sLine('dech',s.Qld>0.05);
  sTag('rcv',fmt(s.Qc,1)+' · '+(s.Qld>0?fmt(s.Qld,1)+' m³/h':'isolée'),s.Qc>28?'warn':s.chgMode==='man'||s.Qld===0?'warn':'');
  $('#sy-coreR').style.opacity=(0.22+0.73*clamp(s.Qcore,0,1)).toFixed(2);
  $$('#synw .comp').forEach(g=>g.classList.toggle('on',g.dataset.sy===SY.pal));
  if(SY.pal) palUpd();
}

/* ===== actions rapides : mêmes commandes que les cartes (data-act, data-key), curseurs reliés aux curseurs des cartes ===== */
const sgH=(key,opts)=>'<div class="seg" data-key="'+key+'">'+opts.map(([v,t])=>'<button data-v="'+v+'">'+t+'</button>').join('')+'</div>';
const btH=(a,t,v,cls)=>'<button class="btn sm'+(cls?' '+cls:'')+'" data-act="'+a+'"'+(v!=null?' data-v="'+v+'"':'')+'>'+t+'</button>';
const rgH=(src,lb)=>{ const r=$(src); return '<div class="sl"><span class="lbl">'+lb+'</span><input type="range" data-rng="'+src+'" min="'+r.min+'" max="'+r.max+'" step="'+r.step+'" value="'+r.value+'" aria-label="'+r.getAttribute('aria-label')+'"><output class="num" data-rngo="'+src+'">'+$(src+'O').textContent+'</output></div>'; };
const rowH=(lb,h)=>'<div class="row"><span class="lbl pl">'+lb+'</span>'+h+'</div>';
const kvH=a=>'<div class="pkv">'+a.map(([k,v])=>'<span>'+k+' <b>'+v+'</b></span>').join('')+'</div>';
const PALB={
  core:{kv:s=>kvH([['S',fmt(s.rods.SD.p,0)],['GCP',fmt(s.rods.G.p,0)],['R',fmt(s.rods.R.p,0)],['ρ',sgn(s.rho.tot,0)+' pcm']].concat(s.tripped?[['AAR',s.tripCause]]:[])),
   ctl:s=>(s.tripped?rowH('AAR',btH('aarWhy','Pourquoi ?')+btH('rearm','Réarmer l\'AAR')):'')
    +rowH('Mode R',sgH('modeR',[['auto','Auto'],['man','Manuel']]))+rowH('Mode GCP',sgH('modeG',[['auto','Auto'],['man','Manuel']]))
    +rowH('Groupe',['SD','G','R'].map(b=>'<button class="btn sm'+(s.rodSel===b?' on':'')+'" data-act="rodSel" data-v="'+b+'">'+{SD:'S',G:'GCP',R:'R'}[b]+'</button>').join(''))
    +rowH('Bouger',btH('rod','−10','-10')+btH('rod','−1','-1')+btH('rodStop','Stop',null,'amber')+btH('rod','+1','1')+btH('rod','+10','10'))},
  rcv:{kv:s=>kvH([['Cb',fmt(s.Cb,0)+' ppm'],['Appoint',$('#c-rea').textContent],['Charge',fmt(s.Qc,1)+' m³/h'],['Décharge',s.Qld>0?fmt(s.Qld,1)+' m³/h':'isolée']]),
   ctl:s=>rowH('Mode',sgH('reaMode',[['dil','Dilution'],['bor','Borication']]))+rowH('Débit',sgH('reaQ',[['2','2'],['5','5'],['10','10'],['20','20'],['30','30']])+'<span class="lbl">m³/h</span>')
    +rowH('Volume',sgH('reaV',[['0.1','100 L'],['0.3','300 L'],['1','1 m³'],['3','3 m³'],['inf','Continu']]))
    +rowH('Appoint',btH('reaStart','Lancer','', 'pri')+btH('reaStop','Arrêter')+btH('reaIsol',s.reaIsol?'Rétablir REA':'Isoler REA',null,'amber'))
    +rowH('Charge',sgH('chgMode',[['auto','Auto'],['man','Manuel']])+btH('ldIsol',s.ldIsolMan?'Rétablir décharge':'Isoler décharge',null,'amber'))+rgH('#chgMan','Charge man.')},
  pzr:{kv:s=>kvH([['P',fmt(s.Ppzr,1)+' bar'],['Niv.',fmt(s.Lpzr,0)+' / '+fmt(s.Lref,0)+' %'],['Chauff.',fmt(s.hEff*1440,0)+' kW'],['Asp.',fmt(s.spray*100,0)+' %'],['SEBIM',s.sebim?'ouvertes':'fermées']]),
   ctl:s=>rowH('Chaufferettes',sgH('heatMode',[['auto','Auto'],['on','Forcé'],['off','Arrêt']]))
    +rowH('Aspersion',sgH('sprayMode',[['auto','Auto'],['man','Manuel']])+btH('sprayIsol',s.sprayIsol?'Rétablir':'Isoler',null,'amber'))+rgH('#sprayMan','Asp. man.')},
  gv:{kv:s=>kvH([['Niveau',fmt(s.Lsg,1)+' %'],['ARE',fmt(s.Wf*100,0)+' %'],['Vapeur',fmt(s.Wst*100,0)+' %'],['P GV',fmt(s.Psg,1)+' bar']]),
   ctl:s=>rowH('Régul. ARE',sgH('areMode',[['auto','Auto'],['man','Manuel']]))+rgH('#areMan','Débit man.')+rowH('ASG',btH('asg',s.asg?'Arrêter ASG':'Démarrer ASG'))},
  are:{kv:s=>kvH([['TPA A',s.tpa[0]?'en service':'arrêtée'],['TPA B',s.tpa[1]?'en service':'arrêtée'],['APD',s.apd?'en service':'arrêt'],['ARE',fmt(s.Wf*100,0)+' %']]),
   ctl:s=>rowH('APD',btH('apd',s.apd?'Arrêter APD':'Démarrer APD'))+rowH('Régul. ARE',sgH('areMode',[['auto','Auto'],['man','Manuel']]))+rgH('#areMan','Débit man.')},
  asg:{kv:s=>kvH([['ASG',s.asg?'en service, '+fmt(s.Wasg*100,1)+' %':'prête'],['Niveau GV',fmt(s.Lsg,1)+' %']]),ctl:s=>rowH('ASG',btH('asg',s.asg?'Arrêter ASG':'Démarrer ASG'))},
  turb:{kv:s=>kvH([['Turbine',$('#c-tst').textContent],['Charge',fmt(s.Lt*100,1)+' %'],['Consigne',fmt(s.LtSet*100,0)+' %']]),
   ctl:s=>rgH('#ltSet','Consigne')+rowH('Charge',btH('ltStep','−5 %','-5')+btH('ltStep','+5 %','5')+btH('hold','Maintenir'))
    +rowH('Vitesse',sgH('ramp',[['1','1'],['3','3'],['5','5'],['10','10'],['30','30']])+'<span class="lbl">%/min</span>')
    +rowH('Réseau',btH('couple','Coupler')+btH('decouple','Découpler')+btH('recouple','Recoupler')+btH('ttrip','Déclencher',null,'amber'))},
  gct:{kv:s=>kvH([['GCT-c',fmt(s.gct/0.85*100,0)+' % (mode '+(s.coupled?'température':'pression')+')'],['GCT-a',fmt(s.qa*100,1)+' % vapeur'],['P GV',fmt(s.Psg,1)+' bar']]),ctl:s=>rgH('#gcta','GCT-a man.')},
  pump:{kv:s=>kvH(s.pumps.map((p,i)=>['GMPP '+(i+1),p?'en service':'arrêtée'])),ctl:s=>'<p class="note">Les pompes primaires ne se commandent pas depuis le pupitre du simulateur ; leur perte est un aléa. Au-dessus de P7, la perte d\'une pompe arrête le réacteur.</p>'},
  is:{kv:s=>kvH([['IS',s.is?'en service, '+fmt(s.Qis,0)+' m³/h':'prête'],['P pressu',fmt(s.Ppzr,1)+' bar'],['Marge sat.',fmt(s.satMargin,1)+' °C']]),ctl:s=>(s.is?rowH('IS',btH('isStop','Arrêter l\'IS')):'<p class="note">L\'IS manuelle se déclenche depuis la famille Sûreté, avec confirmation.</p>')}
};
function palOpen(c,ev){
  if(!SYC[c]) return; SY.pal=c; const w=$('#synw'), b=w.getBoundingClientRect();
  SY.at=ev?[ev.clientX-b.left+w.scrollLeft+12,ev.clientY-b.top+w.scrollTop+8]:[20,20];
  let p=$('#synpal'); if(!p){ p=document.createElement('div'); p.id='synpal'; p.className='synpal'; p.setAttribute('role','dialog'); w.appendChild(p); }
  p.dataset.h=''; palUpd(true); updSyn(A.s);
}
function palClose(){ SY.pal=null; const p=$('#synpal'); if(p) p.remove(); if(A.s) updSyn(A.s); }
function palUpd(force){
  const p=$('#synpal'), s=A.s, c=SY.pal; if(!p||!s||!c) return;
  if(!force&&p.contains(document.activeElement)&&document.activeElement.type==='range') return;
  const f=FAMS[SYC[c].fam], kv=PALB[c].kv(s);
  const h='<div class="pal-h"><b>'+SYC[c].t+'</b><button class="ib" data-palx aria-label="Fermer">✕</button></div><div class="pal-kv"></div>'+PALB[c].ctl(s)+'<button class="pal-f" data-palfam="'+c+'">Toute la famille '+f.t+' ›</button>';
  const k=p.querySelector('.pal-kv');
  if(p.dataset.h===h){ if(k&&k.innerHTML!==kv) k.innerHTML=kv; return; }
  p.innerHTML=h; p.dataset.h=h; p.querySelector('.pal-kv').innerHTML=kv; syncAll();
  const w=$('#synw'); let [x,y]=SY.at; x=Math.max(4,Math.min(x,w.scrollWidth-p.offsetWidth-4)); y=Math.max(4,Math.min(y,w.scrollHeight-p.offsetHeight-4)); p.style.left=x+'px'; p.style.top=y+'px';
}
document.addEventListener('click',e=>{
  if(e.target.closest('[data-palx]')){ palClose(); return; }
  const pf=e.target.closest('[data-palfam]'); if(pf){ const c=pf.dataset.palfam; palClose(); openCard(SYC[c].card); return; }
  const g=e.target.closest('#synw [data-sy]'); if(g&&!e.target.closest('#synpal')){ if(SY.pal===g.dataset.sy) palClose(); else palOpen(g.dataset.sy,e); return; }
  if(SY.pal&&!e.target.closest('#synpal')&&e.target.closest('#synw')) palClose();
});
document.addEventListener('keydown',e=>{ if((e.key==='Enter'||e.key===' ')&&e.target.closest&&e.target.closest('#synw .stg')){ e.preventDefault(); const g=e.target.closest('.stg'), r=g.getBoundingClientRect(); palOpen(g.dataset.sy,{clientX:r.left,clientY:r.bottom}); } if(e.key==='Escape'&&SY.pal) palClose(); });
/* curseurs de la palette : pilotent le curseur de la carte, qui garde toute la logique */
document.addEventListener('input',e=>{ const r=e.target.closest('[data-rng]'); if(!r) return; const src=$(r.dataset.rng); src.value=r.value; src.dispatchEvent(new Event('input',{bubbles:true})); const o=document.querySelector('[data-rngo="'+r.dataset.rng+'"]'); if(o) o.textContent=$(r.dataset.rng+'O').textContent; });
document.addEventListener('change',e=>{ const r=e.target.closest('[data-rng]'); if(!r) return; $(r.dataset.rng).dispatchEvent(new Event('change',{bubbles:true})); });
