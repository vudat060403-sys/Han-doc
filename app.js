/* Hán Đọc — một ứng dụng web ngoại tuyến, không tài khoản, không gửi dữ liệu lên máy chủ. */
(() => {
  'use strict';
  const LESSONS = window.HSK3_LESSONS || [];
  const KEY = 'han-doc-v1';
  const app = document.getElementById('app');
  const main = document.getElementById('main');
  const nav = document.getElementById('bottom-nav');
  const toastEl = document.getElementById('toast');
  let toastTimeout = null;
  const defaults = {completed:{},favorites:[],savedWords:[],readDays:{},lastLesson:1,fontSize:25,voiceRate:.9,showPinyin:false,showTranslation:false};
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { saved = {}; }
  let progress = {...defaults,...saved};
  progress.completed = progress.completed && typeof progress.completed === 'object' ? progress.completed : {};
  progress.readDays = progress.readDays && typeof progress.readDays === 'object' ? progress.readDays : {};
  progress.favorites = Array.isArray(progress.favorites) ? progress.favorites : [];
  progress.savedWords = Array.isArray(progress.savedWords) ? progress.savedWords : [];
  const state = {tab:'home',view:'tab',id:1,lastTab:'home',filter:'all',search:'',answers:{},grade:{},playing:false};

  const svg = {
    home:'<path d="M3 10.2 12 3l9 7.2V21h-6v-7H9v7H3z"/>',
    library:'<path d="M4 5.2C7.5 3.5 10 4.5 12 6c2-1.5 4.5-2.5 8-0.8V20c-3.5-1.2-6.1-.6-8 1-1.9-1.6-4.5-2.2-8-1zM12 6v15"/>',
    bookmark:'<path d="M6 3h12v18l-6-4-6 4z"/>',
    chart:'<path d="M4 20V12h4v8M10 20V5h4v15M16 20v-9h4v9M2 20h20"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m16.3 16.3 4.3 4.3"/>',
    arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
    back:'<path d="m15 5-7 7 7 7"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    book:'<path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2zm0 0v16a2 2 0 0 1 2-2"/>',
    sound:'<path d="M4 9v6h4l5 4V5L8 9zm13-1a6 6 0 0 1 0 8m2-11a10 10 0 0 1 0 14"/>',
    stop:'<rect x="5" y="5" width="14" height="14" rx="2"/>',
    check:'<path d="m4 12 5 5L20 6"/>',
    star:'<path d="m12 2 3.1 6.3 7 .9-5.1 5 .9 7L12 18l-5.9 3.2.9-7-5.1-5 7-.9z"/>',
    trash:'<path d="M4 7h16M9 4h6M6 7l1 14h10l1-14M10 11v7m4-7v7"/>',
    plus:'<path d="M12 4v16M4 12h16"/>',
    minus:'<path d="M5 12h14"/>',
    download:'<path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4"/>',
    upload:'<path d="M12 21V9m-4 4 4-4 4 4M4 7V3h16v4"/>',
    sparkle:'<path d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/>'
  };
  function icon(name, size=18) {return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg[name]||svg.book}</svg>`;}
  function escape(s) {return String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function save() {try{localStorage.setItem(KEY,JSON.stringify(progress));}catch(e){console.warn('Không lưu được tiến độ',e);}}
  function getLesson(id) {return LESSONS.find(x=>x.id===Number(id));}
  function completedCount() {return Object.keys(progress.completed).filter(k=>!!progress.completed[k]).length;}
  function todayKey(offset=0) {const d=new Date();d.setDate(d.getDate()+offset);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  function dayIndex() {const now=new Date(), start=new Date(2026,10,9), day=Math.floor((new Date(now.getFullYear(),now.getMonth(),now.getDate())-start)/86400000);return ((day%LESSONS.length)+LESSONS.length)%LESSONS.length;}
  function todayLesson() {return LESSONS[dayIndex()] || LESSONS[0];}
  function streak() {let n=0;let delta=progress.readDays[todayKey()]?0:-1;while(progress.readDays[todayKey(delta)]){n++;delta--;}return n;}
  function dateText() {const d=new Date();return new Intl.DateTimeFormat('vi-VN',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(d);}
  function isCompleted(id) {return !!progress.completed[id];}
  function isFav(id) {return progress.favorites.includes(Number(id));}
  function isWordSaved(zh) {return progress.savedWords.includes(zh);}
  function toast(text) {clearTimeout(toastTimeout);toastEl.textContent=text;toastEl.classList.add('show');toastTimeout=setTimeout(()=>toastEl.classList.remove('show'),2900);}
  function scoreText() {return `${completedCount()}/${LESSONS.length}`;}

  function lessonCard(l) {
    return `<button type="button" class="lesson-card" data-action="open" data-id="${l.id}">
      <span class="lesson-num">${String(l.id).padStart(2,'0')}</span>
      <span class="lesson-card-body"><div class="lesson-title" lang="zh-Hans">${escape(l.title)}</div><div class="lesson-subtitle">${escape(l.meaning)}</div>
      <div class="lesson-meta"><span>${escape(l.topic)}</span><span>·</span><span>${l.minutes} phút</span>${isCompleted(l.id)?`<span class="chip">${icon('check',11)} Đã học</span>`:''}${isFav(l.id)?`<span class="chip gold">★</span>`:''}</div></span><span class="chevron">›</span></button>`;
  }
  function statsRow(){return `<div class="stats-row"><div class="stat-card"><strong>${completedCount()}<span class="tiny">/${LESSONS.length}</span></strong><span>Bài đã đọc</span></div><div class="stat-card"><strong>${progress.savedWords.length}</strong><span>Từ đã lưu</span></div><div class="stat-card"><strong>${streak()} <span style="font-size:17px">✦</span></strong><span>Ngày liên tiếp</span></div></div>`;}
  function home() {
    const daily = todayLesson();
    const last = getLesson(progress.lastLesson) || daily;
    const next = LESSONS.filter(l=>!isCompleted(l.id) && l.id!==daily.id).slice(0,3);
    const around = next.length ? next : LESSONS.filter(l=>l.id!==daily.id).slice(0,3);
    return `<section class="top-space"><div class="intro-head"><div><div class="eyebrow">Hành trình tiếng Trung</div><h1 style="margin-top:7px">Mỗi ngày, một<br>trang sách nhỏ.</h1><div class="date-label">${escape(dateText())}</div></div><div class="dot-accent">文</div></div>
      <div class="hero"><div class="eyebrow">✧ &nbsp;Bài đọc gợi ý hôm nay · #${String(daily.id).padStart(2,'0')}</div><div class="hero-title" lang="zh-Hans">${escape(daily.title)}</div><div class="hero-vi">${escape(daily.meaning)}</div><div class="hero-meta"><span>${icon('book',14)} HSK3</span><span>${icon('clock',14)} ${daily.minutes} phút</span><span>${escape(daily.topic)}</span></div><button class="primary-btn white" data-action="open" data-id="${daily.id}">${isCompleted(daily.id)?'Đọc lại bài':'Bắt đầu đọc'} ${icon('arrow')}</button></div>
      ${statsRow()}
      <div class="section-head"><h2>Đọc tiếp nhé</h2><button class="text-link" data-action="nav" data-tab="library">Xem tất cả ›</button></div><div class="list-stack">${[...(last.id!==daily.id && !isCompleted(last.id) ? [last] : []),...around].filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i).slice(0,3).map(lessonCard).join('')}</div>
      <div class="hint-box"><strong>✧ Thói quen nhỏ, tiến bộ dài</strong><p>Đọc hiểu bài trước, bật pinyin khi cần, sau đó làm câu hỏi. Kết quả được lưu ngay trên thiết bị của bạn.</p></div>
    </section>`;
  }
  function libraryList(){const q=state.search.trim().toLowerCase();const filtered=LESSONS.filter(l=>{
    if(state.filter==='completed'&&!isCompleted(l.id))return false;
    if(state.filter==='favorite'&&!isFav(l.id))return false;
    if(state.filter==='new'&&isCompleted(l.id))return false;
    return [l.title,l.meaning,l.topic,...l.vocab.map(x=>x.zh)].join(' ').toLowerCase().includes(q);
  });return `<div class="count-label">${filtered.length} bài phù hợp</div>${filtered.length?`<div class="list-stack">${filtered.map(lessonCard).join('')}</div>`:`<div class="empty"><div class="empty-symbol">⌕</div><h3>Không tìm thấy bài đọc</h3><p>Thử chủ đề khác hoặc bỏ bộ lọc nhé.</p><button class="secondary-btn" data-action="reset-search">Xem tất cả bài</button></div>`}`;}
  function library(){return `<section class="page-title"><span class="eyebrow">Tủ sách của bạn</span><h1 style="margin-top:8px">Thư viện bài đọc</h1><p class="subtext">${LESSONS.length} câu chuyện, nhiều chủ đề đời sống · HSK3</p><label class="searchbox">${icon('search')}<input id="library-search" type="search" value="${escape(state.search)}" placeholder="Tìm theo tên, chủ đề, từ vựng..." autocomplete="off" aria-label="Tìm bài đọc"></label><div class="filter-row">${[['all','Tất cả'],['new','Chưa học'],['completed','Đã học'],['favorite','Yêu thích']].map(([key,label])=>`<button class="filter ${state.filter===key?'active':''}" data-action="filter" data-filter="${key}">${label}</button>`).join('')}</div><div id="library-results">${libraryList()}</div></section>`;}
  function wordItem(word){return `<div class="word-card"><div class="word-main"><strong lang="zh-Hans">${escape(word.zh)}</strong><span>${escape(word.pinyin)}</span><small>${escape(word.vi)}</small></div><div class="word-card-actions"><button class="round-small" data-action="speak-word" data-text="${escape(word.zh)}" aria-label="Nghe từ ${escape(word.zh)}">${icon('sound',18)}</button><button class="round-small remove" data-action="save-word" data-word="${escape(word.zh)}" aria-label="Bỏ lưu ${escape(word.zh)}">${icon('trash',17)}</button></div></div>`;}
  function savedWords(){const dict=new Map();for(const l of LESSONS)for(const w of l.vocab)if(!dict.has(w.zh))dict.set(w.zh,w);const words=progress.savedWords.map(x=>dict.get(x)).filter(Boolean);return `<section class="page-title"><div class="eyebrow">Sổ tay từ vựng</div><h1 style="margin-top:8px">Từ đã lưu</h1><p class="subtext">Tích lũy từ hữu ích qua mỗi bài đọc. Chạm loa để nghe phát âm.</p><div class="section-head" style="margin-top:23px"><h2>${words.length} từ vựng</h2></div>${words.length?`<div class="word-list">${words.map(wordItem).join('')}</div>`:`<div class="empty"><div class="empty-symbol">✦</div><h3>Cuốn sổ đang trống</h3><p>Khi đọc bài, chạm biểu tượng dấu sao ở từ vựng để lưu về đây.</p><button class="primary-btn" data-action="nav" data-tab="library">Khám phá bài đọc ${icon('arrow')}</button></div>`}</section>`;}
  function weeklyChart(){return `<div class="weekly">${Array.from({length:7},(_,i)=>{const offset=i-6,d=new Date();d.setDate(d.getDate()+offset);const k=todayKey(offset);return `<div class="weekday"><span>${['CN','T2','T3','T4','T5','T6','T7'][d.getDay()]}</span><div class="day-circle ${progress.readDays[k]?'read':''}">${progress.readDays[k]?'✓':d.getDate()}</div></div>`;}).join('')}</div>`;}
  function progressScreen(){const pct=Math.round(completedCount()/Math.max(LESSONS.length,1)*100);const seen=Object.values(progress.completed).filter(Boolean);const avg=seen.length?Math.round(seen.reduce((s,x)=>s+(Number(x.score)||0),0)/seen.length):0;
    return `<section class="page-title"><span class="eyebrow">Nhìn lại hành trình</span><h1 style="margin-top:8px">Tiến độ học</h1><p class="subtext">Mỗi bài đọc xong là một bước gần hơn đến HSK4.</p><div class="progress-hero" style="margin-top:24px"><div><div class="eyebrow" style="color:#b9d9c5">Đã hoàn thành</div><h2 style="margin:8px 0 0">${scoreText()} bài</h2><p>${progress.savedWords.length} từ vựng đã lưu<br>Điểm đọc hiểu trung bình: ${avg}%</p></div><div class="progress-ring" style="--fraction:${pct}%"><div class="ring-inner"><strong>${pct}%</strong><small>hoàn thành</small></div></div></div>${statsRow()}
    <div class="section-head"><h2>7 ngày gần đây</h2></div><div class="settings-card" style="margin-top:0">${weeklyChart()}</div>
    <div class="settings-card"><h2>Sao lưu tiến độ</h2><p>Tiến độ được lưu riêng trong trình duyệt trên iPhone. Xuất bản sao lưu để giữ dữ liệu khi đổi máy hoặc xóa Safari.</p><div class="settings-row"><span>Xuất dữ liệu học tập</span><button data-action="export">${icon('download',14)} Tải JSON</button></div><div class="settings-row"><span>Khôi phục từ bản sao lưu</span><button data-action="import">${icon('upload',14)} Nhập JSON</button></div><div class="settings-row" style="border:0"><span>Xóa toàn bộ tiến độ</span><button data-action="reset-progress" style="color:#ad685e">Xóa dữ liệu</button></div><input hidden type="file" accept="application/json,.json" id="import-file"></div>
    <div class="hint-box"><strong>Bài đọc mới mỗi ngày</strong><p>Ứng dụng lần lượt gợi ý các bài có sẵn. Nội dung không tự đồng bộ với lịch gửi bài của ChatGPT; khi cần bổ sung bộ bài, phải cập nhật phiên bản ứng dụng.</p></div></section>`;}
  function vocabTile(w){return `<div class="vocab-item"><div class="vocab-upper"><div class="vocab-zh" lang="zh-Hans">${escape(w.zh)}</div><button class="small-save ${isWordSaved(w.zh)?'saved':''}" data-action="save-word" data-word="${escape(w.zh)}" aria-label="${isWordSaved(w.zh)?'Bỏ lưu':'Lưu'} từ ${escape(w.zh)}">${isWordSaved(w.zh)?'★':'☆'}</button></div><div class="vocab-pinyin">${escape(w.pinyin)}</div><div class="vocab-vi">${escape(w.vi)}</div></div>`;}
  function quizBlock(l){const answers=state.answers[l.id]||{};const graded=!!state.grade[l.id];const qCount=l.quiz.length;const totalAnswered=Object.keys(answers).length;
    return `<div class="reader-section"><div class="reader-section-title"><h2>Kiểm tra đọc hiểu</h2><span class="section-annotation">${qCount} câu · Trình độ HSK3</span></div><div class="quiz-intro">Trả lời dựa trên bài đọc. Chỉ xem đáp án sau khi bấm <strong>Chấm bài</strong>.</div>
     ${l.quiz.map((q,i)=>`<section class="question-box"><span class="question-index">CÂU ${String(i+1).padStart(2,'0')}</span><h3 lang="zh-Hans">${escape(q.question)}</h3><div class="answers">${q.options.map((opt,j)=>{const selected=answers[i]===j,answer=j===q.answer;const c=graded?(answer?'correct':(selected?'wrong':'')):(selected?'selected':'');return `<button class="answer ${c}" data-action="answer" data-question="${i}" data-answer="${j}" ${graded?'disabled':''}><span class="letter">${'ABC'[j]}</span><span lang="zh-Hans">${escape(opt)}</span></button>`;}).join('')}</div>${graded?`<div class="question-explain">${icon('check',14)} ${escape(q.explain)}</div>`:''}</section>`).join('')}
     ${graded?`<div class="result-card"><strong>${progress.completed[l.id]?.score??0}%</strong><p>Đã lưu kết quả · Bạn có thể làm lại để luyện trí nhớ.</p></div><button class="secondary-btn full" style="margin-top:12px" data-action="redo-quiz">Làm lại câu hỏi</button>`:`<button class="primary-btn full" style="margin-top:13px" data-action="grade" ${totalAnswered!==qCount?'disabled':''}>Chấm bài · ${totalAnswered}/${qCount} câu ${icon('check')}</button>`}
    </div>`;
  }
  function reader(l){return `<section class="reader-top"><div class="back-row"><button class="back-btn" data-action="back">${icon('back',15)} ${state.lastTab==='library'?'Thư viện':'Quay lại'}</button><button class="icon-button" data-action="favorite" aria-label="${isFav(l.id)?'Bỏ yêu thích':'Thêm vào yêu thích'}" style="color:${isFav(l.id)?'#c78852':'var(--dark)'}">${isFav(l.id)?'★':'☆'}</button></div>
     <div class="reader-head"><span class="eyebrow">Bài ${String(l.id).padStart(2,'0')} / ${LESSONS.length} · ${escape(l.topic)} · HSK3</span><h1 lang="zh-Hans">${escape(l.title)}</h1><div class="meaning">${escape(l.meaning)}</div><div class="reader-meta"><span>${icon('clock',14)} ${l.minutes} phút đọc</span><span>•</span><span>${icon('book',14)} ${l.vocab.length} từ khóa</span>${isCompleted(l.id)?`<span class="chip">✓ Đã học</span>`:''}</div></div>
     <div class="reader-control"><div class="control-group"><button class="control-btn ${progress.showPinyin?'selected':''}" data-action="toggle-pinyin">Pinyin ${progress.showPinyin?'✓':''}</button><button class="control-btn ${progress.showTranslation?'selected':''}" data-action="toggle-translation">Dịch Việt ${progress.showTranslation?'✓':''}</button></div><div class="control-group"><button class="control-btn" data-action="font-down" aria-label="Giảm cỡ chữ">A−</button><button class="control-btn" data-action="font-up" aria-label="Tăng cỡ chữ">A+</button></div></div>
     <div class="reader-article" style="--reading-size:${progress.fontSize}px"><div class="article-head">正文 &nbsp;·&nbsp; BÀI ĐỌC</div>${l.paragraphs.map((p,i)=>`<div class="reading-para"><p class="hanzi" lang="zh-Hans">${escape(p)}</p>${progress.showPinyin?`<p class="pinyin-full">${escape(l.pinyin[i])}</p>`:''}${progress.showTranslation?`<p class="translation">${escape(l.translations[i])}</p>`:''}<div class="paragraph-actions"><button class="mini-action" data-action="speak-paragraph" data-paragraph="${i}">${icon('sound',13)} Nghe đoạn ${i+1}</button></div></div>`).join('')}</div>
     <div class="reader-control" style="margin-top:12px"><button class="control-btn" id="listen-all" data-action="speak-all">${icon('sound',15)} Nghe toàn bài</button><button class="control-btn" data-action="rate">Tốc độ ${progress.voiceRate.toFixed(2).replace(/0$/,'')}×</button><button class="control-btn" data-action="stop-audio">${icon('stop',13)} Dừng</button></div>
     <div class="reader-section"><div class="reader-section-title"><h2>Từ vựng quan trọng</h2><span class="section-annotation">Chạm ☆ để lưu từ</span></div><div class="vocab-grid">${l.vocab.map(vocabTile).join('')}</div></div>
     <div class="reader-section"><div class="reader-section-title"><h2>Cấu trúc cần nhớ</h2></div>${l.grammar.map(g=>`<div class="grammar-box"><strong>${escape(g.pattern)}</strong><p>${escape(g.vi)}</p><div class="sample" lang="zh-Hans">${escape(g.example)}</div></div>`).join('')}</div>
     ${quizBlock(l)}
     <div class="reader-footer"><button class="secondary-btn" data-action="mark-complete">${isCompleted(l.id)?'✓ Đã hoàn thành':'Đánh dấu đã đọc'}</button><button class="primary-btn" data-action="next" ${l.id===LESSONS.length?'disabled':''}>Bài tiếp theo ${icon('arrow')}</button></div>
    </section>`;}
  function bottomNav(){const items=[['home','Trang chủ','home'],['library','Thư viện','library'],['words','Từ mới','bookmark'],['progress','Tiến độ','chart']];return items.map(([tab,label,ic])=>`<button class="nav-btn ${state.tab===tab?'active':''}" data-action="nav" data-tab="${tab}" ${state.tab===tab?'aria-current="page"':''}><span class="nav-icon">${icon(ic,21)}</span><span>${label}</span></button>`).join('');}
  function render({scroll=false}={}){
    if(state.view==='reader'){
      const l=getLesson(state.id);if(!l){state.view='tab';state.tab='home';return render({scroll});}
      app.classList.add('reader-mode');main.innerHTML=reader(l);nav.innerHTML='';
    }else{
      app.classList.remove('reader-mode');main.innerHTML=state.tab==='home'?home():state.tab==='library'?library():state.tab==='words'?savedWords():progressScreen();nav.innerHTML=bottomNav();
    }
    if(scroll)window.scrollTo({top:0,behavior:'instant'});
  }
  function syncHash(){const hash=decodeURIComponent(location.hash.slice(1));const match=hash.match(/^bai-(\d+)$/);if(match&&getLesson(Number(match[1]))){state.view='reader';state.id=Number(match[1]);}else if(['home','library','words','progress'].includes(hash)){state.view='tab';state.tab=hash;}render({scroll:true});}
  function navigate(tab){stopAudio();state.tab=tab;state.view='tab';state.lastTab=tab;history.replaceState(null,'','#'+tab);render({scroll:true});}
  function openLesson(id){if(!getLesson(id))return;stopAudio();state.lastTab=state.view==='tab'?state.tab:state.lastTab;state.id=Number(id);state.view='reader';progress.lastLesson=state.id;save();history.replaceState(null,'','#bai-'+String(id).padStart(3,'0'));render({scroll:true});}
  function markComplete(l,score){const prev=progress.completed[l.id];progress.completed[l.id]={score:typeof score==='number'?score:(prev?.score??0),date:todayKey()};progress.readDays[todayKey()]=true;save();}
  function stopAudio(){if('speechSynthesis' in window){window.speechSynthesis.cancel();}state.playing=false;}
  function speak(text){if(!('speechSynthesis' in window)){toast('Thiết bị này không hỗ trợ đọc bằng giọng nói.');return;}stopAudio();const msg=new SpeechSynthesisUtterance(text);msg.lang='zh-CN';msg.rate=progress.voiceRate;msg.pitch=1;const voices=window.speechSynthesis.getVoices();const zh=voices.find(v=>v.lang.toLowerCase()==='zh-cn')||voices.find(v=>v.lang.toLowerCase().startsWith('zh'));if(zh)msg.voice=zh;msg.onstart=()=>{state.playing=true;};msg.onend=()=>{state.playing=false;};msg.onerror=()=>{state.playing=false;};window.speechSynthesis.speak(msg);}
  function exportData(){const data={application:'han-doc',version:1,exportedAt:new Date().toISOString(),progress};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`han-doc-sao-luu-${todayKey()}.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Đã tạo tệp sao lưu. Hãy lưu vào ứng dụng Tệp.');}
  async function importData(file){if(!file)return;try{const data=JSON.parse(await file.text());if(data.application!=='han-doc'||!data.progress||typeof data.progress!=='object')throw Error('invalid');const x=data.progress;progress={...defaults,...x,completed: x.completed&&typeof x.completed==='object'?x.completed:{},readDays:x.readDays&&typeof x.readDays==='object'?x.readDays:{},favorites:Array.isArray(x.favorites)?x.favorites:[],savedWords:Array.isArray(x.savedWords)?x.savedWords:[]};progress.fontSize=Math.max(19,Math.min(34,Number(progress.fontSize)||25));progress.voiceRate=[.75,.9,1,1.1].includes(Number(progress.voiceRate))?Number(progress.voiceRate):.9;save();render();toast('Khôi phục tiến độ thành công.');}catch{toast('Không đọc được tệp sao lưu hợp lệ.');}}
  function help(){if(document.getElementById('install-dialog')){document.getElementById('install-dialog').showModal();return;}const dialog=document.createElement('dialog');dialog.id='install-dialog';dialog.innerHTML=`<div class="dialog-inner"><div class="dialog-top"><span class="eyebrow">Cài trên iPhone</span><button class="close-dialog" data-action="close-dialog" aria-label="Đóng">×</button></div><h2>Đọc như một ứng dụng</h2><p>Khi ứng dụng đã được đưa lên một địa chỉ HTTPS, bạn có thể ghim vào màn hình chính:</p><ol class="steps"><li>Mở địa chỉ trang bằng <strong>Safari</strong> trên iPhone.</li><li>Chạm <strong>Chia sẻ</strong> → <strong>Thêm vào MH chính</strong> (Add to Home Screen).</li><li>Chọn <strong>Mở như ứng dụng web</strong> nếu có → <strong>Thêm</strong>.</li></ol><p>Bài đọc lưu sẵn có thể hoạt động ngoại tuyến sau lần tải đầu trên bản web đã cài. Nghe giọng đọc sử dụng tiếng Trung của hệ thống iPhone, phụ thuộc vào giọng nói được cài và hỗ trợ của Safari.</p><button class="primary-btn full" data-action="close-dialog">Đã hiểu</button></div>`;document.body.append(dialog);dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});dialog.showModal();}

  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-action]');if(!btn)return;
    const action=btn.dataset.action;
    if(action==='nav')return navigate(btn.dataset.tab);
    if(action==='open')return openLesson(btn.dataset.id);
    if(action==='back')return navigate(state.lastTab);
    if(action==='filter'){state.filter=btn.dataset.filter;return render();}
    if(action==='reset-search'){state.search='';state.filter='all';return render();}
    if(action==='help')return help();
    if(action==='close-dialog'){document.getElementById('install-dialog')?.close();return;}
    if(action==='favorite'){const id=state.id;progress.favorites=isFav(id)?progress.favorites.filter(x=>x!==id):[...progress.favorites,id];save();render();return toast(isFav(id)?'Đã lưu bài vào yêu thích.':'Đã bỏ bài khỏi yêu thích.');}
    if(action==='save-word'){const w=btn.dataset.word;const had=isWordSaved(w);progress.savedWords=had?progress.savedWords.filter(x=>x!==w):[...progress.savedWords,w];save();render();return toast(had?'Đã bỏ từ khỏi sổ tay.':'Đã thêm từ vào sổ tay.');}
    if(action==='toggle-pinyin'){progress.showPinyin=!progress.showPinyin;save();return render();}
    if(action==='toggle-translation'){progress.showTranslation=!progress.showTranslation;save();return render();}
    if(action==='font-up'||action==='font-down'){progress.fontSize=Math.max(19,Math.min(34,progress.fontSize+(action==='font-up'?2:-2)));save();return render();}
    if(action==='rate'){const rates=[.75,.9,1,1.1];progress.voiceRate=rates[(rates.indexOf(progress.voiceRate)+1)%rates.length];save();return render();}
    if(action==='speak-all'){const l=getLesson(state.id);return l&&speak(l.paragraphs.join(' '));}
    if(action==='speak-paragraph'){const l=getLesson(state.id);return l&&speak(l.paragraphs[Number(btn.dataset.paragraph)]);}
    if(action==='speak-word')return speak(btn.dataset.text);
    if(action==='stop-audio'){stopAudio();return toast('Đã dừng đọc.');}
    if(action==='answer'){if(state.grade[state.id])return;state.answers[state.id] ||= {};state.answers[state.id][Number(btn.dataset.question)]=Number(btn.dataset.answer);return render();}
    if(action==='grade'){const l=getLesson(state.id);const answers=state.answers[l.id]||{};if(Object.keys(answers).length<l.quiz.length)return;const score=Math.round(l.quiz.filter((q,i)=>q.answer===answers[i]).length/l.quiz.length*100);markComplete(l,score);state.grade[l.id]=true;render();toast(`Đã chấm bài: ${score}% câu trả lời đúng.`);return;}
    if(action==='redo-quiz'){state.grade[state.id]=false;state.answers[state.id]={};return render();}
    if(action==='mark-complete'){const l=getLesson(state.id);markComplete(l);render();return toast('Đã lưu: hoàn thành bài đọc.');}
    if(action==='next')return openLesson(state.id+1);
    if(action==='export')return exportData();
    if(action==='import')return document.getElementById('import-file')?.click();
    if(action==='reset-progress'){if(confirm('Xóa toàn bộ bài đã đọc, từ đã lưu và điểm kiểm tra trên thiết bị này?')){progress={...defaults,completed:{},favorites:[],savedWords:[],readDays:{}};save();render();toast('Đã xóa dữ liệu học tập.');}return;}
  });
  document.addEventListener('input',e=>{if(e.target.id==='library-search'){state.search=e.target.value;const results=document.getElementById('library-results');if(results)results.innerHTML=libraryList();}});
  document.addEventListener('change',e=>{if(e.target.id==='import-file'){importData(e.target.files?.[0]);e.target.value='';}});
  window.addEventListener('hashchange',syncHash);
  window.addEventListener('pagehide',stopAudio);
  window.addEventListener('offline',()=>toast('Bạn đang ngoại tuyến. Bài đã tải vẫn đọc được.'));
  if(location.hash)syncHash();else render({scroll:true});
  if('serviceWorker' in navigator && location.protocol!=='file:'){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(e=>console.warn('SW:',e)));
  }
})();
