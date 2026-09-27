(()=>{'use strict';
const DATA=Array.isArray(window.DAILY_MANNA_DATA)?window.DAILY_MANNA_DATA:[];
const VOW=Array.isArray(window.MORNING_VOW_DATA)?window.MORNING_VOW_DATA:[];
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const pad=n=>String(n).padStart(2,'0');
const monthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
const monthMl=['ജനുവരി','ഫെബ്രുവരി','മാർച്ച്','ഏപ്രിൽ','മേയ്','ജൂൺ','ജൂലൈ','ആഗസ്റ്റ്','സെപ്റ്റംബർ','ഒക്ടോബർ','നവംബർ','ഡിസംബർ'];
const monthKey=(m,d)=>`${m}-${pad(d)}`;
const byKey=new Map(DATA.map(e=>[monthKey(e.month,e.day),e]));
const yearDate=(m,d)=>`2026-${pad(m)}-${pad(d)}`;
const parseDate=s=>{const [y,m,d]=String(s).split('-').map(Number);return new Date(y,m-1,d,12)};
const fmtDate=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const currentLocal=()=>fmtDate(new Date());
const find=s=>{if(!/^2026-\d{2}-\d{2}$/.test(String(s)))return null;const d=parseDate(s);return byKey.get(monthKey(d.getMonth()+1,d.getDate()))||null};
const availableDates=DATA.map(e=>yearDate(e.month,e.day)).sort();

/*
  The dataset is the source of truth. Its PDF-derived line breaks often split a
  Malayalam word across two physical lines. We only remove those layout breaks;
  we do not rewrite, spell-correct, paraphrase, or invent source content.
*/
const joinCandidates=new Set(); const rawFreq=new Map();
const token=s=>String(s||'').trim().split(/\s+/).filter(Boolean);
DATA.forEach(e=>{
  const lines=String(e.text||'').split('\n');
  token(lines.join(' ')).forEach(w=>{const k=w.replace(/[.,;:!?"“”'’()]+$/g,'');rawFreq.set(k,(rawFreq.get(k)||0)+1)});
  for(let i=0;i<lines.length-1;i++){
    const a=token(lines[i]).pop(), b=token(lines[i+1])[0];
    if(!a||!b)continue;
    const ac=a.replace(/[.,;:!?"“”'’()]+$/g,'');
    const bc=b.replace(/^["“'’(]+|[.,;:!?"”'’()]+$/g,'');
    if(ac&&bc)joinCandidates.add(ac+bc);
  }
});
const continuation=/^(?:ത്തിൽ|ത്തിലും|ത്തിൻ|ത്തിന്റെ|ത്തിനെ|ത്തോട്|ത്തേ|ത്തോടും|ത്തെ|ത്താൽ|നെയും|നെ|ന്റെ|ണ്ടുകൂടെ|ടികൾ|ടിയ|ടുവാനോ|ളിൽ|ളെ|ളും|ളുടെ|ള്ള|ങ്ങി|ങ്ങൽ|ങ്ങും|ങ്ങൾ|ങ്ങുന്ന|ങ്ങുന്നത്|ന്ന|ന്നു|ന്നാൽ|ന്നും|ന്നത|ന്നവ|ക്കു|ക്കൂ|ക്കും|ക്കണം|ക്കുന്ന|ക്കുന്നത്|ക്കുകയും|ക്കുവാൻ|ക്കൊണ്ട്|ക്കൊണ്ടു|യി|യിൽ|യിലും|യുള്ള|യുമായ|യുമായി|യുടെയും|യുടേ|യാൽ|യാതെ|യെന്ന|വിൽ|വിന്റെ|വിന്|വിനു|വിനാൽ|വും|വേ|വോ|മായി|മായ|മാക|മാക്ക|രുന്നു|രുന്ന|രുന്നത|രിക്ക|രിക്കുന്ന|രിച്ച|രിച്ചും|രിച്ച്|രാം|റിയിച്ചുവോ|റു|റുന്ന|ലും|ലിൽ|ലേ|ലേക്ക്|ലായ|നു|നും|വാൻ|റ്റും|ച്|പെട്ട|പ്പെട്ട|പ്പുകൾ|പ്പിൻ|പ്പിനെ|പ്പിച്ചു|പ്രകാരം)$/;
function joinPhysicalLines(text){
  const lines=String(text||'').split('\n'); let out='';
  for(const raw of lines){
    const line=raw.trim();
    if(!line){ if(out && !out.endsWith('\n\n')) out+='\n\n'; continue; }
    if(!out){out=line;continue;}
    if(out.endsWith('\n\n')){out+=line;continue;}
    const prev=out.trimEnd(), first=token(line)[0]||'';
    const last=token(prev).pop()||'';
    const cleanLast=last.replace(/[.,;:!?"“”'’()]+$/g,'');
    const cleanFirst=first.replace(/^["“'’(]+|[.,;:!?"”'’()]+$/g,'');
    const mal=/[ഀ-ൿ]/; const punctEnd=/[.!?:;,]$/.test(last); const candidateJoin=joinCandidates.has(cleanLast+cleanFirst)&&(cleanLast.length<=5||cleanFirst.length<=6)&&((rawFreq.get(cleanFirst)||0)<=4&&(rawFreq.get(cleanLast)||0)<=4); const glue=!punctEnd&&!!cleanLast&&!!cleanFirst&&mal.test(cleanLast)&&mal.test(cleanFirst)&&(candidateJoin||continuation.test(cleanFirst));
    out=glue?prev+line:prev+' '+line;
  }
  return out.replace(/[ \t]+([,.;:!?])/g,'$1').replace(/[ \t]{2,}/g,' ').trim();
}
function clean(s){return joinPhysicalLines(String(s||'')).replace(/\n{3,}/g,'\n\n').trim()}

function splitEntry(text){
  const lines=String(text||'').split('\n');
  const dateLine=lines.shift()||'';
  const verseIndex=lines.findIndex((line,i)=>i<16&&/\d+\s*:\s*\d+/.test(line));
  const verseEnd=verseIndex>=0?verseIndex:0;
  const verse=clean(lines.slice(0,verseEnd+1).join('\n'));
  const rest=lines.slice(verseEnd+1);
  const sep=rest.findIndex(x=>x.trim()==='* * *');
  const first=clean((sep>=0?rest.slice(0,sep):rest).join('\n'));
  const after=sep>=0?rest.slice(sep+1):[];
  const marker=(line)=>{
    const l=line.trim();
    if(/^സമാന്തരവ(?:േദ|ദ)ഭാഗ/.test(l))return 'references';
    if(/^സഹസ്രാബ്ദഗീത/.test(l))return 'hymns';
    if(/^പ്രഭാതകവിത/.test(l))return 'morningPoem';
    if(/^റ്റവ്വര്/.test(l))return 'tower';
    if(/^ചോദ്യ/.test(l))return 'questions';
    return null;
  };
  let metaStart=after.findIndex(x=>!!marker(x)); if(metaStart<0)metaStart=after.length;
  const second=clean(after.slice(0,metaStart).join('\n'));
  const sections={references:'',hymns:'',morningPoem:'',tower:'',questions:''};
  const matches=[]; after.slice(metaStart).forEach((line,i)=>{const type=marker(line);if(type)matches.push([type,i])});
  const metaLines=after.slice(metaStart);
  matches.forEach(([name,start],i)=>{const end=i+1<matches.length?matches[i+1][1]:metaLines.length;let block=metaLines.slice(start,end).join('\n').trim();const colon=block.indexOf(':');sections[name]=clean(colon>=0?block.slice(colon+1):block)});
  return {dateLine:clean(dateLine),verse,first,second,...sections};
}

const state={date:null,calendar:new Date(2026,0,1,12),vowOpened:false,verseCache:new Map(),verseRequest:0};
const BIBLE_BOOKS={
  'ഉല്‍പ':1,'ഉല്പ':1,'ഉല്പ.':1,'ഉല്‍പ.':1,'പുറ':2,'പുറ.':2,'ലേവ്യ':3,'ലേവ്യ.':3,'സംഖ്യ':4,'സംഖ്യ.':4,'സംഖ്യാ':4,'സംഖ്യാ.':4,'ആവ':5,'ആവ.':5,'യോശു':6,'യോശു.':6,'ന്യായാ':7,'ന്യായാ.':7,'രൂത്ത്':8,
  '1 ശമു':9,'1 ശമു.':9,'2 ശമു':10,'2 ശമു.':10,'1 രാജാ':11,'1 രാജാ.':11,'2 രാജാ':12,'2 രാജാ.':12,'1 ദിന':13,'1 ദിന.':13,'2 ദിന':14,'2 ദിന.':14,'എസ്ര':15,'എസ്ര.':15,'എസ്രാ':15,'എസ്രാ.':15,'നെഹ':16,'നെഹ.':16,'നെഹെ':16,'നെഹെ.':16,'എസ്ഥേർ':17,'ഇയ്യോ':18,'ഇയ്യോ.':18,'സങ്കീ':19,'സങ്കീ.':19,'സദൃ':20,'സദൃ.':20,'സദ്യ':20,'സദ്യ.':20,'സഭാ':21,'സഭാ.':21,'ഉത്തമ':22,'ഉത്തമ.':22,'യെശ':23,'യെശ.':23,'യിരെ':24,'യിരെ.':24,'വിലാ':25,'വിലാ.':25,'യെഹ':26,'യെഹ.':26,'യെഹെ':26,'യെഹെ.':26,'ദാനി':27,'ദാനി.':27,'ഹോശെ':28,'ഹോശെ.':28,'ഹോശേ':28,'ഹോശേ.':28,'യോവേ':29,'യോവേ.':29,'ആമോസ്':30,'ആമോസ്.':30,'ഒബദ്യാ':31,'ഒബദ്യാ.':31,'യോനാ':32,'യോനാ.':32,'മീഖ':33,'മീഖ.':33,'മീഖാ':33,'മീഖാ.':33,'നഹും':34,'നഹും.':34,'ഹബ':35,'ഹബ.':35,'സെഫ':36,'സെഫ.':36,'ഹഗ്ഗാ':37,'ഹഗ്ഗാ.':37,'സെഖ':38,'സെഖ.':38,'മലാ':39,'മലാ.':39,
  'മത്താ':40,'മത്താ.':40,'മർക്കൊ':41,'മർക്കൊ.':41,'മര്‍ക്കൊ':41,'മര്‍ക്കൊ.':41,'ലൂക്കൊ':42,'ലൂക്കൊ.':42,'യോഹ':43,'യോഹ.':43,'അപ്പൊ':44,'അപ്പൊ.':44,'റോമ':45,'റോമ.':45,'1 കൊരി':46,'1 കൊരി.':46,'2 കൊരി':47,'2 കൊരി.':47,'ഗലാ':48,'ഗലാ.':48,'എഫെ':49,'എഫെ.':49,'ഫിലി':50,'ഫിലി.':50,'കൊലൊ':51,'കൊലൊ.':51,'കൊലോ':51,'കൊലോ.':51,'1 തെസ്സ':52,'1 തെസ്സ.':52,'2 തെസ്സ':53,'2 തെസ്സ.':53,'1 തിമൊ':54,'1 തിമൊ.':54,'2 തിമൊ':55,'2 തിമൊ.':55,'2 തിമോ':55,'2 തിമോ.':55,'തീത്തൊ':56,'തീത്തൊ.':56,'തിത്തൊ':56,'തിത്തൊ.':56,'തീത്തോ':56,'തീത്തോ.':56,'തീത്താ':56,'തീത്താ.':56,'ഫിലേ':57,'ഫിലേ.':57,'എബ്ര':58,'എബ്ര.':58,'എബ്രാ':58,'എബ്രാ.':58,'ഏബ്രാ':58,'ഏബ്രാ.':58,'യാക്കൊ':59,'യാക്കൊ.':59,'യാക്കോ':59,'യാക്കോ.':59,'1 പത്രൊ':60,'1 പത്രൊ.':60,'2 പത്രൊ':61,'2 പത്രൊ.':61,'1 യോഹ':62,'1 യോഹ.':62,'2 യോഹ':63,'2 യോഹ.':63,'3 യോഹ':64,'3 യോഹ.':64,'യൂദാ':65,'യൂദാ.':65,'വെളി':66,'വെളി.':66
};
const bibleAliases=Object.keys(BIBLE_BOOKS).sort((a,b)=>b.length-a.length);
const ONE_CHAPTER_BOOKS=new Set([31,57,63,64,65]);
function findBibleAlias(piece){const p=String(piece||'').replace(/[\u200c\u200d]/g,'').normalize('NFC');return bibleAliases.find(a=>{const n=a.replace(/[\u200c\u200d]/g,'').normalize('NFC');return p===n||p.startsWith(n)&&[' ','.',',',':'].includes(p.charAt(n.length))})||null}
const normalizeRefBook=s=>String(s||'').replace(/[\u200c\u200d]/g,'').replace(/\s+/g,' ').trim().replace(/[.]$/,'');
function parseBibleReferences(raw){
  const pieces=String(raw||'').replace(/[\u200c\u200d]/g,'').replace(/\n/g,' ').replace(/\s+/g,' ').split(';').map(s=>s.trim()).filter(Boolean);
  const out=[]; let currentBook=null; let currentChapter=null; let previousExplicitChapter=false;
  for(let i=0;i<pieces.length;i++){
    let piece0=pieces[i];
    let piece=piece0.replace(/^[.,]+\s*/,'').replace(/\s*([–—-])\s*/g,'-').replace(/\s*:\s*/g,':').replace(/\s*,\s*/g,',').replace(/\s+/g,' ').trim();
    // A rare OCR split in the source can turn "ഗലാ. 6:16" into ". ഗലാ. 6;16".
    if(i+1<pieces.length && /^[.]+\s*/.test(piece0) && findBibleAlias(piece) && /^\d+$/.test(pieces[i+1].replace(/\.$/,'').trim())){
      piece += ':' + pieces[++i].replace(/\.$/,'').trim();
      piece0 += '; ' + pieces[i];
    }
    const bookAlias=findBibleAlias(piece);
    let book=null, passage='';
    if(bookAlias){book=BIBLE_BOOKS[bookAlias];passage=piece.slice(bookAlias.length).trim().replace(/^[.,:]+\s*/,'');currentBook=book;currentChapter=null;previousExplicitChapter=false;}
    else if(/^\d+\s*:/.test(piece) && currentBook){book=currentBook;passage=piece;}
    else if(currentBook && /^(?:\d+(?:-\d+)?)(?:,\d+(?:-\d+)?)*$/.test(piece)){
      book=currentBook;
      if(previousExplicitChapter && currentChapter!==null)passage=`${currentChapter}:${piece}`;
      else passage=piece;
    }
    else {
      const m=piece.match(/^(\d+\s*:[^ ]+(?:,[^ ]+)*)\s+(.+)$/);
      if(m){const a=findBibleAlias(m[2]);if(a){out.push({book:currentBook,passage:m[1],chapter:Number((m[1].match(/^(\d+)/)||[])[1]||0),label:m[1]});book=BIBLE_BOOKS[a];passage=m[2].slice(a.length).trim().replace(/^[.,:]+\s*/,'');currentBook=book;currentChapter=null;previousExplicitChapter=false;}}
    }
    if(!book||!passage)continue;
    passage=passage.replace(/\.$/,'').replace(/^(\d+)\.(\d+(?:[-,].*)?)$/,'$1:$2').trim();
    let chapter=null;
    const cm=passage.match(/^(\d+)\s*:/);
    if(cm){chapter=Number(cm[1]);currentChapter=chapter;previousExplicitChapter=true;}
    else if(/^\d+$/.test(passage)){chapter=ONE_CHAPTER_BOOKS.has(book)?1:Number(passage);currentChapter=chapter;previousExplicitChapter=false;}
    else {const cm2=passage.match(/^(\d+)\s*:/);chapter=cm2?Number(cm2[1]):currentChapter;}
    if(ONE_CHAPTER_BOOKS.has(book) && /^\d+$/.test(passage))passage=`1:${passage}`;
    if(book && passage)out.push({book,passage,chapter,label:piece0});
  }
  return out;
}
function verseQuery(refs){return refs.map(r=>`${r.book} ${r.passage}`).join(';')}
function extractVerseItems(payload){
  const items=[]; const walk=(node)=>{if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(walk);return;}
    if(node.verse!==undefined && node.text!==undefined){items.push({verse:String(node.verse),text:String(node.text),chapter:node.chapter});return;}
    Object.values(node).forEach(walk);}; walk(payload); return items;
}
async function loadParallelVerses(raw){
  const refs=parseBibleReferences(raw); if(!refs.length)throw new Error('No readable Bible references found.');
  const key=refs.map(r=>`${r.book}:${r.passage}`).join('|'); if(state.verseCache.has(key))return state.verseCache.get(key);
  const requestId=++state.verseRequest; openModal('verse');
  const root=$('#verse-modal-content');root.innerHTML='<div class="verse-loading"><span class="loading-dot"></span><span>വേദഭാഗം ലഭ്യമാക്കുന്നു…</span></div>';
  const results=await Promise.all(refs.map(async ref=>{
    const isChapter=/^\d+$/.test(ref.passage) && !ONE_CHAPTER_BOOKS.has(ref.book);
    const url=isChapter
      ? `https://api.getbible.net/v2/mal1910/${ref.book}/${ref.passage}.json`
      : `https://query.getbible.net/v2/mal1910/${encodeURIComponent(`${ref.book} ${ref.passage}`)}`;
    const response=await fetch(url,{headers:{Accept:'application/json'},cache:'force-cache'}); if(!response.ok)throw new Error(`Bible service returned ${response.status}`);
    const payload=await response.json(); let items=extractVerseItems(payload).filter(x=>x.text!==undefined&&x.verse!==undefined);
    items=items.map(x=>({...x,chapter:Number(x.chapter||ref.chapter||1)}));
    if(!items.length)throw new Error(`No verse text for ${ref.label}`);
    return {ref,items};
  }));
  const result={refs,items:results.flatMap(x=>x.items)}; state.verseCache.set(key,result); if(requestId===state.verseRequest)renderParallelVerses(result); return result;
}
function renderParallelVerses(result){
  const root=$('#verse-modal-content');root.innerHTML='';
  const grouped=[]; result.items.forEach(item=>{const key=item.chapter||'';let g=grouped.find(x=>x.key===key);if(!g){g={key,items:[]};grouped.push(g)}g.items.push(item)});
  result.refs.forEach((ref,i)=>{const card=document.createElement('section');card.className='verse-result';const h=document.createElement('div');h.className='verse-result-ref';h.textContent=ref.label.trim();card.appendChild(h);const chapterOnly=/^\d+$/.test(ref.passage);const verseSpec=chapterOnly?'':ref.passage.replace(/^\d+\s*:/,'');const matches=result.items.filter((x)=>Number(x.chapter||0)===Number(ref.chapter||0)&&(chapterOnly||verseSpec.split(',').some(part=>{const n=part.trim().match(/(\d+)(?:-(\d+))?/);if(!n)return false;const a=Number(n[1]),b=Number(n[2]||n[1]);return Number(x.verse)>=a&&Number(x.verse)<=b})));matches.forEach(v=>{const p=document.createElement('p');p.className='verse-line';const n=document.createElement('span');n.className='verse-number';n.textContent=v.verse;const t=document.createElement('span');t.textContent=v.text;p.append(n,t);card.appendChild(p)});root.appendChild(card)});
  if(!root.children.length)root.innerHTML='<div class="verse-error">ഈ വേദഭാഗത്തിനുള്ള പാഠം ലഭ്യമല്ല.</div>';
}
function expandReferenceLabels(raw){
  const sourcePieces=String(raw||'').replace(/[\u200c\u200d]/g,'').replace(/\n/g,' ').replace(/\s+/g,' ').split(';').map(s=>s.trim()).filter(Boolean);
  const parsed=parseBibleReferences(raw);
  if(!parsed.length)return sourcePieces;
  const reverseBook=new Map();
  for(const [alias,number] of Object.entries(BIBLE_BOOKS)){
    const cleanAlias=alias.replace(/[.]$/,'');
    if(!reverseBook.has(number))reverseBook.set(number,cleanAlias);
  }
  const canonicalLabel=(ref)=>{
    const alias=reverseBook.get(ref.book);
    if(!alias)return String(ref.label||'').trim();
    let passage=String(ref.passage||'').trim();
    if(ONE_CHAPTER_BOOKS.has(ref.book)&&/^1:/.test(passage))passage=passage.slice(2);
    return `${alias}. ${passage}`;
  };
  // If the PDF contains an OCR punctuation split (for example ". ഗലാ. 6;16."),
  // the parser has already reconstructed the semantic reference. Use that exact
  // parsed order rather than exposing the broken physical split as two chips.
  if(parsed.length!==sourcePieces.length)return parsed.map(canonicalLabel);
  return parsed.map((ref,i)=>{
    const piece=sourcePieces[i];
    if(findBibleAlias(piece))return piece.replace(/\s+/g,' ').replace(/\s*([–—-])\s*/g,'-').replace(/\s*:\s*/g,':').replace(/\s*,\s*/g,',').trim().replace(/[.]$/,'');
    return canonicalLabel(ref);
  });
}
async function openParallelVerse(raw){openModal('verse');try{await loadParallelVerses(raw)}catch(err){const root=$('#verse-modal-content');root.innerHTML=`<div class="verse-error"><strong>വേദഭാഗം ലഭ്യമാക്കാനായില്ല.</strong><span>സത്യവേദപുസ്തകം 1910 പാഠം ലഭ്യമാക്കാൻ ഇന്റർനെറ്റ് കണക്ഷൻ ആവശ്യമാണ്.</span></div>`;console.error(err)}}
function nearest(s,dir){const i=availableDates.indexOf(s);if(i<0)return availableDates[0]||null;return availableDates[i+dir]||null}
function text(el,value){if(el)el.textContent=clean(value)}
function setHash(date,replace=false){const hash=`#manna-${date}`; if(location.hash===hash)return; if(replace)history.replaceState(null,'',hash); else history.pushState(null,'',hash)}
function selectedDateLabel(date){const d=parseDate(date);return `${monthMl[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`}
function updateReadingStatus(){
  const status=$('#reading-status');
  if(!status||!state.date)return;
  const saved=localStorage.getItem('manna-bookmark')===state.date;
  status.textContent=saved?'SAVED DAILY READING':'DAILY READING';
}
function renderEntry(date,{smooth=true,fromUser=true,replaceHash=false}={}){
  const e=find(date);if(!e)return false;
  state.date=date;
  state.calendar=parseDate(date);
  const parts=splitEntry(e.text);
  text($('#entry-date'),parts.dateLine||`${monthMl[e.month-1]} ${e.day}`);
  text($('#entry-verse'),parts.verse);text($('#entry-first'),parts.first);text($('#entry-second'),parts.second);
  text($('#entry-hymns'),parts.hymns);text($('#entry-morning-poem'),parts.morningPoem);text($('#entry-tower'),parts.tower);text($('#entry-questions'),parts.questions);
  const refRoot=$('#entry-references');refRoot.innerHTML='';
  expandReferenceLabels(parts.references).forEach(ref=>{const b=document.createElement('button');b.type='button';b.className='reference-chip malayalam';b.textContent=ref;b.title='Open in Sathyavedapusthakam';b.setAttribute('aria-label',`Open ${ref} in Sathyavedapusthakam`);b.addEventListener('click',()=>openParallelVerse(ref));refRoot.appendChild(b)});
  $('#entry-page').textContent=`PDF PAGE ${e.page}`;
  $('#selected-date-label').textContent=selectedDateLabel(date);
  document.title=`${parts.dateLine||selectedDateLabel(date)} · Heavenly Manna`;
  setHash(date,replaceHash);updateIndexSelection(date);updateNavState(date);updateBookmark();updateReadingStatus();updateNextPreview();requestAnimationFrame(updateReadingProgress);
  const entry=$('#manna-entry');entry.classList.remove('is-changing');void entry.offsetWidth;entry.classList.add('is-changing');
  if(smooth&&fromUser)window.scrollTo({top:0,behavior:'smooth'});
  return true;
}
function updateNextPreview(){
  const next=nearest(state.date,1), wrap=$('#next-preview');
  if(!wrap)return;
  if(!next){wrap.hidden=true;return}
  const e=find(next), p=splitEntry(e.text);
  wrap.hidden=false;$('#preview-date').textContent=p.dateLine||selectedDateLabel(next);$('#preview-verse').textContent=p.verse||'Heavenly Manna';
}
function updateNavState(date){const i=availableDates.indexOf(date);$('#prev-button').disabled=i<=0;$('#next-button').disabled=i<0||i>=availableDates.length-1}
function updateBookmark(){
  const saved=localStorage.getItem('manna-bookmark')===state.date;
  const b=$('#bookmark-button');if(!b)return;b.classList.toggle('saved',saved);$('#bookmark-label').textContent=saved?'SAVED':'SAVE DAY';b.querySelector('span').textContent=saved?'★':'☆';b.setAttribute('aria-pressed',String(saved));
}
function toggleBookmark(){if(localStorage.getItem('manna-bookmark')===state.date)localStorage.removeItem('manna-bookmark');else localStorage.setItem('manna-bookmark',state.date);updateBookmark();updateReadingStatus();toast(localStorage.getItem('manna-bookmark')===state.date?'Reading saved on this device.':'Saved reading removed.')}
function getReadingText(){
  const e=find(state.date);
  if(!e)return '';
  const p=splitEntry(e.text);
  return [p.dateLine,p.verse,p.first,p.second,p.references,p.hymns,p.morningPoem,p.tower,p.questions].filter(Boolean).join('\n\n');
}
function shareDay(){
  const url=`${location.origin}${location.pathname}#manna-${state.date}`;
  const title='Heavenly Manna';
  const shareText=getReadingText().slice(0,500);
  if(navigator.share){navigator.share({title,text:shareText,url}).catch(()=>{})}
  else copyReading();
}
function copyReading(){
  const content=getReadingText();
  if(!content)return;
  if(navigator.clipboard){navigator.clipboard.writeText(content).then(()=>toast('Reading copied to clipboard.')).catch(()=>toast('Copy is unavailable.'))}
  else toast('Copy is unavailable in this browser.');
}
function updateReadingProgress(){
  const bar=$('#reading-progress-bar'),entry=$('#manna-entry');
  if(!bar||!entry)return;
  const rect=entry.getBoundingClientRect();
  const viewport=window.innerHeight||1;
  const total=Math.max(1,entry.offsetHeight-viewport*.55);
  const passed=Math.min(total,Math.max(0,viewport*.22-rect.top));
  bar.style.width=`${Math.round((passed/total)*100)}%`;
  const top=$('#back-top');
  if(top)top.classList.toggle('show',window.scrollY>420);
}
function buildIndex(filter=''){
  const root=$('#index-list');root.innerHTML='';const q=filter.trim().toLowerCase();
  for(let m=1;m<=12;m++){
    const entries=DATA.filter(e=>e.month===m&&(!q||monthNames[m-1].toLowerCase().includes(q)||String(e.day).includes(q)||`${monthMl[m-1]} ${e.day}`.toLowerCase().includes(q)));
    if(!entries.length)continue;
    const sec=document.createElement('section');sec.className='index-month';const h=document.createElement('h3');h.textContent=monthNames[m-1].toUpperCase();sec.appendChild(h);
    const grid=document.createElement('div');grid.className='index-grid';entries.forEach(e=>{const b=document.createElement('button');b.type='button';b.className='index-day';b.textContent=e.day;b.dataset.date=yearDate(e.month,e.day);b.title=`${monthNames[e.month-1]} ${e.day}, 2026`;b.addEventListener('click',()=>{renderEntry(b.dataset.date);closeModal('index')});grid.appendChild(b)});sec.appendChild(grid);root.appendChild(sec);
  }
  if(!root.children.length){const empty=document.createElement('p');empty.className='empty-index';empty.textContent='No matching reading dates.';root.appendChild(empty)}
  updateIndexSelection(state.date);
}
function updateIndexSelection(date){$$('.index-day').forEach(b=>b.classList.toggle('current',b.dataset.date===date))}
function openModal(id){const m=$(`#${id}-modal`);if(!m)return;m.classList.add('open');m.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';if(id==='calendar'){$('#date-picker-trigger').setAttribute('aria-expanded','true');renderCalendar()};const close=m.querySelector('.close-button');if(close)close.focus()}
function closeModal(id){const m=$(`#${id}-modal`);if(!m)return;m.classList.remove('open');m.setAttribute('aria-hidden','true');if(id==='calendar')$('#date-picker-trigger').setAttribute('aria-expanded','false');if(!$$('.modal.open').length)document.body.style.overflow=''}
function renderVow(){
  const root=$('#vow-content');root.innerHTML='';VOW.forEach(page=>{const block=document.createElement('div');block.className='vow-page';String(page.text||'').split(/\n\s*\n+/).map(x=>x.trim()).filter(Boolean).forEach(t=>{const p=document.createElement('p');p.textContent=joinPhysicalLines(t);block.appendChild(p)});root.appendChild(block)});
}
function calendarMonthKey(){return `${state.calendar.getFullYear()}-${pad(state.calendar.getMonth()+1)}`}
function renderCalendar(){
  const y=state.calendar.getFullYear(),m=state.calendar.getMonth();$('#calendar-month').textContent=`${monthNames[m]} ${y}`;
  const grid=$('#calendar-grid');grid.innerHTML='';const first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
  for(let i=0;i<first;i++){const e=document.createElement('span');e.className='calendar-day empty';grid.appendChild(e)}
  for(let d=1;d<=days;d++){
    const date=`${y}-${pad(m+1)}-${pad(d)}`,b=document.createElement('button');b.type='button';b.className='calendar-day';b.textContent=d;
    const exists=!!find(date);b.classList.toggle('available',exists);b.classList.toggle('unavailable',!exists);b.classList.toggle('selected',date===state.date);b.classList.toggle('today',date===currentLocal());
    if(exists)b.addEventListener('click',()=>{renderEntry(date);closeModal('calendar')});else b.disabled=true;grid.appendChild(b);
  }
  $('#calendar-prev').disabled=y<=2026&&m===0;$('#calendar-next').disabled=y>=2026&&m===11;
}
function goToday(){const t=currentLocal();const target=find(t)?t:initialDate();renderEntry(target);closeModal('calendar')}
function initialDate(){const h=location.hash.match(/^#manna-(\d{4}-\d{2}-\d{2})$/);if(h&&find(h[1]))return h[1];const t=currentLocal();return find(t)?t:(availableDates[0]||null)}
function updateClock(){const now=new Date();$('#header-date').textContent=new Intl.DateTimeFormat('en-IN',{day:'2-digit',month:'short',year:'numeric'}).format(now).toUpperCase();$('#header-time').textContent=new Intl.DateTimeFormat('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true}).format(now)}
function showVowAuto(){
  if(state.vowOpened||sessionStorage.getItem('manna-vow-shown')==='1')return;
  state.vowOpened=true;sessionStorage.setItem('manna-vow-shown','1');openModal('vow');
}
function renderFromHash(){const h=location.hash.match(/^#manna-(\d{4}-\d{2}-\d{2})$/);if(h&&find(h[1])&&h[1]!==state.date)renderEntry(h[1],{smooth:false,fromUser:false,replaceHash:true})}
function init(){
  if(!DATA.length){$('#manna-entry').innerHTML='<div class="empty-state">Heavenly Manna data could not be loaded.</div>';return}
  state.date=initialDate();state.calendar=parseDate(state.date)||new Date(2026,0,1,12);
  buildIndex();renderVow();renderEntry(state.date,{smooth:false,fromUser:false,replaceHash:true});updateClock();setInterval(updateClock,30000);
  setTimeout(showVowAuto,500);
  $('#prev-button').addEventListener('click',()=>{const n=nearest(state.date,-1);if(n){state.calendar=parseDate(n);renderEntry(n)}});
  $('#next-button').addEventListener('click',()=>{const n=nearest(state.date,1);if(n){state.calendar=parseDate(n);renderEntry(n)}});
  $('#preview-next').addEventListener('click',()=>{const n=nearest(state.date,1);if(n){state.calendar=parseDate(n);renderEntry(n)}});
  $('#today-button').addEventListener('click',goToday);$('#today-main').addEventListener('click',goToday);
  $('#date-picker-trigger').addEventListener('click',()=>openModal('calendar'));
  $('#calendar-prev').addEventListener('click',()=>{if(state.calendar.getMonth()===0)return;state.calendar=new Date(state.calendar.getFullYear(),state.calendar.getMonth()-1,1,12);renderCalendar()});
  $('#calendar-next').addEventListener('click',()=>{if(state.calendar.getMonth()===11)return;state.calendar=new Date(state.calendar.getFullYear(),state.calendar.getMonth()+1,1,12);renderCalendar()});
  $('#calendar-today').addEventListener('click',goToday);
  $('#bookmark-button').addEventListener('click',toggleBookmark);$('#copy-button').addEventListener('click',copyReading);$('#share-button').addEventListener('click',shareDay);
  $('#index-open').addEventListener('click',()=>openModal('index'));$('#mobile-index').addEventListener('click',()=>openModal('index'));
  $('#vow-open').addEventListener('click',()=>openModal('vow'));$('#mobile-vow').addEventListener('click',()=>openModal('vow'));$('#vow-reminder-open').addEventListener('click',()=>openModal('vow'));
  $('#index-search-input').addEventListener('input',e=>buildIndex(e.target.value));
  $$('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){['calendar','index','verse','vow'].forEach(closeModal)}});
  window.addEventListener('hashchange',renderFromHash);
  window.addEventListener('storage',()=>{updateBookmark();updateReadingStatus()});
  window.addEventListener('scroll',updateReadingProgress,{passive:true});
  $('#back-top').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  updateReadingProgress();
  setTimeout(()=>{$('#vow-reminder').classList.add('show')},7000);
}
document.addEventListener('DOMContentLoaded',init);
})();
