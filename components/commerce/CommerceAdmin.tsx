'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {createClient} from '@supabase/supabase-js';
import type {Session} from '@supabase/supabase-js';
import SoraSourcing from './SoraSourcing';
import {eurosToCents} from '../../lib/commerce/core';
import {productSlug,publicationIssues} from '../../lib/commerce/catalog';

const BASE=process.env.NEXT_PUBLIC_SUPABASE_URL||'https://vgxeebazmzkncbsmcrha.supabase.co';
const KEY=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'sb_publishable_SSDkG-X9oWgoD4qHR_bwaA_0vOG5OEv';
const API=BASE+'/functions/v1/soriko-commerce';
type View='overview'|'products'|'inventory'|'orders'|'sourcing';
type Role='admin'|'manager'|'operator'|'viewer';
type Product={
 id:string;productId:string;slug:string;name:string;description:string;
 category:string;setName:string|null;imageUrl:string|null;status:string;
 sku:string;language:string;edition:string;sealed:boolean;priceCents:number|null;
 vatBasisPoints:number|null;active:boolean;stock:number;onHand:number;reserved:number;
 committed:number;damaged:number;costCents:number|null;
};
type Order={id?:string;status:string;total_cents:number;created_at:string};
type Dashboard={staff:{id:string;email:string;role:Role};products:Product[];orders:Order[]};
const NAV:[View,string,string][]=[
 ['overview','Resumen','01'],['products','Productos','02'],
 ['inventory','Inventario','03'],['orders','Pedidos','04'],['sourcing','Sora / Mercado','05']
];
const CATEGORY:[string,string][]=[
 ['BOOSTER_BOX','Booster Box'],['ETB','Elite Trainer Box'],['BUNDLE','Booster Bundle'],
 ['PACK','Sobres'],['COLLECTION','Collection Box'],['SINGLE','Cartas individuales'],
 ['ACCESSORY','Accesorios'],['OTHER','Otros']
];
const format=(cents:number|null|undefined)=>typeof cents==='number'?
 new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(cents/100):'Sin configurar';

export default function CommerceAdmin({view='overview'}:{view?:View}){
 const [client]=useState(()=>createClient(BASE,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}));
 const [session,setSession]=useState<Session|null>(null);
 const [ready,setReady]=useState(false);
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [data,setData]=useState<Dashboard|null>(null);
 const [name,setName]=useState('');
 const [slug,setSlug]=useState('');
 const [slugEdited,setSlugEdited]=useState(false);
 const [publishNow,setPublishNow]=useState(false);
 const [sku,setSku]=useState('');
 const [language,setLanguage]=useState('JP');
 const [category,setCategory]=useState('BOOSTER_BOX');
 const [price,setPrice]=useState('');
 const [vat,setVat]=useState('');
 const [imageUrl,setImageUrl]=useState('');
 const [variantId,setVariantId]=useState('');
 const [delta,setDelta]=useState('');
 const [reason,setReason]=useState('');
 const [editing,setEditing]=useState<string|null>(null);
 const [editPrice,setEditPrice]=useState('');
 const [editVat,setEditVat]=useState('');
 const [editStatus,setEditStatus]=useState('draft');
 const [editName,setEditName]=useState('');
 const [editSlug,setEditSlug]=useState('');
 const [editDescription,setEditDescription]=useState('');
 const [editSetName,setEditSetName]=useState('');
 const [editImageUrl,setEditImageUrl]=useState('');
 useEffect(()=>{
  let alive=true;
  client.auth.getSession().then(({data})=>{if(alive){setSession(data.session);setReady(true);}})
   .catch(()=>{if(alive)setReady(true);});
  const {data:auth}=client.auth.onAuthStateChange((_event,s)=>{if(alive){setSession(s);if(!s)setData(null);}});
  return()=>{alive=false;auth.subscription.unsubscribe();};
 },[client]);
 async function call<T>(action:string,payload:Record<string,unknown>={}):Promise<T>{
  const {data:{session:auth}}=await client.auth.getSession();
  if(!auth)throw Error('Inicia sesión de nuevo.');
  const response=await fetch(API,{method:'POST',cache:'no-store',
   headers:{apikey:KEY,Authorization:'Bearer '+auth.access_token,'Content-Type':'application/json'},
   body:JSON.stringify({action,...payload}),signal:AbortSignal.timeout(20000)});
  const value=await response.json();
  if(!response.ok)throw Error(value.error||'No ha sido posible completar la operación');
  return value as T;
 }
 async function run(task:()=>Promise<void>){
  setBusy(true);setError('');setNotice('');
  try{await task();}catch(e){setError(e instanceof Error?e.message:'Error inesperado');}
  finally{setBusy(false);}
 }
 async function refresh(){setData(await call<Dashboard>('dashboard'));}
 useEffect(()=>{
  if(session){void run(refresh);}
  else setData(null);
  // An account switch must trigger fresh permission evaluation.
 },[session?.user.id]);
 const products=data?.products??[];
 const writer=data?.staff.role==='admin'||data?.staff.role==='manager';
 const canStock=writer||data?.staff.role==='operator';
 const drafts=products.filter(p=>p.status==='draft').length;
 const published=products.filter(p=>p.status==='active').length;
 const metrics=useMemo(()=>{
  const available=products.reduce((sum,p)=>sum+p.stock,0);
  const units=products.reduce((sum,p)=>sum+p.onHand,0);
  const sales=(data?.orders??[]).filter(o=>['paid','processing','shipped','delivered'].includes(o.status));
  const revenue=sales.reduce((sum,o)=>sum+o.total_cents,0);
  return {available,units,orders:sales.length,revenue};
 },[data,products]);
 if(!ready)return <div className="en-loading">Abriendo Soriko Commerce...</div>;
 if(!session)return <main className="en-login">
  <section className="en-login-brand"><Link href="/" className="en-wordmark">SORIKO<span>COMMERCE / PRIVATE</span></Link>
   <div><p className="en-eyebrow">TIENDA · PRODUCTOS · STOCK</p><h1>Tu colección.<br/><em>Bajo control.</em></h1>
    <p>Inventario real, precios, pedidos y movimientos de almacén en un único lugar.</p></div>
   <small>ACCESO SOLO EQUIPO SORIKO</small></section>
  <section className="en-login-form"><div><p className="en-eyebrow">SORIKO COMMERCE</p><h2>Acceso al panel</h2>
   <p>Usa tu cuenta interna autorizada. No existe registro público.</p>
   <form onSubmit={e=>{e.preventDefault();void run(async()=>{
    const result=await client.auth.signInWithPassword({email,password});
    if(result.error)throw Error('Email o contraseña incorrectos.');
    setPassword('');
   });}}>
    <label>Correo electrónico<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
    <label>Contraseña<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
    <button disabled={busy}>{busy?'Accediendo...':'Entrar a Commerce'}</button>
   </form>
   {error&&<p className="en-error" role="alert">{error}</p>}
   <p className="en-muted">Los datos de clientes y las operaciones de inventario solo se consultan desde el servidor.</p>
   <Link href="/">Volver a Soriko →</Link></div></section>
 </main>;
 return <main className="engine commerce-admin">
  <aside className="en-sidebar"><Link href="/admin/" className="en-wordmark">SORIKO<span>COMMERCE / PRIVATE</span></Link>
   <div className="en-space"/><p className="en-eyebrow">COMMERCE OPERATIONS</p>
   <nav aria-label="Navegación privada">
    {NAV.map(([id,label,num])=><Link key={id} href={id==='overview'?'/admin/':'/admin/'+id+'/'}
      className={view===id?'active':''} aria-current={view===id?'page':undefined}><small>{num}</small>{label}</Link>)}
   </nav>
   <div className="en-sidebar-bottom"><b>{data?.staff.role?.toUpperCase()||'VALIDANDO'}</b>
    <p>{session.user.email}</p>
    <button className="en-ghost" type="button" onClick={()=>void client.auth.signOut()}>Cerrar sesión</button>
    <Link href="/shop/">Ver la tienda ↗</Link></div>
  </aside>
  <section className="en-main">
   <header className="en-top"><div><p className="en-eyebrow">SORIKO COMMERCE · INVENTARIO REAL</p>
    <h1>{NAV.find(([id])=>id===view)?.[1]}</h1></div>
    <div className="en-actions"><span>{data?'Conectado a Supabase':'Validando acceso'}</span>
     <button className="en-ghost" type="button" disabled={busy||!data} onClick={()=>void run(refresh)}>Actualizar</button></div>
   </header>
   {error&&<p className="en-error" role="alert">{error}</p>}
   {notice&&<p className="en-notice" role="status">{notice}</p>}
   {!data&&<section className="en-panel"><p>Comprobando credenciales y permisos internos...</p></section>}
   {data&&view==='overview'&&<>
    <div className="en-stats">
     <div className="en-stat"><span>REFERENCIAS</span><strong>{products.length}</strong><small>Variantes registradas</small></div>
     <div className="en-stat"><span>UNIDADES FÍSICAS</span><strong>{metrics.units}</strong><small>En almacén</small></div>
     <div className="en-stat"><span>STOCK VENDIBLE</span><strong>{metrics.available}</strong><small>Descontando reservas y daños</small></div>
     <div className="en-stat"><span>VENTAS CONFIRMADAS</span><strong>{format(metrics.revenue)}</strong><small>{metrics.orders} pedidos pagados</small></div>
    </div>
    <div className="en-insight"><strong>VENTA CONTROLADA</strong>
     <span>El inventario ya es transaccional. El checkout seguirá bloqueado hasta integrar y validar pagos reales.</span>
     <Link href="/admin/inventory/">Gestionar inventario →</Link></div>
    <section className="en-panel"><h2>Estado de Soriko Store</h2>
     <p>Los productos pasan por borrador, publicación y recepción de mercancía. Solo se muestra precio y disponibilidad de referencias publicadas.</p>
     <div className="commerce-quick"><Link href="/admin/products/">Gestionar productos ↗</Link>
      <Link href="/admin/inventory/">Registrar stock ↗</Link><Link href="/admin/sourcing/">Sora / Mercado ↗</Link><Link href="/shop/">Visitar tienda ↗</Link></div>
    </section>
   </>}
   {data&&view==='products'&&<>
    {writer&&<section className="en-panel commerce-panel">
     <div className="en-panel-head"><div><p className="en-eyebrow">CREAR REFERENCIA</p><h2>Nuevo producto y SKU</h2></div></div>
     <form className="commerce-form" onSubmit={e=>{e.preventDefault();void run(async()=>{
      const euros=eurosToCents(price);
      if(euros!==null&&(!Number.isInteger(euros)||euros<=0))throw Error('Indica un precio válido en euros.');
      const payload={
       name,slug,sku,language,category,image_url:imageUrl,
       price_cents:euros,vat_basis_points:vat===''?null:Number(vat),
       status:publishNow?'active':'draft'
      };
      await call('create_listing',{payload});
      setName('');setSlug('');setSlugEdited(false);setSku('');setPrice('');setImageUrl('');setVat('');setPublishNow(false);
      await refresh();setNotice(publishNow?'Producto publicado y visible en la tienda. Con stock cero no se puede comprar.':'Producto guardado como borrador. No aparece en la tienda hasta que lo publiques.');
     });}}>
      <label>Nombre<input required minLength={3} maxLength={180} value={name} onChange={e=>{setName(e.target.value);if(!slugEdited)setSlug(productSlug(e.target.value));}}/></label>
      <label>Slug único<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug} onChange={e=>{setSlugEdited(true);setSlug(e.target.value);}} placeholder="pokemon-151-jp"/></label>
      <label>SKU único<input required minLength={3} value={sku} onChange={e=>setSku(e.target.value)} placeholder="PK-151-JP-BOX"/></label>
      <label>Idioma<select value={language} onChange={e=>setLanguage(e.target.value)}><option value="JP">Japonés</option><option value="EN">Inglés</option><option value="ES">Español</option></select></label>
      <label>Formato<select value={category} onChange={e=>setCategory(e.target.value)}>{CATEGORY.map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></label>
      <label>Precio PVP (EUR)<input type="number" min="0.01" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} placeholder="Aún sin fijar"/></label>
      <label>IVA aplicable<select value={vat} onChange={e=>setVat(e.target.value)}>
       <option value="">Sin configurar</option><option value="2100">21 %</option><option value="1000">10 %</option><option value="400">4 %</option><option value="0">0 % (solo si procede)</option>
      </select></label>
      <label className="commerce-form-wide">URL imagen autorizada (HTTPS)<input type="url" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="https://..."/></label>
      <label className="commerce-form-wide commerce-publish-choice"><input type="checkbox" checked={publishNow} onChange={e=>setPublishNow(e.target.checked)}/>
       <span><strong>Publicar también en Soriko Store</strong><small>La ficha será visible inmediatamente. Si no hay stock, se mostrará «Agotado» y no permitirá añadir al carrito. Sin marcar, se guardará oculta como borrador.</small></span></label>
      <div className="commerce-form-wide"><button disabled={busy}>{publishNow?'Crear y publicar en tienda':'Guardar borrador (oculto)'}</button></div>
     </form>
    </section>}
    <section className="en-panel"><h2>Catálogo registrado ({products.length})</h2>
     <div className="en-table-wrap"><table><thead><tr><th>Producto / SKU</th><th>Idioma</th><th>PVP</th><th>Estado</th><th>Disponible</th>{writer&&<th>Acciones</th>}</tr></thead>
     <tbody>{products.map(p=><tr key={p.id}><td><strong>{p.name}</strong><small className="commerce-subtext">{p.sku}</small></td>
      <td>{p.language}</td><td>{format(p.priceCents)}</td><td>{p.status}</td><td>{p.stock}</td>
      {writer&&<td><button className="en-ghost" type="button" onClick={()=>{setEditing(p.id);setEditPrice(p.priceCents===null?'':String(p.priceCents/100));setEditVat(p.vatBasisPoints===null?'':String(p.vatBasisPoints));setEditStatus(p.status);}}>Editar</button></td>}</tr>)}</tbody></table></div>
     {products.length===0&&<p className="en-muted">Aún no hay productos en Commerce. No se han importado artículos de prueba del antiguo Engine.</p>}
    </section>
    {writer&&editing&&<section className="en-panel"><h2>Editar referencia</h2><form className="commerce-form" onSubmit={e=>{e.preventDefault();void run(async()=>{
     const cents=editPrice.trim()?Math.round(Number(editPrice)*100):null;
     if(cents!==null&&(!Number.isInteger(cents)||cents<=0))throw Error('PVP incorrecto');
     await call('update_listing',{variantId:editing,patch:{
      price_cents:cents,vat_basis_points:editVat===''?null:Number(editVat),status:editStatus
     }});
     setEditing(null);await refresh();setNotice('Cambios guardados en Commerce.');
    });}}>
     <label>PVP EUR<input type="number" step="0.01" min="0.01" value={editPrice} onChange={e=>setEditPrice(e.target.value)}/></label>
     <label>IVA<select value={editVat} onChange={e=>setEditVat(e.target.value)}><option value="">Sin configurar</option>
      <option value="2100">21 %</option><option value="1000">10 %</option><option value="400">4 %</option><option value="0">0 %</option></select></label>
     <label>Publicación<select value={editStatus} onChange={e=>setEditStatus(e.target.value)}>
      <option value="draft">Borrador</option><option value="active">Publicado</option><option value="archived">Archivado</option></select></label>
     <div className="commerce-form-wide"><button disabled={busy}>Guardar cambios</button> <button type="button" className="en-ghost" onClick={()=>setEditing(null)}>Cancelar</button></div>
    </form></section>}
   </>}
   {data&&view==='inventory'&&<>
    {canStock&&<section className="en-panel commerce-panel"><p className="en-eyebrow">MOVIMIENTO TRAZABLE</p><h2>Registrar entrada o ajuste</h2>
     <form className="commerce-form" onSubmit={e=>{e.preventDefault();void run(async()=>{
      if(!variantId||!Number.isInteger(Number(delta))||Number(delta)===0)throw Error('Introduce una cantidad válida');
      await call('stock_adjust',{variantId,delta:Number(delta),reason,requestId:crypto.randomUUID()});
      setDelta('');setReason('');await refresh();setNotice('Movimiento confirmado y contabilizado en PostgreSQL.');
     });}}>
      <label>Referencia<select required value={variantId} onChange={e=>setVariantId(e.target.value)}>
       <option value="">Selecciona un SKU</option>{products.map(p=><option value={p.id} key={p.id}>{p.sku} · {p.name}</option>)}</select></label>
      <label>Unidades (+ entrada / − ajuste)<input type="number" required step="1" min="-100000" max="100000" value={delta} onChange={e=>setDelta(e.target.value)} placeholder="10"/></label>
      <label className="commerce-form-wide">Motivo obligatorio<input required minLength={5} maxLength={500} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Recepción de mercancía, albarán ..."/></label>
      <div className="commerce-form-wide"><button disabled={busy||!products.length}>Registrar movimiento</button></div>
     </form>
    </section>}
    <section className="en-panel"><h2>Stock por SKU</h2>
     <div className="en-table-wrap"><table><thead><tr><th>SKU</th><th>Físico</th><th>Reservado</th><th>Comprometido</th><th>Dañado</th><th>Disponible</th></tr></thead>
      <tbody>{products.map(p=><tr key={p.id}><td><strong>{p.sku}</strong><small className="commerce-subtext">{p.name} · {p.language}</small></td>
       <td>{p.onHand}</td><td>{p.reserved}</td><td>{p.committed}</td><td>{p.damaged}</td><td><strong>{p.stock}</strong></td></tr>)}</tbody>
     </table></div>{products.length===0&&<p className="en-muted">Crea un producto antes de registrar mercancía.</p>}
    </section>
   </>}
   {data&&view==='sourcing'&&<SoraSourcing request={(action,payload={})=>call(action,payload)} canWrite={Boolean(writer)}/>}
   {data&&view==='orders'&&<section className="en-panel"><h2>Pedidos ({data.orders.length})</h2>
    <p className="en-muted">El checkout comercial sigue desactivado. No se crean pedidos reales hasta integrar la pasarela y verificar sus webhooks.</p>
    <div className="en-table-wrap"><table><thead><tr><th>Fecha</th><th>Estado</th><th>Total</th>{data.staff.role!=='viewer'&&<th>ID interno</th>}</tr></thead>
      <tbody>{data.orders.map((o,i)=><tr key={o.id||String(i)}><td>{new Date(o.created_at).toLocaleDateString('es-ES')}</td>
       <td>{o.status}</td><td>{format(o.total_cents)}</td>{data.staff.role!=='viewer'&&<td>{o.id||'—'}</td>}</tr>)}</tbody>
    </table></div>
    {!data.orders.length&&<p className="en-muted">No hay pedidos registrados.</p>}
   </section>}
  </section>
 </main>;
}
