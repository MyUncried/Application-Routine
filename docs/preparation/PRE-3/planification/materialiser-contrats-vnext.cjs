'use strict';
const fs=require('node:fs');const path=require('node:path');const zlib=require('node:zlib');const crypto=require('node:crypto');const {Readable,Transform}=require('node:stream');const {pipeline}=require('node:stream/promises');
async function main(){
 const dest=process.argv[2];if(!dest||!path.isAbsolute(dest))throw Error('Destination absolue obligatoire');
 const root=path.resolve(__dirname,'../../../..');const out=path.resolve(dest);if(out===root||out.startsWith(root+path.sep))throw Error('Destination hors checkout obligatoire');
 const folder=path.join(__dirname,'contrats');const manifest=JSON.parse(fs.readFileSync(path.join(folder,'manifest.json'),'utf8'));fs.mkdirSync(out,{recursive:true});
 for(const entry of manifest.entries){
  const file=path.join(out,entry.name+'.json');if(fs.existsSync(file))throw Error('Fichier existant : '+file);
  const temp=file+'.partial';let bytes=0;const hash=crypto.createHash('sha256');
  async function* parts(){for(const p of entry.parts){if(path.basename(p.file)!==p.file)throw Error('Chemin invalide');const b=fs.readFileSync(path.join(folder,p.file));if(crypto.createHash('sha256').update(b).digest('hex')!==p.sha256)throw Error('Partie altérée : '+p.file);yield Buffer.from(b.toString('ascii'),'base64');}}
  const check=new Transform({transform(b,e,cb){bytes+=b.length;hash.update(b);cb(null,b);}});
  try{await pipeline(Readable.from(parts()),zlib.createGunzip(),check,fs.createWriteStream(temp,{flags:'wx'}));if(bytes!==entry.byte_length||hash.digest('hex')!==entry.sha256)throw Error('Objet altéré : '+entry.name);fs.renameSync(temp,file);}catch(e){fs.rmSync(temp,{force:true});throw e;}
  console.log(entry.name+' SHA256/longueur PASS');
 }
 console.log('Restitution exacte terminée. Statut : '+manifest.status+'. Aucun lancement de revue.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
