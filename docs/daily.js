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
  const unit = a1Units.find(([,words]) => words.some(([en]) => !entries.get(en.toLowerCase())?.coreStatus));
  return unit ? unit[1].filter(([en]) => !entries.get(en.toLowerCase())?.coreStatus).slice(0,batchSize) : [];
}
function markCore(en, zh, status) {
  let entry = coreIndex().get(en.toLowerCase());
  if (!entry) {
    entry = {id: crypto.randomUUID(), type:'word', en, zh, topic:'日常', note:'A1 基礎喚醒', level:0, reviews:0};
    data.entries.push(entry);
  }
  if (!entry.coreStatus) entry.coreClassifiedOn = today();
  entry.coreStatus = status;
  entry.level = status === 'known' ? 3 : 1;
  entry.due = 0;
  if (!data.days.includes(today())) data.days.push(today());
  save();
}
function renderCoreCard() {
  const entries = coreIndex();
  const isMarked = ([en]) => Boolean(entries.get(en.toLowerCase())?.coreStatus);
  if (!coreBatch.length) coreBatch = nextCoreBatch();
  const current = coreBatch.find(word => !isMarked(word));
  const count = coreWords.filter(isMarked).length;
  const [en, zh] = current || [];
  const unitTitle = a1Units.find(([,words])=>words.includes(current || coreBatch[0]))?.[0] || '基礎喚醒';
  $('#view').innerHTML = `<button type="button" id="core-home">← 回首頁</button>
    <section class="card daily-lesson">
      <p class="eyebrow">CEFR A1</p><h2>${esc(unitTitle)}</h2>
      <p class="muted" aria-live="polite">${current ? `這一批第 ${coreBatch.indexOf(current) + 1}／${coreBatch.length} 字` : '這一批已完成'} · 累計 ${count}／${coreWords.length} 字</p>
      ${current ? `<article class="core-word">
        <h3 lang="en" tabindex="-1" id="core-card-word">${esc(en)}</h3>
        <p class="core-card-meaning">${esc(zh)}</p>
        <div class="core-tools"><button type="button" id="core-card-audio">聽發音</button><button type="button" class="primary" id="core-card-known">已會</button><button type="button" id="core-card-review">加入複習</button></div>
      </article>` : `<p>${count===coreWords.length ? '已盤點完 A1 基礎字表。' : '要繼續學，還是先複習？'}</p><div class="core-tools">${count<coreWords.length ? '<button type="button" class="primary" id="core-next">繼續下一批</button>' : ''}<button type="button" id="core-review">開始複習</button></div>`}
    </section>`;
  $('#core-home').onclick = () => go('home');
  if (current) {
    $('#core-card-audio').onclick = () => speakAmericanEnglish(en);
    function advance(status) {
      markCore(en, zh, status);
      renderCoreCard();
      ($('#core-card-word') || $('#core-next') || $('#core-review')).focus({preventScroll:true});
    }
    $('#core-card-known').onclick = () => advance('known');
    $('#core-card-review').onclick = () => advance('review');
  } else {
    if ($('#core-next')) $('#core-next').onclick = () => {coreBatch = nextCoreBatch();renderCoreCard();};
    $('#core-review').onclick = () => go('review');
  }
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
    <section class="card"><p class="eyebrow">CEFR A1</p><h2>第一階段・A1 基礎喚醒</h2>
    <p>已分流 ${count}／${coreWords.length} 字</p><progress class="core-progress" value="${count}" max="${coreWords.length}" aria-label="已分流單字"></progress>
    <p class="muted">每批 20 字，先想意思，再揭開中文。不確定就加入複習。每次選擇都會立即儲存。</p>
    <div class="core-tools"><button data-core-view="batch" aria-pressed="${coreView==='batch'}">這一批</button><button data-core-view="all" aria-pressed="${coreView==='all'}">全部</button><button data-core-view="unclassified" aria-pressed="${coreView==='unclassified'}">未分流</button><button data-core-view="known" aria-pressed="${coreView==='known'}">已會單字 · ${known.length}</button><button data-core-view="review" aria-pressed="${coreView==='review'}">複習單字 · ${review.length}</button></div>
    <label id="core-search-label">搜尋基礎字表 <input id="core-search" type="search" placeholder="輸入英文或中文"></label><div class="core-results"></div>
    <div class="core-tools">${coreView==='batch' && batchDone && count<coreWords.length?'<button class="primary" id="core-next">繼續下一批</button>':''}<button id="core-review">開始複習</button></div></section>`;
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
  if (page==='daily') {renderCoreCard();return;}
  priorRender();
  if (page==='home') {
    const hero = $('#view .hero');
    const entries = coreIndex();
    const units = a1Units.map(([title,words]) => ({title,total:words.length,done:words.filter(([en])=>entries.get(en.toLowerCase())?.coreStatus).length}));
    const active = units.findIndex(unit=>unit.done<unit.total);
    const next = units[active];
    const dueCount = data.entries.filter(due).length;
    hero.innerHTML = `<p class="eyebrow">LITTLE BY LITTLE</p><h1>今日主頁</h1>
      <div class="today-actions">
        <button type="button" class="primary" id="open-core">${next?'學新字':'學 A2'}<span class="button-en">${next?esc(next.title):'主題學習'}</span></button>
        <button type="button" id="open-review">複習<span class="button-en">${dueCount} 筆待複習</span></button>
      </div>`;
    hero.nextElementSibling?.classList.contains('stats') && hero.nextElementSibling.remove();
    const route=document.createElement('section');
    route.className='card today-route';
    route.innerHTML=`<div class="today-route-title"><h2>A1 學習路線</h2><button type="button" id="today-overview">學習總覽 →</button></div>
      <ol>${units.map((unit,i)=>`<li ${i===active?'aria-current="step"':''}><span class="route-step">${unit.done===unit.total?'✓':i+1}</span><span>${esc(unit.title)}</span><span class="muted">${unit.done}/${unit.total}</span></li>`).join('')}</ol>
      <button type="button" id="today-a2">A2 主題學習 →</button>`;
    hero.after(route);
    $('#today-overview').onclick=()=>go('overview');
    $('#today-a2').onclick=()=>go('a2');
    document.querySelectorAll('#view .life-grid .lead').forEach(p=>p.remove());
    $('#open-core').onclick=()=>{coreView='batch';if (!coreBatch.some(([en])=>!entries.get(en.toLowerCase())?.coreStatus))coreBatch=nextCoreBatch();go(next?'daily':'a2');window.scrollTo(0,0);};
    $('#open-review').onclick=()=>go('review');
  }
};
if(page==='home')render();
