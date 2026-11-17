import json,time
from pathlib import Path
import os,shutil
from playwright.sync_api import sync_playwright
REPORT=Path(__file__).resolve().parents[1]/'build'
REPORT.mkdir(exist_ok=True)
checks=[]
def ok(name):checks.append(name);print('PASS',name,flush=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_BIN') or shutil.which('chromium') or shutil.which('google-chrome'),headless=True,args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
 context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True)
 page=context.new_page();errors=[];external=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda r:external.append(r.url) if not r.url.startswith('http://127.0.0.1:8787/') else None)
 page.goto('http://127.0.0.1:8787');page.wait_for_selector('.hero')
 assert page.locator('.unit-card').count()==6
 assert page.locator('.lesson-link').count()==3
 page.screenshot(path=str(REPORT/'01-home.png'),full_page=True);ok('home and all 6 course units')
 page.locator('.hero .button').click();assert page.locator('.lesson-section').count()==3
 page.locator('[data-action="answer"][data-id="0"]').click();assert page.locator('.wrong').count()==1
 page.locator('[data-action="answer"][data-id="1"]').click();assert '已完成' in page.locator('#lesson-feedback').inner_text()
 page.locator('#lesson-note').fill('今天：音高与音量不同。<script>alert(1)</script>')
 page.locator('[data-action="close"]').first.click();page.reload();page.locator('.hero .button').click()
 assert '认识音名' in page.locator('.detail-title h1').inner_text()
 page.locator('[data-action="close"]').first.click();page.locator('.lesson-link[data-id="0"]').click()
 assert '<script>' in page.locator('#lesson-note').input_value();ok('quiz completion, next lesson, persisted text notes escaped')
 page.locator('[data-action="close"]').first.click();page.locator('#nav [data-id="sounds"]').click()
 assert page.locator('.sound-item').count()==24
 page.locator('[data-action="filter"][data-id="和弦"]').click();assert page.locator('.sound-item').count()==5
 page.locator('[data-action="audio"][data-id="chord_major"]').click();page.wait_for_timeout(350)
 assert page.evaluate('!audio.paused && audio.currentTime > 0')
 page.locator('[data-action="stop-audio"]').click();ok('24 sound groups, category filter, actual WAV decoding/playback')
 page.locator('#nav [data-id="practice"]').click();page.locator('[data-action="pitch"]').click()
 page.locator('[data-action="mic"]').click();assert '需要安装' in page.locator('#toast').inner_text();ok('browser preview does not pretend to measure microphone')
 page.evaluate('window.Sonora={start:()=>window.nativeState("started"),stop:()=>window.nativeState("stopped")};')
 page.locator('[data-action="mic"]').click();page.wait_for_timeout(600)
 page.evaluate('for(let i=0;i<20;i++)window.nativePitch(261.6256,.99,.15)')
 assert page.locator('#pitch-note').inner_text()=='C4';assert page.locator('#mic-rate').inner_text()=='100%'
 page.screenshot(path=str(REPORT/'02-pitch.png'),full_page=True)
 page.locator('[data-action="mic"]').click();assert '100' in page.locator('#pitch-result').inner_text();ok('native bridge UI contract: C4, cents, 100% score and saved summary')
 page.locator('[data-action="mic"]').click();page.wait_for_timeout(550)
 page.evaluate('window.nativePitch(-1,0,.001)');assert page.locator('#pitch-note').inner_text()=='—'
 page.locator('[data-action="mic"]').click();assert '有效声音不足' in page.locator('#pitch-result').inner_text();ok('silence produces no fake pitch or training score')
 page.evaluate('window.nativeState("denied")');assert '未授权' in page.locator('#toast').inner_text();ok('permission denial handled')
 page.locator('[data-action="close"]').first.click();page.locator('[data-action="ear"][data-id="interval"]').click()
 for n in range(5):
  assert page.locator('[data-action="ear-answer"]:disabled').count()==6
  page.locator('[data-action="ear-play"]').click();answer=page.evaluate('ear.answer')
  page.locator(f'[data-action="ear-answer"][data-id="{answer}"]').click();page.locator('[data-action="ear-next"]').click()
 assert '5 / 5' in page.locator('.score').inner_text();ok('complete 5-question ear training and score persistence')
 page.locator('[data-action="close"]').first.click();page.locator('[data-action="piano"]').click()
 key=page.locator('.key[data-note="60"]');box=key.bounding_box();page.mouse.move(box['x']+box['width']/2,box['y']+box['height']-20);page.mouse.down();page.wait_for_timeout(200)
 assert 'C4' in page.locator('#piano-display').inner_text();assert page.evaluate('pianoVoices.size')==1
 page.mouse.up();assert page.evaluate('pianoVoices.size')==0;ok('piano pointer capture, oscillator start and release')
 page.locator('[data-action="close"]').first.click();page.locator('[data-action="metro"]').click();page.locator('[data-action="metro-toggle"]').click();page.wait_for_timeout(450)
 assert page.evaluate('metro.playing')
 page.locator('#meter').select_option('3');assert page.locator('.beat-dot').count()==3
 page.locator('[data-action="close"]').first.click();assert not page.evaluate('metro.playing');ok('metronome starts, meter changes, stops on exit')
 page.locator('#nav [data-id="profile"]').click();assert page.locator('.record').count()==2
 assert '<script>' in page.locator('.note-preview p').inner_text();assert page.locator('.note-preview script').count()==0;ok('profile shows real records, renders user notes as text')
 page.locator('[data-action="privacy"]').click();assert '不申请联网权限' in page.locator('.legal').inner_text();page.locator('[data-action="close"]').first.click()
 page.locator('[data-action="reset"]').click();page.locator('[data-action="close"]').first.click();assert page.locator('.record').count()==2
 page.locator('[data-action="reset"]').click();page.locator('[data-action="confirm-reset"]').click();assert page.locator('.record').count()==0;ok('privacy accessible, reset cancellable and confirms deletion')
 for width,height in [(320,740),(390,844),(768,1024),(1280,900)]:
  page.set_viewport_size({'width':width,'height':height});page.evaluate('page="learn";shell()');assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth'),f'overflow {width}'
  if width==1280:page.screenshot(path=str(REPORT/'03-desktop.png'),full_page=True)
 ok('no horizontal overflow at 320, 390, 768 and 1280 px')
 assert not errors,errors;assert not external,external;ok('no uncaught JS errors and no external requests')
 browser.close()
(REPORT/'ui-results.json').write_text(json.dumps({'checks':checks,'count':len(checks),'errors':errors,'external_requests':external},ensure_ascii=False,indent=2))
