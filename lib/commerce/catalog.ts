// Pure helpers shared by the private publishing UI and its tests.
export function productSlug(name:string):string {
 return name.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}
export function publicationIssues(item:{
 slug:string;name:string;priceCents:number|null;vatBasisPoints:number|null;active?:boolean;
}):string[] {
 const problems:string[]=[];
 if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(item.slug)||item.slug.length>120)
  problems.push('Falta una URL de producto válida.');
 if(item.name.trim().length<3)problems.push('Falta el nombre.');
 if(item.priceCents===null||!Number.isSafeInteger(item.priceCents)||item.priceCents<=0)
  problems.push('Falta un PVP válido.');
 if(item.vatBasisPoints===null||!Number.isSafeInteger(item.vatBasisPoints)
   ||item.vatBasisPoints<0||item.vatBasisPoints>10000)
  problems.push('Falta configurar el IVA.');
 if(item.active===false)problems.push('La variante está desactivada.');
 return problems;
}
export function publicAvailability(status:string,stock:number):'HIDDEN'|'OUT_OF_STOCK'|'AVAILABLE'{
 if(status!=='active')return 'HIDDEN';
 return stock>0?'AVAILABLE':'OUT_OF_STOCK';
}
