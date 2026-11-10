const renderBeforeTranslate=render;
mainNav.insertAdjacentHTML('beforeend','<button type="button" data-page="translate">翻譯<span class="button-en" lang="en">Translate</span></button>');
mainNav.querySelector('[data-page="translate"]').onclick=()=>{go('translate');window.scrollTo(0,0);};

let translateRequest=0;
const translationOptions={sourceLanguage:'en',targetLanguage:'zh-Hant'};
let translationEngine;
const exampleTranslations=new Map([
  ['what describes you best?','哪一項最能形容你？'],
  ['describes','形容；描述（第三人稱單數）'],
  ['describe','形容；描述'],
  ['best','最；最好地'],
  ['what','什麼；哪一項'],
  ['you','你；你們']
]);
function localGloss(word){
  const key=word.toLowerCase().trim();
  return exampleTranslations.get(key)||coreWords.find(([en])=>en.toLowerCase()===key)?.[1]||a2Units.flatMap(([, , ,words])=>words).find(([en])=>en.toLowerCase()===key)?.[2]||'';
}
const localAzure=location.hostname==='127.0.0.1'&&location.port==='8766';
const hostedAzure=location.origin==='https://pinting-chen.github.io';
const cloudPreview=localAzure||hostedAzure;
const azureBase=hostedAzure?'https://little-by-little-api.pinting814.workers.dev':'';
let previewAudio;
let speechRequest=0;
async function previewApi(path,text,slow=false){
  const response=await fetch(azureBase+'/api/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,slow})});
  if(!response.ok)throw new Error(response.status===503?'Azure 服務尚未完成設定。':'Azure 暫時無法使用，請再試一次。');
  return response;
}
async function listenTranslation(text,slow,status){
  if(!text)return;
  if(!cloudPreview){speakAmericanEnglish(text);return;}
  const request=++speechRequest;
  previewAudio?.pause();
  status.textContent='準備朗讀…';
  try{
    const audio=await (await previewApi('speech',text,slow)).blob();
    if(request!==speechRequest||!status.isConnected)return;
    const url=URL.createObjectURL(audio);
    previewAudio=new Audio(url);
    const release=()=>URL.revokeObjectURL(url);
    for(const event of ['ended','pause','error'])previewAudio.addEventListener(event,release,{once:true});
    try{await previewAudio.play();}catch(error){release();throw error;}
    status.textContent='';
  }catch(error){
    if(request===speechRequest)status.textContent=error.message;
  }
}
async function translateText(text){
  const known=localGloss(text);
  if(known)return known;
  if(cloudPreview){
    const result=await (await previewApi('translate',text)).json();
    return result[0].translations[0].text;
  }
  if(!globalThis.Translator)throw Error('unavailable');
  if(!translationEngine)translationEngine=await Translator.create(translationOptions);
  return translationEngine.translate(text);
}
function saveTranslationEntry(en,zh,type,note){
  const existing=data.entries.find(e=>e.type===type&&e.en.toLowerCase()===en.toLowerCase());
  if(existing)return false;
  data.entries.push({id:crypto.randomUUID(),type,en,zh,topic:'日常',note,level:0,reviews:0});
  save();return true;
}
function renderTranslation(){
  mainNav.querySelectorAll('button').forEach(b=>{
    const active=b.dataset.page==='translate';
    b.classList.toggle('active',active);
    if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
  });
  subNav.innerHTML='';
  $('#view').innerHTML=`<section class="hero"><p class="eyebrow">ENGLISH IN REAL LIFE</p><h1>翻譯</h1></section>
    <section class="card"><form id="translate-form">
      <label for="translate-input">英文原文</label><textarea id="translate-input" rows="4" maxlength="1500" required placeholder="What describes you best?">${esc(typeof data.translationDraft==='string'?data.translationDraft:'')}</textarea>
      <div class="core-tools"><button class="primary" type="submit">翻成中文</button><button type="button" id="translate-sound">聽原文</button>${cloudPreview?'<button type="button" id="translate-slow">慢速</button>':''}</div><p id="translate-speech-status" role="status"></p>
    </form></section><div id="translate-result"></div>`;
  const input=$('#translate-input');
  input.oninput=()=>{data.translationDraft=input.value;save();translateRequest++;$('#translate-result').innerHTML='';};
  $('#translate-sound').onclick=()=>listenTranslation(input.value.trim(),false,$('#translate-speech-status'));
  if(cloudPreview)$('#translate-slow').onclick=()=>listenTranslation(input.value.trim(),true,$('#translate-speech-status'));
  $('#translate-form').onsubmit=e=>{e.preventDefault();const text=input.value.trim();if(text)showTranslation(text);};
}
async function showTranslation(text){
  const request=++translateRequest;
  const words=[...text.matchAll(/[a-z]+(?:[’'-][a-z]+)*/gi)].map(m=>m[0]);
  const unique=[...new Map(words.map(w=>[w.toLowerCase(),w])).values()];
  const url='https://translate.google.com/?'+new URLSearchParams({sl:'en',tl:'zh-TW',text,op:'translate'});
  $('#translate-result').innerHTML=`<section class="card"><label for="translation-zh">中文意思</label><textarea id="translation-zh" rows="3" maxlength="1500" placeholder="可貼上或修改中文翻譯"></textarea>
    <p id="translation-status" class="muted" role="status">翻譯中…</p>
    <div class="core-tools"><a href="${esc(url)}" target="_blank" rel="noopener noreferrer" id="translation-external" hidden>用 Google 翻譯開啟 ↗</a><button type="button" id="save-translation">加入${words.length===1?'單字庫':'會話庫'}</button></div>
    <h2>點字收藏</h2><div class="core-tools">${unique.map((w,i)=>`<button type="button" data-translation-word="${i}">${esc(w)}</button>`).join('')}</div><div id="translation-word-panel"></div></section>`;
  const zh=$('#translation-zh');
  $('#save-translation').onclick=e=>{
    if(!zh.value.trim()){zh.focus();$('#translation-status').textContent='請先填入中文意思。';return;}
    const type=words.length===1?'word':'phrase';
    e.currentTarget.textContent=saveTranslationEntry(text,zh.value.trim(),type,'生活英文')?'已加入':'已在筆記中';
  };
  document.querySelectorAll('[data-translation-word]').forEach(b=>b.onclick=()=>showTranslationWord(unique[Number(b.dataset.translationWord)],text));
  try{
    const translated=await translateText(text);
    if(page!=='translate'||request!==translateRequest)return;
    if(!zh.value.trim())zh.value=translated;
    $('#translation-status').textContent='';
  }catch(error){
    if(page!=='translate'||request!==translateRequest)return;
    $('#translation-status').textContent=cloudPreview?error.message:'這個瀏覽器無法在頁內翻譯。可開啟 Google 翻譯，再貼回中文。';
    $('#translation-external').hidden=false;
  }
}
let tokenRequest=0;
async function showTranslationWord(word,source){
  const request=++tokenRequest;
  const panel=$('#translation-word-panel');
  panel.innerHTML=`<div class="study-example"><strong lang="en">${esc(word)}</strong><label for="translate-word-zh">這個字的意思</label><input id="translate-word-zh" maxlength="300" placeholder="輸入這句話中的意思"><div class="core-tools"><button type="button" id="listen-translation-word">聽單字</button><button class="primary" type="button" id="save-translation-word">加入單字庫</button></div><p id="translation-word-status" role="status"></p></div>`;
  const field=$('#translate-word-zh');
  $('#listen-translation-word').onclick=()=>listenTranslation(word,false,$('#translation-word-status'));
  $('#save-translation-word').onclick=e=>{
    if(!field.value.trim()){field.focus();$('#translation-word-status').textContent='請先填入中文意思。';return;}
    e.currentTarget.textContent=saveTranslationEntry(word,field.value.trim(),'word',source)?'已加入單字庫':'已在單字庫';
  };
  try{
    const meaning=await translateText(word);
    if(page==='translate'&&request===tokenRequest&&field.isConnected&&!field.value.trim())field.value=meaning;
  }catch{}
}
render=function(){
  if(page==='translate'){renderTranslation();return;}
  translateRequest++;
  renderBeforeTranslate();
};
