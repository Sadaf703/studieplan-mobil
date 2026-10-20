const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../web-preview');
if(!fs.existsSync(path.join(root,'index.html'))){console.error('Bygg først: npx expo export --platform web --output-dir web-preview');process.exit(1);}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.ttf':'font/ttf'};
http.createServer((req,res)=>{
 try{
  const name=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(err?'Not found':data);});
 }catch{res.writeHead(400);res.end('Bad request');}
}).listen(8768,'127.0.0.1',()=>console.log('StudiePlan Mobil – nettleserforhåndsvisning: http://127.0.0.1:8768'));
