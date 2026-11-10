const navigationRender = render;
const primaryPages = [
  ['home','今日主頁','Today'],
  ['overview','學習總覽','Learning'],
  ['library','單字庫','Word Library'],
  ['stats','統計','Stats']
];
const mainNav = document.querySelector('aside nav');
mainNav.setAttribute('aria-label','主要導覽');
mainNav.innerHTML = primaryPages.map(([id,zh,en]) => `<button type="button" data-page="${id}">${bilingual(zh,en)}</button>`).join('');
mainNav.querySelectorAll('button').forEach(button => button.onclick = () => {
  go(button.dataset.page);
  window.scrollTo(0,0);
});
const subNav = document.createElement('div');
subNav.className = 'section-navigation';
$('#view').before(subNav);
const backup = document.querySelector('aside .import');
document.querySelector('.footer-tools').append(backup);

function coreCounts() {
  const entries = coreIndex();
  const classified = coreWords.map(([en]) => entries.get(en.toLowerCase())).filter(a => a?.coreStatus);
  return {classified, known:classified.filter(a=>a.coreStatus==='known').length, review:classified.filter(a=>a.coreStatus==='review').length};
}
function overviewPage() {
  const counts=coreCounts();
  $('#view').innerHTML=`<section class="hero"><p class="eyebrow">LEARNING PATH</p><h1>學習總覽</h1><p>從常用單字開始，再把它用在喜歡的主題裡。</p></section>
  <section class="card"><h2>基礎 1,000 字</h2><p>已分流 ${counts.classified.length}／1,000 字</p><progress class="core-progress" value="${counts.classified.length}" max="1000" aria-label="基礎單字進度"></progress><div class="core-tools"><button class="primary" data-start-core>${bilingual('繼續學新字','Learn New Words')}</button></div></section>
  <section class="card"><h2>主題學習</h2><p>自由潛水：從裝備、海邊情境和潛伴對話開始。</p><button id="dive-phrases">${bilingual('打開潛水會話','Freediving Phrases')}</button></section>
  <section class="card"><h2>英文地圖</h2><p>從動詞、句型與文法練習補強基礎。</p><button data-go="grammar">${bilingual('打開英文地圖','English Map')}</button></section>`;
  $('#dive-phrases').onclick=()=>{go('phrases');topic='自由潛水';$('#topic').value=topic;list();};
  bind();
}
function statsPage() {
  const c=coreCounts();
  const days=Array.from({length:7},(_,i)=>new Date(Date.now()-(6-i)*86400000).toLocaleDateString('en-CA',{timeZone:'Asia/Taipei'}));
  const dayCounts=days.map(day=>c.classified.filter(a=>a.coreClassifiedOn===day).length);
  const max=Math.max(1,...dayCounts);
  $('#view').innerHTML=`<section class="hero"><p class="eyebrow">YOUR PROGRESS</p><h1>統計</h1><p>記錄你的累積，也看得到還想多練的部分。</p></section>
  <div class="stats">${[[c.classified.length+'/1,000','已分流'],[c.known,'已會'],[c.review,'需複習'],[data.days.length,'練習天數']].map(([n,label])=>`<div class="stat"><span>${label}</span><strong>${n}</strong></div>`).join('')}</div>
  <section class="card"><h2>近 7 天首次分流</h2><div class="daily-activity">${days.map((day,i)=>`<div><span>${esc(day.slice(5))}</span><meter min="0" max="${max}" value="${dayCounts[i]}" aria-label="${esc(day)} 分流 ${dayCounts[i]} 字"></meter><strong>${dayCounts[i]} 字</strong></div>`).join('')}</div><p class="muted">從新版開始記錄每日首次分流。舊資料保留在總數，沒有補填日期。</p></section>`;
}
render=function(){
  if(page==='overview')overviewPage();
  else if(page==='stats')statsPage();
  else navigationRender();
  const section=({daily:'home',review:'home',grammar:'overview',phrases:'library',quotes:'library',catalog:'library'})[page]||page;
  mainNav.querySelectorAll('button').forEach(button=>{
    const selected=button.dataset.page===section;
    button.classList.toggle('active',selected);
    if(selected)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
  });
  subNav.innerHTML=section==='library' ? [['library','我的單字'],['catalog','基礎 1,000 字'],['phrases','我的會話'],['quotes','喜歡的句子']].map(([id,label])=>`<button type="button" data-sub-page="${id}" aria-pressed="${page===id}">${label}</button>`).join(''):'';
  subNav.querySelectorAll('button').forEach(button=>button.onclick=()=>{
    if(button.dataset.subPage==='catalog'){coreView='all';coreLimit=50;}
    go(button.dataset.subPage);window.scrollTo(0,0);
  });
  document.querySelectorAll('[data-start-core]').forEach(button=>button.onclick=()=>{coreView='batch';go('daily');window.scrollTo(0,0);});
};
const mainRender=render;
render=function(){
  if(page==='catalog'){
    renderCore();
    mainNav.querySelectorAll('button').forEach(button=>{
      const selected=button.dataset.page==='library';
      button.classList.toggle('active',selected);
      if(selected)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
    });
    subNav.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.subPage==='catalog')));
  }else mainRender();
};
render();
