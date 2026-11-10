const batchSize = 20;
let coreBatch = [];
let coreView = 'batch';
let coreLimit = 50;
const priorRender = render;

function coreIndex() {
  return new Map(data.entries.filter(a => a.type === 'word').map(a => [a.en.toLowerCase(), a]));
}
function nextCoreBatch() {
  const entries = coreIndex();
  return coreWords.filter(([en]) => !entries.get(en.toLowerCase())?.coreStatus).slice(0, batchSize);
}
function markCore(en, zh, status) {
  let entry = coreIndex().get(en.toLowerCase());
  if (!entry) {
    entry = {id: crypto.randomUUID(), type:'word', en, zh, topic:'日常', note:'基礎 1000 字', level:0, reviews:0};
    data.entries.push(entry);
  }
  if (!entry.coreStatus) entry.coreClassifiedOn = today();
  entry.coreStatus = status;
  entry.level = status === 'known' ? 3 : 1;
  entry.due = 0;
  if (!data.days.includes(today())) data.days.push(today());
  save();
}
function renderCore() {
  const entries = coreIndex();
  const known = coreWords.filter(([en]) => entries.get(en.toLowerCase())?.coreStatus === 'known');
  const review = coreWords.filter(([en]) => entries.get(en.toLowerCase())?.coreStatus === 'review');
  if (!coreBatch.length) coreBatch = nextCoreBatch();
  const rows = coreView === 'known' ? known : coreView === 'review' ? review : coreView === 'all' ? coreWords : coreView === 'unclassified' ? coreWords.filter(([en]) => !entries.get(en.toLowerCase())?.coreStatus) : coreBatch;
  const count = known.length + review.length;
  const batchDone = coreBatch.length > 0 && coreBatch.every(([en]) => entries.get(en.toLowerCase())?.coreStatus);
  $('#view').innerHTML = `<button type="button" id="core-home">← 回首頁</button>
    <section class="card"><p class="eyebrow">CORE VOCABULARY</p><h2>基礎 1,000 字</h2>
    <p>已分流 ${count}／1,000 字</p><progress class="core-progress" value="${count}" max="1000" aria-label="已分流單字"></progress>
    <p class="muted">每批 20 字，今天想多學可以繼續下一批。每次選擇都會立即儲存。</p>
    <div class="core-tools"><button data-core-view="batch" aria-pressed="${coreView==='batch'}">這一批</button><button data-core-view="all" aria-pressed="${coreView==='all'}">全部</button><button data-core-view="unclassified" aria-pressed="${coreView==='unclassified'}">未分流</button><button data-core-view="known" aria-pressed="${coreView==='known'}">已會單字 · ${known.length}</button><button data-core-view="review" aria-pressed="${coreView==='review'}">複習單字 · ${review.length}</button></div>
    <label id="core-search-label">搜尋基礎字表 <input id="core-search" type="search" placeholder="輸入英文或中文"></label><div class="core-results"></div>
    <div class="core-tools">${coreView==='batch' && batchDone && count<1000?'<button class="primary" id="core-next">繼續下一批</button>':''}<button id="core-review">開始複習</button></div></section>`;
  const results = $('.core-results');
  const search = $('#core-search');
  const filtered = query => rows.filter(([en,zh]) => !query || (en+' '+zh).toLowerCase().includes(query));
  function drawRows(query = '') {
  const matches = filtered(query);
  const visible = coreView === 'batch' ? matches : matches.slice(0, coreLimit);
  results.innerHTML = visible.map(([en,zh], i) => {
    const status = entries.get(en.toLowerCase())?.coreStatus;
    return `<article class="core-word"><h3 lang="en">${esc(en)}</h3><details ${status?'open':''}><summary>看中文意思</summary><p>${esc(zh)}</p></details>
    <div class="core-tools"><button data-core-audio="${i}">聽發音</button><button data-core-mark="${i}" data-status="known" aria-pressed="${status==='known'}">已會</button><button data-core-mark="${i}" data-status="review" aria-pressed="${status==='review'}">加入複習</button></div></article>`;
  }).join('') || '<p>這裡目前沒有單字。</p>';
  if (matches.length > visible.length) results.insertAdjacentHTML('beforeend','<div class="core-tools"><button id="core-more">顯示更多</button></div>');
  document.querySelectorAll('[data-core-audio]').forEach(b => b.onclick = () => speakAmericanEnglish(visible[Number(b.dataset.coreAudio)][0]));
  document.querySelectorAll('[data-core-mark]').forEach(b => b.onclick = () => {
    const [en,zh] = visible[Number(b.dataset.coreMark)];
    markCore(en,zh,b.dataset.status);
    const y = window.scrollY;
    renderCore();
    if (query) {const input = $('#core-search');input.value=query;input.dispatchEvent(new Event('input'));}
    window.scrollTo(0,y);
  });
  if ($('#core-more')) $('#core-more').onclick = () => {coreLimit+=50;drawRows(query);};
  }
  drawRows();
  search.oninput = () => {coreLimit=50;drawRows(search.value.trim().toLowerCase());};
  $('#core-home').onclick = () => go('home');
  $('#core-review').onclick = () => go('review');
  document.querySelectorAll('[data-core-view]').forEach(b => b.onclick = () => {coreView=b.dataset.coreView;coreLimit=50;renderCore();});
  if ($('#core-next')) $('#core-next').onclick = () => {coreBatch=nextCoreBatch();renderCore();window.scrollTo(0,0);};
}
render = function () {
  if (page==='daily') {renderCore();return;}
  priorRender();
  if (page==='home') {
    const review = $('#view .hero [data-go="review"]');
    const tools = document.createElement('div');
    tools.className='daily-words';
    tools.innerHTML=`<button type="button" class="primary" id="open-core">學新字<span class="button-en" lang="en">Learn New Words</span></button><button type="button" class="primary" id="open-review">複習<span class="button-en" lang="en">Review · ${data.entries.filter(due).length} 筆</span></button>`;
    review.replaceWith(tools);
    $('#open-core').onclick=()=>{coreView='batch';go('daily');window.scrollTo(0,0);};
    $('#open-review').onclick=()=>go('review');
  }
};
if(page==='home')render();
