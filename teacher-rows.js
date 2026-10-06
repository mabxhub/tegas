const normalize=v=>String(v??'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
export const normalizeTeacherName=value=>String(value||'').normalize('NFC').trim().replace(/\s+/g,' ').toUpperCase().slice(0,150);
export function applyTeacherImport(existing,names,mode='sync'){
 if(!['sync','replace'].includes(mode)||!Array.isArray(names)||!names.length||names.length>1000)throw Error('Senarai guru tidak sah.');
 const normalized=names.map(normalizeTeacherName);if(normalized.some(n=>!n))throw Error('Nama guru diperlukan.');
 return [...new Set([...(mode==='sync'?existing:[]),...normalized])].sort((a,b)=>a.localeCompare(b));
}
export function parseTeacherRows(rows){
 const header=rows.findIndex(r=>r.some(v=>['NAMA','NAMAGURU','NAMAPENUH'].includes(normalize(v))));
 if(header<0)throw Error('Lajur NAMA GURU atau NAMA tidak ditemui.');
 const column=rows[header].findIndex(v=>['NAMA','NAMAGURU','NAMAPENUH'].includes(normalize(v)));const teachers=[],seen=new Set();let skipped=0;
 for(const row of rows.slice(header+1)){if(!row.some(v=>String(v??'').trim()))continue;const name=normalizeTeacherName(row[column]);if(!name||seen.has(name)){skipped++;continue;}seen.add(name);teachers.push(name);}
 if(!teachers.length)throw Error('Tiada nama guru yang sah ditemui.');return {teachers,skipped};
}
