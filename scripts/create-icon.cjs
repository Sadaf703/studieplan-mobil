// Rasterize our own pixel grid as a PNG app icon, with no external artwork.
const fs=require('node:fs');
const zlib=require('node:zlib');
const path=require('node:path');
const cats=require('../assets/cats.json');
const size=1024;
function crc32(data){let c=0xffffffff;for(const v of data){c^=v;for(let b=0;b<8;b++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function chunk(type,data){const name=Buffer.from(type),header=Buffer.alloc(4),crc=Buffer.alloc(4);header.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([name,data])));return Buffer.concat([header,name,data,crc]);}
function write(filename,scale,transparent){
 const pixels=Buffer.alloc(size*size*4);
 for(let i=0;i<size*size;i++){pixels[i*4]=255;pixels[i*4+1]=224;pixels[i*4+2]=242;pixels[i*4+3]=transparent?0:255;}
 const offset=(size-24*scale)/2;
 for(const rect of cats.cream){const rgb=[1,3,5].map(i=>parseInt(rect.fill.slice(i,i+2),16));for(let y=offset+rect.y*scale;y<offset+(rect.y+1)*scale;y++)for(let x=offset+rect.x*scale;x<offset+(rect.x+1)*scale;x++){const index=(y*size+x)*4;pixels[index]=rgb[0];pixels[index+1]=rgb[1];pixels[index+2]=rgb[2];pixels[index+3]=255;}}
 const scan=Buffer.alloc((size*4+1)*size);for(let y=0;y<size;y++)pixels.copy(scan,y*(size*4+1)+1,y*size*4,(y+1)*size*4);
 const header=Buffer.alloc(13);header.writeUInt32BE(size,0);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
 fs.writeFileSync(path.join(__dirname,'../assets',filename),Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(scan)),chunk('IEND',Buffer.alloc(0))]));
}
write('icon.png',32,false);write('cat-adaptive.png',22,true);
console.log('StudiePlan-katteikonene er klare.');
