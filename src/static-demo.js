import {applyTeacherImport,parseTeacherRows,normalizeTeacherName} from '../teacher-rows.js';
const demoPinHash=async(pin,code)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(code+':'+pin)))].map(x=>x.toString(16).padStart(2,'0')).join('');
import {applyStudentImport,normalizeStudent,preserveCaseStudents,validateLogo} from '../school-data.js';
import catalog from './catalog.json';
import {parseRows} from '../student-rows.js';
const KEY='tegas-pages-demo-v1';
const defaults=()=>({students:[],cases:[],teachers:[],onboarding:{completed:false,profileCompleted:false,driveConnected:false,demo:true},settings:{school:'SEKOLAH CONTOH — DEMO TEGAS',code:'DEMO',address:'Alamat sekolah rekaan',signatory:'Guru Besar (Demo)'}});
const read=()=>{const saved=localStorage.getItem(KEY);if(!saved)return defaults();try{const data=JSON.parse(saved);data.students=data.students.map(normalizeStudent);data.cases=preserveCaseStudents(data.cases,data.students);data.teachers??=[];data.onboarding??={completed:true,profileCompleted:true,driveConnected:false,demo:true};return data;}catch{throw Error('Data demo pelayar rosak. Padam storan laman ini untuk mula semula.');}};
const write=data=>{try{localStorage.setItem(KEY,JSON.stringify(data));}catch{throw Error('Storan pelayar penuh / tidak tersedia. Data tidak disimpan.');}};
const user={name:'Akses sekolah',email:''};
async function importFile(file,parser=parseRows){
 if(!file)throw Error('Pilih fail dahulu.');if(file.size>10*1024*1024)throw Error('Fail maksimum 10 MB.');
 if(/\.csv$/i.test(file.name)){const {parse}=await import('csv-parse/browser/esm/sync');return parser(parse(await file.text(),{bom:true,relax_column_count:true,skip_empty_lines:true}));}
 if(/\.xlsx$/i.test(file.name)){
  const {default:ExcelJS}=await import('exceljs/dist/exceljs.min.js');const book=new ExcelJS.Workbook();await book.xlsx.load(await file.arrayBuffer());let lastError;
  for(const sheet of book.worksheets){const rows=[];sheet.eachRow({includeEmpty:true},row=>rows.push(row.values.slice(1).map(v=>v&&typeof v==='object'?(v.text??v.result??v.richText?.map(t=>t.text).join('')??''):v??'')));try{return parser(rows);}catch(e){lastError=e;}}
  throw lastError||Error('Tiada helaian murid ditemui.');
 }
 if(/\.pdf$/i.test(file.name)){
  const pdfjs=await import('pdfjs-dist/build/pdf.mjs');const {default:worker}=await import('pdfjs-dist/build/pdf.worker.min.mjs?url');pdfjs.GlobalWorkerOptions.workerSrc=worker;
  const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false});const doc=await task.promise;
  const rows=[];
  try{for(let p=1;p<=doc.numPages;p++){const page=await doc.getPage(p);const text=await page.getTextContent();const lines=[];
   for(const item of text.items){if(!item.str?.trim())continue;const y=item.transform[5];let line=lines.find(l=>Math.abs(l.y-y)<3);if(!line){line={y,items:[]};lines.push(line);}line.items.push({x:item.transform[4],width:item.width||0,height:Math.abs(item.transform[3]),text:item.str});}
   lines.sort((a,b)=>b.y-a.y);for(const line of lines){const items=line.items.sort((a,b)=>a.x-b.x);let str='',end;for(const item of items){const gap=end===undefined?0:item.x-end;str+=(gap>Math.max(10,item.height)?'  ':gap>1?' ':'')+item.text;end=item.x+item.width;}rows.push(str.split(/\t|\s*\|\s*| {2,}/));}
  }return parser(rows);}finally{await task.destroy();}
 }
 throw Error('Gunakan Excel .xlsx, CSV atau PDF berteks.');
}
export async function demoApi(path,body,method){
 if(path==='auth'){const data=read();return {user:sessionStorage.getItem('tegas-demo-login')?user:null,demo:true,configured:false,accessConfigured:false,school:data.onboarding.schoolUrl?{code:data.settings.code,ready:data.onboarding.completed,name:data.settings.school,pinRequired:data.onboarding.completed&&!!data.onboarding.pinHash&&sessionStorage.getItem('tegas-demo-unlock')!==data.onboarding.pinHash,url:data.onboarding.schoolUrl}:null};}
 if(path==='auth/demo'){
  sessionStorage.setItem('tegas-demo-login','1');
  if(!localStorage.getItem(KEY)){
   const d=defaults();write(d);
  }return user;
 }
 if(path==='school/unlock')sessionStorage.setItem('tegas-demo-login','1');
 if(!sessionStorage.getItem('tegas-demo-login'))throw Error('Sila masuk ke ruang demo.');
 const data=read();
 if(path==='logout'){sessionStorage.removeItem('tegas-demo-login');sessionStorage.removeItem('tegas-demo-unlock');return {ok:true};}
 const routeCode=decodeURIComponent(window.location.hash.match(/^#\/sekolah\/([A-Za-z0-9]+)$/)?.[1]||'').toUpperCase();
 if(data.onboarding.completed&&data.onboarding.schoolUrl&&routeCode!==data.settings.code)throw Error('Masuk melalui URL sekolah '+data.onboarding.schoolUrl);
 if(data.onboarding.completed&&data.onboarding.pinHash&&sessionStorage.getItem('tegas-demo-unlock')!==data.onboarding.pinHash&&!['school/unlock','logout'].includes(path))throw Error('Masukkan kod akses sekolah dahulu.');
 if(path==='school/unlock'){const lock=data.onboarding.pinAttempts||{count:0,started:Date.now()};if(Date.now()-lock.started>15*60000){lock.count=0;lock.started=Date.now();}if(lock.count>=5)throw Error('Terlalu banyak cubaan. Cuba semula selepas 15 minit.');if(await demoPinHash(body.pin,data.settings.code)!==data.onboarding.pinHash){lock.count++;data.onboarding.pinAttempts=lock;write(data);throw Error('Kod akses sekolah tidak sah.');}delete data.onboarding.pinAttempts;write(data);sessionStorage.setItem('tegas-demo-unlock',data.onboarding.pinHash);return {ok:true};}
 if(path==='school/pin'&&method==='PUT'){if(!/^\d{4}$/.test(String(body.pin||'')))throw Error('Kod akses mesti 4 angka.');data.onboarding.pinHash=await demoPinHash(body.pin,data.settings.code);sessionStorage.removeItem('tegas-demo-unlock');write(data);return {ok:true};}
 if(path==='data')return {...data,catalog,role:'admin',schoolUrl:data.onboarding.schoolUrl||null};
 if(path==='onboarding/start'){data.onboarding={...data.onboarding,completed:false,profileCompleted:false,driveConnected:false,demo:true};write(data);return {ok:true};}
 if(path==='onboarding/profile'){const code=String(body.code||'').trim().toUpperCase();if(!/^[A-Z0-9]{4,20}$/.test(code)||!String(body.school||'').trim())throw Error('Masukkan kod dan nama sekolah yang sah.');if(!/^\d{4}$/.test(String(body.pin||'')))throw Error('Tetapkan kod akses 4 angka.');data.settings={...data.settings,school:body.school.trim(),code};data.onboarding.pinHash=await demoPinHash(body.pin,code);sessionStorage.removeItem('tegas-demo-unlock');data.onboarding.profileCompleted=true;write(data);return {code,school:data.settings.school};}
 if(path==='onboarding/provision'){if(!data.onboarding.profileCompleted)throw Error('Lengkapkan maklumat sekolah dahulu.');data.onboarding.driveConnected=true;data.onboarding.folderName=`tegas(${data.settings.code})`;write(data);return {driveConnected:true,demo:true,folderName:data.onboarding.folderName};}
 if(path==='onboarding/sample'){data.students=[1,2,3].map(i=>({id:`DEMO-00${i}`,name:`MURID REKAAN ${['SATU','DUA','TIGA'][i-1]}`,className:`${i} ${['AMAN','BESTARI','CERDAS'][i-1]}`,year:`TAHUN ${i}`,guardian:`PENJAGA REKAAN ${i}`,address:'Alamat contoh',identity:'',phone:''}));write(data);return {count:3};}
 if(path==='onboarding/complete'){if(!data.onboarding.driveConnected||!data.onboarding.profileCompleted||!data.students.length)throw Error('Lengkapkan setup dan import murid dahulu.');data.onboarding.completed=true;data.onboarding.schoolUrl=window.location.origin+window.location.pathname+'#/sekolah/'+encodeURIComponent(data.settings.code);write(data);return {schoolUrl:data.onboarding.schoolUrl,demo:true};}

 if(path==='demo/reset'){write(defaults());return {ok:true};}
 if(path==='teachers/preview')return importFile(body.get('file'),parseTeacherRows);
 if(path==='teachers'){if(method==='DELETE'){data.teachers=data.teachers.filter(n=>n!==normalizeTeacherName(body.name));}else{data.teachers=applyTeacherImport(data.teachers,body.names,body.mode);}write(data);return {teachers:data.teachers};}
 if(path==='import/preview')return importFile(body.get('file'));
 if(path==='import/sheets')throw Error('Dalam demo Pages, muat turun Google Sheets sebagai Excel/CSV kemudian upload.');
 if(path==='import/confirm'){
  const result=applyStudentImport(data.students,body.students,body.mode);data.cases=preserveCaseStudents(data.cases,data.students);data.students=result.students;write(data);const {students,...summary}=result;return summary;
 }
 if(path==='cases'){
  const s=data.students.find(s=>s.id===body.studentId),cat=catalog.find(c=>c.code===body.category);
  if(!data.teachers.includes(body.reporter))throw Error('Pilih nama pelapor daripada senarai guru.');if(!s||!cat?.details.includes(body.detail)||!body.date||!body.location?.trim())throw Error('Lengkapkan maklumat kes.');
  const c={...body,student:s,id:Math.max(0,...data.cases.map(c=>c.id))+1,studentName:s.name,className:s.className,categoryName:cat.name,reporter:body.reporter,createdAt:new Date().toISOString()};data.cases.unshift(c);write(data);return c;
 }
 if(path.startsWith('cases/')&&method==='PUT'){
  const c=data.cases.find(c=>c.id===Number(path.split('/')[1]));if(!c)throw Error('Rekod tidak ditemui.');if(!['Baharu dilaporkan','Dalam siasatan','Bersalah','Digugurkan'].includes(body.status))throw Error('Status tidak sah.');c.status=body.status;c.updatedAt=new Date().toISOString();write(data);return c;
 }
 if(path.startsWith('cases/')&&method==='DELETE'){
  const c=data.cases.find(c=>c.id===Number(path.split('/')[1]));if(!c)throw Error('Rekod tidak ditemui.');if(c.status!=='Digugurkan')throw Error('Hanya laporan berstatus Digugurkan boleh dipadam.');data.cases=data.cases.filter(item=>item.id!==c.id);write(data);return {ok:true};
 }
 if(path==='settings'&&method==='PUT'){if(data.onboarding.schoolUrl&&body.code!==data.settings.code)throw Error('Kod sekolah tidak boleh ditukar selepas setup.');if(!body.school?.trim())throw Error('Nama sekolah diperlukan.');data.settings={...body,logo:validateLogo(body.logo)};write(data);return data.settings;}
 throw Error('Operasi demo tidak disokong.');
}
