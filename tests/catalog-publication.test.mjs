import test from 'node:test';
import assert from 'node:assert/strict';
import {productSlug,publicationIssues,publicAvailability} from '../lib/commerce/catalog.ts';

test('new product slug follows the complete entered title, not only first letter',()=>{
 assert.equal(productSlug('30th CELEBRATION [M6a]'),'30th-celebration-m6a');
 assert.equal(productSlug('Pokémon 151 JP'),'pokemon-151-jp');
});
test('draft is never exposed and published zero-stock is visible but not purchasable',()=>{
 assert.equal(publicAvailability('draft',10),'HIDDEN');
 assert.equal(publicAvailability('active',0),'OUT_OF_STOCK');
 assert.equal(publicAvailability('active',3),'AVAILABLE');
});
test('publication is blocked without price and VAT but not without stock',()=>{
 assert.deepEqual(publicationIssues({slug:'30th-celebration-m6a-jp',name:'30th CELEBRATION',
   priceCents:17718,vatBasisPoints:2100,active:true}),[]);
 assert.equal(publicationIssues({slug:'30th-celebration-m6a-jp',name:'30th CELEBRATION',
   priceCents:null,vatBasisPoints:2100,active:true}).length,1);
 assert.equal(publicationIssues({slug:'30th-celebration-m6a-jp',name:'30th CELEBRATION',
   priceCents:17718,vatBasisPoints:null,active:true}).length,1);
 assert.ok(publicationIssues({slug:'',name:'bad',priceCents:100,vatBasisPoints:2100}).length>0);
});
