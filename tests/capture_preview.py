from pathlib import Path
import os,shutil
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw,ImageFont
root=Path(__file__).resolve().parents[1];dest=root/'build/preview';dest.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_BIN') or shutil.which('chromium') or shutil.which('google-chrome'),headless=True,args=['--no-sandbox'])
 c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
 pg=c.new_page();pg.goto('http://127.0.0.1:8787');pg.wait_for_selector('.hero')
 pg.screenshot(path=str(dest/'学习.png'))
 pg.locator('#nav [data-id="practice"]').click();pg.screenshot(path=str(dest/'练习.png'))
 pg.locator('[data-action="pitch"]').click();pg.screenshot(path=str(dest/'音高训练.png'))
 pg.locator('[data-action="close"]').click();pg.locator('#nav [data-id="sounds"]').click();pg.screenshot(path=str(dest/'声音.png'))
 b.close()
canvas=Image.new('RGB',(1660,986),'#e9ecdf');d=ImageDraw.Draw(canvas)
font=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',24)
small=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',16)
d.text((32,22),'听见 · SONORA  |  你的随身音乐练习室',fill='#245e4b',font=font)
for i,label in enumerate(['学习','练习','音高训练','声音']):
 x=32+i*405;d.text((x,67),label,fill='#69765a',font=small);canvas.paste(Image.open(dest/(label+'.png')).convert('RGB'),(x,101))
d.text((32,957),'本地界面预览；音高训练画面未使用虚构的测量数据。',fill='#69765a',font=small)
canvas.save(root/'build/界面预览.png')
print('Preview captured')
