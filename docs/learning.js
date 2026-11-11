/* Learning history and review scheduling. Dates follow the learner's Taipei calendar. */
const reviewIntervals = [1, 3, 7, 14, 30, 60];
const reviewLimit = 10;
function dateShift(day, offset) {
  const date = new Date(day+'T12:00:00Z');
  date.setUTCDate(date.getUTCDate()+offset);
  return date.toISOString().slice(0,10);
}
function reviewPlan(state, remembered, retry, day) {
  const step=Number.isInteger(state?.step)?Math.max(-1,Math.min(reviewIntervals.length-1,state.step)):-1;
  const next=remembered&&!retry?Math.min(step+1,reviewIntervals.length-1):0;
  const days=reviewIntervals[next];
  return {step:next,dueOn:dateShift(day,days),lastOn:day};
}
const oldDue = due;
due = entry => entry.reviewPaused ? false : entry.schedule?.dueOn ? entry.schedule.dueOn<=today() : oldDue(entry);
function learningLog(){return Array.isArray(data.learningLog)?data.learningLog:(data.learningLog=[]);}
function recordLearning(event){learningLog().push({day:today(),...event});if(!data.days.includes(today()))data.days.push(today());}
function activeRound(){
  const current=data.studyRound;
  if(current?.day===today()&&Array.isArray(current.cards)&&current.cards.length&&Number.isInteger(current.cursor)&&current.cursor>=0&&current.cursor<current.cards.length)return current;
  return null;
}
function startRound(ids=data.entries.filter(due).slice(0,reviewLimit).map(a=>a.id), practice=false){
  data.studyRound={day:today(),cursor:0,cards:ids.map(id=>({id,retry:false,practice})),base:ids.length};
  save();
}
function practiceEntry(id){
  const round=activeRound();
  if(round){
    round.cards.splice(round.cursor,0,{id,retry:false,practice:true});
    round.base++;
    save();
  }else{
    startRound([id],true);
  }
  reviewDraft='';
  reviewShown=false;
  reviewFeedback='';
  go('review');
}
let reviewDraft='';
let reviewShown=false;
let reviewFeedback='';
const baseGo=go;
go=function(p){
  if(p!=='daily')coreUndo=null;
  if(p==='review'&&!activeRound()){startRound();reviewDraft='';reviewShown=false;}
  baseGo(p);
  if(['daily','review','a2'].includes(p))window.scrollTo(0,0);
};
function spelling(text){return text.normalize('NFKC').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/[.!?]+$/,'').replace(/\s+/g,' ');}
function reviewResult(entry,card,remembered,correct,day){
  const previous=entry.schedule?.lastOn||null;
  const next=reviewPlan(entry.schedule,remembered,card.retry,day);
  const delayed=!card.practice&&!card.retry&&Boolean(previous&&previous<day);
  return {next,delayed,correct:Boolean(correct&&remembered)};
}
review=function(){
  const round=data.studyRound;
  while(round?.cards[round.cursor]&&!data.entries.some(a=>a.id===round.cards[round.cursor].id&&(round.cards[round.cursor].practice||!a.reviewPaused)))round.cursor++;
  const card=round?.cards[round.cursor];
  const entry=card&&data.entries.find(a=>a.id===card.id);
  const example=entry&&reviewShown?exampleForReview(entry):'';
  const correct=entry&&Boolean(reviewDraft)&&spelling(reviewDraft)===spelling(entry.en);
  const days=entry?reviewPlan(entry.schedule,true,card.retry,today()).dueOn:null;
  $('#view').innerHTML=`<section class="study-frame"><div class="study-head"><button type="button" id="study-exit">← 回首頁</button><strong>複習</strong><span>${entry?`${round.cursor+1}／${round.cards.length}`:''}</span></div>
  ${entry?`<progress class="core-progress" value="${round.cursor}" max="${round.cards.length}" aria-label="本輪進度"></progress><section class="card study-card flip-in">
  <span class="tag">${card.retry?'本輪再練':esc(entry.topic)}</span><h2>${esc(entry.zh)}</h2>
  <div class="study-content">${reviewShown?`<div aria-live="polite"><p class="muted">${reviewDraft?(correct?'拼寫正確':'你的答案：'+esc(reviewDraft)):'直接看答案'}</p><p class="english" lang="en">${esc(entry.en)}</p><button id="study-word-audio">聽發音</button>${example?`<div class="study-example"><strong lang="en">${esc(example)}</strong><p>${esc(exampleMeaning(entry.en,example))}</p><button id="study-example-audio">聽例句</button></div>`:''}</div>`:`<form id="study-answer"><label for="study-input">輸入英文</label><input id="study-input" lang="en" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" value="${esc(reviewDraft)}" placeholder="輸入英文" maxlength="300"></form>`}</div>
  <div class="study-actions">${reviewShown?`<button data-study-answer="again">需要再練<small>${card.retry?'明天再看':'本輪再練・明天再看'}</small></button>${correct?`<button class="primary" data-study-answer="remember">記得，排下次<small>${Math.round((Date.parse(days)-Date.parse(today()))/86400000)} 天後</small></button>`:''}`:`<button type="button" id="study-reveal">直接看答案</button><button type="submit" form="study-answer" class="primary">核對答案</button>`}</div></section>`:`<section class="card study-card"><h2>${round?.base?'這一輪完成':'今天沒有到期卡'}</h2><p>${reviewFeedback?esc(reviewFeedback):''}</p><div class="core-tools">${data.entries.some(due)?'<button id="study-next-round" class="primary">下一輪</button>':''}<button id="study-free">自由練習</button></div></section>`}</section>`;
  $('#study-exit').onclick=()=>go('home');
  if($('#study-input'))$('#study-input').oninput=e=>{reviewDraft=e.target.value;};
  const reveal=()=>{reviewShown=true;review();};
  if($('#study-answer'))$('#study-answer').onsubmit=e=>{e.preventDefault();reveal();};
  if($('#study-reveal'))$('#study-reveal').onclick=reveal;
  if($('#study-word-audio'))$('#study-word-audio').onclick=()=>speakAmericanEnglish(entry.en);
  if($('#study-example-audio'))$('#study-example-audio').onclick=()=>speakAmericanEnglish(example);
  document.querySelectorAll('[data-study-answer]').forEach(b=>b.onclick=()=>{
    const remembered=b.dataset.studyAnswer==='remember'&&correct;
    const result=reviewResult(entry,card,remembered,correct,today());
    if(!card.practice){
      entry.schedule=result.next;entry.reviewExcluded=false;
      entry.level=remembered?3:1;
      if(entry.coreStatus)entry.coreStatus='review';
    }
    entry.reviews=(entry.reviews||0)+1;entry.last=Date.now();
    recordLearning({kind:'review',id:entry.id,delayed:result.delayed,correct:result.correct,first:!card.retry&&!card.practice});
    if(!remembered&&!card.retry)round.cards.push({...card,retry:true});
    round.cursor++;reviewDraft='';reviewShown=false;reviewFeedback='';save();review();$('#study-input')?.focus({preventScroll:true});
  });
  if($('#study-next-round'))$('#study-next-round').onclick=()=>{startRound();review();};
  if($('#study-free'))$('#study-free').onclick=()=>{const ids=data.entries.slice(0,reviewLimit).map(a=>a.id);if(!ids.length){reviewFeedback='先到單字庫收錄一些單字。';review();return;}startRound(ids,true);review();};
};

const a1ExampleTranslations=[
'你好，我是 Mia！|再見，明天見！|請給我一杯水。|謝謝你幫忙。|抱歉，我遲到了。|好，我可以幫忙。|不，我沒有筆。|我叫 Mia。|我住這裡。|你住這裡嗎？|我們上同一所學校。|他們是我的朋友。|我想當老師。|很高興見到你。|我來自台灣。|我住在公園附近。|我會說一點英文。|我每天學英文。|她是我的朋友。|我是學生。',
'我的家人住這裡。|我媽媽喜歡茶。|我爸爸在家。|我姊姊常看書。|我哥哥在學校。|我下班後回家。|我們住在一間小房子裡。|我的房間在樓上。|請關門。|請打開窗戶。|書在桌上。|這張椅子沒人坐。|包包在床底下。|我的手機在包包裡。|我有一本新書。|我的手機在哪裡？|這是我的鑰匙。|我有兩個姊妹。|這是我的包。|那是你的外套嗎？',
'我每天走路上學。|我一週工作五天。|這週末見。|我早上喝茶。|我們今天下午見吧。|我晚上看書。|我今天很忙。|明天見。|我現在得走了。|現在幾點？|我起得早。|抱歉，我遲到了。|我從圖書館拿書。|我搭公車上班。|你可以過來嗎？|我晚上睡得很好。|我在商店工作。|我在家讀書。|我睡前看書。|我們晚餐後看電視。',
'這裡的食物很好吃。|可以給我一些水嗎？|我想喝點茶，謝謝。|我早上喝咖啡。|我在咖啡裡加牛奶。|我早餐吃麵包。|我們晚餐吃飯。|我想要一顆蛋，謝謝。|我的包裡有一顆蘋果。|我們晚餐吃雞肉。|你早餐吃什麼？|我們一起吃午餐吧。|晚餐七點開始。|我在上班的地方吃午餐。|我走完路後喝水。|我想要一杯茶。|我需要一些水。|我喜歡這個湯。|可以給我一些飯嗎？|你想再喝點茶嗎？',
'車站在哪裡？|請在這裡等。|公車站在那邊。|在轉角左轉。|店在右邊。|我住在車站附近。|學校在這條街上。|我走路上學。|我家附近有一間店。|我們在公園見吧。|車站在你左邊。|我搭公車上班。|火車到了。|我的車在公園附近。|我放學後走路回家。|請在這裡停下。|那間店有開嗎？|請關門。|你可以幫我嗎？|我找不到手機。',
'我想買這個包。|我可以刷卡嗎？|我沒帶錢。|這個包的價格是多少？|我怎麼到那裡？|這個多少錢？|你有幾本書？|我有一個兄弟。|我想要兩顆蛋。|我有三本書。|這個包太大了。|我需要一個小包。|這是我的新手機。|我的腳踏車很舊。|食物很好吃。|今天天氣不好。|茶很熱。|水很冷。|很高興見到你。|我下班後很累。'
].map(line=>line.split('|'));
function exampleMeaning(en,example){
  const key=en.trim().toLowerCase();
  for(const [,,,items] of a2Units){const item=items.find(x=>x[0].toLowerCase()===key&&x[4]===example);if(item)return item[5];}
  for(let i=0;i<a1Units.length;i++){const n=a1Units[i][1].findIndex(([w])=>w.toLowerCase()===key);if(n>=0&&reviewExamples[i].split('|')[n]===example)return a1ExampleTranslations[i][n];}
  return typeof meta==='function' ? (meta({en}).example===example?meta({en}).meaning:'') : '';
}
// Pronunciations for commonly confused words and the opening lesson; leave the field blank otherwise.
const studyIPA={hello:'həˈloʊ',goodbye:'ˌɡʊdˈbaɪ',please:'pliːz',thanks:'θæŋks',sorry:'ˈsɑːri',yes:'jɛs',no:'noʊ',name:'neɪm',i:'aɪ',you:'juː',we:'wiː',they:'ðeɪ',be:'biː',meet:'miːt',from:'frʌm',live:'lɪv',speak:'spiːk',english:'ˈɪŋɡlɪʃ',friend:'frɛnd',student:'ˈstuːdənt',early:'ˈɝːli',water:'ˈwɔːtɚ',read:'riːd',include:'ɪnˈkluːd',order:'ˈɔːrdɚ',leave:'liːv',change:'tʃeɪndʒ',prepare:'prɪˈpɛr'};
const verbForms={prepare:'prepared · prepared',order:'ordered · ordered',include:'included · included',leave:'left · left',change:'changed · changed','try on':'tried on · tried on'};
function learnedA2(){return data.a2Learned&&typeof data.a2Learned==='object'&&!Array.isArray(data.a2Learned)?data.a2Learned:(data.a2Learned={});}
function a2Key(unit,word){return unit+':'+word;}
function nextA2(unit){const items=a2Units[unit][3];const i=items.findIndex(([en])=>!learnedA2()[a2Key(unit,en)]);return i<0?items.length:i;}
let a2Card=null;
function favoriteEntry(en,zh,topicName,note){
  let entry=coreIndex().get(en.toLowerCase());
  if(!entry){entry={id:crypto.randomUUID(),type:'word',en,zh,topic:topicName,note,level:0,reviews:0,reviewExcluded:true};data.entries.push(entry);}
  entry.favorite=!entry.favorite;save();return entry.favorite;
}
function saveStudyLine(text,meaning,theme,source){
  if(data.quotes.some(q=>q.text===text&&!q.archived))return false;
  data.quotes.push({id:crypto.randomUUID(),text,meaning,theme,source,url:'',chunks:'',usage:'',feeling:'',createdAt:new Date().toISOString()});save();return true;
}
a2Page=function(){
  const [title,topicName,task,items]=a2Units[a2Selected];
  const card=a2Card===null?null:items[a2Card];
  const completed=items.filter(([en])=>learnedA2()[a2Key(a2Selected,en)]).length;
  const [en,pos,zh,chunk,example,meaning]=card||[];
  const entry=en&&coreIndex().get(en.toLowerCase());
  $('#view').innerHTML=`<section class="study-frame"><div class="study-head"><button type="button" id="a2-back">← ${a2Card===null?'學習總覽':'主題'}</button><strong>A2 · ${esc(title)}</strong><span>${card?`${a2Card+1}／${items.length}`:''}</span></div>
  ${a2Card===null?`<div class="topic-choices">${a2Units.map(([name,,,words],i)=>`<button type="button" data-study-topic="${i}"><strong>${esc(name)}</strong><small>${words.filter(([word])=>learnedA2()[a2Key(i,word)]).length}／${words.length} 詞</small></button>`).join('')}</div>`:card?`<progress class="core-progress" value="${a2Card}" max="${items.length}" aria-label="主題進度"></progress><section class="card study-card flip-in">
    <div class="study-word-head"><h2 lang="en">${esc(en)}</h2><button id="a2-favorite" aria-pressed="${!!entry?.favorite}" aria-label="收藏單字">${entry?.favorite?'♥':'♡'}</button></div>
    <p><span class="tag">${esc(pos)}</span> ${esc(zh)}</p><button id="a2-sound">聽單字</button>
    <div class="study-content"><p class="study-chunk" lang="en">${esc(chunk)}</p><div class="study-example"><strong lang="en">${esc(example)}</strong><p>${esc(meaning)}</p><div class="core-tools"><button id="a2-example">聽例句</button><button id="a2-line">收藏例句</button></div></div>
    ${studyIPA[en]||verbForms[en]?`<details><summary>更多</summary>${studyIPA[en]?`<p>/${studyIPA[en]}/</p>`:''}${verbForms[en]?`<p>過去式 · 過去分詞<br>${esc(verbForms[en])}</p>`:''}</details>`:''}</div>
    <div class="study-actions"><button id="a2-mark">${entry?.coreStatus==='review'?'已加入複習':'加入複習'}</button><button id="a2-next" class="primary">下一張 →</button></div></section>`:`<section class="card study-card"><h2>主題完成 · ${completed}／${items.length}</h2><p>${esc(task)}</p><div class="core-tools"><button id="a2-restart">再看一遍</button><button class="primary" id="a2-more">其他主題</button></div></section>`}</section>`;
  $('#a2-back').onclick=()=>{if(a2Card===null)go('overview');else{a2Card=null;a2Page();}};
  document.querySelectorAll('[data-study-topic]').forEach(b=>b.onclick=()=>{a2Selected=Number(b.dataset.studyTopic);a2Card=nextA2(a2Selected);a2Page();});
  if($('#a2-restart'))$('#a2-restart').onclick=()=>{a2Card=0;a2Page();};
  if($('#a2-more'))$('#a2-more').onclick=()=>{a2Card=null;a2Page();};
  if(!card)return;
  $('#a2-sound').onclick=()=>speakAmericanEnglish(en);
  $('#a2-example').onclick=()=>speakAmericanEnglish(example);
  $('#a2-favorite').onclick=e=>{const active=favoriteEntry(en,zh,topicName,example);e.currentTarget.setAttribute('aria-pressed',String(active));e.currentTarget.textContent=active?'♥':'♡';};
  $('#a2-line').onclick=e=>{saveStudyLine(example,meaning,topicName,title);e.currentTarget.textContent='已收藏';};
  $('#a2-mark').onclick=e=>{
    const old=coreIndex().get(en.toLowerCase());
    if(old?.coreStatus==='review'&&!old.reviewPaused){old.meta={...old.meta,pos,chunks:[chunk],example,meaning};old.a2Topic=title;save();return;}
    markCore(en,zh,'review');
    const current=coreIndex().get(en.toLowerCase());
    current.reviewExcluded=false;current.reviewPaused=false;delete current.schedule;
    if(!old)current.topic=topicName;
    current.a2Topic=title;
    current.meta={...current.meta,pos,chunks:[chunk],example,meaning};
    save();e.currentTarget.textContent='已加入複習';
  };
  $('#a2-next').onclick=()=>{
    const key=a2Key(a2Selected,en);
    if(!learnedA2()[key]){learnedA2()[key]=today();recordLearning({kind:'a2',id:key});save();}
    a2Card++;a2Page();
  };
};

const renderOverviewBase=overviewPage;
overviewPage=function(){
  renderOverviewBase();
  const entries=coreIndex();
  const panel=document.createElement('div');panel.className='route-outline';
  panel.innerHTML=a1Units.map(([name,words])=>`<div><span>${esc(name)}</span><strong>${words.filter(([en])=>entries.get(en.toLowerCase())?.coreStatus).length}／${words.length}</strong></div>`).join('');
  $('#view .card .core-progress').after(panel);
};
function statsPageV2(){
  const c=coreCounts(),day=today(),weekDay=(new Date(day+'T12:00:00Z').getUTCDay()+6)%7,monday=dateShift(day,-weekDay);
  const weekCount=new Set(data.days.filter(d=>d>=monday&&d<=day)).size;
  const last7=dateShift(day,-6),history=learningLog().filter(e=>e.day>=last7&&e.day<=day);
  const delayed=history.filter(e=>e.kind==='review'&&e.delayed&&e.first);
  const delayedFirst=[...new Map([...delayed].reverse().map(e=>[e.day+'|'+e.id,e])).values()];
  const correct=delayedFirst.filter(e=>e.correct).length;
  const misses=new Map();
  history.filter(e=>e.kind==='review'&&!e.correct).forEach(e=>misses.set(e.id,(misses.get(e.id)||0)+1));
  const hardest=[...misses].sort((a,b)=>b[1]-a[1]).filter(([id])=>data.entries.some(e=>e.id===id)).slice(0,5);
  const series=Array.from({length:7},(_,i)=>{
    const d=dateShift(last7,i),events=history.filter(e=>e.day===d);
    return [d,events.filter(e=>e.kind==='a1').length,events.filter(e=>e.kind==='a2').length,events.filter(e=>e.kind==='review').length];
  });
  const max=Math.max(1,...series.map(([,a,b,c])=>a+b+c));
  const learned=a2Units.reduce((sum,[,,,items],i)=>sum+items.filter(([en])=>learnedA2()[a2Key(i,en)]).length,0);
  $('#view').innerHTML=`<section class="hero"><p class="eyebrow">YOUR PROGRESS</p><h1>統計</h1></section>
    <div class="stats">${[[c.classified.length+'/'+coreWords.length,'A1 已盤點'],[learned,'A2 已學'],[weekCount+'／3','本週練習天數'],[data.entries.filter(due).length,'今日到期'],[c.known,'A1 已會'],[data.entries.filter(a=>!a.reviewPaused&&(a.schedule||a.coreStatus==='review')).length,'複習中']].map(([n,label])=>`<div class="stat"><span>${label}</span><strong>${n}</strong></div>`).join('')}</div>
    <section class="card"><h2>近七天練習</h2><div class="study-legend"><span>A1 首次盤點</span><span>A2 新學</span><span>複習作答</span></div>
    <div class="study-chart">${series.map(([d,a,b,c])=>`<div class="study-chart-row"><span>${d.slice(5)}</span><div class="study-bar" role="img" aria-label="A1 ${a}，A2 ${b}，複習 ${c}">${[a,b,c].map((n,i)=>`<i class="bar-${i}" style="width:${n/max*100}%"></i>`).join('')}</div><strong>${a+b+c}</strong></div>`).join('')}</div><p class="muted">每日活動從新版開始記錄。</p></section>
    <section class="card"><h2>隔天以上首次答對</h2><p class="study-metric">${delayedFirst.length?`${correct}／${delayedFirst.length}（${Math.round(correct/delayedFirst.length*100)}%）`:'尚無紀錄'}</p></section>
    <section class="card"><h2>最近最常卡住</h2>${hardest.length?hardest.map(([id,n])=>`<button class="trouble-word" data-trouble="${esc(id)}"><strong lang="en">${esc(data.entries.find(a=>a.id===id).en)}</strong><small>${n} 次 · 再練 →</small></button>`).join(''):'<p class="muted">尚無紀錄</p>'}</section>`;
  document.querySelectorAll('[data-trouble]').forEach(b=>b.onclick=()=>{startRound([b.dataset.trouble],true);reviewDraft='';reviewShown=false;go('review');});
}
statsPage=statsPageV2;
