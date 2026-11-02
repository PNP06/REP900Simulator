/* Accompagnement des leçons : explications d'étapes, « En clair » pour débutants, niveau d'explication, coaching. */
'use strict';

/* ================= Accompagnement des leçons ================= */
const f0=v=>fmt(v,0), f1=v=>fmt(v,1), f2=v=>fmt(v,2);
const TdTxt=s=>Number.isFinite(s.Td)&&s.Td<99999?f0(s.Td)+' s':'infini';
const RB=s=>s.rodSel==='R', RM=s=>s.modeR==='man';
const STEPX={
 ihm:[
  {f:['#band','.pc>.run','#synw','.fam']},
  {f:['#rd-pp'],hint:"La case « Pression pressu » est dans le groupe Primaire du bandeau (deuxième groupe en partant de la gauche).",after:()=>"La carte « Pressuriseur — RCV » s'est ouverte à droite : c'est elle qui règle cette pression."},
  {f:['#synw [data-sy="pzr"]'],hint:"Le pressuriseur est le petit réservoir vertical en haut du synoptique, au-dessus de la branche chaude ; ses étiquettes « Pression pressu », « Niveau / réf. » et « Chauff. · asp. » sont à sa droite."},
  {f:['#sy-hs'],hint:"Dans la fenêtre d'actions rapides, ligne « Chaufferettes » : « Forcé », puis « Auto »."},
  {f:['#synw [data-sy="pzr"]','.ftabs [data-fam="prim"]'],hint:"Lien « Toute la famille Primaire › » en bas de la fenêtre d'actions rapides du pressuriseur."},
  {f:['#ftabs','.ftabs [data-fam="sec"]'],hint:"Onglets au-dessus des cartes, à droite : « Secondaire »."},
  {f:['#vtabs [data-vue="crv"]','#vtabs [data-vue="synop"]'],hint:"Onglets sous la vue centrale : « Courbes », puis « Synoptique »."},
  {f:['#sy-cb','#sy-rcv','#runList'],hint:"Étiquette « Bore » à gauche de la cuve : dans la fenêtre, « Borication », « 5 », « 100 L », puis « Lancer »."},
  {f:['#runAl'],hint:"Bouton « Acquitter » dans le bloc Alarmes actives, sous le bandeau."},
  {f:['#runAuto','#rd-rg','#sy-rods']},
  {f:['#band','#synw']},
  {f:['#runList','#runAl']},
  {}
 ],
 tuto:[
  {f:['header.top']},
  {f:['#band']},
  {f:['[data-c="react"]','#rd-td']},
  {f:['.seg[data-key="modeR"]'],hint:"Onglet Commandes › carte « Grappes de commande » › ligne « Mode R » › bouton « Manuel ».",after:()=>"Le groupe R ne bougera plus seul : la régulation de température est suspendue, c'est vous qui fixez sa position."},
  {f:['[data-bank="R"]','[data-act="rod"][data-v="1"]','#rd-pn','#rd-tm'],hint:"Touchez la case « Groupe R » (elle s'entoure en bleu), puis six fois « +1 ». Chaque appui demande un pas ; le groupe se déplace à 48 pas/min, soit un peu moins d'un pas par seconde.",
   sub:[['Groupe R sélectionné',RB],['R extrait de 6 pas',(s,c,k)=>s.rods.R.p>=k.r0+5.5],['40 s d\'observation',(s,c,k)=>k.tm!=null&&s.t-k.tm>40]],
   after:(s,c,k)=>`Puissance : ${f1(k.n0*100)} → ${f1(s.n*100)} %. Tmoy : ${f1(k.T0)} → ${f1(s.Tavg)} °C. Les grappes ont apporté ${sgn(s.rho.rods-k.rh0.rods,0)} pcm ; le Doppler (${sgn(s.rho.dop-k.rh0.dop,0)} pcm) et le modérateur (${sgn(s.rho.mod-k.rh0.mod,0)} pcm) les ont compensés. ρ est revenu à ${sgn(s.rho.tot,0)} pcm : la puissance s'est stabilisée toute seule, un peu plus haut.`},
  {f:['.seg[data-key="modeR"]','#rd-tm','[data-bank="R"]'],hint:"Même ligne « Mode R », bouton « Auto ». Attendez que l'écart Tmoy − Tref affiché dans le bandeau revienne sous 0,8 °C.",
   after:(s,c,k)=>`R est revenu à ${f0(s.rods.R.p)} pas (il était à ${f0(k.R0)}). Tmoy = ${f1(s.Tavg)} °C pour Tref = ${f1(s.Tref)} °C. En mode G, la température est la grandeur réglée : le réacteur s'aligne toujours sur la demande de la turbine.`},
  {f:['[data-c="turb"]','#rd-pe'],hint:"Commandes › carte « Turbine — GCT » : touchez « 3 » sur la ligne Vitesse, puis « +5 % » deux fois (ou faites glisser la consigne jusqu'à 60 %). La charge met environ 3 minutes à monter : passez en ×5 si vous voulez.",
   sub:[['Vitesse 3 %/min',s=>s.ramp===3],['Consigne à 60 %',s=>Math.round(s.LtSet*100)>=60],['Charge atteinte',s=>s.Lt>=0.595]],
   after:(s,c,k)=>`Les GCP sont passés de ${f0(k.G0)} à ${f0(s.rods.G.p)} pas en suivant leur courbe de calibrage ; R de ${f0(k.R0)} à ${f0(s.rods.R.p)} pas pour l'ajustement fin. Tref a pris ${sgn(s.Tref-k.Tr0,1)} °C et Tmoy a suivi à ${f1(Math.abs(s.Tavg-s.Tref))} °C près.`},
  {f:['[data-c="bore"]','#rd-cb'],hint:"Carte « Bore — RCV / REA » : touchez « Dilution », « 10 », « 300 L », puis « Lancer l'appoint ». L'appoint dure environ 2 minutes à ×1.",
   sub:[['Mode Dilution',s=>s.rea.mode==='dil'],['Débit 10 m³/h',s=>s.rea.q===10],['Volume 300 L',s=>s.rea.vt===0.3],['Appoint lancé',(s,c,k)=>s.volDil-k.v0>0.005],['300 L injectés',(s,c,k)=>s.volDil-k.v0>=0.29]],
   after:(s,c,k)=>`Bore : ${f1(k.Cb0)} → ${f1(s.Cb)} ppm, soit ${sgn(-(s.Cb-k.Cb0)*9,0)} pcm de réactivité ajoutée. Pour ne pas laisser monter la température, R s'est inséré de ${f0(k.R0-s.rods.R.p)} pas. Le bore a « poussé » R vers le bas : c'est ainsi qu'on choisit la position de R.`},
  {f:['.seg[data-key="sprayMode"]','#sprayMan','#rd-pp'],hint:"Carte « Pressuriseur — RCV » : ligne Aspersion › « Manuel », puis faites glisser « Asp. man. » vers 60 %.",
   sub:[['Aspersion en manuel',s=>s.sprayMode==='man'],['Ouverture ≥ 40 %',s=>s.sprayMan>=0.4],['Pression < 154 bar',s=>s.Ppzr<154]],
   after:(s,c,k)=>`Pression descendue à ${f1(s.Ppzr)} bar. Les chaufferettes sont montées à ${f0(s.hEff*1440)} kW pour s'y opposer : sous 153,3 bar, les chaufferettes de secours s'enclenchent.`},
  {f:['.seg[data-key="sprayMode"]','#rd-pp'],hint:"Même ligne Aspersion, bouton « Auto ».",after:(s)=>`La pression remonte (${f1(s.Ppzr)} bar) : chaufferettes et aspersion se partagent la régulation autour de 155 bar.`},
  {f:['#alb','[data-c="alarm"]'],hint:"Touchez « Acquitter » dans le bandeau d'alarme en haut, ou dans la carte « Tableau d'alarmes »."},
  {f:['#aarBtn'],hint:"Commandes › carte « Protection et sauvegarde » : touchez « AAR manuel », le bouton clignote, touchez-le à nouveau pour confirmer.",
   after:s=>`Toutes les grappes sont en bas : ρ = ${sgn(s.rho.tot,0)} pcm. La puissance neutronique est déjà à ${fmt(s.n*100,2)} %, mais le cœur dégage encore ${f1(s.Qcore*100)} % de chaleur : c'est la puissance résiduelle, qu'il faut continuer d'évacuer.`},
  {f:['#rd-tm','#rd-lp','#rd-pp','[data-c="synop"]'],hint:"Rien à faire : observez. Passez en ×5 pour accélérer.",
   after:(s,c,k)=>`Tmoy = ${f1(s.Tavg)} °C : le GCT-c tient ${f1(s.Psg)} bar dans les GV. Pendant le refroidissement, le niveau pressu est descendu jusqu'à ${f0(k.minLp)} % et la pression jusqu'à ${f1(k.minP)} bar ; la charge RCV et les chaufferettes ont compensé.`},
  {}
 ],
 'l-cin':[
  {f:['[data-c="instr"]','#rd-td']},
  {f:['[data-bank="R"]','#rd-td','#rd-pn'],hint:"Commandes › Grappes : touchez « Groupe R » puis cinq fois « +1 ».",
   sub:[['Groupe R sélectionné',RB],['R extrait de 5 pas',(s,c,k)=>s.rods.R.p>=k.r0+4.5],['30 s d\'observation',(s,c,k)=>k.tm!=null&&s.t-k.tm>30]],
   after:s=>{ const r=s.rho.tot; const th=r>2?0.69*(600-r)/(0.08*r):NaN; return `Réactivité : ${sgn(r,0)} pcm. Temps de doublement mesuré : ${TdTxt(s)}. La relation T ≈ (β − ρ)/(λ·ρ), avec λ ≈ 0,08 s⁻¹, donne ${Number.isFinite(th)?f0(th)+' s':'—'} : l'ordre de grandeur est juste. L'écart vient des six groupes de précurseurs, que la formule résume en un seul.`; }},
  {f:['#rd-td','[data-c="react"]','.spdseg','#spdSel'],hint:"Passez en ×5 en haut de l'écran. Ne touchez plus aux grappes : regardez la ligne Doppler du bilan de réactivité (vue Réactivité, ou zone Surveiller sur téléphone) se creuser pendant que la puissance monte. Le temps de doublement s'allonge dans le bandeau, case « Réactivité ».",
   after:(s,c,k)=>`À ${f1(s.n*100)} %, le Doppler a repris ${sgn(s.rho.dop-k.rh0.dop,0)} pcm : ρ est passé de ${sgn(k.rh0.tot,0)} à ${sgn(s.rho.tot,0)} pcm et le temps de doublement s'est allongé (${TdTxt(s)}). Encore un peu et la puissance s'arrêtera seule.`},
  {f:['[data-act="rod"][data-v="-10"]','#rd-td','#rd-pn'],hint:"Touchez « −10 » une fois, puis observez pendant 40 s.",
   after:s=>`Période mesurée : ${s.rate<0?f0(1/s.rate)+' s':'—'}. Malgré une forte antiréactivité, elle reste proche de −80 s : c'est le précurseur le plus lent (55 s de demi-vie) qui fixe cette limite. C'est aussi pour cela que la puissance met des minutes à disparaître après un AAR.`},
  {f:['[data-bank="R"]','#rd-td'],hint:"Faites « +1 », attendez 20 à 30 s, observez le temps de doublement ; recommencez. S'il devient court (moins de 2 min), faites « −1 ». Le but : « stable » ou « infini ».",
   after:(s,c,k)=>`Cote critique trouvée : R = ${f0(s.rods.R.p)} pas (départ à 140). Elle est différente car le combustible n'est plus à la même température : le Doppler a déplacé l'équilibre.`},
  {}
 ],
 'l-fb':[
  {f:['[data-c="react"]']},
  {f:['.seg[data-key="modeR"]','.seg[data-key="modeG"]'],hint:"Commandes › Grappes : « Manuel » sur la ligne Mode R, puis « Manuel » sur la ligne Mode GCP.",sub:[['R en manuel',RM],['GCP en manuel',s=>s.modeG==='man']]},
  {f:['[data-c="turb"]','#rd-tm','#rd-pn'],hint:"Turbine : touchez « 5 » sur la ligne Vitesse puis « +5 % » deux fois. Ne touchez à rien d'autre et regardez l'écart Tmoy − Tref dans le bandeau.",
   sub:[['Vitesse 5 %/min',s=>s.ramp===5],['Consigne 60 %',s=>Math.round(s.LtSet*100)>=60],['Charge atteinte',s=>s.Lt>=0.595],['60 s d\'observation',(s,c,k)=>k.tm!=null&&s.t-k.tm>60]],
   after:(s,c,k)=>`Puissance ${f1(k.n0*100)} → ${f1(s.n*100)} % sans toucher aux grappes. Le refroidissement du primaire a apporté ${sgn(s.rho.mod-k.rh0.mod,0)} pcm par le modérateur ; le Doppler en a repris ${sgn(s.rho.dop-k.rh0.dop,0)}. Résultat : Tmoy − Tref = ${sgn(s.Tavg-s.Tref,1)} °C. Le réacteur suit, mais à une température trop basse.`},
  {f:['.seg[data-key="modeG"]','[data-bank="G"]','#rd-tm'],hint:"Ligne Mode GCP › « Auto ». Les GCP rejoignent leur position programmée pour 60 %.",
   after:(s,c,k)=>`GCP : ${f0(k.G0)} → ${f0(s.rods.G.p)} pas. Tmoy − Tref : ${sgn(s.Tavg-s.Tref,1)} °C. Les GCP ont fourni la réactivité du défaut de puissance, sans mesure de température : c'est une compensation « en boucle ouverte ».`},
  {f:['.seg[data-key="modeR"]','#rd-tm'],hint:"Ligne Mode R › « Auto ».",after:s=>`Écart résiduel ${sgn(s.Tavg-s.Tref,1)} °C, R à ${f0(s.rods.R.p)} pas. R corrige ce que les GCP n'ont pas parfaitement compensé : c'est la boucle fermée.`},
  {}
 ],
 'l-di':[
  {f:['[data-c="di"]','#rd-di']},
  {f:['[data-c="rods"]','[data-c="di"]','#rd-di'],hint:"Commandes › Grappes : Mode R › « Manuel », touchez « Groupe R », puis « −10 » quatre fois. Gardez un œil sur le point du diagramme ΔI.",
   sub:[['R en manuel',RM],['Groupe R sélectionné',RB],['R inséré de 40 pas',(s,c,k)=>s.rods.R.p<=k.r0-39.5]],
   after:(s,c,k)=>`ΔI : ${f2(k.DI0)} → ${f2(s.DI)} % PN (référence ${f2(-1.5*s.n)}). Tmoy est ${f1(Math.abs(s.Tavg-s.Tref))} °C sous Tref : la turbine tire toujours 50 %, c'est donc la température qui a baissé.`},
  {f:['[data-c="bore"]','#rd-tm'],hint:"Bore : « Dilution », « 30 », « Continu », « Lancer l'appoint ». Passez en ×10. Surveillez l'écart affiché sous Tmoy dans le bandeau (famille Primaire) ; sous 0,5 °C, touchez « Arrêter ». Il faut environ 7 m³.",
   sub:[['Dilution lancée',(s,c,k)=>s.volDil-k.v0>0.01],['Écart Tmoy − Tref < 0,6 °C',s=>Math.abs(s.Tavg-s.Tref)<0.6],['Appoint arrêté',s=>!s.rea.run]],
   after:(s,c,k)=>`${f1(s.volDil-k.v0)} m³ injectés, bore ${f1(k.Cb0)} → ${f1(s.Cb)} ppm. Tmoy est revenue sur Tref, mais ΔI vaut toujours ${f2(s.DI)} %. Le bore a compensé la réactivité, pas la forme du flux.`},
  {f:['.seg[data-key="modeR"]','[data-c="bore"]','[data-bank="R"]'],hint:"Mode R › « Auto ». Bore : « Borication », « 10 », « Continu », « Lancer ». Quand R dépasse 185 pas, « Arrêter ».",
   sub:[['R en automatique',s=>s.modeR==='auto'],['Borication lancée',(s,c,k)=>s.volBor-k.vB0>0.005],['R ≥ 185 pas',s=>s.rods.R.p>=185],['Appoint arrêté',s=>!s.rea.run]],
   after:(s,c,k)=>`R : ${f0(k.R0)} → ${f0(s.rods.R.p)} pas, ΔI : ${f2(k.DI0)} → ${f2(s.DI)} %. Le bore a « tiré » R vers le haut et le flux s'est redressé.`},
  {f:['[data-c="di"]']},
  {}
 ],
 'l-xe':[
  {f:['[data-c="trend"]','[data-c="react"]']},
  {f:['[data-c="turb"]'],hint:"Turbine : vitesse « 10 », puis consigne 50 % (curseur, ou « −5 % » dix fois).",sub:[['Vitesse 10 %/min',s=>s.ramp===10],['Consigne 50 %',s=>Math.round(s.LtSet*100)<=50],['Charge atteinte',s=>s.Lt<=0.505]]},
  {f:['[data-c="trend"]','.spdseg','#spdSel','#rd-tm'],hint:"Passez en ×300. Dans Tendances, activez la courbe « Xénon » et la fenêtre « 8 h ». Quand l'alarme « Tmoy − Tref < −1,5 °C » apparaît, lancez une dilution de 300 L à 10 m³/h ; recommencez au besoin.",
   after:(s,c,k)=>`ρ Xe : ${f0(k.rh0.xe)} → ${f0(s.rho.xe)} pcm en 4 h. Vous avez dilué ${f1(s.volDil-k.vD0)} m³, soit ${f1(k.Cb0-s.Cb)} ppm, pour compenser.`},
  {f:['[data-c="turb"]','[data-c="bore"]'],hint:"Consigne 100 % à 5 %/min. Si Tmoy passe au-dessus de Tref de plus de 1 °C, borez 100 L à 5 m³/h.",
   after:(s,c,k)=>`ρ Xe : ${f0(k.rh0.xe)} → ${f0(s.rho.xe)} pcm. Borication totale pendant la remontée : ${f1(s.volBor-k.vB0)} m³.`},
  {f:['#aarBtn','[data-c="trend"]'],hint:"Protection › « AAR manuel » (deux appuis), puis ×300. La ligne de mesures de l'étape indique le minimum atteint.",
   after:(s,c,k)=>`Pic xénon : ${f0(k.pk)} pcm, à comparer aux −2 700 pcm de l'équilibre à pleine puissance.`},
  {}
 ],
 'l-pzr':[
  {f:['[data-c="pzr"]','[data-c="synop"]']},
  {f:['[data-c="turb"]','#rd-lp','#rd-pp'],hint:"Turbine : vitesse « 10 », consigne 80 % (« −5 % » quatre fois).",sub:[['Vitesse 10 %/min',s=>s.ramp===10],['Consigne 80 %',s=>Math.round(s.LtSet*100)<=80],['Charge atteinte',s=>s.Lt<=0.805]],
   after:(s,c,k)=>`Tmoy a baissé de ${f1(k.T0-s.Tavg)} °C. Niveau pressu : ${f1(k.Lp0)} → ${f1(s.Lpzr)} % (référence ${f1(s.Lref)}). Pression la plus basse : ${f1(k.minP)} bar. Charge RCV : ${f1(s.Qc)} m³/h, au-dessus des 13,6 de la décharge pour regonfler le niveau.`},
  {f:['.seg[data-key="heatMode"]','#rd-pp'],hint:"Pressuriseur : ligne Chaufferettes › « Forcé ».",after:s=>`Pression ${f1(s.Ppzr)} bar, aspersion automatique à ${f0(s.spray*100)} % : elle s'oppose aux chaufferettes.`},
  {f:['.seg[data-key="heatMode"]'],hint:"Ligne Chaufferettes › « Auto »."},
  {f:['.seg[data-key="chgMode"]','#chgMan','#rd-lp'],hint:"Ligne Charge › « Manuel », puis faites glisser « Charge man. » vers 5 m³/h. Passez en ×5.",sub:[['Charge en manuel',s=>s.chgMode==='man'],['Débit ≤ 6 m³/h',s=>s.chgMan<=6],['Niveau 2,5 % sous la référence',s=>s.Lpzr<s.Lref-2.5]],
   after:s=>`Niveau ${f1(s.Lpzr)} % pour une référence de ${f1(s.Lref)} %. Charge ${f1(s.Qc)} m³/h contre ${f1(s.Qld)} de décharge : le primaire perd ${f1(s.Qld-s.Qc)} m³/h.`},
  {f:['.seg[data-key="chgMode"]','#rd-lp'],hint:"Ligne Charge › « Auto ».",after:s=>`Niveau ${f1(s.Lpzr)} %, charge ${f1(s.Qc)} m³/h : retour à l'équilibre.`},
  {}
 ],
 'l-gv':[
  {f:['[data-c="are"]','[data-c="synop"]'],show:'[data-c="are"]'},
  {f:['[data-c="are"]','[data-c="turb"]','#rd-lg'],show:'[data-c="are"]',hint:"Turbine : vitesse « 30 », consigne 70 %.",sub:[['Vitesse 30 %/min',s=>s.ramp===30],['Consigne 70 %',s=>Math.round(s.LtSet*100)<=70],['Charge atteinte',s=>s.Lt<=0.705]],
   after:(s,c,k)=>`Niveau GV le plus bas : ${f1(k.minLg)} % pendant la baisse, alors que l'ARE envoyait plus d'eau que la vapeur n'en emportait. C'est la contraction. Pression GV : ${f1(k.Psg0)} → ${f1(s.Psg)} bar.`},
  {f:['[data-c="are"]','#rd-lg'],show:'[data-c="are"]',hint:"Rien à faire : observez le débit ARE et le niveau dans la carte Eau alimentaire. Passez en ×5 pour accélérer.",
   after:(s,c,k)=>`Niveau revenu à ${f1(s.Lsg)} % (il était monté jusqu'à ${f1(k.maxLg)} %). ARE ${f1(s.Wf*100)} % pour ${f1(s.Wst*100)} % de vapeur : l'eau suit la vapeur, le niveau ne fait qu'ajuster.`},
  {f:['[data-c="are"]','[data-c="turb"]','#rd-lg'],show:'[data-c="are"]',hint:"Turbine : consigne 90 % (vitesse toujours « 30 »).",sub:[['Vitesse 30 %/min',s=>s.ramp===30],['Consigne 90 %',s=>Math.round(s.LtSet*100)>=90],['Charge atteinte',s=>s.Lt>=0.895]],
   after:(s,c,k)=>`Niveau GV le plus haut : ${f1(k.maxLg)} % pendant la hausse, alors que la vapeur dépassait l'eau. C'est le gonflement. Pression GV : ${f1(k.Psg0)} → ${f1(s.Psg)} bar.`},
  {f:['.seg[data-key="areMode"]','#areMan','#rd-lg'],show:'[data-c="are"]',hint:"Eau alimentaire : Régul. ARE › « Manuel », puis faites glisser « Débit man. » vers 75 %.",sub:[['ARE en manuel',s=>s.areMode==='man'],['Débit 8 points ou plus sous la vapeur',s=>s.Wf<s.Wst-0.08],['Niveau < 47 %',s=>s.Lsg<47]],
   after:s=>`Débit ARE ${f0(s.Wf*100)} % contre ${f0(s.Wst*100)} % de vapeur : le GV perd de l'eau.`},
  {f:['[data-c="are"]','#rd-lg'],show:'[data-c="are"]',hint:"Rien à faire : laissez le niveau baisser jusqu'à 40 % et lisez l'estimation dans la ligne de mesures.",
   after:(s,c,k)=>`Le niveau a perdu ${f1(k.Lg0-s.Lsg)} % en ${dur(s.t-k.ts)}. Il restait encore ${f0(s.Lsg-15)} % avant l'AAR : ne laissez jamais un GV sans eau alimentaire.`},
  {f:['.seg[data-key="areMode"]','#rd-lg'],show:'[data-c="are"]',hint:"Régul. ARE › « Auto ».",after:(s,c,k)=>`Niveau minimal ${f1(k.minLg)} %, revenu à ${f1(s.Lsg)} %.`},
  {}
 ],
 'l-prot':[
  {f:['[data-c="prot"]']},
  {f:['.seg[data-key="sprayMode"]','#sprayMan','#rd-dtm'],hint:"Pressuriseur : Aspersion › « Manuel », curseur vers 40 %. Passez en ×2. La marge ΔT est dans le bandeau, famille Sûreté : arrêtez-vous quand elle passe sous 9 %.",
   sub:[['Aspersion en manuel',s=>s.sprayMode==='man'],['Ouverture ≈ 40 %',s=>s.sprayMan>=0.3],['Marge ΔT < 9 %',s=>s.dtMargin<9]],
   after:(s,c,k)=>`Pression ${f1(s.Ppzr)} bar, marge ΔT ${f1(s.dtMargin)} %. Le seuil de surtempérature est passé de ${f1(k.OT0)} à ${f1(s.OTsp)} % : à basse pression, l'eau est plus près de l'ébullition, la protection devient plus exigeante.`},
  {f:['.seg[data-key="sprayMode"]','#rd-pp'],hint:"Aspersion › « Auto ».",after:s=>`Pression ${f1(s.Ppzr)} bar, marge ${f1(s.dtMargin)} %.`},
  {f:['[data-c="prot"]']},
  {}
 ],
 'l-elec':[
  {f:['[data-c="elec"]'],show:'[data-c="elec"]'},
  {f:['#elcmd [data-act="dg"][data-v="A"]','#elw'],show:'[data-c="elec"]',hint:"Vue Électrique, sous le schéma : « Démarrer diesel A ».",after:s=>`Diesel A en service ; LHA reste alimenté par le ${s.el.src.LHA==='ts'?'TS':s.el.src.LHA==='ta'?'TA':'diesel'}.`},
  {f:['#elcmd [data-act="dg"][data-v="A"]'],show:'[data-c="elec"]',hint:"Même bouton, devenu « Arrêter diesel A »."},
  {f:['#elw','#rd-pn'],show:'[data-c="elec"]',hint:"Rien à faire : regardez l'alternateur et les tableaux pendant une minute.",after:s=>`Charge turbine ${f0(s.Lt*100)} % : les auxiliaires sont restés sur le TS, les pompes primaires n'ont pas vu la perte du réseau.`},
  {f:['[data-act="recouple"]'],hint:"Agir › Secondaire, carte Turbine : « Recoupler »."},
  {}
 ],
 'l-div':[
  {f:['[data-c="instr"]']},
  {f:['[data-c="react"]'],hint:"La vue Réactivité s'ouvre avec l'onglet « Réactivité » sous la vue centrale. Le bore critique et la position critique de R sont dans le bloc « Aides au pilotage du cœur » ; la marge d'arrêt, c'est −ρ total."},
  {f:['[data-bank="R"]','[data-act="rod"][data-v="10"]','#rd-td'],hint:"Touchez « Groupe R », puis « +10 » dix fois (ou « Tout ext. » puis « Stop » à 100). Passez en ×10 et attendez que le temps de doublement (bandeau, case Réactivité) redevienne « ∞ ». Le comptage et 1/M s'affichent dans la ligne de mesures.",sub:[['R ≥ 100 pas',s=>s.rods.R.p>=99.5],['Comptage stabilisé',(s,c,k)=>(k.st||0)>5]],
   after:(s,c,k)=>`1/M = ${fmt(c.k.c0/s.n,3)} à 100 pas. Notez-le : c'est votre premier point.`},
  {f:['[data-act="rod"][data-v="10"]','#rd-td'],hint:"« +10 » quatre fois, puis attendez la stabilisation.",sub:[['R ≥ 140 pas',s=>s.rods.R.p>=139.5],['Comptage stabilisé',(s,c,k)=>(k.st||0)>5]],
   after:(s,c,k)=>{ const m=c.k.c0/s.n; return `1/M = ${fmt(m,3)} à 140 pas. Pente depuis 100 pas : ${fmt((m-0.574)/40,4)} par pas → cote critique extrapolée ≈ ${f0(140+m/((0.574-m)/40))} pas.`; }},
  {f:['[data-act="rod"][data-v="10"]','#rd-td'],hint:"« +10 » deux fois. Près du critique, la stabilisation prend plusieurs minutes : ×10.",sub:[['R ≥ 160 pas',s=>s.rods.R.p>=159.5],['Comptage stabilisé',(s,c,k)=>(k.st||0)>5]],
   after:(s,c,k)=>{ const m=c.k.c0/s.n; return `1/M = ${fmt(m,3)} à 160 pas. Nouvelle extrapolation ≈ ${f0(160+m/((0.2-m)/20))} pas. L'estimation se resserre à mesure qu'on approche.`; }},
  {f:['[data-act="rod"][data-v="1"]','#rd-td'],hint:"« +1 », attendez 30 à 60 s ; recommencez jusqu'à voir un temps de doublement constant entre 60 et 120 s. S'il passe sous 40 s, « −1 ».",
   after:s=>`Critique à R ≈ ${f0(s.rods.R.p)} pas, temps de doublement ${TdTxt(s)}.`},
  {f:['[data-act="srInhib"]'],hint:"Quand l'alarme bleue « P6 » apparaît : Commandes › Protection › « Inhiber GS »."},
  {f:['[data-bank="R"]','#rd-pn','#rd-td'],hint:"Laissez monter. Au-dessus de 3 %, « −1 » ; si la puissance redescend sous 1 %, « +1 ». Visez un temps de doublement « ∞ » dans le bandeau."},
  {}
 ],
};
for(const [id,arr] of Object.entries(STEPX)){ const sc=SCN.find(x=>x.id===id); if(!sc) continue; arr.forEach((x,i)=>{ if(sc.steps[i]) Object.assign(sc.steps[i],x); }); }
/* ================= « En clair » : explications pour débutants ================= */
/* Une explication simple par étape (leçons) et un plan pas à pas (exercices). Le texte technique reste affiché en dessous. */
const ECLAIR={
 ihm:[
  "Un poste de pilotage se lit comme un journal : les gros titres en haut (le bandeau), ce qui presse juste en dessous (alarmes, actions en cours), puis le détail. Vous n'avez pas à tout regarder en même temps : vous passez du général au particulier.",
  "Le bandeau, c'est le tableau de bord d'une voiture : vitesse, température, carburant. Un coup d'œil suffit pour savoir si tout va bien. La petite courbe qui accompagne une valeur dit si elle bouge, ce qui compte souvent plus que la valeur elle-même.",
  "Le synoptique est un plan de la centrale qui s'anime : on y voit où l'eau et la vapeur circulent et ce que valent les mesures. Tant que tout est gris, tout est normal ; la couleur attire l'œil seulement là où il se passe quelque chose.",
  "Vous pouvez agir directement sur le plan : cliquer sur un équipement ouvre ses commandes principales, comme un clic droit sur une icône. Ce sont les mêmes boutons que dans les cartes de commandes, juste plus près de ce que vous regardez.",
  "Les actions rapides donnent l'essentiel. Pour tous les réglages, le lien en bas ouvre la carte complète de l'équipement, à droite de l'écran.",
  "Les commandes sont rangées par familles, comme les rayons d'un magasin : le cœur du réacteur, le circuit primaire, le circuit secondaire, la sûreté. Chaque famille a la même couleur dans le bandeau et dans les onglets.",
  "Les vues sont des façons différentes de regarder la même tranche : le plan, les courbes dans le temps, des diagrammes spécialisés. On en change selon la question qu'on se pose, puis on revient au plan.",
  "Quand vous lancez une action qui dure, le poste la garde en mémoire et vous montre où elle en est, comme la barre de progression d'un téléchargement. Vous pouvez l'arrêter à tout moment.",
  "Une alarme est un message du poste qui dit « regardez ici ». Elle clignote et sonne jusqu'à ce que vous l'acquittiez, c'est-à-dire que vous disiez « je l'ai vue ». La couleur dit à quel point c'est urgent.",
  "Les automatismes sont des pilotes automatiques : ils corrigent tout seuls les petits écarts. Votre rôle est de vérifier qu'ils font bien leur travail, comme un pilote d'avion surveille son pilote automatique.",
  "Surveiller, ce n'est pas fixer l'écran : c'est faire le tour régulièrement en se demandant « qu'est-ce qui a changé ? », et vérifier qu'une mesure surprenante est confirmée par une autre avant de réagir.",
  "Les opérateurs travaillent avec des règles simples : une action à la fois, vérifier qu'on touche le bon bouton, regarder l'effet avant de continuer, et s'arrêter en cas de doute. Ce sont des habitudes de fiabilité, pas de la lenteur.",
  "Vous connaissez maintenant le poste. La suite vous apprend à piloter le réacteur lui-même."
 ],
 tuto:[
  "Une centrale nucléaire est une énorme bouilloire. Le cœur du réacteur chauffe de l'eau gardée liquide par la pression (le <b>circuit primaire</b>). Cette eau passe dans les générateurs de vapeur, où elle fait bouillir l'eau d'un second circuit, sans jamais s'y mélanger. La vapeur fait tourner la turbine et l'alternateur, qui produit l'électricité.<br>Votre métier d'opérateur : faire produire au réacteur exactement la chaleur que la turbine consomme, et vérifier en permanence que tout reste dans les limites. Ici, rien à faire : lisez, puis <kbd>Suivant</kbd>.",
  "Pas besoin de tout retenir d'un coup. Trois chiffres comptent d'abord : la <b>puissance</b> du réacteur (combien de chaleur il produit), <b>Tmoy</b> (la température de l'eau qui le refroidit) et la <b>pression</b>.<br><b>Tref</b> est la température « voulue », calculée d'après ce que demande la turbine. Tant que Tmoy reste collée à Tref, le réacteur produit la bonne quantité de chaleur.",
  "La <b>réactivité</b> dit si la réaction en chaîne accélère, reste stable ou ralentit. Voyez-la comme un compte en banque. Le combustible neuf apporte un gros crédit ; plusieurs « freins » le compensent : les grappes, le bore dissous dans l'eau, l'eau chaude, le combustible chaud et le xénon.<br>Solde à 0 : la puissance reste constante. Solde positif : elle monte. Solde négatif : elle baisse.<br>Le <b>pcm</b> est l'unité de ce compte : un cent-millième. C'est petit, mais +100 pcm suffisent pour que la puissance double en 45 s environ.",
  "Les <b>grappes</b> sont des faisceaux de crayons qui absorbent les neutrons : les enfoncer freine la réaction, les remonter l'accélère. D'ordinaire, le groupe <b>R</b> bouge tout seul pour garder la bonne température. Vous allez le passer en manuel pour le déplacer vous-même et voir ce qui se passe.",
  "Un <b>pas</b> est un petit cran de déplacement, environ 1,6 cm. En remontant R, vous retirez un peu de frein : la puissance monte. Mais le combustible et l'eau chauffent, et un réacteur à eau se freine tout seul quand il chauffe. La puissance monte donc un peu, puis se stabilise d'elle-même.<br>C'est une qualité de sûreté essentielle de ce type de réacteur : il ne s'emballe pas tout seul.",
  "La turbine n'a pas changé, le réacteur produit donc maintenant un peu trop de chaleur : Tmoy est au-dessus de Tref. Remis en automatique, R va redescendre tout seul jusqu'à ce que les deux températures se rejoignent. Regardez-le faire.",
  "Monter la charge, c'est demander plus d'électricité à la turbine : elle prend plus de vapeur. Le réacteur doit fournir la chaleur correspondante. Vous ne touchez qu'à la turbine : les automatismes de grappes (GCP et R) remontent eux-mêmes ce qu'il faut. En fonctionnement normal, <b>c'est le réacteur qui suit la turbine</b>.",
  "Le <b>bore</b> est un frein dissous dans l'eau du circuit, un peu comme du sel dans l'eau. <b>Diluer</b>, c'est ajouter de l'eau pure : le frein diminue partout dans le cœur. <b>Borer</b>, c'est l'inverse.<br>Le bore agit lentement mais uniformément ; on s'en sert pour les changements lents et on garde les grappes pour les réglages rapides.",
  "Le <b>pressuriseur</b> est un grand réservoir relié au circuit : de l'eau en bas, de la vapeur en haut, comme une cocotte-minute. Pour monter la pression, on chauffe l'eau (<b>chaufferettes</b>) ; pour la baisser, on pulvérise de l'eau plus froide dans la vapeur (<b>aspersion</b>), qui la condense.<br>Vous allez ouvrir l'aspersion à la main et regarder la pression descendre.",
  "En automatique, la régulation reprend la main : elle chauffe jusqu'à retrouver 155 bar. C'est lent, quelques bar par minute : soyez patient.",
  "Une <b>alarme</b> signale qu'une grandeur est sortie de sa plage normale ou qu'un automatisme a agi. Comme en salle de commande, elle clignote, et un avertisseur sonore retentit pour les alarmes rouges et ambre, jusqu'à ce que vous l'<b>acquittiez</b>.<br>Acquitter veut dire « j'ai vu », pas « c'est réglé » : le voyant reste allumé tant que la cause est là.",
  "L'<b>AAR</b> (arrêt automatique du réacteur) est l'arrêt d'urgence : toutes les grappes tombent par leur propre poids dans le cœur en moins de 2 secondes, et la réaction en chaîne s'arrête. Les protections le déclenchent seules si une grandeur devient dangereuse ; ici, vous le déclenchez à la main.<br>Attendez-vous au klaxon d'alarme : <kbd>Acquitter</kbd> le fait taire.",
  "La réaction en chaîne est arrêtée, mais le cœur chauffe encore. Les produits de fission sont radioactifs et dégagent de la chaleur en se désintégrant : c'est la <b>puissance résiduelle</b>, quelques % au début, qui décroît pendant des jours.<br>Il faut donc continuer à refroidir : la vapeur part au condenseur, et l'eau de secours (ASG) alimente les générateurs de vapeur. C'est la règle de base de la sûreté : <b>arrêter, refroidir, confiner</b>.",
  "Vous savez maintenant que le réacteur suit la turbine, que les grappes règlent vite et le bore lentement, qu'il se freine seul quand il chauffe, et que même arrêté il faut le refroidir. Tout le reste du simulateur décline ces quatre idées."
 ],
 'l-cin':[
  "Une fission libère 2 à 3 neutrons, qui peuvent provoquer d'autres fissions : c'est la <b>réaction en chaîne</b>. Si chaque génération compte un peu plus de neutrons que la précédente, la puissance monte.<br>Sans un détail de la nature, elle monterait trop vite pour être pilotée : une petite partie des neutrons arrive en retard. Ces retardataires imposent un rythme lent. Cette leçon vous fait ressentir ce rythme.",
  "Vous ajoutez très peu de réactivité, environ +40 pcm. La puissance fait d'abord un petit bond immédiat, puis elle se met à monter de plus en plus vite, en doublant à intervalles réguliers.<br>Cet intervalle s'appelle le <b>temps de doublement</b> ; il est affiché dans le bandeau, case « Réactivité ». Plus il est court, plus ça monte vite.",
  "À 0,5 % de puissance, rien ne chauffe, donc rien ne freine la montée. Vers 1 %, le combustible commence à chauffer et se freine lui-même : c'est l'<b>effet Doppler</b>.<br>Ne touchez à rien et regardez le temps de doublement s'allonger : le réacteur se calme tout seul.",
  "Vous enfoncez les grappes : la puissance chute d'un coup, puis baisse plus doucement. Même avec beaucoup de frein, elle ne peut pas descendre plus vite qu'un certain rythme, car les neutrons retardataires continuent d'arriver pendant une minute environ.",
  "Le but : trouver la position où la puissance ne bouge plus, avec un temps de doublement « infini ». Allez-y doucement : un pas, attendez, observez, recommencez. C'est le geste de base du pilote.",
  "À retenir : grâce aux neutrons retardés, le réacteur réagit en dizaines de secondes, pas en millisecondes. Une petite réactivité suffit à faire monter la puissance, et la chaleur du combustible la freine d'elle-même."
 ],
 'l-fb':[
  "Un réacteur à eau sous pression a deux freins naturels qui serrent quand il chauffe. Le <b>combustible</b> chaud capture plus de neutrons sans fission (effet Doppler). L'<b>eau</b> chaude, plus dilatée, ralentit moins bien les neutrons (effet modérateur).<br>Plus il chauffe, plus il se freine : c'est rassurant pour la sûreté. Mais pour monter en puissance, il faut compenser ce frein, sinon la température chute.",
  "Vous coupez tous les automatismes de grappes, pour voir le réacteur se débrouiller seul.",
  "La turbine prend plus de vapeur, donc l'eau revient plus froide au réacteur. Eau plus froide, frein moins serré : la puissance augmente. Le réacteur suit donc la turbine tout seul !<br>Mais il le fait en se refroidissant, alors qu'on voudrait que sa température monte un peu avec la charge. Regardez l'écart Tmoy − Tref se creuser.",
  "Les <b>GCP</b> sont des grappes « grises », moins absorbantes. En automatique, ils se placent d'après la charge de la turbine en suivant un tableau calculé d'avance : à chaque charge, sa position. Ils compensent ainsi le frein naturel par anticipation. Remettez-les en auto : ils remontent et la température revient.",
  "R fait l'ajustement fin : il compare la température mesurée à la température voulue et corrige l'écart restant. Les GCP font le réglage grossier, calculé d'avance ; R fait le réglage fin, d'après la mesure.",
  "À retenir : le réacteur suit naturellement la turbine. Les grappes ne « fabriquent » pas la puissance, elles servent surtout à garder la bonne température."
 ],
 'l-di':[
  "Le cœur mesure environ 3,7 m de haut, et la puissance n'y est pas répartie également. Le <b>ΔI</b> compare la moitié haute et la moitié basse : négatif, il y a plus de puissance en bas ; positif, plus en haut.<br>On veut une répartition équilibrée, car si la puissance se concentre à un endroit, le combustible y chauffe trop. Sur le diagramme ΔI, le point doit rester dans la bande verte.",
  "Les grappes entrent par le haut du cœur. En les enfonçant, vous freinez surtout la moitié haute : la puissance se décale vers le bas et le point du diagramme part vers la gauche. Comme la turbine demande toujours autant, c'est la température qui baisse.",
  "Pour retrouver la bonne température sans toucher aux grappes, on retire du frein partout : on dilue. La température revient… mais le point reste à gauche, car les grappes sont toujours enfoncées et écrasent toujours le haut.<br>Le bore change la quantité de puissance, pas sa répartition.",
  "Astuce de pilote : pour remonter les grappes, on ajoute du bore. Le bore freine partout, la température baisse, et la régulation remonte R pour compenser. Le point revient vers le centre.<br>À retenir : <b>c'est le bore qui décide où se trouvent les grappes</b>.",
  "Le xénon est un poison qui se forme là où la puissance était quelques heures plus tôt. Si la puissance part vers le bas, le xénon s'y accumule ensuite et la repousse vers le haut, puis l'inverse : la puissance peut se balancer lentement entre haut et bas sur une journée. Surveiller le ΔI, c'est aussi éviter ce balancement.",
  "À retenir : les grappes servent aux réglages rapides mais déforment la répartition de puissance ; le bore sert aux réglages lents, sans la déformer."
 ],
 'l-xe':[
  "Le <b>xénon 135</b> est un produit de fission qui absorbe les neutrons comme une éponge. Il naît surtout de l'iode 135, avec plusieurs heures de retard, et les neutrons le détruisent en permanence.<br>À puissance constante, production et destruction s'équilibrent. Si la puissance change, cet équilibre est rompu pendant des heures.",
  "Vous baissez la charge : il y a moins de neutrons, donc moins de xénon détruit. Mais l'iode déjà présent continue de se transformer en xénon : la quantité de poison va augmenter.",
  "Le poison s'accumule et freine de plus en plus le réacteur. La régulation remonte R pour compenser, mais R a une butée. Pour tenir, ajoutez de l'eau pure par petites doses : vous retirez du frein « bore » pour compenser le frein « xénon ».<br>Passez en ×300 : cela prend des heures.",
  "En remontant, les neutrons détruisent le xénon plus vite qu'il ne se forme : le frein disparaît peu à peu et le réacteur a tendance à accélérer. R s'enfonce pour compenser ; si cela ne suffit pas, il faut ajouter du bore.",
  "Après un arrêt, plus aucun neutron ne détruit le xénon, mais l'iode continue de le produire : le poison monte pendant une dizaine d'heures. Il peut devenir si fort qu'on ne peut plus redémarrer avant qu'il ait décru. Étape facultative.",
  "À retenir : toute baisse de puissance se paie quelques heures plus tard par de la dilution, toute remontée par de la borication. Il faut anticiper."
 ],
 'l-pzr':[
  "Dans le circuit primaire, l'eau dépasse 300 °C mais ne bout pas, grâce à une pression de 155 bar, soit plus de 150 fois la pression atmosphérique. Le <b>pressuriseur</b> tient cette pression : de l'eau en bas, de la vapeur en haut, à l'équilibre, comme une cocotte-minute.<br>Chauffer l'eau fait plus de vapeur et monter la pression. Pulvériser de l'eau froide dans la vapeur la condense et baisse la pression.<br>Le <b>RCV</b>, lui, ajoute ou retire de l'eau du circuit pour garder le bon niveau.",
  "En baissant la charge, l'eau du circuit refroidit un peu et se contracte, comme le liquide d'un thermomètre. Le niveau du pressuriseur baisse, la vapeur a plus de place et la pression baisse. Regardez les automatismes réagir.",
  "Vous forcez le chauffage au maximum. La pression monte… jusqu'à ce que l'aspersion automatique s'ouvre pour l'empêcher d'aller trop haut. Deux régulations s'opposent, et la pression se stabilise un peu au-dessus de la normale.",
  "Retour en automatique : la régulation ramène d'elle-même la pression à 155 bar.",
  "Le circuit envoie en permanence un peu d'eau vers le RCV (décharge) et en reçoit autant (charge). Si vous chargez moins que vous ne déchargez, le circuit se vide lentement et le niveau du pressuriseur baisse. C'est exactement ce qu'on observerait avec une petite fuite.",
  "Retour en automatique : la charge augmente pour remplir de nouveau.",
  "À retenir : le pressuriseur est à la fois le baromètre et la jauge du circuit. Si son niveau bouge alors que la température est stable, c'est que de l'eau entre ou sort."
 ],
 'l-gv':[
  "Le <b>générateur de vapeur</b> (GV) est un échangeur de chaleur. L'eau du réacteur circule dans des milliers de petits tubes et fait bouillir l'eau du second circuit, sans jamais s'y mélanger. La vapeur produite part à la turbine.<br>Il faut garder assez d'eau dans le GV, un niveau vers 50 % : c'est le rôle de l'eau alimentaire (<b>ARE</b>). Tant que l'eau qui entre égale la vapeur qui sort, le niveau ne bouge pas.",
  "Piège : le niveau mesuré est celui d'un mélange d'eau et de bulles, qui gonfle ou se tasse quand la pression change.<br>Vous réduisez brutalement la demande de vapeur. La pression dans le GV monte et les bulles s'écrasent : le mélange se tasse et le niveau baisse, alors même qu'on envoie plus d'eau qu'il n'en sort ! C'est la <b>contraction</b>, un effet contre-intuitif. Le niveau revient ensuite.",
  "Si la régulation ne regardait que le niveau, elle serait trompée par les bulles. Elle commence donc par envoyer autant d'eau qu'il sort de vapeur, puis corrige doucement le niveau. Regardez les deux débits se rejoindre.",
  "Cette fois la turbine demande plus de vapeur. La pression baisse, l'eau bout davantage, les bulles grossissent : le mélange gonfle et le niveau monte un moment, alors que le GV se vide en réalité. C'est le <b>gonflement</b>.",
  "Vous prenez la main sur l'eau alimentaire et envoyez moins d'eau qu'il ne sort de vapeur : le GV se vide doucement.",
  "Estimez le temps qu'il faudrait pour atteindre le seuil d'arrêt d'urgence (15 %) : la ligne de mesures le calcule. Il est très court, et encore plus si toute l'eau alimentaire disparaît.",
  "En automatique, la régulation envoie plus d'eau qu'il ne sort de vapeur, jusqu'à retrouver 50 %.",
  "À retenir : un GV qui manque d'eau ne refroidit plus le réacteur. C'est pour cela qu'il existe plusieurs secours d'eau alimentaire."
 ],
 'l-prot':[
  "Les <b>protections</b> sont des gardiens automatiques : elles mesurent en continu les grandeurs importantes et, si l'une dépasse une limite, déclenchent l'arrêt d'urgence sans attendre l'opérateur. Chaque limite est fixée avec une marge, pour que le combustible et le circuit ne soient jamais endommagés.<br>La <b>marge ΔT</b> indique à quelle distance vous êtes du seuil d'arrêt lié à la surchauffe du combustible.",
  "Quand la pression baisse, l'eau bout plus facilement au contact du combustible, et le risque de surchauffe augmente. Le gardien en tient compte et rapproche son seuil : la marge fond à mesure que la pression baisse.<br>Arrêtez-vous bien avant qu'elle n'atteigne zéro !",
  "Retour en automatique : la pression remonte et la marge revient.",
  "Certaines protections n'ont de sens qu'à certaines puissances : perdre une pompe à 2 % de puissance n'a pas les mêmes conséquences qu'à 100 %. Les <b>permissifs</b> sont des interrupteurs automatiques qui activent ou désactivent ces protections selon la puissance.",
  "À retenir : votre travail n'est pas d'éviter l'arrêt d'urgence à tout prix, mais de garder vos marges pour ne jamais en avoir besoin."
 ],
 'l-elec':[
  "Une centrale produit de l'électricité, mais elle en <b>consomme</b> aussi beaucoup : ses grosses pompes tournent à l'électricité. En marche, elle se sert sur sa propre production.<br>Le courant arrive sur des <b>tableaux</b>, de grandes armoires électriques. Les tableaux <b>normaux</b> font tourner la production ; les tableaux <b>secourus</b>, un par voie, gardent les systèmes de sûreté.",
  "Chaque voie de secours a son <b>diesel</b>, un gros moteur comme celui d'un navire. Il démarre tout seul si son tableau perd le courant. On l'essaie régulièrement pour être sûr qu'il démarrera le jour où il le faudra.",
  "L'essai est fini : on remet le diesel en attente. Il veille à nouveau.",
  "Le réseau électrique vient de disparaître. La centrale ne peut plus envoyer son électricité, mais elle continue de tourner pour elle-même : c'est l'<b>îlotage</b>. Les pompes n'ont rien vu.",
  "Le réseau est revenu : on se raccorde à nouveau. Si l'îlotage avait échoué, la centrale aurait pris le courant d'un second réseau, puis de ses diesels.",
  "À retenir : la centrale a plusieurs sources de secours, essayées l'une après l'autre. Les plus importantes, les diesels, sont doublées : une par voie."
 ],
 'l-div':[
  "Le réacteur est à l'arrêt, <b>sous-critique</b> : chaque chaîne de réactions finit par s'éteindre. Mais une source de neutrons en relance sans cesse, donc les compteurs comptent quelque chose.<br>Plus on approche de la criticité, plus chaque chaîne dure longtemps et plus le comptage monte. On s'en sert comme d'un détecteur d'approche : <b>1/M</b> descend vers 0 à mesure qu'on s'approche du point critique.",
  "Avant de démarrer, on vérifie que tout est dans l'état prévu : comme une check-list avant le décollage. Les grappes de sécurité doivent être en haut, prêtes à tomber, et le bore doit être celui que l'on attendait.",
  "Remontez R par paliers. Après chaque palier, attendez que le comptage se stabilise : plus il est élevé, plus vous êtes proche.",
  "Avec deux mesures, on trace une droite et on la prolonge jusqu'à 1/M = 0 : on obtient une estimation de la position critique. C'est comme estimer la distance d'un obstacle pour ralentir à temps.",
  "Plus près de la criticité, le comptage met plus longtemps à se stabiliser : soyez patient. L'estimation devient plus précise.",
  "On avance maintenant tout doucement. Quand le comptage ne se stabilise plus et monte régulièrement, le réacteur est <b>critique</b> : il entretient seul la réaction en chaîne. Le temps de doublement doit rester long, au moins une minute : c'est un démarrage en douceur.",
  "Les compteurs de démarrage sont très sensibles et saturent quand la puissance augmente. À P6, des détecteurs moins sensibles prennent le relais ; il faut alors inhiber les premiers, sinon leur seuil arrête le réacteur.",
  "Vers 1 %, le combustible chauffe et se freine lui-même. Corrigez R d'un pas, puis laissez à la puissance le temps de réagir avant de corriger encore. Le but : une puissance qui ne bouge presque plus.",
  "À retenir : on approche la criticité par paliers, on prédit, on ralentit, puis on laisse la physique stabiliser la puissance."
 ],
 div:{d:"Approcher la criticité, c'est avancer vers un bord dans le brouillard : petits pas, et une mesure à chaque fois. Le 1/M sert de télémètre. Une fois critique, la puissance monte seule, puis le Doppler la stabilise vers 1 %. Les deux pièges : extraire trop vite, et oublier d'inhiber la gamme source.",e:"Démarrer un réacteur, c'est l'amener de l'arrêt, où la réaction en chaîne s'éteint d'elle-même, à la <b>criticité</b>, où elle s'entretient seule, sans jamais aller trop vite. On avance par paliers en mesurant à chaque fois si l'on se rapproche.",
  plan:["Remontez R par paliers de 20 à 30 pas. Après chaque palier, attendez que le comptage se stabilise et lisez 1/M dans la ligne d'information.","Quand 1/M passe sous 0,25, réduisez les paliers à 2 à 5 pas : vous êtes proche.","Quand un temps de doublement constant apparaît, cessez d'extraire : le réacteur est critique.","À l'alarme P6, inhibez la gamme source (Agir › Protection).","Laissez monter jusqu'à 1 à 3 %, puis stabilisez par petites corrections d'un pas."]},
 divdil:{d:"Diverger par dilution, c'est approcher le bord du réacteur critique sans toucher aux grappes : on retire du frein dissous dans l'eau, lot après lot. L'eau pure met du temps à agir et continue d'agir après l'arrêt de l'appoint : c'est pour cela qu'on dilue par petits lots et qu'on attend toujours.",e:"Cette fois, les grappes restent où elles sont. On rapproche le réacteur de la criticité en retirant un peu du bore dissous dans l'eau, par petites quantités, en mesurant à chaque fois si l'on se rapproche.",
  plan:["Agir › Bore : mode Dilution, débit 10 m³/h, volume 3 m³, puis « Lancer l'appoint ».","Quand l'appoint s'arrête, attendez que le comptage se stabilise (Td « stable ») et regardez 1/M dans la vue Réactivité, « selon la dilution ».","Recommencez avec des lots plus petits : 3 m³, puis 1 m³, puis 300 L et 100 L quand 1/M passe sous 0,25.","Quand un temps de doublement apparaît, n'ajoutez plus d'eau pure. À P6, inhibez la gamme source (Agir › Protection).","Laissez monter jusqu'à 1 à 3 %, puis stabilisez avec R par pas de 1."]},
 demarr:{d:"Un démarrage, c'est une suite de paliers où l'on change d'outil : les grappes et 1/M pour diverger, le Doppler pour se poser, le bore pour aller plus haut, la turbine pour produire, puis les automatismes et le bore pour suivre. À chaque palier, on vérifie avant de continuer.",e:"On part d'un réacteur arrêté mais chaud et on va jusqu'à la pleine production d'électricité : d'abord réveiller la réaction en chaîne tout doucement, puis chauffer, puis envoyer la vapeur à la turbine et monter jusqu'à 100 %.",
  plan:["Divergence : R par paliers de 20 à 40 pas, 1/M après chaque palier (vue Réactivité), puis 1 à 2 pas près de 170 pas. Td entre 60 et 120 s.","À P6 : Agir › Protection › Inhiber GS.","Posez-vous vers 1 à 3 % une minute (palier d'échauffement), en corrigeant R d'un pas.","Montez vers 10–12 % : extrayez R jusque vers 200 pas, puis diluez par lots de 1 m³. À P10 : Agir › Protection › Bloquer seuil bas.","Couplez (Agir › Turbine), montez la charge vers 13 %, passez les GCP puis R en automatique quand Tmoy est sur Tref.","Vitesse 3 %/min, consigne 100 % : borez si R descend sous 180 pas, diluez s'il approche 215 pas."]},
 montee:{d:"En mode G, vous ne pilotez pas le réacteur mais la turbine : les grappes suivent. Leurs réglages automatiques ne sont jamais parfaits, et c'est au bore de corriger la dérive lente pour garder R dans sa bande. Monter doucement protège le combustible.",e:"Le réacteur chauffe déjà, mais sa vapeur part directement au condenseur : aucune électricité n'est produite. Il faut raccorder l'alternateur au réseau, puis augmenter progressivement la production jusqu'à 100 %, en laissant les automatismes faire suivre le réacteur.",
  plan:["Couplez l'alternateur (Agir › Turbine).","Montez la charge vers 13 à 14 %, puis passez les GCP en automatique en lançant une borication de 1 m³.","Quand Tmoy est revenue sur Tref, passez R en automatique.","Réglez la vitesse à 3 %/min et la consigne à 100 %, puis passez en ×5.","Surveillez R : s'il descend vers 150 pas, borez ; s'il monte trop haut, diluez. Gardez un œil sur le ΔI."]},
 suivi:{d:"Le vrai adversaire du suivi de charge est le xénon, qui réagit avec des heures de retard. Après la baisse, il s'accumule et freine le réacteur : il faut diluer, assez et tôt. À la remontée, il disparaît et accélère le réacteur : il faut borer.",e:"La nuit ou le week-end, le réseau a besoin de moins d'électricité : la centrale baisse sa production, puis la remonte. La manœuvre en elle-même est simple ; la difficulté, c'est le <b>xénon</b>, qui continue d'évoluer pendant des heures après chaque changement.",
  plan:["Réglez la vitesse à 5 %/min et la consigne à 50 %.","Dès le début du palier, diluez par lots à 20 ou 30 m³/h pour garder R dans sa bande et Tmoy sur Tref.","Passez en ×60 et contrôlez régulièrement R, Tmoy − Tref et le ΔI.","Après 2 h de palier, remontez à 100 %.","Pendant la remontée, borez quand R s'enfonce."]},
 arret:{d:"Arrêter, c'est baisser la charge, séparer la turbine du réseau, puis enfoncer les grappes. Les grappes arrêtent la réaction ; le bore garantit qu'elle restera arrêtée, même quand le xénon aura disparu ou que l'eau aura refroidi.",e:"Mettre à l'arrêt à chaud, c'est arrêter la réaction en chaîne tout en gardant le circuit chaud et sous pression, prêt à redémarrer. On le fait en douceur, puis on ajoute assez de bore pour être certain que le réacteur ne redémarrera pas tout seul, même quand le xénon aura disparu.",
  plan:["Baissez la charge à 5 %.","Découplez la turbine : la vapeur part au condenseur.","Insérez les GCP puis R : la puissance s'effondre.","Borez jusqu'à une marge d'arrêt de 3 000 pcm (la réactivité totale doit valoir −3 000 pcm ou moins).","Vérifiez que Tmoy se stabilise vers 286 °C."]},
 essaidg:{d:"Un matériel de secours qui ne sert presque jamais doit être essayé, sinon on découvre sa panne le jour où l'on en a besoin. On l'essaie une voie à la fois, pour que l'autre reste toujours prête.",e:"Les <b>diesels de secours</b> ne servent que si tout le reste a lâché. Pour être sûr qu'ils démarreront ce jour-là, on les essaie régulièrement : démarrage, quelques minutes de marche, arrêt.",
  plan:["Ouvrez la vue Électrique (onglet sous la vue centrale).","Démarrez le diesel A et attendez qu'il soit en service (environ 10 s).","Passez en ×5 et laissez-le tourner 5 minutes.","Arrêtez-le : il revient « prêt ».","Recommencez avec le diesel B, jamais les deux en même temps."]},
 h3:{d:"Sans aucun courant, la vapeur des générateurs de vapeur fait encore tourner une pompe qui les alimente : c'est elle qui évacue la chaleur du cœur. Les batteries gardent les commandes pendant une heure. Il fallait rétablir une source avant : le diesel d'ultime secours.",e:"C'est le scénario de Fukushima, en plus doux : plus de réseau et plus de diesels. Il ne reste que la vapeur, les batteries et un dernier groupe électrogène, le <b>DUS</b>, ajouté après l'accident japonais.",
  plan:["Attendez la perte des sources (une minute) et regardez la vue Électrique : diesels en défaut, LHA et LHB hors tension.","Vérifiez que l'ASG alimente encore les GV (turbopompe, sur la vapeur).","Démarrez le DUS (bouton sous le schéma électrique).","Attendez environ 2 minutes : il reprend un tableau secouru.","Vérifiez que l'IS et la charge RCV sont de nouveau disponibles."]},
 tpa:{d:"Une pompe d'eau alimentaire perdue, c'est un générateur de vapeur qui se vide : il sort plus de vapeur qu'il n'entre d'eau. La parade est de réduire vite la vapeur demandée, donc la charge, et d'appeler la pompe de secours. Sans rien faire, le niveau atteint le seuil d'arrêt automatique en moins de deux minutes.",e:"L'eau qui remplit les générateurs de vapeur est envoyée par deux grosses pompes entraînées par de petites turbines à vapeur (les <b>TPA</b>). Si l'une s'arrête à pleine puissance, l'autre ne fournit qu'un peu plus de la moitié de l'eau nécessaire : les GV commencent à se vider. Tout se joue en quelques dizaines de secondes."},
 ilot:{d:"Sans réseau, la turbine n'alimente plus que la centrale elle-même. La vapeur en trop part au condenseur et les grappes s'enfoncent pour réduire la puissance. Ensuite, le xénon s'accumule et freine le réacteur : il faut diluer un peu (ajouter de l'eau pure) pour garder la température. C'est réussi si la tranche se stabilise sans arrêt automatique, prête à se recoupler.",e:"L'<b>îlotage</b>, c'est se retrouver coupé du réseau électrique, par exemple après un défaut sur une ligne. La centrale doit continuer à tourner en n'alimentant plus que ses propres équipements, quelques % de sa puissance. La turbine perd d'un coup presque toute sa charge : il y a soudain beaucoup trop de vapeur et de chaleur, et les automatismes doivent encaisser ce choc."},
 drop:{d:"Une grappe tombée freine une partie du cœur : la puissance y baisse et se déséquilibre. Remonter les autres grappes aggraverait ce déséquilibre, c'est pourquoi l'extraction est bloquée. On baisse donc la charge pour retrouver l'équilibre des températures, puis on réduit la puissance le temps de comprendre.",e:"Une <b>grappe</b> est l'un des faisceaux absorbants qui pilotent le réacteur. Si une seule tombe dans le cœur, elle freine fortement la zone autour d'elle : la puissance se déséquilibre, d'un côté à l'autre du cœur et entre le haut et le bas. Le reste du réacteur cherche à compenser."},
 spray:{d:"Une vanne d'aspersion bloquée ouverte condense la vapeur du pressuriseur plus vite que les chaufferettes ne la reproduisent : la pression baisse sans fin. Trop basse, l'eau risquerait de bouillir sur le combustible, et une protection arrête le réacteur. Il fallait trouver la vanne et isoler sa ligne avant.",e:"L'<b>aspersion</b> pulvérise de l'eau dans la vapeur du pressuriseur pour baisser la pression. Si sa vanne reste bloquée ouverte, la pression baisse sans s'arrêter, même chaufferettes à fond. Une pression trop basse rapproche l'eau de l'ébullition au contact du combustible."},
 leak:{d:"Une fuite fait perdre de l'eau au circuit primaire. Le pressuriseur, qui sert de jauge, le montre : son niveau baisse alors que la température ne change pas, et la régulation envoie plus d'eau pour compenser. Il fallait trouver la ligne qui fuit et l'isoler.",e:"Le circuit primaire échange sans cesse de l'eau avec le <b>RCV</b>. Si la ligne qui en retire fuit, le circuit perd de l'eau : le niveau du pressuriseur, qui sert de jauge, baisse. Il faut trouver d'où vient la perte."},
 are:{d:"La vanne d'eau alimentaire s'est ouverte en grand : le générateur de vapeur se remplit trop. Trop plein, il enverrait de l'eau liquide vers la turbine, qui serait abîmée ; une protection l'arrête avant. Il fallait reprendre la vanne à la main et doser l'eau.",e:"La régulation <b>ARE</b> dose l'eau envoyée dans les générateurs de vapeur. Si elle ouvre en grand par erreur, les GV se remplissent trop. Un GV trop plein risque d'envoyer de l'eau liquide vers la turbine, ce qui l'abîmerait : des protections surveillent ce niveau haut."},
 dil:{d:"De l'eau pure entre sans que personne l'ait demandée : le bore se dilue et le frein diminue lentement. Les grappes compensent en s'enfonçant, si bien qu'on ne voit presque rien… sauf des grappes qui descendent sans raison. Il fallait le remarquer, couper l'appoint et rajouter du bore.",e:"Le <b>bore</b> dissous dans l'eau freine le réacteur. Si une vanne d'eau pure s'ouvre toute seule, ce bore est dilué sans que personne l'ait demandé : le frein diminue lentement et le réacteur gagne de la réactivité. C'est discret : au début, on voit seulement les grappes qui compensent."},
 rodwd:{d:"Juste après le démarrage, rien ne freine encore la puissance : le combustible est froid. Des grappes qui sortent toutes seules la font grimper de plus en plus vite. Le passage en manuel ne suffisant pas, la seule réponse sûre était l'arrêt d'urgence manuel, tout de suite.",e:"Juste après le démarrage, la puissance est minuscule et rien ne la freine encore, car le combustible est froid. Si des grappes sortent toutes seules, la puissance grimpe très vite. Il faut réagir dans les secondes qui suivent."},
 gmpp:{d:"Une pompe primaire s'arrête : une boucle n'est plus correctement refroidie, et la protection arrête aussitôt le réacteur. Le travail commence après : vérifier que l'arrêt s'est bien passé, que la chaleur résiduelle est évacuée, puis stabiliser la tranche.",e:"Les trois <b>pompes primaires</b> (GMPP) font circuler l'eau dans le cœur. Si l'une s'arrête à pleine puissance, une boucle n'est plus correctement refroidie et la protection arrête le réacteur. À vous ensuite de stabiliser la tranche avec deux pompes sur trois."},
 mdte:{d:"Plus de réseau et un îlotage raté : la centrale n'a plus de courant extérieur. Les diesels prennent le relais des systèmes de sûreté en dix secondes, mais les pompes primaires s'arrêtent : l'eau du réacteur circule alors toute seule, chaude en haut, froide en bas. C'est réussi si tout cela se met en place sans intervention.",e:"La centrale peut perdre tout le courant qui vient de l'extérieur : réseau principal et réseau de secours. Ses <b>diesels</b> démarrent alors pour garder les systèmes de sûreté. Les grosses pompes du réacteur, elles, s'arrêtent : il faut vérifier que la chaleur s'évacue quand même."},
 dgko:{d:"Un diesel n'a pas démarré : il ne restait qu'une voie de secours. Elle suffit, mais une seconde panne serait grave. Il fallait le voir dans la vue électrique et rétablir la voie perdue avec le diesel d'ultime secours.",e:"Comme dans la perte des alimentations externes, mais un des deux diesels refuse de démarrer. La centrale tient sur une seule voie de secours : à vous de rétablir la seconde."},
 lhb:{d:"Rien ne bouge dans les grandeurs : la production n'utilise pas les tableaux secourus. Mais la moitié des secours est perdue, et la règle est claire : on ne reste pas en production sans redondance. On baisse donc la puissance calmement.",e:"Un tableau électrique de secours tombe en panne. La centrale continue de produire normalement, mais si un accident survenait maintenant, il ne resterait plus qu'une voie de secours sur deux."}
};
for(const [id,v] of Object.entries(ECLAIR)){ const sc=SCN.find(x=>x.id===id); if(!sc) continue; if(Array.isArray(v)){ v.forEach((e,i)=>{ if(sc.steps&&sc.steps[i]) sc.steps[i].e=e; }); } else { sc.e=v.e; if(v.plan) sc.plan=v.plan; if(v.d) sc.d=v.d; } }
const LVL={v:(store('lvl')==='exp')?'exp':'deb'};
const isDeb=()=>LVL.v==='deb';
function lvlSet(v){ LVL.v=v; store('lvl',v); if(A.ctx){ A.ctx.dirty=true; renderMission(true); } if(!$('#brief').hidden&&A.scn){ const keep=A.paused; showBrief(); A.paused=keep; } $$('.lvlseg button').forEach(b=>{ b.classList.toggle('on',b.dataset.lvl===v); b.setAttribute('aria-pressed',String(b.dataset.lvl===v)); }); }
/* encadré « En clair » : fixe pour les corrections commentées, sinon repliable, replié ou déplié d'une étape à l'autre selon le dernier choix */
const ecBox=(h,lab,fixe)=>fixe?'<div class="eclair"><span class="ecl">'+lab+'</span>'+h+'</div>':'<details class="eclair ecd"'+(store('ecFerme')?'':' open')+'><summary><span class="ecl">'+(lab||'En clair')+'</span></summary>'+h+'</details>';
document.addEventListener('toggle',e=>{ if(e.target.matches&&e.target.matches('details.ecd')) store('ecFerme',!e.target.open); },true);
const planBox=(scn,open)=>scn.plan?'<details class="eclair plan"'+(open?' open':'')+'><summary><span class="ecl">Le plan, en clair</span></summary><ol>'+scn.plan.map(x=>'<li>'+x+'</li>').join('')+'</ol></details>':'';
const lvlSeg=()=>'<div class="lvlseg" role="group" aria-label="Niveau des explications"><span>Explications :</span><button type="button" data-lvl="deb" class="'+(LVL.v==='deb'?'on':'')+'" aria-pressed="'+(LVL.v==='deb')+'">Débutant</button><button type="button" data-lvl="exp" class="'+(LVL.v==='exp'?'on':'')+'" aria-pressed="'+(LVL.v==='exp')+'">Confirmé</button></div>';
document.addEventListener('click',e=>{ const b=e.target.closest('.lvlseg button'); if(b) lvlSet(b.dataset.lvl); });
$$('.lvlseg button').forEach(b=>{ b.classList.toggle('on',b.dataset.lvl===LVL.v); b.setAttribute('aria-pressed',String(b.dataset.lvl===LVL.v)); });

/* Formateur pour les exercices : premier conseil applicable */
/* Procédure des exercices : comme une gamme en salle de commande, une suite d'étapes cochées au fil de l'eau.
   L'étape en cours est affichée avec son « Comment faire ? » ; une étape cochée le reste. */
const GAMME={
 div:[
  {t:'Premier palier : R à 100 pas, puis 1/M',f:s=>s.rods.R.p>=99,h:"Groupe R sélectionné (Agir › Grappes), « +10 » dix fois, ou « Tout ext. » puis « Stop ». Attendez que le comptage se stabilise (temps de doublement « stable ») et lisez 1/M : ligne de mesures ci-dessous, ou vue Réactivité qui trace la courbe."},
  {t:'Deuxième palier : R à 140 pas, 1/M et cote extrapolée',f:s=>s.rods.R.p>=139,h:"« +10 » quatre fois, puis attendez la stabilisation (×5 ou ×10). Avec deux points, la vue Réactivité prolonge la droite 1/M jusqu'à 0 : c'est la position critique estimée. Comparez-la à la prévision, 170 ± 25 pas."},
  {t:'Troisième palier : R à 160 pas',f:s=>s.rods.R.p>=159,h:"« +10 » deux fois. Près du critique, le comptage met plusieurs minutes à se stabiliser : passez en ×10. La cote extrapolée doit se resserrer vers 170 pas."},
  {t:'Approche fine jusqu\'à la criticité',f:s=>s.n>1e-8&&s.rate>0&&s.Td<300,h:"« +1 » ou « +2 », puis 30 à 60 s d'attente, et ainsi de suite. Quand le comptage ne se stabilise plus et monte avec un temps de doublement constant, le réacteur est critique. Visez 60 à 120 s, jamais moins de 20 s."},
  {t:'Inhiber la gamme source à P6',f:s=>s.srInhib,h:"Quand l'alarme « P6 » apparaît (vers 10³ c/s) : Agir › Protection › « Inhiber GS », tout de suite. Sinon l'AAR tombe à 10⁵ c/s."},
  {t:'Laisser monter jusqu\'à 1 %',f:s=>s.n>=0.01,h:"Passez en ×10 et surveillez le temps de doublement (60 à 120 s). Rien d'autre à faire : chaque doublement prend une à deux minutes, il en faut une quinzaine."},
  {t:'Stabiliser entre 1 et 3 %',f:(s,c)=>c.o.stab!=null,h:"Vers 1 %, le Doppler freine seul la montée. Corrigez R d'un pas (« −1 » au-dessus de 3 %, « +1 » si la puissance retombe sous 1 %), puis attendez une minute avant de recorriger. Il faut tenir 2 minutes quasi stable."}],
 divdil:[
  {t:'Lancer un premier lot de 3 m³',f:s=>s.Cb<1126,h:"Agir › Bore : mode « Dilution », débit 10 m³/h, volume 3 m³, puis « Lancer l'appoint ». Le groupe R reste à 200 pas pendant toute l'approche."},
  {t:'Lots de 3 m³ : attendre et relever 1/M',f:s=>s.Cb<=1105,h:"L'appoint s'arrête seul à la fin du lot. Attendez que le comptage se stabilise (temps de doublement « stable »), puis lisez 1/M dans la vue Réactivité, « selon la dilution ». Relancez un lot de 3 m³."},
  {t:'Réduire les lots : 1 m³, puis 300 L, puis 100 L',f:s=>s.n>1e-8&&s.rate>0&&s.Td<300,h:"Quand 1/M passe sous 0,25, réduisez les lots. La droite 1/M prolongée jusqu'à 0 donne le volume qui reste à injecter : n'en injectez jamais plus de la moitié d'un coup. Attendez toujours la stabilisation."},
  {t:'Critique : plus d\'eau pure',f:s=>s.n>1e-7,h:"Un temps de doublement apparaît : n'ajoutez plus d'eau, celle qui est déjà injectée continue d'agir. Si l'appoint tourne encore, « Arrêter ». Si Td descend sous 60 s, insérez R d'un ou deux pas."},
  {t:'Inhiber la gamme source à P6',f:s=>s.srInhib,h:"Quand l'alarme « P6 » apparaît : Agir › Protection › « Inhiber GS », tout de suite."},
  {t:'Stabiliser entre 1 et 3 %',f:(s,c)=>c.o.stab!=null,h:"Laissez monter en ×10, puis ajustez R par pas de 1 : le Doppler stabilise la puissance vers 1 à 3 %. Tenez 2 minutes."}],
 demarr:[
  {t:'Approche : R par paliers jusque vers 160 pas, 1/M à chaque palier',f:(s,c)=>s.rods.R.p>=159||s.n>1e-7,h:"Agir › Grappes, groupe R : « +10 » par paliers de 20 à 40 pas (100, 140, 160). Après chaque palier, attendez la stabilisation du comptage et lisez 1/M (vue Réactivité : courbe et cote extrapolée). La prévision est 170 ± 25 pas."},
  {t:'Approche fine jusqu\'à la criticité',f:s=>s.n>1e-8&&s.rate>0&&s.Td<300,h:"« +1 » ou « +2 », puis 30 à 60 s d'attente. Critique quand le comptage monte avec un temps de doublement constant. Visez 60 à 120 s."},
  {t:'Inhiber la gamme source à P6',f:s=>s.srInhib,h:"Alarme « P6 » : Agir › Protection › « Inhiber GS », tout de suite."},
  {t:"Palier d'échauffement entre 1 et 3 %",f:(s,c)=>c.o.p2!=null,h:"Laissez monter en ×10 avec un temps de doublement de 60 à 120 s. Vers 1 %, le Doppler freine : ajustez R d'un pas jusqu'à une puissance quasi stable entre 1 et 3 %, et tenez une minute."},
  {t:'Monter vers 10 % : R jusque vers 200 pas, puis dilution',f:s=>s.n>=0.10,h:"Extrayez R de quelques pas à la fois (Td d'au moins une minute). Plus la puissance monte, plus le défaut de puissance freine : vers 200 pas, R ne suffit plus. Diluez alors par lots de 1 m³ (Agir › Bore, 10 m³/h) en attendant l'effet entre deux lots. La vapeur part au condenseur par le GCT-c."},
  {t:'Bloquer le seuil bas à P10',f:s=>s.lowBlk,h:"Alarme « P10 » : Agir › Protection › « Bloquer seuil bas ». Sinon l'AAR tombe à 25 %."},
  {t:"Coupler l'alternateur",f:s=>s.coupled,h:"Vers 10 à 12 % : Agir › Turbine › « Coupler ». La turbine prend 5 % au couplage ; le reste de la vapeur continue au condenseur."},
  {t:'Aligner la charge vers 13 %',f:s=>s.coupled&&s.LtSet>=0.12,h:"Agir › Turbine : vitesse 3 %/min, « +5 % » deux fois. La charge rejoint la puissance du réacteur et Tmoy se rapproche de Tref."},
  {t:'GCP en automatique, avec 1 m³ de borication',f:s=>s.coupled&&s.modeG==='auto',h:"Agir › Grappes : GCP en « Auto ». Ils rejoignent leur courbe de calibrage et ajoutent environ 200 pcm : lancez aussitôt une borication de 1 m³ (Agir › Bore) pour compenser. Laissez R en manuel pour l'instant."},
  {t:'R en automatique quand Tmoy est sur Tref',f:(s,c)=>c.o.auto!=null,h:"Attendez que Tmoy − Tref soit sous 0,5 °C, puis groupe R en « Auto » : la régulation prend la main sans à-coup."},
  {t:'Monter à 100 % à 3 %/min',f:(s,c)=>c.o.p100!=null,h:"Agir › Turbine : consigne 100 %, vitesse 3 %/min, ×5. Surveillez R : s'il descend sous 180 pas, borez 300 L ; s'il approche 215 pas, diluez 1 m³. Gardez un œil sur le ΔI."}]
};
GAMME.montee=GAMME.demarr.slice(5);
/* indice de l'étape en cours (les étapes cochées le restent) */
function gammeIdx(scn,s,c){ const g=GAMME[scn.id]; if(!g) return -1; c.gOk=c.gOk||[];
  g.forEach((e,i)=>{ if(!c.gOk[i]){ try{ if(e.f(s,c)) c.gOk[i]=true; }catch(er){} } });
  for(let i=g.length-1;i>=0;i--) if(c.gOk[i]){ for(let j=0;j<i;j++) c.gOk[j]=true; break; }
  const i=g.findIndex((e,k)=>!c.gOk[k]); return i<0?g.length:i; }
function gammeBox(scn,s,c){ const g=GAMME[scn.id]; if(!g) return ''; const i=gammeIdx(scn,s,c); c.gI=i;
  const cur=g[i], li=g.map((e,k)=>'<li class="'+(k<i?'done':k===i?'cur':'')+'">'+e.t+'</li>').join('');
  return '<div class="gamme"><details'+(c.gOpen?' open':'')+'><summary><span class="gk">Procédure'+(cur?' '+(i+1)+' / '+g.length:'')+'</span> '+(cur?cur.t:'toutes les étapes sont faites')+'</summary><ol>'+li+'</ol></details>'
   +(cur&&c.gHint?'<div class="hintb"><b>Comment faire :</b> '+cur.h+'</div>':'')
   +(cur?'<button class="btn sm" id="gHint" aria-expanded="'+(c.gHint?'true':'false')+'">'+(c.gHint?'Masquer l\'aide':'Comment faire ?')+'</button>':'')+'</div>'; }

/* R trop haut au-dessus de quelques % (avant couplage) : écart chiffré, comme le ferait un formateur */
const trHaut=s=>!s.tripped&&!s.coupled&&s.n>0.03&&s.rods.R.p-rRetour(s,27)>=4;
const trHautTxt=s=>{ const x=Math.round(rRetour(s,27)/2)*2, fb=Math.round(-((s.rho.dop||0)+(s.rho.mod||0))/5)*5;
  return "R est trop haut : la puissance ("+fmt(s.n*100,0)+" %) ne se stabilise que parce que le Doppler et le modérateur retiennent environ "+fb+" pcm. Pour revenir entre 1 et 3 %, insérez R jusque vers <b>"+x+" pas</b> (soit "+Math.round(s.rods.R.p-x)+" pas : « −10 » puis « −1 »), puis ajustez au pas près en attendant chaque fois."; };
const COACH={
 demarr:[
  [(s,c)=>s.tripped,"AAR : relisez la cause dans le journal et le débriefing."],
  [(s,c)=>s.n>1e-7&&!s.srInhib,"P6 est franchi : inhibez la gamme source maintenant (Agir › Protection › Inhiber GS), sinon l'AAR tombera vers 10⁵ c/s."],
  [(s,c)=>s.p10&&!s.lowBlk,"P10 est franchi : bloquez le seuil bas de haut flux (Agir › Protection › « Bloquer seuil bas »), sinon l'AAR tombera à 25 %."],
  [(s,c)=>!s.coupled&&s.Td<40&&s.n>1e-9,"Temps de doublement court : arrêtez d'extraire, voire insérez 1 ou 2 pas. Visez 60 s ou plus."],
  [(s,c)=>!s.srInhib&&s.n<1e-7&&s.rods.R.p>195,"R dépasse la fourchette prévue (170 ± 25 pas) sans criticité : arrêtez d'extraire et cherchez l'écart, comme on le ferait en salle."],
  [(s,c)=>!s.srInhib&&s.rods.R.p<130,"Divergence : extrayez R par paliers de 20 à 40 pas (« +10 »), attendez que le comptage se stabilise, puis lisez 1/M (ligne de mesures ou vue Réactivité). ×10 pendant les attentes."],
  [(s,c)=>!s.srInhib&&c.k.cps0&&c.k.cps0/(s.n*1e10)<0.25,"1/M sous 0,25 : vous approchez. Pas de 1 ou 2, et attendez à chaque fois la stabilisation."],
  [(s,c)=>!s.srInhib,"Continuez par paliers plus petits (5 à 10 pas) et regardez la cote extrapolée dans la vue Réactivité."],
  [(s,c)=>!s.coupled&&c.o.p2==null&&s.n<0.01,"Laissez monter vers 1 % avec un temps de doublement de 60 à 120 s. Le Doppler va freiner la montée."],
  [(s,c)=>c.o.p2==null&&trHaut(s),trHautTxt],
  [(s,c)=>!s.coupled&&c.o.p2==null&&s.n>0.03,"Au-dessus de 3 % trop tôt : insérez R de 1 ou 2 pas et posez-vous entre 1 et 3 % une minute."],
  [(s,c)=>!s.coupled&&c.o.p2==null,"Palier d'échauffement : ajustez R par pas de 1 jusqu'à une puissance quasi stable entre 1 et 3 %, et tenez une minute."],
  [(s,c)=>!s.coupled&&s.n<0.10&&s.rods.R.p>=200&&!s.rea.run,"R approche du haut : pour continuer à monter, diluez par lots de 1 m³ (Agir › Bore, 10 m³/h). Attendez l'effet entre deux lots."],
  [(s,c)=>!s.coupled&&s.n<0.10,"Montez vers 10–12 % : extrayez R de quelques pas en gardant un temps de doublement d'au moins une minute. La vapeur part au condenseur par le GCT-c."],
 ],
 divdil:[
  [(s,c)=>s.tripped,"AAR : relisez le débriefing. Le plus souvent, la gamme source n'a pas été inhibée, ou la dilution a continué trop longtemps."],
  [(s,c)=>s.n>1e-7&&!s.srInhib,"P6 est franchi : inhibez la gamme source maintenant (Agir › Protection › Inhiber GS), sinon l'AAR tombera vers 10⁵ c/s."],
  [(s,c)=>s.Qdil>0&&s.rate>Math.LN2/300&&!s.srInhib,"Un temps de doublement apparaît alors que la dilution continue : arrêtez l'appoint (Agir › Bore › « Arrêter ») ! L'eau pure déjà injectée continue d'ajouter de la réactivité."],
  [(s,c)=>s.Td<40&&s.n>1e-9,"Temps de doublement court : insérez R de 1 ou 2 pas. Visez 60 s ou plus."],
  [(s,c)=>trHaut(s),trHautTxt],
  [(s,c)=>s.n>0.03,"Au-dessus de 3 % : insérez R de 1 ou 2 pas. Le Doppler fera le reste."],
  [(s,c)=>s.n>=0.01&&s.n<=0.03,"Vous êtes dans la plage. Ajustez R par pas de 1 jusqu'à un temps de doublement « stable », puis attendez 2 minutes."],
  [(s,c)=>s.srInhib&&s.rate<Math.LN2/600&&s.n<0.01,"Puissance quasi stable mais trop basse : extrayez R de 1 ou 2 pas pour reprendre une montée lente."],
  [(s,c)=>s.srInhib&&s.n<0.01,"Gamme source inhibée : laissez la puissance monter vers 1 % avec un temps de doublement de 60 à 120 s. N'ajoutez plus d'eau pure ; ajustez avec R, par pas de 1."],
  [(s,c)=>!s.srInhib&&s.Cb<1095&&!s.rea.run,"Vous approchez du bore critique prévu : lots de 100 à 300 L, et attendez la stabilisation à chaque fois."],
  [(s,c)=>s.rea.run,"Appoint en cours. Quand il s'arrête, attendez que le comptage se stabilise (Td « stable ») avant de relever 1/M."],
  [(s,c)=>true,"Agir › Bore : mode Dilution, 10 ou 20 m³/h, volume 3 m³, puis « Lancer l'appoint ». La vue Réactivité trace 1/M selon le volume injecté."],
 ],
 div:[
  [(s,c)=>s.tripped,"AAR : relisez le débriefing. Le plus souvent, la gamme source n'a pas été inhibée, ou l'extraction a été trop rapide."],
  [(s,c)=>s.n>1e-7&&!s.srInhib,"P6 est franchi : inhibez la gamme source maintenant (Agir › Protection › Inhiber GS), sinon l'AAR tombera vers 10⁵ c/s."],
  [(s,c)=>!s.srInhib&&s.n<1e-7&&s.rods.R.p>195,"R dépasse la fourchette prévue (170 ± 25 pas) sans que le réacteur soit critique : arrêtez d'extraire. En salle de commande, on s'arrêterait ici pour comprendre l'écart (bore, grappes, calcul) avant d'aller plus loin."],
  [(s,c)=>s.Td<40&&s.n>1e-9,"Temps de doublement court : arrêtez d'extraire, voire insérez 1 ou 2 pas. Visez 60 s ou plus."],
  [(s,c)=>trHaut(s),trHautTxt],
  [(s,c)=>s.n>0.03,"Au-dessus de 3 % : insérez R de 1 ou 2 pas. Le Doppler fera le reste."],
  [(s,c)=>s.n>=0.01&&s.n<=0.03,"Vous êtes dans la plage. Ajustez par pas de 1 jusqu'à un temps de doublement « stable », puis attendez 2 minutes."],
  [(s,c)=>s.srInhib&&s.rate<Math.LN2/600&&s.n<0.01,"Puissance quasi stable mais trop basse : extrayez R de 2 ou 3 pas pour reprendre une montée lente."],
  [(s,c)=>!s.srInhib&&c.k.cps0&&c.k.cps0/(s.n*1e10)<0.25,"1/M est sous 0,25 : vous approchez de la criticité. Passez à des pas de 2 à 5 et attendez que le comptage se stabilise à chaque fois."],
  [(s,c)=>s.rods.R.p<130,"Extrayez R par paliers de 20 à 30 pas (« +10 »). Après chaque palier, attendez que le comptage GS se stabilise (temps de doublement « stable ») et regardez 1/M. Passez en ×5."],
 ],
 montee:[
  [(s,c)=>s.tripped,"AAR : relisez la cause dans le journal."],
  [(s,c)=>s.p10&&!s.lowBlk&&!s.tripped,"P10 est franchi : bloquez le seuil bas de haut flux (Agir › Protection › « Bloquer seuil bas »), sinon l'AAR tombera à 25 %."],
  [(s,c)=>!s.coupled,"Couplez l'alternateur : Commandes › Turbine › « Coupler » (il faut au moins 6 % de puissance)."],
  [(s,c)=>s.coupled&&(s.modeR!=='auto'||s.modeG!=='auto')&&s.Lt<0.1,"Montez d'abord la charge vers 10–12 % (« +5 % ») pour égaler la puissance du réacteur, puis passez R et GCP en automatique."],
  [(s,c)=>s.coupled&&(s.modeR!=='auto'||s.modeG!=='auto'),"Passez R et GCP en automatique : en mode G, ce sont eux qui feront suivre le réacteur."],
  [(s,c)=>s.rods.R.p<175&&!s.rea.run,"R descend sous 175 pas : les GCP compensent un peu trop le défaut de puissance. Borez maintenant, 300 L à 10 m³/h, avant d'atteindre la limite de 150 pas."],
  [(s,c)=>s.rods.R.p>214,"R approche de sa butée haute : diluez (10 m³/h, 300 L), sinon Tmoy décrochera."],
  [(s,c)=>Math.abs(s.DI+1.5*s.n)>4,"ΔI s'approche de la limite du domaine : R est trop inséré. Remontez-le en borant."],
  [(s,c)=>Math.abs(s.Tavg-s.Tref)>1.5,"Tmoy s'écarte de Tref : R est-il en butée ? Corrigez au bore."],
  [(s,c)=>s.ramp>3,"Vitesse au-dessus de 3 %/min : l'exercice demande 3 au maximum."],
  [(s,c)=>s.LtSet<0.995,"Vitesse 3 %/min, consigne 100 %. Passez en ×5 et surveillez la position de R."],
  [(s,c)=>true,"Montée en cours : surveillez R (idéalement entre 180 et 210 pas) et ΔI."],
 ],
 suivi:[
  [(s,c)=>s.tripped,"AAR : relisez la cause dans le journal."],
  [(s,c)=>!c.o.low&&s.LtSet>0.505,"Vitesse 5 %/min, consigne 50 %."],
  [(s,c)=>!c.o.low,"Baisse en cours : les GCP s'insèrent, R règle la température."],
  [(s,c)=>(s.Tavg-s.Tref<-1||s.rods.R.p>214)&&!s.rea.run,"Le xénon consomme de la réactivité : R est en haut et Tmoy décroche. Diluez franchement : 500 L à 20 ou 30 m³/h. À 10 m³/h, la dilution compense à peine la montée du xénon."],
  [(s,c)=>(s.Tavg-s.Tref>1||s.rods.R.p<155)&&!s.rea.run,"Trop de réactivité : R s'enfonce ou Tmoy dépasse. Borez par petits volumes (100 L à 5 m³/h)."],
  [(s,c)=>!c.o.hold,"Palier en cours. Passez en ×60 et suivez ρ Xe dans Tendances (fenêtre 8 h) : le xénon monte encore plusieurs heures après la baisse."],
  [(s,c)=>!c.o.up&&s.LtSet<0.995,"Palier terminé : remontez à 100 % à 5 %/min. Le xénon va brûler, préparez-vous à borer."],
  [(s,c)=>true,"Remontée : le xénon brûle et libère de la réactivité. Surveillez R et Tmoy, borez si besoin."],
 ],
 essaidg:[
  [(s,c)=>s.el.dg.A.st!=='pret'&&s.el.dg.B.st!=='pret',"Les deux diesels tournent : arrêtez-en un. On n'essaie qu'une voie à la fois."],
  [(s,c)=>c.o.sA==null&&s.el.dg.A.st==='demarrage',"Démarrage en cours : une dizaine de secondes."],
  [(s,c)=>c.o.sA==null,"Ouvrez la vue Électrique (onglet sous la vue centrale) et appuyez sur « Démarrer diesel A »."],
  [(s,c)=>c.o.rA==null,"Le diesel A tourne : 6,6 kV, 50 Hz. Passez en ×5 et laissez-le tourner 5 minutes (compteur dans la ligne de mesures)."],
  [(s,c)=>c.o.pA==null,"Cinq minutes tenues : arrêtez le diesel A."],
  [(s,c)=>c.o.sB==null,"Diesel A de nouveau prêt. Démarrez maintenant le diesel B."],
  [(s,c)=>c.o.rB==null,"Le diesel B tourne : laissez-le 5 minutes."],
  [(s,c)=>true,"Arrêtez le diesel B pour terminer l'essai."],
 ],
 h3:[
  [(s,c)=>c.k.f==null,"Tout est normal pour l'instant. Ouvrez la vue Électrique pour voir arriver la perte des sources."],
  [(s,c)=>c.o.h3==null,"Les sources disparaissent : regardez les diesels démarrer… ou pas."],
  [(s,c)=>c.acts.dus==null,"Plus aucun tableau secouru : démarrez le DUS (vue Électrique, bouton « Démarrer le DUS »). La turbopompe ASG tient les GV en attendant."],
  [(s,c)=>c.o.voie==null,"Le DUS démarre : environ 2 minutes. Surveillez le niveau GV et les batteries."],
  [(s,c)=>true,"Voie réalimentée : les charges redémarrent par paliers."],
 ],
 arret:[
  [(s,c)=>s.coupled&&s.Lt>0.055&&s.LtSet>0.05,"Baissez la charge à 5 % (vitesse 10 %/min, consigne 5 %)."],
  [(s,c)=>s.coupled&&s.Lt>0.055,"Baisse en cours : les GCP s'insèrent en suivant la charge."],
  [(s,c)=>s.coupled,"Charge à 5 % : découplez la turbine. Les groupes passeront en manuel."],
  [(s,c)=>s.n>0.001,"Insérez les grappes : sélectionnez GCP puis « Tout ins. », ensuite le groupe R. La puissance décroîtra avec une période d'environ −80 s."],
  [(s,c)=>-s.rho.tot<3000&&!s.rea.run,"Borez pour atteindre 3 000 pcm de marge : Borication, 20 m³/h, 1 m³ (≈ 200 pcm par m³ ici)."],
  [(s,c)=>-s.rho.tot<3000,"Borication en cours : surveillez la marge d'arrêt dans la ligne de mesures de la mission, ou ρ dans le bandeau (case Réactivité)."],
  [(s,c)=>Math.abs(s.Tavg-286)>=2,"Attendez que Tmoy se stabilise vers 286 °C : le GCT-c en mode pression s'en charge."],
  [(s,c)=>true,"Tous les critères sont proches : vérifiez la marge et Tmoy."],
 ],
};

/* Garde-fous des leçons guidées : un avertissement qui s'affiche quelle que soit l'étape en cours,
   quand l'état de la tranche appelle un geste immédiat (premier applicable). */
const GARDE={
 'l-div':[
  [s=>!s.tripped&&s.n>1e-7&&!s.srInhib,"<b>P6 est apparu</b> : inhibez la gamme source maintenant (Agir › Protection › « Inhiber GS »), même si l'étape en cours parle d'autre chose. Sinon l'AAR tombera à 10⁵ c/s."],
  [s=>!s.tripped&&s.p10&&!s.lowBlk,"<b>P10 est franchi</b> : la puissance dépasse 10 %, c'est trop pour cette leçon. Insérez R de quelques pas ; si vous voulez monter, bloquez le seuil bas (Agir › Protection), sinon l'AAR tombera à 25 %."],
  [s=>trHaut(s),s=>"<b>Au-dessus de 3 %</b> : "+trHautTxt(s)],
  [s=>!s.tripped&&s.Td<30&&s.n>1e-9&&s.n<0.5,"<b>Temps de doublement court</b> : arrêtez d'extraire, voire insérez 1 ou 2 pas. On vise une à deux minutes."],
 ],
};
const gardeTxt=(scn,s,c)=>{ const g=scn&&GARDE[scn.id]; if(!g) return ''; const x=g.find(e=>{ try{ return e[0](s,c); }catch(er){ return false; } }); return x?(typeof x[1]==='function'?x[1](s,c):x[1]):''; };

/* Rappels affichés dans la présentation des exercices : l'essentiel des seuils, des gestes et des repères,
   avec les chapitres de la visite à revoir (ouverts par-dessus la présentation, la séance reste en pause). */
const RAPPELS={
 div:{l:[
  "<b>Départ</b> : arrêt à chaud, 286 °C et 155 bar. Les groupes d'arrêt sont extraits et doivent le rester : ils sont prêts à tomber. Seul R bouge.",
  "<b>Prévision</b> : criticité attendue vers <b>R = 170 pas ± 25</b>. Si elle arrive nettement hors de cette fourchette, on s'arrête et on cherche pourquoi (bore, grappes, calcul).",
  "<b>Approche</b> : paliers de 20 à 40 pas, puis on attend que le comptage se stabilise avant de lire 1/M. La vue <b>Réactivité</b> trace la courbe 1/M et la cote extrapolée. Près du but, jamais plus de la moitié de la distance restante d'un coup : 1 ou 2 pas.",
  "<b>Temps de doublement</b> : viser 60 à 120 s une fois critique, <b>jamais sous 20 s</b>. Juste après un mouvement de grappes, il est faussé quelques secondes.",
  "<b>P6</b> (GI > 10⁻¹⁰ A, vers 10³ c/s) : inhiber la gamme source <b>aussitôt</b> (Agir › Protection). Sinon AAR à 10⁵ c/s, deux décades plus haut : quelques minutes à Td 60 s, bien moins à ×10.",
  "<b>Arrivée</b> : vers 1 % le Doppler freine seul la montée ; stabiliser entre 1 et 3 % par pas de 1. Le seuil bas (25 %) ne se bloque qu'à P10, pendant la montée en charge."],
  ch:['comptage','doublement','diverg']},
 divdil:{l:[
  "<b>Principe</b> : le groupe R est déjà à sa cote de divergence (200 pas) et n'en bouge pas pendant l'approche ; c'est la <b>baisse du bore</b> qui rapproche la criticité. Bore critique prévu : <b>1 088 ppm ± 15</b>, environ 10 m³ d'eau pure.",
  "<b>Par lots</b> : diluer, <b>arrêter l'appoint</b>, attendre la stabilisation du comptage, relever 1/M selon le volume injecté (vue Réactivité, « selon la dilution »). Lots décroissants : 3 m³, 1 m³, puis 300 et 100 L.",
  "<b>Règle d'or</b> : jamais de dilution en cours quand un temps de doublement apparaît. L'eau pure déjà injectée continue d'agir ; on arrête l'appoint et on corrige avec R si besoin.",
  "<b>Une fois critique</b> : P6 → inhiber la gamme source ; Td entre 60 et 120 s, jamais sous 20 s ; stabiliser entre 1 et 3 % avec quelques pas de R."],
  ch:['comptage','doublement','diverg']},
 demarr:{l:[
  "<b>Prévision</b> : criticité vers <b>R = 170 pas ± 25</b>. Hors fourchette, on s'arrête et on cherche pourquoi.",
  "<b>Divergence</b> : paliers, stabilisation, 1/M (vue Réactivité), puis 1 ou 2 pas près du but. Td entre 60 et 120 s, <b>jamais sous 20 s</b>.",
  "<b>Les deux permissifs</b> : à <b>P6</b> (GI > 10⁻¹⁰ A), inhiber la gamme source ; à <b>P10</b> (10 %), bloquer le seuil bas. Les oublier, c'est l'AAR à 10⁵ c/s, puis à 25 %.",
  "<b>Pour monter au-delà de quelques %</b> : R seul ne suffit pas (défaut de puissance). Quand R approche 200 pas, diluer par lots de 1 m³.",
  "<b>Couplage</b> : au moins 6 % ; monter la charge vers 13 % pour égaler la puissance du réacteur ; GCP puis R en automatique quand Tmoy est sur Tref.",
  "<b>Montée</b> : 3 %/min au plus, Tmoy à ± 2 °C de Tref, R entre 150 et 220 pas (borer s'il descend, diluer s'il monte), ΔI dans le domaine."],
  ch:['diverg','doublement','couplage','montee']},
 montee:{l:[
  "<b>Couplage</b> : turbine découplée, au moins 6 % de puissance. Après le couplage, monter la charge vers 13–14 % pour égaler la puissance du réacteur avant de passer en automatique.",
  "<b>Seuil bas de haut flux</b> : bloqué au-dessus de P10 (10 %). S'il se réarme (puissance repassée sous 9 %), le rebloquer avant de remonter, sinon AAR à 25 %.",
  "<b>Vitesse</b> : 3 %/min au plus. <b>Tmoy</b> suit Tref (286 °C à vide, ≈ 304,5 °C à 100 %), à ± 2 °C.",
  "<b>Groupe R</b> : jamais sous 150 pas (limite basse), idéalement 180–210. R descend → borer ; R monte vers sa butée → diluer. La vue Réactivité donne le <b>bore pour R à 190 pas</b>.",
  "<b>ΔI</b> : dans le domaine (± 5 % autour de la référence). Un R trop inséré le pousse vers le bas du cœur."],
  ch:['couplage','montee','rband','dianim']},
 suivi:{l:[
  "<b>Programme</b> : baisse à 50 % à 5 %/min, palier de 2 h, retour à 100 %. Tmoy à ± 1,5 °C de Tref, R entre 150 et 220 pas, ΔI dans le domaine.",
  "<b>Xénon après une baisse</b> : il monte pendant plusieurs heures et consomme jusqu'à ~5 pcm/min au début du palier. Il faut <b>diluer tôt et franchement</b> (20 à 30 m³/h) ; à 10 m³/h, R finit en butée haute.",
  "<b>Xénon à la remontée</b> : il est brûlé plus vite qu'il ne se forme, la réactivité remonte : il faut <b>borer</b>.",
  "<b>Repère</b> : la vue Réactivité donne le bore pour ramener R à 190 pas et le volume à injecter ; ×60 pendant le palier."],
  ch:['xeanim','xenon','suivi','rband']},
 arret:{l:[
  "<b>Ordre</b> : baisse de charge, découplage sous 6 %, passage des groupes en manuel, insertion des GCP puis de R jusqu'à la sous-criticité, puis borication.",
  "<b>Groupes d'arrêt</b> : ils restent extraits, prêts à tomber. La sous-criticité se fait avec les groupes de commande et le bore.",
  "<b>Marge d'arrêt</b> = −ρ total, à porter à <b>3 000 pcm</b>. Repère : à −9 pcm par ppm, c'est environ 330 ppm au-dessus du bore critique affiché dans la vue Réactivité.",
  "<b>Pourquoi borer large</b> : le xénon va disparaître dans les jours suivants et rendre de la réactivité ; un refroidissement en rendrait aussi.",
  "<b>Tmoy</b> : stabilisée vers 286 °C par le GCT-c en mode pression."],
  ch:['etats','leviers','pcm']},
 essaidg:{l:[
  "<b>Une voie à la fois</b> : on n'essaie jamais les deux diesels en même temps, l'autre voie doit rester intacte.",
  "<b>Déroulé</b> : démarrage (environ 10 s), contrôle tension et fréquence, 5 minutes de marche, arrêt, remise en attente.",
  "<b>Fin</b> : les deux diesels « prêts ». Commandes dans la vue <b>Électrique</b>."],
  ch:['elsecu','eldg']},
 h3:{l:[
  "<b>Chaîne des secours</b> : TS, puis TA (225 kV), puis les deux diesels ; ici tout manque. Restent le <b>DUS</b>, le turboalternateur <b>LLS</b>, la <b>turbopompe ASG</b> (vapeur des GV) et les <b>batteries</b>.",
  "<b>Priorité</b> : garder les GV alimentés par la turbopompe ASG pour évacuer la puissance résiduelle ; sans pompes primaires, la circulation naturelle fait le reste.",
  "<b>Batteries</b> : de l'ordre de l'heure ; surveillez leur charge dans la vue Électrique.",
  "<b>DUS</b> : environ 2 minutes pour reprendre un tableau secouru ; les charges redémarrent ensuite par paliers."],
  ch:['elsecu','elcn','elbat']}
};
const rappelsBox=scn=>{ const r=RAPPELS[scn.id]; if(!r) return ''; const idx=k=>typeof TOUR!=='undefined'?TOUR.findIndex(c=>c.id===k):-1;
  const lk=r.ch.map(k=>{ const i=idx(k); return i<0?'':'<button type="button" class="btn sm" data-tourgo="'+i+'">'+TOUR[i].t+'</button>'; }).join('');
  return '<details class="eclair rappels" open><summary><span class="ecl">Rappels avant de commencer</span></summary><ul>'+r.l.map(x=>'<li>'+x+'</li>').join('')+'</ul>'+(lk?'<div class="rev"><span>Revoir dans la visite :</span>'+lk+'</div>':'')+'</details>'; };
/* fin de démarrage : mêmes conseils que l'exercice « Couplage et montée en charge », à partir du couplage */
COACH.demarr.push(...COACH.montee.slice(2));
