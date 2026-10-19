/* Local civil-date scheduling. Separate from the optional 40-day journey. */
(function(root){
'use strict';
const data=root.MOPAnnualContent||(typeof require==='function'?require('./annual-content.js'):null);
const pad=n=>String(n).padStart(2,'0');
function key(date){return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;}
function fromKey(value){
 const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));if(!m)return null;
 const date=new Date(+m[1],+m[2]-1,+m[3],12);
 return key(date)===value?date:null;
}
function addDays(date,amount){return new Date(date.getFullYear(),date.getMonth(),date.getDate()+amount,12);}
// Gregorian computus for Western Easter; civil dates avoid DST duration arithmetic.
function easter(year){
 const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4;
 const f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30;
 const i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
 const n=h+l-7*m+114;return new Date(year,Math.floor(n/31)-1,n%31+1,12);
}
const schedules=new Map();
function schedule(year){
 if(schedules.has(year))return schedules.get(year);
 const map=new Map(data.entries.map(entry=>[`${year}-${entry.id}`,entry]));
 if(new Date(year,1,29).getMonth()===1)map.set(`${year}-02-29`,data.leap);
 const seasonal=data.entries.filter(entry=>entry.id>='03-01'&&entry.id<='04-16');
 const source=seasonal.map(entry=>`${year}-${entry.id}`),sunday=easter(year);
 const target=seasonal.map((_,i)=>key(addDays(sunday,i-46)));
 const union=[...new Set([...source,...target])].sort();
 const sourceSet=new Set(source),targetSet=new Set(target);
 const displaced=union.filter(k=>!sourceSet.has(k)).map(k=>map.get(k));
 const free=union.filter(k=>!targetSet.has(k));
 free.forEach((k,i)=>map.set(k,displaced[i]));
 target.forEach((k,i)=>map.set(k,seasonal[i]));
 const result=Object.freeze([...map.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([date,entry])=>{
  const index=target.indexOf(date);let season='';
  if(index>=0)season=index===46?'Easter Sunday':index>=39?'Holy Week':'Lent';
  else if(date.slice(5,7)==='12')season=date.slice(8)<='24'?'Advent':'Christmas';
  return Object.freeze({...entry,date,season});
 }));
 schedules.set(year,result);return result;
}
function forDate(date=new Date()){
 if(!(date instanceof Date)||Number.isNaN(date.getTime()))throw new Error('A valid local date is required.');
 return schedule(date.getFullYear()).find(entry=>entry.date===key(date));
}
const api=Object.freeze({key,fromKey,addDays,easter,schedule,forDate});root.MOPCalendar=api;
if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
