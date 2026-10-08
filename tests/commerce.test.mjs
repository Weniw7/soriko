import test from 'node:test';
import assert from 'node:assert/strict';
import {availableUnits,eurosToCents,includedVatCents} from '../lib/commerce/core.ts';

test('inventory availability subtracts all stock commitments',()=>{
  assert.equal(availableUnits(10,2,3,1),4);
  assert.throws(()=>availableUnits(1,1,1,0),/NEGATIVE_STOCK/);
  assert.throws(()=>availableUnits(2,-1,0,0),/INVALID_STOCK/);
});
test('EUR input is exact in cents and rejects precision errors',()=>{
  assert.equal(eurosToCents('12,50'),1250);
  assert.equal(eurosToCents('12.05'),1205);
  assert.equal(eurosToCents(''),null);
  assert.throws(()=>eurosToCents('12.999'),/INVALID_EURO_AMOUNT/);
  assert.throws(()=>eurosToCents('-1'),/INVALID_EURO_AMOUNT/);
});
test('VAT from tax-inclusive prices uses integer cents',()=>{
  assert.equal(includedVatCents(12100,2100),2100);
  assert.equal(includedVatCents(11000,1000),1000);
  assert.equal(includedVatCents(0,2100),0);
  assert.throws(()=>includedVatCents(100,-1),/INVALID_TAX_INPUT/);
});
