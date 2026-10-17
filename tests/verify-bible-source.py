"""Independent full-corpus comparison with the pinned publisher's verse export."""
import hashlib,json,pathlib,re,xml.etree.ElementTree as ET,zipfile
root=pathlib.Path(__file__).resolve().parents[1]
data=json.loads((root/'bible/web.json').read_text())
books={book['id']:book for book in data['books'].values()}
source=zipfile.ZipFile(root/'bible/sources/eng-web_vpl.zip').read('eng-web_vpl.xml')
checked=0
for verse in ET.fromstring(source):
    if verse.get('b') not in books:continue
    expected=re.sub(r'\s+',' ',''.join(verse.itertext())).strip()
    actual=books[verse.get('b')]['chapters'][verse.get('c')][verse.get('v')]
    assert actual==expected,verse.attrib
    checked+=1
assert checked==31103
print(f'PASS: all {checked} canonical verse markers match the official publisher export.')
