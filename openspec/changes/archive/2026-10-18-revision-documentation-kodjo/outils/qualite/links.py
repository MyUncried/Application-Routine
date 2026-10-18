import re,os,urllib.parse,glob,sys
os.chdir(sys.argv[1])
tot=0;miss=[]
def slug(h):
    h=h.strip().lower()
    h=re.sub(r'[^\w\- ]','',h)
    return h.replace(' ','-')
for f in sorted(glob.glob('*.md')):
    txt=open(f,encoding='utf-8').read()
    for m in re.finditer(r'\]\(([^)]+?\.md)#([^)]+)\)',txt):
        tgt=urllib.parse.unquote(m.group(1)); anc=urllib.parse.unquote(m.group(2))
        if tgt.startswith('../'): continue
        base=os.path.basename(tgt)
        tot+=1
        if not os.path.exists(base):
            miss.append((f[:2],tgt,anc,'FILE')); continue
        t=open(base,encoding='utf-8').read()
        ids=set(re.findall(r'id="([^"]+)"',t))
        slugs=set(slug(h) for h in re.findall(r'^#+ (.*)$',t,re.M))
        if anc not in ids and anc not in slugs:
            miss.append((f[:2],base[:2],anc,'ANCHOR'))
print('liens inter/intra-chapitres avec ancre:',tot,'non resolus:',len(miss))
for x in miss: print(x)
