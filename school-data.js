const numbers={SATU:'1',DUA:'2',TIGA:'3',EMPAT:'4',LIMA:'5',ENAM:'6',TUJUH:'7',LAPAN:'8',SEMBILAN:'9',SEPULUH:'10',SEBELAS:'11'};
export function normalizeClassName(value,year=''){
 let name=String(value||'').trim().replace(/\s+/g,' ').toUpperCase();
 const replacePrefix=text=>text.replace(/^(?:TAHUN|TINGKATAN|DARJAH)\s+/,'').replace(/^(SATU|DUA|TIGA|EMPAT|LIMA|ENAM|TUJUH|LAPAN|SEMBILAN|SEPULUH|SEBELAS)(?=\s|$)/,word=>numbers[word]);
 name=replacePrefix(name);
 if(name&&!/^\d+(?:\s|$)/.test(name)&&!/^PRA|^PPKI|^PERALIHAN/.test(name)){
  const match=replacePrefix(String(year||'').trim().toUpperCase()).match(/^(\d+)(?:\s|$)/);if(match)name=match[1]+' '+name;
 }
 return name;
}
export function normalizeStudent(s){return {...s,className:normalizeClassName(s.className,s.year)};}
export function applyStudentImport(existing,incoming,mode){
 if(!['sync','replace'].includes(mode))throw Error('Pilih sync atau ganti semua data murid.');
 if(!Array.isArray(incoming)||!incoming.length||incoming.length>10000)throw Error('Senarai murid tidak sah.');
 const fields=['id','name','identity','className','year','guardian','phone','address'];
 const clean=incoming.map(s=>{if(!s?.id||!s?.name)throw Error('ID dan nama murid diperlukan.');return normalizeStudent(Object.fromEntries(fields.map(k=>[k,String(s[k]||'').trim().slice(0,1000)])));});
 if(new Set(clean.map(s=>s.id)).size!==clean.length)throw Error('ID murid berulang. Semak fail import.');
 const old=new Map(existing.map(s=>[s.id,normalizeStudent(s)]));const added=clean.filter(s=>!old.has(s.id)).length,updated=clean.length-added;
 const result=mode==='replace'?new Map():new Map(old);clean.forEach(s=>result.set(s.id,s));
 return {students:[...result.values()],count:clean.length,added,updated,removed:mode==='replace'?existing.filter(s=>!result.has(s.id)).length:0};
}
export function preserveCaseStudents(cases,students){const old=new Map(students.map(s=>[s.id,s]));return cases.map(c=>({...c,student:c.student||old.get(c.studentId),className:normalizeClassName(c.className,c.student?.year||old.get(c.studentId)?.year)}));}
export function validateLogo(logo){
 if(!logo)return '';
 if(typeof logo!=='string'||logo.length>400000||!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(logo))throw Error('Logo tidak sah. Muat naik imej PNG, JPG atau WebP melalui tetapan.');
 return logo;
}
