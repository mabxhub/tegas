import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import pdf from 'pdf-parse/lib/pdf-parse.js';import {createLetterPdf} from '../letter-pdf.js';
const fonts={normal:readFileSync('src/fonts/DejaVuSans.ttf').toString('base64'),bold:readFileSync('src/fonts/DejaVuSans-Bold.ttf').toString('base64')};
const input={settings:{school:'SEKOLAH CONTOH',code:'DEMO',address:'Alamat sekolah rekaan',signatory:'Guru Besar'},student:{guardian:'PENJAGA REKAAN',address:'Alamat penjaga rekaan'},record:{id:1,studentName:'MURID REKAAN',className:'1 AMAN',date:'2026-10-06',location:'Kelas',detail:'PONTENG KELAS',notes:''},level:'Pertama'};
for(const [name,notes] of [['short','Kejadian contoh.'],['long','Keterangan kejadian yang telah disemak oleh guru. '.repeat(110)+' PENANDA AKHIR'],['unbroken','X'.repeat(5000)+' PENANDA AKHIR'],['newlines',('Baris tambahan\n').repeat(220)+' PENANDA AKHIR']]){
 test(`A4 PDF stays on one page and preserves ${name} content`,async()=>{
  const result=createLetterPdf({...input,record:{...input.record,notes}},fonts);const parsed=await pdf(Buffer.from(result.doc.output('arraybuffer')));
  assert.equal(parsed.numpages,1);assert.equal(result.doc.getNumberOfPages(),1);assert.ok(Math.abs(result.doc.internal.pageSize.getWidth()-595.28)<1);assert.ok(Math.abs(result.pageHeight-841.89)<1);assert.ok(result.contentBottom<=result.pageHeight-32+.1);assert.match(parsed.text,/Akuan penerimaan/);if(notes.includes('PENANDA AKHIR'))assert.match(parsed.text,/PENANDA AKHIR/);if(name==='long')assert.ok(result.fontSize<11);
 });
}
