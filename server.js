const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = __dirname, file = path.join(root, 'data/store.json');
const seed = {players:[{id:'p1',name:'Астарион',balance:1250,purchases:[]},{id:'p2',name:'Лиора',balance:840,purchases:[]},{id:'p3',name:'Торин',balance:2100,purchases:[]}],skills:[
{id:'s1',name:'Кошачья грация',rarity:'silver',price:300,description:'Ваши шаги становятся бесшумными, а движения — невероятно ловкими.',icon:'✦',tag:'ЛОВКОСТЬ'},
{id:'s2',name:'Зоркий глаз',rarity:'silver',price:450,description:'Замечайте скрытые детали и опасности раньше остальных.',icon:'◎',tag:'ВОСПРИЯТИЕ'},
{id:'s3',name:'Железная воля',rarity:'silver',price:500,description:'Обретите стойкость перед лицом страха и сомнений.',icon:'♜',tag:'ЗАЩИТА'},
{id:'s4',name:'Пламя феникса',rarity:'gold',price:1200,description:'Призовите древний огонь, чтобы переломить ход битвы.',icon:'✺',tag:'МАГИЯ'},
{id:'s5',name:'Танец клинков',rarity:'gold',price:950,description:'Превратите каждую атаку в стремительный смертельный танец.',icon:'⚔',tag:'БОЙ'},
{id:'s6',name:'Шёпот дракона',rarity:'lapis',price:2500,description:'Прикоснитесь к могущественной силе древних драконов.',icon:'❖',tag:'ЛЕГЕНДА'}]};
fs.mkdirSync(path.dirname(file),{recursive:true}); if(!fs.existsSync(file)) fs.writeFileSync(file,JSON.stringify(seed,null,2));
const load=()=>JSON.parse(fs.readFileSync(file)); const save=d=>fs.writeFileSync(file,JSON.stringify(d,null,2));
const pin=process.env.ADMIN_PIN || '1234';
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
http.createServer(async(req,res)=>{const url=new URL(req.url,'http://localhost'); if(url.pathname.startsWith('/api/')){try{let body={}; if(req.method!=='GET'){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>100000)throw Error('Слишком большой запрос');}body=JSON.parse(raw||'{}');} const d=load();
if(req.method==='GET'&&url.pathname==='/api/data')return send(res,200,d);
if(req.method==='POST'&&url.pathname==='/api/purchase'){const p=d.players.find(x=>x.id===body.playerId),s=d.skills.find(x=>x.id===body.skillId);if(!p||!s)throw Error('Игрок или навык не найден');if(p.purchases.includes(s.id))throw Error('Этот навык уже куплен');if(p.balance<s.price)throw Error('Недостаточно очков');p.balance-=s.price;p.purchases.push(s.id);save(d);return send(res,200,d);}
if(req.method==='POST'&&url.pathname.startsWith('/api/admin/')){if(body.pin!==pin)return send(res,403,{error:'Неверный код администратора'});
if(url.pathname==='/api/admin/login')return send(res,200,{ok:true});
if(url.pathname==='/api/admin/player'){const name=String(body.name||'').trim();if(!name||name.length>40)throw Error('Введите имя игрока (до 40 символов)');d.players.push({id:crypto.randomUUID(),name,balance:0,purchases:[]});}
else if(url.pathname==='/api/admin/balance'){const p=d.players.find(x=>x.id===body.playerId),amount=Number(body.amount);if(!p||!Number.isSafeInteger(amount)||amount===0||p.balance+amount<0)throw Error('Проверьте сумму: баланс не может быть отрицательным');p.balance+=amount;}
else if(url.pathname==='/api/admin/skill'){const name=String(body.name||'').trim(),description=String(body.description||'').trim(),price=Number(body.price);if(!name||name.length>60||description.length>250||!['silver','gold','lapis'].includes(body.rarity)||!Number.isSafeInteger(price)||price<0)throw Error('Проверьте данные навыка');d.skills.push({id:crypto.randomUUID(),name,description,price,rarity:body.rarity,icon:'✧',tag:'НАВЫК'});}
else return send(res,404,{error:'Не найдено'});save(d);return send(res,200,d);}
return send(res,404,{error:'Не найдено'});
}catch(e){return send(res,400,{error:e.message||'Ошибка запроса'});}}
let pathname=url.pathname==='/'?'/index.html':url.pathname;const target=path.resolve(root,'public','.'+pathname);if(!target.startsWith(path.join(root,'public')+path.sep))return res.writeHead(403).end();fs.readFile(target,(err,data)=>{if(err)return res.writeHead(404).end('Not found');const ext=path.extname(target);res.writeHead(200,{'Content-Type':{'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png'}[ext]||'application/octet-stream'});res.end(data);});}).listen(process.env.PORT||3000,'0.0.0.0');
