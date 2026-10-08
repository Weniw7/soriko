'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';

const BASE=process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vgxeebazmzkncbsmcrha.supabase.co';
const KEY=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_SSDkG-X9oWgoD4qHR_bwaA_0vOG5OEv';
const API=BASE+'/functions/v1/soriko-commerce';
const CART_KEY='soriko-commerce-cart-v1';
type Product={
  id:string;productId:string;slug:string;name:string;description:string;
  category:string;setName:string|null;imageUrl:string|null;status:string;
  sku:string;language:'JP'|'EN'|'ES';edition:string;
  sealed:boolean;priceCents:number|null;vatBasisPoints:number|null;
  stock:number;
};
type Cart={variantId:string;quantity:number};
const MONEY=new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'});
const LANG:{[key:string]:string}={JP:'Japonés',EN:'Inglés',ES:'Español'};
const CATEGORY:{[key:string]:string}={
  BOOSTER_BOX:'Booster Box',ETB:'Elite Trainer Box',BUNDLE:'Booster Bundle',
  PACK:'Sobres',COLLECTION:'Collection Box',SINGLE:'Cartas',ACCESSORY:'Accesorios',OTHER:'Otros'
};

export default function ShopCatalog(){
 const [items,setItems]=useState<Product[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [search,setSearch]=useState('');
 const [lang,setLang]=useState('ALL');
 const [category,setCategory]=useState('ALL');
 const [sort,setSort]=useState('recent');
 const [cart,setCart]=useState<Cart[]>([]);
 const [hydrated,setHydrated]=useState(false);
 const [cartOpen,setCartOpen]=useState(false);
 useEffect(()=>{
  let active=true;
  fetch(API+'?action=catalog',{cache:'no-store',headers:{apikey:KEY}})
   .then(async r=>{if(!r.ok)throw new Error('CATALOG_UNAVAILABLE');return r.json() as Promise<{products:Product[]}>;})
   .then(data=>{if(active)setItems(Array.isArray(data.products)?data.products:[]);})
   .catch(()=>{if(active)setError('El catálogo no está disponible en este momento. Inténtalo más tarde.');})
   .finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[]);
 useEffect(()=>{
  try{
   const saved=JSON.parse(localStorage.getItem(CART_KEY)||'[]');
   if(Array.isArray(saved))setCart(saved.filter(x=>typeof x.variantId==='string' && Number.isInteger(x.quantity) && x.quantity>0).slice(0,40));
  }catch{}
  setHydrated(true);
 },[]);
 useEffect(()=>{if(hydrated)localStorage.setItem(CART_KEY,JSON.stringify(cart));},[cart,hydrated]);
 const results=useMemo(()=>{
  const q=search.toLowerCase().trim();
  return items.filter(p=>(lang==='ALL'||p.language===lang)
   &&(category==='ALL'||p.category===category)
   &&(!q||[p.name,p.sku,p.setName||'',p.description].some(s=>s.toLowerCase().includes(q))))
   .sort((a,b)=>sort==='price_asc'?(a.priceCents||0)-(b.priceCents||0)
    :sort==='price_desc'?(b.priceCents||0)-(a.priceCents||0):a.name.localeCompare(b.name,'es'));
 },[items,lang,category,search,sort]);
 const selected=cart.map(c=>({record:c,product:items.find(p=>p.id===c.variantId)}))
  .filter((x):x is {record:Cart;product:Product}=>Boolean(x.product));
 const subtotal=selected.reduce((sum,x)=>sum+(x.product.priceCents||0)*Math.min(x.record.quantity,x.product.stock),0);
 const cartCount=selected.reduce((sum,x)=>sum+Math.min(x.record.quantity,x.product.stock),0);
 function add(p:Product){
  if(!p.priceCents||p.stock<1)return;
  setCart(current=>{
   const existing=current.find(c=>c.variantId===p.id);
   if(existing)return current.map(c=>c.variantId===p.id?{...c,quantity:Math.min(p.stock,c.quantity+1)}:c);
   return [...current,{variantId:p.id,quantity:1}];
  });
  setCartOpen(true);
 }
 function update(id:string,qty:number){
  const p=items.find(x=>x.id===id);
  setCart(current=>current.filter(x=>x.variantId!==id)
   .map(x=>x).concat(qty>0&&p&&p.stock>0?[{variantId:id,quantity:Math.min(p.stock,qty)}]:[]));
 }
 return <>
  <div className="categoryStrip pageWidth pokemonFilters commerce-language" aria-label="Filtrar catálogo por idioma">
   {(['ALL','JP','EN','ES'] as const).map(value=><button type="button" key={value}
    aria-pressed={lang===value} className={lang===value?'activeFilter':''} onClick={()=>setLang(value)}>
    {value==='ALL'?'Todos los idiomas':LANG[value]}
   </button>)}
   <button className="commerce-cart-trigger" type="button" onClick={()=>setCartOpen(true)}
    aria-label={'Abrir carrito, '+cartCount+' productos'}>Bolsa · {cartCount}</button>
  </div>
  <section className="catalogSection pageWidth" id="anniversary">
   <div className="catalogHeading pokemonCatalogHeading">
    <div><p className="kicker">SORIKO STORE / CATÁLOGO REAL</p><h2>La colección empieza con lo que tenemos.</h2></div>
    <span>{loading?'Consultando inventario…':items.length?items.length+' referencias de inventario':'Primer drop en preparación'}</span>
   </div>
   <div className="commerce-toolbar">
    <label className="commerce-search"><span>Buscar cartas y cajas</span>
     <input type="search" value={search} onChange={e=>setSearch(e.target.value)}
      placeholder="Set, nombre o SKU…" aria-label="Buscar productos"/></label>
    <label><span>Categoría</span><select value={category} onChange={e=>setCategory(e.target.value)}>
     <option value="ALL">Todas</option>{Object.entries(CATEGORY).map(([id,label])=><option key={id} value={id}>{label}</option>)}
    </select></label>
    <label><span>Ordenar</span><select value={sort} onChange={e=>setSort(e.target.value)}>
     <option value="recent">Nombre</option><option value="price_asc">Precio: menor a mayor</option>
     <option value="price_desc">Precio: mayor a menor</option></select></label>
   </div>
   {loading&&<div className="commerce-empty" role="status">Estamos consultando el stock disponible…</div>}
   {!loading&&error&&<div className="commerce-empty" role="alert">{error}</div>}
   {!loading&&!error&&results.length===0&&<div className="commerce-empty">
    <span className="kicker">SORIKO FIRST DROP</span><h3>{items.length===0?'Pronto abriremos las primeras cajas.':'Ningún producto coincide con la búsqueda.'}</h3>
    <p>{items.length===0?'Todavía no hay mercancía publicada. Publicaremos precios y existencias únicamente cuando estén confirmados.':'Prueba otro idioma o cambia los filtros.'}</p>
    <Link href="/club/">Conocer Soriko Club →</Link>
   </div>}
   {!loading&&!error&&results.length>0&&<div className="pokemonProductGrid shopProductGrid">
    {results.map(product=><article className="pokemonProductCard" key={product.id}>
     <div className="pokemonProductVisual commerce-product-visual">
      <span className="productBadge">{LANG[product.language]} · {CATEGORY[product.category]||'Pokémon TCG'}</span>
      {product.imageUrl?<img src={product.imageUrl} alt={product.name+' '+product.language} loading="lazy"/>:
       <div className="packShape"><span>SORIKO</span><strong>{product.name}</strong><small>POKÉMON TCG · {product.language}</small></div>}
     </div>
     <div className="pokemonProductInfo">
      <span>{product.sku}</span><h3>{product.name}</h3><p>{product.description||product.setName||'Producto seleccionado por Soriko.'}</p>
      <div className="commerce-price-row"><strong>{product.priceCents!==null?MONEY.format(product.priceCents/100):'Consultar'}</strong>
       <small>{product.stock>0?product.stock+' uds. disponibles':'Agotado'}</small></div>
      <div className="productBottom"><b>{product.sealed?'SELLADO · ':''}{product.language}</b>
       <button type="button" disabled={!product.priceCents||product.stock<1} onClick={()=>add(product)}>Añadir +</button></div>
     </div>
    </article>)}
   </div>}
   <p className="demoNote">Inventario conectado a Soriko Commerce. No se aceptan pagos hasta terminar las pruebas y habilitar el checkout.</p>
  </section>
  {cartOpen&&<div className="commerce-cart-overlay" role="presentation" onClick={()=>setCartOpen(false)}>
   <aside className="commerce-cart" role="dialog" aria-modal="true" aria-label="Carrito de Soriko"
    onClick={e=>e.stopPropagation()}>
    <header><div><p className="kicker">SORIKO CLUB</p><h2>Tu selección ({cartCount})</h2></div>
     <button aria-label="Cerrar carrito" type="button" onClick={()=>setCartOpen(false)}>✕</button></header>
    <div className="commerce-cart-lines">
     {selected.length===0&&<p>Tu carrito está vacío. Explora el catálogo para añadir tus favoritos.</p>}
     {selected.map(({record,product})=><div className="commerce-cart-line" key={product.id}>
      <div><strong>{product.name}</strong><small>{product.language} · {product.sku}</small>
       <b>{MONEY.format((product.priceCents||0)/100)}</b></div>
      <div className="commerce-qty">
       <button type="button" onClick={()=>update(product.id,record.quantity-1)} aria-label={'Reducir '+product.name}>−</button>
       <span>{Math.min(record.quantity,product.stock)}</span>
       <button type="button" disabled={record.quantity>=product.stock} onClick={()=>update(product.id,record.quantity+1)} aria-label={'Aumentar '+product.name}>+</button>
      </div>
     </div>)}
    </div>
    <footer><p><span>Subtotal</span><strong>{MONEY.format(subtotal/100)}</strong></p>
     <small>Envíos e impuestos definitivos se calcularán en el checkout.</small>
     <button className="commerce-checkout-disabled" type="button" disabled>Checkout próximamente</button>
     <small>Tu selección no reserva unidades ni genera cargos.</small></footer>
   </aside>
  </div>}
 </>;
}
