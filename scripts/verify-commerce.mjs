// Read-only API probe. Never writes orders, customers, prices or inventory.
const endpoint='https://vgxeebazmzkncbsmcrha.supabase.co/functions/v1/soriko-commerce';
const timeout=()=>AbortSignal.timeout(12000);
async function get(action,headers={}){
 return fetch(endpoint+'?action='+action,{headers,cache:'no-store',signal:timeout()});
}
const health=await get('health');
if(!health.ok)throw new Error('Commerce Edge health failed: '+health.status);
const info=await health.json();
if(info.service!=='soriko-commerce'||info.checkoutEnabled!==false)
 throw new Error('Unsafe Commerce API state');
console.log('Commerce health',health.status,info.state);
const catalog=await get('catalog',{Origin:'https://soriko.alfonso-millan.workers.dev'});
if(!catalog.ok)throw new Error('Commerce catalog failed: '+catalog.status);
if(catalog.headers.get('access-control-allow-origin')!=='https://soriko.alfonso-millan.workers.dev')
 throw new Error('Commerce CORS policy did not allow canonical website');
const products=await catalog.json();
if(!Array.isArray(products.products))throw new Error('Catalog payload invalid');
console.log('Commerce catalog',catalog.status,products.products.length,'live references');
for(const action of ['dashboard','sourcing_list','sourcing_update']){
 const forbidden=await fetch(endpoint,{
  method:'POST',headers:{'content-type':'application/json',Origin:'https://soriko.alfonso-millan.workers.dev'},
  body:JSON.stringify({action}),signal:timeout()
 });
 if(forbidden.status!==401)throw new Error(action+' allowed anonymous request: '+forbidden.status);
 console.log('Commerce staff action denied anonymously:',action,forbidden.status);
}
const hostile=await get('catalog',{Origin:'https://external-site.invalid'});
if(hostile.status!==403)throw new Error('Unexpected Commerce cross-origin access: '+hostile.status);
console.log('Commerce hostile origin denied',hostile.status);
console.log('Commerce API public and staff isolation verified');
