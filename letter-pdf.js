import {jsPDF} from 'jspdf';
// A single vector-text A4 page. Measure every line before drawing; never truncate.
export function createLetterPdf({settings:s,student:m,record:c,level},fonts){
 const doc=new jsPDF({unit:'pt',format:'a4',orientation:'portrait',compress:true});
 for(const [style,font] of Object.entries(fonts)){doc.addFileToVFS(`tegas-${style}.ttf`,font);doc.addFont(`tegas-${style}.ttf`,'Tegas',style);}
 const pageWidth=doc.internal.pageSize.getWidth(),pageHeight=doc.internal.pageSize.getHeight();
 const margin=32,width=pageWidth-2*margin,height=pageHeight-2*margin;
 const date=new Date().toLocaleDateString('ms-MY',{timeZone:'Asia/Kuala_Lumpur'});
 const year=new Intl.DateTimeFormat('en',{year:'numeric',timeZone:'Asia/Kuala_Lumpur'}).format(new Date());
 const blocks=[
  ...(s.logo?[{logo:true}]:[]),
  {text:s.school,bold:true,factor:1.25,align:s.logo?'center':undefined},
  {text:[s.address,`Kod sekolah: ${s.code}`].filter(Boolean).join('\n'),factor:.85,rule:true,align:s.logo?'center':undefined},
  {text:`Ruj. Kami: ${s.code}/DISIPLIN/${year}/${String(c.id).padStart(4,'0')}\nTarikh: ${date}`,factor:.85,align:'right'},
  {text:`Kepada:\n${m?.guardian||'Ibu bapa / Penjaga'}\n${m?.address||'Alamat penjaga: ____________________'}`},
  {text:'Tuan / Puan,'},
  {text:`SURAT AMARAN ${level.toUpperCase()} — SALAH LAKU DISIPLIN`,bold:true},
  {text:'Dengan segala hormatnya perkara di atas dirujuk.'},
  {text:'2. Dimaklumkan bahawa murid berikut telah direkodkan melakukan salah laku disiplin:'},
  {text:`Nama murid: ${c.studentName}\nKelas: ${c.className}\nTarikh kejadian: ${c.date}\nTempat: ${c.location}\nKesalahan: ${c.detail}`},
  ...(c.notes?[{text:`Keterangan: ${c.notes}`}]:[]),
  {text:`3. Pihak sekolah memberikan amaran ${level.toLowerCase()} dan memohon kerjasama tuan / puan untuk membimbing anak jagaan agar mematuhi peraturan sekolah. Sila hubungi pihak sekolah untuk perbincangan dan tindakan susulan.`},
  {text:'Sekian, terima kasih.'},
  {text:'“MALAYSIA MADANI”\n“BERKHIDMAT UNTUK NEGARA”'},
  {text:'Saya yang menjalankan amanah,',signature:true},
  {text:`____________________________\n${s.signatory||'Guru Besar'}\n${s.school}`},
  {text:'Akuan penerimaan ibu bapa / penjaga',bold:true,ruleBefore:true},
  {text:'Tandatangan: ____________________     Tarikh: ______________',factor:.9}
 ];
 const layout=sizeValue=>{
  const size=sizeValue;
  let total=0;
  const items=blocks.map(b=>{
   if(b.logo){const size=Math.min(48,Math.max(18,4*sizeValue));const item={...b,imageSize:size,gap:sizeValue*.6};total+=size+item.gap;return item;}
   const fontSize=size*(b.factor||1);doc.setFont('Tegas',b.bold?'bold':'normal');doc.setFontSize(fontSize);
   const lines=doc.splitTextToSize(String(b.text||''),width),leading=fontSize*1.3;
   const gap=size*(b.signature?1.5:.6)+(b.rule||b.ruleBefore?size*.4:0);
   const item={...b,fontSize,lines,leading,gap};total+=lines.length*leading+gap;return item;
  });return {items,total};
 };
 let size=11,plan=layout(size);
 if(plan.total>height){let low=.1,high=11;for(let i=0;i<24;i++){const mid=(low+high)/2;if(layout(mid).total<=height-1)low=mid;else high=mid;}size=low;plan=layout(size);}
 // Expand paragraph spacing when there is room, while reserving the complete footer.
 const extra=Math.min(size*.55,Math.max(0,(height-plan.total)/(plan.items.length-1)));
 let y=margin;
 for(const [i,b] of plan.items.entries()){
  if(b.logo){const properties=doc.getImageProperties(s.logo);const factor=Math.min(b.imageSize/properties.width,b.imageSize/properties.height);const w=properties.width*factor,h=properties.height*factor;doc.addImage(s.logo,properties.fileType,(pageWidth-w)/2,y,w,h,undefined,'FAST');y+=b.imageSize+b.gap+(i<plan.items.length-1?extra:0);continue;}
  if(b.ruleBefore){doc.setDrawColor(160);doc.setLineWidth(.4);doc.line(margin,y,pageWidth-margin,y);y+=size*.2;}
  doc.setFont('Tegas',b.bold?'bold':'normal');doc.setFontSize(b.fontSize);doc.setTextColor(25);
  doc.text(b.lines,b.align==='right'?pageWidth-margin:b.align==='center'?pageWidth/2:margin,y+b.fontSize,{align:b.align||'left',lineHeightFactor:1.3});
  y+=b.lines.length*b.leading;
  if(b.rule){doc.setDrawColor(60);doc.setLineWidth(.7);doc.line(margin,y,pageWidth-margin,y);}
  y+=b.gap-(b.ruleBefore?size*.2:0)+(i<plan.items.length-1?extra:0);
 }
 if(y>pageHeight-margin+.1||doc.getNumberOfPages()!==1)throw Error('Surat tidak dapat disusun pada satu halaman.');
 doc.setProperties({title:`Surat Amaran ${level} — ${c.studentName}`,subject:'Surat amaran disiplin sekolah',creator:'TEGAS'});
 return {doc,fontSize:size,pages:1,contentBottom:y,pageHeight};
}
