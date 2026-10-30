/* Modèle physique : constantes, état initial, pas de calcul (testé seul par tests/physique.test.mjs). */
'use strict';
/* ================= Constantes physiques ================= */
const K={EXC:11200,WSD:4800,WG:1800,WR:1100,KB:9,AD:-1.8,DTF:550,UA:1/31.5,SRC:5e-11,MWE:905};
const BI=[0.000215,0.001424,0.001274,0.002568,0.000748,0.000273].map(b=>b*0.923);
const LI=[0.0124,0.0305,0.111,0.301,1.14,3.01];
const BETA=BI.reduce((a,b)=>a+b,0);
/* puissance résiduelle : 7 groupes ajustés sur la courbe normalisée 0,0622·(t^-0,2 − (t+T0)^-0,2), T0 ≈ 1 an de fonctionnement
   à la puissance initiale (état d'équilibre supposé) : ≈ 1 % à 1 h, ≈ 0,43 % à 1 jour */
const DHA=[0.0257,0.0156,0.0102,0.0060,0.00445,0.00176,0.00277], DHT=[3,30,300,3000,3e4,3e5,3e6], DHS=DHA.reduce((a,b)=>a+b,0);
const DT=0.05;
/* bilans d'énergie, en fraction de la puissance nominale (100 % PN = 1) :
   CP_PRIM : échauffement du primaire, °C/s par unité de déséquilibre (≈ 2 785 MW / (≈ 200 t d'eau × 5,5 kJ/kg·K + métal)) ;
   CP_SEC : même chose pour l'eau et le métal des GV ;
   H_VAP, H_ARE, H_ASG : part de l'énergie prise par la vaporisation, par le réchauffage de l'eau alimentaire ARE (chaude)
   et par celui de l'eau ASG (froide), pour un débit nominal ; H_VAP + H_ARE = 1 à l'équilibre. */
const CP_PRIM=1.74, CP_SEC=2.32, H_VAP=0.81, H_ARE=0.19, H_ASG=0.66;
const PT=[[20,.0234],[50,.1235],[100,1.0133],[150,4.76],[200,15.54],[250,39.76],[260,46.92],[270,55.0],[280,64.17],[290,74.42],[300,85.88],[310,98.65],[320,112.8],[330,128.6],[340,146.0],[350,165.2],[360,186.6],[374,220.6]];
const LP=PT.map(p=>[p[0],Math.log(p[1])]);
function psat(T){ if(T<=20) return .0234; if(T>=374) return 220.6; for(let i=1;i<LP.length;i++){ if(T<=LP[i][0]){ const a=LP[i-1],b=LP[i]; return Math.exp(a[1]+(b[1]-a[1])*(T-a[0])/(b[0]-a[0])); } } return 220.6; }
function tsat(P){ const l=Math.log(Math.max(P,.0234)); if(l>=LP[LP.length-1][1]) return 374; for(let i=1;i<LP.length;i++){ if(l<=LP[i][1]){ const a=LP[i-1],b=LP[i]; return a[0]+(b[0]-a[0])*(l-a[1])/(b[1]-a[1]); } } return 374; }
const Sx=u=>{u=clamp(u,0,1); return u-Math.sin(2*Math.PI*u)/(2*Math.PI);};
const ins=(W,p)=>W*(1-Sx(p/225));
const SINV=(()=>{const t=[];for(let i=0;i<=1000;i++){const y=i/1000;let lo=0,hi=1;for(let k=0;k<40;k++){const m=(lo+hi)/2;if(Sx(m)<y)lo=m;else hi=m;}t.push((lo+hi)/2);}return t;})();
const calG=L=>225*SINV[Math.round(clamp(1-(1400/K.WG)*(1-clamp(L,0,1)),0,1)*1000)];

function rhoParts(s){
  const rods=-(ins(K.WSD,s.rods.SD.p)+ins(K.WG,s.rods.G.p)+ins(K.WR,s.rods.R.p))-(s.dropped?280:0);
  const bore=-K.KB*s.Cb;
  const am=Math.min(1,-50+0.035*s.Cb);
  const mod=am*(s.Tavg-286);
  const dop=K.AD*(s.Tf-286);
  const xe=-2700*s.X;
  return {rods,bore,mod,dop,xe,am,exc:K.EXC,tot:K.EXC+rods+bore+mod+dop+xe};
}

/* ================= Etat initial ================= */
function makeState(o){
  const P=o.P||0, coupled=!!o.coupled;
  const s={t:0,n:P,D:[],Dh:[],pumps:[true,true,true],flow:1,
    rods:{SD:{p:o.SD??225,tg:o.SD??225},G:{p:0,tg:0},R:{p:o.R,tg:o.R}},
    modeR:o.modeR||'man',modeG:o.modeG||'man',rodSel:'R',rAuto:false,
    tripped:false,tripCause:'',tripT:0,is:false,coupled,grid:true,ilot:false,turbTripped:false,
    Lt:coupled?P:0,LtSet:coupled?P:0,ramp:3,
    gct:0,gctaMan:0,Wf:0,Wasg:0,asg:false,tpa:[true,true],apd:false,areMode:'auto',areMan:1,Iare:0,areIsol:false,areFail:false,
    heatMode:'auto',sprayMode:'auto',sprayMan:0,spray:0,sprayStuck:false,sprayIsol:false,sebim:false,backup:false,
    chgMode:'auto',chgMan:13.6,Qc:13.6,Ic:0,ldIsolMan:false,ldIsolAuto:false,leakQ:0,leakType:'',Qleak:0,Qis:0,Qld:13.6,
    rea:{mode:'dil',q:10,vt:0.3,v:0,run:false},Qdil:0,Qbor:0,dilFault:false,reaIsol:false,volDil:0,volBor:0,
    srInhib:false,p10:false,lowBlk:false,dropped:false,rodWd:false,
    porvStuck:false,porvOpen:false,porvIsol:false,Qsoup:0,isThr:1,asgV:true,
    Vv:0,alpha:0,sat:false,vib:0,hCuve:0,unc:0,Tg:0,TgMax:0,zr:1,H2:0,fondu:0,coreDmg:0,Ttc:0,
    mRdp:0,Prdp:1.2,Lrdp:60,Tdech:45,rdpBurst:false,mEnc:0,Penc:1.0,
    lnPrev:0,rate:0,Td:Infinity,ax:0,limits:new Set(),limitNow:false,
    el:typeof makeElec==='function'?makeElec():null,
    log:[],hist:[],histNext:0,alarms:{}};
  const G=o.G==='cal'?calG(coupled?P:0):o.G;
  s.rods.G={p:G,tg:G};
  s.D=BI.map(()=>P); s.Dh=DHA.map(a=>a*P);
  const Qsg=P+0.005;
  if(coupled){ s.Tref=286+18.5*s.Lt; s.Tavg=s.Tref; s.Ts=s.Tavg-Qsg/K.UA; s.gct=0; }
  else { s.Tref=286; const gq=Math.max(0,Qsg-0.005); s.gct=gq; s.Ts=tsat(70.1+gq/0.5); s.Tavg=s.Ts+Qsg/K.UA; }
  s.Tf=s.Tavg+K.DTF*P; s.Psg=psat(s.Ts);
  const w=s.Lt+0.005+s.gct; s.Wst=w; s.Wf=w; s.Wslow=w; s.sw=0; s.Linv=50; s.Lsg=50;
  const xe=o.xe||0, lX=2.09e-5, sg=7.5e-5;
  s.I=xe; s.X=xe>0?(lX+sg)*xe/(lX+sg*xe):0;
  s.Ppzr=155; s.Lref=20+41*clamp((s.Tavg-286)/18.5,0,1); s.Lpzr=s.Lref; s.hEff=0.075;
  const rSave=s.rods.R.p; if(o.critR!=null) s.rods.R.p=o.critR;
  let Cb=1000; for(let i=0;i<50;i++){ s.Cb=Cb; const r=rhoParts(s); Cb=(r.tot-r.bore)/K.KB; }
  s.Cb=Cb; s.rods.R.p=s.rods.R.tg=rSave;
  if(o.critR!=null && P<1e-6){ const r=rhoParts(s).tot*1e-5; s.n=r<-1e-6?K.SRC/(-r):1e-9; s.D=BI.map(()=>s.n); }
  s.lnPrev=Math.log(s.n); s.srInhib=s.n>1e-7; s.p10=s.n>0.10; s.lowBlk=s.p10;
  s.Tthot=s.Tavg; s.Thot=s.Tavg+18.5*P; s.Tcold=s.Tavg-18.5*P; s.Tg=s.Thot+30*P; s.TgMax=s.Tg; s.Ttc=s.Thot;
  s.rho=rhoParts(s); s.DI=0; s.AO=0; s.Qcore=P;
  return s;
}

/* ================= Primaire diphasique, cœur, décharge pressuriseur ================= */
/* Modèle pédagogique (tendances et ordres de grandeur, pas un code d'accident) : boucles et cuve = PV0 m³ d'eau hors pressuriseur ;
   il en faut 150 pour noyer le haut du cœur (3,66 m de haut), pompes arrêtées. Au-delà de 1 900 °C (fusion du zirconium),
   le combustible commence à se liquéfier : c'est la « fusion partielle » de TMI-2. */
const PV0=235;
function primDiph(s,Q,np,vOpen,dt){
  s.alpha=s.Vv/PV0;
  const Wl=PV0-s.Vv;
  s.hCuve=Wl>=150?Math.min(4,(Wl-150)/15):Math.max(-4.5,(Wl-150)/8);
  /* pompes en marche, le mélange eau-vapeur refroidit le cœur tant que le taux de vide reste sous 85 % */
  s.unc=np>0?clamp((s.alpha-0.85)/0.15,0,1):clamp(-s.hCuve/3.66,0,1);
  const Tsat=Math.min(s.Thot,s.Tavg+5);
  if(s.unc<=0) s.Tg+=((s.Thot+30*Math.min(Q,1))-s.Tg)/10*dt;
  else{
    /* partie dénoyée : chauffage par la puissance résiduelle, réaction zirconium-vapeur au-delà de 900 °C */
    const zmin=1-0.9*s.unc, rox=s.Tg>900&&s.zr>zmin?Math.min(s.zr-zmin,5e-4*Math.exp((s.Tg-1200)/200)*dt):0;
    s.zr-=rox; s.H2=900*(1-s.zr);
    s.Tg+=(80*Q-0.0005*(s.Tg-Tsat))*dt+2500*rox;
    if(s.Tg>1900) s.fondu=Math.min(1,s.fondu+0.0004*s.unc*dt);
    s.Tg=Math.min(s.Tg,2800);
  }
  s.TgMax=Math.max(s.TgMax,s.Tg);
  s.coreDmg=s.fondu>0?3:s.TgMax>1800?2:s.TgMax>1204?1:0;
  /* thermocouples de sortie cœur : vapeur surchauffée quand le cœur est dénoyé */
  s.Ttc=s.unc>0?Math.max(s.Thot,Tsat+(s.Tg-Tsat)*0.5):s.Thot;
  /* réservoir de décharge du pressuriseur puis enceinte */
  const qs=s.porvOpen?s.Qsoup:(vOpen?12.6:0), md=qs*0.6/3600;
  if(!s.rdpBurst){ s.mRdp+=md*dt; s.Prdp=1.2+1.4*s.mRdp; s.Lrdp=Math.min(100,60+6*s.mRdp);
    if(s.Prdp>=8){ s.rdpBurst=true; logEv(s,'auto','Disque de rupture du réservoir de décharge pressuriseur rompu'); } }
  else { s.mEnc+=md*dt; s.Prdp+=(s.Penc+0.3*(md>0)-s.Prdp)/30*dt; }
  s.Penc=1.0+0.003*s.mEnc;
  s.Tdech+=((vOpen?tsat(s.Prdp)+5:45)-s.Tdech)/20*dt;
}

/* ================= Pas de calcul ================= */
function logEv(s,type,txt){ s.log.push({t:s.t,type,txt}); if(s.log.length>400) s.log.splice(0,100); }
function ctxAct(code){ const c=A.ctx; if(c && c.acts[code]==null) c.acts[code]=A.s.t; }
function startASG(s){ if(!s.asg){ s.asg=true; logEv(s,'auto','Démarrage ASG'); } }
function trip(s,cause,src){
  if(s.tripped) return;
  /* photo de l'instant de l'AAR, pour la fenêtre « Pourquoi l'AAR ? » */
  const sn={}; for(const k of ['n','Ppzr','Lpzr','Lsg','Tavg','Tref','DTp','OTsp','OPsp','srInhib','lowBlk','p10','is','Wf','Wst','areMode','areMan','areIsol','areFail','rodWd','dropped','sprayStuck','sprayMode','heatMode','chgMode','leakQ','dilFault','Td','Psg']) sn[k]=s[k];
  sn.pumps=s.pumps.slice(); sn.tpa=s.tpa.slice(); sn.coupled=s.coupled; sn.Lt=s.Lt;
  const tl=s.log.slice(-8).reverse().find(l=>/^Déclenchement turbine — /.test(l.txt)); sn.turbWhy=tl?tl.txt.slice(24):'';
  s.tripped=true; s.tripCause=cause; s.tripT=s.t; if(typeof SFX!=='undefined') SFX.aar(); s.modeR='man'; s.modeG='man'; s.rodWd=false;
  for(const b of Object.values(s.rods)) b.tg=0;
  logEv(s,src==='op'?'op':'auto','AAR '+(src==='op'?'manuel':'automatique')+' — '+cause);
  if(s.coupled){ s.coupled=false; s.ilot=false; s.Lt=0; s.LtSet=0; s.turbTripped=true; logEv(s,'auto','Turbine déclenchée sur AAR'); }
  s.ilot=false; startASG(s);
  if(A.ctx && !A.ctx.st.aar) A.ctx.st.aar={t:s.t,cause,src};
  (s.aars||(s.aars=[])).push({t:s.t,cause,src,sn,ops:s.log.filter(l=>l.type==='op'&&l.t>=s.t-600&&!/^AAR/.test(l.txt)).slice(-6)});
}
function turbineTrip(s,why){
  if(!s.coupled) return;
  s.coupled=false; s.ilot=false; s.Lt=0; s.LtSet=0; s.turbTripped=true; s.modeR='man'; s.modeG='man';
  s.rods.R.tg=s.rods.R.p; s.rods.G.tg=s.rods.G.p;
  logEv(s,'auto','Déclenchement turbine — '+why);
  if(A.ctx && A.ctx.st.turbTrip==null) A.ctx.st.turbTrip=s.t;
  if(!s.tripped && s.n>0.10) trip(s,'Déclenchement turbine au-dessus de P7','auto');
}
function startIS(s,src){
  if(s.is) return; s.is=true; s.areIsol=true;
  logEv(s,src==='op'?'op':'auto','Injection de sécurité '+(src==='op'?'manuelle':'automatique'));
  if(A.ctx && A.ctx.st.isT==null) A.ctx.st.isT=s.t;
  trip(s,'Injection de sécurité',src); startASG(s);
}
function protCause(s){
  const np=s.pumps.filter(Boolean).length;
  if(s.el&&!s.el.av.lg) return 'Sous-tension des tableaux GMPP (manque de tension)';
  if(s.n>1.09) return 'Haut flux neutronique (seuil haut 109 %)';
  if(!s.lowBlk && s.n>0.25) return 'Haut flux neutronique (seuil bas 25 %)';
  if(!s.srInhib && s.n*1e10>1e5) return 'Haut flux gamme source (10⁵ c/s)';
  if(s.DTp>s.OTsp) return 'ΔT surtempérature';
  if(s.DTp>s.OPsp) return 'ΔT surpuissance';
  if(s.Ppzr>165) return 'Pression pressuriseur haute (165 bar)';
  if(s.n>0.10 && s.Ppzr<131) return 'Pression pressuriseur basse (131 bar)';
  if(s.n>0.10 && s.Lpzr>92) return 'Niveau pressuriseur haut (92 %)';
  if(s.Lsg<15) return 'Niveau GV très bas (15 %)';
  if(s.n>0.10 && np<3) return 'Bas débit primaire (perte de pompe primaire)';
  return null;
}

function step(s){
  const dt=DT;
  if(s.el) elecStep(s,dt);
  const av=s.el?s.el.av:{heat:1,chg:1,is:1,asg:1,cond:true};
  /* turbine */
  if(s.coupled){
    const tgt=s.ilot?0.05:s.LtSet, rate=s.ilot?2/60:s.ramp/6000;
    s.Lt+=clamp(tgt-s.Lt,-rate*dt,rate*dt);
  }
  s.Tref=286+18.5*(s.coupled?s.Lt:0);
  /* grappes */
  const R=s.rods;
  if(s.tripped){ for(const b of Object.values(R)){ b.p=Math.max(0,b.p-112*dt); b.tg=0; } }
  else{
    const block=s.n>1.03||s.dropped||s.dtMargin<3;
    let dR=0;
    if(s.rodWd) dR=0.8*dt;
    else if(s.modeR==='auto'&&s.coupled){
      /* îlotage : la puissance s'effondre loin sous la charge (grappes trop enfoncées pendant le transitoire) ; l'écart de puissance anticipé (tendance sur 30 s, puissance résiduelle comprise) fait ressortir R avant que Tmoy ne plonge */
      const pv=s.ilot?s.n*(1+clamp(s.rate*30,-1,0))+s.Qdh-s.Lt:0;
      const e=(s.Tavg-s.Tref)+clamp(3*(s.n-s.Lt),-1.5,1.5)+clamp(100*Math.min(0,pv+0.005),-3,0), ae=Math.abs(e);
      if(ae>0.83) s.rAuto=true; else if(ae<0.3) s.rAuto=false;
      if(s.rAuto){ const sp=clamp((ae-0.5)*25,8,72)/60; dR=(e>0?-sp:sp)*dt;
        /* anticipation par l'écart de puissance : ne pas insérer si le réacteur produit déjà moins que la turbine, ni extraire s'il produit nettement plus */
        if((dR<0&&(s.n<s.Lt-0.01||pv<0))||(dR>0&&s.n>s.Lt+0.05)) dR=0; }
      R.R.tg=R.R.p;
    } else dR=clamp(R.R.tg-R.R.p,-0.8*dt,0.8*dt);
    if(dR>0&&block&&!s.rodWd){ dR=0; R.R.tg=R.R.p; }
    R.R.p=clamp(R.R.p+dR,0,225); if(s.rodWd||s.modeR==='auto') R.R.tg=R.R.p;
    let dG=0;
    if(s.modeG==='auto'&&s.coupled){ dG=clamp(calG(s.Lt)-R.G.p,-1.2*dt,1.2*dt); R.G.tg=R.G.p+dG; }
    else dG=clamp(R.G.tg-R.G.p,-0.8*dt,0.8*dt);
    if(dG>0&&block){ dG=0; R.G.tg=R.G.p; }
    R.G.p=clamp(R.G.p+dG,0,225);
    let dS=clamp(R.SD.tg-R.SD.p,-0.8*dt,0.8*dt); if(dS>0&&block){dS=0;R.SD.tg=R.SD.p;}
    R.SD.p=clamp(R.SD.p+dS,0,225);
  }
  /* réactivité et cinétique */
  const rp=rhoParts(s); s.rho=rp;
  const r=rp.tot*1e-5;
  if(r>BETA) s.limits.add('Prompt-criticité atteinte');
  let sb=0; for(let i=0;i<6;i++) sb+=BI[i]*s.D[i];
  let den=BETA-r; if(den<2e-4) den=2e-4;
  let n=Math.min((sb+K.SRC)/den,4);
  for(let i=0;i<6;i++) s.D[i]+=LI[i]*(n-s.D[i])*dt;
  s.n=n;
  let dh=0; for(let i=0;i<DHA.length;i++){ s.Dh[i]+=(DHA[i]*n-s.Dh[i])/DHT[i]*dt; dh+=s.Dh[i]; }
  const Q=(1-DHS)*n+dh; s.Qcore=Q; s.Qdh=dh;
  /* primaire */
  const np=s.pumps.filter(Boolean).length;
  /* sans pompe, circulation naturelle : le débit croît comme la racine cubique de la puissance à évacuer (≈ 4 % à 1 % PN) */
  let ft=np?[0,0.38,0.72,1][np]:clamp(0.04*Math.cbrt(Math.max(Q,1e-4)/0.01),0.015,0.08);
  /* primaire diphasique : les GMPP cavitent dans le mélange eau-vapeur, la vapeur bloque la circulation naturelle */
  s.vib=np>0&&s.sat?clamp(s.alpha*4,0,1):0;
  if(np>0) ft*=1-0.5*s.vib; else ft*=1-clamp(s.alpha/0.15,0,1);
  s.flow+=(ft-s.flow)/(ft<s.flow?20:8)*dt;
  const dTc=Math.min(90,37*Q/s.flow);
  s.Thot=s.Tavg+dTc/2; s.Tcold=s.Tavg-dTc/2;
  /* GV qui s'assèchent : Linv = −20 correspond à des GV vides ; en dessous de −5, le faisceau de tubes se dénoie
     et l'échange baisse jusqu'à zéro. Sans eau, les GV ne refroidissent plus le primaire. */
  s.gvMouil=clamp((s.Linv+20)/15,0,1);
  const Qsg=K.UA*Math.pow(s.flow,0.8)*(s.Tavg-s.Ts)*s.gvMouil; s.Qsg=Qsg;
  const QisH=s.is?clamp((172-s.Ppzr)*1.5,0,120)*s.isThr*av.is:0;
  /* soupape de tête du pressuriseur : ouverture réelle (une soupape bloquée reste ouverte quel que soit l'ordre) */
  const vOpen=s.sebim||(s.porvOpen&&!s.porvIsol);
  /* primaire saturé, soupape ouverte : le fluide qui s'échappe emporte de la chaleur */
  const dTavg=CP_PRIM*(Q+0.002*np-Qsg-0.001-1.2e-4*QisH-(s.sat?1e-4*s.Qsoup:0))*dt;
  s.Tavg+=dTavg;
  /* soupapes SEBIM ouvertes, pressuriseur plein, primaire à saturation (GV secs par exemple) : la chaleur en trop
     vaporise de l'eau au lieu de chauffer le primaire, la vapeur chasse l'eau par les soupapes et le primaire se vide.
     Énergie en trop (Tavg − Tb) / CP_PRIM, en PN·s, soit × 2 785 MJ ; chaleur de vaporisation 0,93 MJ/kg et eau à 0,58 t/m³
     vers 160 bar : environ 5 m³ d'eau chassée par PN·s. */
  if(s.sebim&&s.Lpzr>=97){ const Tb=tsat(s.Ppzr)-1; if(s.Tavg>Tb){ s.Vv=Math.min(PV0,s.Vv+5*(s.Tavg-Tb)/CP_PRIM); s.Tavg=Tb; } }
  s.Tf+=((s.Tavg+K.DTF*Q)-s.Tf)/5*dt;
  /* secondaire */
  s.Psg=psat(s.Ts);
  const Qt=s.coupled?s.Lt*clamp((s.Psg-35)/15,0,1):0; s.Qt=Qt;
  const aux=s.Psg>10?0.005:0;
  /* GCT-c : il faut le condenseur, donc les tableaux normaux */
  /* en îlotage, le GCT-c s'ouvre plus tôt et plus franchement : il absorbe la vapeur que la turbine ne prend plus */
  const gd=!av.cond?0:s.coupled?(s.ilot?clamp(0.3*(s.Tavg-s.Tref-0.5),0,0.85):clamp(0.10*(s.Tavg-s.Tref-1.5),0,0.85)):clamp(0.5*(s.Psg-70.1),0,0.85);
  s.gct+=(gd-s.gct)/2*dt;
  const qa=clamp((s.Psg-78)*0.06,0,0.3)+s.gctaMan*0.3*clamp(s.Psg/70,0,1.2); s.qa=qa;
  const qv=s.Psg>85?clamp((s.Psg-85)*0.4,0,1.2):0; s.qv=qv;
  const Wst=Qt+aux+s.gct+qa+qv; s.Wst=Wst;
  const cap=s.areIsol?0:((s.tpa[0]?0.58:0)+(s.tpa[1]?0.58:0)+(s.apd&&dispo(s,'apd')?0.12:0));
  const capE=s.tripped?Math.min(cap,0.15):cap; s.areCap=capE;
  let dem;
  if(s.areMode==='auto'){
    if(s.areFail) dem=capE;
    else{ const e=50-s.Lsg; s.Iare=clamp(s.Iare+0.0004*e*dt,-0.15,0.15); dem=Wst+0.03*e+s.Iare; }
  } else dem=s.areMan;
  dem=clamp(dem,0,capE);
  s.Wf+=(dem-s.Wf)/3*dt; if(s.Wf<0) s.Wf=0;
  const ad=s.asg&&s.asgV?clamp(0.03+0.02*(45-s.Lsg),0,0.10)*av.asg:0;
  s.Wasg+=(ad-s.Wasg)/5*dt;
  s.Ts+=CP_SEC*(Qsg-Wst*H_VAP-s.Wf*H_ARE-s.Wasg*H_ASG)*dt;
  s.Linv=clamp(s.Linv+0.8*(s.Wf+s.Wasg-Wst)*dt,-20,115);
  s.Wslow+=(Wst-s.Wslow)/60*dt;
  s.sw+=(15*(Wst-s.Wslow)-s.sw)/8*dt;
  s.Lsg=clamp(s.Linv+s.sw,0,100);
  /* pressuriseur et RCV */
  s.Lref=20+41*clamp((s.Tavg-286)/18.5,0,1);
  if(s.Lpzr<14) s.ldIsolAuto=true; else if(s.Lpzr>20) s.ldIsolAuto=false;
  const ldIso=s.ldIsolAuto||s.ldIsolMan||s.is;
  /* sans pompe de charge, la décharge s'isole aussi */
  const Qld=ldIso||!av.chg?0:13.6; s.Qld=Qld;
  let cd;
  if(s.chgMode==='auto'){ const e=s.Lref-s.Lpzr; s.Ic=clamp(s.Ic+0.02*e*dt,-10,20); cd=Qld+4*e+s.Ic; } else cd=s.chgMan;
  cd=clamp(cd,0,34*av.chg);
  s.Qc+=(cd-s.Qc)/8*dt;
  let Ql=0; if(s.leakQ>0 && !(s.leakType==='letdown'&&ldIso)) Ql=s.leakQ*Math.sqrt(Math.max(s.Ppzr,1)/155);
  s.Qleak=Ql; s.Qis=QisH;
  /* débit perdu par une soupape bloquée ouverte (m³/h d'eau) : vapeur tant qu'il reste un ciel de vapeur, mélange quand le pressuriseur est plein */
  s.Qsoup=s.porvOpen&&!s.porvIsol?(s.Lpzr>=97?60:12.6)*Math.sqrt(Math.max(s.Ppzr,1)/155):0;
  let dV=(s.Qc-Qld-Ql+QisH-s.Qsoup)/3600*dt;
  if(s.sat||s.Vv>0){
    /* deux phases : l'eau injectée comble d'abord les vides, l'eau perdue est remplacée par de la vapeur dans les boucles */
    if(dV>0){ const f=Math.min(dV,s.Vv); s.Vv-=f; dV-=f; }
    else if(s.sat){ s.Vv-=dV; dV=0; }
    /* la vapeur formée dans la cuve chasse l'eau vers le pressuriseur : son niveau monte pendant que le circuit se vide */
    if(s.sat&&s.Lpzr<99){ const tr=Math.min(10*Q*dt,Math.max(0,PV0-s.Vv)); s.Vv+=tr; dV+=tr; }
    /* resous-refroidi, les bulles se recondensent et le pressuriseur se vide dans les boucles */
    if(!s.sat&&s.Vv>0){ const c=Math.min(s.Vv,0.02*Math.max(0,s.satMargin)*dt); s.Vv-=c; dV-=c; }
    s.Vv=clamp(s.Vv,0,PV0);
  }
  const dL=2.2*dTavg+0.000794*3600*dV-(s.sebim&&!(s.porvOpen&&!s.porvIsol)?0.01*dt:0);
  s.Lpzr=clamp(s.Lpzr+dL,0,100);
  const e=s.Ppzr-155;
  const prop=clamp(0.5-e/1.4,0,1);
  if(e<-1.7) s.backup=true; else if(e>-0.9) s.backup=false;
  let hd=s.heatMode==='auto'?0.15*prop+(s.backup?0.85:0):(s.heatMode==='on'?1:0);
  if(s.Lpzr<14) hd=0;
  hd*=av.heat;
  s.hEff+=(hd-s.hEff)/20*dt; s.hDem=hd;
  let sp=s.sprayMode==='auto'?clamp((e-0.7)/1.6,0,1):s.sprayMan;
  if(s.sprayStuck) sp=1; if(s.sprayIsol) sp=0;
  const drive=(s.pumps[0]||s.pumps[1])?1:0;
  s.spray+=(sp*drive-s.spray)/3*dt;
  if(s.Ppzr>=166.6) s.sebim=true; else if(s.Ppzr<=161.5) s.sebim=false;
  if(s.sebim && A.ctx) A.ctx.st.sebim=true;
  const kins=(dL>0?0.35:0.30)*(s.Lpzr>97?8:1);
  if(s.sebim&&s.porvStuck&&!s.porvOpen){ s.porvOpen=true; if(A.ctx) A.ctx.st.porv=s.t; }
  s.Ppzr+=kins*dL+(s.hEff*0.03-s.spray*0.15-0.00225-(s.sebim?0.8:s.porvOpen&&!s.porvIsol?0.3:0))*dt;
  const pfl=psat(s.Vv>0?Math.min(s.Thot,s.Tavg+5):s.Thot)*0.985;
  s.Ppzr=clamp(Math.max(s.Ppzr,pfl),1,200);
  s.sat=s.Ppzr<=pfl*1.003&&(s.Vv>0||vOpen||s.Qleak>0);
  primDiph(s,Q,np,vOpen,dt);
  /* bore */
  let Qd=0,Qb=0;
  /* l'appoint passe par les pompes de charge RCV : sans elles, rien n'entre dans le primaire */
  const chgOk=dispo(s,'chg');
  if(s.rea.run&&!s.reaIsol&&chgOk){
    if(s.rea.mode==='dil') Qd=s.rea.q; else Qb=s.rea.q;
    s.rea.v+=s.rea.q/3600*dt;
    if(s.rea.v>=s.rea.vt){ s.rea.run=false; logEv(s,'auto','Appoint terminé ('+fmt(s.rea.v*1000,0)+' L)'); }
  }
  if(s.dilFault&&!s.reaIsol&&chgOk) Qd+=25;
  s.Qdil=Qd; s.Qbor=Qb; s.volDil+=Qd/3600*dt; s.volBor+=Qb/3600*dt;
  s.Cb+=((Qd*(0-s.Cb)+Qb*(7700-s.Cb)+QisH*(2500-s.Cb))/3600/270)*dt;
  if(s.Cb<0) s.Cb=0;
  /* xénon */
  /* demi-vies publiques : iode 135 6,57 h, xénon 135 9,14 h */
  const lI=Math.LN2/(6.57*3600),lX=Math.LN2/(9.14*3600),sg=7.5e-5,gI=0.0639,gX=0.00237;
  s.I+=lI*(n-s.I)*dt;
  s.X+=((lX+sg)*(gX*n+gI*s.I)/(gI+gX)-(lX+sg*n)*s.X)*dt;
  /* ΔI */
  const iR=1-R.R.p/225, iG=1-R.G.p/225;
  const AOf=1.0-20*iR-9*iG;
  s.ax+=((-0.4*(AOf+1.5))-s.ax)/10800*dt;
  s.AO=AOf+s.ax; s.DI=n*s.AO;
  /* temps de doublement */
  const ln=Math.log(Math.max(n,1e-14));
  const rr=(ln-s.lnPrev)/dt; s.lnPrev=ln;
  s.rate+=(rr-s.rate)/4*dt;
  s.Td=s.rate>1e-5?Math.LN2/s.rate:Infinity;
  /* protections */
  s.DTp=Q/s.flow*100;
  s.OTsp=118-2.2*(s.Tavg-304.5)+1.0*(s.Ppzr-155)-2*Math.max(0,Math.abs(s.DI+1.5*n)-10);
  s.OPsp=112-1.5*Math.max(0,s.Tavg-304.5);
  s.dtMargin=Math.min(s.OTsp,s.OPsp)-s.DTp;
  s.satMargin=tsat(s.Ppzr)-s.Thot;
  if(n>0.10) s.p10=true; else if(n<0.09){ s.p10=false; if(s.lowBlk){ s.lowBlk=false; logEv(s,'auto','Seuil bas de haut flux réarmé (sortie de P10)'); } }
  if(s.srInhib && n<1e-7 && s.tripped){ s.srInhib=false; logEv(s,'auto','Gamme source réalimentée (sortie de P6)'); }
  if(!s.tripped){ const c=protCause(s); if(c) trip(s,c,'auto'); }
  if(!s.is && s.Ppzr<119) startIS(s,'auto');
  if(s.Lsg>80 && !s.areIsol){ s.areIsol=true; logEv(s,'auto','Isolement ARE — niveau GV très haut'); turbineTrip(s,'niveau GV très haut'); }
  if(s.areIsol && !s.is && s.Lsg<65){ s.areIsol=false; logEv(s,'auto','Fin d\'isolement ARE'); }
  if(!s.asg && (s.Lsg<25 || (!s.tpa[0]&&!s.tpa[1]))) startASG(s);
  /* limites de sûreté */
  let lim=false;
  if(n>1.18){ s.limits.add('Surpuissance > 118 % PN'); lim=true; }
  if(s.Ppzr>172){ s.limits.add('Pression primaire > 172 bar'); lim=true; }
  if(s.satMargin<0){ s.limits.add('Ébullition en cœur (marge à la saturation nulle)'); lim=true; }
  if(s.Lpzr>=99.5){ s.limits.add('Pressuriseur plein'); lim=true; }
  if(s.Lsg<1){ s.limits.add('Assèchement des GV'); lim=true; }
  if(s.unc>0.01){ s.limits.add('Cœur découvert'); lim=true; }
  if(s.TgMax>1204){ s.limits.add('Gaines au-delà de 1 204 °C'); lim=true; }
  s.limitNow=lim;
  s.t+=dt;
  if(s.t>=s.histNext){
    s.histNext=s.t+1;
    s.hist.push({t:s.t,th:s.Thot,pn:n*100,pt:Qt*100,ta:s.Tavg,tr:s.Tref,pp:s.Ppzr,lp:s.Lpzr,lg:s.Lsg,r:R.R.p,g:R.G.p,cb:s.Cb,xe:rp.xe,di:s.DI,dr:-1.5*n,sg:s.Psg});
    if(s.hist.length>30000) s.hist.splice(0,2000);
  }
}

