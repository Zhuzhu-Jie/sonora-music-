from pathlib import Path
from zipfile import ZipFile
import wave,hashlib,re,json,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[1]
assets=root/'app/src/main/assets'
files=list((assets/'audio').glob('*.wav'))
content=(assets/'reference-data.js').read_text()
reference=json.loads(content.split('const REFERENCE=',1)[1].strip().rstrip(';'))
assert len(reference['lessons'])==57
assert sum(len(w['days']) for w in reference['guitarWeeks'])==84
assert len(reference['rhythmData'])==20 and len(reference['progressionData'])==19
assert len(files)==68
for f in files:
 with wave.open(str(f),'rb') as w:
  assert w.getnchannels()==1 and w.getsampwidth()==2 and w.getframerate()==22050
  assert w.getnframes()>0
  assert any(w.readframes(w.getnframes())),f
manifest=ET.parse(root/'app/src/main/AndroidManifest.xml').getroot();ns='{http://schemas.android.com/apk/res/android}'
permissions=[e.attrib[ns+'name'] for e in manifest.findall('uses-permission')]
assert permissions==['android.permission.RECORD_AUDIO']
application=manifest.find('application')
assert application.attrib[ns+'allowBackup']=='false'
assert application.attrib[ns+'usesCleartextTraffic']=='false'
assert application.find('activity').attrib[ns+'exported']=='true'
with ZipFile(root/'build/sonora-2.0.0.apk') as z:
 assert z.testzip() is None
 assert len([n for n in z.namelist() if n.startswith('assets/audio/')])==68
 assert not any('.jks' in n or 'password' in n for n in z.namelist())
 assert 'classes.dex' in z.namelist()
print('PASS: 68 valid offline WAV files, only microphone permission, no backup, valid APK ZIP and no signing secrets')
