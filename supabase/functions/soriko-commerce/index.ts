// Soriko Commerce: secure same-project retail API. No live checkout/payment endpoints.
const BASE = Deno.env.get('SUPABASE_URL')!;
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ORIGINS = new Set([
  'https://soriko.alfonso-millan.workers.dev',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
]);
type Row = Record<string, unknown>;
type StaffRole = 'admin'|'manager'|'operator'|'viewer';
const isUuid = (s:unknown):s is string => typeof s==='string' &&
 /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const allowedRole=(s:unknown):s is StaffRole=>s==='admin'||s==='manager'||s==='operator'||s==='viewer';

class HttpError extends Error { constructor(public status:number, public code:string) { super(code); } }
async function db<T=Row[]>(path:string,method:'GET'|'POST'='GET',body?:unknown):Promise<T> {
 const response=await fetch(BASE+'/rest/v1/'+path,{
  method,
  headers:{
   apikey:SERVICE,Authorization:'Bearer '+SERVICE,'Content-Type':'application/json',
   Prefer:method==='POST'?'return=representation':'return=minimal'
  },
  body:body===undefined?undefined:JSON.stringify(body),
  signal:AbortSignal.timeout(12000),
  cache:'no-store'
 });
 if(!response.ok) {
  const error=await response.json().catch(()=>({}));
  const code=typeof error.code==='string'?error.code:'DATABASE_ERROR';
  if(code==='23505') throw new HttpError(409,'DUPLICATE_REFERENCE');
  if(code==='23514'||code==='22P02') throw new HttpError(400,'INVALID_INPUT');
  if(code==='P0001') throw new HttpError(409,'OPERATION_REJECTED');
  throw new HttpError(500,'DATABASE_REQUEST_FAILED');
 }
 return response.json() as Promise<T>;
}
async function rpc<T=Row>(name:string,payload:unknown):Promise<T> {
 return db<T>('rpc/'+name,'POST',payload);
}
async function catalogue(privateView=false) {
 const products=await db<Row[]>('commerce_products?select=id,slug,name,description,category,set_name,image_url,status&'+
  (privateView?'order=created_at.desc':'status=eq.active&order=created_at.desc')+'&limit=200');
 const variants=await db<Row[]>('commerce_variants?select=id,product_id,sku,language,edition,sealed,price_cents,vat_basis_points,active'+
  (privateView?',cost_cents':'')+'&limit=500');
 const inventory=await db<Row[]>('commerce_inventory?select=variant_id,on_hand,reserved,committed,damaged&limit=500');
 const pMap=new Map(products.map(p=>[p.id,p]));
 const iMap=new Map(inventory.map(i=>[i.variant_id,i]));
 return variants.filter(v=>pMap.has(v.product_id) && (privateView || v.active===true)).map(v=>{
  const p=pMap.get(v.product_id)!;
  const s=iMap.get(v.id);
  const onHand=Number(s?.on_hand||0),reserved=Number(s?.reserved||0);
  const committed=Number(s?.committed||0),damaged=Number(s?.damaged||0);
  const price=typeof v.price_cents==='number'?v.price_cents:null;
  const vat=typeof v.vat_basis_points==='number'?v.vat_basis_points:null;
  return {
   id:v.id,productId:p.id,slug:p.slug,name:p.name,description:p.description,
   category:p.category,setName:p.set_name,imageUrl:p.image_url,status:p.status,
   sku:v.sku,language:v.language,edition:v.edition,sealed:v.sealed,
   priceCents:price,vatBasisPoints:vat,active:v.active,
   stock:Math.max(0,onHand-reserved-committed-damaged),
   ...(privateView?{onHand,reserved,committed,damaged,costCents:v.cost_cents}: {})
  };
 }).filter(v=>privateView || (v.status==='active' && v.priceCents!==null && v.vatBasisPoints!==null));
}
async function getStaff(request:Request) {
 const bearer=request.headers.get('Authorization');
 if(!bearer?.startsWith('Bearer '))throw new HttpError(401,'SIGN_IN_REQUIRED');
 const userResponse=await fetch(BASE+'/auth/v1/user',{
  headers:{apikey:SERVICE,Authorization:bearer},
  signal:AbortSignal.timeout(10000),
  cache:'no-store'
 });
 if(!userResponse.ok)throw new HttpError(401,'SESSION_INVALID');
 const user=await userResponse.json() as {id?:string,email?:string};
 if(!isUuid(user.id))throw new HttpError(401,'SESSION_INVALID');
 let session:string|undefined;
 try{
  const base64=bearer.slice(7).split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
  const payload=JSON.parse(atob(base64)) as {session_id?:string};
  session=payload.session_id;
 }catch {throw new HttpError(401,'SESSION_INVALID');}
 if(!isUuid(session))throw new HttpError(401,'SESSION_INVALID');
 const active=await rpc<boolean>('commerce_session_active',{p_user:user.id,p_session:session});
 if(active!==true)throw new HttpError(401,'SESSION_REVOKED');
 const profiles=await db<Array<{role:StaffRole;active:boolean}>>(
  'commerce_staff?user_id=eq.'+user.id+'&active=eq.true&select=role,active&limit=1'
 );
 const role=profiles[0]?.role;
 if(!allowedRole(role))throw new HttpError(403,'STAFF_ONLY');
 return {id:user.id,email:user.email||'',role};
}
function requireRole(role:StaffRole,roles:StaffRole[]) {
 if(!roles.includes(role))throw new HttpError(403,'INSUFFICIENT_PERMISSIONS');
}
async function jsonLimited(request:Request){
 const bytes=Number(request.headers.get('content-length')||0);
 if(bytes>20000)throw new HttpError(413,'BODY_TOO_LARGE');
 const content=await request.text();
 if(content.length>20000)throw new HttpError(413,'BODY_TOO_LARGE');
 try{
  const body=JSON.parse(content);
  if(!body || Array.isArray(body) || typeof body!=='object')throw Error();
  return body as Record<string,unknown>;
 }catch{throw new HttpError(400,'INVALID_JSON');}
}
Deno.serve(async(request:Request)=>{
 const origin=request.headers.get('origin');
 const headers:Record<string,string>={
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store','Vary':'Origin',
  'X-Content-Type-Options':'nosniff'
 };
 if(origin&&ORIGINS.has(origin)){
  headers['Access-Control-Allow-Origin']=origin;
  headers['Access-Control-Allow-Methods']='GET,POST,OPTIONS';
  headers['Access-Control-Allow-Headers']='authorization,apikey,content-type,x-client-info';
 }
 const respond=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(origin&&!ORIGINS.has(origin))return respond({error:'ORIGIN_NOT_ALLOWED'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 try{
  if(request.method==='GET'){
   const action=new URL(request.url).searchParams.get('action');
   if(action==='catalog')return respond({products:await catalogue()});
   if(action==='health')return respond({service:'soriko-commerce',state:'sandbox',checkoutEnabled:false});
   throw new HttpError(404,'NOT_FOUND');
  }
  if(request.method!=='POST')throw new HttpError(405,'METHOD_NOT_ALLOWED');
  const body=await jsonLimited(request);
  const action=body.action;
  if(typeof action!=='string')throw new HttpError(400,'ACTION_REQUIRED');
  const staff=await getStaff(request);
  if(action==='dashboard'){
   const items=await catalogue(true);
   const orders=await db<Array<{id:string;status:string;total_cents:number;created_at:string}>>(
    'commerce_orders?select=id,status,total_cents,created_at&order=created_at.desc&limit=100'
   );
   const responseOrders=staff.role==='viewer'?orders.map(o=>({status:o.status,total_cents:o.total_cents,created_at:o.created_at})):orders;
   return respond({staff,products:items,orders:responseOrders});
  }
  if(action==='create_listing'){
   requireRole(staff.role,['admin','manager']);
   if(!body.payload||typeof body.payload!=='object'||Array.isArray(body.payload))
    throw new HttpError(400,'INVALID_LISTING');
   const payload=body.payload as Record<string,unknown>;
   const price=payload.price_cents;
   const vat=payload.vat_basis_points;
   if(price!=null&&(!Number.isInteger(price)||Number(price)<=0))
    throw new HttpError(400,'INVALID_PRICE');
   if(vat!=null&&(!Number.isInteger(vat)||Number(vat)<0||Number(vat)>10000))
    throw new HttpError(400,'INVALID_TAX_RATE');
   const created=await rpc('commerce_create_listing',{p_body:payload,p_actor:staff.id});
   return respond({created});
  }
  if(action==='update_listing'){
   requireRole(staff.role,['admin','manager']);
   if(!isUuid(body.variantId)||!body.patch||typeof body.patch!=='object'||Array.isArray(body.patch))
    throw new HttpError(400,'INVALID_LISTING');
   const patch=body.patch as Record<string,unknown>;
   const allowed=new Set(['status','name','image_url','price_cents','vat_basis_points','active']);
   if(Object.keys(patch).some(k=>!allowed.has(k)))throw new HttpError(400,'INVALID_LISTING_FIELDS');
   if(patch.price_cents!=null&&(!Number.isInteger(patch.price_cents)||Number(patch.price_cents)<=0))
    throw new HttpError(400,'INVALID_PRICE');
   if(patch.vat_basis_points!=null&&(!Number.isInteger(patch.vat_basis_points)||Number(patch.vat_basis_points)<0||Number(patch.vat_basis_points)>10000))
    throw new HttpError(400,'INVALID_TAX_RATE');
   const updated=await rpc('commerce_update_listing',{p_variant:body.variantId,p_patch:patch});
   return respond({updated});
  }
  if(action==='stock_adjust'){
   requireRole(staff.role,['admin','manager','operator']);
   if(!isUuid(body.variantId)||!Number.isInteger(body.delta)||body.delta===0||
      Math.abs(Number(body.delta))>100000||typeof body.reason!=='string'||
      body.reason.trim().length<5||body.reason.length>500||
      !isUuid(body.requestId))throw new HttpError(400,'INVALID_STOCK_ADJUSTMENT');
   const updated=await rpc('commerce_adjust_stock',{
    p_variant:body.variantId,p_delta:body.delta,p_reason:body.reason,p_actor:staff.id,p_key:body.requestId
   });
   return respond({updated});
  }
  throw new HttpError(404,'UNKNOWN_ACTION');
 }catch(e){
  if(e instanceof HttpError)return respond({error:e.code},e.status);
  return respond({error:'INTERNAL_ERROR'},500);
 }
});
