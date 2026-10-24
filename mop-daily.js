/* Daily calendar UI uses existing scoped journal and reading-date storage. */
(function(root){
'use strict';
const calendar=root.MOPDailyPlan;
let activeDate=calendar.key(new Date());
let browseMonth=new Date().getMonth();
let browseYear=new Date().getFullYear();
function dateLabel(date){return date.toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'});}
function entry(){return calendar.forDate(calendar.fromKey(activeDate));}
function open(value){
 const date=calendar.fromKey(value||calendar.key(new Date()));if(!date)return;
 activeDate=calendar.key(date);screen='daily';render();
}
function browse(){browseMonth=new Date().getMonth();browseYear=new Date().getFullYear();screen='calendar';render();}
function monthTitle(date){return root.MOPExperience.themeFor(date).title;}
function homeCard(){
 const now=new Date(),d=calendar.forDate(now);
 return `<section class="card" id="daily-devotional-card"><div class="eyebrow">Today’s devotional · ${esc(now.toLocaleDateString(undefined,{month:'long',day:'numeric'}))}</div><p class="pill">${esc(d.season||monthTitle(now))}</p><h2>${esc(d.title)}</h2><p class="muted">${esc(root.MOPDevotionalTools.mainRef(d.ref))} · WEB</p><p>A new reading for each local calendar day.</p><button class="btn full" onclick="MOPDaily.open()">Start today’s devotional →</button><button class="btn alt" onclick="MOPDaily.browse()">Browse by month</button></section>`;
}
function renderCalendar(){
 const monthDate=new Date(browseYear,browseMonth,1,12),entries=calendar.schedule(browseYear).filter(d=>Number(d.date.slice(5,7))===browseMonth+1);
 content.innerHTML=`<div class="eyebrow">A year of purpose · ${browseYear}</div><h2>Daily devotionals</h2><p>The Biblical Commands series runs October 12–November 20, 2026. Monthly themes follow Day 40. Every year has 365 distinct daily readings, plus an extra reading in leap years. Lent and Easter follow the Western Christian calendar.</p><label for="daily-month">Choose a month</label><select id="daily-month">${root.MOPExperience.months.map((m,i)=>`<option value="${i}" ${i===browseMonth?'selected':''}>${new Date(browseYear,i,1).toLocaleDateString(undefined,{month:'long'})} · ${esc(m.title)}</option>`).join('')}</select><div class="toolbar"><button class="btn alt" id="calendar-prev">← Previous month</button><button class="btn alt" id="calendar-next">Next month →</button><button class="btn" onclick="MOPDaily.open()">Today</button></div><h3>${esc(monthTitle(monthDate))}</h3>${entries.map(d=>`<section class="card"><div class="eyebrow">${esc(d.date)}${d.season?' · '+esc(d.season):''}</div><h3>${esc(d.title)}</h3><p class="muted">${esc(root.MOPDevotionalTools.mainRef(d.ref))}${get('readingDates',[]).includes(d.date)?' · Bible opened':''}</p><button class="btn alt" data-daily-date="${d.date}">Read devotional</button></section>`).join('')}`;
 document.getElementById('daily-month').onchange=e=>{browseMonth=Number(e.target.value);render();};
 for(const [id,delta] of [['calendar-prev',-1],['calendar-next',1]])document.getElementById(id).onclick=()=>{const date=new Date(browseYear,browseMonth+delta,1,12);browseMonth=date.getMonth();browseYear=date.getFullYear();render();};
 content.querySelectorAll('[data-daily-date]').forEach(button=>button.onclick=()=>open(button.dataset.dailyDate));
}
function renderReader(){
 const d=entry(),date=calendar.fromKey(activeDate),id='reflection-calendar-'+activeDate,saved=journal().find(e=>e.id===id);
 content.innerHTML=`<button class="btn alt" onclick="MOPDaily.browse()">← Monthly devotionals</button><div class="eyebrow section-title">${esc(dateLabel(date))}</div><p class="pill">${esc(d.season||monthTitle(date))}</p><p class="notice">Original devotional · English editorial draft</p><h2>${esc(d.title)}</h2><section class="card"><h3>Read God’s Word</h3><p>${esc(root.MOPDevotionalTools.mainRef(d.ref))} · World English Bible</p><div id="devotionalBible"></div><p class="muted">Optional context: ${esc(d.context)}</p><div class="toolbar"><button class="btn alt" onclick="setFont(-2)">A−</button><button class="btn alt" onclick="setFont(2)">A+</button><span id="fontLabel">${get('fontSize',18)}px</span></div></section><section class="card devotional-copy" lang="en" translate="no"><div class="eyebrow">Devotional message</div>${d.body.split('\n\n').map(paragraph=>`<p>${esc(paragraph)}</p>`).join('')}</section><section class="card devotional-copy" lang="en" translate="no"><h3>Personal reflection</h3><ol>${d.questions.map(q=>`<li><p>${esc(q)}</p></li>`).join('')}</ol><label for="dailyReflection">My thoughts and prayers</label><textarea id="dailyReflection">${esc(saved?.text||'')}</textarea><p class="notice">Save your reflection before leaving this reading.</p><button class="btn" id="daily-save">Save reflection</button><p id="daily-save-status" role="status"></p></section><section class="card devotional-copy" lang="en" translate="no"><div class="eyebrow">Brotherhood challenge</div><p>${esc(d.challenge)}</p><h3>Closing prayer</h3><p>${esc(d.prayer)}</p></section><div class="toolbar"><button class="btn alt" id="daily-prev">← Previous date</button><button class="btn alt" id="daily-next">Next date →</button><button class="btn alt" id="daily-share">Share encouragement</button></div>`;
 document.getElementById('daily-save').onclick=save;
 document.getElementById('daily-prev').onclick=()=>open(calendar.key(calendar.addDays(date,-1)));
 document.getElementById('daily-next').onclick=()=>open(calendar.key(calendar.addDays(date,1)));
 document.getElementById('daily-share').onclick=()=>shareText(`MEN OF PURPOSE — ${activeDate}\n${d.title}\nRead ${d.ref} (WEB).\n${location.href}`);
 root.MOPDevotionalTools.enhance(d);
 root.MOPExperience.enhance({screen:'reader',day:0,date,theme:d.title,reference:d.ref});
 loadBible(d.ref,'devotionalBible');
}
function save(){
 const field=document.getElementById('dailyReflection'),status=document.getElementById('daily-save-status'),text=field.value.trim();
 if(!text){status.textContent='Write a reflection before saving.';return;}
 const d=entry(),id='reflection-calendar-'+activeDate,all=journal(),previous=all.find(e=>e.id===id);
 const saved={id,date:previous?.date||new Date().toISOString(),updatedAt:new Date().toISOString(),text,answered:previous?.answered||false,theme:d.title,devotionalDate:activeDate,devotionalId:d.id};
 try{put('journalEntries',[saved,...all.filter(e=>e.id!==id)]);root.MOPUpdates?.markSaved('dailyReflection');status.textContent='Reflection saved in your private journal.';}
 catch{status.textContent='Could not save. Copy your writing somewhere safe before leaving.';}
}
root.MOPDaily={open,browse,homeCard,renderCalendar,renderReader};
})(window);
