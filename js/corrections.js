/* Corrections commentées : le pilote automatique joue un aléa ou un exercice, montre et explique chaque action (voix possible). */
'use strict';

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
/* îlotage : le xénon s'accumule après la chute de puissance, R remonte ; on dilue par petits volumes pour le garder dans sa bande */
const xeIlot=s=>{ if(s.rea.run) return null; const d=s.Tavg-s.Tref;
  if(s.rods.R.p>215||(d<-0.8&&s.rods.R.p>200)) return {t:'Dilution de 1 m³ à 30 m³/h',why:"La puissance a chuté mais l'iode continue de se transformer en xénon, qui freine le réacteur : R remonte vers sa butée haute. Une dilution franche lui redonne de la marge, sinon Tmoy décrocherait sous Tref.",a:DA.bore('dil','30','1')};
  if(s.rods.R.p<170&&d>0.8) return {t:'Borication de 100 L',why:"R est descendu un peu bas : on reprend un peu de bore.",a:DA.bore('bor','10','0.1')}; return null; };
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
  {w:fd(60),t:'Laisser la régulation recaler la température',why:"La puissance nucléaire est passée sous la charge : la régulation le voit et ressort R aussitôt, avant que Tmoy ne plonge. On ne bore pas, on surveille.",a:[DA.look('[data-bank="R"]'),DA.look('#rd-tm'),DA.speed(5)]},
  {ctl:{every:60,until:s=>s.grid,f:xeIlot},t:'Compenser le xénon'},
  {t:'Recoupler au réseau',why:"Le réseau est revenu. On recouple ; la charge reste d'abord à son niveau et Tmoy reste sur Tref.",a:[DA.btn('recouple'),DA.speed(2)]},
  {ctl:{every:60,until:()=>false,f:xeIlot},t:'Compenser le xénon après le recouplage'}]},
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
 mdte:{speed:2,intro:"Les deux réseaux vont disparaître et l'îlotage va échouer. Regardez la chaîne des secours se mettre en place, puis ce que l'opérateur vérifie.",steps:[
  {w:fd(3),t:"Lire la cause de l'arrêt",why:"Le journal indique un déclenchement turbine au-dessus de P7 : l'îlotage a échoué, le réacteur s'est arrêté. Les pompes primaires et les TPA se sont arrêtées faute de tension.",a:[DA.look('[data-c="log"]'),DA.ack()]},
  {w:fd(14),t:'Vérifier les diesels',why:"Dans la vue Électrique, les deux diesels ont démarré et repris LHA et LHB en une dizaine de secondes. Les charges redémarrent par paliers : IS, ASG, charge RCV, chaufferettes.",a:[DA.look('#elw')]},
  {w:fd(40),t:"Vérifier l'évacuation de la chaleur",why:"Les motopompes ASG alimentent les GV. Le condenseur est perdu avec les tableaux normaux : la vapeur part à l'atmosphère par le GCT-a.",a:[DA.look('#l-asg'),DA.look('#rd-lg'),DA.speed(5)]},
  {w:fd(400),t:'Constater la circulation naturelle',why:"Sans pompe, l'eau chauffée dans le cœur monte vers les GV, s'y refroidit et redescend : l'écart entre branches chaude et froide est grand, mais stable. On ne touche à rien.",a:[DA.look('#rd-tm')]},
  {w:(s,c)=>s.el.r225,t:'Le 225 kV revient',why:"Les tableaux repassent sur le TA, le condenseur redevient disponible et le GCT-c reprend la vapeur.",a:[DA.look('#elw')]}]},
 dgko:{speed:2,intro:"Même perte des alimentations externes, mais un diesel va refuser de démarrer. Regardez comment on le repère et comment on rétablit la voie perdue.",steps:[
  {w:fd(3),t:"Lire la cause de l'arrêt",why:"Déclenchement turbine au-dessus de P7 : l'îlotage a échoué. Plus de réseau : les diesels démarrent.",a:[DA.look('[data-c="log"]'),DA.ack()]},
  {w:(s,c)=>s.el.dg.A.st==='defaut',t:'Repérer le diesel en défaut',why:"Dans la vue Électrique, le diesel A est « déclenché » et LHA reste hors tension. Le diesel B tient LHB : une voie suffit, mais il n'y a plus de redondance.",a:[DA.look('#elw'),DA.ack()]},
  {t:"Démarrer le diesel d'ultime secours",why:"Le DUS peut reprendre l'une ou l'autre voie. Il lui faut environ deux minutes.",a:[DA.btn('dus')]},
  {w:s=>s.el.src.LHA==='dus',t:'LHA réalimenté',why:"Le DUS a repris LHA ; ses charges redémarrent par paliers. Les deux voies sont de nouveau disponibles.",a:[DA.look('#elw'),DA.speed(5)]}]},
 lhb:{speed:5,intro:"Le tableau secouru LHB va tomber en panne à pleine puissance. Rien ne bouge dans le bandeau : regardez pourquoi on replie quand même.",steps:[
  {w:fd(3),t:"Lire l'alarme",why:"Alarme rouge « Tableau secouru hors tension ». La production n'en dépend pas : le bandeau ne bouge pas.",a:[DA.look('#alb'),DA.ack()]},
  {t:'Confirmer dans la vue Électrique',why:"LHB est hors tension avec toutes ses charges : motopompe ASG B, IS voie B, charge RCV voie B. Le TS est pourtant là : le défaut est sur le tableau lui-même, le diesel B ne peut rien.",a:[DA.look('#elw')]},
  {t:'Engager le repli',why:"Les règles d'exploitation interdisent de rester en production sans redondance au-delà d'un délai fixé. On baisse calmement, à 3 %/min, vers 50 %.",a:[DA.seg('ramp','3'),DA.range('#ltSet',50)]},
  {w:s=>s.Lt<=0.505,t:'Charge à 50 %',why:"Les groupes ont suivi la baisse en automatique. Le repli continuerait vers l'arrêt si le tableau n'est pas réparé à temps.",a:[DA.look('#rd-tm')]}]},
 essaidg:{speed:5,intro:"Essai périodique des deux diesels, l'un après l'autre. Regardez ce qu'on vérifie, et pourquoi jamais les deux à la fois.",steps:[
  {t:'Démarrer le diesel A',why:"On le lance comme s'il y avait un manque de tension. Il doit être en service en une dizaine de secondes.",a:[DA.btn('dg','A')]},
  {w:s=>s.el.dg.A.st==='service',t:'Contrôler tension et fréquence',why:"6,6 kV et 50 Hz : le diesel tient. Il tourne sans reprendre LHA, que le TS alimente toujours. On le laisse tourner cinq minutes.",a:[DA.look('#elw')]},
  {w:(s,c)=>(c.k.runA||0)>=302,t:'Arrêter le diesel A',why:"Essai concluant : il revient « prêt » pour le prochain manque de tension.",a:[DA.btn('dg','A')]},
  {t:'Démarrer le diesel B',why:"Le diesel A est de nouveau prêt : on peut essayer la voie B.",a:[DA.btn('dg','B')]},
  {w:(s,c)=>(c.k.runB||0)>=302,t:'Arrêter le diesel B',why:"Les deux diesels sont essayés et en attente.",a:[DA.btn('dg','B')]}]},
 h3:{speed:2,intro:"Perte des deux réseaux, puis des deux diesels : la situation H3. Regardez ce qui tient encore sans courant, et comment on rétablit une voie.",steps:[
  {w:(s,c)=>c.k.f!=null&&s.el.dg.A.st==='defaut'&&s.el.dg.B.st==='defaut',t:'Constater la perte des deux voies',why:"AAR, puis les deux diesels déclenchent : LHA et LHB restent hors tension. Plus d'IS, plus de charge RCV, plus de motopompe ASG.",a:[DA.look('#elw'),DA.ack()]},
  {w:s=>s.Wasg>0.005,t:'Vérifier la turbopompe ASG',why:"Entraînée par la vapeur des GV, elle n'a besoin d'aucun courant : c'est elle qui alimente les GV et évacue la puissance résiduelle.",a:[DA.look('#l-asg')]},
  {t:'Démarrer le DUS',why:"Le diesel d'ultime secours reprendra le premier tableau secouru hors tension, ici LHA.",a:[DA.btn('dus')]},
  {w:s=>s.el.src.LHA==='dus',t:'LHA réalimenté',why:"Le DUS a repris LHA. Les charges redémarrent par paliers : IS après 5 s, charge RCV après 30 s. Les batteries se rechargent.",a:[DA.look('#elw')]}]},
 div:{speed:5,intro:"Démarrage depuis l'arrêt à chaud. Regardez l'approche par paliers, la prédiction avec 1/M, puis la stabilisation.",steps:[
  {t:'Lire la situation',why:"Réacteur sous-critique, R inséré, comptage gamme source stable. La position critique estimée est de 170 pas ± 25.",a:[DA.look('#mis-info'),DA.bank('R')]},
  {t:'Premier palier : R à 100 pas',why:"Loin de la criticité, on avance par grands paliers.",a:[DA.btn('rod','10',10)]},
  {w:stableFor(20),t:'Lire 1/M',why:"Le comptage s'est stabilisé : 1/M vaut environ 0,57. On est encore loin.",a:[DA.look('#mis-info')]},
  {t:'Deuxième palier : R à 140 pas',why:"On continue, mais plus prudemment.",a:[DA.btn('rod','10',4)]},
  {w:stableFor(20),t:'Prédire la cote critique',why:"1/M vaut environ 0,2. Entre 100 et 140 pas, il a perdu 0,37 : il reste une vingtaine de pas. Estimation : vers 160 pas.",a:[DA.look('#mis-info')]},
  {t:'Troisième palier : R à 160 pas',why:"On s'arrête avant la cote prédite.",a:[DA.btn('rod','10',2)]},
  {w:stableFor(20,0.0012),t:'Approche finale',why:"Près de la criticité, la stabilisation devient lente. On avance maintenant de 2 pas à la fois, en attendant chaque fois.",a:[DA.look('#rd-td')]},
  {ctl:{every:45,until:s=>s.Td<300&&s.n>2e-8,f:s=>s.Td>300?{t:'+2 pas',why:"Le comptage finit par se stabiliser : on avance encore de 2 pas.",a:[DA.btn('rod','1',2)]}:null},t:'Approche par pas de 2'},
  {t:'La criticité est franchie',why:"Un temps de doublement constant apparaît : le réacteur est légèrement surcritique, la réaction s'entretient seule et la puissance monte doucement. On n'extrait plus.",a:[DA.look('#rd-td')]},
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
/* TMI : instruments de 1979, un opérateur qui connaît le piège */
DM.tmi={speed:2,intro:"L'accident de Three Mile Island rejoué sur notre tranche, avec les instruments de 1979. Le pilote applique les bons réflexes. Les faits s'inscrivent dans la chaîne des événements ; la voix explique le raisonnement.",steps:[
  {w:fd(3),t:"Lire la première alarme",why:"Les deux pompes alimentaires sont perdues. Dans le bandeau, le niveau des GV plonge : c'en est la conséquence directe.",a:[DA.look('#rd-lg'),DA.ack()]},
  {w:s=>s.asg,t:"Ouvrir les vannes ASG",why:"Les pompes ASG tournent, mais leur débit reste nul. Une pompe en marche sans débit, c'est un circuit fermé quelque part : ici, des vannes oubliées après un essai.",a:[DA.btn('asgV')]},
  {w:s=>s.porvStuck&&s.tripped&&s.Ppzr<145,t:"Repérer la contradiction",why:"Après l'arrêt, la pression devrait se stabiliser. Elle continue de baisser pendant que le niveau du pressuriseur monte : c'est la signature d'une fuite de vapeur en haut du pressuriseur.",a:[DA.look('#rd-pp'),DA.look('#rd-lp')]},
  {w:s=>s.Tdech>90,t:"Croire les mesures plutôt que le voyant",why:"Le voyant dit « fermée ». Mais la ligne de décharge est chaude et le réservoir de décharge se remplit : la soupape est ouverte.",a:[DA.look('#c-tdech'),DA.look('#c-rdp')]},
  {t:"Fermer la vanne d'isolement",why:"Montée en série avec la soupape, elle coupe la fuite. À TMI, ce geste a attendu 2 heures 22.",a:[DA.btn('porvIsol')]},
  {t:"Ne pas toucher à l'injection de sécurité",why:"Un pressuriseur haut ne prouve pas que le circuit est plein quand il y a de la vapeur dans la cuve. Réduire l'IS a été l'erreur de TMI, dès 4 minutes 30.",a:[DA.look('.seg[data-key="isThr"]')]},
  {t:"Laisser tourner les pompes primaires",why:"Elles tournent et le cœur est refroidi : on ne les arrête pas. À TMI, leur arrêt tardif a laissé la vapeur se séparer de l'eau et découvrir le cœur.",a:[DA.look('#l-p1')]},
  {w:s=>s.porvIsol&&s.satMargin>10,t:"Situation stabilisée",why:"La pression remonte, l'eau est revenue loin de l'ébullition et le cœur n'a jamais été découvert. Il reste à refroidir la tranche normalement.",a:[DA.look('#rd-pp')]}]};
/* maillons de la chaîne que la correction lit à voix haute : les autres sont déjà dits par les étapes */
const CHAIN_SAY=new Set(['chaud','aar','is','sat','iscut','rdp','vib','pmp','unc','fus']);
const DEMO_IDS=Object.keys(DM);
/* voix des corrections commentées (synthèse vocale du navigateur, en français) */
const canSpeak=()=>typeof speechSynthesis!=='undefined'&&typeof SpeechSynthesisUtterance!=='undefined';
function say(t){ if(!A.voice||!canSpeak()||!t) return; try{ const u=new SpeechSynthesisUtterance(String(t).replace(/<[^>]+>/g,'').replace(/[«»]/g,'')); u.lang='fr-FR'; u.rate=1.05;
  const v=speechSynthesis.getVoices().find(x=>/^fr/i.test(x.lang)); if(v) u.voice=v; speechSynthesis.speak(u); }catch(e){} }
function hush(){ if(canSpeak()) try{ speechSynthesis.cancel(); }catch(e){} }
const speaking=()=>canSpeak()&&A.voice&&(speechSynthesis.speaking||speechSynthesis.pending);
/* un nouveau maillon de la chaîne TMI : la correction le lit à voix haute */
function onChain(it){ if(A.demo){ A.demo.v++; if(CHAIN_SAY.has(it.id)) say(it.e+' '+it.q); } }
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function demoStart(id,fast){
  launch(id); $('#brief').hidden=true;
  const sc=A.scn, c=A.ctx;
  A.demo={id,i:0,busy:false,k:{},done:[],cur:null,fast:!!fast,lastCtl:-1e9,v:1,rv:0};
  if(sc.kind==='alea'||sc.kind==='histo') c.fireAt=A.s.t+15;
  document.body.classList.add('demo'); A.demoHold=false;
  setSpeed(DM[id].speed||sc.speed||1); A.paused=!!fast; syncAll(); renderMission(true);
  const vp=store('voice'); A.voice=!fast&&canSpeak()&&(vp!=null?!!vp:id==='tmi'); hush(); say(DM[id].intro);
  logEv(A.s,'auto','Correction commentée — pilotage automatique');
}
function demoStop(){ hush(); A.demo=null; A.demoHold=false; document.body.classList.remove('demo'); $('#dptr').hidden=true; $$('.dhl').forEach(e=>e.classList.remove('dhl')); }
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
  A.demoHold=true; renderMission(true); say(t+'. '+why);
  (async()=>{ await wait(700); for(const a of acts){ if(A.demo!==d) return; await demoAct(a); } await wait(500); while(A.demo===d&&speaking()) await wait(250); fin(); })();
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
  const hc=scn.kind==='histo';
  let b=hc&&d.done.length?'':'<p class="dintro">'+D.intro+'</p>';
  if(hc&&d.cur) b+=ecBox('<b>'+d.cur.t+'.</b> '+d.cur.why,'En cours')+chainHtml(c);
  if(d.done.length) b+='<ul class="dsteps">'+d.done.slice(-4).map(t=>'<li class="done">'+t+'</li>').join('')+'</ul>';
  if(d.cur){ if(!hc) b+=ecBox('<b>'+d.cur.t+'.</b> '+d.cur.why,'En cours'); }
  else if(st) b+='<div class="dwait">'+(st.ctl?'<b>'+st.t+'</b> : le pilote surveille et corrige au besoin.':(scn.kind==='alea'||scn.kind==='histo')&&c.fired==null?'Fonctionnement normal : '+(scn.kind==='histo'?'l\'accident':'l\'aléa')+' va survenir.':'Prochaine action : <b>'+st.t+'</b>')+'</div>';
  else b+='<div class="dwait">Toutes les actions sont faites : on laisse la tranche se stabiliser jusqu\'au débriefing.</div>';
  if(inf!=null) b+='<div class="info" id="mis-info">'+inf+'</div>';
  if(hc&&!d.cur) b+=chainHtml(c);
  $('#mis-body').innerHTML=b; glossDom($('#mis-body'));
  $('#mis-foot').innerHTML=(canSpeak()?'<button class="btn sm'+(A.voice?' on':'')+'" id="dVoice" aria-pressed="'+!!A.voice+'">'+(A.voice?'Voix : oui':'Voix : non')+'</button>':'')+'<button class="btn sm" id="dRetry"><span class="lg2">Essayer moi-même</span><span class="sh2">Essayer</span></button><button class="btn sm" id="dQuit">Quitter</button>';
  $('#dRetry').onclick=()=>{ const id=d.id; demoStop(); launch(id); };
  $('#dQuit').onclick=()=>{ demoStop(); openMenu(); };
  const dv=$('#dVoice'); if(dv) dv.onclick=()=>{ A.voice=!A.voice; store('voice',A.voice); if(!A.voice) hush(); else if(d.cur) say(d.cur.t+'. '+d.cur.why); d.v++; renderMission(true); };
}
