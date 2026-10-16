const fs=require('fs'),path=require('path');
const [S,D]=process.argv.slice(2);
const m={ch03:'Specifications-fonctionnelles/03 – Parcours utilisateur.md',ch06:'Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md',ch07:'Specifications-fonctionnelles/07 – Registre des décisions de conception.md',ch08:'Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md',ch09:'Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md',ch10:'Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md',ch11:'Specifications-fonctionnelles/11 – API fonctionnelles.md',ch13:'Specifications-fonctionnelles/13 – Contrats d’écran.md'};
const txt=fs.readFileSync(path.join(S,'findings','X-exercice.md'),'utf8').split('\n');
for(const l of txt){const mm=l.match(/^\s*- `([^:`]+):(\d+)`[^«]*«\s?(.*)»/);if(!mm)continue;
let [_,f,n,q]=mm;n=+n;q=q.trim();
const p=f.startsWith('pr371')?path.join(S,'pr','pr371.diff'):path.join(D,m[f]||f);
const lines=fs.readFileSync(p,'utf8').split('\n');const line=lines[n-1]||'';
if(line.includes(q))console.log('ok',f,n);else{const hits=[];lines.forEach((x,i)=>{if(x.includes(q))hits.push(i+1)});console.log('FAIL',f,n,'found at',hits.slice(0,5).join(','),'|',q.slice(0,80));}}
