/* Repères d'attention, visite guidée de la centrale, domaine P-T. */
'use strict';
/* ================= Repères d'attention ================= */
function applyFocus(){
  document.body.classList.remove('bandfocus');
  const els=$$('.focus');
  els.forEach(e=>{
    const fc=e.matches('.card.folded')?e:e.closest('.card.folded'); if(fc) fc.classList.remove('folded');
    if(e.closest('#band')&&!e.matches('.mb')&&innerWidth<=760) document.body.classList.add('bandfocus');
  });
  requestAnimationFrame(()=>els.forEach(e=>{ const r=e.getBoundingClientRect(); if(r.width*r.height<45000) e.classList.add('focus-sm'); }));
  A.ptrT=els;
}
function tgtName(el){
  const k=el.closest('.rd'); if(k&&k.querySelector('.k')) return k.querySelector('.k').textContent;
  const cd=el.closest('.card'); if(cd){ const h=cd.querySelector('h2'); if(h) return h.textContent.replace(/[?]/g,'').trim(); }
  if(el.closest('header.top')) return 'en haut';
  return '';
}
function updPtr(){
  const p=$('#ptr'); const c=A.ctx, scn=A.scn;
  const ok=scn&&scn.steps&&c&&!c.stepOk&&$('#brief').hidden&&$('#menu').hidden&&$('#help').hidden&&$('#debrief').hidden&&$('#tour').hidden&&!A.paused;
  const L=ok?(A.ptrT||[]).filter(e=>e.isConnected&&!e.closest('header.top')&&!e.matches('.card[data-c="synop"]')):[];
  if(!L.length){ p.hidden=true; return; }
  const vis=e=>e.getClientRects().length>0;
  let el=L.find(inView), mode='on', cl=null;
  if(!el){ el=L.find(vis); if(el){ const r=el.getBoundingClientRect(); cl=clipOf(el); mode=r.top>=cl.bot-4?'down':'up'; } else { el=L[0]; mode='tab'; } }
  p.hidden=false; p.className='ptr '+mode; p._el=el;
  if(mode==='on'){ const r=el.getBoundingClientRect(), hb=clipOf(el).top; const above=r.top-hb>46; p.style.left=clamp(r.left+r.width/2,24,innerWidth-24)+'px'; p.style.top=(above?r.top-40:r.bottom+6)+'px'; p.classList.add(above?'pa':'pb'); T('ptrl',''); $('#ptra').textContent=above?'▼':'▲'; }
  else if(mode==='tab'){
    const pl=desk()&&placeOf(el), tb=pl&&(pl.vue?$('#vtabs [data-vue="'+pl.vue+'"]'):$('#ftabs [data-fam="'+pl.fam+'"]'));
    if(tb&&vis(tb)){ const r=tb.getBoundingClientRect(), up=!!pl.vue; p.className='ptr '+(up?'tab':'up'); p.style.left=clamp(r.left+r.width/2,60,innerWidth-60)+'px'; p.style.top=(up?r.top-58:r.bottom+6)+'px'; $('#ptra').textContent=up?'▼':'▲'; T('ptrl',(pl.vue?'Vue ':'Famille ')+(pl.vue?VUE_NM[pl.vue]:FAMS[pl.fam].t)); }
    else { const t=tabOf(el); const tb2=$('#tabs'), vb=innerHeight-(tb2&&getComputedStyle(tb2).display!=='none'?tb2.getBoundingClientRect().height:0); p.style.left='50%'; p.style.top=(vb-52)+'px'; $('#ptra').textContent='▼'; T('ptrl','Onglet '+(TAB_NM[t]||'')); }
  }
  else { const r=el.getBoundingClientRect(); p.style.left=clamp(r.left+r.width/2,90,innerWidth-90)+'px'; p.style.top=(mode==='down'?cl.bot-52:cl.top+8)+'px'; $('#ptra').textContent=mode==='down'?'▼':'▲'; T('ptrl',tgtName(el)); }
}

/* ================= Visite guidée de la centrale ================= */
const PLANT=`<svg class="plant" id="plant" viewBox="16 40 984 480" role="img" aria-label="Schéma d'une centrale nucléaire à eau pressurisée">
<path class="pl-ground" d="M0 470 H1000"/>
<g id="pl-bat"><path class="bld" d="M30 470 V205 A190 115 0 0 1 410 205 V470 Z"/><text class="pl-t" x="220" y="122" text-anchor="middle">Bâtiment réacteur</text></g>
<g id="pl-salle"><rect class="bld2" x="440" y="118" width="400" height="352" rx="4"/><text class="pl-t" x="770" y="292" text-anchor="middle">Salle des machines</text></g>
<g id="pl-prim"><path class="ln hot fl" d="M160 300 H272 V372 H290"/><path class="ln cold fl" d="M354 372 H362 V440 H254"/><path class="ln cold fl" d="M226 440 H176 V398 H160"/><path class="ln hot" d="M205 280 V300" style="stroke-width:3"/></g>
<g id="pl-vap"><path class="ln steam fl" d="M322 180 V138 H495 V166"/><path class="ln steam fl" d="M530 172 Q585 112 652 150"/><path class="ln steam fl" d="M577 227 V300 M652 227 V300"/></g>
<g id="pl-are"><path class="ln feed fl" d="M600 362 V420 H534"/><path class="ln feed fl" d="M510 420 H385 V330 H354"/><circle class="pmp" cx="522" cy="420" r="12"/><text class="pl-s" x="522" y="448" text-anchor="middle">Pompe alimentaire</text></g>
<g id="pl-froid"><path class="river" d="M440 492 Q470 484 500 492 T560 492 T620 492 T680 492 T740 492 T800 492 T860 492 T920 492 T980 492 V520 H440 Z"/><path class="ln cool fl" d="M660 500 V362"/><path class="ln warm fl" d="M690 330 H880"/><path class="ln cool fl" d="M925 470 V496"/><text class="pl-s" x="470" y="512">Fleuve</text>
 <g id="pl-tour"><path class="tower" d="M880 470 Q906 390 886 302 H964 Q944 390 970 470 Z"/><circle class="plume p1" cx="925" cy="290" r="18"/><circle class="plume p2" cx="935" cy="270" r="22"/><circle class="plume p3" cx="920" cy="248" r="26"/><text class="pl-s" x="925" y="460" text-anchor="middle">Réfrigérant</text></g></g>
<g id="pl-cuve"><rect x="100" y="205" width="50" height="22" rx="3" class="crdm"/><rect class="vessel" x="90" y="225" width="70" height="195" rx="32"/><rect class="core" x="103" y="312" width="44" height="86" rx="4"/>
 <g class="rodsg"><path class="rod" d="M113 222 V336 M125 222 V336 M137 222 V336"/></g><text class="pl-t" x="125" y="446" text-anchor="middle">Cuve</text><text class="pl-s cl" x="125" y="360" text-anchor="middle">Cœur</text></g>
<g id="pl-pzr"><rect class="shell" x="188" y="185" width="34" height="95" rx="16"/><rect class="pzw" x="191" y="232" width="28" height="45" rx="6"/><text class="pl-s" x="205" y="176" text-anchor="middle">Pressuriseur</text></g>
<g id="pl-gv"><rect class="shell" x="290" y="180" width="64" height="220" rx="28"/><rect class="sgw" x="294" y="260" width="56" height="136" rx="10"/><path class="ln utube" d="M310 396 V262 Q322 236 334 262 V396"/><text class="pl-s" x="322" y="214" text-anchor="middle">GV</text></g>
<g id="pl-pump"><circle class="pmp" cx="240" cy="440" r="14"/><rect class="mot" x="232" y="412" width="16" height="14" rx="2"/><text class="pl-s" x="240" y="466" text-anchor="middle">Pompe primaire</text></g>
<g id="pl-turb"><path class="shaft" d="M470 186 H720"/><polygon class="turb" points="480,172 530,160 530,212 480,200"/><polygon class="turb" points="545,160 610,145 610,227 545,212"/><polygon class="turb" points="620,160 685,145 685,227 620,212"/><text class="pl-s" x="505" y="232" text-anchor="middle">HP</text><text class="pl-s" x="615" y="244" text-anchor="middle">Turbine BP</text></g>
<g id="pl-alt"><rect class="alt" x="720" y="160" width="80" height="52" rx="8"/><text class="pl-t" x="760" y="191" text-anchor="middle">~</text><text class="pl-s" x="760" y="228" text-anchor="middle">Alternateur</text></g>
<g id="pl-reseau"><path class="ln elec" d="M800 186 H850"/><rect class="alt" x="850" y="168" width="32" height="38" rx="3"/><path class="ln elec" d="M882 186 H966"/><path class="pyl" d="M962 205 L976 62 L990 205 M966 102 H986 M958 114 H994 M968 162 H984 M976 62 V205"/><text class="pl-s" x="866" y="222" text-anchor="middle">Transfo</text><text class="pl-s" x="958" y="52" text-anchor="middle">Réseau 400 kV</text></g>
<g id="pl-cond"><rect class="cond" x="550" y="300" width="150" height="62" rx="8"/><path class="ctube" d="M562 318 H688 M562 331 H688 M562 344 H688"/><text class="pl-s" x="598" y="382" text-anchor="middle">Condenseur</text></g>
</svg>`;

const TOUR=[
 {k:'Vue d\'ensemble',t:'Une centrale, c\'est d\'abord une bouilloire',hl:null,h:`<p>Une centrale nucléaire produit de l'électricité comme une centrale au charbon : on fait bouillir de l'eau, la vapeur fait tourner une turbine, la turbine entraîne un alternateur. Seule la source de chaleur change : ici, la fission de l'uranium.</p><p>La chaîne d'énergie se lit de gauche à droite sur le schéma :</p><div class="chainx"><span>Fission</span><span>Chaleur</span><span>Vapeur</span><span>Rotation</span><span>Électricité</span></div><p>Un REP 900, réacteur à eau pressurisée de 900 mégawatts électriques, produit 2 785 MW de chaleur pour environ 905 MW d'électricité. Les deux tiers de la chaleur repartent vers le fleuve ou l'atmosphère : c'est la limite imposée par la thermodynamique à toute machine à vapeur.</p>`},
 {k:'Physique',t:'La fission',inset:'fission',h:`<p>Le combustible est de l'uranium. Quand un <b>neutron</b> lent frappe un noyau d'uranium 235, le noyau se déforme et se casse en deux morceaux, les <b>produits de fission</b>.</p><p>Ces morceaux partent à grande vitesse : en freinant dans la matière, ils la chauffent. C'est cette énergie que l'on récupère : environ 200 MeV par fission, des dizaines de millions de fois plus que la combustion d'une molécule de gaz.</p><p>La fission libère aussi <b>2 à 3 nouveaux neutrons</b>. C'est tout l'intérêt : ils peuvent provoquer d'autres fissions.</p><p>Ordre de grandeur : 1 gramme d'uranium 235 entièrement fissionné libère autant de chaleur qu'environ 2 tonnes de pétrole.</p>`},
 {k:'Physique',t:'La réaction en chaîne',inset:'chain',h:`<p>Chaque génération de neutrons provoque une nouvelle génération de fissions. Tout dépend du nombre moyen de neutrons d'une génération qui en produisent un à la suivante : le <b>facteur de multiplication k</b>.</p><ul><li><b>k &lt; 1</b> : la population diminue, le réacteur est <b>sous-critique</b>.</li><li><b>k = 1</b> : elle reste constante, le réacteur est <b>critique</b>. C'est l'état normal en fonctionnement, à n'importe quelle puissance.</li><li><b>k &gt; 1</b> : elle augmente, le réacteur est <b>surcritique</b>.</li></ul><p>En pratique, k reste extrêmement proche de 1. On mesure l'écart avec la <b>réactivité</b>, en <b>pcm</b> (pour cent mille) : k = 1,001 correspond à +100 pcm.</p>`},
 {k:'Physique',t:'Les neutrons retardés',inset:'delayed',h:`<p>Une génération de neutrons ne dure que quelques dizaines de microsecondes. Si tous les neutrons naissaient immédiatement, +100 pcm multiplieraient la puissance par 10 en une fraction de seconde : impossible à piloter.</p><p>Heureusement, environ <b>0,6 %</b> des neutrons sont émis avec un retard de quelques secondes à une minute, par certains produits de fission. Cette petite fraction, notée <b>β</b> (600 pcm ici), impose son rythme à toute la population.</p><p>Résultat : avec +100 pcm, la puissance double en un peu moins d'une minute. Le <b>temps de doublement</b> est l'indicateur que l'on surveille pendant un démarrage. La règle d'or est de rester très loin de β : au-delà, le réacteur deviendrait <b>prompt-critique</b>, c'est-à-dire que les neutrons immédiats suffiraient à eux seuls à emballer la réaction, sans attendre les retardataires.</p>`},
 {k:'Le cœur',t:'Le combustible',inset:'fuel',h:`<p>L'uranium est transformé en oxyde (UO₂) et pressé en <b>pastilles</b> de la taille d'un bout de doigt, enrichies à environ 3,5 % en uranium 235 : l'uranium naturel n'en contient que 0,7 %, le reste est de l'uranium 238, qui fissionne très peu.</p><p>Les pastilles sont empilées dans des tubes en alliage de zirconium, les <b>crayons</b>. La gaine du crayon est la <b>première barrière</b> qui retient les produits radioactifs.</p><p>264 crayons forment un <b>assemblage</b> de 4 m de haut ; 157 assemblages forment le <b>cœur</b>, soit environ 72 tonnes d'uranium. Un assemblage reste 3 à 4 ans dans le cœur ; on en remplace un tiers ou un quart à chaque arrêt pour rechargement.</p>`},
 {k:'Physique',t:'Le modérateur : l\'eau',inset:'moder',h:`<p>Les neutrons sortent de la fission très rapides, à environ 20 000 km/s. À cette vitesse, ils ont peu de chances de provoquer une nouvelle fission dans l'uranium 235.</p><p>Il faut les ralentir : c'est le rôle du <b>modérateur</b>. Dans un REP, c'est l'eau elle-même. À chaque choc contre un noyau d'hydrogène, le neutron perd une bonne partie de sa vitesse. Après une vingtaine de chocs, il ne va plus qu'à environ 2 km/s : il est « thermique », et la fission devient très probable.</p><p>Conséquence essentielle : si l'eau chauffe, elle se dilate, ralentit moins bien les neutrons, et la réactivité baisse. C'est le <b>coefficient modérateur</b>, négatif dans un REP. L'eau sert donc à la fois de modérateur et de fluide de refroidissement.</p>`},
 {k:'Pilotage',t:'Agir sur la réaction : grappes et bore',hl:['pl-cuve'],rods:true,h:`<p>Piloter un réacteur, c'est régler le nombre de neutrons disponibles pour la fission. Pour cela, on ajoute ou on retire des matériaux qui les <b>absorbent</b>, comme une éponge. Le REP en utilise deux, aux rôles complémentaires.</p><p><b>Les grappes</b> sont des faisceaux d'une vingtaine de crayons absorbants qui coulissent dans le cœur par le haut, entre les crayons de combustible. Un mécanisme les déplace pas à pas (un pas ≈ 1,6 cm). Elles agissent vite, en quelques secondes, mais localement : enfoncées, elles freinent surtout la partie haute du cœur et déforment la répartition de la puissance. Relâchées, elles tombent par leur poids en moins de 2 secondes : c'est l'<b>arrêt automatique du réacteur</b> (AAR). Elles sont rangées en trois familles, présentées au chapitre suivant : groupes d'arrêt, GCP et groupe R.</p><p><b>Le bore</b>, sous forme d'acide borique dissous dans l'eau du circuit primaire, absorbe lui aussi les neutrons. Il agit partout à la fois, sans déformer la puissance, mais lentement. Pour en changer la concentration (en <b>ppm</b>, parties par million), le circuit RCV mélange à l'eau du circuit de l'eau pure (<b>dilution</b> : moins de bore, plus de réactivité) ou de l'eau très borée (<b>borication</b> : l'inverse), dans 270 m³ d'eau. On l'utilise pour les évolutions lentes : usure du combustible au fil des mois, xénon au fil des heures, et pour garder le groupe R à une bonne position.</p>`},
 {k:'Physique',t:'Le réacteur se stabilise tout seul',inset:'feedback',h:`<p>Un REP est conçu pour être naturellement stable. Si la puissance augmente, deux effets la freinent aussitôt :</p><ul><li>l'<b>effet Doppler</b> : le combustible chauffe et l'uranium 238 capture davantage de neutrons. L'effet est immédiat ;</li><li>l'<b>effet modérateur</b> : l'eau chauffe, ralentit moins bien les neutrons. L'effet suit en quelques secondes.</li></ul><p>Ces <b>contre-réactions</b> ramènent la réactivité vers zéro : la puissance se stabilise un peu plus haut, sans aucune action. Inversement, si la turbine prend plus de vapeur, le primaire se refroidit et la puissance du réacteur monte d'elle-même.</p><p>Le prix à payer : monter en puissance « consomme » de la réactivité (le <b>défaut de puissance</b>, ~ 1 400 pcm ici), qu'il faut compenser avec des grappes dédiées, les GCP, présentées dans le thème Pilotage.</p>`},
 {k:'Circuits',t:'Le circuit primaire',hl:['pl-cuve','pl-prim','pl-pump','pl-gv','pl-pzr'],h:`<p>L'eau du <b>circuit primaire</b> traverse le cœur de bas en haut, s'y échauffe d'environ 37 °C (de 286 à 323 °C à pleine puissance), puis cède sa chaleur dans les générateurs de vapeur avant de revenir vers la cuve.</p><p>Elle est maintenue à <b>155 bar</b>, environ 150 fois la pression atmosphérique. À cette pression, l'eau ne bout qu'à 345 °C : elle reste donc liquide dans tout le circuit. C'est le sens de « réacteur à eau <b>pressurisée</b> ».</p><p>Trois <b>pompes primaires</b> d'environ 6 MW chacune font circuler environ 18 m³ d'eau par seconde, l'équivalent d'une piscine olympique toutes les 2 à 3 minutes. Le circuit forme la <b>deuxième barrière</b> : il est fermé et l'eau qu'il contient est radioactive.</p>`},
 {k:'Circuits',t:'Le pressuriseur',hl:['pl-pzr'],h:`<p>Le <b>pressuriseur</b> est un grand réservoir relié à la branche chaude, à moitié rempli d'eau et à moitié de vapeur. Comme dans une cocotte-minute, la pression est fixée par la température de cette eau à <b>saturation</b>, c'est-à-dire à l'équilibre entre l'eau et sa vapeur.</p><ul><li>Pour monter la pression, des <b>chaufferettes</b> électriques vaporisent un peu d'eau.</li><li>Pour la baisser, l'<b>aspersion</b> pulvérise de l'eau plus froide dans la vapeur, qui se condense.</li></ul><p>C'est aussi le vase d'expansion du circuit : quand le primaire chauffe, l'eau se dilate et monte dans le pressuriseur. Son niveau est donc un excellent témoin de la température et des éventuelles fuites.</p>`},
 {k:'Circuits',t:'La chaussette : le domaine pression-température',inset:'chaussette',h:`<p>Le circuit primaire ne peut pas être à n'importe quelle pression pour une température donnée. Le diagramme pression-température, surnommé « la <b>chaussette</b> » à cause de sa forme, délimite la zone autorisée.</p><ul><li>À droite, la <b>saturation</b> : l'eau ne doit pas bouillir. On garde une marge de sous-saturation, ici d'au moins 10 °C.</li><li>En haut à gauche, la <b>rupture brutale</b> : à froid, l'acier de la cuve est plus fragile ; on y limite donc la pression.</li><li>En bas, la pression minimale des <b>pompes primaires</b> (~ 25 bar), indispensable à leurs joints.</li></ul><p>L'animation montre un démarrage : depuis l'arrêt à froid, on chauffe d'abord à basse pression, puis on monte la pression à mesure que la température le permet, jusqu'à l'arrêt à chaud (286 °C, 155 bar), puis la puissance. Tout le chemin doit rester dans la chaussette. Les limites à froid sont indicatives.</p>`},
 {k:'Circuits',t:'Les générateurs de vapeur',hl:['pl-gv','pl-are'],h:`<p>Dans chaque <b>générateur de vapeur</b>, l'eau primaire circule dans environ 3 300 tubes en U. L'eau du circuit <b>secondaire</b> les entoure et se met à bouillir.</p><p>Les deux circuits ne se mélangent jamais : la vapeur envoyée à la turbine n'est pas radioactive. Les tubes, très fins, font partie de la deuxième barrière : leur étanchéité est surveillée en permanence.</p><p>La vapeur sort à environ 57 bar à pleine puissance. L'<b>eau alimentaire</b> (ARE) remplace en continu l'eau évaporée : le niveau dans le GV doit rester stable, ni trop bas (le GV ne refroidirait plus le primaire), ni trop haut (de l'eau partirait vers la turbine).</p>`},
 {k:'Production',t:'Turbine et alternateur',hl:['pl-vap','pl-turb','pl-alt','pl-reseau'],h:`<p>La vapeur se détend dans la <b>turbine</b> : d'abord dans le corps haute pression (HP), puis dans les corps basse pression (BP). Elle fait tourner l'arbre à 1 500 tours par minute.</p><p>L'<b>alternateur</b>, sur le même arbre, transforme la rotation en électricité à 50 Hz. Un transformateur élève la tension à 400 000 V pour le réseau.</p><p>Si la turbine ne peut pas prendre la vapeur (démarrage, arrêt, perte du réseau), des vannes de <b>contournement</b> l'envoient directement au condenseur (GCT-c, le « groupe de contournement turbine » vers le condenseur) ou à l'atmosphère (GCT-a). La vapeur ne passe alors pas par la turbine : la chaleur est évacuée, mais aucune électricité n'est produite.</p>`},
 {k:'Production',t:'Le condenseur et la source froide',hl:['pl-cond','pl-froid','pl-are'],h:`<p>En sortie de turbine, la vapeur est envoyée dans le <b>condenseur</b>, où elle redevient liquide au contact de milliers de tubes parcourus par l'eau froide d'un fleuve ou de la mer. L'eau condensée repart vers les GV grâce aux pompes alimentaires : le circuit secondaire est une boucle fermée.</p><p>Le condenseur est indispensable : c'est en refroidissant la vapeur qu'on crée l'écart de pression qui la fait traverser la turbine. Il rejette environ 1 900 MW de chaleur, les deux tiers de la puissance du cœur.</p><p>Sur certains sites, un <b>réfrigérant</b> (la grande tour) évacue une partie de cette chaleur dans l'air. Le panache blanc est de la vapeur d'eau du circuit de refroidissement, sans lien avec le réacteur.</p>`},
 {k:'Pilotage',t:'Le pilotage en mode G',inset:'tref',h:`<p>En France, on pilote les réacteurs en <b>mode G</b> : c'est la turbine qui commande. L'exploitant fixe la puissance demandée par le réseau ; le réacteur suit.</p><p>À chaque charge correspond une consigne, <b>Tref</b>, pour la température moyenne de l'eau du primaire, <b>Tmoy</b> (la moyenne entre l'entrée et la sortie du cœur) : 286 °C à vide, 304,5 °C à pleine puissance. Le graphique montre ce programme.</p><ul><li>Les <b>GCP</b> se placent automatiquement selon la charge, pour compenser le défaut de puissance.</li><li>Le <b>groupe R</b> ajuste finement pour que <b>Tmoy</b> suive Tref.</li><li>Le <b>bore</b> compense les évolutions lentes, sur décision de l'opérateur.</li></ul><p>Un REP français peut ainsi varier de 100 % à 30 % et revenir plusieurs fois par jour pour suivre la consommation.</p>`},
 {k:'Physique',t:'Le xénon',inset:'xenon',h:`<p>Parmi les produits de fission, le <b>xénon 135</b> absorbe énormément de neutrons. Il est surtout produit par la décroissance de l'<b>iode 135</b> (demi-vie 6,6 h : la moitié de l'iode disparaît en 6,6 h), et détruit par le flux de neutrons lui-même.</p><p>À pleine puissance, l'équilibre coûte environ −2 700 pcm. Quand on baisse la puissance, le flux détruit moins de xénon alors que l'iode accumulé continue d'en produire : le xénon <b>augmente</b> pendant plusieurs heures. Après un arrêt, il culmine vers 8 à 11 h, au point de pouvoir empêcher un redémarrage.</p><p>Le graphique montre ces deux cas, calculés avec le même modèle que le simulateur. Le xénon impose le rythme du suivi de charge : chaque baisse se paie par une dilution, chaque remontée par une borication.</p>`},
 {k:'Sûreté',t:'Trois barrières et des protections',inset:'barriers',h:`<p>La sûreté repose d'abord sur trois <b>barrières</b> successives entre les produits radioactifs et l'environnement :</p><ol><li>la <b>gaine</b> du combustible ;</li><li>le <b>circuit primaire</b> : cuve en acier de 20 cm, tuyauteries, tubes des GV ;</li><li>l'<b>enceinte de confinement</b> : le bâtiment réacteur, en béton d'environ 1 m d'épaisseur.</li></ol><p>Pour les protéger, un système automatique surveille en permanence puissance, températures, pressions et niveaux. Au moindre dépassement de seuil, il déclenche l'<b>arrêt automatique du réacteur</b> (AAR) et, si le circuit perd de l'eau ou de la pression, l'<b>injection de sécurité</b> d'eau borée.</p><p>Les seuils sont fixés pour qu'aucun incident n'approche les limites physiques, notamment la <b>crise d'ébullition</b> : un film de vapeur se formerait sur la gaine et l'isolerait de l'eau, qui ne la refroidirait plus.</p>`},
 {k:'Sûreté',t:'Après l\'arrêt : la puissance résiduelle',inset:'decay',h:`<p>Quand les grappes tombent, la réaction en chaîne s'arrête en quelques minutes. Mais les produits de fission, très radioactifs, continuent de dégager de la chaleur : c'est la <b>puissance résiduelle</b>.</p><p>Elle vaut environ 6 % de la puissance juste après l'arrêt, soit plus de 160 MW ; encore 1 % au bout d'une heure (près de 30 MW) et quelques dixièmes de pour-cent après plusieurs jours.</p><p>Il faut donc <b>toujours</b> pouvoir évacuer cette chaleur, même réacteur arrêté : par les générateurs de vapeur et l'<b>alimentation de secours</b> (ASG) dans un premier temps, puis par des circuits de refroidissement dédiés. C'est une préoccupation centrale de la sûreté.</p>`},
 {k:'Conduite',t:'La salle de commande',hl:null,last:true,h:`<p>Vous connaissez maintenant les grands principes. Dans le simulateur, vous retrouverez chacun d'eux :</p><ul><li>le <b>bandeau</b> du haut regroupe les grandeurs du cœur, du primaire, du secondaire et de la sûreté, avec leurs limites ;</li><li>au centre, le bloc du haut rassemble les <b>alarmes</b>, vos <b>actions</b> en cours et les <b>automatismes</b> en service ; dessous, une vue au choix : synoptique, courbes, ΔI, chaussette, bilan de réactivité, instrumentation, tendances, alarmes, journal (zones <b>Surveiller</b> et <b>Suivre</b> sur téléphone) ;</li><li>à droite, la consigne puis les <b>commandes</b>, rangées par famille comme le bandeau : grappes et bore, pressuriseur et RCV, turbine et eau alimentaire, protections (zone <b>Agir</b> sur téléphone).</li></ul><p>Chaque carte a son <b>?</b> pour approfondir, et tous les termes soulignés renvoient au lexique. Les sources publiques utilisées sont listées dans le menu, rubrique « Sources ». Prochaine étape : le <b>tutoriel de prise de quart</b>, puis les leçons guidées.</p>`},
];

/* --- graphiques SVG --- */
function svgChart(o){
  const W=o.w||520,H=o.h||300,L=66,R=16,Tp=18,B=40;
  const xl=o.xlog, X=v=>L+((xl?Math.log10(v):v)-(xl?Math.log10(o.x0):o.x0))/((xl?Math.log10(o.x1):o.x1)-(xl?Math.log10(o.x0):o.x0))*(W-L-R), Y=v=>Tp+(1-(v-o.y0)/(o.y1-o.y0))*(H-Tp-B);
  let s='<svg class="chartx" viewBox="0 0 '+W+' '+H+'">';
  for(const b of o.bands||[]) s+='<rect x="'+X(b[0])+'" y="'+Tp+'" width="'+(X(b[1])-X(b[0]))+'" height="'+(H-Tp-B)+'" style="fill:var(--'+b[2]+');opacity:.14"/>';
  for(const t of o.yt){ s+='<line class="gr" x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(t[0])+'" y2="'+Y(t[0])+'"/><text class="ax" x="'+(L-6)+'" y="'+(Y(t[0])+4)+'" text-anchor="end">'+t[1]+'</text>'; }
  for(const t of o.xt){ s+='<line class="gr" y1="'+Tp+'" y2="'+(H-B)+'" x1="'+X(t[0])+'" x2="'+X(t[0])+'"/><text class="ax" y="'+(H-B+16)+'" x="'+X(t[0])+'" text-anchor="middle">'+t[1]+'</text>'; }
  s+='<text class="ax lb" x="'+((L+W-R)/2)+'" y="'+(H-6)+'" text-anchor="middle">'+o.xlab+'</text><text class="ax lb" x="14" y="'+((Tp+H-B)/2)+'" text-anchor="middle" transform="rotate(-90 14 '+((Tp+H-B)/2)+')">'+o.ylab+'</text>';
  for(const sr of o.series){ const d=sr.pts.map((p,i)=>(i?'L':'M')+X(p[0]).toFixed(1)+' '+Y(clamp(p[1],o.y0,o.y1)).toFixed(1)).join(''); s+='<path class="sr" d="'+d+'" style="stroke:var(--'+sr.c+')'+(sr.dash?';stroke-dasharray:6 4':'')+'"/>'; if(sr.lab){ const p=sr.lp||sr.pts[sr.pts.length-1]; s+='<text class="sl" x="'+(X(p[0])+(sr.dx||0))+'" y="'+(Y(p[1])+(sr.dy||-6))+'" style="fill:var(--'+sr.c+')" text-anchor="'+(sr.ta||'end')+'">'+sr.lab+'</text>'; } }
  for(const a of o.notes||[]) s+='<text class="nt" x="'+X(a[0])+'" y="'+Y(a[1])+'" text-anchor="'+(a[3]||'start')+'">'+a[2]+'</text>';
  return s+'</svg>';
}
const INSET={
 delayed(){ const rho=100,b=600,T=(b-rho)/(0.08*rho), pts=[]; for(let t=0;t<=120;t+=1) pts.push([t,t<5?1:(b/(b-rho))*Math.exp((t-5)/T)]);
  return svgChart({x0:0,x1:120,y0:0,y1:8,xt:[[0,'0'],[30,'30'],[60,'60'],[90,'90'],[120,'120 s']],yt:[[1,'×1'],[2,'×2'],[4,'×4'],[8,'×8']],xlab:'temps après +100 pcm (s)',ylab:'puissance relative',
   series:[{pts:[[0,1],[5,1],[5.05,8]],c:'crit',dash:1,lab:'sans neutrons retardés',lp:[5.05,7.4],ta:'start',dx:6},{pts,c:'accent',lab:'réalité : ×2 en ~45 s',lp:[118,pts[118][1]],dy:16}],
   notes:[[8,7.9,'×10 en moins d\'une seconde']]}); },
 tref(){ const P=[],Tm=[],Tc=[],Tf=[],Tv=[]; for(let L=0;L<=100;L+=5){ const l=L/100; Tm.push([L,286+18.5*l]); Tc.push([L,286+37*l]); Tf.push([L,286]); Tv.push([L,286-13*l]); }
  return svgChart({x0:0,x1:100,y0:265,y1:330,xt:[[0,'0'],[25,'25'],[50,'50'],[75,'75'],[100,'100 %']],yt:[[270,'270'],[290,'290'],[310,'310'],[330,'330 °C']],xlab:'charge turbine (%)',ylab:'température (°C)',
   series:[{pts:Tc,c:'hot',lab:'branche chaude'},{pts:Tm,c:'accent',lab:'Tmoy = Tref',dy:-8},{pts:Tf,c:'cold',lab:'branche froide',dy:14},{pts:Tv,c:'steam',lab:'vapeur GV',dy:14}]}); },
 xenon(){ const lI=2.87e-5,lX=2.09e-5,sg=7.5e-5,gI=0.0639,gX=0.00237, run=n=>{ let I=1,X=1; const o=[[-4,-2700],[0,-2700]]; for(let t=0;t<=48*3600;t+=60){ I+=lI*(n-I)*60; X+=((lX+sg)*(gX*n+gI*I)/(gI+gX)-(lX+sg*n)*X)*60; if(t%1800===0) o.push([t/3600,-2700*X]); } return o; };
  const a=run(0.5),z=run(0), mn=Math.min(...z.map(p=>p[1])), pk=z.find(p=>p[1]===mn);
  return svgChart({x0:-4,x1:48,y0:Math.floor(mn/1000)*1000-500,y1:0,xt:[[0,'0'],[12,'12 h'],[24,'24 h'],[36,'36 h'],[48,'48 h']],yt:[[0,'0'],[-1000,'−1 000'],[-2000,'−2 000'],[-3000,'−3 000'],[-4000,'−4 000'],[-5000,'−5 000'],[-6000,'−6 000']].filter(t=>t[0]>=Math.floor(mn/1000)*1000-500),xlab:'heures après le changement de puissance',ylab:'réactivité du xénon (pcm)',
   series:[{pts:a,c:'feed',lab:'baisse à 50 %',lp:[47,a[a.length-1][1]],dy:-8},{pts:z,c:'crit',lab:'arrêt du réacteur',lp:[pk[0]+3,pk[1]],ta:'start',dy:4}],notes:[[pk[0],pk[1]-420,'pic ≈ '+Math.round(pk[0])+' h','middle'],[-3,-2400,'équilibre à 100 %']]}); },
 decay(){ const pts=[]; for(let e=0;e<=6.42;e+=0.08){ const t=Math.pow(10,e); pts.push([t,100*0.0622*(Math.pow(t,-0.2)-Math.pow(t+3.15e7,-0.2))]); }
  return svgChart({x0:1,x1:2.6e6,xlog:1,y0:0,y1:7,xt:[[1,'1 s'],[60,'1 min'],[3600,'1 h'],[86400,'1 jour'],[2.6e6,'1 mois']],yt:[[0,'0'],[2,'2 %'],[4,'4 %'],[6,'6 %']],xlab:'temps après l\'arrêt (échelle logarithmique)',ylab:'puissance résiduelle (% PN)',
   series:[{pts,c:'hot'}],notes:[[3600,1.6,'≈ 1 % au bout d\'une heure (≈ 28 MW)','middle'],[86400,0.95,'≈ 0,4 % après un jour','middle'],[2,6.6,'≈ 6 % juste après l\'arrêt']]}); },
 fuel(){ let g=''; for(let i=0;i<9;i++) for(let j=0;j<9;j++) g+='<circle cx="'+(318+i*9)+'" cy="'+(108+j*9)+'" r="3.2" class="fz"/>';
  let c=''; const rings=[[0,0]]; for(let i=-4;i<=4;i++) for(let j=-4;j<=4;j++) if(i*i+j*j<=18) c+='<rect x="'+(477+i*11)+'" y="'+(144+j*11)+'" width="10" height="10" class="fa"/>';
  return '<svg class="chartx fuel" viewBox="0 0 560 300"><g><rect class="pel" x="40" y="128" width="34" height="40" rx="5"/><ellipse class="pelt" cx="57" cy="128" rx="17" ry="5"/><text class="nt" x="57" y="200" text-anchor="middle">Pastille</text><text class="ax" x="57" y="218" text-anchor="middle">UO₂ · 8 mm</text><text class="ax" x="57" y="234" text-anchor="middle">~3,5 % d\'U 235</text></g>'+
   '<path class="arw" d="M90 148 H120"/><g><rect class="clad" x="160" y="30" width="16" height="236" rx="7"/>'+[...Array(14)].map((_,i)=>'<rect class="pel" x="163" y="'+(38+i*16)+'" width="10" height="14" rx="2"/>').join('')+'<text class="nt" x="168" y="284" text-anchor="middle">Crayon</text><text class="ax" x="186" y="140">gaine en</text><text class="ax" x="186" y="156">zirconium</text><text class="ax" x="186" y="176">4 m</text></g>'+
   '<path class="arw" d="M282 148 H304"/><g><rect class="asm" x="312" y="102" width="84" height="84" rx="3"/>'+g+'<text class="nt" x="354" y="210" text-anchor="middle">Assemblage</text><text class="ax" x="354" y="228" text-anchor="middle">264 crayons</text></g>'+
   '<path class="arw" d="M402 148 H414"/><g><circle class="vsl" cx="482" cy="149" r="64"/>'+c+'<text class="nt" x="482" y="236" text-anchor="middle">Cœur</text><text class="ax" x="482" y="254" text-anchor="middle">157 assemblages</text><text class="ax" x="482" y="270" text-anchor="middle">≈ 72 t d\'uranium</text></g></svg>'; },
 barriers(){ return '<svg class="chartx" viewBox="0 0 560 300"><rect class="b3" x="24" y="20" width="300" height="262" rx="80"/><rect class="b2" x="70" y="70" width="208" height="170" rx="40"/><rect class="b1" x="138" y="126" width="72" height="60" rx="14"/><circle class="b0" cx="174" cy="156" r="16"/>'+
  '<path class="arw" d="M210 140 H360"/><path class="arw" d="M278 104 H360"/><path class="arw" d="M318 50 H360"/>'+
  '<text class="nt" x="368" y="54">3. Enceinte de confinement</text><text class="ax" x="368" y="70">béton, ≈ 1 m d\'épaisseur</text>'+
  '<text class="nt" x="368" y="108">2. Circuit primaire</text><text class="ax" x="368" y="124">cuve 20 cm d\'acier, 155 bar</text>'+
  '<text class="nt" x="368" y="144">1. Gaine du combustible</text><text class="ax" x="368" y="160">alliage de zirconium</text>'+
  '<text class="ax" x="174" y="210" text-anchor="middle">combustible et</text><text class="ax" x="174" y="224" text-anchor="middle">produits de fission</text></svg>'; },
 feedback(){ const N=[['Puissance ↑',280,40],['Combustible et eau chauffent',470,150],['Doppler et modérateur : réactivité ↓',280,260],['Puissance ↓, retour à l\'équilibre',90,150]];
  return '<svg class="chartx fb" viewBox="0 0 560 300"><path class="arw c" d="M350 62 Q440 80 455 120"/><path class="arw c" d="M455 182 Q440 230 360 250"/><path class="arw c" d="M200 250 Q120 230 105 182"/><path class="arw c" d="M105 120 Q120 80 210 62"/>'+
   N.map((n,i)=>'<g class="fbn" style="animation-delay:'+(i*1.1)+'s"><rect x="'+(n[1]-88)+'" y="'+(n[2]-24)+'" width="176" height="48" rx="10"/><text x="'+n[1]+'" y="'+(n[2]+5)+'" text-anchor="middle">'+n[0]+'</text></g>').join('')+'</svg>'; },
};
/* --- animations canvas --- */
let tourRAF=0;
function tourCanvas(kind){
  const cv=document.createElement('canvas'); cv.className='tcv'; const box=$('#tinset'); box.appendChild(cv);
  const t0=performance.now();
  const loop=now=>{ const w=cv.clientWidth,h=cv.clientHeight; if(!w){ tourRAF=requestAnimationFrame(loop); return; } const dpr=devicePixelRatio||1; if(cv.width!==Math.round(w*dpr)){ cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr); }
    const g=cv.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,w,h); ANIM[kind](g,w,h,Math.max(0,(now-t0)/1000)); tourRAF=requestAnimationFrame(loop); };
  tourRAF=requestAnimationFrame(loop);
}
const rnd=(i)=>{ const x=Math.sin(i*127.1+311.7)*43758.5453; return x-Math.floor(x); };
const ANIM={
 chaussette(g,w,h,t){
  const path=[[50,27,'Arrêt à froid'],[110,27,'Chauffage par les pompes primaires, basse pression'],[170,29,'Chauffage par les pompes primaires, basse pression'],[185,45,'Mise en pression à mesure que la température monte'],[215,75,'Mise en pression à mesure que la température monte'],[250,110,'Mise en pression à mesure que la température monte'],[286,155,'Arrêt à chaud : 286 °C, 155 bar'],[286,155,'Arrêt à chaud : 286 °C, 155 bar'],[323,155,'En puissance : la branche chaude monte à 323 °C'],[323,155,'En puissance : la branche chaude monte à 323 °C']];
  const T=(t%12)/12*(path.length-1), i=Math.min(path.length-2,Math.floor(T)), f=T-i, a=path[i], b=path[i+1], x=a[0]+(b[0]-a[0])*f, y=a[1]+(b[1]-a[1])*f;
  const tr=[]; for(let k=0;k<=i;k++) tr.push([path[k][0],path[k][1]]); tr.push([x,y]);
  drawPTon(g,w,h,{zoom:false,labels:true,trace:tr,pt:[x,y],ptc:COL.accent,ptl:(f<0.5?a:b)[2]});
 },
 fission(g,w,h,t){
  const T=t%5, cx=w*0.42, cy=h*0.48, R=Math.min(w,h)*0.13, F=getComputedStyle(document.body).getPropertyValue('--f-disp');
  const txt=(s,x,y,c,sz,al)=>{ g.fillStyle=c; g.font='600 '+(sz||13)+'px '+F; g.textAlign=al||'center'; g.fillText(s,x,y); };
  const dot=(x,y,r,c)=>{ g.fillStyle=c; g.beginPath(); g.arc(x,y,r,0,7); g.fill(); };
  if(T<1.3){ const k=T/1.3; dot(w*0.04+(cx-R-w*0.04)*k,cy,5,COL.accent); txt('neutron lent',w*0.04+(cx-R-w*0.04)*k,cy-14,COL.accent,12); }
  if(T<1.7){ const wob=T>1.3?Math.sin((T-1.3)*40)*0.12*((T-1.3)/0.4):0; g.save(); g.translate(cx,cy); g.scale(1+wob+(T>1.3?(T-1.3)*0.5:0),1-wob*0.6);
    for(let i=0;i<40;i++){ const a=rnd(i)*6.283, r=Math.sqrt(rnd(i+50))*R*0.85; dot(Math.cos(a)*r,Math.sin(a)*r,R*0.17,i%2?COL.hot:COL.warn); } g.restore(); txt('uranium 235',cx,cy+R+22,COL.mute,12); }
  else { const k=Math.min(1,(T-1.7)/1.6), d=k*w*0.28, fade=T>4.4?1-(T-4.4)/0.6:1; g.globalAlpha=Math.max(0,fade);
    const fr=(sx,sy,lab)=>{ const x=cx+sx*d, y=cy+sy*d*0.55; for(let i=0;i<18;i++){ const a=rnd(i+(sx>0?9:3))*6.283, r=Math.sqrt(rnd(i+70))*R*0.6; dot(x+Math.cos(a)*r,y+Math.sin(a)*r,R*0.15,i%2?COL.hot:COL.warn); } txt(lab,x,y+R*0.8+16,COL.fg,12); };
    fr(-1,-1,'produit de fission'); fr(1,1,'produit de fission');
    [[1.0,-0.9],[1.2,-0.1],[-0.6,1.1]].forEach(v=>{ const dd=Math.min(1,(T-1.7)/1.1)*w*0.42; dot(cx+v[0]*dd,cy+v[1]*dd*0.6,5,COL.accent); });
    if(T<2.3){ g.strokeStyle=COL.warn; g.lineWidth=3; g.globalAlpha=Math.max(0,1-(T-1.7)/0.6); g.beginPath(); g.arc(cx,cy,R*(1+(T-1.7)*4),0,7); g.stroke(); g.globalAlpha=Math.max(0,fade); }
    if(T>2.0) txt('≈ 200 MeV de chaleur',cx,cy-R-24,COL.warn,14);
    if(T>2.4) txt('2 à 3 nouveaux neutrons',w*0.82,cy-h*0.36,COL.accent,12);
    g.globalAlpha=1; }
 },
 chain(g,w,h,t){
  const C=[[0.6,'k = 0,6 · sous-critique : la réaction s\'éteint','cold'],[1,'k = 1 · critique : population constante','ok'],[1.4,'k = 1,4 · surcritique : la population croît','hot']];
  const ci=Math.floor(t/7.5)%3, tt=t%7.5, k=C[ci][0], F=getComputedStyle(document.body).getPropertyValue('--f-disp');
  const G=7, gx=i=>w*0.07+i*(w*0.86)/(G-1), n=[5]; for(let i=1;i<G;i++) n.push(k===1?5:Math.max(0,Math.min(26,Math.round(n[i-1]*k+(k<1?-0.2:0.3)))));
  const pos=(i,j)=>[gx(i),h*0.56+(j-(n[i]-1)/2)*Math.min(18,(h*0.68)/Math.max(n[i],1))];
  const shown=Math.min(G,Math.floor(tt/0.85)+1);
  g.lineWidth=1;
  for(let i=1;i<shown;i++) for(let j=0;j<n[i];j++){ const p=Math.floor(j*n[i-1]/Math.max(n[i],1)); const a=pos(i-1,Math.min(p,n[i-1]-1)), b=pos(i,j); g.strokeStyle=COL.line; g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); }
  for(let i=0;i<shown;i++) for(let j=0;j<n[i];j++){ const p=pos(i,j); g.fillStyle=COL[C[ci][2]]; g.beginPath(); g.arc(p[0],p[1],4.2,0,7); g.fill(); }
  g.fillStyle=COL.fg; g.font='600 15px '+F; g.textAlign='center'; g.fillText(C[ci][1],w/2,26);
  g.fillStyle=COL.mute; g.font='500 11px '+F; for(let i=0;i<shown;i++) g.fillText(String(n[i]),gx(i),h-12);
  g.textAlign='left'; g.fillText('neutrons par génération →',w*0.04,h-28);
 },
 moder(g,w,h,t){
  const F=getComputedStyle(document.body).getPropertyValue('--f-disp');
  for(let i=0;i<46;i++){ const x=rnd(i)*w, y=40+rnd(i+99)*(h-80); g.fillStyle=COL.cold; g.globalAlpha=.55; g.beginPath(); g.arc(x,y,7,0,7); g.fill(); g.fillStyle=COL.fg; g.globalAlpha=.7; g.beginPath(); g.arc(x+7,y-4,3.2,0,7); g.fill(); g.beginPath(); g.arc(x-7,y-4,3.2,0,7); g.fill(); }
  g.globalAlpha=1;
  const P=[[0.03,0.5]]; let x=0.03,y=0.5,L=0.2; for(let i=0;i<18;i++){ const a=(rnd(i+7)-0.5)*2.4; x+=L*Math.abs(Math.cos(a))*0.9; y+=L*Math.sin(a)*0.5; x=Math.min(0.97,Math.max(0.03,x)); y=Math.min(0.85,Math.max(0.2,y)); P.push([x,y]); L*=0.82; }
  const T=t%9, seg=Math.min(P.length-1,T/0.4); g.lineWidth=2;
  for(let i=0;i<Math.floor(seg);i++){ const c=i/(P.length-1); g.strokeStyle=c<0.5?COL.hot:COL.accent; g.globalAlpha=.8; g.beginPath(); g.moveTo(P[i][0]*w,P[i][1]*h); g.lineTo(P[i+1][0]*w,P[i+1][1]*h); g.stroke(); }
  const i0=Math.floor(seg), fr=seg-i0, a=P[i0], b=P[Math.min(i0+1,P.length-1)], nx=(a[0]+(b[0]-a[0])*fr)*w, ny=(a[1]+(b[1]-a[1])*fr)*h;
  g.globalAlpha=1; g.fillStyle=seg/(P.length-1)<0.5?COL.hot:COL.accent; g.beginPath(); g.arc(nx,ny,6,0,7); g.fill();
  const sp=20000*Math.pow(0.0001,seg/(P.length-1));
  g.fillStyle=COL.fg; g.font='600 15px '+F; g.textAlign='left'; g.fillText('Neutron : '+(sp>=10?Math.round(sp).toLocaleString('fr-FR'):sp.toFixed(1).replace('.',','))+' km/s',14,26);
  g.fillStyle=COL.mute; g.font='500 12px '+F; g.fillText('chocs : '+Math.min(Math.floor(seg),P.length-1)+' · molécules d\'eau en fond',14,44);
 },
};
/* --- moteur de la visite --- */
const TV={i:0,auto:false,tm:null,t0:0,dur:0};
function openTour(i){
  if(A.s){ TV.wasPaused=A.paused; A.paused=true; syncAll(); }
  $('#menu').hidden=true; $('#tour').hidden=false;
  if(!$('#tplant').firstChild) $('#tplant').innerHTML=PLANT;
  tourGo(i||0);
}
function closeTour(){ cancelAnimationFrame(tourRAF); clearTimeout(TV.tm); TV.auto=false; $('#tour').hidden=true; if(A.s&&!A.done){ A.paused=TV.wasPaused; syncAll(); } else openMenu(); }
function tourGo(i){
  i=clamp(i,0,TOUR.length-1); TV.i=i; const c=TOUR[i];
  cancelAnimationFrame(tourRAF); $('#tinset').innerHTML=''; SFX.page();
  T('tt',c.t);
  $('#ttx').innerHTML=c.h+(c.last?'<div class="row" style="margin-top:14px"><button class="btn pri" id="tvTuto">Lancer le tutoriel</button><button class="btn" id="tvMenu">Retour au menu</button></div>':''); glossDom($('#ttx')); $('#ttx').scrollTop=0;
  const pl=$('#plant');
  if(c.inset){ $('#tplant').hidden=true; $('#tinset').hidden=false; if(ANIM[c.inset]) tourCanvas(c.inset); else $('#tinset').innerHTML=INSET[c.inset](); }
  else { $('#tinset').hidden=true; $('#tplant').hidden=false; pl.classList.toggle('dim',!!c.hl); pl.classList.toggle('rodsmove',!!c.rods); $$('#plant > g').forEach(gp=>gp.classList.toggle('hl',!!c.hl&&c.hl.includes(gp.id))); }
  tourThemes(i);
  $('#tvPrev').disabled=i===0; $('#tvNext').textContent=i===TOUR.length-1?'Terminer':'Suivant';
  const tt=$('#tvTuto'); if(tt) tt.onclick=()=>{ $('#tour').hidden=true; cancelAnimationFrame(tourRAF); launch('tuto'); };
  const tm=$('#tvMenu'); if(tm) tm.onclick=()=>{ $('#tour').hidden=true; cancelAnimationFrame(tourRAF); openMenu(); };
  tourTimer();
}
function tourTimer(){
  clearTimeout(TV.tm); $('#tvAuto').classList.toggle('on',TV.auto); $('#tvAuto').textContent=TV.auto?'Pause lecture':'Lecture auto';
  const bar=$('#tprog i'); bar.style.transition='none'; bar.style.width='0';
  if(!TV.auto||TV.i>=TOUR.length-1) return;
  const words=$('#ttx').textContent.split(/\s+/).length, d=Math.max(10,words/3.3)*1000;
  requestAnimationFrame(()=>{ bar.style.transition='width '+d+'ms linear'; bar.style.width='100%'; });
  TV.tm=setTimeout(()=>tourGo(TV.i+1),d);
}

/* ================= Visite : chapitres complémentaires, thèmes ================= */
const NEWCH={
 pcm:{t:'La réactivité et le pcm',inset:'pcm',h:`<p>Le facteur k est toujours très proche de 1 : 0,998, 1,000, 1,001… Pour parler de ces petits écarts sans aligner les zéros, on utilise la <b>réactivité</b> ρ, exprimée en <b>pcm</b> : « pour cent mille ».</p><p>Concrètement, <b>+100 pcm</b> veut dire que sur 100 000 neutrons d'une génération, la suivante en compte 100 100. <b>−100 pcm</b> : elle n'en compte que 99 900. Et <b>0 pcm</b> : exactement 100 000, la puissance est stable.</p><p>L'animation fait défiler quelques valeurs avec leur conséquence. Les repères à retenir :</p><ul><li>quelques <b>dizaines de pcm</b> : la puissance évolue en minutes, c'est le domaine de la conduite ;</li><li><b>600 pcm</b> (β) : seuil de la prompt-criticité, à ne jamais approcher ;</li><li>plusieurs <b>milliers de pcm négatifs</b> : un réacteur bien arrêté, avec sa <b>marge d'arrêt</b>.</li></ul><p>Tout le pilotage revient à ajouter ou retirer des pcm : grappes (≈ 1 à 10 pcm par pas), bore (≈ 9 pcm par ppm), température de l'eau, xénon. Le bilan de réactivité du simulateur fait exactement ce compte.</p>`},
 xeanim:{t:'Le xénon : comment il se forme et disparaît',inset:'xeanim',h:`<p>Le xénon 135 se gère comme un stock. L'animation suit ce stock dans le cœur, une heure de temps réel par seconde.</p><ul><li><b>Production</b> : un peu de xénon naît directement des fissions, mais surtout de l'<b>iode 135</b> (points jaunes), qui se transforme en xénon (points violets) en quelques heures.</li><li><b>Disparition</b> : le xénon capture un neutron et devient inoffensif (le « brûlage »), ou décroît lentement de lui-même.</li></ul><p>À puissance constante, les deux s'équilibrent. Quand on <b>arrête</b> le réacteur (à 3 h dans l'animation), le brûlage cesse d'un coup, alors que l'iode accumulé continue de produire du xénon : le stock de xénon <b>monte</b> pendant 8 à 9 heures, puis redescend en un à deux jours.</p><p>Le même mécanisme, en plus doux, suit chaque baisse de puissance : c'est pourquoi le suivi de charge demande des dilutions plusieurs heures après la baisse.</p>`},
 dianim:{t:'Le ΔI : la forme de la puissance',inset:'dianim',h:`<p>La puissance n'est pas la même en haut et en bas du cœur. Les chambres de mesure, placées à l'extérieur de la cuve, ont deux sections, haute et basse. On calcule <b>ΔI = P(haut) − P(bas)</b>, en % de la puissance nominale.</p><p>L'animation enfonce le groupe de grappes par le haut. Il absorbe des neutrons là où il se trouve : la puissance <b>se déplace vers le bas</b> et ΔI devient plus négatif. Le point se déplace sur le <b>diagramme de pilotage</b>, à droite.</p><p>Pourquoi s'en soucier : si la puissance se concentre trop d'un côté, le combustible y travaille plus fort, les marges thermiques diminuent et une <b>oscillation xénon</b> peut s'amorcer. On garde donc ΔI dans la bande verte : la référence ± 5 %.</p><p>Les leviers : les grappes déforment la distribution, le bore non. Pour ramener ΔI, on retire des grappes et on compense au bore.</p>`},
 rband:{t:'La bande de manœuvre du groupe R',inset:'rband',h:`<p>Le groupe R régule la température en permanence. Pour qu'il puisse agir dans les deux sens, il doit rester dans sa <b>bande de manœuvre</b>, ici d'environ 150 à 215 pas.</p><p>Le graphique montre l'efficacité d'un pas de grappe selon sa position. Elle est presque nulle aux extrémités et maximale à mi-hauteur. Près du haut, R a peu d'effet : s'il y arrive, il ne peut plus compenser une perte de réactivité, et Tmoy décroche sous Tref. Trop bas, il déforme le ΔI et réduit la marge à l'arrêt.</p><p>La règle de conduite qui en découle :</p><ul><li>R <b>monte</b> au fil des heures (xénon qui s'accumule, usure du combustible) → on <b>dilue</b> ;</li><li>R <b>descend</b> (xénon qui brûle après une remontée) → on <b>bore</b>.</li></ul><p>Le bore déplace donc lentement le point de fonctionnement de R, et R règle finement autour.</p>`},
 params:{t:'Les paramètres à suivre',inset:'params',h:`<p>Un opérateur ne regarde pas tout en même temps : il balaie quelques grandeurs clés, rangées dans le bandeau du simulateur en quatre familles. Le tableau donne, pour chacune, sa valeur normale et ce qu'elle surveille.</p><p>La méthode de lecture :</p><ol><li><b>Où suis-je ?</b> Puissance, charge, Tmoy : la tranche fait-elle ce qu'on lui demande ?</li><li><b>Ça bouge ?</b> Une valeur en gras avec une flèche varie : vers quel seuil va-t-elle ?</li><li><b>Ai-je de la réserve ?</b> Groupe R dans sa bande, ΔI dans le domaine, marges ΔT et saturation.</li></ol><p>Les jauges du bandeau rendent cette lecture immédiate : vert pour la plage normale, traits rouges pour les seuils de protection.</p>`},
 suivi:{t:'Le suivi de charge, tout ensemble',inset:'suivi',h:`<p>Le suivi de charge réunit toutes les notions de la visite. Les courbes sont <b>calculées par le simulateur</b> : baisse de 100 à 50 %, palier d'environ 5 heures, remontée, avec un opérateur qui dilue et bore pour garder R dans sa bande.</p><ul><li><b>La baisse</b> : les GCP s'insèrent selon leur calibrage, R règle la température.</li><li><b>Le palier</b> : le xénon s'accumule pendant des heures ; l'opérateur <b>dilue</b>, et le bore baisse.</li><li><b>La remontée</b> : le flux brûle le xénon plus vite qu'il ne se forme ; l'opérateur <b>bore</b>.</li></ul><p>Pendant tout ce temps, ΔI reste dans le domaine et Tmoy suit Tref à environ un degré près. Un bon suivi de charge s'anticipe : les appoints sont lancés avant que R n'atteigne ses limites.</p><p><b>Pas à pas :</b> 1. vitesse 5 %/min, consigne 50 % ; 2. pendant le palier, une dilution de 300 L chaque fois que R remonte au-dessus de 198 pas ou que Tmoy décroche sous Tref ; 3. après le palier, consigne 100 % ; 4. pendant la remontée, une borication de 100 L chaque fois que R descend sous 165 pas. C'est exactement ce que fait la correction commentée de l'exercice « Suivi de charge et xénon ».</p>`},
 method:{t:'La méthode de l\'opérateur',inset:'method',h:`<p>Piloter un réacteur, c'est moins agir vite qu'agir à propos. Une boucle simple guide chaque action :</p><ol><li><b>Surveiller</b> : lire les grandeurs clés et leurs tendances.</li><li><b>Anticiper</b> : prévoir où elles vont, par exemple le xénon dans trois heures ou R qui approche de sa limite.</li><li><b>Agir</b> : une action à la fois, dosée et annoncée (le journal du simulateur la garde).</li><li><b>Vérifier</b> : l'effet attendu est-il là ? Sinon, comprendre avant d'aller plus loin.</li></ol><p>Face à un incident, on commence par mettre la tranche en sécurité, puis on diagnostique. Le plus sûr est souvent le plus simple : l'arrêt automatique est une action normale quand la situation échappe au contrôle.</p><p>Le simulateur reprend cette logique : bandeau et vues pour surveiller, commandes par famille pour agir, bloc « alarmes, mes actions, automatismes » pour suivre, journal de quart, débriefing qui compare votre conduite à la conduite attendue.</p>`},
};
/* --- Thème « Manœuvres » : principes généraux de conduite --- */
const INSIM=t=>'<div class="insim"><b>Dans le simulateur</b> '+t+'</div>';
Object.assign(NEWCH,{
 etats:{t:'Les états de la tranche',inset:'etats',h:`<p>Une tranche ne passe pas d'un coup de « éteinte » à « pleine puissance ». Elle traverse une suite d'<b>états standards</b>, chacun avec ses règles, ses systèmes en service et ses protections actives. Les noms ci-dessous sont ceux des documents publics de l'IRSN et de l'ASN :</p><ul><li><b>APR</b>, arrêt pour rechargement : cuve ouverte, on renouvelle une partie du combustible ;</li><li><b>API</b>, arrêt pour intervention : circuit froid et dépressurisé, pour la maintenance ;</li><li><b>AN/RRA</b>, arrêt normal refroidi par le RRA, le circuit de refroidissement à l'arrêt : circuit fermé, en dessous d'environ 180 °C ;</li><li><b>AN/GV</b>, arrêt normal refroidi par les générateurs de vapeur, jusqu'à l'<b>arrêt à chaud</b> : 286 °C, 155 bar, réacteur sous-critique ;</li><li><b>RP</b>, réacteur en production : critique, de la puissance nulle à 100 %.</li></ul><p>Passer d'un état à l'autre est une <b>manœuvre</b> : on la prépare, on la suit pas à pas, et on vérifie qu'on est bien arrivé avant d'enchaîner. Les chapitres de ce thème décrivent celles que vous ferez dans le cockpit : diverger, coupler, monter en puissance, faire varier la charge, replier.</p>`+INSIM(`: vous partez soit de l'arrêt à chaud (exercice « Divergence », pilotage libre à l'arrêt à chaud), soit d'un état en production. Les états froids ne sont pas simulés.`)},
 diverg:{t:'Démarrer : la divergence',inset:'invm',h:`<p>À l'arrêt à chaud, le réacteur est sous-critique : le bore et les grappes absorbent plus de neutrons qu'il n'en faut. <b>Diverger</b>, c'est l'amener doucement à la criticité, c'est-à-dire au point où la réaction en chaîne s'entretient seule. Voici l'enchaînement, avec la raison de chaque geste.</p><ol><li><b>Préparer.</b> On calcule la position de R où le réacteur devrait devenir critique avec le bore du moment : c'est la <b>position critique estimée</b> (170 pas ± 25 dans le simulateur). On extrait d'abord les groupes d'arrêt : ils restent ainsi prêts à tomber.</li><li><b>Approcher par paliers.</b> On remonte R de 20 à 40 pas, puis on attend. Le comptage des neutrons monte puis se stabilise à un niveau plus élevé. On calcule alors <b>1/M</b> (chapitre précédent).</li><li><b>Prédire.</b> On prolonge la droite des 1/M jusqu'à zéro : on obtient la position où le réacteur deviendra critique. Le graphique montre deux prédictions successives, de plus en plus précises.</li><li><b>Ralentir.</b> Près de la position prédite, on avance de 1 ou 2 pas à la fois, en attendant à chaque fois : la stabilisation devient de plus en plus lente.</li><li><b>Reconnaître la criticité.</b> Le comptage ne se stabilise plus et grimpe régulièrement : un <b>temps de doublement</b> constant apparaît. On n'extrait plus. On vise un doublement en une à deux minutes, jamais en moins de 20 s.</li><li><b>Changer de détecteurs.</b> Au permissif <b>P6</b>, on inhibe la gamme source : ces compteurs très sensibles satureraient et provoqueraient un arrêt automatique. La gamme intermédiaire prend le relais.</li><li><b>Se poser vers 1 à 3 %.</b> Le combustible commence à chauffer et l'effet Doppler freine seul la montée. On corrige de 1 pas si besoin. C'est l'attente avant le couplage.</li></ol>`+INSIM(`: leçon « Divergence guidée », exercice « Divergence » et sa correction commentée. La valeur de 1/M s'affiche dans la ligne d'information, sous la consigne.`)},
 couplage:{t:'Le couplage au réseau',inset:'sync',h:`<p>Le réacteur est critique à quelques %, et la vapeur part au condenseur par le <b>contournement GCT-c</b> : la chaleur est évacuée, mais aucune électricité n'est produite. Pour produire, il faut raccorder l'alternateur au réseau : c'est le <b>couplage</b>.</p><p>Le réseau européen tourne à <b>50 Hz</b>. L'alternateur, entraîné par la turbine à 1 500 tr/min, produit lui aussi une tension alternative. Avant de fermer le disjoncteur, trois grandeurs doivent être identiques des deux côtés : la <b>tension</b>, la <b>fréquence</b> et la <b>phase</b>.</p><p>Le <b>synchroscope</b> de l'animation montre l'écart de phase : son aiguille tourne d'autant plus vite que les fréquences diffèrent. On ajuste la vitesse de la turbine jusqu'à ce qu'elle tourne très lentement, et l'on ferme le disjoncteur quand elle passe en haut, en phase.</p><p>Aussitôt couplé, l'alternateur prend une petite charge, pour ne jamais fonctionner en moteur. La vapeur passe progressivement du contournement à la turbine : la demande totale de vapeur change peu, et le réacteur ne voit qu'un léger transitoire.</p><p><b>Pas à pas :</b></p><ol><li>Réacteur stabilisé vers 10 à 12 %, vapeur au condenseur par le GCT-c.</li><li>Turbine lancée sur la vapeur jusqu'à 1 500 tr/min.</li><li>Tension, fréquence et phase ajustées sur celles du réseau.</li><li>Disjoncteur fermé quand l'aiguille du synchroscope passe en haut.</li><li>Petite charge prise aussitôt ; le contournement se referme à mesure que la turbine prend la vapeur.</li></ol>`+INSIM(`: la synchronisation est automatique. Agir › Turbine › « Coupler », possible à partir de 6 % de puissance nucléaire ; la charge démarre à 5 %.`)},
 montee:{t:'La montée en puissance',inset:'montee',h:`<p>Une fois la tranche couplée, on monte la charge de la turbine et, en mode G, le réacteur suit. Voici la montée pas à pas, telle que la joue la correction commentée de l'exercice, avec la raison de chaque geste. L'animation la rejoue, calculée par le simulateur.</p><ol><li><b>Aligner la charge sur le réacteur.</b> Juste après le couplage, la turbine ne prend que 5 % alors que le réacteur en fournit 12 à 13 %. On monte la consigne vers 14 %, à 3 %/min, pour équilibrer les deux et ramener Tmoy près de Tref.</li><li><b>Passer les GCP en automatique et borer.</b> Les GCP rejoignent leur courbe de calibrage. À ce bore, ils apportent environ 200 pcm de trop : on lance aussitôt une borication de 1 m³ qui les compense. On laisse R en manuel pendant ce temps, sinon il plongerait pour compenser lui-même.</li><li><b>Passer R en automatique</b> quand Tmoy est revenue sur Tref : la régulation prend la main sans à-coup. On est alors en <b>mode G</b>.</li><li><b>Vérifier le seuil bas de haut flux.</b> Au démarrage, une protection arrête le réacteur à 25 %. Au-dessus du permissif P10 (10 %), on la bloque pour pouvoir monter ; si la puissance repasse sous 10 %, le blocage se lève et il faut le refaire.</li><li><b>Monter à 3 %/min jusqu'à 100 %.</b> Le combustible n'aime pas les variations brusques : les pastilles chauffent et se dilatent plus vite que la gaine qui les entoure. On limite donc la vitesse, et dans la réalité des paliers sont imposés après un arrêt prolongé.</li><li><b>Surveiller R et corriger au bore.</b> Pendant la montée, les GCP sortent avec la charge et R affine. Si R descend vers 165 pas, on bore 100 L ; s'il monte au-dessus de 205, on dilue 100 L. On garde un œil sur le ΔI.</li></ol><p>En fin de montée, la puissance nucléaire affichée dépasse d'environ 1 % la charge. Ce n'est pas une erreur : après un démarrage, la chaleur dégagée par les produits de fission n'a pas encore atteint son niveau de pleine puissance, et la fission fournit le complément.</p><p>Après la montée, le travail n'est pas fini : le xénon va passer, en une journée environ, de son équilibre de basse puissance à celui de pleine puissance. Il faudra diluer régulièrement.</p>`+INSIM(`: exercice « Couplage et montée en charge » et sa correction commentée. Agir › Turbine pour la charge, Agir › Grappes pour les modes, Agir › Bore pour les appoints.`)},
 leviers:{t:'Faire varier la puissance : qui fait quoi',inset:'leviers',h:`<p>Faire varier la puissance suit toujours la même chaîne : <b>on demande à la turbine</b>, et le réacteur suit. L'opérateur ne « pousse » pas le réacteur avec les grappes : il fixe la charge, et les automatismes font le reste. Son vrai travail est ailleurs : surveiller, et gérer ce qui est lent.</p><p>Le tableau range les leviers selon qui les actionne et à quelle vitesse ils agissent. La règle à retenir : <b>les grappes pour le rapide, le bore pour le lent, le xénon à anticiper</b>.</p><p>Avant toute variation de charge, posez-vous trois questions :</p><ol><li>Où sera R à la fin : faudra-t-il borer ou diluer ?</li><li>Que fera le xénon dans les heures qui viennent ?</li><li>Le ΔI restera-t-il dans son domaine ?</li></ol>`+INSIM(`: la charge se règle dans Agir › Turbine, les appoints dans Agir › Bore. Le bilan de réactivité, dans la zone Surveiller, montre la part de chaque levier.`)},
 freq:{t:'Programme de charge et réglage de fréquence',inset:'freq',h:`<p>Le réseau doit produire à chaque instant exactement ce qui est consommé ; sinon, sa fréquence s'écarte de 50 Hz. Les centrales nucléaires françaises participent à cet équilibre de trois façons :</p><ul><li><b>Le programme de charge</b> : le gestionnaire du réseau demande des paliers à l'avance, par exemple 50 % la nuit et 100 % le jour. C'est le <b>suivi de charge</b>, lent et prévu.</li><li><b>Le réglage primaire de fréquence</b> : automatique et immédiat. Si la fréquence baisse, chaque groupe augmente un peu sa puissance, de quelques % au plus, en moins de trente secondes.</li><li><b>Le réglage secondaire</b>, ou téléréglage : un signal du gestionnaire du réseau ajuste la puissance de quelques % sur quelques minutes, pour ramener la fréquence à 50 Hz.</li></ul><p>Pour le réacteur, ce sont autant de variations de charge que le mode G absorbe : les grappes suivent, le bore reprend la dérive lente. La courbe montre l'allure d'une journée type : le programme, et par-dessus, les petites variations des réglages.</p>`+INSIM(`: le programme de charge est au cœur de l'exercice « Suivi de charge et xénon ». Les réglages de fréquence ne sont pas simulés.`)},
 repli:{t:'Replier la tranche jusqu\'à l\'arrêt à chaud',inset:'repli',h:`<p><b>Replier</b> la tranche, c'est l'amener vers un état plus bas : de la production à l'arrêt à chaud, puis éventuellement vers les états froids. Un repli peut être programmé, pour une maintenance ou un rechargement, ou imposé : les règles d'exploitation fixent un délai pour replier quand un matériel important devient indisponible.</p><ol><li><b>Baisser la charge</b> à vitesse contrôlée, jusqu'au minimum de la turbine.</li><li><b>Découpler</b> : l'alternateur est séparé du réseau, la vapeur repart au condenseur par le GCT-c.</li><li><b>Rendre le réacteur sous-critique</b> en insérant les grappes de commande ; la puissance décroît avec une période d'environ −80 s.</li><li><b>Borer</b> jusqu'à la <b>marge d'arrêt</b> voulue. Les grappes ont arrêté la réaction ; le bore garantit qu'elle le restera, quand le xénon aura disparu et si l'on refroidit le circuit, car une eau plus froide rend de la réactivité.</li><li><b>Stabiliser</b> à l'arrêt à chaud, 286 °C et 155 bar, puis refroidir et dépressuriser si l'on doit descendre plus bas.</li></ol><p>Les courbes sont calculées par le simulateur depuis 100 %. La marge d'arrêt continue de grandir après la borication, car le xénon monte après l'arrêt. Il disparaîtra en un à deux jours et la marge diminuera d'autant : c'est pourquoi on borate en tenant compte de sa disparition.</p>`+INSIM(`: exercice « Mise à l'arrêt à chaud », depuis 30 %. Agir › Turbine › « Découpler », possible sous 6 % de charge.`)},
 imprevu:{t:'Les arrêts imprévus',inset:'imprevu',h:`<p>Toutes les sorties de production ne sont pas choisies. Trois situations reviennent souvent en formation : l'<b>arrêt automatique du réacteur</b>, le <b>déclenchement de la turbine</b> et l'<b>îlotage</b>. Le tableau résume, pour chacune, la cause, ce que font les automatismes et ce que fait l'opérateur.</p><p>Dans tous les cas, la première question est la même : <b>la chaleur du cœur est-elle bien évacuée ?</b> Grappes tombées, puissance qui décroît, eau dans les générateurs de vapeur, vapeur évacuée, pression et niveau du pressuriseur tenus. Ensuite seulement, on cherche la cause et on prépare le redémarrage.</p>`+INSIM(`: tutoriel (AAR manuel) et aléas « Îlotage sur perte du réseau », « Déclenchement d'une pompe primaire », « Perte d'une turbopompe alimentaire ».`)},
 regles:{t:'Les règles d\'or du pilote',inset:'regles',h:`<p>Quelques principes reviennent dans toutes les manœuvres. Ils valent dans le simulateur comme dans une vraie salle de commande.</p><p>Le plus important tient en une phrase : <b>un réacteur se pilote en anticipant</b>. Les grappes et les automatismes réagissent en secondes, mais le bore agit en minutes et le xénon en heures. Le bon opérateur est déjà en train de préparer ce qui arrivera dans une heure.</p><p>Et quand quelque chose vous échappe, ne cherchez pas d'abord à comprendre : <b>stabilisez</b>. Arrêtez le mouvement en cours, figez la charge, puis analysez calmement. S'il y a un doute sur la sûreté, arrêter le réacteur est toujours une réponse acceptable.</p>`+INSIM(`: commencez par le tutoriel, puis les leçons, avant les exercices notés et les aléas.`)}
});
/* --- Pédagogie : familles de grappes, comptage et 1/M, montée animée --- */
Object.assign(NEWCH,{
 groupes:{t:'Les trois familles de grappes',inset:'groupes',h:`<p>Les grappes ne bougent pas toutes ensemble : elles sont réparties en <b>groupes</b>, et chaque groupe a un rôle précis. Leur position se compte en <b>pas</b> : un pas vaut environ 1,6 cm, et 225 pas correspondent à une grappe entièrement sortie du cœur.</p><ul><li><b>Les groupes d'arrêt</b> (SA, SB, SC) : en fonctionnement, ils restent tout en haut, hors du cœur. On ne pilote jamais avec eux. Ce sont une réserve de sûreté : ils sont là pour tomber et arrêter le réacteur.</li><li><b>Les GCP</b>, groupes de compensation de puissance (G1, G2, N1, N2) : G1 et G2 sont des grappes « grises », qui absorbent peu ; N1 et N2 sont « noires », plus absorbantes. Ils sortent l'un après l'autre, en se chevauchant, à mesure que la charge de la turbine augmente. Leur position est fixée par la charge, d'après une <b>courbe de calibrage</b> : ils compensent le défaut de puissance, ce frein naturel qui serre quand le réacteur chauffe.</li><li><b>Le groupe R</b>, de régulation : il compare en permanence la température moyenne de l'eau (Tmoy) à sa valeur de consigne (Tref), et s'insère ou s'extrait de quelques pas pour corriger l'écart. Il doit rester dans sa <b>bande de manœuvre</b>, vers 150 à 215 pas, pour pouvoir agir dans les deux sens.</li></ul><p>En résumé : les GCP font le gros du travail, calculé d'avance selon la charge ; R fait l'ajustement fin d'après la mesure ; les groupes d'arrêt attendent. Lors d'un arrêt automatique, <b>toutes</b> les grappes tombent, groupes d'arrêt compris.</p>`+INSIM(`: Agir › Grappes de commande. Les trois cases montrent la position des groupes d'arrêt, des GCP et de R ; les modes Auto et Manuel s'y règlent pour les GCP et pour R.`)},
 comptage:{t:'Compter les neutrons : la multiplication et 1/M',inset:'mult',h:`<p>À l'arrêt, le réacteur est sous-critique : k est plus petit que 1. Pourtant, les compteurs de démarrage (la <b>gamme source</b>) comptent des neutrons. Ils viennent d'une <b>source</b> : des matériaux placés dans le cœur, et le combustible lui-même, en émettent un peu en permanence.</p><p>Chaque neutron de la source lance une petite chaîne de fissions qui s'éteint, car chaque génération est plus petite que la précédente. Au total, un neutron de la source en donne <b>1 / (1 − k)</b> :</p><ul><li>k = 0,9 : 10 neutrons par neutron de la source ;</li><li>k = 0,99 : 100 ;</li><li>k = 1 : la chaîne ne s'éteint plus, c'est la criticité.</li></ul><p>Quand on remonte les grappes, k se rapproche de 1 et le comptage augmente. La <b>multiplication M</b> compare le comptage du moment à celui du départ : s'il est passé de 100 à 175 coups par seconde, M = 1,75. Son inverse, <b>1/M</b>, vaut 1 au départ et <b>tombe vers 0</b> à l'approche de la criticité.</p><p>Pourquoi l'inverse ? Parce que 1/M descend presque en ligne droite. En prolongeant la droite entre deux mesures jusqu'à zéro, on <b>prédit</b> la position des grappes où le réacteur deviendra critique, avant d'y arriver. C'est le télémètre de l'opérateur pendant le démarrage.</p>`+INSIM(`: oui, on s'en sert. Dans la leçon « Divergence guidée » et dans l'exercice « Divergence », la valeur de 1/M s'affiche dans la ligne d'information, sous la consigne. La correction commentée de la Divergence montre comment on la lit.`)}
});
function wrapTxt(g,txt,x,y,maxW,lh){ const words=txt.split(' '); let line='', yy=y; for(const w of words){ const tst=line?line+' '+w:w; if(g.measureText(tst).width>maxW&&line){ g.fillText(line,x,yy); line=w; yy+=lh; } else line=tst; } if(line) g.fillText(line,x,yy); return yy+lh; }
Object.assign(ANIM,{
 groupes(g,w,h,t){
  const F=getComputedStyle(document.body).getPropertyValue('--f-disp'), N=getComputedStyle(document.body).getPropertyValue('--f-num');
  const T=15, u=t%T, nar=w<520;
  let ph, L, sd=0, drop=0, rOsc=0;
  if(u<6){ ph=0; L=0.3+0.7*(u/6); }
  else if(u<9.5){ ph=1; L=1; rOsc=Math.sin((u-6)*2.6); }
  else if(u<13){ ph=2; L=1; drop=Math.min(1,(u-9.5)/0.5); }
  else { ph=3; L=0.3; drop=1-Math.min(1,(u-13)/1.5); }
  const x0=w*0.05, x1=nar?w*0.95:w*0.6, yT=h*0.2, yB=nar?h*0.55:h*0.8, H=yB-yT;
  g.fillStyle=COL.hot; g.globalAlpha=0.10; g.fillRect(x0,yT,x1-x0,H); g.globalAlpha=1;
  g.strokeStyle=COL.line; g.lineWidth=1.5; g.strokeRect(x0,yT,x1-x0,H);
  const cols=[['SA','sd'],['SB','sd'],['SC','sd'],['G1','g'],['G2','g'],['N1','n'],['N2','n'],['R','r']];
  const dx=(x1-x0)/(cols.length+1), bw=Math.max(6,dx*0.32);
  const extG=i=>Math.max(0,Math.min(1,L*1.6-i*0.2));
  cols.forEach(([nm,ty],i)=>{ const x=x0+dx*(i+1);
    let ins= ty==='sd'?0: ty==='r'?0.2+0.035*rOsc : 1-extG(i-3);
    ins=ins+(1-ins)*drop;
    g.strokeStyle=COL.dim; g.lineWidth=1; g.beginPath(); g.moveTo(x,h*0.06); g.lineTo(x,yT+ins*H); g.stroke();
    const col= ty==='sd'?COL.mute: ty==='g'?'#9aa7b0': ty==='n'?COL.fg: COL.warn;
    g.fillStyle=col; if(ins>0.005) g.fillRect(x-bw/2,yT,bw,ins*H); g.fillRect(x-bw/2-2,yT+ins*H-3,bw+4,4);
    g.fillStyle=COL.fg; g.font='600 '+(nar?10:12)+'px '+F; g.textAlign='center'; g.fillText(nm,x,yB+15); });
  g.font='600 '+(nar?11:13)+'px '+F; g.fillStyle=COL.mute; g.textAlign='center';
  g.fillText('arrêt',x0+dx*2,yB+32); g.fillText('GCP',x0+dx*5.5,yB+32); g.fillText('régulation',x0+dx*8,yB+32);
  g.textAlign='left'; g.fillStyle=COL.mute; g.font='500 11px '+F; g.fillText('cœur',x0+4,yB-6);
  const tx=nar?w*0.05:w*0.65, ty0=nar?h*0.76:h*0.22, mw=nar?w*0.9:w*0.32;
  const P=[['Montée de charge','Les GCP sortent l\'un après l\'autre, en se chevauchant, à mesure que la charge augmente. Les groupes d\'arrêt restent en haut.'],
           ['Régulation fine','La charge est stable. R bouge de quelques pas autour de sa position pour garder Tmoy sur Tref.'],
           ['Arrêt automatique','Toutes les grappes tombent par leur poids en moins de 2 secondes, groupes d\'arrêt compris.'],
           ['Retour','Après le réarmement, on extrait d\'abord les groupes d\'arrêt, puis on redémarre.']][ph];
  g.fillStyle=ph===2?COL.crit:COL.accent; g.font='700 '+(nar?14:17)+'px '+F; g.fillText(P[0],tx,ty0);
  g.fillStyle=COL.fg; g.font='500 '+(nar?12:14)+'px '+F; let yy=wrapTxt(g,P[1],tx,ty0+(nar?18:24),mw,nar?16:19);
  if(!nar){ g.font='600 13px '+N; g.fillStyle=COL.mute; g.fillText('Charge turbine : '+Math.round(L*100)+' %',tx,yy+14); if(ph===1){ g.fillText('Tmoy − Tref : '+(rOsc*0.5>=0?'+':'−')+Math.abs(rOsc*0.5).toFixed(1).replace('.',',')+' °C',tx,yy+34); } }
 },
 mult(g,w,h,t){
  const F=getComputedStyle(document.body).getPropertyValue('--f-disp'), N=getComputedStyle(document.body).getPropertyValue('--f-num');
  const S=[{R:0,k:0.9},{R:100,k:0.943},{R:140,k:0.98},{R:160,k:0.995}], D=4.5, T=S.length*D+1.5;
  const u=t%T, i=Math.min(S.length-1,Math.floor(u/D)), st=S[i], v=Math.min(1,(u-i*D)/2), nar=w<520;
  const C=10/(1-st.k), M=C/100, inv=1/M;
  const lx=w*0.04, lw=nar?w*0.92:w*0.44, ly=h*0.16, lh=nar?h*0.3:h*0.52;
  g.fillStyle=COL.fg; g.textAlign='left'; g.font='700 '+(nar?13:15)+'px '+F; g.fillText('Une chaîne par neutron de la source',lx,h*0.09);
  const G=36, bw=lw/G;
  for(let j=0;j<G;j++){ if(j/G>v) break; const a=Math.pow(st.k,j); g.fillStyle=COL.accent; g.globalAlpha=0.35+0.65*a; g.fillRect(lx+j*bw+1,ly+lh*(1-a),bw-2,lh*a); }
  g.globalAlpha=1; g.strokeStyle=COL.line; g.beginPath(); g.moveTo(lx,ly+lh); g.lineTo(lx+lw,ly+lh); g.stroke();
  g.fillStyle=COL.mute; g.font='500 11px '+F; g.fillText('générations successives →',lx,ly+lh+14);
  g.font='600 '+(nar?12:14)+'px '+N; g.fillStyle=COL.fg; let y2=ly+lh+(nar?32:36);
  g.fillText('R = '+st.R+' pas · k = '+st.k.toFixed(3).replace('.',','),lx,y2);
  g.fillText('comptage '+Math.round(C)+' c/s · M = '+M.toFixed(2).replace('.',',')+' · 1/M = '+inv.toFixed(2).replace('.',','),lx,y2+(nar?18:22));
  const cx0=nar?w*0.14:w*0.56, cx1=w*0.96, cy0=nar?h*0.68:h*0.14, cy1=nar?h*0.95:h*0.8;
  const X=r=>cx0+r/200*(cx1-cx0), Y=q=>cy1-q*(cy1-cy0);
  g.strokeStyle=COL.line; g.lineWidth=1; g.strokeRect(cx0,cy0,cx1-cx0,cy1-cy0);
  g.fillStyle=COL.mute; g.font='500 11px '+N; g.textAlign='center'; for(const r of [0,100,200]) g.fillText(r,X(r),cy1+13); g.textAlign='right'; g.fillText('1',cx0-4,Y(1)+4); g.fillText('0',cx0-4,Y(0)+4);
  g.textAlign='left'; g.font='600 12px '+F; g.fillText('1/M selon la position de R',cx0+4,cy0+14);
  const pts=S.slice(0,i+1).map(p=>[p.R,(1-p.k)/0.1]);
  if(pts.length>=2){ const [a,b]=pts.slice(-2); const sl=(b[1]-a[1])/(b[0]-a[0]), r0=a[0]-a[1]/sl; g.setLineDash([5,4]); g.strokeStyle=COL.warn; g.lineWidth=2; g.beginPath(); g.moveTo(X(a[0]),Y(a[1])); g.lineTo(X(r0),Y(0)); g.stroke(); g.setLineDash([]);
    g.fillStyle=COL.warn; g.font='600 12px '+F; g.textAlign='right'; g.fillText('prédiction ≈ '+Math.round(r0)+' pas',X(Math.min(195,r0+30)),Y(0)-8); }
  g.fillStyle=COL.accent; pts.forEach(p=>{ g.beginPath(); g.arc(X(p[0]),Y(p[1]),5,0,2*Math.PI); g.fill(); });
  if(!nar){ g.textAlign='left'; g.fillStyle=COL.mute; g.font='500 13px '+F; wrapTxt(g,i===0?'Départ : on note le comptage, 1/M = 1.':i===S.length-1?'Près de k = 1, la chaîne ne s\'éteint presque plus : la prédiction se précise, on avance tout doucement.':'On remonte R d\'un palier, on attend que le comptage se stabilise, on calcule 1/M.',cx0,cy1+34,cx1-cx0,17); }
 },
 montee(g,w,h,t){
  const F=getComputedStyle(document.body).getPropertyValue('--f-disp'), N=getComputedStyle(document.body).getPropertyValue('--f-num');
  const md=monteeData(), d=md.pts, ev=md.ev, tEnd=d[d.length-1].m, Tc=24, u=t%Tc, tm=Math.min(tEnd,u/(Tc-4)*tEnd), nar=w<560;
  const cx0=w*0.1, cx1=nar?w*0.97:w*0.6, H3=(nar?h*0.6:h*0.84)/3, top=h*0.05;
  const X=m=>cx0+m/tEnd*(cx1-cx0);
  const panel=(k,lab,series,y0,y1,ticks)=>{ const ya=top+k*H3+8, yb=top+(k+1)*H3-10, Y=v=>yb-(v-y0)/(y1-y0)*(yb-ya);
    g.strokeStyle=COL.line; g.lineWidth=1; g.strokeRect(cx0,ya,cx1-cx0,yb-ya);
    g.fillStyle=COL.mute; g.font='500 10px '+N; g.textAlign='right'; ticks.forEach(v=>g.fillText(String(v),cx0-4,Y(v)+3));
    g.textAlign='left'; g.font='600 11px '+F; g.fillText(lab,cx0+4,ya+12);
    series.forEach(([f,c])=>{ g.strokeStyle=c; g.lineWidth=2; g.beginPath(); let st=false; for(const p of d){ if(p.m>tm) break; const x=X(p.m), y=Y(Math.max(y0,Math.min(y1,f(p)))); if(!st){ g.moveTo(x,y); st=true; } else g.lineTo(x,y); } g.stroke(); }); };
  const c0=Math.floor(Math.min(...d.map(p=>p.cb))/10)*10, c1=Math.ceil(Math.max(...d.map(p=>p.cb))/10)*10;
  panel(0,'charge turbine (bleu) · puissance nucléaire (orange), %',[[p=>p.lt,COL.accent],[p=>p.pn,COL.hot]],0,110,[0,50,100]);
  panel(1,'GCP (violet) · groupe R (jaune), pas',[[p=>p.g,COL.bore],[p=>p.r,COL.warn]],60,230,[80,150,215]);
  panel(2,'bore, ppm',[[p=>p.cb,COL.feed]],c0-5,c1+5,[c0,c1]);
  g.strokeStyle=COL.fg; g.globalAlpha=0.5; g.beginPath(); g.moveTo(X(tm),top); g.lineTo(X(tm),top+3*H3-10); g.stroke(); g.globalAlpha=1;
  g.fillStyle=COL.mute; g.font='500 11px '+N; g.textAlign='center'; g.fillText(Math.round(tm)+' min',X(tm),top+3*H3+4);
  const cur=ev.filter(e=>e.m<=tm); const tx=nar?w*0.05:w*0.64, ty=nar?h*0.7:h*0.08, mw=nar?w*0.9:w*0.34;
  g.textAlign='left';
  if(nar){ const e=cur[cur.length-1]; if(e){ g.fillStyle=COL.accent; g.font='700 14px '+F; g.fillText(e.t,tx,ty); g.fillStyle=COL.fg; g.font='500 12px '+F; wrapTxt(g,e.w,tx,ty+18,mw,16); } return; }
  let y=ty; ev.forEach((e,j)=>{ const on=e.m<=tm, last=on&&(j===ev.length-1||ev[j+1].m>tm);
    g.fillStyle=on?(last?COL.accent:COL.fg):COL.dim; g.font='700 13px '+F; g.fillText((on?'✓ ':'· ')+e.t,tx,y); y+=17;
    if(last){ g.fillStyle=COL.mute; g.font='500 12px '+F; y=wrapTxt(g,e.w,tx+14,y,mw-14,15)+2; } });
 }
});
/* --- Thème « Électricité » et chapitres Fukushima --- */
const OUSIM=t=>'<div class="insim"><b>Où le simulateur s\'arrête</b> '+t+'</div>';
Object.assign(NEWCH,{
 elsrc:{t:"D'où vient le courant de la centrale ?",inset:'elsrc',h:`<p>Une tranche de 900 MWe ne fait pas que produire de l'électricité : elle en consomme aussi, quelques dizaines de mégawatts. Les trois pompes primaires font chacune environ 6 MW ; s'y ajoutent les pompes qui envoient l'eau froide au condenseur et des centaines de moteurs plus petits.</p><p>Trois sources peuvent alimenter ces <b>auxiliaires</b> :</p><ul><li>l'<b>alternateur</b> lui-même, par le <b>transformateur de soutirage (TS)</b> : c'est la source normale tant que la turbine tourne ;</li><li>le <b>réseau 225 kV</b>, par le <b>transformateur auxiliaire (TA)</b> : une seconde arrivée, indépendante de la ligne 400 kV qui évacue la production ;</li><li>les <b>diesels de secours</b>, un par voie, pour les seuls systèmes de sûreté.</li></ul><p>L'animation suit le courant : presque tout part vers le réseau 400 kV, une petite partie revient vers la tranche par le TS. Le TA reste sous tension, en attente.</p>`+INSIM(`la vue <b>Électrique</b> (onglet sous la vue centrale) montre ce même schéma, avec l'état de chaque disjoncteur : carré plein fermé, carré vide ouvert.`)},
 elsecu:{t:'Tableaux normaux, tableaux secourus',inset:'elsecu',h:`<p>Le courant des auxiliaires arrive en <b>6,6 kV</b> sur des <b>tableaux</b>, de grandes armoires de disjoncteurs, rangés en deux familles :</p><ul><li>les tableaux <b>normaux</b> (LGA à LGD) alimentent ce qui sert à produire : pompes primaires, pompes de circulation, condenseur. Ils n'ont pas de secours propre : sans TS ni TA, ils s'éteignent ;</li><li>les tableaux <b>secourus</b>, LHA pour la voie A et LHB pour la voie B, alimentent ce qui sert à la sûreté : injection de sécurité, charge RCV, motopompes ASG, chaufferettes secourues. Chacun a son diesel.</li></ul><p>Les deux voies sont <b>redondantes</b> et séparées physiquement, dans des locaux différents : une seule suffit à ramener le réacteur dans un état sûr.</p><p>Sous le 6,6 kV, la distribution continue. Des transformateurs abaissent la tension en <b>380 V</b> pour les moteurs plus petits et les vannes motorisées. Le contrôle-commande, les protections et l'instrumentation sont alimentés en <b>125 V</b> et <b>48 V continus</b> par des <b>batteries</b> toujours en charge, et en <b>220 V alternatif</b> par des <b>onduleurs</b>, qui fabriquent du courant alternatif à partir des batteries : ils ne coupent jamais, même pendant les dix secondes du démarrage d'un diesel.</p>`+OUSIM(`Il représente les sources, les trois familles de tableaux 6,6 kV (normaux, LHA, LHB), les diesels, le DUS, le LLS et une jauge de batteries. Les tableaux 380 V, les onduleurs et le détail du contrôle-commande ne sont pas simulés : on considère qu'ils suivent leur tableau 6,6 kV, et que le contrôle-commande tient tant que les batteries ne sont pas vides.`)},
 elilot:{t:"Perte du réseau : l'îlotage, puis le TA",inset:'elilot',h:`<p>Si la ligne 400 kV est perdue, après un orage ou un défaut sur le réseau, le disjoncteur de ligne s'ouvre. La tranche tente alors un <b>îlotage</b> : la turbine perd presque toute sa charge et se cale sur la seule consommation de la tranche, environ 5 %. Le GCT-c envoie au condenseur la vapeur en trop, les grappes s'enfoncent. Les auxiliaires restent sur le TS : rien ne s'arrête. Quand le réseau revient, on recouple.</p><p>L'îlotage est une manœuvre brutale, et il peut échouer. La turbine déclenche, l'alternateur s'arrête, le TS ne reçoit plus rien. Les tableaux basculent alors automatiquement sur le <b>TA</b>, alimenté par le réseau 225 kV, après une coupure très brève. Le réacteur, lui, s'arrête : déclenchement de la turbine au-dessus de P7.</p><p>L'animation enchaîne les trois situations : marche normale, îlotage réussi, îlotage raté et bascule sur le TA.</p>`+INSIM(`l'aléa <b>Îlotage sur perte du réseau</b> et la leçon <b>D'où vient le courant de la centrale ?</b> montrent l'îlotage ; l'aléa <b>Perte des alimentations externes</b> montre l'îlotage raté, sans TA.`)},
 eldg:{t:'Les diesels : dix secondes pour la sûreté',inset:'eldg',h:`<p>Si le TS et le TA sont perdus ensemble, c'est le <b>manque de tension externe</b>. Les tableaux normaux s'éteignent : les pompes primaires s'arrêtent, le réacteur est arrêté. Sur chaque voie, le tableau secouru détecte le manque de tension et lance son <b>diesel</b>, un moteur de plusieurs mégawatts.</p><p>En une dizaine de secondes, le diesel atteint sa vitesse, sa tension (6,6 kV) et sa fréquence (50 Hz), puis son disjoncteur se ferme sur le tableau. On ne rebranche pas tout d'un coup : un moteur qui démarre appelle plusieurs fois son courant normal, et le diesel calerait. Les charges reprennent donc <b>par paliers</b>, dans l'ordre des priorités : l'injection de sécurité d'abord, puis l'ASG, la charge RCV, les chaufferettes.</p><p>Les diesels sont essayés régulièrement, une voie à la fois, et leur réserve de fioul couvre plusieurs jours de marche.</p>`+INSIM(`les charges reprennent 5 s (IS), 15 s (ASG), 30 s (charge RCV) et 45 s (chaufferettes) après le couplage du diesel. L'exercice <b>Essai périodique des diesels</b> et l'aléa <b>Un diesel refuse de démarrer</b> les mettent en pratique.`)},
 elcn:{t:'Sans pompes : la circulation naturelle',inset:'elcn',h:`<p>Les pompes primaires sont sur les tableaux normaux : en manque de tension externe, elles s'arrêtent. Le réacteur est arrêté, mais la puissance résiduelle, quelques % au début, doit encore être évacuée.</p><p>La physique s'en charge. L'eau chauffée dans le cœur devient plus légère et monte ; refroidie dans les générateurs de vapeur, placés plus haut que le cœur, elle redevient plus lourde et redescend. C'est la <b>circulation naturelle</b>, le même thermosiphon qu'un chauffage central sans circulateur.</p><p>Le débit ne fait plus que quelques % du débit nominal, et l'écart entre branches chaude et froide grandit, mais la chaleur passe. Deux conditions : des GV alimentés en eau, par l'ASG, et un primaire sans vapeur, car une bulle en point haut bloquerait la circulation.</p>`+INSIM(`sans pompe primaire, le débit varie comme la racine cubique de la puissance à évacuer, entre 1,5 et 8 % du nominal : environ 4 % pour 1 % de puissance résiduelle.`)},
 elbat:{t:'Plus de courant : batteries et turbopompe ASG',inset:'elbat',h:`<p>Si les deux diesels échouent aussi, plus aucun tableau secouru n'est sous tension : c'est la situation <b>H3</b>, la perte totale des sources électriques. Deux matériels tiennent sans courant alternatif :</p><ul><li>la <b>turbopompe ASG</b> : une petite turbine, entraînée par la vapeur des GV, fait tourner une pompe qui renvoie de l'eau dans ces mêmes GV. Tant qu'il y a de la vapeur, le cœur se refroidit, la vapeur partant à l'atmosphère par le GCT-a ;</li><li>les <b>batteries</b> : elles gardent le contrôle-commande, l'instrumentation et quelques vannes pendant une durée limitée, de l'ordre de l'heure, le temps de rétablir une source.</li></ul><p>Le turboalternateur <b>LLS</b>, lui aussi entraîné par la vapeur, alimente l'injection aux joints des pompes primaires, qui évite une fuite par ces joints, et une partie de l'instrumentation. Enfin, depuis Fukushima, chaque réacteur dispose d'un <b>diesel d'ultime secours (DUS)</b>, capable de reprendre une voie secourue.</p>`+INSIM(`les batteries tiennent une heure. L'exercice <b>Perte totale des sources électriques</b> vous fait vivre une situation H3 jusqu'au démarrage du DUS.`)},
 fuku:{t:"Fukushima, mars 2011 : ce qui s'est passé",inset:'fuku',h:`<p>Le 11 mars 2011, un séisme de magnitude 9 frappe le Japon. À la centrale de Fukushima Daiichi, les réacteurs 1, 2 et 3 sont en marche : ils s'arrêtent automatiquement. Les lignes électriques sont détruites ; les diesels démarrent et refroidissent les cœurs, comme prévu.</p><p>Moins d'une heure plus tard, un <b>tsunami</b> d'environ 14 m passe par-dessus la digue, prévue pour un peu moins de 6 m. L'eau noie les diesels, la plupart des tableaux électriques et une partie des batteries. Les réacteurs 1 à 4 sont en <b>perte totale des sources électriques</b>, et aussi de la <b>source froide</b> : les pompes d'eau de mer sont détruites.</p><p>Les systèmes de refroidissement entraînés par la vapeur tiennent un temps sur les réacteurs 2 et 3, puis s'arrêtent. Les cœurs des réacteurs 1, 2 et 3 fondent dans les jours qui suivent. L'hydrogène produit par l'oxydation des gaines s'accumule dans les bâtiments et explose (réacteurs 1, 3 et 4). Les rejets radioactifs imposent l'évacuation de plus de 100 000 personnes.</p><p><b>Ce qui se transpose à un REP.</b> Fukushima Daiichi est un <b>réacteur à eau bouillante</b> (REB) : un seul circuit, la vapeur du cœur va directement à la turbine, et l'enceinte est bien plus petite. Mais le scénario de fond, plus de courant et plus de source froide pendant des jours, sur plusieurs réacteurs à la fois, menace n'importe quel réacteur, car la puissance résiduelle ne s'arrête pas. Sur un REP, c'est la situation H3 de la page « Batteries et turbopompe ASG », qui durerait.</p>`},
 fukufr:{t:'Après Fukushima : ce que la France a changé',inset:'fukufr',h:`<p>Dès 2011, l'ASN demande à EDF des <b>évaluations complémentaires de sûreté</b>, les « stress tests » européens : que se passe-t-il si une agression dépasse ce pour quoi la centrale a été conçue, séisme, inondation, perte totale du courant ou de l'eau de refroidissement, sur tous les réacteurs d'un site à la fois ?</p><p>Les principales réponses :</p><ul><li>un <b>noyau dur</b> : un ensemble réduit de matériels et d'organisations, protégé contre des agressions bien plus fortes que celles retenues à la conception, pour éviter la fusion du cœur ou, à défaut, limiter les rejets ;</li><li>un <b>diesel d'ultime secours (DUS)</b> par réacteur, dans un bâtiment conçu pour résister au séisme et à l'inondation extrêmes, capable de reprendre un tableau secouru ;</li><li>une <b>source d'eau ultime</b> pour alimenter les GV et les piscines quand tout le reste est perdu ;</li><li>la <b>FARN</b>, force d'action rapide nucléaire d'EDF : des équipes et du matériel mobile, pompes et groupes électrogènes, capables d'intervenir sur un site accidenté en moins de 24 heures ;</li><li>des <b>centres de crise locaux</b> renforcés, pour diriger une crise qui dure des jours.</li></ul><p>Ces mesures se sont déployées sur une dizaine d'années : moyens mobiles et FARN d'abord, DUS ensuite, puis le reste du noyau dur au fil des réexamens périodiques.</p>`+INSIM(`le DUS reprend le premier tableau secouru hors tension en deux minutes environ. La FARN, les moyens mobiles et la source d'eau ultime ne sont pas simulés.`)}
});
/* --- animations du thème Électricité : un unifilaire commun, en coordonnées 760 × 330 --- */
const elFonts=()=>{ const cs=getComputedStyle(document.body); return {F:cs.getPropertyValue('--f-disp'),N:cs.getPropertyValue('--f-num')}; };
function elWire(g,pts,on,t,col){
  g.lineWidth=on?3:1.5; g.strokeStyle=on?col:COL.line; g.setLineDash(on?[]:[5,5]); g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.stroke(); g.setLineDash([]);
  if(!on) return; const seg=[]; let L=0; for(let i=1;i<pts.length;i++){ const d=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]); seg.push(d); L+=d; }
  g.fillStyle=col; for(let s=(t*45)%24;s<L;s+=24){ let r=s,i=0; while(i<seg.length-1&&r>seg[i]){ r-=seg[i]; i++; } const f=seg[i]?r/seg[i]:0, a=pts[i], b=pts[i+1]; g.beginPath(); g.arc(a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,3,0,7); g.fill(); }
}
function elBox(g,x,y,w,h,txt,on,col,F,fs,sub){
  g.fillStyle=on?col:COL.line; g.globalAlpha=on?0.18:0.08; g.fillRect(x,y,w,h); g.globalAlpha=1; g.strokeStyle=on?col:COL.line; g.lineWidth=on?2:1; g.strokeRect(x,y,w,h);
  g.textAlign='center'; g.fillStyle=on?COL.fg:COL.mute; g.font='600 '+fs+'px '+F; g.fillText(txt,x+w/2,y+h/2+(sub?-fs*0.15:fs*0.36));
  if(sub){ g.font='500 '+(fs*0.82)+'px '+F; g.fillStyle=COL.mute; g.fillText(sub,x+w/2,y+h/2+fs*1.05); } g.textAlign='left';
}
function elBrk(g,x,y,closed){ g.lineWidth=1.5; g.strokeStyle=COL.fg; g.fillStyle=closed?COL.fg:COL.bg; g.fillRect(x-7,y-7,14,14); g.strokeRect(x-7,y-7,14,14); }
function elHalo(g,x,y,w,h,t){ g.strokeStyle=COL.warn; g.globalAlpha=0.45+0.4*Math.sin(t*5); g.lineWidth=3; g.strokeRect(x-6,y-6,w+12,h+12); g.globalAlpha=1; }
/* état : r400, l400 (production exportée), alt, r225, src {LG,LHA,LHB} ∈ ts|ta|dg|null, dg {A,B} ∈ pret|dem|run, ld (charges allumées, facultatif), cd (décompte diesel), hl (cadres à faire clignoter) */
function elNet(g,w,h,t,st,cap){
  const {F}=elFonts(), nar=w<520, H=h-62, k=Math.min(w/760,H/330), fs=Math.max(15,(nar?11.5:13)/k), ox=(w-760*k)/2;
  g.save(); g.translate(ox,4); g.scale(k,k);
  const E=COL.accent, D=COL.warn, s=st.src, ts=st.alt&&st.ts!==false;
  elWire(g,[[300,36],[190,36]],st.l400,t,E); elBrk(g,245,36,st.l400);
  elWire(g,[[380,56],[380,100]],ts,t,E); elWire(g,[[655,56],[655,100]],st.r225,t,E);
  const tsB=[[90,'LG'],[340,'LHA'],[600,'LHB']], taB=[[150,'LG'],[440,'LHA'],[700,'LHB']];
  for(const [x,v] of tsB){ elWire(g,[[380,136],[380,156],[x,156],[x,196]],s[v]==='ts',t,E); elBrk(g,x,180,s[v]==='ts'); }
  for(const [x,v] of taB){ elWire(g,[[655,136],[655,170],[x,170],[x,196]],s[v]==='ta',t,E); elBrk(g,x,186,s[v]==='ta'); }
  for(const [k2,x,v] of [['A',435,'LHA'],['B',685,'LHB']]){ const on=s[v]==='dg'; elWire(g,[[x,290],[x,206]],on,t,D); elBrk(g,x,258,on); }
  elBox(g,20,16,170,40,'Réseau 400 kV',st.r400,E,F,fs); elBox(g,300,16,160,40,'Alternateur',st.alt,E,F,fs); elBox(g,570,16,170,40,'Réseau 225 kV',st.r225,E,F,fs);
  elBox(g,300,100,160,36,'TS',ts,E,F,fs); elBox(g,575,100,160,36,'TA',st.r225,E,F,fs);
  const bars=[['LG',20,220,'Normaux'],['LHA',290,200,'Secouru LHA'],['LHB',540,200,'Secouru LHB']], LD={LG:['GMPP','TPA','Condenseur'],LHA:['IS','ASG','Charge RCV','Chauff.'],LHB:['IS','ASG','Charge RCV','Chauff.']};
  for(const [v,x,bw,nm] of bars){ const on=!!s[v]; g.fillStyle=on?(s[v]==='dg'?D:E):COL.line; g.fillRect(x,196,bw,10);
    g.fillStyle=on?COL.fg:COL.crit; g.font='600 '+fs+'px '+F; g.fillText(nm+(on||nar?'':' · hors tension'),x,206+fs*1.4);
    if(v==='LG'&&!nar){ LD.LG.forEach((n,i)=>{ const lo=on&&(!st.ld||st.ld.LG[i]); g.fillStyle=lo?COL.fg:COL.mute; g.font='500 '+(fs*0.82)+'px '+F; g.fillText((lo?'● ':'○ ')+n,x,206+fs*2.5+i*fs*0.98); }); } }
  for(const [k2,x] of [['A',290],['B',540]]){ const v='LH'+k2, d=st.dg[k2];
    if(!nar) LD[v].forEach((n,i)=>{ const lo=!!s[v]&&(!st.ld||st.ld[v][i]); g.fillStyle=lo?COL.fg:COL.mute; g.font='500 '+(fs*0.82)+'px '+F; g.fillText((lo?'● ':'○ ')+n,x,206+fs*2.5+i*fs*0.98); });
    elBox(g,x+90,290,110,38,'Diesel '+k2,d==='run',D,F,fs*0.85,nar?(d==='dem'&&st.cd!=null?Math.ceil(st.cd)+' s':''):d==='dem'?'démarrage '+(st.cd!=null?Math.ceil(st.cd)+' s':''):d==='run'?'6,6 kV · 50 Hz':'prêt'); }
  if(st.hl) for(const r of st.hl) elHalo(g,r[0],r[1],r[2],r[3],t);
  g.restore();
  if(cap){ g.fillStyle=COL.fg; g.font='600 '+(nar?13:15)+'px '+F; g.textAlign='left'; wrapTxt(g,cap,Math.max(10,ox),Math.min(h-38,4+334*k+26),Math.min(w-20,760*k),18); }
}
const EL_ALL=(x,LG,LHA,LHB)=>({LG:x!=null?x:LG,LHA:x!=null?x:LHA,LHB:x!=null?x:LHB});
Object.assign(ANIM,{
 elsrc(g,w,h,t){
  const u=t%13, ph=u<4.3?0:u<8.6?1:2;
  const hl=[[[20,16,170,40],[300,16,160,40]],[[300,100,160,36],[20,196,720,10]],[[575,100,160,36],[380,290,360,38]]][ph];
  elNet(g,w,h,t,{r400:true,l400:true,alt:true,r225:true,src:EL_ALL('ts'),dg:{A:'pret',B:'pret'},hl},
   ["L'alternateur envoie sa production, environ 900 MW, vers le réseau 400 kV.","Une petite partie revient vers la tranche par le transformateur de soutirage (TS) : les tableaux 6,6 kV alimentent les auxiliaires.","Le réseau 225 kV reste sous tension derrière le TA, prêt à reprendre les tableaux. Les diesels attendent un manque de tension."][ph]);
 },
 elilot(g,w,h,t){
  const u=t%19; let st, cap;
  if(u<4.5){ st={r400:true,l400:true,alt:true,r225:true,src:EL_ALL('ts')}; cap="Marche normale : la production part sur le 400 kV, les auxiliaires sont sur le TS."; }
  else if(u<10){ st={r400:false,l400:false,alt:true,r225:true,src:EL_ALL('ts'),hl:[[20,16,170,40]]}; cap="Le réseau 400 kV disparaît : le disjoncteur de ligne s'ouvre, la turbine se cale sur les auxiliaires. C'est l'îlotage : les tableaux restent sur le TS."; }
  else if(u<11.2){ st={r400:false,l400:false,alt:false,r225:true,src:EL_ALL(null),hl:[[300,16,160,40]]}; cap="L'îlotage échoue : la turbine déclenche, l'alternateur s'arrête, le TS ne reçoit plus rien…"; }
  else { st={r400:false,l400:false,alt:false,r225:true,src:EL_ALL('ta'),hl:[[575,100,160,36]]}; cap="… et les tableaux basculent sur le TA, alimenté par le réseau 225 kV. Le réacteur, lui, s'est arrêté."; }
  st.dg={A:'pret',B:'pret'}; elNet(g,w,h,t,st,cap);
 },
 eldg(g,w,h,t){
  const u=t%22, base={r400:false,l400:false,alt:false,r225:false};
  if(u<2.5) return elNet(g,w,h,t,Object.assign(base,{src:EL_ALL(null),dg:{A:'pret',B:'pret'}}),"Plus de 400 kV, plus de 225 kV : c'est le manque de tension externe. Les tableaux s'éteignent, les pompes primaires s'arrêtent.");
  if(u<12.5) return elNet(g,w,h,t,Object.assign(base,{src:EL_ALL(null),dg:{A:'dem',B:'dem'},cd:12.5-u,hl:[[380,290,110,38],[630,290,110,38]]}),"Chaque tableau secouru lance son diesel : une dizaine de secondes pour atteindre 6,6 kV et 50 Hz.");
  const v=u-12.5, sq=[v>0.8,v>2.4,v>4,v>5.6];
  elNet(g,w,h,t,Object.assign(base,{src:{LG:null,LHA:'dg',LHB:'dg'},dg:{A:'run',B:'run'},ld:{LG:[0,0,0],LHA:sq,LHB:sq}}),"Disjoncteurs fermés : les charges reprennent par paliers, IS, ASG, charge RCV, puis chaufferettes, pour ne pas faire caler le diesel. Les tableaux normaux restent éteints.");
 },
 elcn(g,w,h,t){
  const {F,N}=elFonts(), u=t%17, nar=w<520;
  const I=u<6?u:u<8?6+(u-6)-0.94*(u-6)*(u-6)/4:7.06+0.06*(u-8), sp=u<6?1:u<8?1-0.47*(u-6):0.06, pump=u<6;
  const X=f=>w*f, Y=f=>h*f*0.86, P=[[X(.2),Y(.86)],[X(.2),Y(.36)],[X(.64),Y(.36)],[X(.64),Y(.1)],[X(.72),Y(.1)],[X(.72),Y(.5)],[X(.72),Y(.86)],[X(.2),Y(.86)]];
  g.fillStyle=COL.hot; g.globalAlpha=.12; g.fillRect(X(.13),Y(.5),X(.14),Y(.32)); g.globalAlpha=1; g.strokeStyle=COL.line; g.lineWidth=1.5; g.strokeRect(X(.13),Y(.5),X(.14),Y(.32));
  g.strokeRect(X(.6),Y(.05),X(.16),Y(.5)); g.fillStyle=COL.mute; g.font='600 '+(nar?11:13)+'px '+F; g.textAlign='center'; g.fillText('cœur',X(.2),Y(.82)+18); g.fillText('générateur de vapeur',X(.68),Y(.05)-6);
  g.lineWidth=10; g.strokeStyle=COL.line; g.globalAlpha=.35; g.beginPath(); P.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.stroke(); g.globalAlpha=1;
  const seg=[]; let L=0; for(let i=1;i<P.length;i++){ const d=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]); seg.push(d); L+=d; }
  const NP=44; for(let j=0;j<NP;j++){ let s=((j/NP+I*0.09)%1)*L, i=0; while(i<seg.length-1&&s>seg[i]){ s-=seg[i]; i++; } const f=s/seg[i], a=P[i], b=P[i+1];
    const hot=i===0?f:i<=2?1:i===3||i===4?1-((i-3)+f)/2*0.6:0; g.fillStyle=hot>0.5?COL.hot:COL.cold; g.globalAlpha=0.55+0.45*Math.abs(hot-0.5)*2; g.beginPath(); g.arc(a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,3.4,0,7); g.fill(); }
  g.globalAlpha=1; const px=X(.72), py=Y(.72); g.fillStyle=COL.bg; g.strokeStyle=pump?COL.ok:COL.crit; g.lineWidth=2; g.beginPath(); g.arc(px,py,13,0,7); g.fill(); g.stroke();
  if(!pump){ g.beginPath(); g.moveTo(px-9,py-9); g.lineTo(px+9,py+9); g.moveTo(px+9,py-9); g.lineTo(px-9,py+9); g.stroke(); }
  g.fillStyle=COL.fg; g.textAlign='left'; g.font='600 '+(nar?11:13)+'px '+F; g.fillText('GMPP',px+18,py+4);
  g.strokeStyle=COL.mute; g.lineWidth=1; g.setLineDash([3,3]); g.beginPath(); g.moveTo(X(.8),Y(.66)); g.lineTo(X(.8),Y(.3)); g.stroke(); g.setLineDash([]);
  g.fillStyle=COL.mute; g.font='500 '+(nar?10:12)+'px '+F; g.fillText('GV plus haut',X(.81),Y(.46)); g.fillText('que le cœur',X(.81),Y(.46)+14);
  g.font='700 '+(nar?14:17)+'px '+N; g.fillStyle=pump?COL.fg:COL.warn; g.fillText('débit '+Math.round(sp*100)+' %',X(.3),Y(.3)-4);
  g.font='600 '+(nar?13:14.5)+'px '+F; g.fillStyle=COL.fg; wrapTxt(g,pump?"Pompes primaires en marche : l'eau fait le tour du circuit en une dizaine de secondes.":u<8?"Les pompes s'arrêtent : le débit s'effondre…":"… mais l'eau chaude monte, l'eau refroidie dans les GV redescend : la circulation naturelle évacue la puissance résiduelle avec quelques % du débit.",w*0.04,h-34,w*0.92,17);
 },
 elbat(g,w,h,t){
  const {F,N}=elFonts(), u=t%16, nar=w<520, dus=u>12.5, bat=dus?Math.min(1,0.25+(u-12.5)*0.2):1-0.75*u/12.5, X=f=>w*f, Y=f=>h*f*0.84;
  g.strokeStyle=COL.line; g.lineWidth=1.5; g.strokeRect(X(.04),Y(.12),X(.14),Y(.62)); g.fillStyle=COL.feed; g.globalAlpha=.15; g.fillRect(X(.04),Y(.42),X(.14),Y(.32)); g.globalAlpha=1; g.fillStyle=COL.mute; g.font='600 '+(nar?11:13)+'px '+F; g.textAlign='center'; g.fillText('GV',X(.11),Y(.12)-6);
  const tx=X(.34), ty=Y(.22), pmx=X(.34), pmy=Y(.66);
  elWire(g,[[X(.18),Y(.2)],[tx-16,ty]],true,t,COL.steam); elWire(g,[[tx+16,ty],[X(.46),ty],[X(.46),Y(.04)]],true,t,COL.steam);
  elWire(g,[[pmx-16,pmy],[X(.18),pmy]],true,t,COL.feed);
  g.strokeStyle=COL.fg; g.lineWidth=3; g.beginPath(); g.moveTo(tx,ty+16); g.lineTo(pmx,pmy-16); g.stroke();
  for(const [x,y,c,l] of [[tx,ty,COL.steam,'turbine'],[pmx,pmy,COL.feed,'pompe']]){ g.fillStyle=COL.bg; g.strokeStyle=c; g.lineWidth=2.5; g.beginPath(); g.arc(x,y,16,0,7); g.fill(); g.stroke();
   const a=t*6; g.beginPath(); g.moveTo(x+Math.cos(a)*11,y+Math.sin(a)*11); g.lineTo(x-Math.cos(a)*11,y-Math.sin(a)*11); g.stroke(); g.fillStyle=COL.mute; g.font='500 '+(nar?10:12)+'px '+F; g.textAlign='left'; g.fillText(l,x+22,y+(l==='turbine'?-14:4)); }
  g.fillStyle=COL.mute; g.font='500 '+(nar?10:12)+'px '+F; g.fillText('vapeur → atmosphère',X(.47),Y(.08)); g.textAlign='center'; g.fillText('turbopompe ASG : aucun courant',X(.3),Y(.92));
  const bx=X(.62), by=Y(.2), bw=X(.3), bh=Y(.2); g.textAlign='left'; g.fillStyle=COL.fg; g.font='600 '+(nar?11:13)+'px '+F; g.fillText('Batteries 125 V · contrôle-commande',bx,by-10);
  g.strokeStyle=COL.line; g.lineWidth=1.5; g.strokeRect(bx,by,bw,bh); g.fillStyle=bat<0.35?COL.warn:COL.ok; g.fillRect(bx+3,by+3,(bw-6)*bat,bh-6);
  g.font='700 '+(nar?14:17)+'px '+N; g.fillStyle=COL.fg; g.fillText(Math.round(bat*100)+' %',bx,by+bh+24);
  g.font='500 '+(nar?11:13)+'px '+F; g.fillStyle=COL.mute; g.fillText(dus?'DUS en service : recharge':'décharge · t = '+Math.round(u/12.5*45)+' min',bx,by+bh+44);
  elBox(g,bx,Y(.72),bw,Y(.16),'DUS',dus,COL.warn,F,nar?11:13,dus?'reprend LHA':u>9?'démarrage…':'à l\'arrêt');
  g.font='600 '+(nar?13:14.5)+'px '+F; g.fillStyle=COL.fg; g.textAlign='left'; wrapTxt(g,dus?"Le DUS reprend un tableau secouru : l'IS et la charge RCV redeviennent disponibles, les batteries se rechargent.":"Plus aucun tableau secouru : la vapeur des GV fait tourner la turbopompe qui les alimente, les batteries tiennent le contrôle-commande.",w*0.04,h-34,w*0.92,17);
 },
 elsecu(g,w,h,t){
  const {F}=elFonts(), u=t%14, ph=u<4.6?0:u<9.3?1:2, nar=w<520, H=h-62, k=Math.min(w/760,H/330), fs=Math.max(13,10.5/k), ox=(w-760*k)/2, E=COL.accent;
  g.save(); g.translate(ox,4); g.scale(k,k);
  const col=[[20,'Normaux LGA–LGD'],[280,'Secouru LHA'],[540,'Secouru LHB']];
  col.forEach(([x,n],i)=>{ elBox(g,x,14,200,44,n,true,i?COL.ok:E,F,fs,'6,6 kV'); elWire(g,[[x+100,58],[x+100,140]],ph>=1,t,i?COL.ok:E); elBox(g,x,140,200,40,'380 V',ph>=1,i?COL.ok:E,F,fs,i?'pompes, vannes de sûreté':'moteurs, vannes');
   if(i){ elWire(g,[[x+100,180],[x+100,236]],ph>=2,t,COL.warn); elBox(g,x,236,95,58,'125 V · 48 V',ph>=2,COL.warn,F,fs*0.85,'batteries'); elBox(g,x+105,236,95,58,'220 V',ph>=2,COL.warn,F,fs*0.85,'onduleurs'); } });
  g.fillStyle=COL.mute; g.font='500 '+(fs*0.9)+'px '+F; g.fillText('contrôle-commande, protections, mesures',20,262); g.fillText('(chaque voie a les siens)',20,262+fs*1.2);
  g.strokeStyle=COL.crit; g.lineWidth=2; g.setLineDash([8,6]); g.beginPath(); g.moveTo(10,104); g.lineTo(750,104); g.stroke(); g.setLineDash([]);
  g.fillStyle=COL.crit; g.font='700 '+(fs*0.9)+'px '+F; g.fillText('le simulateur s\'arrête ici',134,96);
  if(ph===0) for(const [x] of col) elHalo(g,x,14,200,44,t);
  g.restore();
  g.fillStyle=COL.fg; g.font='600 '+(nar?13:14.5)+'px '+F; wrapTxt(g,["Trois familles de tableaux 6,6 kV : les normaux pour produire, deux voies secourues, A et B, pour la sûreté. C'est là que s'arrête le simulateur.","En dessous, des transformateurs abaissent la tension en 380 V pour les moteurs plus petits et les vannes motorisées.","Le contrôle-commande vit sur batteries, en continu, et sur onduleurs, en alternatif : il ne voit jamais de coupure."][ph],Math.max(10,ox),Math.min(h-38,4+334*k+26),Math.min(w-20,760*k),18);
 },
 fuku(g,w,h,t){
  const {F,N}=elFonts(), nar=w<520, T=22, u=t%T, x0=w*0.05, x1=w*0.95, X=f=>x0+(x1-x0)*f, cur=Math.min(1,u/(T-3));
  const EV=[[0,'11 mars, 14 h 46','Séisme : arrêt automatique, lignes détruites, les diesels démarrent'],[0.16,'≈ 15 h 35','Tsunami : diesels, tableaux et batteries noyés'],[0.46,'12 mars','Explosion d\'hydrogène, réacteur 1'],[0.72,'14 mars','Explosion, réacteur 3'],[0.86,'15 mars','Explosion, réacteur 4 ; rejets importants']];
  const R=[['Réseau électrique',0.005],['Diesels de secours',0.16],['Batteries (réacteurs 1 et 2)',0.165],['Refroidissement par la vapeur (réacteurs 2 et 3)',0.62]];
  const y0=h*0.07, dy=Math.min(46,h*0.11), fz=nar?11.5:14;
  R.forEach(([n,end],i)=>{ const y=y0+i*dy, xe=X(Math.min(cur,end)); g.strokeStyle=COL.ok; g.lineWidth=6; g.beginPath(); g.moveTo(x0,y+12); g.lineTo(xe,y+12); g.stroke();
   if(cur>end){ g.strokeStyle=COL.crit; g.lineWidth=2; g.setLineDash([4,4]); g.beginPath(); g.moveTo(X(end),y+12); g.lineTo(X(cur),y+12); g.stroke(); g.setLineDash([]); }
   g.fillStyle=cur>end?COL.crit:COL.fg; g.font='600 '+fz+'px '+F; g.textAlign='left'; g.fillText(n+(cur>end?' : perdu':''),x0,y+2); });
  const yl=y0+R.length*dy+18; g.strokeStyle=COL.line; g.lineWidth=2; g.beginPath(); g.moveTo(x0,yl); g.lineTo(x1,yl); g.stroke();
  g.fillStyle=COL.accent; g.beginPath(); g.arc(X(cur),yl,6,0,7); g.fill();
  let ly=yl+26; const lw=nar?100:150; EV.forEach(([f,d,txt],i)=>{ if(cur<f) return; g.fillStyle=i===0?COL.warn:COL.crit; g.beginPath(); g.arc(X(f),yl,4,0,7); g.fill();
   g.font='700 '+fz+'px '+N; g.fillStyle=COL.fg; g.textAlign='left'; g.fillText(d,x0,ly); g.font='500 '+fz+'px '+F; g.fillStyle=COL.mute; ly=wrapTxt(g,txt,nar?x0:x0+lw,nar?ly+fz+3:ly,nar?x1-x0:x1-x0-lw,fz+4)+(nar?6:4); });
  if(u<1.2){ g.fillStyle=COL.mute; g.font='500 12px '+F; g.textAlign='right'; g.fillText('échelle de temps non linéaire',x1,h-10); g.textAlign='left'; }
 }
});
INSET.fukufr=()=>ptab([['prot','Électricité',[['Plus aucun diesel','DUS','un par réacteur, protégé du séisme et de l\'inondation extrêmes'],['Plus de courant pendant des jours','FARN','groupes électrogènes mobiles, sur site en moins de 24 h']]],
 ['turb','Eau',[['Plus de source froide','Source d\'eau ultime','pour alimenter les GV et les piscines'],['Pompes détruites','FARN','pompes mobiles, raccordements préparés à l\'avance']]],
 ['pzr','Organisation',[['Plusieurs réacteurs à la fois','Évaluations complémentaires','scénarios étudiés pour tout un site'],['Une crise qui dure des jours','Centre de crise local','bâtiment résistant, équipes relayées']]],
 ['react','Démarche',[['Agression au-delà de la conception','Noyau dur','matériels et organisations protégés contre l\'extrême']]]]);
const THEMES=[
 ['centrale','La centrale',["Une centrale, c'est d'abord une bouilloire"]],
 ['physique','Physique du cœur',['La fission','La réaction en chaîne','pcm','Les neutrons retardés','Le combustible',"Le modérateur : l'eau",'Le réacteur se stabilise tout seul','xeanim','Le xénon']],
 ['circuits','Circuits',['Le circuit primaire','Le pressuriseur','La chaussette : le domaine pression-température','Les générateurs de vapeur','Turbine et alternateur','Le condenseur et la source froide']],
 ['pilotage','Pilotage',['Agir sur la réaction : grappes et bore','groupes','Le pilotage en mode G','rband','dianim','params']],
 ['electricite','Électricité',['elsrc','elsecu','elilot','eldg','elcn','elbat']],
 ['surete','Sûreté',['Trois barrières et des protections',"Après l'arrêt : la puissance résiduelle",'fuku','fukufr']],
 ['manoeuvres','Manœuvres',['etats','comptage','diverg','couplage','montee','leviers','freq','suivi','repli','imprevu','regles']],
 ['conduite','Conduite',['method','La salle de commande']],
];
(()=>{ const byT=Object.fromEntries(TOUR.map(c=>[c.t,c])); const out=[];
  for(const [id,name,list] of THEMES) for(const key of list){ const c=byT[key]||NEWCH[key]; if(!c) continue; c.th=id; c.k=name; out.push(c); }
  for(const c of TOUR) if(!out.includes(c)){ c.th='centrale'; out.push(c); }
  TOUR.length=0; out.forEach(c=>TOUR.push(c)); })();
const xeCh=TOUR.find(c=>c.t==='Le xénon'); if(xeCh) xeCh.t='Le xénon : les conséquences';

/* --- insets complémentaires --- */
INSET.rband=()=>{ const pts=[]; for(let p=0;p<=225;p+=3){ const u=p/225; pts.push([p,1100*(1-Math.cos(2*Math.PI*u))/225]); }
  return svgChart({x0:0,x1:225,y0:0,y1:10.5,bands:[[150,215,'ok']],xt:[[0,'0'],[50,'50'],[100,'100'],[150,'150'],[180,'180'],[215,'215'],[225,'225 pas']],yt:[[0,'0'],[2,'2'],[4,'4'],[6,'6'],[8,'8'],[10,'10']],xlab:'position du groupe R (pas extraits)',ylab:'efficacité d\'un pas (pcm)',
   series:[{pts,c:'accent'}],notes:[[182,9.6,'bande de manœuvre','middle'],[180,1.2,'180 pas : pleine puissance','middle'],[112,9.9,'maximum à mi-hauteur','middle']]}); };
INSET.params=()=>{ const F=[['react','Cœur',[['Puissance nucléaire','≈ la charge turbine','Le réacteur suit-il la demande ?'],['Réactivité · Td','≈ 0 pcm · Td ∞','Évolution de la puissance ; Td > 60 s en démarrage'],['Groupe R','150 à 215 pas','Réserve de régulation dans les deux sens'],['ΔI','référence ± 5 %','Forme axiale de la puissance'],['Bore','lent, cohérent avec R','Compense xénon et usure']]],
  ['pzr','Primaire',[['Tmoy − Tref','± 1,5 °C','La température suit le programme'],['Pression','155 bar (152 à 157,5)','Eau liquide, loin des seuils 131 et 165'],['Niveau pressuriseur','référence ± 5 %','Inventaire en eau, fuites']]],
  ['turb','Secondaire',[['Niveau GV','50 % (40 à 60)','Évacuation de la chaleur'],['Débits eau / vapeur','égaux','Équilibre du GV'],['Pression GV','57,5 bar à 100 %, 70 à vide','Programme de température']]],
  ['prot','Sûreté',[['Marge ΔT','> 5 %','Distance à l\'arrêt automatique'],['Marge à la saturation','> 15 °C','L\'eau du cœur ne bout pas'],['Marge d\'arrêt (à l\'arrêt)','> 3 000 pcm','Le réacteur reste arrêté']]]];
  return '<div class="ptab">'+F.map(f=>'<div class="pfam" style="--pc:var(--c-'+f[0]+')"><div class="pfh">'+f[1]+'</div>'+f[2].map(r=>'<div class="prow"><b>'+r[0]+'</b><span class="pv">'+r[1]+'</span><span class="pw">'+r[2]+'</span></div>').join('')+'</div>').join('')+'</div>'; };
INSET.method=()=>{ const N=[['Surveiller',280,40],['Anticiper',470,150],['Agir',280,260],['Vérifier',90,150]];
  return '<svg class="chartx fb" viewBox="0 0 560 300"><path class="arw c" d="M350 62 Q440 80 455 120"/><path class="arw c" d="M455 182 Q440 230 360 250"/><path class="arw c" d="M200 250 Q120 230 105 182"/><path class="arw c" d="M105 120 Q120 80 210 62"/>'+
   N.map((n,i)=>'<g class="fbn" style="animation-delay:'+(i*1.1)+'s"><rect x="'+(n[1]-80)+'" y="'+(n[2]-24)+'" width="160" height="48" rx="10"/><text x="'+n[1]+'" y="'+(n[2]+5)+'" text-anchor="middle">'+n[0]+'</text></g>').join('')+'<text class="nt" x="280" y="155" text-anchor="middle">une action à la fois</text></svg>'; };
let SUIVI_CACHE=null;
function suiviData(){
  if(SUIVI_CACHE) return SUIVI_CACHE;
  const s=makeState({P:1,xe:1,R:180,G:225,coupled:true,modeR:'auto',modeG:'auto'}); s.ramp=5;
  const out=[]; const H=9*3600;
  for(let i=0;i*DT<H;i++){
    const t=i*DT; if(t>=1800&&t<1801) s.LtSet=0.5; if(t>=5.5*3600&&t<5.5*3600+1) s.LtSet=1;
    if(!s.rea.run){ if(s.rods.R.p>198||s.Tavg-s.Tref<-0.8) s.rea={mode:'dil',q:30,vt:0.5,v:0,run:true}; else if(s.rods.R.p<165||s.Tavg-s.Tref>0.8) s.rea={mode:'bor',q:10,vt:0.1,v:0,run:true}; }
    step(s); if(i%1200===0) out.push({h:t/3600,lt:s.Lt*100,xe:s.rho.xe,cb:s.Cb,r:s.rods.R.p,dt:s.Tavg-s.Tref});
  }
  return SUIVI_CACHE=out;
}
INSET.suivi=()=>{ if(!SUIVI_CACHE){ const at=TV.i; setTimeout(()=>{ suiviData(); if(TV.i===at&&!$('#tour').hidden) $('#tinset').innerHTML=INSET.suivi(); },60); return '<p class="note">Calcul du suivi de charge par le simulateur…</p>'; } const d=suiviData(), xt=[[0,'0'],[2,'2 h'],[4,'4 h'],[6,'6 h'],[8,'8 h']];
  const mk=(series,y0,y1,yt,yl,last)=>svgChart({w:520,h:last?150:122,x0:0,x1:9,y0,y1,xt:last?xt:[],yt,xlab:last?'temps (heures)':'',ylab:yl,series});
  const cbMin=Math.floor(Math.min(...d.map(p=>p.cb))/10)*10, cbMax=Math.ceil(Math.max(...d.map(p=>p.cb))/10)*10;
  return '<div class="mcharts">'+mk([{pts:d.map(p=>[p.h,p.lt]),c:'accent',lab:'charge (%)',lp:[8.8,100],dy:14}],0,110,[[50,'50'],[100,'100']],'%')+
   mk([{pts:d.map(p=>[p.h,p.xe]),c:'bore',lab:'xénon (pcm)',lp:[8.8,d[d.length-1].xe],dy:-6}],-3400,-2400,[[-3300,'−3300'],[-2800,'−2800']],'pcm')+
   mk([{pts:d.map(p=>[p.h,p.cb]),c:'feed',lab:'bore (ppm)',lp:[8.8,d[d.length-1].cb],dy:-6}],cbMin-5,cbMax+5,[[cbMin,String(cbMin)],[cbMax,String(cbMax)]],'ppm')+
   mk([{pts:d.map(p=>[p.h,p.r]),c:'warn',lab:'groupe R (pas)',lp:[8.8,d[d.length-1].r],dy:-6}],130,230,[[150,'150'],[215,'215']],'pas',true)+'</div>'; };

/* --- Insets du thème « Manœuvres » --- */
INSET.etats=()=>{ const S=[['APR','cuve ouverte',0],['API','froid',0],['AN/RRA','< 180 °C',0],['AN/GV','286 °C',1],['RP','0 à 100 %',1]];
  let s='<svg class="chartx" viewBox="0 0 560 300">';
  S.forEach((x,i)=>{ const X=14+i*108, Y=222-i*46; s+='<rect class="stb'+(x[2]?' sim':'')+'" x="'+X+'" y="'+Y+'" width="100" height="54" rx="8"/><text class="nt" x="'+(X+50)+'" y="'+(Y+24)+'" text-anchor="middle">'+x[0]+'</text><text class="ax" x="'+(X+50)+'" y="'+(Y+42)+'" text-anchor="middle">'+x[1]+'</text>';
    if(i<S.length-1) s+='<path class="arw" d="M'+(X+100)+' '+(Y+20)+' Q'+(X+108)+' '+(Y+8)+' '+(X+112)+' '+(Y-6)+'"/>'; });
  return s+'<text class="ax lb" x="16" y="40">température, pression et puissance ↑</text><rect class="stb sim" x="300" y="268" width="18" height="12" rx="3"/><text class="ax" x="324" y="278">états simulés</text></svg>'; };
INSET.invm=()=>{ const curve=[[0,1],[40,.9],[80,.72],[100,.57],[120,.4],[140,.2],[150,.12],[160,.05],[166,0]];
  return svgChart({x0:0,x1:200,y0:0,y1:1.05,xt:[[0,'0'],[50,'50'],[100,'100'],[150,'150'],[200,'200']],yt:[[0,'0'],[.25,'0,25'],[.5,'0,5'],[.75,'0,75'],[1,'1']],xlab:'position du groupe R (pas extraits)',ylab:'1/M',
   series:[{pts:[[100,.57],[162,0]],c:'warn',dash:1,lab:'1re prédiction ≈ 162',lp:[162,0],ta:'start',dx:4,dy:-24},{pts:[[140,.2],[167,0]],c:'ok',dash:1,lab:'2e ≈ 167',lp:[167,0],ta:'start',dx:6,dy:-6},{pts:curve,c:'accent',lab:'mesures',lp:[60,.82],ta:'start',dx:8,dy:-8}],
   notes:[[100,.57,'●','middle'],[140,.2,'●','middle'],[160,.05,'●','middle'],[172,.32,'criticité','start']]}); };
INSET.leviers=()=>ptab([['turb','Ce que vous commandez',[['Consigne de charge','quelques %/min','Fixe la puissance produite ; le réacteur suit en mode G'],['Bore : dilution, borication','minutes à heures','Garde R dans sa bande, compense le xénon et l\'usure du combustible'],['Arrêt du réacteur (AAR)','< 2 s','Toujours disponible']]],
  ['rods','Ce que font les automatismes',[['GCP','secondes','Se placent selon la charge, d\'après leur courbe de calibrage'],['Groupe R','secondes','Tient Tmoy sur Tref à ± 0,8 °C'],['Pressuriseur et ARE','secondes','Tiennent 155 bar et le niveau des GV vers 50 %']]],
  ['react','Ce qui évolue seul',[['Doppler et modérateur','immédiat','Freinent toute hausse de puissance ou de température'],['Xénon','heures','Monte après une baisse, brûle après une hausse : à anticiper'],['Usure du combustible','mois','Réduit la réserve ; compensée par une dilution lente au fil du cycle']]],
  ['prot','Ce qui vous surveille',[['Protections','instantané','Déclenchent l\'AAR si une limite est franchie'],['Alarmes','instantané','Signalent un écart avant la protection'],['Bandeau et tendances','en continu','À regarder avant et après chaque action']]]]);
INSET.imprevu=()=>ptab([['prot','Arrêt automatique (AAR)',[['Cause','seuil franchi','Une protection voit une grandeur hors limite, ou l\'opérateur appuie'],['Automatismes','< 2 s','Toutes les grappes tombent, la turbine déclenche, le GCT-c et l\'ASG prennent le relais'],['Opérateur','minutes','Vérifie la chute des grappes, la décroissance de la puissance et l\'évacuation de la chaleur, puis cherche la cause']]],
  ['turb','Déclenchement turbine',[['Cause','défaut','Un défaut de la turbine ou de l\'alternateur l\'arrête'],['Automatismes','secondes','Au-dessus d\'un seuil de puissance (P7 dans le simulateur), l\'AAR suit ; en dessous, le GCT-c absorbe la vapeur et le réacteur reste en service'],['Opérateur','minutes','Stabilise température et niveaux, puis prépare le recouplage']]],
  ['are','Îlotage',[['Cause','perte du réseau','La ligne de départ ou le réseau disparaît'],['Automatismes','secondes','La turbine se cale sur les besoins propres de la centrale, le GCT-c absorbe l\'excès de vapeur, les grappes s\'insèrent'],['Opérateur','heures','Tient la tranche sur ses auxiliaires, surveille le xénon et prépare le recouplage']]],
  ['pzr','Le réflexe commun',[['La chaleur est-elle évacuée ?','d\'abord','Grappes en bas, puissance qui décroît, eau dans les GV, vapeur évacuée'],['Le primaire est-il tenu ?','ensuite','Pression, niveau du pressuriseur, marge à la saturation'],['Pourquoi ?','enfin','Première alarme du journal, tendances']]]]);
INSET.regles=()=>ptab([['mis','Avant d\'agir',[['Savoir où l\'on va','le but','État visé et valeurs attendues à la fin'],['Anticiper le lent','bore · xénon','Position finale de R, évolution du xénon'],['Connaître ses marges','ΔT · saturation · ΔI','Distance aux protections avant de commencer']]],
  ['rods','Pendant',[['Une action à la fois','puis attendre','Laisser à la grandeur le temps de réagir'],['Petites doses','1 à 5 pas · 100 à 500 L','Trois petites corrections valent mieux qu\'une grande'],['Vérifier','après chaque action','La grandeur a-t-elle réagi comme prévu ?']]],
  ['prot','Si ça dérape',[['Stabiliser d\'abord','stop','Arrêter le mouvement en cours, figer la charge'],['Comprendre ensuite','journal','Première alarme, tendances, bilan de réactivité'],['Doute sur la sûreté','AAR','Arrêter le réacteur est toujours une réponse acceptable']]],
  ['synop','Au quotidien',[['Balayer le bandeau','en continu','Cœur, primaire, secondaire, sûreté'],['Tenir R dans sa bande','150 à 215 pas','Sinon il ne peut plus réguler dans les deux sens'],['Garder le ΔI dans son domaine','± 5 % PN','Pour éviter les points chauds et les oscillations xénon']]]]);
function ptab(F){ return '<div class="ptab">'+F.map(f=>'<div class="pfam" style="--pc:var(--c-'+f[0]+')"><div class="pfh">'+f[1]+'</div>'+f[2].map(r=>'<div class="prow"><b>'+r[0]+'</b><span class="pv">'+r[1]+'</span><span class="pw">'+r[2]+'</span></div>').join('')+'</div>').join('')+'</div>'; }
INSET.freq=()=>{ const prog=h=>h<6?50:h<7?50+50*(h-6):h<22?97:h<23?97-47*(h-22):50, pr=[], re=[];
  for(let h=0;h<=24.001;h+=0.05){ pr.push([h,prog(h)]); const r=h>=7&&h<22?2.2*Math.sin(h*7.3)+1.1*Math.sin(h*23.1+1)+0.6*Math.sin(h*61):0.8*Math.sin(h*9.7); re.push([h,Math.min(100,prog(h)+r)]); }
  return svgChart({x0:0,x1:24,y0:0,y1:110,xt:[[0,'0 h'],[6,'6 h'],[12,'12 h'],[18,'18 h'],[24,'24 h']],yt:[[0,'0'],[50,'50'],[100,'100 %']],xlab:'heure de la journée',ylab:'puissance (%)',
   series:[{pts:re,c:'accent',lab:'puissance réelle',lp:[14,100],dy:-8,ta:'middle'},{pts:pr,c:'mute',dash:1,lab:'programme',lp:[3,50],dy:-8,ta:'middle'}],
   notes:[[0.6,30,'palier de nuit','start'],[12,80,'réglage de fréquence : ± quelques %','middle']]}); };
let MONTEE_CACHE=null, REPLI_CACHE=null;
function monteeData(){
  if(MONTEE_CACHE) return MONTEE_CACHE;
  const s=makeState({P:.12,xe:.12,R:175,G:'cal',coupled:false,modeR:'man',modeG:'man'}), pts=[], ev=[]; let ph=0,k=0,last=-1e9;
  const E=(t,ti,w)=>ev.push({m:t/60,t:ti,w});
  for(let i=0;i*DT<45*60;i++){ const t=i*DT;
    if(ph===0&&t>=60){ s.coupled=true; s.turbTripped=false; s.Lt=.05; s.LtSet=.05; E(t,'Couplage',"L'alternateur est raccordé au réseau et prend 5 % de charge ; la vapeur passe peu à peu du contournement à la turbine."); ph=1; }
    else if(ph===1&&t>=90){ s.ramp=3; s.LtSet=.14; E(t,'Charge alignée vers 14 %',"À 3 %/min, la turbine rejoint la puissance du réacteur, pour que Tmoy reste près de Tref."); ph=2; }
    else if(ph===2&&s.Lt>=0.135){ s.modeG='auto'; s.rea={mode:'bor',q:20,vt:1,v:0,run:true}; E(t,'GCP en auto + bore 1 m³',"Les GCP rejoignent leur courbe de calibrage et apportent environ 200 pcm de trop : la borication les compense. R reste en manuel."); ph=3; }
    else if(ph===3){ if(!s.rea.run&&Math.abs(s.Tavg-s.Tref)<0.6) k+=DT; else k=0; if(k>30){ s.modeR='auto'; E(t,'R en automatique',"Tmoy est revenue sur Tref : la régulation prend la main sans à-coup."); ph=4; } }
    else if(ph===4){ s.LtSet=1; E(t,'Consigne 100 % à 3 %/min',"La turbine monte ; les GCP sortent avec la charge, R affine la température."); ph=5; last=t; }
    if(ph===5&&!s.rea.run&&t-last>30){ last=t; if(s.p10&&!s.lowBlk) s.lowBlk=true;
      if(s.rods.R.p<165){ s.rea={mode:'bor',q:10,vt:0.1,v:0,run:true}; E(t,'Borication de 100 L',"R descend vers sa limite basse : un peu de bore le fait remonter."); }
      else if(s.rods.R.p>205){ s.rea={mode:'dil',q:10,vt:0.1,v:0,run:true}; E(t,'Dilution de 100 L',"R sort trop haut : un peu d'eau pure le fait redescendre."); } }
    if(ph===5&&s.Lt>=0.995){ E(t,'100 % atteint',"Le travail continue : le xénon va s'accumuler pendant une journée et demandera des dilutions régulières."); ph=6; }
    step(s); if(i%Math.round(20/DT)===0) pts.push({m:t/60,lt:s.Lt*100,pn:s.n*100,g:s.rods.G.p,r:s.rods.R.p,cb:s.Cb});
  }
  return MONTEE_CACHE={pts,ev};
}
function repliData(){
  if(REPLI_CACHE) return REPLI_CACHE;
  const s=makeState({P:1,xe:1,R:180,G:225,coupled:true,modeR:'auto',modeG:'auto'}), out=[]; let dec=null;
  for(let i=0;i*DT<60*60;i++){ const t=i*DT;
    if(Math.abs(t-60)<DT/2){ s.ramp=5; s.LtSet=0.05; }
    if(dec==null&&t>60&&s.Lt<=0.051) dec=t;
    if(dec!=null&&Math.abs(t-dec-60)<DT/2){ s.coupled=false; s.modeR='man'; s.modeG='man'; s.rods.G.tg=0; }
    if(dec!=null&&Math.abs(t-dec-240)<DT/2){ s.rods.R.tg=0; s.rea={mode:'bor',q:30,vt:Infinity,v:0,run:true}; }
    if(s.rea.run&&s.rea.mode==='bor'&&-s.rho.tot>=3100) s.rea.run=false;
    step(s); if(i%Math.round(20/DT)===0) out.push({m:t/60,lt:s.Lt*100,pn:s.n*100,g:s.rods.G.p,r:s.rods.R.p,mg:Math.max(0,-s.rho.tot)});
  }
  return REPLI_CACHE=out;
}
const lazyInset=(key,calc,draw,msg)=>()=>{ if(!calc.ready){ const at=TV.i; setTimeout(()=>{ calc(); calc.ready=true; if(TV.i===at&&!$('#tour').hidden) $('#tinset').innerHTML=INSET[key](); },60); return '<p class="note">'+msg+'</p>'; } return draw(calc()); };
INSET.repli=lazyInset('repli',repliData,d=>{ const xt=[[0,'0'],[10,'10'],[20,'20'],[30,'30'],[40,'40'],[50,'50'],[60,'60']];
  const mk=(series,y0,y1,yt,yl,last)=>svgChart({w:520,h:last?150:122,x0:0,x1:60,y0,y1,xt:last?xt:[],yt,xlab:last?'temps (minutes)':'',ylab:yl,series});
  return '<div class="mcharts">'+mk([{pts:d.map(p=>[p.m,p.lt]),c:'accent',lab:'charge turbine',lp:[12,55],ta:'start',dx:6},{pts:d.map(p=>[p.m,p.pn]),c:'hot',lab:'puissance nucléaire',lp:[24,8],ta:'start',dx:6,dy:-4}],0,110,[[0,'0'],[50,'50'],[100,'100 %']],'%')+
   mk([{pts:d.map(p=>[p.m,p.g]),c:'bore',lab:'GCP',lp:[8,d.find(p=>p.m>=8).g],ta:'start',dx:6,dy:22},{pts:d.map(p=>[p.m,p.r]),c:'warn',lab:'groupe R',lp:[6,180],ta:'start',dx:0,dy:-8}],0,235,[[0,'0'],[100,'100'],[225,'225']],'pas')+
   mk([{pts:d.map(p=>[p.m,p.mg]),c:'feed',lab:'marge d\'arrêt (pcm)',lp:[58,d[d.length-1].mg],dy:-6}],0,3800,[[0,'0'],[1500,'1 500'],[3000,'3 000']],'pcm',true)+'</div>'; },'Calcul du repli par le simulateur…');
Object.assign(ANIM,{
 sync(g,w,h,t){
  const F=getComputedStyle(document.body).getPropertyValue('--f-disp'), N=getComputedStyle(document.body).getPropertyValue('--f-num');
  const T=14, u=t%T, Tl=9, A=v=>2*Math.PI*(0.68*v-0.6*v*v/(2*Tl)), ang=u<Tl?A(u)-A(Tl):0, df=u<Tl?0.68-0.6*u/Tl:0;
  const k=Math.min(1,Math.max(0.78,w/640)), r=Math.min(h*0.34,w*0.2), cx=w*0.27, cy=h*0.46;
  g.lineWidth=2; g.strokeStyle=COL.line; g.beginPath(); g.arc(cx,cy,r,0,2*Math.PI); g.stroke();
  g.strokeStyle=COL.ok; g.lineWidth=8; g.beginPath(); g.arc(cx,cy,r-6,-Math.PI/2-0.17,-Math.PI/2+0.17); g.stroke();
  g.strokeStyle=COL.mute; g.lineWidth=1.5; for(let k=0;k<12;k++){ const a=k*Math.PI/6-Math.PI/2; g.beginPath(); g.moveTo(cx+Math.cos(a)*(r-14),cy+Math.sin(a)*(r-14)); g.lineTo(cx+Math.cos(a)*(r-2),cy+Math.sin(a)*(r-2)); g.stroke(); }
  g.fillStyle=COL.mute; g.font='600 12px '+F; g.textAlign='center'; g.fillText('LENT',cx-r*0.62,cy+r*0.9); g.fillText('RAPIDE',cx+r*0.62,cy+r*0.9); g.fillText('SYNCHROSCOPE',cx,cy+r+18);
  const a=ang-Math.PI/2; g.strokeStyle=u<Tl?COL.fg:COL.ok; g.lineWidth=4; g.lineCap='round'; g.beginPath(); g.moveTo(cx,cy); g.lineTo(cx+Math.cos(a)*(r-18),cy+Math.sin(a)*(r-18)); g.stroke(); g.lineCap='butt';
  g.fillStyle=COL.fg; g.beginPath(); g.arc(cx,cy,6,0,2*Math.PI); g.fill();
  const x=w*0.52; let y=h*0.2; g.textAlign='left';
  const row=(kk,v,c)=>{ g.font='600 '+Math.round(13*k)+'px '+F; g.fillStyle=COL.mute; g.fillText(kk,x,y); g.font='600 '+Math.round(17*k)+'px '+N; g.fillStyle=c||COL.fg; g.fillText(v,x+w*0.19,y); y+=h*0.1; };
  row('Réseau','50,00 Hz'); row('Alternateur',(50+df).toFixed(2).replace('.',',')+' Hz',df>0.15?COL.warn:COL.ok); row('Tensions','égales',COL.ok);
  row('Disjoncteur',u<Tl?'ouvert':'fermé',u<Tl?COL.mute:COL.ok);
  const ld=u<Tl?0:Math.min(5,(u-Tl)*2.2); g.font='600 '+Math.round(13*k)+'px '+F; g.fillStyle=COL.mute; g.fillText('Charge',x,y); g.strokeStyle=COL.line; g.lineWidth=1; g.strokeRect(x+w*0.19,y-12,w*0.13,14); g.fillStyle=COL.accent; g.fillRect(x+w*0.19,y-12,w*0.13*ld/20,14); g.font='600 '+Math.round(13*k)+'px '+N; g.fillStyle=COL.fg; g.fillText(ld.toFixed(1).replace('.',',')+' %',x+w*0.34,y);
  g.font='500 '+Math.round(14*k+1)+'px '+F; g.fillStyle=u<Tl?COL.fg:COL.ok; g.textAlign='center'; g.fillText(u<Tl?(df>0.15?'L\'aiguille tourne vite : on rapproche les fréquences…':'Elle ralentit : on attend qu\'elle passe en haut…'):'Couplé ! L\'alternateur prend sa première charge.',w/2,h*0.94);
 }
});
/* --- animations complémentaires --- */
Object.assign(ANIM,{
 pcm(g,w,h,t){
  const F=getComputedStyle(document.body).getPropertyValue('--f-disp'), N=getComputedStyle(document.body).getPropertyValue('--f-num');
  const V=[-500,0,50,100,300,600], i=Math.floor(t/4)%V.length, k=(t%4)/4, prev=V[(i+V.length-1)%V.length], rho=k<0.25?prev+(V[i]-prev)*(k/0.25):V[i];
  const x0=w*0.07,x1=w*0.93, X=v=>x0+(v+700)/1500*(x1-x0), y=h*0.32;
  const seg=(a,b,c)=>{ g.fillStyle=c; g.globalAlpha=.22; g.fillRect(X(a),y-14,X(b)-X(a),28); g.globalAlpha=1; };
  seg(-700,0,COL.cold); seg(0,600,COL.warn); seg(600,800,COL.crit);
  g.strokeStyle=COL.line; g.lineWidth=1; g.strokeRect(x0,y-14,x1-x0,28);
  g.fillStyle=COL.mute; g.font='500 11px '+N; g.textAlign='center'; for(const v of [-600,-300,0,300,600]) g.fillText((v>0?'+':'')+v,X(v),y+30);
  g.font='600 12px '+F; g.fillStyle=COL.cold; g.fillText('sous-critique',X(-350),y-20); g.fillStyle=COL.warn; g.fillText('surcritique',X(300),y-20); g.fillStyle=COL.crit; g.fillText('prompt-critique',X(700),y-20);
  g.strokeStyle=COL.ok; g.lineWidth=2; g.beginPath(); g.moveTo(X(0),y-16); g.lineTo(X(0),y+16); g.stroke();
  g.fillStyle=COL.fg; g.beginPath(); g.moveTo(X(rho),y+16); g.lineTo(X(rho)-7,y+28); g.lineTo(X(rho)+7,y+28); g.closePath(); g.fill(); g.fillRect(X(rho)-1.5,y-16,3,32);
  const v=V[i], kk=1/(1-v*1e-5), nxt=Math.round(100000*kk);
  g.textAlign='left'; g.fillStyle=COL.fg; g.font='700 22px '+N; g.fillText('ρ = '+(v>0?'+':'')+v+' pcm',x0,h*0.58);
  g.font='500 14px '+N; g.fillStyle=COL.mute; g.fillText('k = '+kk.toFixed(5).replace('.',','),x0,h*0.58+22);
  g.font='500 15px '+F; g.fillStyle=COL.fg; g.fillText('Sur 100 000 neutrons, la génération suivante en compte '+nxt.toLocaleString('fr-FR'),x0,h*0.58+46);
  let msg; if(v<0) msg='La population diminue : réacteur arrêté, marge d\'arrêt de '+(-v)+' pcm.'; else if(v===0) msg='Critique : la puissance reste constante, quel que soit son niveau.'; else if(v>=600) msg='Prompt-critique : la puissance double en quelques millisecondes. À ne jamais atteindre.'; else { const T=(600-v)/(0.08*v); msg='La puissance double en ≈ '+Math.round(0.693*T)+' s (période ≈ '+Math.round(T)+' s).'; }
  g.fillStyle=v>=600?COL.crit:v<0?COL.cold:v===0?COL.ok:COL.warn; g.font='600 15px '+F; g.fillText(msg,x0,h*0.58+72);
 },
 xeanim(g,w,h,t){
  const F=getComputedStyle(document.body).getPropertyValue('--f-disp');
  const TH=30, th=(t%TH), P=hh=>hh<3?1:0;
  if(!ANIM._xe){ const lI=2.87e-5,lX=2.09e-5,sg=7.5e-5,gI=0.0639,gX=0.00237; let I=1,X=1; const tab=[]; for(let s=0;s<=TH*3600;s+=60){ const n=P(s/3600); tab.push([s/3600,I,X,n]); I+=lI*(n-I)*60; X+=((lX+sg)*(gX*n+gI*I)/(gI+gX)-(lX+sg*n)*X)*60; } ANIM._xe={tab,dI:[],dX:[]}; }
  const st=ANIM._xe, row=st.tab[Math.min(st.tab.length-1,Math.round(th*60))], I=row[1], X=row[2], n=row[3];
  const bx=w*0.04, by=h*0.08, bw=w*0.4, bh=h*0.62;
  g.fillStyle=COL.hot; g.globalAlpha=0.06+0.16*n; g.fillRect(bx,by,bw,bh); g.globalAlpha=1; g.strokeStyle=COL.line; g.strokeRect(bx,by,bw,bh);
  g.fillStyle=COL.mute; g.font='600 12px '+F; g.textAlign='left'; g.fillText('cœur — flux '+(n>0?'à 100 %':'nul (réacteur arrêté)'),bx,by-6);
  const adj=(arr,target,pop)=>{ while(arr.length<target) arr.push({x:bx+8+Math.random()*(bw-16),y:by+8+Math.random()*(bh-16)}); while(arr.length>target){ const d=arr.splice(Math.floor(Math.random()*arr.length),1)[0]; if(pop) st.pops=(st.pops||[]).concat([{x:d.x,y:d.y,t:th}]); } };
  adj(st.dI,Math.round(28*I),false); adj(st.dX,Math.round(28*X),n>0);
  if(th<0.05){ st.dI.length=0; st.dX.length=0; st.pops=[]; }
  if(n>0) for(let k=0;k<26;k++){ const a=(k*137.5+t*90)%360*Math.PI/180, r=((k*53+t*120)%100)/100; g.fillStyle=COL.cold; g.globalAlpha=.7; g.beginPath(); g.arc(bx+bw/2+Math.cos(a)*r*bw*0.45,by+bh/2+Math.sin(a)*r*bh*0.45,1.8,0,7); g.fill(); }
  g.globalAlpha=1;
  for(const d of st.dI){ g.fillStyle=COL.warn; g.beginPath(); g.arc(d.x,d.y,3.6,0,7); g.fill(); }
  for(const d of st.dX){ g.fillStyle=COL.bore; g.beginPath(); g.arc(d.x,d.y,4.2,0,7); g.fill(); }
  st.pops=(st.pops||[]).filter(p=>th-p.t<0.4&&th>=p.t); for(const p of st.pops){ g.strokeStyle=COL.cold; g.globalAlpha=1-(th-p.t)/0.4; g.beginPath(); g.arc(p.x,p.y,4+(th-p.t)*20,0,7); g.stroke(); } g.globalAlpha=1;
  const lg=[[COL.warn,'iode 135'],[COL.bore,'xénon 135'],[COL.cold,'neutrons']]; lg.forEach((l,k)=>{ g.fillStyle=l[0]; g.beginPath(); g.arc(bx+8+k*w*0.13,by+bh+16,4,0,7); g.fill(); g.fillStyle=COL.fg; g.font='500 12px '+F; g.fillText(l[1],bx+16+k*w*0.13,by+bh+20); });
  const cx=w*0.5, cw=w*0.47, cy=by, ch=bh, Xs=hh=>cx+hh/TH*cw, Ys=v=>cy+ch-(v/2)*ch;
  g.strokeStyle=COL.line; g.strokeRect(cx,cy,cw,ch);
  const line=(idx,c,sc)=>{ g.strokeStyle=c; g.lineWidth=2; g.beginPath(); st.tab.forEach((r,k)=>{ if(r[0]>th) return; const x=Xs(r[0]), y=Ys(r[idx]*(sc||1)); k?g.lineTo(x,y):g.moveTo(x,y); }); g.stroke(); };
  line(3,COL.accent,1); line(1,COL.warn); line(2,COL.bore);
  g.fillStyle=COL.mute; g.font='500 11px '+F; g.textAlign='center'; for(const hh of [0,6,12,18,24,30]) g.fillText(hh+' h',Xs(hh),cy+ch+14);
  g.textAlign='left'; g.font='600 12px '+F; [[COL.accent,'puissance'],[COL.warn,'iode'],[COL.bore,'xénon']].forEach((l,k)=>{ g.fillStyle=l[0]; g.fillRect(cx+8+k*78,cy+10,14,3); g.fillText(l[1],cx+26+k*78,cy+15); });
  g.fillStyle=COL.mute; g.font='500 11px '+F; g.fillText('1 = niveau d\'équilibre à pleine puissance',cx+8,cy+30); g.fillStyle=COL.bore; g.font='700 13px '+F; g.textAlign='right'; g.fillText('xénon × '+X.toFixed(2).replace('.',','),cx+cw-6,cy+15); g.textAlign='left';
  const ph=th<3?'Équilibre : le xénon produit est détruit au même rythme par les neutrons.':th<11?'Arrêt : plus de neutrons pour le détruire, l\'iode continue d\'en produire → le xénon monte.':'Pic passé : le xénon décroît par radioactivité, en un à deux jours.';
  g.fillStyle=COL.fg; g.font='600 14px '+F; g.textAlign='left'; g.fillText(ph,w*0.04,h-14);
 },
 dianim(g,w,h,t){
  const F=getComputedStyle(document.body).getPropertyValue('--f-disp'), N=getComputedStyle(document.body).getPropertyValue('--f-num');
  const ph=(t%10)/10, d=0.42*Math.sin(Math.PI*Math.min(1,ph*1.25))**2;
  const cx=w*0.06, cy=h*0.1, cw=w*0.3, ch=h*0.72, NZ=60; const prof=[];
  for(let k=0;k<NZ;k++){ const z=(k+0.5)/NZ; let p=Math.sin(Math.PI*z); const sm=Math.min(1,Math.max(0,(z-(1-d))/0.08)); p*=1-0.35*sm; prof.push(p); }
  const sum=prof.reduce((a,b)=>a+b,0); let top=0; for(let k=NZ/2;k<NZ;k++) top+=prof[k]; const AO=(2*top-sum)/sum*100;
  g.strokeStyle=COL.line; g.strokeRect(cx,cy,cw,ch); g.fillStyle=COL.mute; g.font='600 12px '+F; g.textAlign='center'; g.fillText('haut',cx+cw/2,cy-6); g.fillText('bas',cx+cw/2,cy+ch+14);
  g.setLineDash([4,4]); g.strokeStyle=COL.line; g.beginPath(); g.moveTo(cx,cy+ch/2); g.lineTo(cx+cw,cy+ch/2); g.stroke(); g.setLineDash([]);
  const mx=Math.max(...prof); g.fillStyle=COL.hot; g.globalAlpha=.35; g.beginPath(); g.moveTo(cx,cy+ch);
  prof.forEach((p,k)=>g.lineTo(cx+p/mx*cw*0.9,cy+ch-(k+0.5)/NZ*ch)); g.lineTo(cx,cy); g.closePath(); g.fill(); g.globalAlpha=1;
  g.strokeStyle=COL.hot; g.lineWidth=2; g.beginPath(); prof.forEach((p,k)=>{ const x=cx+p/mx*cw*0.9, y=cy+ch-(k+0.5)/NZ*ch; k?g.lineTo(x,y):g.moveTo(x,y); }); g.stroke();
  g.fillStyle=COL.fg; for(let r=0;r<3;r++) g.fillRect(cx+cw*(0.3+r*0.2)-2,cy-4,4,4+d*ch);
  const ptop=top/sum*100; g.font='600 13px '+N; g.textAlign='left'; g.fillStyle=COL.fg; g.fillText('haut '+ptop.toFixed(0)+' %',cx+cw+8,cy+ch*0.25); g.fillText('bas '+(100-ptop).toFixed(0)+' %',cx+cw+8,cy+ch*0.75);
  const dx=w*0.58, dw=w*0.38, dy=cy, dh=ch, X=v=>dx+(clamp(v,-15,15)+15)/30*dw, Y=p=>dy+dh-(p/110)*dh;
  g.fillStyle=COL.ok; g.globalAlpha=.15; g.beginPath(); g.moveTo(X(-5),Y(0)); g.lineTo(X(-6.65),Y(110)); g.lineTo(X(3.35),Y(110)); g.lineTo(X(5),Y(0)); g.closePath(); g.fill(); g.globalAlpha=1;
  g.strokeStyle=COL.line; g.strokeRect(dx,dy,dw,dh); g.fillStyle=COL.mute; g.font='500 11px '+N; g.textAlign='center'; for(const v of [-15,-10,-5,0,5,10,15]) g.fillText(String(v).replace('-','−'),X(v),dy+dh+14);
  g.fillText('ΔI (% PN)',dx+dw/2,dy+dh+28); g.textAlign='right'; g.fillText('100 %',dx-4,Y(100)+4); g.fillText('0',dx-4,Y(0)+4);
  const DI=AO; const ok=Math.abs(DI+1.5)<=5; g.fillStyle=ok?COL.fg:COL.warn; g.beginPath(); g.arc(X(DI),Y(100),6,0,7); g.fill();
  g.textAlign='left'; g.font='700 18px '+N; g.fillStyle=ok?COL.fg:COL.warn; g.fillText('ΔI = '+(DI>0?'+':'')+DI.toFixed(1).replace('.',',')+' %',dx,dy-8);
  g.font='600 13px '+F; g.fillStyle=COL.mute; g.fillText(d<0.05?'Grappes extraites : puissance équilibrée entre haut et bas':ok?'Grappes insérées de '+Math.round(d*100)+' % de la hauteur : la puissance descend':'Hors domaine : on retire les grappes et on compense au bore',w*0.06,h-10);
 },
});

/* --- navigation par thèmes --- */
function tourThemes(i){
  const c=TOUR[i], idx=TOUR.map((x,j)=>[x,j]).filter(p=>p[0].th===c.th), pos=idx.findIndex(p=>p[1]===i);
  const seen=TV.seen||(TV.seen=new Set()); seen.add(i);
  $('#tthemes').innerHTML=THEMES.map(([id,name])=>{ const first=TOUR.findIndex(x=>x.th===id), all=TOUR.map((x,j)=>x.th===id?j:-1).filter(j=>j>=0), done=all.every(j=>seen.has(j)); return '<button class="tth'+(id===c.th?' on':'')+(done?' done':'')+'" data-tv="'+first+'">'+name+'<small>'+all.length+'</small></button>'; }).join('');
  $('#tdots').innerHTML=idx.map(([x,j])=>'<button class="tdot'+(j===i?' on':seen.has(j)?' seen':'')+'" data-tv="'+j+'" aria-label="'+x.t.replace(/"/g,'&quot;')+'" title="'+x.t.replace(/"/g,'&quot;')+'"></button>').join('');
  T('tk',c.k+' · '+(pos+1)+' / '+idx.length+'   —   chapitre '+(i+1)+' sur '+TOUR.length);
  const tho=$('#tthemes .tth.on'), thb=$('#tthemes'); if(tho&&thb&&thb.scrollWidth>thb.clientWidth) thb.scrollLeft=tho.offsetLeft-thb.offsetLeft-(thb.clientWidth-tho.offsetWidth)/2;
}

/* ================= Domaine P-T (« chaussette ») ================= */
const PTG=(()=>{
  const frac=[[10,32],[60,36],[90,45],[110,58],[130,80],[150,110],[170,145],[185,172]];
  const SM=10, Ta=tsat(25)-SM, Tb=tsat(172)-SM; const sub=[]; for(let T=Ta;T<Tb;T+=3) sub.push([T,psat(T+SM)]); sub.push([Tb,172]);
  const sat=[]; for(let T=100;T<=350;T+=3) sat.push([T,psat(T)]);
  const poly=[[10,25],...frac,...sub.slice().reverse(),[Ta,25]];
  return {frac,sub,sat,poly,SM,Ta};
})();
function ptInside(T,P){ if(P<25||P>172) return false; let fr=PTG.frac.find((p,i)=>T<=p[0]); let pmax=172; for(let i=1;i<PTG.frac.length;i++){ const a=PTG.frac[i-1],b=PTG.frac[i]; if(T<=b[0]){ pmax=T<=a[0]?a[1]:a[1]+(b[1]-a[1])*(T-a[0])/(b[0]-a[0]); break; } } if(T<10) pmax=32; return P<=pmax&&P>=psat(T+PTG.SM); }
function drawPTon(g,w,h,o){
  const z=o.zoom, x0=z?240:0,x1=z?350:350,y0=z?100:0,y1=z?180:180;
  const L=40,R=8,Tp=10,B=26, X=v=>L+(v-x0)/(x1-x0)*(w-L-R), Y=v=>Tp+(1-(v-y0)/(y1-y0))*(h-Tp-B);
  const F=getComputedStyle(document.body).getPropertyValue('--f-num');
  g.save(); g.beginPath(); g.rect(L,Tp,w-L-R,h-Tp-B); g.clip();
  g.fillStyle=COL.ok; g.globalAlpha=.13; g.beginPath(); PTG.poly.forEach((p,i)=>i?g.lineTo(X(p[0]),Y(p[1])):g.moveTo(X(p[0]),Y(p[1]))); g.closePath(); g.fill(); g.globalAlpha=1;
  const line=(pts,c,wd,dash)=>{ g.strokeStyle=c; g.lineWidth=wd; g.setLineDash(dash||[]); g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(X(p[0]),Y(p[1])):g.moveTo(X(p[0]),Y(p[1]))); g.stroke(); g.setLineDash([]); };
  line(PTG.sat,COL.crit,2); line(PTG.sub,COL.warn,1.5,[5,4]); line(PTG.frac,COL.bore,2); line([[185,172],[350,172]],COL.crit,1.5);
  line([[0,166.6],[350,166.6]],COL.mute,1,[3,4]); line([[0,25],[PTG.Ta,25]],COL.cold,1.5); line([[0,131],[350,131]],COL.mute,1,[2,5]);
  g.fillStyle=COL.accent; g.globalAlpha=.18; g.fillRect(X(286),Y(158),X(325)-X(286),Y(152)-Y(158)); g.globalAlpha=1;
  if(o.trace&&o.trace.length>1){ g.strokeStyle=COL.mute; g.lineWidth=1.2; g.beginPath(); o.trace.forEach((p,i)=>i?g.lineTo(X(p[0]),Y(p[1])):g.moveTo(X(p[0]),Y(p[1]))); g.stroke(); }
  g.restore();
  g.font='10px '+F; g.fillStyle=COL.mute; g.textAlign='right';
  for(const v of (z?[100,120,140,160,180]:[0,50,100,150])) { g.fillText(v,L-4,Y(v)+3); g.strokeStyle=COL.line; g.globalAlpha=.35; g.beginPath(); g.moveTo(L,Y(v)); g.lineTo(w-R,Y(v)); g.stroke(); g.globalAlpha=1; }
  g.textAlign='center'; for(const v of (z?[250,275,300,325,350]:[0,100,200,300])) g.fillText(v+(v===(z?350:300)?' °C':''),X(v),h-12);
  g.save(); g.translate(10,(Tp+h-B)/2); g.rotate(-Math.PI/2); g.fillText('bar',0,0); g.restore();
  if(o.labels){ g.font='600 11px '+getComputedStyle(document.body).getPropertyValue('--f-disp'); g.textAlign='left';
    const lab=(t,x,y,c)=>{ g.fillStyle=c; g.fillText(t,X(x),Y(y)); };
    if(!z){ lab('saturation',318,92,COL.crit); lab('marge 10 °C',232,58,COL.warn); lab('rupture brutale',32,62,COL.bore); lab('P mini pompes primaires',20,20,COL.cold); lab('domaine autorisé',120,105,COL.ok); lab('soupapes',8,170,COL.mute); }
    else { lab('saturation',312,108,COL.crit); lab('marge 10 °C',262,118,COL.warn); lab('fonctionnement',288,163,COL.accent); lab('AAR basse pression',244,128,COL.mute); }
  }
  if(o.pt){ const [T,P]=o.pt; const px=X(clamp(T,x0,x1)),py=Y(clamp(P,y0,y1)); g.fillStyle=o.ptc||COL.fg; g.strokeStyle=COL.bg; g.lineWidth=2; g.beginPath(); g.arc(px,py,5,0,7); g.fill(); g.stroke(); if(o.ptl){ g.font='600 12px '+getComputedStyle(document.body).getPropertyValue('--f-disp'); g.fillStyle=COL.fg; g.textAlign=px>w*0.6?'right':'left'; g.fillText(o.ptl,px+(px>w*0.6?-10:10),py-8); } }
}
A.ptZoom=false;
function drawPT(){
  const s=A.s; if(!s) return; const cv=$('#c-pt'); if(!cv) return; const P=prepCanvas(cv); if(!P) return;
  const H0=s.hist, tr=[]; for(let i=Math.max(0,H0.length-3600);i<H0.length;i+=10) if(H0[i].th!=null) tr.push([H0[i].th,H0[i].pp]);
  const inside=ptInside(s.Thot,s.Ppzr);
  drawPTon(P.g,P.w,P.h,{zoom:A.ptZoom,trace:tr,pt:[s.Thot,s.Ppzr],ptc:inside?(s.satMargin<15?COL.warn:COL.fg):COL.crit,labels:true});
  T('pt-st',(inside?'Dans le domaine':'Hors domaine')+' · Tch '+fmt(s.Thot,1)+' °C · '+fmt(s.Ppzr,1)+' bar · marge saturation '+fmt(s.satMargin,1)+' °C');
  const e=$('#pt-st'); if(e) e.classList.toggle('bad',!inside||s.satMargin<15);
}

