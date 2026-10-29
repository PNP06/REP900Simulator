/* Outils communs : sélecteurs, bornes, formats d'affichage. */
'use strict';
const $=q=>document.querySelector(q), $$=q=>[...document.querySelectorAll(q)];
const clamp=(x,a,b)=>x<a?a:x>b?b:x;
const fmt=(x,d=1)=>Number.isFinite(x)?(Math.abs(x)<0.5*Math.pow(10,-d)?0:x).toFixed(d).replace('.',',').replace('-','−'):'—';
const sgn=(x,d=0)=>(x>0?'+':'')+fmt(x,d);
function sci(x,d=1){ if(!(x>0)) return '0'; const e=Math.floor(Math.log10(x)); const m=x/Math.pow(10,e); return fmt(m,d)+'·10<sup>'+e+'</sup>'; }
function hms(t){ t=Math.max(0,Math.floor(t)); const d=Math.floor(t/86400); t%=86400; const h=String(Math.floor(t/3600)).padStart(2,'0'), m=String(Math.floor(t/60)%60).padStart(2,'0'), s=String(t%60).padStart(2,'0'); return (d?('J+'+d+' '):'')+h+':'+m+':'+s; }
function dur(t){ t=Math.round(t); if(t<60) return t+' s'; const m=Math.floor(t/60), s=t%60; if(m<60) return m+' min '+String(s).padStart(2,'0'); return Math.floor(m/60)+' h '+String(m%60).padStart(2,'0'); }
function store(k,v){ try{ if(v===undefined){ return JSON.parse(localStorage.getItem('rep900-'+k)); } localStorage.setItem('rep900-'+k,JSON.stringify(v)); }catch(e){ return null; } }
