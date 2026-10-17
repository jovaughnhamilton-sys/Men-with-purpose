#!/usr/bin/env python3
"""Reproduce the verse reader dataset from the pinned official eBible USFX archive."""
import hashlib,json,pathlib,re,xml.etree.ElementTree as ET,zipfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
archive=ROOT/'bible/sources/eng-web_usfx.zip'
vpl_archive=ROOT/'bible/sources/eng-web_vpl.zip'
codes='GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV'.split()
names=json.loads(re.search(r'const bibleBooks=(\[.*?\]);',(ROOT/'index.html').read_text()).group(1).replace("'",'"'))
xml=zipfile.ZipFile(archive).read('eng-web_usfx.xml');root=ET.fromstring(xml)
books={}
def plain(node):
    return ''.join(node.itertext())
def normal(text):
    return re.sub(r'\s+',' ',text).strip()
for code,name in zip(codes,names):
    source=next(x for x in root.findall('book') if x.get('id')==code)
    chapters={};intros={};notes={};state={'chapter':None,'verse':None,'parts':[]}
    def flush():
        if state['verse'] is not None:
            c,v=state['chapter'],state['verse'];text=normal(''.join(state['parts']))
            assert str(v) not in chapters[c], (name,c,v)
            chapters[c][str(v)]=text;state['verse']=None;state['parts']=[]
    def walk(node):
        if node.tag=='c':
            flush();state['chapter']=node.get('id');chapters[state['chapter']]={};return
        if node.tag=='v':
            flush();state['verse']=int(node.get('id'));return
        if node.tag=='ve':
            flush();return
        if node.tag=='d':
            intros.setdefault(state['chapter'],[]).append(normal(plain(node)))
            for note in node.iter('f'):
                notes.setdefault(f"{state['chapter']}:1",[]).append(normal(plain(note)))
            return
        if node.tag in {'f','x'}:
            if state['verse'] is not None:
                key=f"{state['chapter']}:{state['verse']}"
                notes.setdefault(key,[]).append(normal(plain(node)))
            return
        if node.tag in {'s','id','ide','h','toc','cl','cp'} or (node.tag=='p' and node.get('sfm','').startswith('mt')):
            return
        if state['verse'] is not None and node.text:state['parts'].append(node.text)
        for child in node:
            walk(child)
            if state['verse'] is not None and child.tail:state['parts'].append(child.tail)
        # Paragraphs/poetry can cross a verse boundary; preserve the word separation.
        if state['verse'] is not None and node.tag in {'p','q'}:state['parts'].append(' ')
    walk(source);flush()
    books[name]={'id':code,'chapters':chapters,'superscriptions':intros,'notes':notes}
# The publisher's VPL export defines authoritative verse display strings, including
# superscriptions/acrostic labels at their original positions. USFX supplies notes.
vpl_xml=zipfile.ZipFile(vpl_archive).read('eng-web_vpl.xml')
by_code={book['id']:book for book in books.values()}
for book in books.values():book['superscriptions']={}
for verse in ET.fromstring(vpl_xml):
    if verse.get('b') in by_code:
        book=by_code[verse.get('b')]
        book['chapters'][verse.get('c')][verse.get('v')]=normal(plain(verse))
output={'translation':'World English Bible Classic','edition':'2020 stable text, official snapshot retrieved 2026-10-17','source':'https://ebible.org/Scriptures/eng-web_usfx.zip','license':'Public Domain','books':books}
data=(json.dumps(output,ensure_ascii=False,separators=(',',':'))+'\n').encode()
(ROOT/'bible/web.json').write_bytes(data)
manifest={'source':output['source'],'retrieved':'2026-10-17','archive_sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'source_xml_sha256':hashlib.sha256(xml).hexdigest(),'verse_source':'https://ebible.org/Scriptures/eng-web_vpl.zip','verse_archive_sha256':hashlib.sha256(vpl_archive.read_bytes()).hexdigest(),'verse_xml_sha256':hashlib.sha256(vpl_xml).hexdigest(),'dataset_sha256':hashlib.sha256(data).hexdigest(),'books':len(books),'chapters':sum(len(b['chapters']) for b in books.values()),'verses':sum(len(c) for b in books.values() for c in b['chapters'].values()),'dataset_bytes':len(data)}
(ROOT/'bible/provenance.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(manifest,indent=2))
