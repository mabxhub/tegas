import ExcelJS from 'exceljs';
import {parse} from 'csv-parse/sync';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import {parseRows} from './student-rows.js';
export {parseRows} from './student-rows.js';
export async function parseFile(buffer,filename,parser=parseRows) {
 if(/\.pdf$/i.test(filename)) {
  const {text}=await pdf(buffer);
  if(!text.trim()) throw Error('PDF imbasan tidak disokong. Eksport Excel/CSV atau PDF dengan teks.');
  // Text tables with tab, pipe or multiple-space column separators.
  return parser(text.split(/\r?\n/).map(l=>l.split(/\t|\s*\|\s*| {2,}/)));
 }
 if(/\.csv$/i.test(filename)) return parser(parse(buffer.toString('utf8'),{bom:true,relax_column_count:true,skip_empty_lines:true}));
 if(!/\.xlsx$/i.test(filename)) throw Error('Gunakan Excel .xlsx, CSV atau PDF berteks. Fail .xls perlu disimpan sebagai .xlsx dahulu.');
 const book=new ExcelJS.Workbook();await book.xlsx.load(buffer);
 let lastError;
 for(const sheet of book.worksheets) {
  const rows=[];sheet.eachRow({includeEmpty:true},row=>rows.push(row.values.slice(1).map(v=>v&&typeof v==='object'?(v.text??v.result??v.richText?.map(t=>t.text).join('')??''):v??'')));
  try{return parser(rows);}catch(e){lastError=e;}
 }
 throw lastError||Error('Tiada helaian murid ditemui.');
}
