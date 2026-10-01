/** Soriko Engine 1.0.0. Pure, deterministic calculations. No network, clock or LLM. */
export const MODEL_VERSION = 'soriko-engine-1.0.0';
export type Evidence = {
  id: string; source: string; seller: string | null; observedAt: string;
  kind: 'ASKING' | 'SOLD'; totalEur: number | null; identityVerified: boolean;
  shippingKnown: boolean; available: boolean; soldAt?: string | null;
};
export type MarketValue = {
  basis: 'OBSERVED_SALES' | 'ASKING' | 'SOURCE_GUIDE' | 'INSUFFICIENT';
  value: number | null; low: number | null; high: number | null;
  qualityScore: number; sampleSize: number; sourceCount: number;
  sellerCount: number; outliers: number; sales30d: number | null;
  liquidity: 'UNKNOWN' | 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  liquidityScore: number | null; asOf: string | null; reasons: string[];
};
const clamp = (x: number, low: number, high: number) => Math.max(low, Math.min(high, x));
export const round2 = (x: number) => Math.round((x + Number.EPSILON) * 100) / 100;
function finite(x: number, name: string, min = 0, max = 1e9): number {
  if (!Number.isFinite(x) || x < min || x > max) throw new Error(`INVALID_${name}`);
  return x;
}
export function median(values: number[]): number | null {
  if (!values.length) return null;
  const a = [...values].sort((x, y) => x - y), n = a.length;
  return n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2;
}
function quantile(a: number[], p: number): number {
  const b = [...a].sort((x, y) => x - y), i = (b.length - 1) * p;
  return b[Math.floor(i)] + (b[Math.ceil(i)] - b[Math.floor(i)]) * (i % 1);
}
export function weightedMedian(rows: {value: number; weight: number}[]): number | null {
  const a = rows.filter(r => Number.isFinite(r.value) && r.weight > 0).sort((x,y) => x.value - y.value);
  const half = a.reduce((s, r) => s + r.weight, 0) / 2;
  let sum = 0;
  for (const r of a) { sum += r.weight; if (sum >= half) return r.value; }
  return null;
}
export function calculateMarket(rows: Evidence[], nowIso: string, guide?: {value: number | null; asOf: string}): MarketValue {
  const now = Date.parse(nowIso);
  if (!Number.isFinite(now)) throw new Error('INVALID_CLOCK');
  const empty: MarketValue = {basis:'INSUFFICIENT',value:null,low:null,high:null,qualityScore:0,
    sampleSize:0,sourceCount:0,sellerCount:0,outliers:0,sales30d:null,liquidity:'UNKNOWN',liquidityScore:null,asOf:null,reasons:[]};
  // Polling a listing 24 times is not 24 independent offers, nor 24 sales.
  const latest = new Map<string, Evidence>();
  for (const r of rows) {
    if (!r.identityVerified || !r.shippingKnown || r.totalEur == null || !Number.isFinite(r.totalEur) || r.totalEur <= 0) continue;
    const date = Date.parse(r.kind === 'SOLD' ? r.soldAt ?? '' : r.observedAt);
    if (!Number.isFinite(date) || date > now + 60000 || now - date > (r.kind === 'SOLD' ? 30 : 2) * 86400000) continue;
    if (r.kind === 'ASKING' && !r.available) continue;
    const key = `${r.source}:${r.id}:${r.kind}`;
    if (!latest.has(key) || Date.parse(latest.get(key)!.observedAt) < Date.parse(r.observedAt)) latest.set(key, r);
  }
  const all = [...latest.values()], sold = all.filter(r => r.kind === 'SOLD');
  const cohort = sold.length >= 3 ? sold : all.filter(r => r.kind === 'ASKING');
  if (!cohort.length) {
    const t = Date.parse(guide?.asOf ?? '');
    if (guide?.value && Number.isFinite(guide.value) && guide.value > 0 && Number.isFinite(t) && now >= t && now - t <= 7 * 86400000) {
      return {...empty,basis:'SOURCE_GUIDE',value:round2(guide.value),qualityScore:now - t <= 2 * 86400000 ? 25 : 10,
        sourceCount:1,asOf:guide.asOf,reasons:['AGGREGATED_GUIDE_NOT_EXECUTABLE_PRICE','LANGUAGE_CONDITION_SHIPPING_NOT_SEGMENTED','NO_OBSERVABLE_SALES_VOLUME']};
    }
    return {...empty,reasons:['NO_FRESH_COMPARABLE_EVIDENCE']};
  }
  const values = cohort.map(r => r.totalEur!), m = median(values)!, mad = median(values.map(v => Math.abs(v-m)))!;
  const q1 = quantile(values,.25), q3 = quantile(values,.75), iqr = q3 - q1;
  const valid = cohort.filter(r => {
    if (cohort.length < 5) return true;
    if (mad > 0) return Math.abs(r.totalEur!-m) <= 3.5 * 1.4826 * mad;
    if (iqr > 0) return r.totalEur! >= q1-1.5*iqr && r.totalEur! <= q3+1.5*iqr;
    return Math.abs(r.totalEur!-m) <= m*.25;
  });
  // Cap effective weight per seller and source. Unknown sellers form ONE cluster per source.
  const sellerCounts = new Map<string,number>(), sourceCounts = new Map<string,number>();
  for (const r of valid) { const k = `${r.source}:${r.seller ?? 'unknown'}`; sellerCounts.set(k,(sellerCounts.get(k)??0)+1); sourceCounts.set(r.source,(sourceCounts.get(r.source)??0)+1); }
  const weighted = valid.map(r => ({value:r.totalEur!,weight:Math.exp(-(now-Date.parse(r.kind==='SOLD'?r.soldAt!:r.observedAt))/(7*86400000)) /
    Math.max(sellerCounts.get(`${r.source}:${r.seller??'unknown'}`)!,sourceCounts.get(r.source)!/3)}));
  const basis = sold.length >= 3 ? 'OBSERVED_SALES' : 'ASKING';
  const sources = new Set(valid.map(r=>r.source)).size;
  const sellers = new Set(valid.filter(r=>r.seller).map(r=>`${r.source}:${r.seller}`)).size;
  const salesCount = sold.length || null;
  const liquidityScore = salesCount == null ? null : Math.round(clamp(salesCount/30*100,0,100));
  const quality = Math.round(Math.min(basis==='ASKING'?65:95, valid.length*3 + sources*15 + sellers*4));
  return {basis,value:round2(weightedMedian(weighted)!),low:round2(quantile(valid.map(r=>r.totalEur!),.25)),high:round2(quantile(valid.map(r=>r.totalEur!),.75)),
    qualityScore:quality,sampleSize:valid.length,sourceCount:sources,sellerCount:sellers,outliers:cohort.length-valid.length,
    sales30d:salesCount,liquidityScore,liquidity:liquidityScore==null?'UNKNOWN':liquidityScore>=80?'VERY_HIGH':liquidityScore>=60?'HIGH':liquidityScore>=30?'MEDIUM':liquidityScore>=10?'LOW':'VERY_LOW',
    asOf:valid.reduce((t,r)=>r.observedAt>t?r.observedAt:t,valid[0].observedAt),
    reasons:[...(basis==='ASKING'?['ASKING_PRICES_ARE_NOT_SALES']:[]),...(sources<2?['SINGLE_SOURCE']:[]),...(sellers<3?['FEW_INDEPENDENT_SELLERS']:[])]};
}
export type EconomicsInput = {
  quantity:number; unitPurchaseEur:number; japanShippingTotalEur:number|null;
  proxyTotalEur:number|null; consolidationTotalEur:number|null; internationalShippingTotalEur:number|null;
  dutyTotalEur:number|null; adminTotalEur:number|null; otherTotalEur:number|null;
  importVatTotalEur:number|null; recoverableVatTotalEur:number|null;
  saleGrossEur:number; customerShippingGrossEur:number; outputVatRate:number;
  feeRate:number; fixedFeeEur:number; packagingEur:number; deliveryCostEur:number;
  returnsReserveRate:number; targetMargin:number;
};
export function calculateEconomics(x: EconomicsInput) {
  const q=finite(x.quantity,'QUANTITY',1,10000); if (!Number.isInteger(q)) throw new Error('INVALID_QUANTITY');
  finite(x.unitPurchaseEur,'PURCHASE'); finite(x.saleGrossEur,'SALE',.01);
  for(const k of ['outputVatRate','feeRate','returnsReserveRate','targetMargin'] as const) finite(x[k],k,0,k==='targetMargin'?.99:1);
  for(const k of ['customerShippingGrossEur','fixedFeeEur','packagingEur','deliveryCostEur'] as const) finite(x[k],k);
  const costs=['japanShippingTotalEur','proxyTotalEur','consolidationTotalEur','internationalShippingTotalEur','dutyTotalEur','adminTotalEur','otherTotalEur','importVatTotalEur','recoverableVatTotalEur'] as const;
  const missing=costs.filter(k=>x[k]==null);
  costs.forEach(k=>{if(x[k]!=null)finite(x[k]!,k);});
  const cents=(v:number)=>Math.round(v*100);
  const importVat=cents(x.importVatTotalEur??0), recovered=cents(x.recoverableVatTotalEur??0);
  if(recovered>importVat)throw new Error('RECOVERABLE_VAT_EXCEEDS_IMPORT_VAT');
  const purchase=cents(x.unitPurchaseEur)*q;
  const inbound=costs.filter(k=>k!=='recoverableVatTotalEur').reduce((sum,k)=>sum+cents(x[k]??0),0);
  const cashTotal=purchase+inbound, economicTotal=cashTotal-recovered;
  const cashUnit=cashTotal/q, economicUnit=economicTotal/q;
  const saleGross=cents(x.saleGrossEur)+cents(x.customerShippingGrossEur);
  const net=Math.round(saleGross/(1+x.outputVatRate));
  const fees=Math.round(saleGross*x.feeRate)+cents(x.fixedFeeEur);
  const reserve=Math.round(saleGross*x.returnsReserveRate);
  const selling=fees+reserve+cents(x.packagingEur)+cents(x.deliveryCostEur);
  const contribution=net-economicUnit-selling;
  const maxLanded=Math.max(0,Math.floor(net*(1-x.targetMargin)-selling));
  const maxPurchase=Math.max(0,maxLanded-(inbound-recovered)/q);
  const downGross=Math.round(saleGross*.9), downNet=Math.round(downGross/(1+x.outputVatRate));
  const downside=downNet-economicUnit-cents(x.packagingEur)-cents(x.deliveryCostEur)-cents(x.fixedFeeEur)-Math.round(downGross*(x.feeRate+x.returnsReserveRate));
  return {modelVersion:MODEL_VERSION,complete:missing.length===0,missingCosts:missing,
    landedCashTotalEur:round2(cashTotal/100),landedEconomicTotalEur:round2(economicTotal/100),
    landedCashUnitEur:round2(cashUnit/100),landedEconomicUnitEur:round2(economicUnit/100),
    saleNetEur:net/100,outputVatEur:(saleGross-net)/100,sellingCostsEur:selling/100,
    contributionEur:round2(contribution/100),marginPct:round2(contribution/net*100),
    roiEconomicPct:economicUnit>0?round2(contribution/economicUnit*100):null,
    roiCashPct:cashUnit>0?round2(contribution/cashUnit*100):null,
    maxLandedEur:maxLanded/100,maxPurchaseUnitEur:round2(maxPurchase/100),
    profitIfAllSoldEur:round2(contribution*q/100),downsideContributionEur:round2(downside/100)};
}
export function assessOpportunity(e:ReturnType<typeof calculateEconomics>,m:MarketValue,opts:{identityVerified:boolean;supplierVerified:boolean;inputsVerified:boolean;maxAgeHours?:number;now:string}) {
  const blockers:string[]=[];
  if(!e.complete)blockers.push('INCOMPLETE_LANDED_COST');
  if(!opts.inputsVerified)blockers.push('ASSUMPTIONS_NOT_APPROVED');
  if(!opts.identityVerified)blockers.push('PRODUCT_IDENTITY_NOT_VERIFIED');
  if(!opts.supplierVerified)blockers.push('SUPPLIER_NOT_VERIFIED');
  if(m.basis!=='OBSERVED_SALES')blockers.push('NO_CONFIRMED_SALES_COMPARABLES');
  if(m.sourceCount<2 || m.sellerCount<3 || m.qualityScore<70)blockers.push('INSUFFICIENT_INDEPENDENT_EVIDENCE');
  if(m.asOf==null || Date.parse(opts.now)-Date.parse(m.asOf)>(opts.maxAgeHours??48)*3600000)blockers.push('STALE_MARKET_DATA');
  if(m.liquidityScore==null || m.liquidityScore<30)blockers.push('LIQUIDITY_NOT_DEMONSTRATED');
  const components={profitability:Math.round(clamp(e.marginPct/30,0,1)*25),liquidity:Math.round((m.liquidityScore??0)*.25),
    dataQuality:Math.round(m.qualityScore*.2),supplier:opts.supplierVerified?10:0,
    downside:e.downsideContributionEur>0?10:0,capitalEfficiency:Math.round(clamp((e.roiCashPct??0)/40,0,1)*10)};
  const score=Object.values(components).reduce((a,b)=>a+b,0);
  return {modelVersion:MODEL_VERSION,score,components,blockers,decision:e.contributionEur<=0?'PASS':blockers.length?'REVIEW':score>=75?'BUY_CANDIDATE':'NEGOTIATE',
    requiresHumanApproval:true,recommendedQuantity:null,profitIfAllSoldEur:e.profitIfAllSoldEur,expectedProfitEur:null};
}
export function changePct(current:number|null,previous:number|null):number|null {
  return current!=null&&previous!=null&&previous>0?round2((current/previous-1)*100):null;
}
export function normalizeText(s:string):string {return s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9faf]+/g,' ').trim();}
export function matchSealedTitle(title:string,product:{name:string;language:string;format:string;identityVerified:boolean;aliases:string[]}):{matched:boolean;reason:string} {
  if(!product.identityVerified)return {matched:false,reason:'IDENTITY_NOT_VERIFIED'};
  const t=normalizeText(title);
  if(/\b(case|lot|bundle|empty|opened|resealed|unsealed|no shrink|without shrink|fake|replica|proxy)\b/.test(t))return {matched:false,reason:'INCOMPATIBLE_VARIANT'};
  const language={JP:/\b(jp|japanese|japones|japonais|japanisch)\b/,EN:/\b(en|english|ingles|anglais|englisch)\b/,ES:/\b(es|spanish|espanol|espagnol|spanisch)\b/}[product.language];
  if(!language?.test(t))return {matched:false,reason:'LANGUAGE_NOT_EXPLICIT'};
  const languages=[/\b(jp|japanese|japones|japonais|japanisch)\b/,/\b(en|english|ingles|anglais|englisch)\b/,/\b(es|spanish|espanol|espagnol|spanisch)\b/].filter(r=>r.test(t));
  if(languages.length>1)return {matched:false,reason:'AMBIGUOUS_LANGUAGE'};
  if(product.format==='BOOSTER_BOX'&&!/\b(booster box|display|caja de sobres)\b/.test(t))return {matched:false,reason:'WRONG_UNIT'};
  if(!/\b(sealed|precintad[oa]|scelle|versiegelt|shrink)\b/.test(t))return {matched:false,reason:'SEAL_NOT_EXPLICIT'};
  if(![product.name,...product.aliases].some(a=>a.length>=5&&t.includes(normalizeText(a))))return {matched:false,reason:'NAME_NOT_MATCHED'};
  return {matched:true,reason:'EXPLICIT_ALIAS_LANGUAGE_FORMAT_SEAL'};
}
