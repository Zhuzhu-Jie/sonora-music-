const assert=require('assert'),fs=require('fs'),vm=require('vm'),path=require('path');
const assets=path.join(__dirname,'../app/src/main/assets');
const Music=require(path.join(assets,'music-core.js'));
const refContext={};vm.createContext(refContext);vm.runInContext(fs.readFileSync(path.join(assets,'reference-data.js'),'utf8')+';this.REF=REFERENCE;',refContext);const R=JSON.parse(JSON.stringify(refContext.REF));
let checks=0;function ok(a,m){assert(a,m);checks++;}
let seed=1234567;function rng(){seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;}
ok(R.lessons.length===57,'57 imported chapters');ok(R.guitarWeeks.reduce((s,w)=>s+w.days.length,0)===84,'84 daily tasks');ok(R.WEEKS.reduce((s,w)=>s+w.days.length,0)===42,'42 hearing days');ok(R.rhythmData.length===20&&R.progressionData.length===19&&R.chordData.length===30,'reference collections');
R.lessons.forEach(l=>{ok(!/<script|<iframe|\son\w+=|javascript:|https?:/i.test(l.html),'sanitized reference '+l.id);});
R.chordData.forEach(c=>{const parsed=Music.chord(c.name);ok(!!parsed,'parse chord '+c.name);const actual=Music.shapeNotes(c.shape).filter(n=>n!==null).map(Music.mod);const expected=parsed.offsets.map(x=>Music.mod(parsed.root+x));ok(actual.every(n=>expected.includes(n)),c.name+' shape contains only chord tones');ok(expected.every((n,i)=>actual.includes(n)||(c.name==='C7'&&i===2)),c.name+' contains defining tones (C7 omits fifth)');ok(actual[0]===parsed.bass,c.name+' correct bass');});
ok(Music.name(40)==='E2'&&Music.name(64)==='E4','standard string octaves');ok(Music.pc('E♯')===5&&Music.pc('C♭')===11,'enharmonic pitch classes');ok(Music.scaleNames(1,'major').join(' ')==='C♯ D♯ E♯ F♯ G♯ A♯ B♯ C♯','C sharp major spelling');ok(Music.scaleNames(0,'blues').join(' ')==='C E♭ F G♭ G B♭ C','blues spelling');
for(let root=0;root<12;root++){R.progressionData.forEach(p=>{const out=Music.progression(p,root);ok(out.length===p.seq.length&&out.every(c=>Music.chord(c)),p.name+' transposed '+root);});}
ok(Music.progression(R.progressionData[15],0).join(' ')==='C F Fm C','borrowed minor iv remains minor');ok(Music.progression(R.progressionData[16],0).join(' ')==='C E7 Am F','secondary dominant retains major third');
for(const mode of ['direction','interval','degree','scale','chord','progression','melody','theory'])for(const difficulty of ['easy','medium','hard']){
 const roots=new Set(),answers=new Set();for(let i=0;i<180;i++){
 const c={difficulty,key:'random',presentation:'mixed',scale:i%2?'minor':'major',voice:'guitar',length:3+i%4,inversions:true};const q=Music.question(mode,c,R,rng);roots.add(q.root);answers.add(q.answer);
 ok(q.notes.every(n=>Number.isFinite(n)&&n>=24&&n<=100),mode+' MIDI range');ok(q.options.length>1,mode+' real alternatives');
 if(mode==='melody')ok(q.answer===q.degrees.join('-')&&q.notes.every((n,j)=>n===q.root+Music.scales[q.scale].notes[q.degrees[j]-1]),'melody degree mapping');else ok(q.options.some(o=>o[0]===q.answer),'answer belongs to options');
 if(mode==='interval')ok(Math.abs(q.notes[1]-q.notes[0])===+q.answer,'interval truth');
 if(mode==='degree')ok(q.notes[0]-q.root===Music.scales[q.scale].notes[+q.answer-1],'degree truth');
 if(mode==='chord'){const ct=Music.chordTypes.find(c=>(c.id||'major')===q.answer);ok(q.notes.every(n=>ct.notes.includes(Music.mod(n-q.root))),'inversion preserves quality');}
 if(mode==='progression')ok(q.chords.every(c=>Music.chord(c))&&q.scale==='major','progression context');
 }
 ok(roots.size>8,mode+' varied roots');ok(answers.size>1,mode+' varied questions');
}
const focused=Music.question('interval',{difficulty:'hard',focus:[3,4],presentation:'down',key:'0'},R,rng);ok(focused.options.length===2&&focused.notes[0]>focused.notes[1],'day focus and descending mode actually applied');
let score=Music.tapScore([1,2,3],[1.02,1.98,3.01],.1);ok(score.accuracy===100&&score.extra===0&&score.mean<.03,'accurate tapping');score=Music.tapScore([1,2,3],[1,2,3,3.1,3.2,3.3],.1);ok(score.accuracy===50&&score.extra===3,'extra taps penalized');score=Music.tapScore([1,2,3],[],.1);ok(score.accuracy===0&&score.mean===null,'silence does not invent timing');
let saved={};const localStorage={getItem:k=>saved[k]||null,setItem:(k,v)=>saved[k]=v};const sandbox={Music,REFERENCE:R,localStorage,window:{},console};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(assets,'store.js'),'utf8'),sandbox);const state=sandbox.State;
let d=JSON.parse(JSON.stringify(state.data));d.completed=['theory-1','evil'];d.notes={'theory-1':'<script>alert(1)</script>',constructor:'bad'};d.songs=[{title:'my song',id:'song-1',chords:['C','Fm','Bb'],lyrics:['你好 / 节奏'],bpm:88,capo:2,pattern:'r2'}];state.replace(d);ok(state.data.completed.length===1,'known chapter ids only');ok(!Object.prototype.hasOwnProperty.call(state.data.notes,'constructor'),'reserved key not imported');ok(state.data.songs.length===1&&state.data.songs[0].chords[1]==='Fm','song cards survive backup validation');
const q=Music.question('melody',{key:'0',length:4,difficulty:'easy'},R,rng);state.answer(q,false,false);state.answer(q,true,true);ok(!state.data.mistakes[0].mastered,'one correct review not enough');state.answer(q,true,true);ok(state.data.mistakes[0].mastered,'two successful reviews mark mastery');state.replace(Object.assign({},JSON.parse(JSON.stringify(state.data)),{legacy:{completed:[0],notes:{0:'old note'},pitchCount:0,earCount:0}}));state.replace(Object.assign({},JSON.parse(JSON.stringify(state.data)),{legacy:null}));ok(state.data.legacy.notes[0]==='old note','import without legacy does not discard old-version notes');const b=state.backup();const restored=state.parseBackup(b);ok(restored.notes['theory-1']==='<script>alert(1)</script>','notes preserved as plain text');ok(restored.songs.length===1,'song backup roundtrip');
let rejected=false;try{state.parseBackup('{"app":"other","version":2}');}catch(e){rejected=true;}ok(rejected,'foreign backup rejected');ok(state.question({mode:'degree',root:60,scale:'evil',options:[['1','x']],answer:'1',notes:[60]})===null,'invalid scale rejected');
console.log('PASS',checks,'checks: imported data, spelling, 12-key harmony, randomized training, timing, safe backups and review state');
