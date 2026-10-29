/* Retours, thème, fenêtre « Pourquoi l'AAR ? », carte « En cours », tendances. */
'use strict';
/* ================= Retours ================= */
/* Envoi par Netlify Forms (formulaire « retour », notification par courriel réglée dans Netlify) ; retours publiés lus dans retours.json. */
const FB={endpoint:'/',data:'retours.json',list:null,loading:false,filter:'all',
  lv:[['critique','Critique','Résultat faux, ou qui enseignerait une mauvaise pratique','crit'],['incohérence','Incohérence','Comportement physique ou de conduite douteux','warn'],['manquant','Manquant','Notion, système ou situation absente','bore'],['amélioration','Amélioration','Ergonomie, pédagogie, clarté','ok'],['détail','Détail','Coquille, affichage','mute']],
  parts:['Visite de la centrale','Tutoriel','Leçons guidées','Exercices','Aléas','Modèle physique','Interface','Aide, lexique','Autre']};
function fbContext(){
  const s=A.s; if(!s) return 'Aucune simulation en cours.';
  const sc=A.scn; return ['Scénario : '+(sc?(sc.mystery?'aléa mystère ('+sc.realTitle+')':sc.title):'—')+(sc&&sc.steps&&A.ctx?' · étape '+(A.ctx.step+1):''),'Temps simulé : '+hms(s.t),
   'P nucléaire '+fmt(s.n*100,2)+' % · charge '+fmt(s.Lt*100,1)+' % · '+(s.tripped?'AAR':s.coupled?'couplé':'découplé'),
   'Tmoy '+fmt(s.Tavg,2)+' °C · Tref '+fmt(s.Tref,2)+' · Tch '+fmt(s.Thot,1)+' · Tfr '+fmt(s.Tcold,1),
   'P pressu '+fmt(s.Ppzr,2)+' bar · niveau '+fmt(s.Lpzr,1)+' % · GV '+fmt(s.Lsg,1)+' % / '+fmt(s.Psg,1)+' bar',
   'Bore '+fmt(s.Cb,1)+' ppm · R '+fmt(s.rods.R.p,1)+' · GCP '+fmt(s.rods.G.p,1)+' · ρ '+fmt(s.rho.tot,1)+' pcm · Xe '+fmt(s.rho.xe,0)+' pcm',
   'Navigateur : '+navigator.userAgent.slice(0,120)].join('\n');
}
function openFB(tab){
  if(A.s&&$('#fb').hidden){ FB.wasPaused=A.paused; A.paused=true; syncAll(); }
  $('#fb').hidden=false; fbTab(tab||'new');
}
function closeFB(){ $('#fb').hidden=true; if(A.s&&!A.done&&$('#menu').hidden){ A.paused=FB.wasPaused; syncAll(); } }
function fbTab(t){
  $$('#fb [data-fbt]').forEach(b=>b.classList.toggle('on',b.dataset.fbt===t));
  $('#fbNew').hidden=t!=='new'; $('#fbList').hidden=t!=='list';
  if(t==='new'){ $('#fbCtx').value=fbContext(); if(A.scn&&!$('#fbPart').dataset.touched){ const k=A.scn.kind; $('#fbPart').value={tuto:'Tutoriel',lecon:'Leçons guidées',exo:'Exercices',alea:'Aléas'}[k]||'Interface'; } }
  else fbLoad();
}
async function fbSubmit(e){
  e.preventDefault();
  const lv=($('input[name="fblv"]:checked')||{}).value, ti=$('#fbTitle').value.trim(), de=$('#fbDesc').value.trim();
  const err=[]; if(!lv) err.push('le niveau d\'importance'); if(!ti) err.push('un titre'); if(!de) err.push('la description');
  if(err.length){ $('#fbErr').textContent='Il manque '+err.join(', ')+'.'; return; }
  $('#fbErr').textContent='';
  const L=FB.lv.find(x=>x[0]===lv);
  const d={'form-name':'retour',subject:'Retour REP 900 — ['+L[1]+'] '+ti,niveau:L[1]+' — '+L[2].charAt(0).toLowerCase()+L[2].slice(1),partie:$('#fbPart').value,titre:ti,description:de,attendu:$('#fbExp').value.trim(),contexte:$('#fbCtxOn').checked?$('#fbCtx').value:'','bot-field':$('#fbBot').value};
  FB.last=d; const bt=$('#fbSend'); bt.disabled=true; bt.textContent='Envoi…';
  const box=$('#fbReady'), msg=$('#fbReadyT');
  try{
    const r=await fetch(FB.endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(d).toString()});
    if(!r.ok) throw new Error('Erreur '+r.status);
    box.classList.remove('ko'); msg.textContent='Merci, votre retour a bien été envoyé à l\'auteur. S\'il est retenu, il sera publié sans nom dans l\'onglet « Retours publiés », avec la réponse.'; $('#fbCopy').hidden=true;
    $('#fbTitle').value=''; $('#fbDesc').value=''; $('#fbExp').value=''; $$('input[name="fblv"]').forEach(x=>x.checked=false);
  }catch(x){
    box.classList.add('ko'); msg.textContent='L\'envoi n\'a pas abouti (connexion coupée, ou page ouverte hors du site en ligne). Votre texte est conservé : réessayez dans un moment, ou copiez-le pour le garder.'; $('#fbCopy').hidden=false;
  }
  box.hidden=false; bt.disabled=false; bt.textContent='Envoyer le retour';
}
function fbText(d){ d=d||FB.last||{}; return ['['+(d.niveau||'')+'] '+(d.titre||''),'Partie : '+(d.partie||''),'',d.description||'',d.attendu?'\nAttendu : '+d.attendu:'',d.contexte?'\n'+d.contexte:''].join('\n'); }
async function fbCopy(){ try{ await navigator.clipboard.writeText(fbText()); $('#fbCopy').textContent='Texte copié'; }catch(x){ $('#fbCopy').textContent='Copie impossible'; } setTimeout(()=>{ const b=$('#fbCopy'); if(b) b.textContent='Copier le texte du retour'; },2500); }
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function fbLoad(force){
  const box=$('#fbItems');
  if(FB.list&&!force){ fbRender(); return; }
  if(FB.loading) return; FB.loading=true; box.innerHTML='<p class="note">Chargement des retours…</p>';
  try{
    const r=await fetch(FB.data,{cache:'no-cache'});
    if(!r.ok) throw new Error('Erreur '+r.status);
    const js=await r.json();
    FB.list=(js.retours||[]).map((i,k)=>({n:i.n||k+1,title:i.titre||'',lv:FB.lv.some(v=>v[0]===i.niveau)?i.niveau:null,part:i.partie||'',desc:i.description||'',state:i.statut==='résolu'?'closed':'open',rep:i.reponse||'',repDate:i.date_reponse||'',date:i.date||''}));
    fbRender();
  }catch(e){ box.innerHTML='<p class="note">Impossible de charger les retours publiés ('+esc(e.message||'réseau')+'). Ils se consultent sur le simulateur en ligne.</p>'; }
  FB.loading=false;
}
function fbRender(){
  const L=FB.list||[], f=FB.filter, box=$('#fbItems');
  const cnt=k=>L.filter(x=>x.lv===k).length;
  $('#fbFilt').innerHTML='<button class="chip'+(f==='all'?' on':'')+'" data-fbf="all">Tous · '+L.length+'</button>'+FB.lv.map(v=>'<button class="chip lvc '+v[3]+(f===v[0]?' on':'')+'" data-fbf="'+v[0]+'">'+v[1]+' · '+cnt(v[0])+'</button>').join('')+'<button class="chip'+(f==='open'?' on':'')+'" data-fbf="open">Ouverts</button>';
  const S=L.filter(x=>f==='all'||(f==='open'?x.state==='open':x.lv===f));
  if(!S.length){ box.innerHTML='<p class="note">'+(L.length?'Aucun retour dans cette catégorie.':'Aucun retour publié pour l\'instant. Soyez le premier !')+'</p>'; return; }
  const rk={critique:0,'incohérence':1,manquant:2,'amélioration':3,'détail':4};
  S.sort((a,b)=>(a.state===b.state?0:a.state==='open'?-1:1)||(rk[a.lv]??5)-(rk[b.lv]??5)||b.n-a.n);
  box.innerHTML=S.map(x=>{ const v=FB.lv.find(l=>l[0]===x.lv);
    return '<div class="fbi'+(x.state==='closed'?' closed':'')+'"><div class="fbh">'+(v?'<span class="lvb '+v[3]+'">'+v[1]+'</span>':'<span class="lvb mute">Sans niveau</span>')+'<span class="fbst">'+(x.state==='open'?'Ouvert':'Résolu')+'</span><span class="fbn">#'+x.n+'</span></div><div class="fbt">'+esc(x.title)+'</div>'+(x.part?'<div class="fbp">'+esc(x.part)+'</div>':'')+(x.desc?'<div class="fbd">'+esc(x.desc.slice(0,280))+(x.desc.length>280?'…':'')+'</div>':'')+
      '<div class="fbf"><span>'+(x.date?'Reçu le '+new Date(x.date).toLocaleDateString('fr-FR'):'')+'</span>'+(x.rep?'<button class="btn sm" data-fbc="'+x.n+'">Réponse de l\'auteur</button>':'<span class="note" style="margin:0">Pas encore de réponse</span>')+'</div><div class="fbcm" id="fbcm-'+x.n+'" hidden></div></div>'; }).join('');
}
function fbComments(n){
  const el=$('#fbcm-'+n); if(!el) return; if(!el.hidden){ el.hidden=true; return; } el.hidden=false;
  const x=(FB.list||[]).find(v=>v.n===n);
  el.innerHTML=x&&x.rep?'<div class="fbc own"><div class="fbch"><b>Réponse de l\'auteur</b>'+(x.repDate?' · '+new Date(x.repDate).toLocaleDateString('fr-FR'):'')+'</div><div class="fbr">'+esc(x.rep)+'</div></div>':'<p class="note">Aucune réponse.</p>';
}

/* ================= Thème ================= */
function themeApply(m){
  m=m||store('theme')||'auto'; store('theme',m);
  if(m==='auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme',m);
  const dark=m==='dark'||(m==='auto'&&!(window.matchMedia&&matchMedia('(prefers-color-scheme: light)').matches));
  const mt=document.querySelector('meta[name="theme-color"]'); if(mt) mt.content=dark?'#10161a':'#e4eaee';
  $$('.seg[data-key="theme"] button').forEach(b=>b.classList.toggle('on',b.dataset.v===m));
  const tb=$('#themeBtn'); if(tb){ tb.innerHTML=dark?'<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>':'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'; tb.setAttribute('aria-label','Thème : '+{auto:'automatique',light:'clair',dark:'sombre'}[m]+' (changer)'); }
  readCols(); drawCharts(); drawDI(); drawPT();
}

/* ================= Fenêtre « Pourquoi l'AAR ? » ================= */
/* Pour chaque protection : ce qu'elle mesure, son seuil, son rôle, les origines probables (d'après l'état à l'instant de l'AAR et les dernières actions) et la suite. */
const AARX=[
 {m:/seuil haut 109/,nom:'Haut flux neutronique, seuil haut',val:x=>fmt(x.n*100,1)+' % PN',thr:'109 % PN',
  role:"Limite la puissance du cœur. Au-delà, le combustible chaufferait plus vite que les autres protections ne peuvent suivre : c'est la parade la plus rapide contre une excursion de réactivité.",
  orig:(x,O)=>[x.rodWd&&"Retrait incontrôlé du groupe R : un défaut de commande extrayait les grappes en continu.",
   /(Groupe R|GCP|Groupes d'arrêt) → /.test(O)&&"Des grappes venaient d'être extraites : chaque pas retiré ajoute de la réactivité.",
   /Dilution/.test(O)&&"Une dilution venait d'être faite : moins de bore, donc plus de réactivité.",
   /Consigne de charge/.test(O)&&"La charge venait d'être augmentée : le refroidissement plus fort a fait monter la puissance."],
  def:"Une insertion de réactivité (grappes, dilution ou refroidissement brutal) a porté la puissance au-delà de 109 %.",
  fix:"Avant de redémarrer, trouvez ce qui a ajouté la réactivité et corrigez-le : position des grappes, concentration en bore."},
 {m:/seuil bas 25/,nom:'Haut flux neutronique, seuil bas',val:x=>fmt(x.n*100,1)+' % PN',thr:'25 % PN (seuil non bloqué)',
  role:"Protège pendant le démarrage : tant que l'opérateur ne l'a pas bloqué, ce qui n'est permis qu'au-dessus de P10, une montée de puissance à faible puissance est arrêtée dès 25 %.",
  orig:(x,O)=>[x.rodWd&&"Retrait incontrôlé du groupe R à faible puissance : sans contre-réaction Doppler, la puissance monte très vite.",
   x.p10&&!x.lowBlk&&"La puissance a dépassé 25 % sans que le seuil bas soit bloqué. Le blocage était permis dès P10 (10 %) : Protection › « Bloquer seuil bas (P10) ».",
   /(Groupe R|GCP|Groupes d'arrêt) → /.test(O)&&"Des grappes venaient d'être extraites."],
  def:"La puissance a dépassé 25 % alors que le seuil bas de haut flux était encore actif.",
  fix:"En montée en puissance, bloquez le seuil bas dès que P10 apparaît, et montez lentement."},
 {m:/gamme source/,nom:'Haut flux gamme source',val:x=>fmt(x.n*1e10,0)+' c/s',thr:'10⁵ c/s',
  role:"Les compteurs de la gamme source saturent vers 10⁶ c/s. Si le comptage dépasse 10⁵ c/s sans que l'opérateur ait confirmé le relais par la gamme intermédiaire (inhibition à P6), le réacteur s'arrête par précaution.",
  orig:(x,O)=>[!x.srInhib&&"La gamme source n'a pas été inhibée après l'apparition de P6.",x.rodWd&&"Retrait incontrôlé du groupe R pendant la divergence.",
   /(Groupe R|GCP|Groupes d'arrêt) → /.test(O)&&"Des grappes venaient d'être extraites : la divergence était peut-être trop rapide."],
  def:"Le comptage a dépassé 10⁵ c/s pendant la divergence.",
  fix:"À la prochaine divergence, inhibez la gamme source dès l'alarme P6 (Protection › « Inhiber GS »)."},
 {m:/surtempérature/,nom:'ΔT surtempérature',val:x=>'ΔT '+fmt(x.DTp,1)+' %',thr:'seuil calculé {OT} %',
  role:"Protège contre la crise d'ébullition, quand une pellicule de vapeur isole la gaine du combustible. Le seuil se calcule en continu : il baisse quand la pression baisse ou quand Tmoy monte.",
  orig:(x,O)=>[x.sprayStuck&&"Une vanne d'aspersion est restée bloquée ouverte : la pression baissait, et le seuil avec elle.",
   !x.sprayStuck&&x.sprayMode==='man'&&"L'aspersion était en manuel : en ouvrant, elle a fait baisser la pression, donc le seuil.",
   x.Ppzr<150&&"La pression était basse ("+fmt(x.Ppzr,1)+" bar) : sous ~149 bar le seuil baisse d'environ 1 % par bar.",
   x.leakQ>0&&"Une fuite du primaire faisait baisser la pression.",
   x.Tavg>x.Tref+2&&"Tmoy était "+fmt(x.Tavg-x.Tref,1)+" °C au-dessus de Tref : l'eau plus chaude rapproche le seuil."],
  def:"Le ΔT du primaire, image de la puissance, a rejoint le seuil de surtempérature.",
  fix:"Rétablissez la pression (aspersion en auto ou isolée, chaufferettes) et Tmoy sur Tref avant de redémarrer."},
 {m:/surpuissance/,nom:'ΔT surpuissance',val:x=>'ΔT '+fmt(x.DTp,1)+' %',thr:'seuil calculé {OP} %',
  role:"Protège le combustible contre une puissance locale excessive, qui pourrait faire fondre le centre des pastilles. Le seuil baisse quand Tmoy monte vite.",
  orig:(x,O)=>[x.n>1.02&&"La puissance dépassait 100 % ("+fmt(x.n*100,1)+" %).",/Dilution/.test(O)&&"Une dilution venait d'être faite.",
   /(Groupe R|GCP) → /.test(O)&&"Des grappes venaient d'être extraites.",/Consigne de charge/.test(O)&&"Une hausse de charge rapide venait d'être demandée."],
  def:"La puissance mesurée par le ΔT a dépassé le seuil de surpuissance.",
  fix:"Ramenez la puissance sous 100 % et Tmoy sur Tref avant de redémarrer."},
 {m:/Pression pressuriseur haute/,nom:'Pression pressuriseur haute',val:x=>fmt(x.Ppzr,1)+' bar',thr:'165 bar',
  role:"Protège le circuit primaire, deuxième barrière, avant que les soupapes SEBIM ne s'ouvrent à 166,6 bar.",
  orig:(x,O)=>[x.heatMode==='on'&&"Les chaufferettes étaient en marche forcée.",x.sprayMode==='man'&&"L'aspersion était en manuel : elle ne limitait plus la pression.",
   x.chgMode==='man'&&"La charge RCV était en manuel : le primaire se remplissait et comprimait la vapeur.",
   /Déclenchement manuel de la turbine/.test(O)&&"La turbine venait d'être déclenchée : le primaire chauffe et l'eau se dilate."],
  def:"Le primaire s'est échauffé ou rempli plus vite que l'aspersion ne pouvait compenser.",
  fix:"Repassez chaufferettes, aspersion et charge RCV en automatique."},
 {m:/Pression pressuriseur basse/,nom:'Pression pressuriseur basse',val:x=>fmt(x.Ppzr,1)+' bar',thr:'131 bar',
  role:"Une pression basse rapproche l'eau de l'ébullition dans le cœur, et signale souvent une fuite. On arrête avant que la marge à la saturation ne fonde.",
  orig:(x,O)=>[x.sprayStuck&&"Une vanne d'aspersion est restée bloquée ouverte.",!x.sprayStuck&&x.sprayMode==='man'&&"L'aspersion était en manuel.",
   x.leakQ>0&&"Le primaire perdait de l'eau par une fuite.",x.heatMode==='off'&&"Les chaufferettes étaient arrêtées."],
  def:"La pression du primaire a baissé jusqu'au seuil.",
  fix:"Trouvez la cause de la baisse (aspersion, fuite) et isolez-la ; les chaufferettes remonteront la pression."},
 {m:/Niveau pressuriseur haut/,nom:'Niveau pressuriseur haut',val:x=>fmt(x.Lpzr,1)+' %',thr:'92 %',
  role:"Un pressuriseur plein n'a plus de bulle de vapeur : la pression ne serait plus maîtrisée et de l'eau pourrait passer par les soupapes.",
  orig:(x,O)=>[x.chgMode==='man'&&"La charge RCV était en manuel : on envoyait plus d'eau qu'on n'en retirait.",x.is&&"L'injection de sécurité remplissait le primaire.",
   x.Tavg>x.Tref+2&&"Tmoy était haute : l'eau dilatée remplit le pressuriseur."],
  def:"Le volume d'eau du primaire a trop augmenté.",
  fix:"Repassez la charge RCV en automatique ; vérifiez la décharge."},
 {m:/Niveau GV très bas/,nom:'Niveau GV très bas',val:x=>fmt(x.Lsg,1)+' %',thr:'15 %',
  role:"Un générateur de vapeur sans eau ne refroidit plus le primaire. On arrête le réacteur tant qu'il reste assez d'eau pour évacuer la puissance résiduelle avec l'ASG.",
  orig:(x,O)=>[(!x.tpa[0]||!x.tpa[1])&&"Une turbopompe alimentaire était perdue : la pompe restante ne couvrait pas le débit vapeur.",
   x.areMode==='man'&&"L'ARE était en manuel à "+fmt(x.areMan*100,0)+" % pour "+fmt(x.Wst*100,0)+" % de vapeur.",
   x.areIsol&&"L'ARE était isolée.",x.Wf<x.Wst-0.05&&"Le débit d'eau ("+fmt(x.Wf*100,0)+" %) était inférieur au débit vapeur ("+fmt(x.Wst*100,0)+" %)."],
  def:"L'eau alimentaire n'a pas suivi le débit vapeur.",
  fix:"Vérifiez que l'ASG remplit les GV, puis rétablissez l'ARE (Auto ; APD si une turbopompe manque)."},
 {m:/Bas débit primaire/,nom:'Bas débit primaire',val:x=>x.pumps.filter(Boolean).length+' pompe(s) sur 3',thr:'3 pompes au-dessus de P7',
  role:"Sans débit primaire suffisant, la chaleur du cœur n'est plus évacuée : risque de crise d'ébullition. Active au-dessus de P7 (simplification : sur une tranche réelle, le seuil dépend du nombre de boucles touchées).",
  orig:x=>x.pumps.map((p,i)=>!p&&"La pompe primaire GMPP "+(i+1)+" s'est arrêtée."),
  def:"Une pompe primaire s'est arrêtée au-dessus de P7.",
  fix:"Pas de redémarrage tant que la pompe n'est pas disponible. Stabilisez à chaud : Tmoy, niveaux GV et pressu."},
 {m:/Déclenchement turbine/,nom:'Déclenchement turbine au-dessus de P7',val:x=>fmt(x.n*100,1)+' % PN',thr:'P7 (10 % PN)',
  role:"Au-dessus de P7, le contournement GCT-c ne peut pas absorber seul toute la vapeur : le réacteur est arrêté avec la turbine.",
  orig:(x,O)=>[/manuel/.test(x.turbWhy)&&"Vous avez déclenché la turbine à la main.",/niveau GV très haut/.test(x.turbWhy)&&"Le niveau GV a dépassé 80 % : la turbine a été protégée contre l'arrivée d'eau, l'ARE isolée.",
   x.turbWhy&&!/manuel|niveau GV/.test(x.turbWhy)&&"La turbine a déclenché : "+x.turbWhy+"."],
  def:"La turbine s'est arrêtée alors que le réacteur était au-dessus de P7.",
  fix:"Ramenez le niveau GV dans sa plage et vérifiez la turbine avant de la recoupler."},
 {m:/Injection de sécurité/,nom:'Injection de sécurité',val:x=>fmt(x.Ppzr,1)+' bar',thr:'119 bar, ou action manuelle',
  role:"L'injection de sécurité répond à une perte d'eau du primaire : elle arrête le réacteur et injecte de l'eau borée pour garder le cœur noyé.",
  orig:(x,O,src)=>[src==='op'&&"Vous avez déclenché l'IS à la main.",x.Ppzr<125&&"La pression est descendue jusqu'au seuil d'IS : brèche ou fuite importante, ou aspersion ouverte.",x.leakQ>0&&"Le primaire perdait de l'eau par une fuite."],
  def:"Un signal d'injection de sécurité est apparu.",
  fix:"L'IS ne s'arrête qu'au-dessus de 140 bar, avec un niveau pressu supérieur à 20 % et une marge à la saturation supérieure à 20 °C."},
 {m:/AAR manuel/,nom:'AAR manuel',val:()=>'décision de l\'opérateur',thr:'—',
  role:"L'AAR manuel est toujours une réponse acceptable en cas de doute sur la sûreté : on arrête d'abord, on comprend ensuite.",
  orig:x=>[x.rodWd&&"Le groupe R s'extrayait seul : l'AAR manuel immédiat était la bonne parade.",x.Td<60&&"Le temps de doublement était court ("+TdTxt(x)+")."],
  def:"Vous avez décidé d'arrêter le réacteur.",
  fix:"Notez dans le journal pourquoi vous l'avez fait ; c'est la première question au débriefing."}
];
const aarSpec=a=>AARX.find(x=>x.m.test(a.cause))||{nom:a.cause,val:()=>'—',thr:'—',role:'',orig:()=>[],def:'',fix:''};
const AW={i:0,n:0,s:null};
function aarChecks(s,a){
  const sig=protCause(s), L=[
   ['Grappes toutes en bas',Object.values(s.rods).every(b=>b.p<=1)],
   ['Puissance neutronique en décroissance, sous 1 %',s.n<0.01&&!(s.rate>1e-4),fmt(s.n*100,2)+' %'],
   ['GV alimentés (ASG ou ARE), niveau au-dessus de 15 %',s.Lsg>15&&(s.asg||s.Wf>0.01),fmt(s.Lsg,1)+' %'],
   ['Tmoy stabilisée vers 286 °C (±3 °C)',Math.abs(s.Tavg-286)<3,fmt(s.Tavg,1)+' °C'],
   ['Pression pressu tenue entre 140 et 165 bar',s.Ppzr>140&&s.Ppzr<165,fmt(s.Ppzr,1)+' bar']];
  if(a.sn.is||s.is) L.push(['Injection de sécurité arrêtée',!s.is]);
  L.push(['Plus aucun signal d\'AAR présent',!sig,sig||'']);
  return L;
}
function aarHTML(s,i){
  const a=s.aars[i], x=a.sn, sp=aarSpec(a), O=a.ops.map(l=>l.txt).join('\n');
  const th=String(sp.thr).replace('{OT}',fmt(x.OTsp,1)).replace('{OP}',fmt(x.OPsp,1));
  const or=(sp.orig(x,O,a.src)||[]).filter(Boolean); if(!or.length&&sp.def) or.push(sp.def);
  let h='<div class="aw-h"><b>Pourquoi l\'AAR ?</b><button class="btn sm" id="awX" aria-label="Fermer">✕</button></div>';
  h+='<div class="aw-sub">AAR '+(a.src==='op'?'manuel':'automatique')+' à '+hms(a.t)+(s.aars.length>1?' · '+(i+1)+' / '+s.aars.length:'')+'</div>';
  h+='<h4>Ce qui l\'a déclenché</h4><div class="aw-v"><span>'+sp.nom+'</span><span class="num"><b>'+sp.val(x)+'</b> · seuil '+th+'</span></div>';
  if(sp.role) h+='<h4>À quoi sert cette protection</h4><p>'+sp.role+'</p>';
  h+='<h4>Origine probable</h4><ul>'+or.map(t=>'<li>'+t+'</li>').join('')+'</ul>';
  if(a.ops.length) h+='<details><summary>Vos dernières actions avant l\'AAR</summary><div class="log">'+a.ops.map(l=>'<div><span class="tm">'+hms(l.t)+'</span><span class="op">'+l.txt+'</span></div>').join('')+'</div></details>';
  h+='<h4>Et maintenant</h4><p>Les grappes sont tombées en moins de 2 s : la puissance chute d\'un coup puis décroît avec une période d\'environ −80 s ; il reste la puissance résiduelle à évacuer. La turbine est déclenchée, l\'ASG démarre et le GCT-c tient environ 70 bar dans les GV : Tmoy redescend vers 286 °C. '+sp.fix+'</p>';
  if(i===s.aars.length-1&&s.tripped){
    h+='<h4>Avant de réarmer</h4><ul class="aw-ck">'+aarChecks(s,a).map(([t,ok,d])=>'<li class="'+(ok?'ok':'ko')+'"><span class="i">'+(ok?'✓':'○')+'</span><span>'+t+(d?' <small>'+d+'</small>':'')+'</span></li>').join('')+'</ul><p class="aw-n">Réarmer ne redémarre pas le réacteur : cela autorise seulement à extraire de nouveau les grappes, une fois la cause comprise et traitée.</p>';
  } else h+='<p class="aw-n">'+(s.tripped?'Un AAR plus récent a eu lieu.':'AAR réarmé depuis.')+'</p>';
  h+='<div class="row aw-f">'+(s.aars.length>1?'<button class="btn sm" id="awP"'+(i?'':' disabled')+'>‹ Précédent</button><button class="btn sm" id="awN"'+(i<s.aars.length-1?'':' disabled')+'>Suivant ›</button>':'')+(i===s.aars.length-1&&s.tripped?'<button class="btn sm" data-act="rearm">Réarmer l\'AAR</button>':'')+'<button class="btn sm" id="awC">Fermer</button></div>';
  return h;
}
function aarRender(){
  const s=A.s, w=$('#aarw'); if(!s||!s.aars||!s.aars[AW.i]) { w.hidden=true; return; }
  const h=aarHTML(s,AW.i); if(w.dataset.h===h) return;
  const dt=w.querySelector('details'), op=dt&&dt.open;
  w.innerHTML=h; w.dataset.h=h; glossDom(w); if(op) w.querySelector('details').open=true;
  const on=(id,f)=>{ const e=document.getElementById(id); if(e) e.onclick=f; };
  on('awX',aarClose); on('awC',aarClose);
  on('awP',()=>{ AW.i=Math.max(0,AW.i-1); aarRender(); }); on('awN',()=>{ AW.i=Math.min(s.aars.length-1,AW.i+1); aarRender(); });
}
function aarOpen(i){ const s=A.s; if(!s||!s.aars||!s.aars.length) return toast('Aucun AAR pendant cette séance.'); AW.i=i==null?s.aars.length-1:i; const w=$('#aarw'); w.dataset.h=''; w.hidden=false; aarRender(); }
function aarClose(){ $('#aarw').hidden=true; }
function aarWatch(){
  const s=A.s, n=(s&&s.aars||[]).length;
  if(AW.s!==s){ AW.s=s; AW.n=n; aarClose(); return; }
  if(n>AW.n){ AW.n=n; if(!A.demo) aarOpen(n-1); }
  if(!$('#aarw').hidden) aarRender();
}

/* ================= Carte « En cours » ================= */
function runItems(s){
  const L=[]; const it=(k,t,b,b2)=>L.push({k,t,b,b2});
  if(s.is) it('r','Injection de sécurité : '+fmt(s.Qis,0)+' m³/h d\'eau borée',['isStop','','Arrêter l\'IS']);
  if(s.tripped) it('r','AAR — '+s.tripCause,['rearm','','Réarmer'],['aarWhy','','Pourquoi ?']);
  if(s.sebim) it('r','Soupapes SEBIM ouvertes');
  if(s.ilot) it('a','Îlotage : turbine sur les auxiliaires'+(s.grid?' · réseau revenu':''),s.grid?['recouple','','Recoupler']:null);
  if(s.coupled&&!s.ilot&&Math.abs(s.LtSet-s.Lt)>0.002) it('op','Charge '+fmt(s.Lt*100,1)+' → '+fmt(s.LtSet*100,0)+' % à '+s.ramp+' %/min · '+dur(Math.abs(s.LtSet-s.Lt)*100/s.ramp*60),['hold','','Maintenir']);
  const NM={SD:'Groupes d\'arrêt',G:'GCP',R:'Groupe R'};
  for(const b of ['SD','G','R']){ const r=s.rods[b]; if(!s.tripped&&Math.abs(r.tg-r.p)>0.4) it('op',NM[b]+' '+fmt(r.p,0)+' → '+fmt(r.tg,0)+' pas',['rodStopB',b,'Stop']); }
  if(!s.tripped&&s.coupled&&s.modeR==='auto'&&s.rAuto) it('auto','Groupe R en régulation automatique ('+fmt(s.rods.R.p,0)+' pas)');
  if(!s.tripped&&s.coupled&&s.modeG==='auto'&&Math.abs(calG(s.Lt)-s.rods.G.p)>0.6) it('auto','GCP vers leur position de calibrage ('+fmt(calG(s.Lt),0)+' pas)');
  if(s.rea.run&&!s.reaIsol) it('op',(s.rea.mode==='dil'?'Dilution ':'Borication ')+s.rea.q+' m³/h · '+fmt(s.rea.v*1000,0)+(s.rea.vt===Infinity?' L (continu)':' / '+fmt(s.rea.vt*1000,0)+' L · reste '+dur((s.rea.vt-s.rea.v)/s.rea.q*3600)),['reaStop','','Arrêter']);
  else if(s.Qdil>0) it('a','Débit d\'eau d\'appoint '+fmt(s.Qdil,0)+' m³/h');
  if(s.gct>0.02) it('auto','GCT-c ouvert '+fmt(s.gct/0.85*100,0)+' % (mode '+(s.coupled?'température':'pression')+')');
  if(s.qa>0.005) it(s.gctaMan>0?'op':'auto','GCT-a : '+fmt(s.qa*100,1)+' % de vapeur à l\'atmosphère',s.gctaMan>0?['gctaZero','','Fermer']:null);
  if(s.asg) it('auto','ASG en service ('+fmt(s.Wasg*100,1)+' %)',['asg','','Arrêter']);
  if(s.apd) it('op','Motopompe APD en service',['apd','','Arrêter']);
  if(s.areIsol&&!s.is) it('a','ARE isolée (niveau GV très haut)');
  if(!s.tripped&&s.coupled&&s.modeR==='man') it('op','Groupe R en manuel',['modeR','auto','Auto']);
  if(!s.tripped&&s.coupled&&s.modeG==='man') it('op','GCP en manuel',['modeG','auto','Auto']);
  if(s.areMode==='man') it('op','ARE en manuel : '+fmt(s.areMan*100,0)+' %',['areMode','auto','Auto']);
  if(s.sprayMode==='man') it('op','Aspersion manuelle : '+fmt(s.sprayMan*100,0)+' %',['sprayMode','auto','Auto']);
  if(s.heatMode!=='auto') it('op','Chaufferettes '+(s.heatMode==='on'?'forcées':'arrêtées'),['heatMode','auto','Auto']);
  if(s.chgMode==='man') it('op','Charge RCV manuelle : '+fmt(s.chgMan,1)+' m³/h',['chgMode','auto','Auto']);
  if(s.sprayIsol) it('op','Aspersion isolée',['sprayIsol','','Rétablir']);
  if(s.ldIsolMan) it('op','Décharge RCV isolée',['ldIsol','','Rétablir']); else if(s.Qld===0&&!s.is) it('auto','Décharge RCV isolée (niveau pressu bas)');
  if(s.reaIsol) it('op','Appoint REA isolé',['reaIsol','','Rétablir']);
  return L;
}
function updateRun(){
  const s=A.s; if(!s) return;
  const L=runItems(s);
  const lh=L.length?L.map(x=>'<div class="ri '+x.k+'"><span class="rdot"></span><span class="rt">'+x.t+'</span>'+[x.b2,x.b].map(b=>b?'<button class="btn sm" data-act="'+b[0]+'" data-v="'+b[1]+'">'+b[2]+'</button>':'').join('')+'</div>').join(''):'<div class="ri none">Aucune action en cours. Régulations en automatique.</div>';
  const el=$('#runList'); if(el&&el.dataset.h!==lh){ el.innerHTML=lh; el.dataset.h=lh; }
  const rk={r:0,a:1,i:2};
  const al=ALM.filter(([id])=>s.alarms[id]&&s.alarms[id].on).map(([id,lab,sev])=>({lab,sev,t:s.alarms[id].since,ack:s.alarms[id].ack})).sort((a,b)=>rk[a.sev]-rk[b.sev]||b.t-a.t);
  const ah=al.length?al.slice(0,6).map(x=>'<div class="ra '+x.sev+(x.ack?'':' nack')+'"><span class="tm">'+hms(x.t)+'</span>'+x.lab+'</div>').join('')+(al.length>6?'<div class="ra more">+ '+(al.length-6)+' autres</div>':''):'<div class="ra none">Aucune alarme.</div>';
  const ea=$('#runAl'); if(ea&&ea.dataset.h!==ah){ ea.innerHTML=ah; ea.dataset.h=ah; }
  const lg=s.log.slice(-3).reverse().map(l=>'<div><span class="tm">'+hms(l.t)+'</span><span class="'+l.type+'">'+l.txt+'</span></div>').join('');
  const er=$('#runLog'); if(er&&er.dataset.h!==lg){ er.innerHTML=lg; er.dataset.h=lg; }
}
function buildMini(){
  $('#mcharts').innerHTML=['pw','tp','pp','lv'].map(k=>{ const c=CH[k]; return '<div class="chart mini"><div class="ct"><span>'+c.t+'</span><span class="lg">'+c.s.map(x=>'<span style="color:var(--'+x[2]+')">'+x[1]+'</span>').join('')+'</span></div><canvas id="mc-'+k+'" role="img" aria-label="Courbe : '+c.t+'"></canvas></div>'; }).join('');
}
/* repli des cartes */
function initFold(){
  const F=store('fold')||{};
  $$('.card[data-c]').forEach(cd=>{
    const h2=cd.querySelector(':scope > h2'); if(!h2||h2.querySelector('.fold')) return;
    const b=document.createElement('button'); b.className='fold'; b.type='button'; b.setAttribute('aria-label','Replier ou déplier'); b.innerHTML='<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>';
    h2.appendChild(b);
    if(F[cd.dataset.c]) cd.classList.add('folded');
  });
}
function toggleFold(cd){ cd.classList.toggle('folded'); const F=store('fold')||{}; F[cd.dataset.c]=cd.classList.contains('folded')?1:0; store('fold',F); if(!cd.classList.contains('folded')){ setTimeout(()=>{ drawCharts(); drawDI(); drawPT(); },30); } }

/* ================= Tendances ================= */
let COL={};
function readCols(){ const cs=getComputedStyle(document.documentElement); for(const k of ['fg','mute','dim','line','accent','hot','cold','steam','feed','bore','warn','ok','crit','bg']) COL[k]=cs.getPropertyValue('--'+k).trim(); }
const CH={
  pw:{t:'Puissance (%)',s:[['pn','Nucléaire','hot'],['pt','Turbine','steam']],min:0},
  tp:{t:'Température moyenne (°C)',s:[['ta','Tmoy','hot'],['tr','Tref','mute']],span:4},
  pp:{t:'Pression pressuriseur (bar)',s:[['pp','Pression','accent']],span:4},
  lv:{t:'Niveaux (%)',s:[['lp','Pressu','bore'],['lg','GV','feed']],min:0,max:100},
  rd:{t:'Grappes (pas)',s:[['r','R','accent'],['g','GCP','warn']],min:0,max:225},
  cb:{t:'Bore (ppm)',s:[['cb','Cb','bore']],span:10},
  xe:{t:'Xénon (pcm)',s:[['xe','ρ Xe','feed']],span:100},
  di:{t:'ΔI (% PN)',s:[['di','ΔI','accent'],['dr','Réf.','mute']],span:4},
};
function buildCharts(){
  $('#chips').innerHTML=Object.entries(CH).map(([k,v])=>'<button class="chip'+(A.charts.includes(k)?' on':'')+'" data-ch="'+k+'">'+v.t.replace(/ \(.*\)/,'')+'</button>').join('');
  $('#charts').innerHTML=A.charts.map(k=>{ const c=CH[k]; return '<div class="chart"><div class="ct"><span>'+c.t+'</span><span class="lg">'+c.s.map(x=>'<span style="color:var(--'+x[2]+')">'+x[1]+'</span>').join('')+'</span></div><canvas id="ch-'+k+'" role="img" aria-label="Courbe : '+c.t+'"></canvas></div>'; }).join('');
}
$('#chips').addEventListener('click',e=>{ const b=e.target.closest('[data-ch]'); if(!b) return; const k=b.dataset.ch; A.charts=A.charts.includes(k)?A.charts.filter(x=>x!==k):Object.keys(CH).filter(x=>x===k||A.charts.includes(x)); store('charts',A.charts); buildCharts(); drawCharts(); });
function prepCanvas(cv){ const w=cv.clientWidth,h=cv.clientHeight; if(!w) return null; const dpr=window.devicePixelRatio||1; if(cv.width!==Math.round(w*dpr)){ cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr);} const g=cv.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,w,h); return {g,w,h}; }
function drawCharts(){ drawSet(A.charts,'ch-',A.win); drawSet(['pw','tp','pp','lv'],'mc-',A.mwin); }
function drawSet(keys,pre,win){
  const s=A.s; if(!s) return;
  const t1=s.t, t0=Math.max(0,t1-win);
  const H0=s.hist; let i0=0; { let lo=0,hi=H0.length; while(lo<hi){ const m=(lo+hi)>>1; if(H0[m].t<t0) lo=m+1; else hi=m; } i0=lo; }
  const pts=H0.slice(i0); const stepN=Math.max(1,Math.floor(pts.length/600));
  for(const k of keys){
    const cv=document.getElementById(pre+k); if(!cv) continue; const P=prepCanvas(cv); if(!P) continue; const {g,w,h}=P; const c=CH[k];
    let mn=Infinity,mx=-Infinity; for(let i=0;i<pts.length;i+=stepN) for(const sr of c.s){ const v=pts[i][sr[0]]; if(v<mn)mn=v; if(v>mx)mx=v; }
    if(!Number.isFinite(mn)){ mn=0; mx=1; }
    if(c.min!=null) mn=Math.min(mn,c.min); if(c.max!=null) mx=Math.max(mx,c.max);
    if(c.min!=null&&k==='pw') mx=Math.max(mx,10);
    const sp=c.span||1; if(mx-mn<sp){ const m=(mx+mn)/2; mn=m-sp/2; mx=m+sp/2; }
    const pad=(mx-mn)*0.08; if(c.max==null) mx+=pad; if(c.min==null) mn-=pad;
    const L=42,Rr=6,Tt=6,B=16, X=t=>L+(t-t0)/(Math.max(1,t1-t0))*(w-L-Rr), Y=v=>Tt+(1-(v-mn)/(mx-mn))*(h-Tt-B);
    g.font='10px '+getComputedStyle(document.body).getPropertyValue('--f-num'); g.fillStyle=COL.mute; g.strokeStyle=COL.line; g.lineWidth=1;
    for(let j=0;j<=3;j++){ const v=mn+(mx-mn)*j/3, y=Y(v); g.globalAlpha=.5; g.beginPath(); g.moveTo(L,y); g.lineTo(w-Rr,y); g.stroke(); g.globalAlpha=1; g.textAlign='right'; g.fillText(fmt(v,Math.abs(mx-mn)<10?1:0),L-4,y+3); }
    g.textAlign='left'; g.fillText('−'+dur(t1-t0),L,h-3); g.textAlign='right'; g.fillText(hms(t1),w-Rr,h-3);
    for(const sr of c.s){ g.strokeStyle=COL[sr[2]]; g.lineWidth=sr[2]==='mute'?1:1.8; g.setLineDash(sr[2]==='mute'?[4,3]:[]); g.beginPath(); let f=true; for(let i=0;i<pts.length;i+=stepN){ const p=pts[i]; const x=X(p.t),y=Y(clamp(p[sr[0]],mn,mx)); if(f){g.moveTo(x,y);f=false;} else g.lineTo(x,y);} g.stroke(); g.setLineDash([]);
      if(pts.length){ const p=pts[pts.length-1]; g.fillStyle=COL[sr[2]]; g.beginPath(); g.arc(X(p.t),Y(clamp(p[sr[0]],mn,mx)),2.6,0,7); g.fill(); } }
  }
}
function drawDI(){
  const s=A.s; if(!s) return; const cv=$('#c-di'); const P=prepCanvas(cv); if(!P) return; const {g,w,h}=P;
  const L=34,Rr=8,Tt=8,B=20, X=v=>L+(v+15)/30*(w-L-Rr), Y=p=>Tt+(1-p/110)*(h-Tt-B);
  g.font='10px '+getComputedStyle(document.body).getPropertyValue('--f-num');
  g.fillStyle=COL.feed; g.globalAlpha=.16; g.beginPath(); g.moveTo(X(-5),Y(0)); g.lineTo(X(-1.65-5),Y(110)); g.lineTo(X(-1.65+5),Y(110)); g.lineTo(X(5),Y(0)); g.closePath(); g.fill(); g.globalAlpha=1;
  g.strokeStyle=COL.feed; g.lineWidth=1; g.beginPath(); g.moveTo(X(-5),Y(0)); g.lineTo(X(-6.65),Y(110)); g.moveTo(X(5),Y(0)); g.lineTo(X(3.35),Y(110)); g.stroke();
  g.strokeStyle=COL.line; g.fillStyle=COL.mute;
  for(const v of [-15,-10,-5,0,5,10,15]){ const x=X(v); g.globalAlpha=.4; g.beginPath(); g.moveTo(x,Tt); g.lineTo(x,h-B); g.stroke(); g.globalAlpha=1; g.textAlign='center'; g.fillText(String(v).replace('-','−'),x,h-6); }
  for(const p of [0,50,100]){ const y=Y(p); g.textAlign='right'; g.fillText(p+' %',L-4,y+3); }
  const H0=s.hist; const n=Math.min(H0.length,3600); g.strokeStyle=COL.mute; g.globalAlpha=.6; g.beginPath(); for(let i=H0.length-n;i<H0.length;i+=10){ const q=H0[i]; const x=X(clamp(q.di,-15,15)),y=Y(clamp(q.pn,0,110)); i===H0.length-n?g.moveTo(x,y):g.lineTo(x,y);} g.stroke(); g.globalAlpha=1;
  const ok=Math.abs(s.DI+1.5*s.n)<=5; g.fillStyle=ok?COL.fg:COL.warn; g.beginPath(); g.arc(X(clamp(s.DI,-15,15)),Y(clamp(s.n*100,0,110)),4.5,0,7); g.fill();
}

