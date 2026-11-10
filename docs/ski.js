const skiUnits=[
 ['1｜認識裝備',[
  ['skis','滑雪板','These are my skis.','這是我的滑雪板。'],
  ['ski boots','滑雪靴','My ski boots are too tight.','我的滑雪靴太緊了。'],
  ['helmet','安全帽','Is this helmet the right size?','這頂安全帽尺寸合適嗎？'],
  ['goggles','雪鏡','I have my goggles.','我帶了雪鏡。'],
  ['poles','雪杖','Do I need poles today?','我今天需要雪杖嗎？']]],
 ['2｜聽懂基本指令',[
  ['stop','停下','Please stop here.','請在這裡停下。'],
  ['slow down','慢下來','Slow down before you turn.','轉彎前先減速。'],
  ['turn left','左轉','Turn left here.','在這裡左轉。'],
  ['turn right','右轉','Turn right here.','在這裡右轉。'],
  ['bend your knees','彎曲膝蓋','Bend your knees a little.','膝蓋稍微彎一點。']]],
 ['3｜上課時會用到',[
  ['beginner','初學者','I’m a beginner.','我是初學者。'],
  ['beginner slope','初學者雪道','Is this a beginner slope?','這是初學者雪道嗎？'],
  ['ski lift','滑雪纜車','Where is the ski lift?','滑雪纜車在哪裡？'],
  ['snowplow','犁式；八字煞車姿勢','Can you show me the snowplow?','可以示範犁式嗎？'],
  ['practice','練習','Can we practice stopping again?','我們可以再練一次停下來嗎？']]]
];
const skiQuestions=[
 ['這堂課結束時，我大概可以學到什麼程度？','What should I be able to do by the end of this lesson?'],
 ['我第一次滑雪。我們可以從最基本的開始嗎？','It’s my first time skiing. Can we start with the basics?'],
 ['可以請你說慢一點嗎？','Could you speak more slowly, please?'],
 ['可以再示範一次嗎？','Could you show me one more time?'],
 ['我們可以再練一次停下來嗎？','Can we practice stopping again?'],
 ['我還不太會轉彎。你可以教我嗎？','I’m still having trouble turning. Can you help me?'],
 ['這條雪道適合初學者嗎？','Is this slope OK for beginners?'],
 ['下課後，我應該先練習什麼？','What should I practice after the lesson?']
];
const skiDialogs=[
 ['第一次見到教練', [['我','It’s my first time skiing.','我第一次滑雪。'],['教練','Let’s start with how to stop.','我們先練怎麼停下來。'],['我','What should I be able to do by the end of this lesson?','這堂課結束時，我大概可以學到什麼程度？']]],
 ['沒聽懂時', [['教練','Bend your knees a little.','膝蓋稍微彎一點。'],['我','Could you show me one more time?','可以再示範一次嗎？'],['教練','Sure. Watch me first.','好，先看我。']]]
];
const previousSkiRender=render;
let skiTab='words',skiUnit=0,skiIndex=0;
function skiState(){
  if(!data.skiProject || typeof data.skiProject!=='object' || Array.isArray(data.skiProject)) data.skiProject={};
  return data.skiProject;
}
function skiReview(en,zh,example,meaning,type='word'){
  let entry=data.entries.find(e=>e.type===type&&e.en.toLowerCase()===en.toLowerCase());
  if(!entry){entry={id:crypto.randomUUID(),type,en,zh,topic:'滑雪',note:'英語滑雪課',level:0,reviews:0};data.entries.push(entry);}
  entry.meta={...entry.meta,example,meaning};
  entry.coreStatus='review';entry.reviewExcluded=false;entry.reviewPaused=false;entry.level=1;entry.due=0;delete entry.schedule;
  save();
}
const previousExampleMeaning=exampleMeaning;
exampleMeaning=function(en,example){
  const word=skiUnits.flatMap(([,items])=>items).find(item=>item[0].toLowerCase()===en.toLowerCase()&&item[2]===example);
  return word?word[3]:previousExampleMeaning(en,example);
};
render=function(){
  if(page==='ski'){renderSki();return;}
  previousSkiRender();
  if(page==='home'){
    const project=document.createElement('section');project.className='card';
    project.innerHTML='<p class="eyebrow">SHORT PROJECT · 12 月底</p><h2>英語滑雪課</h2><p>裝備 → 教練指令 → 開口提問</p><button type="button" class="primary" id="open-ski">進入滑雪專案 →</button>';
    $('#view .hero').after(project);
    $('#open-ski').onclick=()=>{const state=skiState();if(Number.isInteger(state.unit)&&skiUnits[state.unit]){skiUnit=state.unit;skiIndex=Number.isInteger(state.index)&&skiUnits[skiUnit][1][state.index]?state.index:0;}go('ski');window.scrollTo(0,0);};
  }
};
function renderSki(){
  const state=skiState();
  if(skiTab==='words'&&(state.unit!==skiUnit||state.index!==skiIndex)){state.unit=skiUnit;state.index=skiIndex;save();}
  mainNav.querySelectorAll('button').forEach(b=>{const active=b.dataset.page==='home';b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  subNav.innerHTML='';
  const [unit,items]=skiUnits[skiUnit];
  const [en,zh,example,meaning]=items[skiIndex];
  $('#view').innerHTML=`<section class="study-frame"><div class="study-head"><button id="ski-back">← 今日主頁</button><span class="tag">12 月底 · 短期專案</span></div><h1>英語滑雪課</h1>
  <div class="section-navigation">${[['words','單字與例句'],['dialogs','課堂會話'],['questions','問老師']].map(([id,name])=>`<button data-ski-tab="${id}" aria-pressed="${id===skiTab}">${name}</button>`).join('')}</div>
  ${skiTab==='words'?`<div class="core-tools">${skiUnits.map(([name],i)=>`<button data-ski-unit="${i}" aria-pressed="${i===skiUnit}">${name}</button>`).join('')}</div>
    <section class="card study-card flip-in"><p class="muted">${unit} · ${skiIndex+1}／${items.length}</p><h2 lang="en">${esc(en)}</h2><p>${esc(zh)}</p><button id="ski-word-audio">聽單字</button>
    <div class="study-example"><strong lang="en">${esc(example)}</strong><p>${esc(meaning)}</p><button id="ski-example-audio">聽例句</button></div>
    <div class="core-tools"><button id="ski-prev" ${skiIndex===0?'disabled':''}>上一張</button><button id="ski-mark">加入複習</button><button class="primary" id="ski-next">下一張 →</button></div></section>`:skiTab==='dialogs'?
    skiDialogs.map(([name,lines],i)=>`<section class="card"><h2>${name}</h2>${lines.map(([speaker,line,translation],j)=>`<div class="study-example"><span class="tag">${speaker}</span><p><strong lang="en">${esc(line)}</strong></p><p>${esc(translation)}</p><button data-ski-line="${i}:${j}">聽這句</button></div>`).join('')}</section>`).join(''):
    `<section class="card"><h2>問老師</h2><form id="ski-question-form"><label for="ski-question">輸入中文問題</label><textarea id="ski-question" rows="3" maxlength="500" placeholder="這堂課結束時，我大概可以學到什麼程度？">${esc(typeof state.draft==='string'?state.draft:'')}</textarea><div class="core-tools"><button class="primary" type="submit">找英文說法</button></div></form>
    <div class="core-tools">${skiQuestions.map(([q],i)=>`<button data-ski-question="${i}">${esc(q)}</button>`).join('')}</div><div id="ski-question-result" aria-live="polite"></div></section>`}
  </section>`;
  $('#ski-back').onclick=()=>go('home');
  document.querySelectorAll('[data-ski-tab]').forEach(b=>b.onclick=()=>{skiTab=b.dataset.skiTab;renderSki();});
  document.querySelectorAll('[data-ski-unit]').forEach(b=>b.onclick=()=>{skiUnit=Number(b.dataset.skiUnit);skiIndex=0;renderSki();});
  document.querySelectorAll('[data-ski-line]').forEach(b=>b.onclick=()=>{const [i,j]=b.dataset.skiLine.split(':').map(Number);speakAmericanEnglish(skiDialogs[i][1][j][1]);});
  if($('#ski-word-audio')){
    $('#ski-word-audio').onclick=()=>speakAmericanEnglish(en);
    $('#ski-example-audio').onclick=()=>speakAmericanEnglish(example);
    $('#ski-mark').onclick=e=>{skiReview(en,zh,example,meaning);e.currentTarget.textContent='已加入複習';e.currentTarget.disabled=true;};
    $('#ski-prev').onclick=()=>{if(skiIndex>0){skiIndex--;renderSki();}};
    $('#ski-next').onclick=()=>{if(skiIndex+1<items.length)skiIndex++;else if(skiUnit+1<skiUnits.length){skiUnit++;skiIndex=0;}else skiTab='dialogs';renderSki();};
  }
  if($('#ski-question-form')){
    const field=$('#ski-question');
    field.oninput=()=>{state.draft=field.value;save();};
    $('#ski-question-form').onsubmit=e=>{e.preventDefault();showSkiQuestion(field.value);};
    document.querySelectorAll('[data-ski-question]').forEach(b=>b.onclick=()=>{field.value=skiQuestions[Number(b.dataset.skiQuestion)][0];state.draft=field.value;save();showSkiQuestion(field.value);});
  }
}
function showSkiQuestion(value){
  const result=$('#ski-question-result');
  const question=value.trim();
  if(!question){result.textContent='請先輸入中文問題。';return;}
  const normalize=s=>s.replace(/[，。？！、,.?!\s]/g,'');
  const simplified=normalize(question);
  const match=skiQuestions.find(([q])=>normalize(q)===simplified)||(/^(我)?(大概)?(可以|能|會)學到(哪個階段|什麼程度|哪個程度)$/.test(simplified)?skiQuestions[0]:null);
  if(match){
    const [zh,en]=match;
    result.innerHTML=`<div class="study-example"><p><strong lang="en">${esc(en)}</strong></p><p>${esc(zh)}</p><div class="core-tools"><button id="ski-question-audio">聽英文</button><button id="ski-question-save">加入會話複習</button></div></div>`;
    $('#ski-question-audio').onclick=()=>speakAmericanEnglish(en);
    $('#ski-question-save').onclick=e=>{skiReview(en,zh,en,zh,'phrase');e.currentTarget.textContent='已加入複習';e.currentTarget.disabled=true;};
  }else{
    const prompt='請把下面的中文翻成一句簡短、自然的英文，讓我在日本的初學者滑雪課上問教練。請用容易聽懂的字，不要假設教練是英語母語者。先給英文，再附中文。\n\n'+question;
    result.innerHTML=`<div class="study-example"><p>這是自訂問題。複製後貼回聊天，我可以幫你翻成適合在雪場說的英文。</p><textarea id="ski-prompt" readonly rows="4" aria-label="翻譯提問">${esc(prompt)}</textarea><button id="ski-copy">複製翻譯提問</button></div>`;
    $('#ski-copy').onclick=async e=>{const button=e.currentTarget;try{await navigator.clipboard.writeText(prompt);button.textContent='已複製';}catch{$('#ski-prompt').select();}};
  }
}
render();
