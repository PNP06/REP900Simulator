/* Alimentations électriques de la tranche : sources, tableaux 6,6 kV, diesels, batteries.
   Modèle simplifié à deux voies (sources publiques : IRSN, avis de synthèse RP4 900 MWe de 2020 et Repères n° 48 ; ASN). Chaque tableau est sous tension ou non ;
   les organes de physique.js demandent leur tableau avant de fonctionner.
   - Le transformateur de soutirage (TS) n'est alimenté que si l'alternateur tourne (couplé ou îloté) ;
     sur un 900 MWe, un déclenchement turbine fait basculer les auxiliaires sur le transformateur auxiliaire (TA, réseau 225 kV).
   - Tableaux normaux LGA à LGD : GMPP, TPA, APD, pompes du condenseur, chaufferettes normales. Sources : TS puis TA.
   - Tableaux secourus LHA et LHB : IS, charge RCV, motopompes ASG, chaufferettes secourues. Sources : TS, TA, puis leur diesel, puis le DUS.
   - Batteries 125 V : contrôle-commande, elles se déchargent quand les deux voies secourues sont hors tension. */
const EL={DG_START:10,BAT_H:1,DUS_START:120,FUEL_J:3.5};
/* reprise des charges sur diesel : délai après couplage (s) */
const SEQ={is:5,asg:15,chg:30,heat:45};
function makeElec(){
  const dg=()=>({st:'pret',t:0,fail:false,fuel:1});
  return {r225:true,def:{TS:false,TA:false,LHA:false,LHB:false},ilotRate:false,
    src:{LG:'ts',LHA:'ts',LHB:'ts'},dg:{A:dg(),B:dg()},seq:{LHA:0,LHB:0},
    dus:{st:'pret',t:0,voie:'LHA'},lls:false,tps:true,bat:1,batVide:false,
    av:{lg:true,lha:true,lhb:true,heat:1,chg:1,is:1,asg:1,cond:true}};
}
function elecLog(s,txt){ logEv(s,'auto',txt); }
/* commandes opérateur (vue Électrique) : renvoient le texte du journal, ou null si la commande est sans effet */
function elecCmd(s,cmd,x){
  const e=s.el; if(!e) return null;
  if(cmd==='dg'){ const d=e.dg[x]; if(!d||d.st==='defaut') return null;
    if(d.st==='service'||d.st==='demarrage'){ if(e.src['LH'+x]==='dg') return null; d.st='pret'; return 'Arrêt du diesel '+x+' (retour en attente)'; }
    d.st='demarrage'; d.t=0; return 'Démarrage manuel du diesel '+x; }
  if(cmd==='dus'){ if(e.dus.st!=='pret') return null; const v=!e.src.LHA?'LHA':!e.src.LHB?'LHB':null; if(!v) return null;
    e.dus.st='demarrage'; e.dus.t=0; e.dus.voie=v; return 'Démarrage du DUS pour réalimenter '+v; }
  return null;
}
function elecStep(s,dt){
  const e=s.el, d=e.def;
  /* îlotage raté (aléa) : la turbine déclenche au lieu de se caler sur les auxiliaires */
  if(e.ilotRate&&s.ilot) turbineTrip(s,'îlotage raté');
  const ts=s.coupled&&!d.TS, ta=e.r225&&!d.TA;
  const prev={LG:e.src.LG,LHA:e.src.LHA,LHB:e.src.LHB};
  e.src.LG=ts?'ts':ta?'ta':null;
  for(const v of ['LHA','LHB']){
    const g=e.dg[v==='LHA'?'A':'B'];
    let src=d[v]?null:ts?'ts':ta?'ta':null;
    /* manque de tension sur la voie : démarrage automatique de son diesel */
    if(!src&&!d[v]&&g.st==='pret'){ g.st='demarrage'; g.t=0; elecLog(s,'Manque de tension '+v+' : démarrage du diesel '+(v==='LHA'?'A':'B')); }
    if(!src&&!d[v]&&g.st==='service') src='dg';
    if(!src&&!d[v]&&e.dus.st==='service'&&e.dus.voie===v) src='dus';
    e.src[v]=src;
    if(src!==prev[v]){
      if(!src) elecLog(s,'Tableau '+v+' hors tension');
      else if(prev[v]===null) elecLog(s,'Tableau '+v+' réalimenté par '+{ts:'le TS',ta:'le TA',dg:'le diesel '+(v==='LHA'?'A':'B'),dus:'le DUS'}[src]);
      e.seq[v]=0;
    }
    e.seq[v]+=dt;
  }
  if(e.src.LG!==prev.LG){ if(!e.src.LG) elecLog(s,'Tableaux normaux LGA à LGD hors tension'); else if(!prev.LG) elecLog(s,'Tableaux normaux réalimentés'); else if(e.src.LG==='ta') elecLog(s,'Basculement des auxiliaires sur le TA'); }
  /* diesels : démarrage en ~10 s, échec possible (aléa), consommation de fioul */
  for(const k of ['A','B']){
    const g=e.dg[k];
    if(g.st==='demarrage'){ g.t+=dt; if(g.t>=EL.DG_START){ if(g.fail){ g.st='defaut'; elecLog(s,'Échec de démarrage du diesel '+k); } else { g.st='service'; elecLog(s,'Diesel '+k+' en service, couplé sur LH'+k); } } }
    if(g.st==='service'){ g.fuel=Math.max(0,g.fuel-dt/(EL.FUEL_J*86400)); if(g.fail){ g.st='defaut'; elecLog(s,'Déclenchement du diesel '+k); } }
  }
  if(e.dus.st==='demarrage'){ e.dus.t+=dt; if(e.dus.t>=EL.DUS_START){ e.dus.st='service'; elecLog(s,'DUS en service sur '+e.dus.voie); } }
  /* disponibilité des consommateurs */
  const lg=!!e.src.LG, lha=!!e.src.LHA, lhb=!!e.src.LHB;
  const ok=(v,dly)=>!!e.src[v]&&(e.src[v]==='ts'||e.src[v]==='ta'||e.seq[v]>=dly);
  const av=e.av;
  if(av.lg&&!lg){
    /* perte des tableaux normaux : GMPP, TPA, APD et condenseur s'arrêtent ; il faudra les relancer à la main */
    if(s.pumps.some(Boolean)) elecLog(s,'GMPP arrêtées : manque de tension');
    s.pumps=s.pumps.map(()=>false); s.tpa=[false,false]; s.apd=false;
    if(s.coupled) turbineTrip(s,'perte du condenseur (manque de tension)');
  }
  av.lg=lg; av.lha=lha; av.lhb=lhb; av.cond=lg;
  av.heat=lg?1:(ok('LHA',SEQ.heat)?0.25:0)+(ok('LHB',SEQ.heat)?0.25:0);
  av.chg=ok('LHA',SEQ.chg)||ok('LHB',SEQ.chg)?1:0;
  av.is=ok('LHA',SEQ.is)||ok('LHB',SEQ.is)?1:0;
  /* ASG : une motopompe par voie secourue (50 % chacune), turbopompe sur la vapeur des GV (100 %) */
  av.asg=Math.min(1,(ok('LHA',SEQ.asg)?0.5:0)+(ok('LHB',SEQ.asg)?0.5:0)+(e.tps&&s.Psg>10?1:0));
  /* turboalternateur LLS : démarre quand les deux voies secourues restent hors tension (diesels perdus), pour l'injection aux joints des GMPP */
  e.h3t=!lha&&!lhb?(e.h3t||0)+dt:0;
  if(e.h3t>30&&!e.lls&&s.Psg>10){ e.lls=true; elecLog(s,'Turboalternateur LLS en service (injection aux joints GMPP)'); }
  else if((lha||lhb)&&e.lls){ e.lls=false; }
  /* batteries : chargées par les voies secourues, sinon décharge */
  if(lha||lhb) e.bat=Math.min(1,e.bat+dt/(8*3600));
  else e.bat=Math.max(0,e.bat-dt/(EL.BAT_H*3600));
  if(e.bat<=0&&!e.batVide){ e.batVide=true; elecLog(s,'Batteries épuisées : contrôle-commande perdu'); }
  if(e.bat>0.05) e.batVide=false;
}
