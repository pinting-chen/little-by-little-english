const dailyLessons = [
 ['打招呼','hello|你好','thanks|謝謝','please|請','Hello!|你好！'],
 ['你和我','I|我','you|你','we|我們','Thank you.|謝謝你。'],
 ['想要什麼','want|想要','water|水','tea|茶','I want water, please.|我想要水，謝謝。'],
 ['今天好嗎','good|好的','tired|累的','happy|開心的','I am tired today.|我今天很累。'],
 ['聊聊今天','today|今天','tomorrow|明天','now|現在','See you tomorrow.|明天見。'],
 ['早晚問候','morning|早晨','night|夜晚','see|看見','Good morning!|早安！'],
 ['吃點東西','eat|吃','bread|麵包','rice|米飯','I eat rice.|我吃飯。'],
 ['說說喜好','like|喜歡','coffee|咖啡','milk|牛奶','I like coffee.|我喜歡咖啡。'],
 ['開始工作','work|工作','busy|忙碌的','help|幫忙','Can you help me?|你可以幫我嗎？'],
 ['下班之後','home|家','rest|休息','walk|走路','I want to go home.|我想回家。'],
 ['出門找路','where|哪裡','here|這裡','there|那裡','Where is the station?|車站在哪裡？'],
 ['走到目的地','left|左邊','right|右邊','station|車站','Turn left here.|在這裡左轉。'],
 ['海邊見','sea|海','beach|海灘','swim|游泳','I like to swim.|我喜歡游泳。'],
 ['週末往海裡去','dive|潛水','mask|面鏡','fin|蛙鞋（單數）','I go freediving on weekends.|我週末會去自由潛水。'],
 ['認識裝備','snorkel|呼吸管','wetsuit|防寒衣','weight belt|配重帶','This is my wetsuit.|這是我的防寒衣。'],
 ['潛水夥伴','buddy|夥伴','surface|水面','depth|深度','Where is my dive buddy?|我的潛伴在哪裡？']
];

const renderBeforeDaily = render;
render = function () {
  if (page === 'daily') {
    document.querySelectorAll('nav button').forEach(button => button.classList.toggle('active', button.dataset.page === 'home'));
    $('#view').innerHTML = '<button type="button" id="daily-home">← 回首頁</button>';
    $('#daily-home').onclick = () => go('home');
    renderDaily();
    return;
  }
  renderBeforeDaily();
  if (page === 'home') {
    const hero = $('#view .hero');
    const review = hero.querySelector('[data-go="review"]');
    const actions = document.createElement('div');
    actions.className = 'daily-words';
    const completed = data.dailyLesson?.date === today();
    actions.innerHTML = `<button type="button" class="primary" id="open-daily">${completed ? '回顧今天的新字' : '學新字'}<span class="button-en" lang="en">${completed ? 'View Today’s Words' : 'Learn New Words'}</span></button><button type="button" class="primary" id="open-review">複習<span class="button-en" lang="en">Review · ${data.entries.filter(due).length} 筆待複習</span></button>`;
    review.replaceWith(actions);
    $('#open-daily').onclick = () => go('daily');
    $('#open-review').onclick = () => go('review');
  }
};

function renderDaily() {
  const root = document.createElement('section');
  root.id = 'daily-lesson';
  root.className = 'card daily-lesson';
  $('#view').append(root);
  const date = today();
  const saved = data.dailyLesson;
  const done = Number.isInteger(saved?.done) && saved.done >= 0 ? saved.done : 0;
  const completedToday = saved?.date === date && done > 0;
  const index = completedToday ? done - 1 : done;
  const lesson = dailyLessons[index];
  const heading = '<p class="eyebrow">DAILY ENGLISH</p><h2>今天學一點</h2>';
  if (!lesson) {
    root.innerHTML = heading + '<p>你已完成這一階段的每日課程。可以回到複習區，把學過的字再練熟。</p>';
    return;
  }
  const pairs = lesson.slice(1).map(item => item.split('|'));
  const words = pairs.slice(0, 3);
  const [example, meaning] = pairs[3];
  root.innerHTML = heading + `<p class="muted">第 ${index + 1} 課／${dailyLessons.length} · ${esc(lesson[0])}</p>
    <div class="daily-words">${words.map(([en, zh], i) => `<div><strong lang="en">${esc(en)}</strong><p>${esc(zh)}</p><button type="button" data-daily-audio="${i}">聽發音<span class="button-en" lang="en">Listen</span></button></div>`).join('')}</div>
    <p><strong lang="en">${esc(example)}</strong><br>${esc(meaning)}</p>
    <p class="muted">${completedToday ? '今天已完成。明天會接著學下一課。' : '先聽一遍，再看中文試著說出英文。漏一天也沒關係，下次會接著這一課。'}</p>
    ${completedToday ? '' : '<button class="primary" id="finish-daily">完成今日小課<span class="button-en" lang="en">Finish Today’s Lesson</span></button>'}`;
  root.querySelectorAll('[data-daily-audio]').forEach(button => {
    button.onclick = () => speakAmericanEnglish(words[Number(button.dataset.dailyAudio)][0]);
  });
  const finish = root.querySelector('#finish-daily');
  if (finish) finish.onclick = () => {
    if (data.dailyLesson?.date === today()) return;
    for (const [en, zh] of words) {
      if (data.entries.some(entry => entry.type === 'word' && entry.en.toLowerCase() === en.toLowerCase())) continue;
      data.entries.push({id:crypto.randomUUID(), type:'word', en, zh, topic:index >= 13 ? '自由潛水' : '日常', note:'每日小課', level:0, reviews:0});
    }
    data.dailyLesson = {done:index + 1, date:today()};
    save();
    render();
  };
}
if (page === 'home') render();
