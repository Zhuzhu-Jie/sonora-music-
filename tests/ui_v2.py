from pathlib import Path
import json,time,re
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'build';OUT.mkdir(exist_ok=True)
checks=[]
def ok(s):checks.append(s);print('PASS',s,flush=True)
def wait(page,expr,timeout=20):
 deadline=time.monotonic()+timeout
 while time.monotonic()<deadline:
  if page.evaluate(expr):return
  page.wait_for_timeout(100)
 raise AssertionError('timed out: '+expr)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
 c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True,timezone_id='America/Los_Angeles')
 c.add_init_script("localStorage.setItem('sonora-v1', JSON.stringify({completed:[0,1],notes:{0:'旧版笔记：保留我'},pitch:[],ear:[]}));")
 page=c.new_page();errors=[];external=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda r:external.append(r.url) if not r.url.startswith('http://127.0.0.1:8789/') and not r.url.startswith('blob:') else None)
 page.goto('http://127.0.0.1:8789');page.wait_for_selector('.hero')
 assert page.locator('#nav .navitem').count()==5
 page.screenshot(path=str(OUT/'v2-home.png'));ok('new home and 5 mobile destinations, real empty stats')
 page.locator('#nav [data-id="learn"]').click();assert page.locator('.lesson-row').count()==57
 page.locator('#course-search').fill('CAGED');assert page.locator('.lesson-row').count()>=1
 page.locator('.lesson-row').first.click();assert page.locator('.article-content').inner_text()
 page.locator('#lesson-note').fill('新笔记 <img src=x onerror=alert(1)>')
 page.locator('[data-act="lesson-done"]').click();page.locator('[data-act="back"]').first.click()
 page.locator('[data-act="learn-tab"][data-id="g"]').click();assert page.locator('.week-card').count()==12
 page.locator('.day-row').first.click();page.locator('#day-minutes').fill('25');page.locator('#day-done').check();page.locator('#day-note').fill('今天练第六弦。')
 page.locator('[data-act="back"]').first.click();page.reload();assert page.evaluate("State.data.days['g-0'].done&&State.data.days['g-0'].minutes===25")
 ok('57 searchable chapters, persisted notes and actual 84-day plan records')
 page.evaluate("App.learning='e';App.navigate('learn')");assert page.locator('.week-card').count()==6
 page.evaluate("App.learning='s';App.render()");assert page.locator('.week-card').count()==2;ok('42-day hearing and 14-day singing routes')
 page.evaluate("App.navigate('me')");page.locator('[data-act="legacy"]').click();assert '旧版笔记：保留我' in page.locator('#dialog-body').inner_text();page.locator('[data-act="back"]').first.click()
 page.locator('[data-act="notes"]').click();assert '<img' in page.locator('.note-preview p').inner_text();assert page.locator('.note-preview img').count()==0
 page.locator('[data-act="back"]').first.click();ok('v1 notes retained, user note HTML rendered as text')
 # Real Web Audio for each auditive generator, with answer held until full playback.
 for mode in ['direction','interval','degree','scale','chord','progression','melody','theory']:
  page.evaluate(f"App.actions.ear('{mode}')")
  page.locator('#ear-count').select_option('5');page.locator('#ear-key').select_option('random')
  if mode=='interval':page.locator('#ear-presentation').select_option('down')
  page.locator('[data-act="ear-start"]').click()
  if mode!='theory':
   assert page.locator('[data-act="ear-answer"]:disabled').count()>0
   page.locator('[data-act="ear-play"]').click();wait(page,'Ear.heard&&!Ear.busy')
  if mode=='melody':
   answer=page.evaluate('Ear.question.degrees')
   for n in answer:page.locator(f'[data-act="ear-answer"][data-id="{n}"]').click()
   page.locator('[data-act="melody-submit"]').click()
  else:
   answer=page.evaluate('Ear.question.answer');page.locator(f'[data-act="ear-answer"][data-id="{answer}"]').click()
  assert page.locator('.feedback').count()==1 and page.evaluate('Ear.wasCorrect')
  assert page.evaluate('State.data.events.at(-1).correct')
  page.locator('[data-act="back"]').first.click()
 ok('all 8 training modes play real audio where needed and grade answers correctly')
 # Incorrect answer enters exact-question review, two correct reviews are required.
 page.evaluate("App.actions.ear('interval')");page.locator('[data-act="ear-start"]').click();page.locator('[data-act="ear-play"]').click();wait(page,'Ear.heard&&!Ear.busy')
 wrong=page.evaluate("Ear.question.options.find(o=>o[0]!==Ear.question.answer)[0]")
 page.locator(f'[data-act="ear-answer"][data-id="{wrong}"]').click();assert page.evaluate('State.data.mistakes.length')==1
 page.locator('[data-act="back"]').first.click()
 for n in range(2):
  page.evaluate("App.actions.review()")
  page.locator('[data-act="review-one"]').first.click();page.locator('[data-act="ear-play"]').click();wait(page,'Ear.heard&&!Ear.busy')
  answer=page.evaluate('Ear.question.answer');page.locator(f'[data-act="ear-answer"][data-id="{answer}"]').click()
  assert page.evaluate('State.data.mistakes[0].mastered')==(n==1)
  page.locator('[data-act="back"]').first.click();page.locator('[data-act="back"]').first.click()
 ok('wrong-question capture and exact-sound review require two correct attempts')
 # Fretboard actual note formula and imported chord voicings.
 page.evaluate("App.navigate('lab');App.open('fret')");assert page.locator('.fret-cell').count()==78
 page.locator('[data-act="fret-note"][data-id="5-3"]').click();assert 'G2' in page.locator('#fret-note-name').inner_text()
 page.locator('#fret-root').select_option('7');page.locator('#fret-scale').select_option('minorPent');assert page.locator('.fret-cell.root').count()>0
 page.locator('[data-act="back"]').first.click();page.evaluate("App.open('chords')");assert page.locator('.chord-tile').count()==30
 page.locator('[data-act="chord-detail"][data-id="C7"]').click();assert '省略五音' in page.locator('#dialog-body').inner_text();page.locator('[data-act="chord-play"]').click();page.wait_for_timeout(100)
 page.locator('[data-act="back"]').first.click();page.locator('[data-act="back"]').first.click();assert not page.evaluate('Sound.playing')
 ok('78 fret positions, transposed scale highlights, 30 chord shapes and fifth-omission explanation')
 # 19 progression mapping and loop cancellation on modal exit.
 page.evaluate("App.open('progressions')");assert page.locator('[data-act="progression-detail"]').count()==19
 page.locator('[data-act="progression-detail"][data-id="15"]').click();assert page.locator('#prog-chords').inner_text().replace('\n',' ')== 'C F Fm C'
 page.locator('[data-act="prog-toggle"]').click();page.wait_for_timeout(300);assert page.evaluate('Sound.playing')
 page.locator('#prog-key').select_option('7');assert 'Cm' in page.locator('#prog-chords').inner_text()
 page.locator('[data-act="back"]').first.click();page.locator('[data-act="back"]').first.click();assert not page.evaluate('Sound.playing')
 ok('19 harmonic routes, borrowed minor preserved after transposition, loop stops on exit')
 # Rhythm dictionaries and fake-score prevention on cancel.
 page.evaluate("App.open('patterns')");assert page.locator('[data-act="pattern-detail"]').count()==20
 page.locator('[data-act="pattern-detail"][data-id="r15"]').click();assert page.locator('.beat-cell').count()==6
 page.locator('[data-act="pattern-toggle"]').click();page.wait_for_timeout(250);assert page.evaluate('Sound.playing')
 page.locator('[data-act="pattern-tap"]').click();assert page.locator('#tap-pattern').input_value()=='r15'
 page.locator('#tap-bpm').fill('140');page.locator('[data-act="tap-start"]').click();page.wait_for_timeout(500)
 before=page.evaluate('State.data.sessions.length');page.locator('[data-act="tap-cancel"]').click();assert page.evaluate('State.data.sessions.length')==before
 page.locator('[data-act="back"]').first.click();page.locator('[data-act="back"]').first.click();page.locator('[data-act="back"]').first.click()
 ok('20 patterns including 6/8; interrupted tap exercise creates no fake score')
 # Studio custom parsing, multiple song cards, invalid chord rejection, XSS escaping.
 page.evaluate("App.open('studio')");page.locator('[data-act="song-edit"]').click()
 page.locator('#song-title').fill('<script>song</script>')
 page.locator('#song-chords').fill('C | Fm | Bb | G/B');page.locator('#song-capo').fill('2');page.locator('[data-act="song-apply"]').click()
 assert page.locator('.measure').count()==4;assert '实际发声 D' in page.locator('.measure').first.inner_text()
 page.locator('[data-act="song-save"]').click();assert page.evaluate('State.data.songs.length')==1
 page.locator('[data-act="studio-toggle"]').click();page.wait_for_timeout(300);assert page.evaluate('Sound.playing')
 page.locator('[data-act="studio-toggle"]').click();assert page.evaluate('State.data.sessions.at(-1).score') is None
 page.locator('[data-act="songs"]').click();assert '<script>song</script>' in page.locator('#dialog-body').inner_text();assert page.locator('#dialog-body script').count()==0
 page.locator('[data-act="back"]').first.click();page.locator('[data-act="song-edit"]').click();page.locator('#song-chords').fill('C | alert(1)');page.locator('[data-act="song-apply"]').click();assert '暂不识别' in page.locator('#toast').inner_text();page.locator('[data-act="back"]').first.click();page.locator('[data-act="back"]').first.click()
 ok('custom arrangement, capo calculation, saved song cards, unscored accompaniment and safe user text')
 # Finish a real-time tap round with no input: valid zero, not invented hits.
 page.evaluate("App.actions.rhythm()")
 page.locator('#tap-pattern').select_option('r14');page.locator('#tap-bpm').fill('140');page.locator('[data-act="tap-start"]').click()
 wait(page,"Tap.phase==='result'",timeout=12)
 assert page.evaluate('Tap.result.hits')==0 and page.evaluate('Tap.result.accuracy')==0
 page.locator('[data-act="back"]').first.click()
 ok('completed timed tap round records real zero hits when no taps are made')
 # Every other interactive tool actually starts and stops.
 page.evaluate("App.actions.fretquiz()")
 for i in range(10):
  title=page.locator('.dialog-title h1').inner_text();match=re.search(r'第 (\d) 弦找到 (.+)',title)
  string=int(match.group(1))-1;pc=page.evaluate('(n)=>Music.pc(n)',match.group(2))
  opens=[64,59,55,50,45,40];fret=next(f for f in range(13) if (opens[string]+f)%12==pc)
  page.locator(f'[data-act="fret-answer"][data-id="{string}-{fret}"]').click()
  page.locator('[data-act="fret-next"]').click()
 assert '10 / 10' in page.locator('.big').inner_text();page.locator('[data-act="back"]').first.click()
 page.evaluate("App.open('metro')");page.locator('#metro-meter').select_option('6');assert page.locator('[data-metro]').count()==6
 page.locator('[data-act="metro-toggle"]').click();page.wait_for_timeout(300);assert page.evaluate('Sound.playing')
 page.locator('[data-act="back"]').first.click();assert not page.evaluate('Sound.playing')
 page.evaluate("App.open('piano')");page.locator('#piano-octave').select_option('5');page.locator('[data-act="piano-note"][data-id="72"]').click();assert 'C5' in page.locator('#piano-note').inner_text();page.locator('[data-act="back"]').first.click()
 page.evaluate("App.open('changes')");page.locator('[data-act="change-toggle"]').click();page.wait_for_timeout(300);page.locator('[data-act="change-toggle"]').click();assert page.evaluate('State.data.sessions.at(-1).score') is None
 page.locator('[data-act="back"]').first.click()
 ok('fret finding scores actual positions; metronome, keyboard and unscored chord changes operate')
 # Native microphone contract: no false values for silence, real cents directions, phrase progression.
 page.evaluate("App.actions.pitch('single')")
 assert page.evaluate("document.querySelector('.tabs').children.length===3&&!document.querySelector('.tabs .form-grid')")
 for width in [320,390]:
  page.set_viewport_size({'width':width,'height':844})
  for mode in ['single','phrase','tuner']:
   page.locator(f'[data-act="mic-mode"][data-id="{mode}"]').click()
   assert page.evaluate("document.querySelector('#dialog-body').scrollWidth<=document.querySelector('#dialog-body').clientWidth+1")
   assert page.locator('[data-act="mic-prepare"]').is_visible()
 page.locator('[data-act="mic-mode"][data-id="single"]').click()
 page.locator('[data-act="mic-prepare"]').click();page.locator('[data-act="mic-toggle"]').click();assert '需要安装' in page.locator('#toast').inner_text()
 page.evaluate('window.Sonora={start:()=>nativeState("started"),stop:()=>nativeState("stopped")};')
 page.locator('[data-act="mic-toggle"]').click();page.wait_for_timeout(650);page.evaluate('nativePitch(-1,0,.001)');assert page.locator('#mic-note').inner_text()=='—'
 page.evaluate('for(let i=0;i<12;i++)nativePitch(261.625565,.99,.12)');assert page.locator('#mic-note').inner_text()=='C4';assert page.locator('#mic-rate').inner_text()=='100%'
 page.locator('[data-act="mic-toggle"]').click();assert '有效采样' in page.locator('#mic-result').inner_text()
 page.locator('[data-act="mic-config"]').click();page.locator('[data-act="mic-mode"][data-id="phrase"]').click();page.locator('[data-act="mic-prepare"]').click();page.locator('[data-act="mic-toggle"]').click();page.wait_for_timeout(650)
 for i in range(10):page.evaluate('nativePitch(261.625565,.99,.12)');page.wait_for_timeout(100)
 assert page.evaluate('Mic.state.finished');page.locator('[data-act="mic-toggle"]').click();page.locator('[data-act="mic-next"]').click();assert page.evaluate('Mic.state.index')==1
 page.locator('[data-act="back"]').first.click();assert not page.evaluate('Mic.active')
 ok('native bridge display, silence rejection, cents scoring, stable multi-note steps and stop on exit')
 # Backup export and preview/cancel/confirmed import.
 page.evaluate('delete window.Sonora;App.navigate("me")')
 with page.expect_download() as info:page.locator('[data-act="backup-export"]').click()
 download=info.value;download.save_as(str(OUT/'ui-test-backup.json'));backup=json.loads((OUT/'ui-test-backup.json').read_text());assert backup['data']['songs']
 page.evaluate('App.importText(State.backup())');assert page.locator('[data-act="import-confirm"]').count()==1
 page.locator('[data-act="back"]').first.click();page.evaluate('App.importText(State.backup())');page.locator('[data-act="import-confirm"]').click();assert page.evaluate('State.data.songs.length')==1
 page.evaluate("App.importText('{\"app\":\"evil\"}')");assert '导入失败' in page.locator('#toast').inner_text()
 ok('JSON export, schema validation, import preview and explicit replacement')
 # Snapshot clean design and viewport layout.
 page.evaluate('App.navigate("train")');page.screenshot(path=str(OUT/'v2-training.png'),full_page=True)
 for width,height in [(320,740),(390,844),(768,1024),(1280,900)]:
  page.set_viewport_size({'width':width,'height':height})
  for tab in ['home','learn','train','lab','me']:
   page.evaluate(f'App.navigate("{tab}")');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,tab)
  if width==1280:page.evaluate('App.navigate("home")');page.screenshot(path=str(OUT/'v2-desktop.png'),full_page=True)
 ok('all 5 sections fit 320,390,768,1280 pixel layouts')
 assert not errors,errors;assert not external,external;ok('no uncaught JS errors or external network requests')
 b.close()
(OUT/'ui-v2-results.json').write_text(json.dumps({'checks':checks,'count':len(checks),'errors':errors,'external_requests':external},ensure_ascii=False,indent=2))
