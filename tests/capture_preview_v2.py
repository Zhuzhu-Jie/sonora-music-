"""Clean browser previews; no inserted progress or microphone measurements."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
dest = root / 'build/preview-v2'
dest.mkdir(parents=True, exist_ok=True)
labels = ['今日学习', '多样训练', '音准练习', '和弦与节奏']
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
    context = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1,
                                  is_mobile=True, has_touch=True, timezone_id='America/Los_Angeles')
    page = context.new_page()
    page.goto('http://127.0.0.1:8789')
    page.wait_for_selector('.hero')
    page.screenshot(path=str(dest / '0.png'))
    page.locator('#nav [data-id="train"]').click()
    page.screenshot(path=str(dest / '1.png'))
    page.evaluate("App.actions.pitch('single')")
    page.locator('[data-act="mic-prepare"]').click()
    page.screenshot(path=str(dest / '2.png'))
    page.locator('[data-act="back"]').first.click()
    page.evaluate("App.navigate('lab')")
    page.screenshot(path=str(dest / '3.png'))
    browser.close()

canvas = Image.new('RGB', (1660, 1000), '#e9edf5')
draw = ImageDraw.Draw(canvas)
font_path = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
font = ImageFont.truetype(font_path, 25)
small = ImageFont.truetype(font_path, 17)
draw.text((32, 20), '听见 2.0 · 吉他与听觉练习室', fill='#17223b', font=font)
for i, label in enumerate(labels):
    x = 32 + i * 405
    draw.text((x, 67), label, fill='#5b6883', font=small)
    canvas.paste(Image.open(dest / f'{i}.png').convert('RGB'), (x, 101))
draw.text((32, 963), '真实界面预览 · 未填入虚构学习记录或测量数据 · 安卓收音需在安装后主动开启', fill='#5b6883', font=small)
canvas.save(root / 'docs/preview-v2.png')
print('Saved docs/preview-v2.png')
