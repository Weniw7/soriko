// Pure monetary and inventory helpers shared with Soriko Commerce UI/tests.
export function availableUnits(onHand:number,reserved:number,committed:number,damaged:number):number {
  const values=[onHand,reserved,committed,damaged];
  if(values.some(n=>!Number.isSafeInteger(n)||n<0))throw new Error('INVALID_STOCK');
  const available=onHand-reserved-committed-damaged;
  if(available<0)throw new Error('NEGATIVE_STOCK');
  return available;
}
export function eurosToCents(value:string):number|null {
  if(value.trim()==='')return null;
  const normalized=value.trim().replace(',','.');
  if(!/^(0|[1-9]\d{0,7})(\.\d{1,2})?$/.test(normalized))
    throw new Error('INVALID_EURO_AMOUNT');
  const [whole,fraction='']=normalized.split('.');
  const cents=Number(whole)*100+Number(fraction.padEnd(2,'0'));
  if(cents<=0||!Number.isSafeInteger(cents))throw new Error('INVALID_EURO_AMOUNT');
  return cents;
}
export function includedVatCents(grossCents:number,vatBasisPoints:number):number {
  if(!Number.isSafeInteger(grossCents)||grossCents<0||
     !Number.isSafeInteger(vatBasisPoints)||vatBasisPoints<0||vatBasisPoints>10000)
     throw new Error('INVALID_TAX_INPUT');
  return Math.round(grossCents*vatBasisPoints/(10000+vatBasisPoints));
}
