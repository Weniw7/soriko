'use client';

import {useEffect,useMemo,useState} from 'react';
import {eurosToCents} from '../../lib/commerce/core';

type SourcingCandidate={
 id:string;sora_reference:string;name:string;set_code:string|null;language:string;
 format:'BOOSTER_BOX'|'PREMIUM_DECK_SET';sora_url:string;cardmarket_url:string;
 market_floor_cents:number|null;market_trend_cents:number|null;market_avg30_cents:number|null;
 market_avg7_cents:number|null;market_avg1_cents:number|null;market_listings_count:number|null;
 market_source:'USER_SCREENSHOT'|'WEB_INDEXED';market_snapshot_date:string|null;
 market_notes:string;sora_b2b_quote_jpy:number|null;sora_b2b_eur_cents:number|null;
 sora_quote_source:string|null;fx_rate_date:string|null;
 landed_unit_cost_eur_cents:number|null;planned_pvp_eur_cents:number|null;
 quote_verified:boolean;decision:'PENDING_QUOTE'|'REVIEW'|'NO_GO'|'BUY_CANDIDATE'|'EXCLUDED';
 decision_reason:string;
};
type Fetcher=(action:string,payload?:Record<string,unknown>)=>Promise<unknown>;
const money=new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'});
const euro=(cents:number|null)=>cents===null?'—':money.format(cents/100);
const decisionText={
 PENDING_QUOTE:'Pedir precio B2B',REVIEW:'Revisar oportunidad',NO_GO:'No comprar',
 BUY_CANDIDATE:'Posible compra',EXCLUDED:'Formato excluido'
};
const formatText=(c:SourcingCandidate)=>c.format==='BOOSTER_BOX'?'Booster Box japonesa':'No es Booster Box';
function cents(s:string){
 if(!s.trim())return null;
 return eurosToCents(s);
}
export default function SoraSourcing({request,canWrite}:{
 request:Fetcher;canWrite:boolean
}){
 const [candidates,setCandidates]=useState<SourcingCandidate[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [showExcluded,setShowExcluded]=useState(false);
 const [filter,setFilter]=useState('');
 const [selected,setSelected]=useState<SourcingCandidate|null>(null);
 const [b2b,setB2b]=useState('');
 const [landed,setLanded]=useState('');
 const [pvp,setPvp]=useState('');
 const [verified,setVerified]=useState(false);
 const [status,setStatus]=useState<SourcingCandidate['decision']>('REVIEW');
 const [source,setSource]=useState('');
 const [reason,setReason]=useState('');
 const [saving,setSaving]=useState(false);
 async function load(){
  const r=await request('sourcing_list') as {candidates:SourcingCandidate[]};
  if(!Array.isArray(r.candidates))throw new Error('La lista de Sora no está disponible.');
  setCandidates(r.candidates);
 }
 useEffect(()=>{
  let alive=true;
  request('sourcing_list').then(result=>{
   const r=result as {candidates:SourcingCandidate[]};
   if(alive)setCandidates(Array.isArray(r.candidates)?r.candidates:[]);
  }).catch(e=>{if(alive)setError(e instanceof Error?e.message:'No se pudo cargar Sora');})
   .finally(()=>{if(alive)setLoading(false);});
  return()=>{alive=false;};
 },[]);
 const visible=useMemo(()=>candidates.filter(x=>(showExcluded||x.decision!=='EXCLUDED')
  &&(!filter||[x.name,x.sora_reference,x.set_code||''].join(' ').toLowerCase().includes(filter.toLowerCase())))
  .sort((a,b)=>a.name.localeCompare(b.name,'es')),[candidates,showExcluded,filter]);
 function open(c:SourcingCandidate){
  setSelected(c);setB2b(c.sora_b2b_eur_cents!==null?String(c.sora_b2b_eur_cents/100):'');
  setLanded(c.landed_unit_cost_eur_cents!==null?String(c.landed_unit_cost_eur_cents/100):'');
  setPvp(c.planned_pvp_eur_cents!==null?String(c.planned_pvp_eur_cents/100):'');
  setVerified(c.quote_verified);setStatus(c.decision);setSource(c.sora_quote_source||'');
  setReason(c.decision_reason||'');setError('');setNotice('');
 }
 async function save(e:React.FormEvent){
  e.preventDefault();
  if(!selected||!canWrite)return;
  setError('');setNotice('');setSaving(true);
  try{
   const cost=cents(b2b),allIn=cents(landed),target=cents(pvp);
   if(verified&&!source.trim())throw new Error('La cotización verificada necesita una referencia o prueba de origen.');
   if(status==='BUY_CANDIDATE'&&(!verified||allIn===null||target===null))
    throw new Error('No se puede valorar como compra sin coste total, PVP y cotización verificada.');
   await request('sourcing_update',{id:selected.id,patch:{
    sora_b2b_eur_cents:cost,
    landed_unit_cost_eur_cents:allIn,
    planned_pvp_eur_cents:target,
    quote_verified:verified,
    decision:status,
    decision_reason:reason,
    sora_quote_source:source
   }});
   await load();
   setSelected(null);
   setNotice('Valoración guardada y auditada en Supabase.');
  }catch(e){setError(e instanceof Error?e.message:'No se pudo guardar');}
  finally{setSaving(false);}
 }
 const countQuote=candidates.filter(x=>x.decision==='PENDING_QUOTE').length;
 const countRejected=candidates.filter(x=>x.decision==='NO_GO').length;
 const countExcluded=candidates.filter(x=>x.decision==='EXCLUDED').length;
 let unitCost:number|null=null, targetPrice:number|null=null;
 try{unitCost=landed.trim()?cents(landed):null;targetPrice=pvp.trim()?cents(pvp):null;}catch{}
 const netExample=unitCost!==null&&targetPrice!==null?
    Math.round(targetPrice/1.21)-unitCost:null;
 return <div className="sora-board">
  <div className="en-stats sora-stats">
   <div className="en-stat"><span>REFERENCIAS SORA</span><strong>{candidates.length}</strong><small>Comprobación por SKU de Sora</small></div>
   <div className="en-stat"><span>PENDIENTES B2B</span><strong>{countQuote}</strong><small>A la espera de cotización</small></div>
   <div className="en-stat"><span>DESCARTADAS</span><strong>{countRejected}</strong><small>Rentabilidad desfavorable</small></div>
   <div className="en-stat"><span>FUERA DE FORMATO</span><strong>{countExcluded}</strong><small>Solo Booster Boxes en seguimiento</small></div>
  </div>
  <section className="en-panel">
   <p className="en-eyebrow">SORA CARD SHOP / CARDMARKET</p>
   <h2>Comparativa de compra · japonés · EUR</h2>
   <p>Enlaces directos al proveedor y al mercado. Datos fechados: las fotografías son del 08/10/2026 y las dos fichas indexadas pueden estar desactualizadas. No hay compra ni stock automático.</p>
   <div className="sora-controls">
    <label>Buscar referencia<input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="151, TK-0164, Storm…"/></label>
    <label className="sora-check"><input type="checkbox" checked={showExcluded} onChange={e=>setShowExcluded(e.target.checked)}/> Mostrar formato excluido</label>
    <button type="button" className="en-ghost" disabled={loading} onClick={()=>{setLoading(true);setError('');void load().catch(e=>setError(String(e))).finally(()=>setLoading(false));}}>Actualizar</button>
   </div>
   {loading&&<p role="status">Leyendo catálogo de oportunidades...</p>}
   {notice&&<p className="sora-good" role="status">{notice}</p>}
   {error&&<p className="en-error" role="alert">{error}</p>}
   <div className="en-table-wrap"><table className="sora-table">
    <thead><tr><th>Producto</th><th>Cardmarket desde</th><th>Tendencia</th><th>Sora B2B</th><th>Decisión</th><th>Enlaces</th>{canWrite&&<th>Valorar</th>}</tr></thead>
    <tbody>{visible.map(x=><tr key={x.id}>
     <td><strong>{x.name}</strong><small className="commerce-subtext">{x.sora_reference} · {x.set_code} · {x.language} · {formatText(x)}</small></td>
     <td>{euro(x.market_floor_cents)}</td>
     <td>{euro(x.market_trend_cents)}</td>
     <td>{euro(x.sora_b2b_eur_cents)}{x.sora_b2b_eur_cents===null&&<small className="commerce-subtext">Consultar login</small>}
      {x.sora_b2b_eur_cents!==null&&!x.quote_verified&&<small className="commerce-subtext">Orientativo · no confirmado</small>}</td>
     <td><span className={'sora-state '+x.decision.toLowerCase()}>{decisionText[x.decision]}</span></td>
     <td><div className="sora-links"><a target="_blank" rel="noopener noreferrer" href={x.sora_url}>Sora ↗</a>
      <a target="_blank" rel="noopener noreferrer" href={x.cardmarket_url}>Cardmarket ↗</a></div></td>
     {canWrite&&<td><button type="button" className="en-ghost" onClick={()=>open(x)}>Valorar</button></td>}
    </tr>)}</tbody>
   </table></div>
   {visible.length===0&&!loading&&<p>No hay coincidencias con esta búsqueda.</p>}
   <p className="sora-footnote">* Precio mínimo anunciado, no precio de venta garantizado. No comparemos booster box con CASE, barajas, sobres sueltos o idioma coreano. El precio público no incluye necesariamente el mismo precinto ni gastos de envío.</p>
  </section>
  {selected&&<section className="en-panel sora-review">
   <p className="en-eyebrow">ANÁLISIS PRIVADO DE COMPRA</p>
   <h2>{selected.name} · {selected.sora_reference}</h2>
   <p><a target="_blank" rel="noopener noreferrer" href={selected.sora_url}>Ver ficha exacta en Sora ↗</a>
   {' · '}<a target="_blank" rel="noopener noreferrer" href={selected.cardmarket_url}>Ver mercado en Cardmarket ↗</a></p>
   <p>{selected.market_notes}</p>
   <div className="sora-reference-row">
    <span>Precio mínimo mercado <b>{euro(selected.market_floor_cents)}</b></span>
    <span>Tendencia <b>{euro(selected.market_trend_cents)}</b></span>
    <span>Media 30 días <b>{euro(selected.market_avg30_cents)}</b></span>
    <span>Media 7 días <b>{euro(selected.market_avg7_cents)}</b></span>
    <span>Media 1 día <b>{euro(selected.market_avg1_cents)}</b></span>
   </div>
   <form className="sora-edit" onSubmit={e=>void save(e)}>
    <label>Coste Sora B2B (EUR, por caja)<input type="text" inputMode="decimal" value={b2b} onChange={e=>setB2b(e.target.value)} placeholder="Pendiente"/></label>
    <label>Coste total en almacén (EUR)<input type="text" inputMode="decimal" value={landed} onChange={e=>setLanded(e.target.value)} placeholder="Sin calcular"/></label>
    <label>PVP objetivo con IVA (EUR)<input type="text" inputMode="decimal" value={pvp} onChange={e=>setPvp(e.target.value)} placeholder="A definir"/></label>
    <label className="sora-wide">Origen de la cotización<input value={source} onChange={e=>setSource(e.target.value)} maxLength={500} placeholder="Pedido Sora, fecha, proforma..."/></label>
    <label className="sora-check"><input type="checkbox" checked={verified} onChange={e=>setVerified(e.target.checked)}/> Precio B2B comprobado personalmente</label>
    <label>Valoración<select value={status} onChange={e=>setStatus(e.target.value as SourcingCandidate['decision'])}>
     <option value="PENDING_QUOTE">Pendiente de precio B2B</option><option value="REVIEW">Analizar</option>
     <option value="NO_GO">No comprar</option><option value="BUY_CANDIDATE" disabled={selected.format!=='BOOSTER_BOX'}>Posible compra</option>
     <option value="EXCLUDED">Excluir por formato</option></select></label>
    <label className="sora-wide">Motivo de la valoración<textarea rows={3} value={reason} onChange={e=>setReason(e.target.value)} maxLength={1000}/></label>
    {netExample!==null&&<p className="sora-preview sora-wide"><strong>{euro(netExample)}</strong> diferencia orientativa entre PVP sin IVA supuesto del 21% y coste puesto en almacén. <em>No es beneficio:</em> faltan comisiones de cobro, embalaje, incidencias y otros gastos.</p>}
    <div className="sora-wide sora-action-row"><button type="submit" disabled={saving}>{saving?'Guardando...':'Guardar valoración'}</button>
     <button type="button" className="en-ghost" onClick={()=>setSelected(null)}>Cancelar</button></div>
   </form>
   {error&&<p className="en-error" role="alert">{error}</p>}
  </section>}
 </div>;
}
