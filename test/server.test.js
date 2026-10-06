import {test} from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
test('authenticated API persists imports, validates cases and supports reviewed status changes',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'tegas-test-'));const port=3123;
 const server=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port),DATA_DIR:dir,DEMO_MODE:'true',NODE_ENV:'development',STORAGE_MODE:'local'},stdio:'pipe'});
 try {
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server startup timeout')),15000);server.stdout.on('data',b=>{if(b.toString().includes('TEGAS berjalan')){clearTimeout(timer);resolve();}});server.once('exit',code=>{clearTimeout(timer);reject(Error('Server exited: '+code));});});
  let cookie='';async function request(path,body,method=body?'POST':'GET'){const r=await fetch(`http://localhost:${port}/api/${path}`,{method,headers:{'Content-Type':'application/json',Cookie:cookie},body:body?JSON.stringify(body):undefined});cookie=r.headers.get('set-cookie')?.split(';')[0]||cookie;return {status:r.status,data:await r.json()};}
  assert.equal((await request('data')).status,401);assert.equal((await request('auth/demo',{})).status,200);
  const students=[{id:'TEST-01',name:'MURID REKAAN',className:'1 AMAN'}];
  assert.equal((await request('import/confirm',{students,mode:'sync'})).status,200);assert.equal((await request('import/confirm',{students,mode:'sync'})).status,200);
  await request('teachers',{names:['GURU REKAAN'],mode:'sync'});
  const c=await request('cases',{studentId:'TEST-01',category:'E',detail:'PONTENG KELAS',date:'2026-10-06',location:'Kelas',status:'Dalam siasatan',reporter:'GURU REKAAN'});assert.equal(c.status,200);
  assert.equal((await request('cases',{studentId:'MISSING'})).status,400);
  assert.equal((await request(`cases/${c.data.id}`,{status:'Bersalah'},'PUT')).data.status,'Bersalah');
  assert.equal((await request(`cases/${c.data.id}`,{status:'INVALID'},'PUT')).status,400);
  const d=(await request('data')).data;assert.equal(d.students.length,1);assert.equal(d.cases.length,1);assert.equal(d.cases[0].status,'Bersalah');
  assert.equal((await request('import/confirm',{students})).status,400);
  const replacement=[{id:'TEST-02',name:'MURID BARU',className:'TAHUN SATU BIJAK'}];
  assert.equal((await request('import/confirm',{students:replacement,mode:'replace'})).data.removed,1);
  const replaced=(await request('data')).data;assert.equal(replaced.students.length,1);assert.equal(replaced.students[0].className,'1 BIJAK');assert.equal(replaced.cases.length,1);assert.equal(replaced.cases[0].student.name,'MURID REKAAN');
  assert.equal((await request('settings',{school:'SEKOLAH CONTOH',logo:'data:image/svg+xml;base64,AAAA'},'PUT')).status,400);
  await request('logout',{});assert.equal((await request('data')).status,401);
 }finally {server.kill('SIGTERM');await new Promise(resolve=>server.once('exit',resolve));rmSync(dir,{recursive:true,force:true});}
});
