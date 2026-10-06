import express from 'express';
import session from 'express-session';
import multer from 'multer';
import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {parseFile} from './imports.js';
const app=express();const port=Number(process.env.PORT||3000);const base=process.env.APP_URL||`http://localhost:${port}`;
const demo=process.env.DEMO_MODE==='true' && process.env.NODE_ENV!=='production';
mkdirSync(process.env.DATA_DIR||'data',{recursive:true});const db=new DatabaseSync(`${process.env.DATA_DIR||'data'}/tegas.sqlite`);
db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS students (id TEXT PRIMARY KEY, payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS cases (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id=1), payload TEXT NOT NULL);');
const catalog=JSON.parse(readFileSync('src/catalog.json','utf8'));
if(process.env.NODE_ENV==='production'&&!process.env.SESSION_SECRET) throw Error('SESSION_SECRET diperlukan dalam production.');
app.set('trust proxy',1);app.use(express.json({limit:'2mb'}));app.use(session({secret:process.env.SESSION_SECRET||randomBytes(32).toString('hex'),resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:'lax',secure:base.startsWith('https:'),maxAge:8*3600*1000}}));
app.get('/api/auth', (req,res)=>res.json({user:req.session.user||null,demo,configured:!!(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET),accessConfigured:!!process.env.ALLOWED_EMAILS}));
app.post('/api/auth/demo',(req,res)=>{if(!demo)return res.sendStatus(403);req.session.user={name:'Guru Demo',email:'demo@example.test'};res.json(req.session.user);});
app.get('/auth/google',(req,res)=>{
 if(!process.env.GOOGLE_CLIENT_ID||!process.env.GOOGLE_CLIENT_SECRET||!process.env.ALLOWED_EMAILS)return res.status(503).send('Sediakan Google OAuth dan ALLOWED_EMAILS dahulu.');
 const state=randomBytes(32).toString('hex');req.session.state=state;
 res.redirect('https://accounts.google.com/o/oauth2/v2/auth?'+new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID,redirect_uri:base+'/auth/google/callback',response_type:'code',scope:'openid email profile',state}));
});
app.get('/auth/google/callback',async(req,res,next)=>{try{
 const state=req.session.state;delete req.session.state;
 if(!state||state!==req.query.state||typeof req.query.code!=='string')return res.status(400).send('Pengesahan log masuk tidak sah. Cuba semula.');
 const tokenRes=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({code:req.query.code,client_id:process.env.GOOGLE_CLIENT_ID,client_secret:process.env.GOOGLE_CLIENT_SECRET,redirect_uri:base+'/auth/google/callback',grant_type:'authorization_code'}),signal:AbortSignal.timeout(15000)});
 const token=await tokenRes.json();if(!tokenRes.ok||!token.access_token)throw Error('Pengesahan Google gagal.');
 const infoRes=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:`Bearer ${token.access_token}`},signal:AbortSignal.timeout(15000)});const user=await infoRes.json();
 const allowed=(process.env.ALLOWED_EMAILS||'').toLowerCase().split(',').map(x=>x.trim());
 if(!infoRes.ok||!user.email_verified||!allowed.includes(String(user.email).toLowerCase()))return res.status(403).send('Email ini belum diberi akses oleh pentadbir sekolah.');
 req.session.regenerate(err=>{if(err)return next(err);req.session.user={name:user.name,email:user.email};req.session.save(err=>err?next(err):res.redirect('/'));});
 }catch(e){next(e);}});
app.use('/api',(req,res,next)=>{if(!req.session.user)return res.status(401).json({error:'Sila log masuk.'});if(req.method!=='GET'&&req.headers.origin&&req.headers.origin!==base)return res.status(403).json({error:'Asal permintaan tidak sah.'});next();});
app.post('/api/logout',(req,res)=>req.session.destroy(()=>res.json({ok:true})));
const settings=()=>JSON.parse(db.prepare('SELECT payload FROM settings WHERE id=1').get()?.payload||'{"school":"SEKOLAH KEBANGSAAN PAYA REDAN","code":"JBA5054","address":"","signatory":"Guru Besar"}');
const students=()=>db.prepare('SELECT payload FROM students').all().map(x=>JSON.parse(x.payload));
const cases=()=>db.prepare('SELECT id,payload FROM cases ORDER BY id DESC').all().map(x=>({...JSON.parse(x.payload),id:x.id}));
app.get('/api/data',(req,res)=>res.json({students:students(),cases:cases(),settings:settings(),catalog}));
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:10*1024*1024,files:1}});
app.post('/api/import/preview',upload.single('file'),async(req,res,next)=>{try{if(!req.file)throw Error('Pilih fail dahulu.');res.json(await parseFile(req.file.buffer,req.file.originalname));}catch(e){next(e);}});
app.post('/api/import/sheets',async(req,res,next)=>{try{
 const u=new URL(req.body.url);if(u.protocol!=='https:'||u.hostname!=='docs.google.com')throw Error('Gunakan pautan Google Sheets yang sah.');
 const m=u.pathname.match(/^\/spreadsheets\/d\/([a-zA-Z0-9_-]+)(?:\/|$)/);if(!m)throw Error('Pautan Google Sheets tidak sah.');
 const gid=u.searchParams.get('gid')||u.hash.match(/gid=(\d+)/)?.[1]||'0';if(!/^\d+$/.test(gid))throw Error('ID helaian tidak sah.');
 const response=await fetch(`https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=${gid}`,{signal:AbortSignal.timeout(15000)});
 if(!response.ok||response.headers.get('content-type')?.includes('text/html'))throw Error('Helaian tidak dapat dibaca. Muat turun Excel/CSV dari Sheets untuk helaian peribadi.');
 const buf=Buffer.from(await response.arrayBuffer());if(buf.length>10*1024*1024)throw Error('Fail melebihi 10 MB.');res.json(await parseFile(buf,'sheet.csv'));
 }catch(e){next(e);}});
app.post('/api/import/confirm',(req,res,next)=>{try{
 const rows=req.body.students;if(!Array.isArray(rows)||!rows.length||rows.length>10000)throw Error('Senarai murid tidak sah.');
 const fields=['id','name','identity','className','year','guardian','phone','address'];
 const clean=rows.map(s=>{if(!s.id||!s.name)throw Error('ID dan nama diperlukan.');return Object.fromEntries(fields.map(k=>[k,String(s[k]||'').slice(0,1000)]));});
 db.exec('BEGIN');try{const put=db.prepare('INSERT INTO students VALUES (?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload');for(const s of clean)put.run(s.id,JSON.stringify(s));db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}res.json({count:clean.length});
 }catch(e){next(e);}});
app.post('/api/cases',(req,res,next)=>{try{
 const b=req.body;const student=students().find(s=>s.id===b.studentId);const cat=catalog.find(c=>c.code===b.category);
 if(!student||!cat?.details.includes(b.detail)||!/^\d{4}-\d{2}-\d{2}$/.test(b.date)||!['Baharu dilaporkan','Dalam siasatan','Bersalah','Digugurkan'].includes(b.status)||!String(b.location||'').trim())throw Error('Lengkapkan maklumat kes yang sah.');
 const c={studentId:student.id,studentName:student.name,className:student.className,category:cat.code,categoryName:cat.name,detail:b.detail,date:b.date,location:String(b.location).slice(0,300),notes:String(b.notes||'').slice(0,5000),status:b.status,reporter:req.session.user.email,createdAt:new Date().toISOString()};
 const result=db.prepare('INSERT INTO cases(payload) VALUES (?)').run(JSON.stringify(c));res.json({...c,id:Number(result.lastInsertRowid)});
 }catch(e){next(e);}});
app.put('/api/cases/:id',(req,res)=>{
 const row=db.prepare('SELECT payload FROM cases WHERE id=?').get(req.params.id);if(!row)return res.status(404).json({error:'Rekod tidak ditemui.'});
 if(!['Baharu dilaporkan','Dalam siasatan','Bersalah','Digugurkan'].includes(req.body.status))return res.status(400).json({error:'Status tidak sah.'});
 const c={...JSON.parse(row.payload),status:req.body.status,updatedBy:req.session.user.email,updatedAt:new Date().toISOString()};db.prepare('UPDATE cases SET payload=? WHERE id=?').run(JSON.stringify(c),req.params.id);res.json({...c,id:Number(req.params.id)});
});
app.put('/api/settings',(req,res)=>{const s=Object.fromEntries(['school','code','address','signatory'].map(k=>[k,String(req.body[k]||'').slice(0,1000)]));if(!s.school)return res.status(400).json({error:'Nama sekolah diperlukan.'});db.prepare('INSERT INTO settings VALUES(1,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload').run(JSON.stringify(s));res.json(s);});
app.use('/api',(err,req,res,next)=>res.status(400).json({error:err.code==='LIMIT_FILE_SIZE'?'Fail maksimum 10 MB.':err.message||'Permintaan gagal.'}));
if(process.env.NODE_ENV==='production')app.use(express.static('dist'));
else {const {createServer}=await import('vite');const vite=await createServer({server:{middlewareMode:true},appType:'spa'});app.use(vite.middlewares);}
app.listen(port,'0.0.0.0',()=>console.log(`TEGAS berjalan pada port ${port}. Demo: ${demo}`));
