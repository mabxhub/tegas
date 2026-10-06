export async function prepareSchoolLogo(file){
 if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Pilih logo PNG, JPG atau WebP.');
 if(file.size>5*1024*1024)throw Error('Logo maksimum 5 MB.');
 const url=URL.createObjectURL(file);
 try{
  const image=new Image();image.src=url;await image.decode();
  const scale=Math.min(1,400/Math.max(image.naturalWidth,image.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
  const png=canvas.toDataURL('image/png');if(png.length<=400000)return png;
  // Flatten very detailed logos onto white when PNG would exceed storage limits.
  const ctx=canvas.getContext('2d');ctx.globalCompositeOperation='destination-over';ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
  const jpeg=canvas.toDataURL('image/jpeg',.85);if(jpeg.length>400000)throw Error('Logo terlalu kompleks. Gunakan imej yang lebih kecil.');return jpeg;
 }catch(e){throw Error(e.message||'Imej logo tidak dapat dibaca.');}finally{URL.revokeObjectURL(url);}
}
