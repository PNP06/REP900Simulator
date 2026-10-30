/* Domaine pression-température du primaire (« chaussette »). */
'use strict';

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
