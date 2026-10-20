const fs=require('node:fs');
const path=require('node:path');
const cats={};
for(const name of ['cream','ginger','tuxedo','siamese']){
 const text=fs.readFileSync(path.join(__dirname,'../assets/cat-source',`cat-${name}.svg`),'utf8');
 cats[name]=[...text.matchAll(/<rect x="(\d+)" y="(\d+)" width="1" height="1" fill="(#[a-fA-F0-9]+)"/g)].map(m=>({x:Number(m[1]),y:Number(m[2]),fill:m[3]}));
 if(!cats[name].length)throw Error('Ingen kattepiksler: '+name);
}
fs.writeFileSync(path.join(__dirname,'../assets/cats.json'),JSON.stringify(cats));
console.log('Fire originale pikselkatter er importert.');
