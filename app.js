/* PharmaQuest — static, GitHub Pages-ready pharmacist MCQ practice app. */
(() => {
  'use strict';
  const STORE_KEY = 'pharmaquest.v1';
  const EXCLUDED_FLAGS = new Set(['image_needed','incomplete_question','duplicate_options','answer_conflicts_poll','needs_human_answer','answer_low_confidence']);
  const LETTERS = ['A','B','C','D','E','F','G','H'];
  const SUBJECT_ICONS = ['🧠','⚗️','🌿','🫀','🧬','🧪','🔬','🦠','🧫','⚖️','🏭','📊','💊','🧬','☠️','🏪','🩺','🏥','🩹','⚛️','📚'];
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const todayKey = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const dateLabel = new Intl.DateTimeFormat('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());
  const fmtInt = n => new Intl.NumberFormat('en-IN').format(n || 0);
  const pct = (n,d) => d ? Math.round(n/d*100) : 0;
  const shuffle = arr => { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
  const defaults = () => ({dailyTarget:25,theme:'light',includeFlagged:false,progress:{},bookmarks:[],dailyLogs:{},dailyPlans:{},lastPage:'dashboard'});
  function readStore(){
    try { const s=JSON.parse(localStorage.getItem(STORE_KEY)||'null'); return {...defaults(),...(s||{}),progress:s?.progress||{},dailyLogs:s?.dailyLogs||{},dailyPlans:s?.dailyPlans||{},bookmarks:s?.bookmarks||[]}; }
    catch { return defaults(); }
  }
  const store=readStore();
  const appState={manifest:null,loaded:new Map(),questionIndex:new Map(),page:'dashboard',reviewTab:'wrong',session:null,result:null,subjectSearch:'',busy:false,timer:null,sidebarOpen:false,toastTimer:null};

  function persist(){
    try { localStorage.setItem(STORE_KEY,JSON.stringify(store)); }
    catch(err){ toast('Browser storage is full. Export a backup and clear old progress.'); }
  }
  function setTheme(){document.documentElement.dataset.theme=store.theme==='dark'?'dark':'light';}
  setTheme();
  function getManifestSubject(slug){return appState.manifest?.subjects.find(s=>s.slug===slug);}
  function isAnswerable(q){return Number.isInteger(q.answer)&&q.answer>=0&&q.answer<(q.options||[]).length&&(q.options||[]).length>=2;}
  function isAllowed(q){if(!isAnswerable(q))return false;return store.includeFlagged||!(q.flags||[]).some(f=>EXCLUDED_FLAGS.has(f));}
  function filteredQuestions(arr){return (arr||[]).filter(isAllowed);}
  function getLoadedQuestions(){return [...appState.loaded.values()].flat();}
  function todayLog(){return store.dailyLogs[todayKey()]||[];}
  function streakCount(){
    let d=new Date(); if(!(store.dailyLogs[todayKey(d)]||[]).length) d.setDate(d.getDate()-1);
    let count=0; while((store.dailyLogs[todayKey(d)]||[]).length){count++;d.setDate(d.getDate()-1);} return count;
  }
  function accuracy(){let a=0,c=0;for(const p of Object.values(store.progress)){a+=p.attempts||0;c+=p.correct||0;}return pct(c,a);}
  function attemptedTotal(){return Object.values(store.progress).reduce((n,p)=>n+(p.attempts||0),0);}
  function correctTotal(){return Object.values(store.progress).reduce((n,p)=>n+(p.correct||0),0);}
  function dailyUniqueCount(){return todayLog().length;}
  function currentWeek(){const days=[];const now=new Date();for(let i=6;i>=0;i--){const d=new Date(now);d.setDate(now.getDate()-i);days.push({key:todayKey(d),label:new Intl.DateTimeFormat('en-IN',{weekday:'short'}).format(d)});}return days;}
  function getSubjectAccuracy(slug){let tries=0,correct=0;const subject=getManifestSubject(slug);for(const p of Object.values(store.progress)){if(subject&&p.subject===subject.name){tries+=p.attempts||0;correct+=p.correct||0;}}return {tries,correct,accuracy:pct(correct,tries)};}
  function setPage(page){appState.page=page;store.lastPage=page;persist();appState.sidebarOpen=false;render();if(page==='review')ensureAll().then(()=>{if(appState.page==='review')render();});}
  function iconFor(i){return SUBJECT_ICONS[i%SUBJECT_ICONS.length];}
  function toast(message){let el=$('#toast');if(!el){el=document.createElement('div');el.className='toast';el.id='toast';document.body.append(el);}el.textContent=message;el.classList.add('show');clearTimeout(appState.toastTimer);appState.toastTimer=setTimeout(()=>el.classList.remove('show'),2600);}
  function busy(show,title='Loading your question bank',detail='Fetching the selected subjects…'){
    appState.busy=show;let el=$('#pq-loading');if(show){if(!el){el=document.createElement('div');el.className='loading-overlay';el.id='pq-loading';el.innerHTML=`<div class="loading-card"><strong class="loading-title"></strong><p class="loading-detail"></p><div class="spinner"><span></span></div></div>`;document.body.append(el);}$('.loading-title',el).textContent=title;$('.loading-detail',el).textContent=detail;}
    else if(el)el.remove();
  }
  async function loadSubject(subject){
    if(appState.loaded.has(subject.slug))return appState.loaded.get(subject.slug);
    const response=await fetch(`./${subject.path}`);
    if(!response.ok)throw new Error(`Could not load ${subject.name} (${response.status}).`);
    const questions=await response.json();appState.loaded.set(subject.slug,questions);for(const q of questions)appState.questionIndex.set(q.id,q);return questions;
  }
  async function loadAllSubjects(){
    const todo=appState.manifest.subjects.filter(s=>!appState.loaded.has(s.slug));
    if(!todo.length)return getLoadedQuestions();
    busy(true,'Preparing the full question bank',`Loading ${todo.length} remaining subjects. This is only needed for mixed practice and review.`);
    try {let done=0;const jobs=todo.map(async s=>{const res=await fetch(`./${s.path}`);if(!res.ok)throw new Error(`Could not load ${s.name}.`);const rows=await res.json();appState.loaded.set(s.slug,rows);for(const q of rows)appState.questionIndex.set(q.id,q);done++;const el=$('.loading-detail');if(el)el.textContent=`Loaded ${done} of ${todo.length} subjects…`;});await Promise.all(jobs);return getLoadedQuestions();}
    finally{busy(false);}
  }
  function subjectPools(){return appState.manifest.subjects.map(s=>({subject:s,questions:filteredQuestions(appState.loaded.get(s.slug)||[])})).filter(x=>x.questions.length);}
  function balancedMix(count){
    const pools=subjectPools().map(x=>({slug:x.subject.slug,rows:shuffle(x.questions),pos:0}));
    if(!pools.length)return [];
    const picked=[];let cursor=0,stalled=0;
    while(picked.length<count&&stalled<pools.length){const p=pools[cursor%pools.length];if(p.pos<p.rows.length){picked.push(p.rows[p.pos++]);stalled=0;}else stalled++;cursor++;}
    return shuffle(picked);
  }
  function questionById(id){return appState.questionIndex.get(id)||null;}
  async function ensureAll(){try{await loadAllSubjects();return true;}catch(e){toast(e.message);return false;}}
  function makeSession(items,{mode='practice',title='Practice session',minutes=0}={}){
    const prepared=items.filter(isAllowed);
    if(!prepared.length){toast('No answerable questions were found for this selection.');return;}
    stopTimer();appState.result=null;
    appState.session={items:prepared,index:0,mode,title,picks:{},checked:{},reviewLater:{},startedAt:Date.now(),minutes,deadline:minutes?Date.now()+minutes*60000:null};
    setPage('practice');startTimer();
  }
  async function startDaily(){
    if(!await ensureAll())return;
    const key=todayKey();let plan=store.dailyPlans[key];
    if(!Array.isArray(plan)||!plan.length){const items=balancedMix(Math.max(5,Math.min(100,Number(store.dailyTarget)||25)));plan=items.map(q=>({id:q.id,subject:q.subject}));store.dailyPlans[key]=plan;persist();}
    let questions=plan.map(p=>questionById(p.id)).filter(q=>q&&isAllowed(q));
    if(!questions.length){questions=balancedMix(Math.max(5,Number(store.dailyTarget)||25));store.dailyPlans[key]=questions.map(q=>({id:q.id,subject:q.subject}));persist();}
    makeSession(questions,{mode:'practice',title:'Your daily mixed practice'});
  }
  async function startAllRandom(count=25,mode='practice',minutes=0){
    if(!await ensureAll())return;
    const pool=balancedMix(count);makeSession(pool,{mode,title:mode==='exam'?'Timed mock test':'Mixed practice',minutes});
  }
  async function startSubject(slug,{topic=null,count=100,mode='practice',minutes=0}={}){
    const subject=getManifestSubject(slug);if(!subject)return;
    try{busy(true,`Loading ${subject.name}`,`Preparing questions${topic?` for ${topic}`:''}…`);const rows=await loadSubject(subject);busy(false);const pool=filteredQuestions(rows).filter(q=>!topic||q.topic===topic);makeSession(shuffle(pool).slice(0,count),{mode,title:topic?`${subject.name} · ${topic}`:subject.name,minutes});}
    catch(e){busy(false);toast(e.message);}
  }
  async function startWrong(){
    if(!await ensureAll())return;
    const ids=Object.entries(store.progress).filter(([,p])=>(p.incorrect||0)>0).sort((a,b)=>(b[1].lastMiss||'').localeCompare(a[1].lastMiss||'')).map(([id])=>id);
    const items=ids.slice(0,100).map(questionById).filter(q=>q&&isAllowed(q));
    if(!items.length){toast('No missed questions yet. Your incorrect answers will appear here.');return;}
    makeSession(shuffle(items),{mode:'practice',title:'Review missed questions'});
  }
  async function startBookmarks(){
    if(!await ensureAll())return;
    const items=store.bookmarks.slice(0,100).map(questionById).filter(q=>q&&isAllowed(q));
    if(!items.length){toast('No bookmarked questions yet.');return;}
    makeSession(shuffle(items),{mode:'practice',title:'Bookmarked questions'});
  }
  function recordAnswer(q,selected){
    const key=todayKey();const p=store.progress[q.id]||{attempts:0,correct:0,incorrect:0};
    p.attempts=(p.attempts||0)+1;const good=selected===q.answer;
    if(good)p.correct=(p.correct||0)+1;else{p.incorrect=(p.incorrect||0)+1;p.lastMiss=key;}
    p.lastCorrect=good;p.lastSeen=key;p.lastSelected=selected;p.subject=q.subject;p.topic=q.topic||'General';store.progress[q.id]=p;
    const log=store.dailyLogs[key]||(store.dailyLogs[key]=[]);if(!log.includes(q.id))log.push(q.id);
    persist();
  }
  function stopTimer(){if(appState.timer){clearInterval(appState.timer);appState.timer=null;}}
  function clockString(seconds){const s=Math.max(0,Math.floor(seconds));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
  function startTimer(){stopTimer();if(!appState.session)return;appState.timer=setInterval(()=>{const s=appState.session;if(!s)return;const el=$('#session-clock');if(s.deadline){const rem=Math.max(0,Math.ceil((s.deadline-Date.now())/1000));if(el)el.textContent=clockString(rem);if(rem<=0){finishSession(true);}}else{const elapsed=Math.floor((Date.now()-s.startedAt)/1000);if(el)el.textContent=clockString(elapsed);}},1000);}
  function submitPractice(){const s=appState.session;if(!s)return;const i=s.index,q=s.items[i],selected=s.picks[i];if(!Number.isInteger(selected)){toast('Choose an option before submitting.');return;}if(s.checked[i])return;s.checked[i]=true;recordAnswer(q,selected);render();}
  function goNext(){const s=appState.session;if(!s)return;if(s.mode==='practice'&&!s.checked[s.index]&&Number.isInteger(s.picks[s.index])){toast('Submit your selected answer, or skip this question.');return;}if(s.index<s.items.length-1){s.index++;render();}else finishSession(false);}
  function goPrevious(){const s=appState.session;if(s&&s.index>0){s.index--;render();}}
  function finishSession(timeUp=false){
    const s=appState.session;if(!s)return;stopTimer();
    if(s.mode==='exam'){
      for(let i=0;i<s.items.length;i++){if(Number.isInteger(s.picks[i]))recordAnswer(s.items[i],s.picks[i]);}
    }
    let correct=0,wrong=0,unanswered=0;
    const detail=s.items.map((q,i)=>{const picked=s.picks[i];const answered=Number.isInteger(picked);const good=answered&&picked===q.answer;if(good)correct++;else if(answered)wrong++;else unanswered++;return {q,picked,answered,good};});
    appState.result={title:s.title,mode:s.mode,detail,correct,wrong,unanswered,total:s.items.length,seconds:Math.round((Date.now()-s.startedAt)/1000),timeUp};
    appState.session=null;appState.page='results';render();
  }
  function toggleBookmark(q){const i=store.bookmarks.indexOf(q.id);if(i>=0)store.bookmarks.splice(i,1);else store.bookmarks.push(q.id);persist();}
  function dailyGoalMarkup(){const n=dailyUniqueCount(),t=Number(store.dailyTarget)||25;return `<div class="daily-mini"><div class="daily-mini-top"><span>Daily target</span><strong>${Math.min(n,t)} / ${t}</strong></div><div class="daily-mini-sub">${n>=t?'Goal reached. Nice work!':`${t-n} more unique questions to hit your goal.`}</div><div class="mini-track"><span style="width:${Math.min(100,pct(n,t))}%"></span></div></div>`;}
  function shell(content){
    const pageNames={dashboard:'Dashboard','subjects':'Question bank','practice':'Practice session','review':'Review centre','analytics':'Performance','settings':'Settings','results':'Session result'};
    return `<div class="layout">
      <aside class="sidebar ${appState.sidebarOpen?'open':''}" id="sidebar">
        <div class="brand"><div class="brand-mark">P<span>+</span></div><div><div class="brand-name">PharmaQuest</div><div class="brand-tag">Pharmacist exam lab</div></div></div>
        <div class="nav-label">Study space</div><nav class="nav-list" aria-label="Main navigation">
          ${navItem('dashboard','◫','Dashboard')}${navItem('subjects','▦','Question bank')}${navItem('review','◉','Review centre',store.bookmarks.length)}
        </nav>
        <div class="nav-label" style="margin-top:14px">Your progress</div><nav class="nav-list">${navItem('analytics','↗','Performance')}${navItem('settings','⚙','Settings')}</nav>
        <div class="sidebar-bottom">${dailyGoalMarkup()}<div class="sidebar-foot">Built for focused pharmacist exam preparation.<br>Progress stays in this browser.</div></div>
      </aside>
      <main class="main-wrap">
        <header class="topbar"><div style="display:flex;align-items:center;gap:12px"><button class="icon-btn mobile-menu" data-action="menu" aria-label="Open menu">☰</button><div class="crumb">PharmaQuest <span style="color:#bac3bb">/</span> <strong>${esc(pageNames[appState.page]||'Study')}</strong></div></div><div class="top-actions"><button class="icon-btn" data-action="theme" title="Toggle theme" aria-label="Toggle theme">${store.theme==='dark'?'☀':'☾'}</button><div class="profile-chip"><div class="profile-avatar">PQ</div><div class="profile-copy">Study mode<small>Personal workspace</small></div></div></div></header>
        <div class="page">${content}<div class="footer-note">PharmaQuest · Your progress is stored locally on this device</div></div>
      </main>
    </div><div class="toast" id="toast" role="status" aria-live="polite"></div>`;
  }
  function navItem(page,ico,label,count){return `<button class="nav-item ${appState.page===page?'active':''}" data-action="nav" data-page="${page}"><span class="nav-icon">${ico}</span><span>${label}</span>${count?`<span class="nav-count">${count}</span>`:''}</button>`;}
  function pageHeading(eyebrow,title,subtitle,action=''){return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1 class="page-title">${title}</h1><p class="page-subtitle">${subtitle}</p></div>${action}</div>`;}
  function renderDashboard(){
    const greeting=new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening';
    const ready=appState.manifest.readyDefault;const goal=Number(store.dailyTarget)||25;const done=dailyUniqueCount();const week=currentWeek();const max=Math.max(1,...week.map(d=>(store.dailyLogs[d.key]||[]).length));
    const bars=week.map(d=>{const n=(store.dailyLogs[d.key]||[]).length;return `<div class="chart-day"><div class="chart-bar-track"><div class="chart-bar ${d.key===todayKey()?'today':''}" style="height:${Math.max(3,pct(n,max))}%" title="${n} questions"></div></div><label>${d.label}</label></div>`;}).join('');
    const tracked=appState.manifest.subjects.filter(s=>getSubjectAccuracy(s.slug).tries>0).sort((a,b)=>getSubjectAccuracy(b.slug).tries-getSubjectAccuracy(a.slug).tries).slice(0,5);
    const subjectProgress=tracked.length?tracked.map(s=>{const a=getSubjectAccuracy(s.slug);return `<div class="subject-mini"><div><div class="subject-mini-name">${esc(s.name)}</div><div class="progress-track"><span style="width:${a.accuracy}%"></span></div></div><div class="subject-mini-score">${a.accuracy}%<div class="subject-mini-meta">${a.tries} tries</div></div></div>`;}).join(''):`<div class="empty-state" style="padding:19px 8px"><div class="empty-icon">📈</div><h3>Your subject insights start here</h3><p>Complete a few questions to see accuracy by subject.</p></div>`;
    return `${pageHeading('YOUR STUDY DESK',`Good ${greeting}. Let’s make today count.`,'A little consistent practice goes a long way. Your next set is ready.',`<div class="date-label">${dateLabel}</div>`)}
      <section class="hero"><div class="hero-copy"><div class="hero-kicker">Your daily practice session</div><h2>Small sessions. Stronger recall. Better results.</h2><p>Build exam confidence with a balanced mix of pharmacy MCQs, instant explanations and a progress trail that keeps you moving.</p><div class="hero-actions"><button class="btn btn-primary" data-action="daily">Start today’s ${goal} MCQs <span>→</span></button><button class="btn btn-light" data-action="quick-mix">Quick practice</button></div></div><div class="hero-art" aria-hidden="true"><div class="orbit"><div class="orbit-inner"><div class="capsule"></div></div></div><div class="orbit-dot"></div></div></section>
      <section class="stats-grid">
        <div class="stat-card"><div class="stat-top"><span>Questions attempted</span><span class="stat-icon">✍</span></div><div class="stat-value">${fmtInt(attemptedTotal())}</div><div class="stat-foot">Across all practice sessions</div></div>
        <div class="stat-card"><div class="stat-top"><span>Overall accuracy</span><span class="stat-icon">◎</span></div><div class="stat-value">${accuracy()}%</div><div class="stat-foot">${fmtInt(correctTotal())} correct responses</div></div>
        <div class="stat-card"><div class="stat-top"><span>Current streak</span><span class="stat-icon">🔥</span></div><div class="stat-value">${streakCount()} <span style="font-size:13px;color:var(--muted)">days</span></div><div class="stat-foot">Show up again tomorrow</div></div>
        <div class="stat-card"><div class="stat-top"><span>Today’s progress</span><span class="stat-icon">🎯</span></div><div class="stat-value">${Math.min(done,goal)}<span style="font-size:14px;color:var(--muted)"> / ${goal}</span></div><div class="stat-foot"><strong>${Math.min(100,pct(done,goal))}%</strong> of your daily goal</div></div>
      </section>
      <div class="section-row"><div><h2 class="section-title">Choose your study mode</h2><div class="section-note">Pick the session that fits your time and focus.</div></div></div>
      <section class="quick-grid">
        <article class="quick-card"><div class="quick-icon">⚡</div><div><h3>Quick practice</h3><p>10 mixed questions to warm up your recall.</p><button class="text-btn" data-action="quick-mix">Start 10 questions →</button></div></article>
        <article class="quick-card"><div class="quick-icon">🎯</div><div><h3>Target a subject</h3><p>Go deep into Pharmacology, Pharmaceutics or any topic.</p><button class="text-btn" data-action="nav" data-page="subjects">Browse subjects →</button></div></article>
        <article class="quick-card"><div class="quick-icon">⏱</div><div><h3>Timed mock test</h3><p>Attempt a focused test without instant feedback.</p><button class="text-btn" data-action="mock">Build a mock test →</button></div></article>
      </section>
      <div class="dashboard-columns"><section class="panel"><div class="panel-head"><div><h3>Weekly activity</h3><p>Your answered questions over the last 7 days</p></div><span class="tag">${fmtInt(week.reduce((n,d)=>n+(store.dailyLogs[d.key]||[]).length,0))} total</span></div><div class="chart-wrap">${bars}</div><div class="chart-legend"><span><i class="legend-dot"></i>Questions answered</span><span><i class="legend-dot" style="background:#a8c58c"></i>Previous days</span></div></section>
      <section class="panel"><div class="panel-head"><div><h3>Subject performance</h3><p>Your most-practised subjects</p></div><button class="text-btn" data-action="nav" data-page="analytics">View all →</button></div><div class="subject-mini-list">${subjectProgress}</div></section></div>
      <div class="section-row"><div><h2 class="section-title">Your question bank</h2><div class="section-note">${fmtInt(ready)} answerable questions available by default across ${appState.manifest.subjects.length} subjects.</div></div><button class="btn btn-light btn-sm" data-action="nav" data-page="subjects">Explore all subjects →</button></div>`;
  }
  function renderSubjects(){
    const q=appState.subjectSearch.toLowerCase();const subs=appState.manifest.subjects.filter(s=>`${s.name} ${(s.topTopics||[]).join(' ')}`.toLowerCase().includes(q));
    const cards=subs.map((s,i)=>`<article class="subject-card"><div class="subject-card-top"><div class="subject-emblem">${iconFor(i)}</div><div class="subject-number">${fmtInt(s.count)} questions</div></div><h3>${esc(s.name)}</h3><div class="subject-topics">${esc((s.topTopics||[]).slice(0,3).join(' · '))}</div><div class="subject-card-foot"><div class="subject-ready"><strong>${fmtInt(s.ready??s.count)}</strong> ready by default</div><div class="subject-actions"><button data-action="subject-topics" data-slug="${s.slug}">Topics</button><button data-action="subject-start" data-slug="${s.slug}">Practice →</button></div></div></article>`).join('');
    return `${pageHeading('QUESTION BANK','Explore by subject','Choose a subject to practise, or narrow your session to a specific topic.',`<span class="tag">${appState.manifest.subjects.length} subjects</span>`)}
      <div class="toolbar"><div class="search-box"><span class="search-icon">⌕</span><input id="subject-search" type="search" placeholder="Search subjects or topics…" value="${esc(appState.subjectSearch)}" aria-label="Search subjects"></div><span class="tag">${fmtInt(appState.manifest.readyDefault)} ready questions</span></div>
      <div class="subject-grid">${cards||`<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">⌕</div><h3>No matching subject</h3><p>Try a different subject or topic name.</p></div>`}</div>`;
  }
  function questionMap(s){return `<div class="question-map">${s.items.map((q,i)=>`<button class="qmap-btn ${i===s.index?'current':''} ${Number.isInteger(s.picks[i])?'done':''} ${s.reviewLater[i]?'flagged':''}" data-action="jump" data-index="${i}" title="Question ${i+1}">${i+1}</button>`).join('')}</div>`;}
  function renderPractice(){
    const s=appState.session;if(!s)return `<div class="empty-state"><div class="empty-icon">📚</div><h3>No active session</h3><p>Choose a daily practice set or select a subject to begin.</p><button class="btn btn-primary" data-action="nav" data-page="dashboard">Back to dashboard</button></div>`;
    const i=s.index,q=s.items[i],selected=s.picks[i],checked=s.mode==='practice'&&!!s.checked[i],bookmarked=store.bookmarks.includes(q.id),pctDone=pct(i+1,s.items.length);
    const options=q.options.map((opt,n)=>{let cls='';if(Number.isInteger(selected)&&selected===n)cls+=' selected';if(checked&&n===q.answer)cls+=' correct';if(checked&&n===selected&&selected!==q.answer)cls+=' wrong';return `<button type="button" class="option${cls}" aria-pressed="${selected===n}" data-action="choose-option" data-index="${n}" ${checked?'disabled':''}><span class="option-letter">${LETTERS[n]||n+1}</span><span class="option-text">${esc(opt)}</span></button>`;}).join('');
    const feedback=checked?`<div class="answer-feedback ${selected===q.answer?'good':'bad'}"><div class="feedback-title">${selected===q.answer?'✓ Correct!':'✕ Incorrect. Correct answer: '+(LETTERS[q.answer]||q.answer+1)+' — '+esc(q.options[q.answer])+'.'}</div><div class="feedback-explanation">${esc(q.explanation||'No explanation was supplied for this question.')}</div></div>`:'';
    const actions=s.mode==='exam'?`<div class="question-actions-left"><button class="bookmark-btn ${s.reviewLater[i]?'active':''}" data-action="mark-review">⚑ ${s.reviewLater[i]?'Marked for review':'Mark for review'}</button></div><div class="question-actions-right">${i>0?`<button class="btn btn-light" data-action="previous">← Previous</button>`:''}<button class="btn btn-dark" data-action="next">${i===s.items.length-1?'Finish test':'Next question →'}</button></div>`:
      `<div class="question-actions-left"><button class="bookmark-btn ${bookmarked?'active':''}" data-action="bookmark">${bookmarked?'★ Saved':'☆ Bookmark'}</button><button class="bookmark-btn" data-action="skip">Skip</button></div><div class="question-actions-right">${checked?`<button class="btn btn-dark" data-action="next">${i===s.items.length-1?'Finish session':'Next question →'}</button>`:`<button class="btn btn-dark" data-action="submit" ${Number.isInteger(selected)?'':'disabled'}>Check answer</button>`}</div>`;
    const modeTitle=s.mode==='exam'?'Timed mock test':'Practice mode';
    return `${pageHeading(modeTitle.toUpperCase(),esc(s.title),`${s.items.length} questions · ${s.mode==='exam'?'Answers and explanations appear after you finish.':'Instant feedback with explanations.'}`,`<button class="btn btn-outline btn-sm" data-action="exit-session">Exit session</button>`)}
      <div class="practice-top"><div class="session-meta"><span class="tag">${esc(q.subject)}</span>${q.topic?`<span class="tag">${esc(q.topic)}</span>`:''}${q.yieldLevel==='high'?'<span class="tag high">High-yield tag</span>':''}</div><span class="tag timer">◷ <span id="session-clock">${clockString(s.deadline?Math.ceil((s.deadline-Date.now())/1000):Math.floor((Date.now()-s.startedAt)/1000))}</span></span></div>
      <div class="question-progress"><span style="width:${pctDone}%"></span></div>
      <div class="question-layout"><section class="question-card"><div class="question-head"><span>QUESTION ${i+1} <span style="color:#b0bbb2">/ ${s.items.length}</span></span><span class="question-id">${esc(q.id)}</span></div><h2 class="question-text">${esc(q.question)}</h2><div class="options-list">${options}</div>${feedback}<div class="question-actions">${actions}</div></section>
      <aside class="session-sidebar"><section class="side-panel"><h4>Question navigator</h4>${questionMap(s)}<div class="side-stat" style="margin-top:12px"><span>Answered / selected</span><strong>${Object.keys(s.picks).length} of ${s.items.length}</strong></div><div class="side-stat"><span>Remaining</span><strong>${s.items.length-Object.keys(s.picks).length}</strong></div></section><section class="side-panel"><h4>Session guide</h4><div class="keyboard-note">${s.mode==='exam'?'Select an option and move forward. You can return to any question before finishing.':'Select one option, then check your answer to reveal the explanation.'}<br><br><span class="kbd">1–6</span> Choose an option<br><span class="kbd">B</span> Bookmark<br><span class="kbd">Enter</span> Submit / continue</div></section></aside></div>`;
  }
  function renderResults(){
    const r=appState.result;if(!r)return renderDashboard();const score=pct(r.correct,r.total);const wrongItems=r.detail.filter(x=>!x.good);
    const details=r.detail.map((x,i)=>`<div class="result-item"><h4>${i+1}. ${esc(x.q.question)}</h4><div class="result-answer">${x.good?'✓ Correct':x.answered?'✕ Incorrect':'— Not answered'}${x.answered?` · Your answer: ${LETTERS[x.picked]||x.picked+1}`:''} · Correct: ${LETTERS[x.q.answer]||x.q.answer+1}. ${esc(x.q.options[x.q.answer]||'')}</div>${x.q.explanation?`<div class="result-explain">${esc(x.q.explanation)}</div>`:''}</div>`).join('');
    return `${pageHeading('SESSION COMPLETE',r.timeUp?'Time is up. Here’s your review.':'Session complete. Nice work.','Check your answers, revisit explanations and turn mistakes into your next revision set.')}
      <section class="result-hero"><div><div class="hero-kicker">${esc(r.title)}</div><h2>${score>=80?'Excellent effort!':score>=60?'Good progress. Keep sharpening.':'Every attempt is useful feedback.'}</h2><p>${r.timeUp?'The timer ended. Your answered questions have been saved.':'Your session has been recorded on this device.'}</p></div><div class="score-circle">${score}%</div></section>
      <div class="result-stats"><div class="result-stat"><strong>${r.correct}</strong><span>Correct</span></div><div class="result-stat"><strong>${r.wrong}</strong><span>Incorrect</span></div><div class="result-stat"><strong>${r.unanswered}</strong><span>Unanswered</span></div><div class="result-stat"><strong>${clockString(r.seconds)}</strong><span>Time spent</span></div></div>
      <div class="section-row"><div><h2 class="section-title">Answer review</h2><div class="section-note">Correct answers and explanations for this session.</div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-light btn-sm" data-action="nav" data-page="dashboard">Dashboard</button>${wrongItems.length?`<button class="btn btn-primary btn-sm" data-action="retry-result-wrong">Practise ${wrongItems.length} missed →</button>`:''}</div></div>
      <section class="panel">${details}</section>`;
  }
  function renderReview(){
    const tab=appState.reviewTab;let items=[];
    if(tab==='wrong')items=Object.entries(store.progress).filter(([,p])=>(p.incorrect||0)>0).map(([id,p])=>({id,p})).sort((a,b)=>(b.p.lastMiss||'').localeCompare(a.p.lastMiss||''));
    else if(tab==='bookmarks')items=store.bookmarks.map(id=>({id,p:store.progress[id]||{}}));
    else items=Object.entries(store.progress).sort((a,b)=>(b[1].lastSeen||'').localeCompare(a[1].lastSeen||'')).map(([id,p])=>({id,p}));
    const rows=items.map(({id,p})=>{const q=questionById(id);if(!q)return '';const good=isAnswerable(q);return `<article class="review-row"><div><h3>${esc(q.question)}</h3><p>${esc(q.subject)}${q.topic?' · '+esc(q.topic):''} · ${p.attempts||0} attempts${p.incorrect?` · ${p.incorrect} missed`:''}</p></div><div class="review-row-actions"><button class="btn btn-light btn-sm" data-action="review-one" data-id="${esc(id)}">Practise</button><button class="bookmark-btn ${store.bookmarks.includes(id)?'active':''}" data-action="remove-bookmark" data-id="${esc(id)}">${store.bookmarks.includes(id)?'★':'☆'}</button></div></article>`;}).filter(Boolean).join('');
    return `${pageHeading('REVIEW CENTRE','Make weak areas your strength','Revisit missed questions, saved questions and your recently attempted items.',`<button class="btn btn-primary btn-sm" data-action="review-start">${tab==='wrong'?'Practise missed':'Start this review'} →</button>`)}
      <div class="review-tabs"><button class="tab-btn ${tab==='wrong'?'active':''}" data-action="review-tab" data-tab="wrong">Missed questions (${Object.values(store.progress).filter(p=>(p.incorrect||0)>0).length})</button><button class="tab-btn ${tab==='bookmarks'?'active':''}" data-action="review-tab" data-tab="bookmarks">Bookmarks (${store.bookmarks.length})</button><button class="tab-btn ${tab==='recent'?'active':''}" data-action="review-tab" data-tab="recent">Recent activity (${Object.keys(store.progress).length})</button></div>
      <div class="review-list">${rows||`<div class="empty-state"><div class="empty-icon">${tab==='bookmarks'?'☆':'✓'}</div><h3>${tab==='bookmarks'?'No saved questions yet':tab==='wrong'?'No missed questions yet':'No activity yet'}</h3><p>${tab==='bookmarks'?'Bookmark useful questions during practice and they will be collected here.':tab==='wrong'?'When you answer a question incorrectly, it will appear here for revision.':'Start a practice session to build your revision history.'}</p><button class="btn btn-light btn-sm" data-action="nav" data-page="subjects">Browse question bank</button></div>`}</div>`;
  }
  function renderAnalytics(){
    const done=Object.keys(store.progress).length;const practiced=appState.manifest.subjects.filter(s=>getSubjectAccuracy(s.slug).tries>0);
    const subjectRows=practiced.map(s=>{const a=getSubjectAccuracy(s.slug);return `<div class="accuracy-row"><div><div class="accuracy-row-name">${esc(s.name)}</div><div class="progress-track"><span style="width:${a.accuracy}%"></span></div></div><div class="accuracy-row-value">${a.accuracy}%<div class="subject-mini-meta">${a.tries} tries</div></div></div>`;}).join('');
    const weak=Object.entries(store.progress).filter(([,p])=>(p.incorrect||0)>0).sort((a,b)=>(b[1].incorrect||0)-(a[1].incorrect||0)).slice(0,6);
    const weakRows=weak.map(([id,p])=>{const q=questionById(id);return q?`<div class="weak-item"><span>${esc(q.topic||q.subject)}</span><strong>${p.incorrect} misses</strong></div>`:'';}).join('');
    return `${pageHeading('PERFORMANCE','Your learning, at a glance','Use your accuracy and revision history to decide what to practise next.')}
      <div class="performance-grid"><section class="panel"><div class="panel-head"><div><h3>Overall accuracy</h3><p>Across all recorded attempts</p></div><span class="tag">Personal stats</span></div><div class="accuracy-large">${accuracy()}%</div><div class="metric-label">${fmtInt(correctTotal())} correct out of ${fmtInt(attemptedTotal())} attempts</div><div class="progress-track" style="height:9px;margin:18px 0 9px"><span style="width:${accuracy()}%"></span></div><div class="metric-label">${fmtInt(done)} unique questions attempted · ${streakCount()} day current streak</div></section>
      <section class="panel"><div class="panel-head"><div><h3>Daily consistency</h3><p>Unique questions answered this week</p></div></div><div class="chart-wrap">${currentWeek().map(d=>{const n=(store.dailyLogs[d.key]||[]).length;const max=Math.max(1,...currentWeek().map(x=>(store.dailyLogs[x.key]||[]).length));return `<div class="chart-day"><div class="chart-bar-track"><div class="chart-bar ${d.key===todayKey()?'today':''}" style="height:${Math.max(3,pct(n,max))}%"></div></div><label>${d.label}</label></div>`;}).join('')}</div></section>
      <section class="panel"><div class="panel-head"><div><h3>Accuracy by subject</h3><p>Subjects with recorded attempts</p></div></div><div class="subject-accuracy-list">${subjectRows||'<div class="empty-state" style="padding:20px"><h3>No subject data yet</h3><p>Choose a subject and complete a few questions.</p></div>'}</div></section>
      <section class="panel"><div class="panel-head"><div><h3>Topics to revisit</h3><p>Questions with the most incorrect attempts</p></div><button class="text-btn" data-action="nav" data-page="review">Review all →</button></div><div class="weak-list">${weakRows||'<div class="empty-state" style="padding:20px"><h3>Nothing to flag yet</h3><p>Incorrect answers will surface here automatically.</p></div>'}</div></section></div>`;
  }
  function renderSettings(){
    return `${pageHeading('PREFERENCES','Make PharmaQuest yours','Adjust your daily target, display and question-bank filtering.')}
      <div class="settings-grid"><section class="setting-card"><h3>Daily study goal</h3><p>Choose a realistic number of unique MCQs to answer each day. Your daily mix will follow this target.</p><div class="setting-row"><div><label for="daily-target">Questions per day</label><small>Recommended starting point: 25</small></div><input id="daily-target" class="field-input" type="number" min="5" max="100" step="5" value="${Number(store.dailyTarget)||25}"></div></section>
      <section class="setting-card"><h3>Appearance</h3><p>Choose the theme that feels comfortable for longer study sessions.</p><div class="setting-row"><div><label>Dark theme</label><small>Reduce screen brightness in low light.</small></div><button class="toggle ${store.theme==='dark'?'on':''}" data-action="toggle-theme" aria-label="Toggle dark theme"></button></div></section>
      <section class="setting-card"><h3>Question quality filter</h3><p>The source archive includes flags on some records. The default filter protects practice sessions from incomplete or uncertain items.</p><div class="setting-row"><div><label>Include source-flagged questions</label><small>Turn on only when exploring the raw question bank. Questions without a valid answer stay excluded.</small></div><button class="toggle ${store.includeFlagged?'on':''}" data-action="toggle-flagged" aria-label="Include source flagged questions"></button></div><div class="notice">Default practice excludes flags for missing images, incomplete stems, duplicate options, conflicting or low-confidence answers, and records requiring human review. Questions labelled as agreeing with a poll remain eligible.</div></section>
      <section class="setting-card"><h3>Backup & portability</h3><p>Progress is stored in this browser only. Export a backup before clearing browser data or changing devices.</p><div class="setting-row"><div><label>Export progress</label><small>Download bookmarks, accuracy and daily activity.</small></div><button class="btn btn-light btn-sm" data-action="export">Export JSON</button></div><div class="setting-row"><div><label>Import progress</label><small>Restore a previously exported PharmaQuest backup.</small></div><button class="btn btn-light btn-sm" data-action="import">Choose file</button><input id="import-file" type="file" accept="application/json,.json" hidden></div></section>
      <section class="setting-card"><h3>Question bank information</h3><p>Source questions are preserved from the uploaded archive. Explanations are shown as supplied and have not been independently fact-checked.</p><div class="setting-row"><div><label>Total imported records</label><small>Across all pharmacy subjects</small></div><strong>${fmtInt(appState.manifest.sourceTotal)}</strong></div><div class="setting-row"><div><label>Default answerable set</label><small>Valid answer index and no excluded source flags</small></div><strong>${fmtInt(appState.manifest.readyDefault)}</strong></div><div class="setting-row"><div><label>Subjects</label></div><strong>${appState.manifest.subjects.length}</strong></div></section>
      <section class="setting-card"><h3>Reset this browser</h3><p>This removes local progress and preferences from this browser. Your question bank files are not deleted.</p><button class="btn btn-danger btn-sm" data-action="reset">Reset progress</button></section></div>`;
  }
  function render(){
    let content='';
    switch(appState.page){case 'dashboard':content=renderDashboard();break;case 'subjects':content=renderSubjects();break;case 'practice':content=render();break;case 'review':content=renderReview();break;case 'analytics':content=renderAnalytics();break;case 'settings':content=renderSettings();break;case 'results':content=renderResults();break;default:content=renderDashboard();}
    $('#app').innerHTML=shell(content);
  }
  function exportProgress(){
    const payload={app:'PharmaQuest',version:1,exportedAt:new Date().toISOString(),progress:store.progress,bookmarks:store.bookmarks,dailyLogs:store.dailyLogs,dailyPlans:store.dailyPlans,dailyTarget:store.dailyTarget,theme:store.theme,includeFlagged:store.includeFlagged};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`pharmaquest-backup-${todayKey()}.json`;a.click();URL.revokeObjectURL(url);toast('Progress backup downloaded.');
  }
  async function importProgress(file){
    try{const data=JSON.parse(await file.text());if(data.app!=='PharmaQuest'||data.version!==1)throw new Error('This file is not a supported PharmaQuest backup.');
      if(!data.progress||typeof data.progress!=='object')throw new Error('Backup file is missing progress data.');
      store.progress=data.progress;store.bookmarks=Array.isArray(data.bookmarks)?data.bookmarks:[];store.dailyLogs=data.dailyLogs||{};store.dailyPlans=data.dailyPlans||{};if(Number.isFinite(data.dailyTarget))store.dailyTarget=Math.max(5,Math.min(100,data.dailyTarget));if(data.theme)store.theme=data.theme;if(typeof data.includeFlagged==='boolean')store.includeFlagged=data.includeFlagged;persist();setTheme();render();toast('Progress restored successfully.');
    }catch(e){toast(e.message||'Could not import this backup.');}
  }
  function eventClick(e){
    const el=e.target.closest('[data-action]');if(!el)return;const a=el.dataset.action;
    if(a==='nav'){setPage(el.dataset.page);return;}
    if(a==='menu'){appState.sidebarOpen=!appState.sidebarOpen;$('#sidebar')?.classList.toggle('open',appState.sidebarOpen);return;}
    if(a==='theme'||a==='toggle-theme'){store.theme=store.theme==='dark'?'light':'dark';persist();setTheme();render();return;}
    if(a==='daily'){startDaily();return;}
    if(a==='quick-mix'){startAllRandom(10);return;}
    if(a==='subject-start'){openSubjectPicker(el.dataset.slug);return;}
    if(a==='subject-topics'){openTopicPicker(el.dataset.slug);return;}
    if(a==='topic-start'){startSubject(el.dataset.slug,{topic:el.dataset.topic});return;}
    if(a==='mock'){openMockBuilder();return;}
    if(a==='choose-option'){const s=appState.session;if(!s||s.mode==='practice'&&s.checked[s.index])return;s.picks[s.index]=Number(el.dataset.index);render();return;}
    if(a==='submit'){submitPractice();return;}
    if(a==='skip'){const s=appState.session;if(!s)return;if(s.index<s.items.length-1){s.index++;render();}else finishSession(false);return;}
    if(a==='next'){goNext();return;}
    if(a==='previous'){goPrevious();return;}
    if(a==='jump'){const s=appState.session;if(s){s.index=Number(el.dataset.index);render();}return;}
    if(a==='bookmark'){const s=appState.session;if(!s)return;toggleBookmark(s.items[s.index]);render();toast(store.bookmarks.includes(s.items[s.index].id)?'Question bookmarked.':'Bookmark removed.');return;}
    if(a==='mark-review'){const s=appState.session;if(!s)return;s.reviewLater[s.index]=!s.reviewLater[s.index];render();return;}
    if(a==='exit-session'){if(confirm('Exit this session? Your submitted practice answers are already saved.')){stopTimer();appState.session=null;setPage('dashboard');}return;}
    if(a==='review-tab'){appState.reviewTab=el.dataset.tab;render();return;}
    if(a==='review-start'){if(appState.reviewTab==='bookmarks')startBookmarks();else if(appState.reviewTab==='wrong')startWrong();else startRecentReview();return;}
    if(a==='review-one'){const q=questionById(el.dataset.id);if(q)makeSession([q],{title:'Single-question revision'});else toast('Load the subject again to access this question.');return;}
    if(a==='remove-bookmark'){const id=el.dataset.id;store.bookmarks=store.bookmarks.filter(x=>x!==id);persist();render();return;}
    if(a==='retry-result-wrong'){const items=(appState.result?.detail||[]).filter(x=>!x.good).map(x=>x.q);if(items.length)makeSession(items,{title:'Retry missed questions'});return;}
    if(a==='toggle-flagged'){store.includeFlagged=!store.includeFlagged;persist();render();toast(store.includeFlagged?'Source-flagged answerable items are now included.':'Question quality filter restored.');return;}
    if(a==='export'){exportProgress();return;}
    if(a==='import'){$('#import-file')?.click();return;}
    if(a==='reset'){if(confirm('Delete all PharmaQuest progress, bookmarks and preferences stored in this browser? This cannot be undone.')){localStorage.removeItem(STORE_KEY);location.reload();}return;}
  }

  async function openSubjectPicker(slug){
    const subject=getManifestSubject(slug);if(!subject)return;
    try{
      busy(true,`Loading ${subject.name}`, 'Checking the complete subject question bank…');
      const rows=await loadSubject(subject);busy(false);
      const pool=filteredQuestions(rows);
      const modal=document.createElement('div');modal.className='loading-overlay';modal.id='subject-picker';
      modal.innerHTML=`<div class="loading-card" style="width:min(440px,94vw);padding:22px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><strong style="font:800 17px Manrope">${esc(subject.name)}</strong><button class="icon-btn" data-modal-close aria-label="Close">×</button></div>
        <p style="margin:8px 0 4px">${fmtInt(pool.length)} answerable questions are available in this subject. A session is only a batch, not the whole bank.</p>
        <label style="display:block;font-size:11px;font-weight:700;margin:14px 0 5px">Questions in this session</label>
        <select id="subject-count" class="field-input" style="max-width:none;width:100%">
          <option value="20">20 questions</option><option value="50">50 questions</option><option value="100" selected>100 questions</option><option value="250">250 questions</option><option value="500">500 questions</option>
        </select>
        <div class="notice" style="margin:14px 0">Questions are shuffled from the full subject bank. Choose another session later to continue practising more questions. Answers and explanations appear after you select an option and press Check answer.</div>
        <button class="btn btn-primary btn-block" data-subject-start>Start subject practice →</button>
      </div>`;
      document.body.append(modal);
      modal.addEventListener('click',ev=>{if(ev.target===modal||ev.target.closest('[data-modal-close]')){modal.remove();return;}if(ev.target.closest('[data-subject-start]')){const count=Number($('#subject-count',modal).value)||100;modal.remove();startSubject(slug,{count});}});
    }catch(e){busy(false);toast(e.message);}
  }
  async function openTopicPicker(slug){
    const subject=getManifestSubject(slug);if(!subject)return;
    try{busy(true,`Loading ${subject.name}`,`Finding available topics…`);const rows=await loadSubject(subject);busy(false);
      const counts=new Map();for(const q of filteredQuestions(rows)){const t=q.topic||'General';counts.set(t,(counts.get(t)||0)+1);}
      const topics=[...counts.entries()].sort((a,b)=>b[1]-a[1]);
      const modal=document.createElement('div');modal.className='loading-overlay';modal.id='topic-picker';
      modal.innerHTML=`<div class="loading-card" style="width:min(540px,94vw);max-height:82vh;overflow:auto;padding:22px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><strong style="font:800 17px Manrope">Choose a topic</strong><p style="margin:4px 0 0">${esc(subject.name)} · ${fmtInt(counts.size)} topics available</p></div><button class="icon-btn" data-modal-close aria-label="Close">×</button></div><label style="display:block;font-size:11px;font-weight:700;margin:14px 0 5px">Questions in this topic session</label><select id="topic-count" class="field-input" style="max-width:none;width:100%"><option value="20">20 questions</option><option value="50">50 questions</option><option value="100" selected>100 questions</option><option value="250">250 questions</option><option value="500">500 questions</option></select><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px">${topics.map(([name,n])=>`<button class="btn btn-light" data-topic-choice="${esc(name)}" style="justify-content:space-between;text-align:left;font-size:11px;min-height:44px"><span>${esc(name)}</span><span style="opacity:.7">${n}</span></button>`).join('')}</div></div>`;document.body.append(modal);
      modal.addEventListener('click',ev=>{if(ev.target===modal||ev.target.closest('[data-modal-close]')){modal.remove();return;}const b=ev.target.closest('[data-topic-choice]');if(b){const topic=b.dataset.topicChoice;const count=Number($('#topic-count',modal).value)||100;modal.remove();startSubject(slug,{topic,count});}});
    }catch(e){busy(false);toast(e.message);}
  }
  async function startRecentReview(){if(!await ensureAll())return;const ids=Object.entries(store.progress).sort((a,b)=>(b[1].lastSeen||'').localeCompare(a[1].lastSeen||'')).map(([id])=>id);const items=ids.slice(0,100).map(questionById).filter(q=>q&&isAllowed(q));makeSession(items,{title:'Recent question review'});}
  function openMockBuilder(){
    const modal=document.createElement('div');modal.className='loading-overlay';modal.id='mock-builder';modal.innerHTML=`<div class="loading-card" style="width:min(420px,92vw);padding:22px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><strong style="font:800 17px Manrope">Build a mock test</strong><button class="icon-btn" data-modal-close aria-label="Close">×</button></div><p>Set your own test length and timer. This is a flexible practice mode, not an official exam pattern.</p><label style="display:block;font-size:11px;font-weight:700;margin:12px 0 5px">Number of questions</label><select id="mock-count" class="field-input" style="max-width:none;width:100%"><option value="25">25 questions</option><option value="50" selected>50 questions</option><option value="75">75 questions</option><option value="100">100 questions</option></select><label style="display:block;font-size:11px;font-weight:700;margin:12px 0 5px">Time limit</label><select id="mock-time" class="field-input" style="max-width:none;width:100%"><option value="0">No timer</option><option value="30">30 minutes</option><option value="45" selected>45 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option><option value="120">120 minutes</option></select><div class="notice" style="margin:14px 0">Exam mode hides correctness and explanations until you finish. You can navigate between questions before submission.</div><button class="btn btn-primary btn-block" data-mock-start>Start mock test →</button></div>`;document.body.append(modal);
    modal.addEventListener('click',async ev=>{if(ev.target===modal||ev.target.closest('[data-modal-close]')){modal.remove();return;}if(ev.target.closest('[data-mock-start]')){const count=Number($('#mock-count',modal).value)||50;const minutes=Number($('#mock-time',modal).value)||0;modal.remove();await startAllRandom(count,'exam',minutes);}});
  }
  function onInput(e){if(e.target.id==='subject-search'){const v=e.target.value;appState.subjectSearch=v;const pos=e.target.selectionStart;render();const input=$('#subject-search');input?.focus();input?.setSelectionRange(pos,pos);}}
  function onChange(e){
    if(e.target.id==='daily-target'){const n=Math.max(5,Math.min(100,Number(e.target.value)||25));store.dailyTarget=n;delete store.dailyPlans[todayKey()];persist();render();toast(`Daily target set to ${n} questions.`);}
    if(e.target.id==='import-file'&&e.target.files?.[0])importProgress(e.target.files[0]);
  }
  function onKey(e){
    if(!appState.session||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
    const s=appState.session;
    if(/^[1-6]$/.test(e.key)){const n=Number(e.key)-1;if(n<s.items[s.index].options.length){s.picks[s.index]=n;render();}}
    else if(e.key.toLowerCase()==='b'&&s.mode==='practice'){toggleBookmark(s.items[s.index]);render();}
    else if(e.key==='Enter'){e.preventDefault();if(s.mode==='practice'&&!s.checked[s.index])submitPractice();else goNext();}
  }
  function bootError(err){console.error(err);$('#app').innerHTML=`<div class="empty-state"><div class="empty-icon">⚠</div><h3>Could not load PharmaQuest</h3><p>${esc(err.message||'Unknown error')}. Run this folder through a local web server or GitHub Pages, rather than opening index.html directly.</p><p style="font-family:monospace;font-size:10px">Windows: double-click START-LOCAL.bat</p></div>`;}
  async function init(){
    try{
      const res=await fetch('./data/manifest.json');if(!res.ok)throw new Error('The subject manifest could not be found.');appState.manifest=await res.json();
      document.title='PharmaQuest — Pharmacist Exam Lab';
      document.addEventListener('click',eventClick,true);$('#app').addEventListener('input',onInput);$('#app').addEventListener('change',onChange);document.addEventListener('keydown',onKey);
      if('serviceWorker' in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
      appState.page='dashboard';render();
    }catch(e){bootError(e);}
  }
  init();
})();
