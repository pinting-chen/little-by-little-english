const KEY='little-by-little-english-v1', labels=['未複習','忘記了','需要提示','想得起來'];
let data={entries:[],days:[]}, storageError=false;try{const raw=localStorage.getItem(KEY);if(raw)data=validate(JSON.parse(raw));}catch(e){storageError=true;}
let page='home',filter='',topic='全部主題',level='all',queue=[],index=0,revealed=false;
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function validate(x){const isDay=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d));if(x?.learningLog!==undefined&&(!Array.isArray(x.learningLog)||!x.learningLog.every(e=>e&&isDay(e.day)&&['a1','a2','review'].includes(e.kind)&&typeof e.id==='string')))throw Error('學習紀錄格式不正確');if(x?.studyRound!==undefined){const r=x.studyRound;if(!r||!isDay(r.day)||!Array.isArray(r.cards)||!Number.isInteger(r.cursor)||r.cursor<0||r.cursor>r.cards.length||!r.cards.every(c=>c&&typeof c.id==='string'&&typeof c.retry==='boolean'&&typeof c.practice==='boolean'))throw Error('複習進度格式不正確');}if(!x||!Array.isArray(x.entries)||!Array.isArray(x.days)||x.entries.length>10000)throw Error('格式不正確');if(x.quotes!==undefined){if(!Array.isArray(x.quotes)||x.quotes.length>10000)throw Error('語句收藏格式不正確');const quoteIds=new Set();for(const q of x.quotes){if(!q||typeof q.id!=='string'||quoteIds.has(q.id)||!['text','meaning','theme','source','url','chunks','usage','feeling'].every(k=>typeof q[k]==='string'))throw Error('語句收藏欄位不正確');quoteIds.add(q.id)}}const ids=new Set();for(const a of x.entries){if(!a||typeof a.id!=='string'||ids.has(a.id)||!['word','phrase'].includes(a.type)||!['en','zh','topic','note'].every(k=>typeof a[k]==='string')||![0,1,2,3].includes(a.level)||!Number.isInteger(a.reviews)||a.reviews<0)throw Error('資料格式不正確');if(a.meta!==undefined){const m=a.meta;if(!m||typeof m!=='object'||Array.isArray(m))throw Error('分類格式不正確');for(const k of ['topics','collocations','chunks'])if(m[k]!==undefined&&(!Array.isArray(m[k])||!m[k].every(v=>typeof v==='string')))throw Error('分類標籤格式不正確');for(const k of ['pos','band','ling','formation','parts','root','family','example','meaning','source','exam'])if(m[k]!==undefined&&typeof m[k]!=='string')throw Error('分類欄位格式不正確')}ids.add(a.id)}if(!x.days.every(d=>typeof d==='string'))throw Error('日期格式不正確');return x}
function today(){return new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Taipei'})}function save(){try{localStorage.setItem(KEY,JSON.stringify(data));storageError=false}catch(e){storageError=true}$('#storage').textContent=storageError?' 儲存失敗：請先匯出備份。':''}
function rate(id,n){const a=data.entries.find(a=>a.id===id);a.level=n;if(n<3)a.reviewExcluded=false;if(a.coreStatus)a.coreStatus=n===3?'known':'review';a.reviews++;a.last=Date.now();a.due=Date.now()+[0,0,86400000,259200000][n];if(!data.days.includes(today()))data.days.push(today());save()}
function due(a){return !a.reviewExcluded&&a.coreStatus!=='known'&&(!a.due||a.due<=Date.now())}function go(p){page=p;filter='';topic='全部主題';level='all';if(p==='review'){queue=data.entries.filter(due).map(a=>a.id);index=0;revealed=false}render()}
function shell(title,sub){return `<div class="section-head"><div><p class="eyebrow">LITTLE STEPS, EVERY DAY</p><h1>${title}</h1><p class="lead">${sub}</p></div><button class="primary" id="new">＋ 收進筆記<span class="button-en" lang="en">Add Note</span></button></div>`}
function render(){document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));const v=$('#view');if(page==='home'){const words=data.entries.filter(a=>a.type==='word');v.innerHTML=`<section class="hero"><p class="eyebrow">你的英文，從生活開始</p><h1>今天，也前進一點點。</h1><p class="lead">一個單字、一句對話，或是海洋裡的一個新發現。<br>有空的時候，回來找回一點記憶。</p><button class="primary" data-go="review">花一點時間複習 ↗<span class="button-en" lang="en">Start Review</span></button></section><div class="stats">${[[words.length,'收錄單字','筆記中的不同單字'],[words.filter(a=>a.level===3).length,'想得起來','最近一次自評熟悉'],[data.entries.filter(due).length,'可以複習','包含單字與會話'],[data.days.length,'練習天數','有留下複習紀錄的日子']].map(a=>`<div class="stat"><span>${a[1]}</span><strong>${a[0]}</strong><small>${a[2]}</small></div>`).join('')}</div><div class="grid"><section class="card"><span class="tag">生活主題</span><h2>週末，往海裡去。</h2><p class="english">I go freediving<br>on weekends.</p><p class="lead">我週末會去自由潛水。</p><p class="muted">先接觸過 ≠ 已經熟悉。想不起來，也是一個新的起點。</p><button data-go="phrases">看看我的會話 →<span class="button-en" lang="en">My Phrases</span></button></section><section class="card"><p class="eyebrow">BACK TO BASICS</p><h2>動詞，原來會換衣服。</h2><p class="lead">go → goes → went → gone → going<br>把曾經學過的基礎，一點點接回來。</p><button data-go="grammar">打開英文地圖 →<span class="button-en" lang="en">English Map</span></button><h3>熟悉度由你決定</h3><p class="muted">單字量是收錄的不重複單字數，不代表完整詞彙能力。片語與會話另外計算。</p></section></div>`}
if(page==='words'||page==='phrases'){v.innerHTML=shell(page==='words'?'我的單字收藏':'用得上的會話',page==='words'?'把生活裡遇見的字，變成自己的字。':'保留你真的會說、也想記住的句子。')+`<div class="toolbar"><input id="search" placeholder="搜尋英文、中文或筆記" aria-label="搜尋"><select id="topic" aria-label="主題">${['全部主題','日常','工作','自由潛水','滑雪','旅遊'].map(t=>`<option>${t}</option>`).join('')}</select><select id="level" aria-label="熟悉度"><option value="all">全部熟悉度</option>${labels.map((s,i)=>`<option value="${i}">${s}</option>`).join('')}</select></div><div id="list"></div>`;list();$('#search').oninput=e=>{filter=e.target.value;list()};$('#topic').onchange=e=>{topic=e.target.value;list()};$('#level').onchange=e=>{level=e.target.value;list()}}
if(page==='review')review();if(page==='grammar')grammar();bind();save()}
function list(){const arr=data.entries.filter(a=>a.type===(page==='words'?'word':'phrase')&&(topic==='全部主題'||topic===a.topic)&&(level==='all'||a.level===Number(level))&&[a.en,a.zh,a.note].join(' ').toLowerCase().includes(filter.toLowerCase()));$('#list').innerHTML=arr.length?arr.map(a=>`<article class="card item"><div><span class="tag">${esc(a.topic)}</span><h3 class="english">${esc(a.en)}</h3><p>${esc(a.zh)}</p><p class="muted">${esc(a.note)}</p><button data-speak="${esc(a.id)}" aria-label="朗讀 ${esc(a.en)}">▷ 聽發音<span class="button-en" lang="en">Listen</span></button></div><div><label class="muted">我的熟悉度<br><select class="rating" data-rate="${esc(a.id)}">${labels.map((s,i)=>`<option value="${i}" ${a.level===i?'selected':''}>${s}</option>`).join('')}</select></label><p class="muted">已複習 ${a.reviews} 次</p><button data-delete="${esc(a.id)}">移除<span class="button-en" lang="en">Remove</span></button></div></article>`).join(''):'<p class="empty">這裡還沒有符合的筆記。可以先收進今天遇到的一句英文。</p>';bind()}
function bind(){document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));document.querySelectorAll('[data-speak]').forEach(b=>b.onclick=()=>{speakAmericanEnglish(data.entries.find(a=>a.id===b.dataset.speak).en)});document.querySelectorAll('[data-rate]').forEach(b=>b.onchange=()=>{rate(b.dataset.rate,Number(b.value));list()});document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{if(confirm('確定移除這筆學習筆記？')){data.entries=data.entries.filter(a=>a.id!==b.dataset.delete);save();list()}});if($('#new'))$('#new').onclick=()=>$('#add').showModal()}
const reviewExamples = [
'Hello, I’m Mia!|Goodbye, see you tomorrow!|A glass of water, please.|Thanks for your help.|Sorry, I’m late.|Yes, I can help.|No, I don’t have a pen.|My name is Mia.|I live here.|Do you live here?|We go to the same school.|They are my friends.|I want to be a teacher.|Nice to meet you.|I’m from Taiwan.|I live near the park.|I speak a little English.|I study English every day.|She is my friend.|I’m a student.',
'My family lives here.|My mother likes tea.|My father is at home.|My sister reads a lot.|My brother is at school.|I go home after work.|We live in a small house.|My room is upstairs.|Please close the door.|Open the window, please.|The book is on the table.|This chair is free.|The bag is under the bed.|My phone is in my bag.|I have a new book.|Where is my phone?|This is my key.|I have two sisters.|This is my bag.|Is that your coat?',
'I walk to school every day.|I work five days a week.|See you this weekend.|I drink tea in the morning.|Let’s meet this afternoon.|I read at night.|I’m busy today.|See you tomorrow.|I need to go now.|What time is it?|I get up early.|Sorry, I’m late.|I get my books from the library.|I go to work by bus.|Can you come here?|I sleep well at night.|I work in a shop.|I study at home.|I read before bed.|We watch TV after dinner.',
'The food is good here.|Can I have some water?|I’d like some tea, please.|I drink coffee in the morning.|I put milk in my coffee.|I eat bread for breakfast.|We have rice for dinner.|I’d like an egg, please.|I have an apple in my bag.|We’re having chicken for dinner.|What do you eat for breakfast?|Let’s have lunch together.|Dinner is at seven.|I eat lunch at work.|I drink water after I walk.|I want a cup of tea.|I need some water.|I like this soup.|Can I have some rice?|Would you like more tea?',
'Where is the station?|Please wait here.|The bus stop is over there.|Turn left at the corner.|The shop is on the right.|I live near the station.|The school is on this street.|I walk to school.|There’s a shop near my house.|Let’s meet at the park.|The station is on your left.|I take the bus to work.|The train is here.|My car is near the park.|I walk home after school.|Please stop here.|Is the shop open?|Please close the door.|Can you help me?|I can’t find my phone.',
'I want to buy this bag.|Can I pay by card?|I don’t have any money.|What’s the price of this bag?|How do I get there?|How much is this?|How many books do you have?|I have one brother.|I’d like two eggs.|I have three books.|This bag is too big.|I need a small bag.|This is my new phone.|My bike is old.|The food is good.|The weather is bad today.|The tea is hot.|The water is cold.|I’m happy to see you.|I’m tired after work.'
];
let reviewAttempt = '';
function exampleForReview(entry){
  if(entry.type==='phrase')return entry.en;
  const key=entry.en.trim().toLowerCase();
  const custom=typeof meta==='function' ? meta(entry).example : entry.meta?.example;
  if(custom)return custom;
  for(const [, , , items] of (typeof a2Units==='undefined'?[]:a2Units)){
    const word=items.find(item=>item[0].toLowerCase()===key);
    if(word)return word[4];
  }
  const units=typeof a1Units==='undefined'?[]:a1Units;
  for(let i=0;i<units.length;i++){
    const n=units[i][1].findIndex(([word])=>word.toLowerCase()===key);
    if(n>=0)return reviewExamples[i]?.split('|')[n]||'';
  }
  return '';
}
function review(){
  const a=data.entries.find(a=>a.id===queue[index]);
  const example=a&&revealed?exampleForReview(a):'';
  const normalize=s=>s.normalize('NFKC').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/[.!?]+$/,'').replace(/\s+/g,' ');
  $('#view').innerHTML=shell('找回一點記憶','先輸入英文，再看答案和例句。')+(a?`<p class="muted">本輪 ${index+1} / ${queue.length}</p><section class="card review-card"><span class="tag">${esc(a.topic)} · ${a.type==='word'?'單字':'會話'}</span><h2>${esc(a.zh)}</h2>
  ${revealed?`<div aria-live="polite">${reviewAttempt?`<p>你的答案：<strong lang="en">${esc(reviewAttempt)}</strong></p><p>${normalize(reviewAttempt)===normalize(a.en)?'拼字符合這張卡片的答案。':'和這張卡片的答案不同，看看下面的寫法。'}</p>`:''}<p class="english" lang="en">${esc(a.en)}</p>
  ${example?`<p class="muted">例句</p><p lang="en">${esc(example)}</p>`:(a.note&&!['A1 基礎喚醒','基礎 1000 字','每日小課'].includes(a.note)?`<p class="lead">${esc(a.note)}</p>`:'')}
  </div><button type="button" data-speak="${esc(a.id)}">▷ 聽發音</button><div class="actions"><button type="button" data-answer="again">需要再複習</button><button type="button" class="primary" data-answer="done">不用再複習</button></div>`:`<form id="review-answer"><label for="review-input">輸入英文</label><input id="review-input" lang="en" placeholder="試著拼出英文" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="300"><div class="actions"><button class="primary" type="submit">核對答案</button><button id="reveal" type="button">直接看答案</button></div></form>`}</section>`:`<section class="card review-card"><h2>${queue.length?'這一輪，先到這裡。':'目前沒有到期的複習。'}</h2><p class="lead">需要再複習的內容會留在下次；不用再複習的內容仍保留在單字庫或會話庫。</p><button id="all">自由練習全部筆記<span class="button-en" lang="en">Practice All</span></button></section>`);
  const reveal=()=>{reviewAttempt=$('#review-input').value.trim();revealed=true;review();};
  if($('#review-answer'))$('#review-answer').onsubmit=e=>{e.preventDefault();reveal();};
  if($('#reveal'))$('#reveal').onclick=reveal;
  document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{
    const done=b.dataset.answer==='done';
    a.reviewExcluded=done&&!a.coreStatus;
    rate(a.id,done?3:1);
    index++;revealed=false;reviewAttempt='';review();
  });
  if($('#all'))$('#all').onclick=()=>{queue=data.entries.map(a=>a.id);index=0;revealed=false;reviewAttempt='';review();};
  bind();
}
function grammar(){$('#view').innerHTML=shell('把基礎，慢慢接回來。','先認得架構，再回到你會用的生活句子。')+`<section class="card"><p class="eyebrow">YOUR ENGLISH MAP</p><h2>從詞語，到一句完整的話</h2><p class="lead">單字與詞性 → 句子的骨架 → 動詞變化與時間 → 否定與問句 → 連接想法</p><details><summary>① 詞性：一句話裡，各自做什麼？</summary><p>名詞：人、事、物，如 ocean（海洋）。<br>動詞：動作或狀態，如 read（讀）、be（是／處於）。<br>形容詞：描述名詞，如 a beautiful ocean（美麗的海洋）。<br>副詞：補充動作等資訊，如 swim slowly（慢慢游）。<br>代名詞：I、you、it。介系詞：in、on、about。</p></details><details><summary>② 句子的骨架：誰＋做什麼？</summary><p>I swim. 我游泳。〔主詞＋動詞〕<br>I read articles. 我閱讀文章。〔主詞＋動詞＋受詞〕<br>The ocean is beautiful. 海洋很美。〔主詞＋連綴動詞＋補語〕<br>這裡先從三種常用結構開始。</p></details><details><summary>③ 時間：平常、現在、過去、未來</summary><p>I dive on weekends. 我週末潛水。〔習慣〕<br>I am reading. 我正在閱讀。〔be＋V-ing〕<br>I went diving yesterday. 我昨天去潛水。〔過去〕<br>I will travel next month. 我下個月會去旅行。〔will＋原形〕</p></details><details><summary>④ 否定與問句：do / does / did</summary><p>I don't ski. 我不滑雪。<br>Do you ski? 你滑雪嗎？<br>Does she ski? 她滑雪嗎？<br>Did you ski yesterday? 你昨天有滑雪嗎？<br>有 does 或 did 時，後面的動詞用原形 ski。be 動詞則是 Are you tired?／I am not tired.</p></details><details><summary>⑤ 把想法接起來：and / but / because</summary><p>I like the ocean because it is beautiful.<br>我喜歡海洋，因為它很美。<br>and：和／而且；but：但是；because：因為。</p></details></section><section class="card"><h2>動詞的 5 大基本形態</h2><p class="lead">這是五種形式，不是五種時態。先用 go、read、work 找回熟悉感。</p><div class="scroll"><table><thead><tr><th>形式</th><th>go</th><th>read</th><th>work</th><th>怎麼用</th></tr></thead><tbody><tr><td>原形</td><td>go</td><td>read</td><td>work</td><td>I go.／I can go.</td></tr><tr><td>第三人稱單數現在式</td><td>goes</td><td>reads</td><td>works</td><td>She goes.</td></tr><tr><td>過去式</td><td>went</td><td>read</td><td>worked</td><td>I went yesterday.</td></tr><tr><td>過去分詞</td><td>gone</td><td>read</td><td>worked</td><td>She has gone home.</td></tr><tr><td>V-ing 形式</td><td>going</td><td>reading</td><td>working</td><td>I am going home.</td></tr></tbody></table></div><p class="muted">read 的原形讀 /riːd/，過去式與過去分詞讀 /red/，拼法相同。過去分詞常與 have 或 be 搭配；V-ing 也可以作動名詞，如 I like swimming.</p></section><section class="card"><h2>試著把記憶找回來</h2><p id="q"></p><div id="choices" class="actions"></div><p id="feedback" aria-live="polite"></p><button id="nextq">換一題 →<span class="button-en" lang="en">Next Question</span></button></section>`;quiz();$('#nextq').onclick=quiz}
const questions=[['She ___ freediving on weekends.',['go','goes','going'],1,'She 是第三人稱單數，習慣性的動作用 goes。'],['Yesterday, I ___ to the beach.',['go','gone','went'],2,'Yesterday 是昨天，go 的過去式是 went。'],['I am ___ an article.',['read','reading','reads'],1,'正在做某事：be 動詞＋V-ing，所以用 am reading。'],['Did you ___ yesterday?',['ski','skied','skiing'],0,'did 已經表達過去，後面的動詞用原形 ski。'],['She has ___ home.',['went','goes','gone'],2,'has＋過去分詞：go 的過去分詞是 gone。'],['I go freediving ___ weekends.',['on','at the','in'],0,'這裡練習美式常用的 on weekends；英式也常用 at weekends。']];let qi=-1;function quiz(){qi=(qi+1)%questions.length;const q=questions[qi];$('#q').textContent=q[0];$('#feedback').textContent='';$('#feedback').className='';$('#choices').innerHTML=q[1].map((a,i)=>`<button data-choice="${i}">${a}</button>`).join('');document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{$('#feedback').className='feedback';$('#feedback').textContent=(Number(b.dataset.choice)===q[2]?'想起來了！':'再看一下：正確答案是 '+q[1][q[2]]+'。')+q[3]})}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>go(b.dataset.page));$('#cancel').onclick=()=>$('#add').close();$('#entry').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),a=Object.fromEntries(f);a.en=a.en.trim();a.zh=a.zh.trim();if(!a.en||!a.zh)return;if(data.entries.some(x=>x.type===a.type&&x.en.toLowerCase()===a.en.toLowerCase())){alert('已經收錄過這筆英文，可以在筆記中搜尋。');return}data.entries.push({...a,id:crypto.randomUUID(),level:0,reviews:0});save();$('#add').close();e.target.reset();go(a.type==='word'?'words':'phrases')};$('#export').onclick=()=>{const blob=new Blob([JSON.stringify({...data,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='english-notes-'+today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};$('#import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5000000)throw Error('檔案太大');const next=validate(JSON.parse(await file.text()));if(confirm('以此備份取代目前筆記？建議先匯出目前資料。')){data=next;save();render()}}catch(err){alert('無法匯入：'+err.message)}e.target.value=''};$('#date').textContent=new Date().toLocaleDateString('zh-TW',{timeZone:'Asia/Taipei',month:'long',day:'numeric',weekday:'long'});render();

let pronunciationRequest = 0;
async function speakAmericanEnglish(text) {
  const synth = window.speechSynthesis;
  if (!synth || !window.SpeechSynthesisUtterance) {
    alert('此瀏覽器不支援朗讀。');
    return;
  }
  const request = ++pronunciationRequest;
  synth.cancel();
  if (!synth.getVoices().length) {
    await new Promise(resolve => {
      const done = () => {
        clearTimeout(timer);
        synth.removeEventListener('voiceschanged', done);
        resolve();
      };
      const timer = setTimeout(done, 750);
      synth.addEventListener('voiceschanged', done, {once: true});
    });
  }
  if (request !== pronunciationRequest) return;
  const score = voice => /natural|neural|premium|enhanced/i.test(voice.name) ? 3 :
    /Google US English|Samantha/i.test(voice.name) ? 2 : voice.default ? 1 : 0;
  const voice = synth.getVoices()
    .filter(voice => /^en[-_]US$/i.test(voice.lang))
    .sort((a, b) => score(b) - score(a))[0];
  if (!voice) {
    alert('找不到美式英語語音。請在裝置的語音設定加入 English (United States)，再重新整理頁面。');
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = 1;
  utterance.pitch = 1;
  synth.speak(utterance);
}
