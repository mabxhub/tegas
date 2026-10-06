import regularUrl from './fonts/DejaVuSans.ttf?url';
import boldUrl from './fonts/DejaVuSans-Bold.ttf?url';
import {createLetterPdf} from '../letter-pdf.js';
let fontPromise;
async function fontBase64(url){const r=await fetch(url);if(!r.ok)throw Error('Fon surat gagal dimuatkan. Cuba semula.');const bytes=new Uint8Array(await r.arrayBuffer());let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(text);}
export async function downloadLetter(input){
 fontPromise??=Promise.all([fontBase64(regularUrl),fontBase64(boldUrl)]).catch(e=>{fontPromise=undefined;throw e;});
 const [normal,bold]=await fontPromise;
 const result=createLetterPdf(input,{normal,bold});
 result.doc.save(`TEGAS-Surat-Amaran-${input.level}-${String(input.record.id).padStart(4,'0')}.pdf`);
 return result;
}
