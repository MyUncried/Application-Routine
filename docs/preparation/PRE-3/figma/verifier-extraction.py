"""Contrôles reproductibles du paquet PRE-3 ; aucune dépendance applicative."""
from pathlib import Path
import json,hashlib,struct,math,decimal
from json.encoder import _make_iterencode,encode_basestring

ROOT=Path(__file__).resolve().parent
def read(name):return json.loads((ROOT/name).read_text())
def js_float(x):
    if not math.isfinite(x):return 'null'
    if x==0:return '0'
    s=repr(x).lower()
    if 1e-6<=abs(x)<1e21:
        return format(decimal.Decimal(s),'f').rstrip('0').rstrip('.') if '.' in format(decimal.Decimal(s),'f') else format(decimal.Decimal(s),'f')
    if 'e' in s:
        mantissa,exponent=s.split('e');mantissa=mantissa.removesuffix('.0');e=int(exponent)
        return mantissa+'e'+('+' if e>=0 else '-')+str(abs(e))
    return s.removesuffix('.0')
def stringify(value):
    encoder=json.JSONEncoder(ensure_ascii=False,separators=(',',':'))
    iterator=_make_iterencode({},encoder.default,encode_basestring,None,js_float,':',',',False,False,True)
    return ''.join(iterator(value,0))
def fnv(value):
    encoded=stringify(value).encode('utf-16-le');h=2166136261
    for i in range(0,len(encoded),2):h=((h^(encoded[i]|encoded[i+1]<<8))*16777619)&0xffffffff
    return f'{h:08x}'
def walk(value):
    if isinstance(value,dict):
        yield value
        for v in value.values():yield from walk(v)
    elif isinstance(value,list):
        for v in value:yield from walk(v)

def validate(require_manifest=True):
    manifest=read('manifest.json');extras=read('complements-layout.json');control=read('controle-source.json')
    masters=read('masters.json');tokens=read('tokens.json');census=read('consommateurs.json')
    master_ids={m['id'] for m in masters['masters']};style_ids={s['id'] for s in tokens['styles']}
    variables={v['id']:v for v in tokens['variables']};collections={c['id']:c for c in tokens['collections']}
    extra={f['id']:{i:s for i,s in f['nodes']} for f in extras['frames']}
    index=[json.loads(line) for line in (ROOT/'index-elements.jsonl').read_text().splitlines()]
    identities=set();records={};frame_nodes={};counts={'frames':0,'nodes':0,'texts':0,'instances':0,'visibleSelonArbre':0,'hiddenSelonArbre':0,'captures':0}
    assert len(manifest['frames'])==41 and len({f['id'] for f in manifest['frames']})==41
    assert len(list((ROOT/'ecrans').glob('*.json')))==41
    source_checks={c['id']:c for c in control['checks']};source_hashes=[]
    refs=[]
    for frame in manifest['frames']:
        data=read(frame['json']);frame_nodes[frame['json']]=data['nodes'];nodes={n['id']:n for n in data['nodes']};fid=frame['id']
        assert len(nodes)==data['total']==frame['nodes']==len(extra[fid]),fid
        assert nodes[fid]['parent']=='510:101' and (nodes[fid]['width'],nodes[fid]['height'])==(402,874)
        ordered=[]
        def visit(i):
            assert i not in ordered,(fid,i,'cycle or duplicate');ordered.append(i)
            for child in nodes[i].get('children',[]):
                assert child in nodes and nodes[child]['parent']==i,(fid,i,child)
                visit(child)
        visit(fid);assert ordered==[n['id'] for n in data['nodes']],fid
        rows=[]
        for n in data['nodes']:
            merged={**n,**extras['schemas'][extra[fid][n['id']]]}
            rows.append([n['id'],n['type'],n['name'],n['parent'],n.get('children'),[[1,merged[k]] if k in merged else [0] for k in control['fields']]])
            identity=fid+'/'+n['id'];identities.add(identity);records[identity]=(frame,n,merged)
            a=n;visible=True
            while a:
                visible=visible and a.get('visible',True);a=nodes.get(a.get('parent'))
            counts['visibleSelonArbre']+=visible;counts['hiddenSelonArbre']+=not visible
            counts['texts']+=n['type']=='TEXT';counts['instances']+=n['type']=='INSTANCE'
            if n['type']=='INSTANCE':assert n.get('master') and n['master']['id'] in master_ids,(fid,n['id'])
        expected=fnv(rows);actual=source_checks[fid]['hash'];assert expected==actual,(fid,expected,actual)
        source_hashes.append({'id':fid,'total':data['total'],'hash':actual,'expected':expected,'match':True})
        png=(ROOT/frame['capture']).read_bytes();assert png[:8]==b'\x89PNG\r\n\x1a\n'
        assert struct.unpack('>II',png[16:24])==(402,874)
        counts['frames']+=1;counts['nodes']+=len(nodes);counts['captures']+=1
        assert not data['errors'];refs.append(data)
    assert len(index)==len(identities)==counts['nodes']
    for item in index:
        frame,n,merged=records[item['recordId']]
        assert item['frame']==frame['id'] and item['node']==n['id'] and item['name']==n['name']
        assert item['properties'].startswith(frame['json']+'#/nodes/')
        position=int(item['properties'].rsplit('/',1)[1]);assert frame_nodes[frame['json']][position]['id']==n['id']
        assert item['layoutSchema']==extra[frame['id']][n['id']]
    assert {x['recordId'] for x in index}==identities
    for owner in [*refs,masters,tokens]:
        for obj in walk(owner):
            if obj.get('type')=='VARIABLE_ALIAS':assert obj['id'] in variables,obj['id']
            for key in ['fillStyleId','strokeStyleId','effectStyleId','textStyleId']:
                value=obj.get(key)
                if isinstance(value,str) and value and value!='MIXED':assert value in style_ids,value
    def aliases(vid,stack=()):
        assert vid not in stack,('alias cycle',stack,vid)
        for obj in walk(variables[vid]['valuesByMode']):
            if obj.get('type')=='VARIABLE_ALIAS':aliases(obj['id'],(*stack,vid))
    for vid,v in variables.items():
        aliases(vid);assert v['variableCollectionId'] in collections
        assert set(v['valuesByMode'])<={m['modeId'] for m in collections[v['variableCollectionId']]['modes']}
    assert len(census['pages'])==11 and all(not p['errors'] for p in census['pages'])
    scoped={(u['id'],u['master']) for p in census['pages'] for u in p['uses'] if u['insidePre3']}
    extracted={(n['id'],n['master']['id']) for _,n,_ in records.values() if n['type']=='INSTANCE'}
    assert scoped==extracted
    assert not masters['errors'] and not tokens['errors'] and not extras['errors']
    for key,value in counts.items():assert manifest['counts'][key]==value,(key,value,manifest['counts'][key])
    if require_manifest:
        for f in manifest['files']:
            raw=(ROOT/f['path']).read_bytes();assert len(raw)==f['bytes'] and hashlib.sha256(raw).hexdigest()==f['sha256'],f['path']
    return {'status':'PASS','counts':counts,'sourceChecks':source_hashes,'masters':len(master_ids),'styles':len(style_ids),'variables':len(variables),'pages':len(census['pages'])}

if __name__=='__main__':print(json.dumps(validate(),ensure_ascii=False))
