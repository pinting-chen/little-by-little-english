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
  <section class="card"><h2>第一階段・A1 基礎喚醒</h2><p>從問候、家人、作息、飲食、問路與購物找回記憶。</p><p>已分流 ${counts.classified.length}／${coreWords.length} 字</p><progress class="core-progress" value="${counts.classified.length}" max="${coreWords.length}" aria-label="基礎單字進度"></progress><div class="core-tools"><button class="primary" data-start-core>${bilingual('繼續學新字','Learn New Words')}</button></div></section>
  <section class="card"><h2>第二階段・A2 主題學習</h2><p>學詞性、詞塊和例句，再試著換一個細節說出自己的句子。</p><button data-go="a2">選擇 A2 主題</button></section>
  <section class="card"><h2>英文地圖</h2><p>從動詞、句型與文法練習補強基礎。</p><button data-go="grammar">${bilingual('打開英文地圖','English Map')}</button></section>`;
  bind();
}
function statsPage() {
  const c=coreCounts();
  const days=Array.from({length:7},(_,i)=>new Date(Date.now()-(6-i)*86400000).toLocaleDateString('en-CA',{timeZone:'Asia/Taipei'}));
  const dayCounts=days.map(day=>c.classified.filter(a=>a.coreClassifiedOn===day).length);
  const max=Math.max(1,...dayCounts);
  $('#view').innerHTML=`<section class="hero"><p class="eyebrow">YOUR PROGRESS</p><h1>統計</h1><p>記錄你的累積，也看得到還想多練的部分。</p></section>
  <div class="stats">${[[c.classified.length+'/'+coreWords.length,'A1 已盤點'],[c.known,'已會'],[c.review,'需複習'],[data.days.length,'練習天數']].map(([n,label])=>`<div class="stat"><span>${label}</span><strong>${n}</strong></div>`).join('')}</div>
  <section class="card"><h2>A2 需複習</h2><p>${data.entries.filter(a=>a.a2Topic && a.coreStatus==='review').length} 筆主題詞彙</p></section><section class="card"><h2>近 7 天 A1 首次分流</h2><div class="daily-activity">${days.map((day,i)=>`<div><span>${esc(day.slice(5))}</span><meter min="0" max="${max}" value="${dayCounts[i]}" aria-label="${esc(day)} 分流 ${dayCounts[i]} 字"></meter><strong>${dayCounts[i]} 字</strong></div>`).join('')}</div><p class="muted">此處只計入 A1 字表內的首次分流。其他已收藏單字仍在單字庫。</p></section>`;
}
render=function(){
  if(page==='overview')overviewPage();
  else if(page==='stats')statsPage();
  else if(page==='a2')a2Page();
  else navigationRender();
  const section=({daily:'home',review:'home',grammar:'overview',a2:'overview',phrases:'library',quotes:'library',catalog:'library'})[page]||page;
  mainNav.querySelectorAll('button').forEach(button=>{
    const selected=button.dataset.page===section;
    button.classList.toggle('active',selected);
    if(selected)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
  });
  subNav.innerHTML=section==='library' ? [['library','我的單字'],['catalog','A1 基礎字表'],['phrases','我的會話'],['quotes','喜歡的句子']].map(([id,label])=>`<button type="button" data-sub-page="${id}" aria-pressed="${page===id}">${label}</button>`).join(''):'';
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

let a2Selected = 0;
function a2Page(){
  const [title,topicName,task,items]=a2Units[a2Selected];
  const entries=coreIndex();
  $('#view').innerHTML=`<section class="hero"><p class="eyebrow">CEFR A2</p><h1>第二階段・A2 主題學習</h1><p>先讀詞塊，聽一句例句，再換一個細節說出自己的句子。自由潛水是興趣延伸，專門詞彙不視為官方 A2 詞彙。</p></section>
  <div class="core-tools">${a2Units.map(([name],i)=>`<button type="button" data-a2-topic="${i}" aria-pressed="${i===a2Selected}">${esc(name)}</button>`).join('')}</div>
  <section class="card"><h2>${esc(title)}</h2><p>這一課的任務：${esc(task)}</p>
  ${items.map(([en,pos,zh,chunk,example,meaning],i)=>`<article class="core-word"><h3 lang="en">${esc(en)}</h3><p>${esc(pos)} · ${esc(zh)}</p><p>詞塊：<strong lang="en">${esc(chunk)}</strong></p><p lang="en">${esc(example)}</p><p>${esc(meaning)}</p>
  <div class="core-tools"><button data-a2-audio="${i}">聽例句</button><button data-a2-mark="${i}" aria-pressed="${entries.get(en.toLowerCase())?.coreStatus==='review'}">${entries.get(en.toLowerCase())?.coreStatus==='review'?'已加入複習':'不熟，加入複習'}</button></div></article>`).join('')}</section>`;
  document.querySelectorAll('[data-a2-topic]').forEach(b=>b.onclick=()=>{a2Selected=Number(b.dataset.a2Topic);a2Page();});
  document.querySelectorAll('[data-a2-audio]').forEach(b=>b.onclick=()=>speakAmericanEnglish(items[Number(b.dataset.a2Audio)][4]));
  document.querySelectorAll('[data-a2-mark]').forEach(b=>b.onclick=()=>{
    const [en,pos,zh,chunk,example,meaning]=items[Number(b.dataset.a2Mark)];
    const existing=coreIndex().get(en.toLowerCase());
    if(existing?.coreStatus==='review' && existing.a2Topic===title)return;
    markCore(en,zh,'review');
    const entry=coreIndex().get(en.toLowerCase());
    if(!existing){entry.topic=topicName;entry.note=`${pos}｜${chunk}｜${example}（${meaning}）`;}
    entry.a2Topic=title;
    save();
    b.setAttribute('aria-pressed','true');b.textContent='已加入複習';
  });
}

render();
