/* Men of Purpose: original theme curation; licensed services host all music. */
(function (root) {
  'use strict';
  const songs = [
    {id:'altar',title:'Altar',artist:'Hulvey & Forrest Frank',style:'Christian hip-hop / worship',url:'https://music.apple.com/us/song/1676355606',service:'Apple Music',connection:'An invitation to surrender and bring your whole life before God.'},
    {id:'good-day',title:'GOOD DAY',artist:'Forrest Frank',style:'Christian pop / praise',url:'https://music.apple.com/us/song/1729877847',service:'Apple Music',connection:'A prompt to practice gratitude and notice God’s goodness in ordinary life.'},
    {id:'trust',title:'Trust In God',artist:'Elevation Worship feat. Chris Brown',style:'Worship',url:'https://music.apple.com/us/song/1680569028',service:'Apple Music',connection:'A reminder to place your confidence in God through uncertainty.'},
    {id:'praise',title:'Praise',artist:'Elevation Worship feat. Brandon Lake, Chris Brown & Chandler Moore',style:'Praise',url:'https://music.apple.com/us/song/1680569035',service:'Apple Music',connection:'A prompt to turn your attention toward God in praise.'}
  ];
  const months = [
    {title:'Made New in Christ',ref:'2 Corinthians 5:17',focus:'Begin again with grace, and practice the choices of a renewed life.',song:'altar'},
    {title:'Love That Serves',ref:'John 13:34–35',focus:'Let Christ’s love shape your relationships through patient, practical care.',song:'altar'},
    {title:'Rooted in Prayer',ref:'Philippians 4:6–7',focus:'Bring your needs to God with thanksgiving, and make room to listen.',song:'trust'},
    {title:'Living Hope',ref:'1 Peter 1:3–5',focus:'Remember the living hope of Jesus’ resurrection amid everyday challenges.',song:'praise'},
    {title:'Faithful in the Everyday',ref:'Colossians 3:17',focus:'Let ordinary words and work become opportunities to honor Christ.',song:'good-day'},
    {title:'Leading Through Service',ref:'Mark 10:42–45',focus:'Follow Jesus’ example by serving people rather than seeking status.',song:'altar'},
    {title:'Freedom to Walk in Love',ref:'Galatians 5:13–14',focus:'Use your freedom in Christ to serve others through love.',song:'praise'},
    {title:'Wisdom for the Next Step',ref:'James 1:5',focus:'Ask God for wisdom and seek counsel before making important choices.',song:'trust'},
    {title:'Growing Together',ref:'Hebrews 10:24–25',focus:'Encourage one another toward love, good works, and faithful community.',song:'good-day'},
    {title:'Courageous Faith',ref:'2 Timothy 1:7–8',focus:'Face responsibility with God-given love, courage, and self-control.',song:'trust'},
    {title:'A Life of Gratitude',ref:'1 Thessalonians 5:16–18',focus:'Practice prayer and gratitude in every circumstance, including hard days.',song:'good-day'},
    {title:'Christ, Our Hope',ref:'Luke 2:10–11',focus:'Celebrate the Savior’s coming and share His good news through love.',song:'praise'}
  ];
  // Editorial pairings for the existing 40-day journey, separate from Scripture text.
  const daySongs = ['altar','altar','trust','altar','trust','trust','praise','altar','trust','good-day','altar','altar','altar','altar','trust','trust','altar','trust','altar','altar','altar','trust','altar','good-day','trust','trust','good-day','trust','altar','altar','good-day','trust','altar','trust','altar','trust','praise','good-day','altar','trust'];
  function calendarKey(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`; }
  function dailyKey(date) { return `${calendarKey(date)}-${String(date.getDate()).padStart(2,'0')}`; }
  function themeFor(date) { return months[date.getMonth()]; }
  function songFor(day,date) {
    const valid=Number.isInteger(day)&&day>=1&&day<=40;
    return songs.find(song=>song.id===(valid?daySongs[day-1]:themeFor(date).song));
  }
  const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function read(key) { try {return root.localStorage.getItem(key);} catch {return null;} }
  let sessionDismissed='';
  function dismissMonth(key) {
    sessionDismissed=key;
    try {root.localStorage.setItem('mop-month-welcome-dismissed',key);} catch { /* session dismissal remains available */ }
    root.document.getElementById('mop-month-welcome')?.remove();
  }
  function songMarkup(day,date,theme,reference) {
    const song=songFor(day,date);
    const context=theme?`Pairs with ${theme}${reference?' · '+reference:''}.`:`Pairs with this month’s focus: ${themeFor(date).title}.`;
    return `<section class="card mop-worship" id="mop-daily-song" aria-labelledby="mop-song-title"><div class="eyebrow">Song for your devotional</div><h3 id="mop-song-title">${escape(song.title)}</h3><p class="mop-artist">${escape(song.artist)}</p><span class="pill">${escape(song.style)}</span><p>${escape(song.connection)}</p><p class="muted">${escape(context)}</p><a class="btn mop-listen" href="${escape(song.url)}" target="_blank" rel="noopener noreferrer">Listen on ${escape(song.service)} <span aria-hidden="true">↗</span><span class="sr-only"> (opens a new tab)</span></a><p class="notice">Music opens on the streaming service and needs an internet connection. Availability and subscriptions vary. Scripture guides our teaching; songs are optional companions.</p></section>`;
  }
  function enhance(options={}) {
    const document=root.document;
    if(!document)return;
    const content=document.getElementById('content');
    if(!content)return;
    content.querySelectorAll('[data-mop-experience]').forEach(el=>el.remove());
    const now=options.date||new Date(),theme=themeFor(now),key=calendarKey(now);
    if(options.screen==='home') {
      const section=document.createElement('div');section.dataset.mopExperience='monthly';
      const show=sessionDismissed!==key&&read('mop-month-welcome-dismissed')!==key;
      const monthName=now.toLocaleDateString(undefined,{month:'long'});
      section.innerHTML=(show?`<section class="mop-month-welcome" id="mop-month-welcome" aria-labelledby="mop-welcome-title"><div class="row"><span class="eyebrow">A new month of purpose</span><button type="button" class="mop-dismiss" aria-label="Dismiss ${escape(monthName)} welcome">×</button></div><h3 id="mop-welcome-title">Welcome to ${escape(monthName)}.</h3><p>Start this month with God, one faithful step at a time.</p></section>`:'')+`<section class="card mop-month-focus" aria-labelledby="mop-month-title"><div class="eyebrow">${escape(monthName)} · Monthly focus</div><h3 id="mop-month-title">${escape(theme.title)}</h3><p>${escape(theme.focus)}</p><p class="muted">Read ${escape(theme.ref)} in context.</p></section>`;
      section.querySelector('.mop-dismiss')?.addEventListener('click',()=>dismissMonth(key));
      content.prepend(section);
    }
    if(options.screen==='home'||options.screen==='reader') {
      const section=document.createElement('div');section.dataset.mopExperience='worship';
      section.innerHTML=songMarkup(options.day,now,options.theme,options.reference);
      content.append(section);
    }
  }
  const api={songs,months,daySongs,calendarKey,dailyKey,themeFor,songFor,songMarkup,enhance};
  root.MOPExperience=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
  // Refresh only when the open app crosses a local calendar day; no background scheduling.
  if(root.document&&root.addEventListener) {
    let dateKey=dailyKey(new Date());
    function refresh(){const next=dailyKey(new Date());if(next!==dateKey){dateKey=next;if(typeof root.render==='function')root.render();}}
    root.document.addEventListener('visibilitychange',()=>{if(root.document.visibilityState==='visible')refresh();});
    root.addEventListener('focus',refresh);
  }
})(typeof window!=='undefined'?window:globalThis);
