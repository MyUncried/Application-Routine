"""Mesure reproductible de la borne logique, sans construire le conteneur géant."""
import argparse,codecs,json,subprocess
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('contrats',type=Path);parser.add_argument('launch',type=Path);args=parser.parse_args()
def count(p):
 d=codecs.getincrementaldecoder('utf-8')();n=0
 with p.open('rb') as f:
  while b:=f.read(1048576):n+=len(d.decode(b).encode('utf-16-le'))//2
 n+=len(d.decode(b'',final=True).encode('utf-16-le'))//2
 return n
fields={k:count(p) for k,p in [('figma_launch',args.launch),('requirementRegistry',args.contrats/'requirement-registry.json'),('uiAtomicityContract',args.contrats/'ui-atomicity-contract.json')]}
limit=int(subprocess.check_output(['node','-p',"require('node:buffer').constants.MAX_STRING_LENGTH"],text=True));minimum=sum(fields.values())
print(json.dumps({'fields_utf16':fields,'minimum':minimum,'MAX_STRING_LENGTH':limit,'excess':minimum-limit,'status':'BLOCKED_BEFORE_REVIEW' if minimum>limit else 'BOUND_DOES_NOT_DEMONSTRATE_BLOCK'},indent=2))
