import {normalizeClassName} from './school-data.js';
const norm = v => String(v ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
export function parseRows(rows) {
 const header = rows.findIndex(r => r.some(v=>['NAMA','NAMAMURID','NAMAPELAJAR'].includes(norm(v))) && r.some(v=>['IDMURID','NOPENGENALAN','NOKP'].includes(norm(v))));
 if(header<0) throw Error('Tajuk lajur tidak ditemui. Gunakan NAMA dan ID MURID atau NO. PENGENALAN.');
 const h=rows[header].map(norm);
 const get=(r,...keys)=>{const i=h.findIndex(v=>keys.includes(v));return i<0?'':String(r[i]??'').trim();};
 const seen=new Set(); const students=[];let skipped=0;
 for(const r of rows.slice(header+1)) {
  if(!r.some(v=>String(v??'').trim())) continue;
  const name=get(r,'NAMA','NAMAMURID','NAMAPELAJAR');const identity=get(r,'NOPENGENALAN','NOKP');const id=get(r,'IDMURID')||identity;
  if(!name||!id||seen.has(id)){skipped++;continue;}seen.add(id);
  students.push({id,name,identity,className:normalizeClassName(get(r,'NAMAKELAS','KELAS'),get(r,'TAHUNTINGKATAN','TAHUN')),year:get(r,'TAHUNTINGKATAN','TAHUN'),guardian:get(r,'PENJAGA1','NAMAPENJAGA'),phone:get(r,'NOTELBIMBITPENJAGA1','TELEFON'),address:['ALAMAT1','ALAMAT2','ALAMAT3','POSKOD','BANDAR','NEGERI'].map(k=>get(r,k)).filter(Boolean).join(', ')});
 }
 if(!students.length) throw Error('Tiada baris murid yang sah ditemui.');
 return {students,skipped};
}
