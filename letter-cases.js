export function validateLetterCases(records){
 if(!Array.isArray(records)||!records.length)throw Error('Pilih sekurang-kurangnya satu kesalahan.');
 const id=records[0].studentId;
 if(!id||records.some(c=>c.studentId!==id))throw Error('Satu surat hanya boleh mengandungi kesalahan murid yang sama.');
 if(records.some(c=>c.status!=='Bersalah'))throw Error('Hanya kes berstatus Bersalah boleh dimasukkan dalam surat.');
 if(new Set(records.map(c=>c.id)).size!==records.length)throw Error('Rekod kes berulang.');
 return [...records].sort((a,b)=>a.date.localeCompare(b.date)||a.id-b.id);
}
export function groupConfirmedCases(records){
 const groups=new Map();for(const c of records){if(c.status!=='Bersalah')continue;if(!groups.has(c.studentId))groups.set(c.studentId,[]);groups.get(c.studentId).push(c);}return [...groups.values()];
}
