import { MODEL_VERSION, calculateMarket, calculateEconomics, assessOpportunity, normalizeText, matchSealedTitle, changePct } from '../../../lib/engine/core.ts';
import type { Evidence, EconomicsInput } from '../../../lib/engine/core.ts';
// Server-only credentials. Never accepted in payloads, logged, or returned.
const BASE = Deno.env.get('SUPABASE_URL')!;
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ORIGINS = new Set(['https://sorico.alfonso-millan.workers.dev']);
const FEEDS = {
 cardmarket_catalog:'https://downloads.s3.cardmarket.com/productCatalog/productList/products_nonsingles_6.json',
 cardmarket_guide:'https://downloads.s3.cardmarket.com/productCatalog/priceGuide/price_guide_6.json',
 ecb_fx:'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml'
};
const uuid = (s:unknown):s is string => typeof s==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const positive = (n:unknown) => typeof n==='number' && Number.isFinite(n) && n>0 ? n : null;
const iso = () => new Date().toISOString();
const hour = () => iso().slice(0,13)+':00:00.000Z';
const hash = async (s:string) => [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
function assert(ok:unknown,code:string):asserts ok { if(!ok) throw new Error(code); }
async function textLimited(res:Response,limit:number):Promise<string> {
 assert(Number(res.headers.get('content-length')??0)<=limit,'PAYLOAD_TOO_LARGE');
 const reader=res.body?.getReader(); assert(reader,'EMPTY_BODY');
 const chunks:Uint8Array[]=[]; let n=0;
 while(true){const {done,value}=await reader.read();if(done)break;n+=value.byteLength;if(n>limit){await reader.cancel();throw new Error('PAYLOAD_TOO_LARGE');}chunks.push(value);}
 const bytes=new Uint8Array(n);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.byteLength;}
 return new TextDecoder().decode(bytes);
}
async function db(path:string,method='GET',body?:unknown,prefer='return=representation'):Promise<any> {
 const r=await fetch(`${BASE}/rest/v1/${path}`,{method,headers:{apikey:SERVICE,Authorization:`Bearer ${SERVICE}`,'Content-Type':'application/json',Prefer:prefer},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
 if(!r.ok){let code='ERROR';try{code=(await r.json()).code??'ERROR';}catch{}throw new Error(`DATABASE_${String(code).replace(/[^A-Z0-9_]/gi,'')}`);}
 if(r.status===204)return null;
 const text=await r.text();return text?JSON.parse(text):null;
}
const rpc=(name:string,args:unknown={})=>db(`rpc/${name}`,'POST',args);
const source=(adapter:string)=>db(`market_sources?adapter=eq.${adapter}&limit=1`).then((r:any[])=>r[0]);
async function external(url:string,headers:Record<string,string>={}):Promise<Response> {
 const res=await fetch(url,{headers:{Accept:'application/json',...headers},redirect:'error',signal:AbortSignal.timeout(20000)});
 assert(res.ok,`SOURCE_HTTP_${res.status}`);return res;
}
function publication(d:any):string {
 const n=Date.parse(d.createdAt);assert(Number.isFinite(n)&&n<=Date.now()+60000,'INVALID_PUBLICATION_DATE');return new Date(n).toISOString();
}
async function insertRows(table:string,rows:unknown[],conflict:string) {
 let inserted=0; for(let i=0;i<rows.length;i+=100){const result=await db(`${table}?on_conflict=${conflict}`,'POST',rows.slice(i,i+100),'resolution=ignore-duplicates,return=representation');inserted+=result.length;}return inserted;
}
async function catalog() {
 const s=await source('cardmarket_catalog');
 const d=JSON.parse(await textLimited(await external(FEEDS.cardmarket_catalog),8*1024*1024));
 assert(Array.isArray(d.products)&&d.products.length>0,'CATALOG_SCHEMA_CHANGED');const published=publication(d);
 const existing=await db('products?select=id,market_catalog_id&market_catalog_id=not.is.null&limit=1000');
 const ids=new Set(existing.map((p:any)=>p.market_catalog_id));
 const selected=d.products.filter((p:any)=>Number.isInteger(p.idProduct)&&typeof p.name==='string'&&p.name.length<240&&
  (p.name.includes('Booster Box')||p.name.includes('Elite Trainer Box'))&&!/\b(case|bundle|empty|jumbo|first edition|1st edition)\b/i.test(p.name))
 .sort((a:any,b:any)=>{
  const boost=(p:any)=>/Card 151|MEGA Dream ex|Terastal Festival|Black Bolt|White Flare/i.test(p.name)?10000000:0;
  return (boost(b)+b.idProduct)-(boost(a)+a.idProduct);
 }).slice(0,100);
 assert(selected.length>0,'NO_SEALED_PRODUCTS');
 const rows=selected.filter((p:any)=>!ids.has(p.idProduct)).map((p:any)=>({market_catalog_id:p.idProduct,sku:`CM-${p.idProduct}`,name:p.name,
  language:'OTHER',product_type:p.name.includes('Elite Trainer Box')?'ETB':'BOOSTER_BOX',sealed:true,identity_status:'UNVERIFIED',units_per_listing:1,
  catalog_source_url:FEEDS.cardmarket_catalog,catalog_updated_at:published,monitoring_priority:/151|MEGA Dream|Terastal/i.test(p.name)?'HOT':'WATCH'}));
 const n=await insertRows('products',rows,'market_catalog_id');
 const products=await db('products?select=id,name,market_catalog_id&market_catalog_id=not.is.null&limit=1000');
 await insertRows('product_aliases',products.map((p:any)=>({product_id:p.id,alias:p.name,normalized_alias:normalizeText(p.name),verified:false})),'product_id,normalized_alias');
 await db(`market_sources?id=eq.${s.id}`,'PATCH',{source_published_at:published});
 return {read:d.products.length,selected:selected.length,inserted:n,sourcePublishedAt:published,identity:'Language remains UNVERIFIED until human confirmation'};
}
async function priceGuide() {
 const s=await source('cardmarket_guide');const products=await db('products?select=id,market_catalog_id&market_catalog_id=not.is.null&limit=1000');
 assert(products.length,'CATALOG_NOT_READY');
 const index=new Map(products.map((p:any)=>[p.market_catalog_id,p.id]));
 const d=JSON.parse(await textLimited(await external(FEEDS.cardmarket_guide),24*1024*1024));
 assert(Array.isArray(d.priceGuides),'GUIDE_SCHEMA_CHANGED');const published=publication(d);
 const rows=d.priceGuides.filter((p:any)=>index.has(p.idProduct)).map((p:any)=>({product_id:index.get(p.idProduct),source_id:s.id,currency:'EUR',
  captured_at:iso(),source_published_at:published,snapshot_key:`cm:${p.idProduct}:${published}`,evidence_type:'SOURCE_GUIDE',
  min_price:positive(p.low),avg_price:positive(p.avg),trend_price:positive(p.trend),avg_1d:positive(p.avg1),avg_7d:positive(p.avg7),avg_30d:positive(p.avg30),
  raw_payload:{...p,notice:'Aggregate by product. Language, condition, shipping, sample size and sales volume are not resolved.'}}));
 assert(rows.length>0,'NO_MATCHED_GUIDE_PRODUCTS');
 const inserted=await insertRows('market_snapshots',rows,'snapshot_key');
 await db(`market_sources?id=eq.${s.id}`,'PATCH',{source_published_at:published});
 return {matched:rows.length,inserted,sourcePublishedAt:published,coverage:rows.length/products.length,evidenceType:'SOURCE_GUIDE'};
}
async function fx() {
 const s=await source('ecb_fx'),xml=await textLimited(await external(FEEDS.ecb_fx),100000);
 const date=/time=['"]([0-9-]+)['"]/.exec(xml)?.[1];assert(date&&/^\d{4}-\d{2}-\d{2}$/.test(date),'FX_SCHEMA_CHANGED');
 assert(date<=iso().slice(0,10),'FX_FUTURE_DATE');
 const rows=[...xml.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([0-9.]+)['"]/g)].map(m=>({rate_date:date,currency:m[1],units_per_eur:Number(m[2]),source_url:FEEDS.ecb_fx}));
 assert(rows.length>10&&rows.every(r=>Number.isFinite(r.units_per_eur)&&r.units_per_eur>0),'FX_INVALID_RATES');
 rows.push({rate_date:date,currency:'EUR',units_per_eur:1,source_url:FEEDS.ecb_fx});
 const inserted=await insertRows('engine_fx_rates',rows,'rate_date,currency');
 await db(`market_sources?id=eq.${s.id}`,'PATCH',{source_published_at:`${date}T00:00:00Z`});
 return {inserted,rateDate:date,referenceOnly:true};
}
async function ebay() {
 const key=Deno.env.get('EBAY_CLIENT_ID'),secret=Deno.env.get('EBAY_CLIENT_SECRET');
 assert(key&&secret,'CREDENTIALS_REQUIRED');
 const s=await source('ebay_browse');assert(s.config?.production_access_approved===true,'EBAY_PRODUCTION_APPROVAL_REQUIRED');
 const tokenResponse=await fetch('https://api.ebay.com/identity/v1/oauth2/token',{method:'POST',headers:{Authorization:`Basic ${btoa(`${key}:${secret}`)}`,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'client_credentials',scope:'https://api.ebay.com/oauth/api_scope'}),signal:AbortSignal.timeout(15000)});
 assert(tokenResponse.ok,`SOURCE_HTTP_${tokenResponse.status}`);const token=await tokenResponse.json();assert(typeof token.access_token==='string','TOKEN_RESPONSE_INVALID');
 const products=await db('products?identity_status=eq.VERIFIED&language=in.(JP,EN,ES)&product_type=eq.BOOSTER_BOX&active=eq.true&select=id,name,language,product_type,product_aliases(alias,verified)&limit=10');
 let read=0,matched=0,quarantined=0;
 for(const product of products){
  const query=new URLSearchParams({q:product.name,limit:'25',filter:'buyingOptions:{FIXED_PRICE},itemLocationCountry:ES'});
  const r=await external(`https://api.ebay.com/buy/browse/v1/item_summary/search?${query}`,{Authorization:`Bearer ${token.access_token}`,'X-EBAY-C-MARKETPLACE-ID':'EBAY_ES','X-EBAY-C-ENDUSERCTX':'contextualLocation=country%3DES'});
  const data=JSON.parse(await textLimited(r,1000000));assert(data.itemSummaries===undefined||Array.isArray(data.itemSummaries),'EBAY_SCHEMA_CHANGED');const rows=[];
  for(const item of data.itemSummaries??[]){read++;const match=matchSealedTitle(String(item.title??''),{name:product.name,language:product.language,format:product.product_type,identityVerified:true,aliases:product.product_aliases.filter((a:any)=>a.verified).map((a:any)=>a.alias)});
   const price=Number(item.price?.value),ship=item.shippingOptions?.find((x:any)=>x.shippingCost?.currency==='EUR')?.shippingCost;
   const shipping=ship?Number(ship.value):null;
   if(item.price?.currency!=='EUR'||!Number.isFinite(price)||price<=0)continue;
   if(match.matched)matched++;else quarantined++;
   rows.push({product_id:product.id,source_id:s.id,external_listing_id:String(item.itemId),source_url:item.itemWebUrl??null,observed_at:iso(),kind:'ASKING',price,shipping_price:shipping,currency:'EUR',total_eur:shipping!=null&&Number.isFinite(shipping)?price+shipping:null,
    language:product.language,condition:'SEALED_UNSPECIFIED',seller_key:item.seller?.username?await hash(String(item.seller.username)):null,seller_country:item.itemLocation?.country??null,delivery_country:'ES',available:true,quantity:null,
    identity_verified:match.matched,match_reason:match.reason,raw_payload:{title:item.title,buyingOptions:item.buyingOptions},observation_key:`ebay:${product.id}:${item.itemId}:${hour()}`});
  }
  await insertRows('market_observations',rows,'observation_key');
 }
 return {products:products.length,read,matched,quarantined,evidenceType:'ASKING',notice:'Browse listings are not completed sales. An active listing is not a confirmed supplier quantity.'};
}
async function recalculate() {
 const [products,snapshots,observations]=await Promise.all([
  db('products?active=eq.true&select=id,name&limit=1000'),
  db('market_snapshots?source_published_at=not.is.null&order=source_published_at.desc&limit=1000'),
  db(`market_observations?observed_at=gte.${encodeURIComponent(new Date(Date.now()-30*86400000).toISOString())}&order=observed_at.desc&limit=1000`)]);
 const now=iso(),bucket=hour();const rows=[];
 for(const p of products){
  const guide=snapshots.find((s:any)=>s.product_id===p.id);
  const evidence:Evidence[]=observations.filter((o:any)=>o.product_id===p.id).map((o:any)=>({id:o.external_listing_id,source:o.source_id,seller:o.seller_key,observedAt:o.observed_at,kind:o.kind,totalEur:o.total_eur==null?null:Number(o.total_eur),identityVerified:o.identity_verified,shippingKnown:o.shipping_price!=null,available:o.available===true,soldAt:o.sold_at}));
  const m=calculateMarket(evidence,now,guide?{value:Number(guide.trend_price??guide.avg_price)||null,asOf:guide.source_published_at}:undefined);
  if(observations.length>=1000){m.qualityScore=Math.min(m.qualityScore,30);m.reasons.push('OBSERVATION_WINDOW_CAPPED');}
  rows.push({product_id:p.id,bucket_at:bucket,model_version:MODEL_VERSION,value_eur:m.value,basis:m.basis,quality_score:m.qualityScore,sample_size:m.sampleSize,source_count:m.sourceCount,seller_count:m.sellerCount,liquidity:m.liquidity,liquidity_score:m.liquidityScore,as_of:m.asOf,details:m});
 }
 for(let i=0;i<rows.length;i+=100)await db('engine_metrics?on_conflict=product_id,bucket_at,model_version','POST',rows.slice(i,i+100),'resolution=merge-duplicates,return=minimal');
 // Polling the same publication cannot manufacture a price move.
 const alerts=[];
 for(const p of products){const ss=snapshots.filter((s:any)=>s.product_id===p.id&&s.trend_price>0);
  if(ss.length<2)continue;const delta=changePct(Number(ss[0].trend_price),Number(ss[1].trend_price));
  if(delta!=null&&Math.abs(delta)>=15&&Date.parse(ss[0].source_published_at)>Date.parse(ss[1].source_published_at)&&Date.parse(ss[0].source_published_at)-Date.parse(ss[1].source_published_at)<=3*86400000){
   alerts.push({product_id:p.id,source_id:ss[0].source_id,event_type:'REFERENCE_MOVE',severity:'WARNING',message:`Official guide change ${delta}%. Verify executable offers before buying.`,metrics:{changePct:delta,current:ss[0].trend_price,previous:ss[1].trend_price},event_key:`guide:${p.id}:${ss[0].source_published_at}`});}
 }
 await insertRows('engine_alerts',alerts,'event_key');
 return {products:rows.length,valued:rows.filter(r=>r.value_eur!=null).length,alerts:alerts.length,modelVersion:MODEL_VERSION};
}
async function work() {
 const started=Date.now(),done=[];
 while(Date.now()-started<35000&&done.length<4){
  const jobs=await rpc('engine_claim_job');if(!jobs.length)break;const j=jobs[0];
  let result:any=null,error:string|null=null;
  const run=await db('scan_runs','POST',{source_name:j.kind,status:'RUNNING'});
  try{switch(j.kind){case 'cardmarket_catalog':result=await catalog();break;case 'cardmarket_guide':result=await priceGuide();break;case 'ecb_fx':result=await fx();break;case 'ebay_browse':result=await ebay();break;case 'recalculate':result=await recalculate();break;default:throw new Error('UNKNOWN_ADAPTER');}}
  catch(e){error=e instanceof Error&&/^[A-Z0-9_]+$/.test(e.message)?e.message:'WORKER_FAILED';}
  const committed=await rpc('engine_finish_job',{p_id:j.id,p_lease:j.lease_token,p_ok:error===null,p_result:result??{},p_error:error});
  await db(`scan_runs?id=eq.${run[0].id}`,'PATCH',{status:committed?(error?'FAILED':'SUCCEEDED'):'LEASE_LOST',finished_at:iso(),products_scanned:result?.matched??result?.products??result?.selected??0,error_summary:error});
  done.push({id:j.id,kind:j.kind,ok:!error&&committed,result,error});
 }
 return {jobs:done};
}
async function currencyToEur(amount:number,currency:string):Promise<number> {
 if(currency==='EUR') return Math.round(amount*100)/100;
 const rates=await db(`engine_fx_rates?currency=eq.${currency}&order=rate_date.desc&limit=1`);
 assert(rates.length&&Number(rates[0].units_per_eur)>0,'FX_RATE_MISSING');
 return Math.round((amount/Number(rates[0].units_per_eur))*100)/100;
}
async function engineReadiness() {
 const [products,quotes,observations,sources]=await Promise.all([
  db('products?select=id,identity_status&active=eq.true&limit=1000'),
  db('supplier_listings?select=id&limit=1000'),
  db('market_observations?select=id,kind&limit=1000'),
  db('market_sources?select=id,adapter,active,health&adapter=not.is.null&limit=100')
 ]);
 const observedSales=observations.filter((o:any)=>o.kind==='SOLD').length;
 const ebay=sources.find((s:any)=>s.adapter==='ebay_browse');
 return {
  products:products.length,
  verifiedProducts:products.filter((p:any)=>p.identity_status==='VERIFIED').length,
  supplierQuotes:quotes.length,
  marketObservations:observations.length,
  observedSales,
  healthySources:sources.filter((s:any)=>s.active&&s.health==='HEALTHY').length,
  ebayCredentialsPresent:!!Deno.env.get('EBAY_CLIENT_ID')&&!!Deno.env.get('EBAY_CLIENT_SECRET'),
  ebayActive:!!ebay?.active,
  liveOpportunityReady:quotes.length>0&&observedSales>=3
 };
}
async function staff(req:Request) {
 const bearer=req.headers.get('authorization');assert(typeof bearer==='string'&&bearer.startsWith('Bearer '),'UNAUTHENTICATED');
 const res=await fetch(`${BASE}/auth/v1/user`,{headers:{apikey:SERVICE,Authorization:bearer},signal:AbortSignal.timeout(10000)});
 assert(res.ok,'UNAUTHENTICATED');const user=await res.json();assert(uuid(user.id)&&user.email_confirmed_at,'UNAUTHENTICATED');
 let session:string|undefined;
 try{const p=bearer.slice(7).split('.')[1];session=JSON.parse(atob(p.replace(/-/g,'+').replace(/_/g,'/'))).session_id;}catch{}
 assert(uuid(session)&&await rpc('engine_session_active',{p_user:user.id,p_session:session}),'SESSION_REVOKED');
 const gate=await db(`engine_superadmin?singleton=eq.true&user_id=eq.${user.id}&select=user_id`);
 assert(gate.length===1,'FORBIDDEN');
 let profiles=await db(`profiles?user_id=eq.${user.id}&select=user_id,role`);
 if(!profiles.length)profiles=await db('profiles?on_conflict=user_id','POST',{user_id:user.id,role:'admin',display_name:'Superadmin'},'resolution=merge-duplicates,return=representation');
 else if(profiles[0].role!=='admin')profiles=await db(`profiles?user_id=eq.${user.id}`,'PATCH',{role:'admin',display_name:'Superadmin'});
 assert(await rpc('engine_request_rate_allowed',{p_user:user.id}),'RATE_LIMITED');
 await rpc('engine_audit',{p_user:user.id,p_action:'API_REQUEST'});
 return {id:user.id,email:user.email,role:'admin'};
}
async function api(action:string,p:any,user:{id:string;role:string;email:string}) {
 const writer=()=>assert(['admin','buyer'].includes(user.role),'FORBIDDEN');
 switch(action){
  case 'bootstrap':return {user,settings:(await db('engine_settings?id=eq.1'))[0],version:MODEL_VERSION,readiness:await engineReadiness()};
  case 'dashboard':{
   const [products,metrics,sources,jobs,opportunities,alerts,fxRates]=await Promise.all([
    db('products?select=id,sku,name,language,product_type,identity_status,monitoring_priority,market_catalog_id&active=eq.true&order=name&limit=1000'),
    db('engine_latest_metrics?limit=1000'),db('market_sources?adapter=not.is.null&order=name'),db('engine_jobs?order=created_at.desc&limit=40'),
    db('opportunities?order=created_at.desc&limit=100'),db('engine_alerts?order=created_at.desc&limit=80'),db('engine_fx_rates?currency=in.(EUR,JPY,USD,GBP)&order=rate_date.desc&limit=4')]);
   return {products,metrics,sources,jobs,opportunities,alerts,fxRates,asOf:iso(),version:MODEL_VERSION};}
  case 'product':{
   assert(uuid(p.id),'INVALID_PRODUCT');
   const [products,history,observations,quotes,analyses]=await Promise.all([db(`products?id=eq.${p.id}&select=*,product_aliases(*)`),
    db(`market_snapshots?product_id=eq.${p.id}&order=source_published_at.asc&limit=365`),db(`market_observations?product_id=eq.${p.id}&order=observed_at.desc&limit=50`),
    db(`supplier_listings?product_id=eq.${p.id}&order=captured_at.desc&limit=30`),db(`opportunities?product_id=eq.${p.id}&order=created_at.desc&limit=20`)]);
   assert(products.length,'NOT_FOUND');return {product:products[0],history,observations,quotes,analyses};}
  case 'analyze':{
   assert(uuid(p.productId),'INVALID_PRODUCT');assert(p.costs&&typeof p.costs==='object','INVALID_COSTS');
   const product=(await db(`products?id=eq.${p.productId}`))[0];assert(product,'NOT_FOUND');
   const [metrics,settings]=await Promise.all([db(`engine_latest_metrics?product_id=eq.${p.productId}`),db('engine_settings?id=eq.1')]);
   const m=metrics[0]?.details??calculateMarket([],iso());
   const costs={...p.costs} as EconomicsInput;
   let quote:any=null,supplier:any=null,supplierVerified=false,quotePriceEur:number|null=null;
   if(p.quoteId!=null){
    assert(uuid(p.quoteId),'INVALID_QUOTE');
    quote=(await db(`supplier_listings?id=eq.${p.quoteId}&limit=1`))[0];assert(quote&&quote.product_id===product.id,'INVALID_QUOTE');
    assert(!quote.valid_until||Date.parse(quote.valid_until)>=Date.now(),'QUOTE_EXPIRED');
    supplier=(await db(`suppliers?id=eq.${quote.supplier_id}&limit=1`))[0];assert(supplier,'NOT_FOUND');
    quotePriceEur=await currencyToEur(Number(quote.unit_price),quote.currency);
    costs.unitPurchaseEur=quotePriceEur;
    supplierVerified=supplier.verified===true;
   }
   const e=calculateEconomics(costs);
   const assumptionsVerified=p.inputsVerified===true;
   const assessment=assessOpportunity(e,m,{identityVerified:product.identity_status==='VERIFIED',supplierVerified,inputsVerified:assumptionsVerified,now:iso(),maxAgeHours:settings[0].config.max_market_age_hours});
   const extra:string[]=[];
   if(quote?.min_qty!=null&&Number(costs.quantity)<Number(quote.min_qty))extra.push('MINIMUM_QUANTITY_NOT_MET');
   if(quote?.tax_basis==='UNKNOWN')extra.push('TAX_BASIS_UNKNOWN');
   for(const blocker of extra)if(!assessment.blockers.includes(blocker))assessment.blockers.push(blocker);
   if(extra.length&&assessment.decision!=='PASS')assessment.decision='REVIEW';
   let id=null;
   if(p.save){
    writer();assert(uuid(p.requestId),'IDEMPOTENCY_KEY_REQUIRED');
    id=await rpc('engine_save_analysis',{p_product:product.id,p_user:user.id,p_key:p.requestId,p_inputs:costs,p_economics:e,p_assessment:assessment,p_market:m});
    if(quote){
     const opp=(await db(`opportunities?id=eq.${id}&select=id,landed_cost_id&limit=1`))[0];
     if(opp){await db(`opportunities?id=eq.${id}`,'PATCH',{supplier_listing_id:quote.id,rationale:'Supplier quote linked. Purchase still requires human approval and complete landed costs.'});
      if(opp.landed_cost_id)await db(`landed_cost_calculations?id=eq.${opp.landed_cost_id}`,'PATCH',{supplier_listing_id:quote.id,inputs_verified:assumptionsVerified&&e.complete});}
    }
   }
   return {product,market:m,economics:e,assessment,id,simulation:true,quote:quote?{id:quote.id,unitPrice:quote.unit_price,currency:quote.currency,unitPurchaseEur:quotePriceEur,supplier:supplier?.name,supplierVerified}:null};}
  case 'scan':{
   writer();const sources=await db('market_sources?active=eq.true&adapter=in.(cardmarket_catalog,cardmarket_guide,ecb_fx)&select=id,adapter');
   const inserted=await insertRows('engine_jobs',sources.map((s:any)=>({source_id:s.id,kind:s.adapter,dedupe_key:`manual:${s.id}:${hour()}`})),'dedupe_key');
   await insertRows('engine_jobs',[{kind:'recalculate',dedupe_key:`manual:recalculate:${hour()}`,available_at:new Date(Date.now()+120000).toISOString()}],'dedupe_key');
   return {enqueued:inserted,message:'Queued; worker drains pending jobs. Publication time is retained.'};}
  case 'acknowledge':writer();assert(uuid(p.id),'INVALID_ALERT');await db(`engine_alerts?id=eq.${p.id}`,'PATCH',{acknowledged_at:iso(),acknowledged_by:user.id});return {ok:true};
  case 'identity':{
   assert(user.role==='admin','FORBIDDEN');assert(uuid(p.id)&&['JP','EN','ES','OTHER'].includes(p.language),'INVALID_IDENTITY');assert(['HOT','WATCH','LONG_TAIL'].includes(p.priority),'INVALID_PRIORITY');
   await db(`products?id=eq.${p.id}`,'PATCH',{language:p.language,identity_status:p.language==='OTHER'?'UNVERIFIED':'VERIFIED',monitoring_priority:p.priority,updated_at:iso()});
   await rpc('engine_audit',{p_user:user.id,p_action:'VERIFY_PRODUCT_IDENTITY',p_entity:p.id});return {ok:true};}
  case 'market':{
   const [observations,products,sources]=await Promise.all([
    db('market_observations?order=observed_at.desc&limit=100'),
    db('products?select=id,name,sku&limit=1000'),
    db('market_sources?select=id,name,adapter&limit=100')
   ]);
   const productMap=new Map(products.map((x:any)=>[x.id,x])),sourceMap=new Map(sources.map((x:any)=>[x.id,x]));
   return {observations:observations.map((o:any)=>({...o,product:productMap.get(o.product_id)??null,source:sourceMap.get(o.source_id)??null}))};
  }
  case 'import_market':{
   writer();assert(Array.isArray(p.rows)&&p.rows.length>0&&p.rows.length<=100,'IMPORT_LIMIT_100');
   const [products,s]=await Promise.all([db('products?select=id,name,sku,language,identity_status&limit=1000'),source('market_import')]);
   const rows=[];let quarantined=0;
   for(const row of p.rows){
    const matches=products.filter((x:any)=>uuid(row.product_id)?x.id===row.product_id:
      (typeof row.product_name==='string'&&normalizeText(x.name)===normalizeText(row.product_name))||(typeof row.sku==='string'&&x.sku===row.sku));
    assert(matches.length===1,'INVALID_REFERENCE');const product=matches[0];
    assert(typeof row.external_listing_id==='string'&&row.external_listing_id.trim().length>0&&row.external_listing_id.length<=200,'INVALID_LISTING');
    assert(['ASKING','SOLD'].includes(row.kind),'INVALID_EVIDENCE_KIND');
    assert(typeof row.price==='number'&&Number.isFinite(row.price)&&row.price>0,'INVALID_PRICE');
    assert(typeof row.shipping_price==='number'&&Number.isFinite(row.shipping_price)&&row.shipping_price>=0,'SHIPPING_REQUIRED');
    assert(['JPY','EUR','USD','GBP'].includes(row.currency),'INVALID_CURRENCY');
    const observedAt=row.observed_at??iso();assert(Number.isFinite(Date.parse(observedAt))&&Date.parse(observedAt)<=Date.now()+60000,'INVALID_OBSERVED_AT');
    let soldAt=null;if(row.kind==='SOLD'){soldAt=row.sold_at;assert(typeof soldAt==='string'&&Number.isFinite(Date.parse(soldAt))&&Date.parse(soldAt)<=Date.now()+60000,'SOLD_AT_REQUIRED');}
    if(row.source_url!=null)assert(/^https:\/\/[^\s]+$/.test(row.source_url),'INVALID_SOURCE_URL');
    if(row.seller_country!=null)assert(/^[A-Z]{2}$/.test(row.seller_country),'INVALID_COUNTRY');
    const verified=row.identity_verified===true&&product.identity_status==='VERIFIED';
    if(!verified)quarantined++;
    const totalEur=await currencyToEur(row.price+row.shipping_price,row.currency);
    const keyPayload={source:s.id,product:product.id,external:String(row.external_listing_id),kind:row.kind,stamp:row.kind==='SOLD'?soldAt:observedAt.slice(0,13)};
    rows.push({product_id:product.id,source_id:s.id,external_listing_id:String(row.external_listing_id),source_url:row.source_url??null,observed_at:observedAt,source_published_at:row.source_published_at??soldAt,
      kind:row.kind,price:row.price,shipping_price:row.shipping_price,currency:row.currency,total_eur:totalEur,language:product.language,condition:row.condition??'SEALED_UNSPECIFIED',
      seller_key:typeof row.seller_name==='string'&&row.seller_name.trim()?await hash(row.seller_name.trim()):null,seller_country:row.seller_country??null,delivery_country:'ES',
      available:row.kind==='ASKING',quantity:row.quantity??null,sold_at:soldAt,identity_verified:verified,match_reason:verified?'MANUAL_VERIFIED':'MANUAL_QUARANTINED',
      raw_payload:{note:'Manual verified-market import. Source record must remain auditable outside Soriko.',source_label:row.source_label??null},observation_key:await hash(JSON.stringify(keyPayload))});
   }
   const inserted=await insertRows('market_observations',rows,'observation_key');
   await db(`market_sources?id=eq.${s.id}`,'PATCH',{health:'HEALTHY',last_success_at:iso(),last_error:null});
   await insertRows('engine_jobs',[{kind:'recalculate',dedupe_key:`market-import:recalculate:${hour()}`}],'dedupe_key');
   await rpc('engine_audit',{p_user:user.id,p_action:'IMPORT_MARKET',p_entity:String(inserted)});
   return {inserted,validated:rows.length-quarantined,quarantined};
  }
  case 'suppliers':{
   const [suppliers,quotes,products]=await Promise.all([
    db('suppliers?order=name'),
    db('supplier_listings?order=captured_at.desc&limit=100'),
    db('products?select=id,name,sku&limit=1000')
   ]);
   const productMap=new Map(products.map((p:any)=>[p.id,p]));
   const supplierMap=new Map(suppliers.map((s:any)=>[s.id,s]));
   return {suppliers,quotes:quotes.map((q:any)=>({...q,product:productMap.get(q.product_id)??null,supplier:supplierMap.get(q.supplier_id)??null}))};
  }
  case 'quote':{
   assert(uuid(p.id),'INVALID_QUOTE');
   const q=(await db(`supplier_listings?id=eq.${p.id}&limit=1`))[0];assert(q,'NOT_FOUND');
   if(q.valid_until)assert(Date.parse(q.valid_until)>=Date.now(),'QUOTE_EXPIRED');
   const [supplier,product]=await Promise.all([(await db(`suppliers?id=eq.${q.supplier_id}&limit=1`))[0],(await db(`products?id=eq.${q.product_id}&limit=1`))[0]]);
   assert(supplier&&product,'NOT_FOUND');
   return {quote:q,supplier:{id:supplier.id,name:supplier.name,verified:supplier.verified},product:{id:product.id,name:product.name,sku:product.sku},unitPurchaseEur:await currencyToEur(Number(q.unit_price),q.currency)};
  }
  case 'import_supplier':{
   writer();assert(Array.isArray(p.rows)&&p.rows.length>0&&p.rows.length<=100,'IMPORT_LIMIT_100');
   const [products,suppliers]=await Promise.all([db('products?select=id,name,sku&limit=1000'),db('suppliers?select=id,name&limit=100')]);
   const rows=[];
   for(const row of p.rows){
    const productMatches=products.filter((x:any)=>uuid(row.product_id)?x.id===row.product_id:
      (typeof row.product_name==='string'&&normalizeText(x.name)===normalizeText(row.product_name))||(typeof row.sku==='string'&&x.sku===row.sku));
    const supplierMatches=suppliers.filter((x:any)=>uuid(row.supplier_id)?x.id===row.supplier_id:
      typeof row.supplier_name==='string'&&normalizeText(x.name)===normalizeText(row.supplier_name));
    assert(productMatches.length===1&&supplierMatches.length===1,'INVALID_REFERENCE');
    assert(typeof row.unit_price==='number'&&Number.isFinite(row.unit_price)&&row.unit_price>0,'INVALID_PRICE');assert(['JPY','EUR','USD','GBP'].includes(row.currency),'INVALID_CURRENCY');assert(['NET','GROSS','UNKNOWN'].includes(row.tax_basis),'TAX_BASIS_REQUIRED');
    if(row.valid_until!=null)assert(Number.isFinite(Date.parse(row.valid_until)),'INVALID_VALIDITY');
    if(row.stock_qty!=null)assert(Number.isInteger(row.stock_qty)&&row.stock_qty>=0,'INVALID_STOCK');
    if(row.min_qty!=null)assert(Number.isInteger(row.min_qty)&&row.min_qty>0,'INVALID_QUANTITY');
    if(row.source_url!=null)assert(/^https:\/\/[^\s]+$/.test(row.source_url),'INVALID_SOURCE_URL');
    const canonical={product_id:productMatches[0].id,supplier_id:supplierMatches[0].id,unit_price:row.unit_price,currency:row.currency,tax_basis:row.tax_basis,stock_qty:row.stock_qty??null,min_qty:row.min_qty??null,valid_until:row.valid_until??null,source_url:row.source_url??null};
    rows.push({...canonical,captured_at:iso(),import_key:await hash(JSON.stringify(canonical))});
   }
   const inserted=await insertRows('supplier_listings',rows,'import_key');await rpc('engine_audit',{p_user:user.id,p_action:'IMPORT_SUPPLIER',p_entity:String(inserted)});
   return {inserted,matched:rows.length,requiresLandedCalculation:true};}
  case 'decision':{
   writer();assert(uuid(p.id)&&['APPROVE','REJECT','DEFER'].includes(p.decision),'INVALID_DECISION');const o=(await db(`opportunities?id=eq.${p.id}`))[0];assert(o,'NOT_FOUND');
   const r=await db('engine_decisions','POST',{opportunity_id:o.id,actor_id:user.id,decision:p.decision,notes:typeof p.notes==='string'?p.notes.slice(0,2000):null,predicted_sale_eur:o.proposed_price_eur,predicted_contribution_eur:o.estimated_profit_eur});
   return {id:r[0].id,placedOrder:false};}
  case 'source_toggle':{
   assert(user.role==='admin','FORBIDDEN');assert(uuid(p.id)&&typeof p.active==='boolean','INVALID_SOURCE');const s=(await db(`market_sources?id=eq.${p.id}`))[0];assert(s&&Object.keys(FEEDS).concat('ebay_browse').includes(s.adapter),'INVALID_SOURCE');
   if(p.active&&s.adapter==='ebay_browse'){assert(Deno.env.get('EBAY_CLIENT_ID')&&Deno.env.get('EBAY_CLIENT_SECRET'),'CREDENTIALS_REQUIRED');assert(s.config?.production_access_approved===true,'EBAY_PRODUCTION_APPROVAL_REQUIRED');}
   await db(`market_sources?id=eq.${p.id}`,'PATCH',{active:p.active,consecutive_failures:0,next_run_at:iso(),health:p.active?'READY':'PAUSED'});
   await rpc('engine_audit',{p_user:user.id,p_action:'SOURCE_TOGGLE',p_entity:s.id});return {ok:true};}
  default:throw new Error('UNKNOWN_ACTION');
 }
}
Deno.serve(async req=>{
 const origin=req.headers.get('origin');const cors:Record<string,string>={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};
 if(origin&&ORIGINS.has(origin)){cors['Access-Control-Allow-Origin']=origin;cors['Access-Control-Allow-Headers']='authorization,apikey,content-type,x-client-info';cors['Access-Control-Allow-Methods']='GET,POST,OPTIONS';}
 const respond=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:cors});
 if(origin&&!ORIGINS.has(origin))return respond({error:'ORIGIN_NOT_ALLOWED'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.method==='GET')return respond({service:'soriko-engine',version:MODEL_VERSION});
 if(req.method!=='POST')return respond({error:'METHOD_NOT_ALLOWED'},405);
 try{
  assert((req.headers.get('content-type')??'').includes('application/json'),'JSON_REQUIRED');
  const body=JSON.parse(await textLimited(new Response(req.body),256000));assert(typeof body.action==='string','INVALID_ACTION');
  if(body.action==='work'){
   const worker=req.headers.get('x-soriko-worker');assert(worker&&await rpc('engine_worker_authorized',{p_token:worker}),'UNAUTHENTICATED');return respond(await work());
  }
  const user=await staff(req);return respond(await api(body.action,body.payload??{},user));
 }catch(e){const message=e instanceof Error&&/^[A-Z0-9_]+$/.test(e.message)?e.message:'REQUEST_FAILED';
  const status=['UNAUTHENTICATED','SESSION_REVOKED'].includes(message)?401:message==='FORBIDDEN'?403:message==='RATE_LIMITED'?429:message.startsWith('DATABASE_')||message==='WORKER_FAILED'?500:400;
  return respond({error:message},status);
 }
});
