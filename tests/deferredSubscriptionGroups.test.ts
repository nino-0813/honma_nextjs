// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { buildBillingGroups, freezeBillingGroups, createBillingGroups, quoteBillingGroupShipping } from '../lib/deferredSubscriptionGroups';
import { datedShipmentShippingPlan, shipmentShippingPlan } from '../lib/shippingRates';
import { scopeSubscriptionItems, subscriptionOrders } from '../lib/subscriptionScope';
import { mergeSubscriptionMetadata } from '../lib/subscriptionSnapshots';
import { nextShipmentProduct, orderShipmentDay } from '../lib/adminShipmentData';
import { shipmentTargets } from '../lib/shipmentHandoff';
const checkout = new Date('2026-07-08T12:00:00Z');
const items = [
  {id:'early-item',product_id:'early',product_title:'Earlier rice',product_price:1000,quantity:2,is_subscription:true},
  {id:'later-item',product_id:'later',product_title:'Later rice',product_price:3000,quantity:1,is_subscription:true},
];
const products = [{id:'early',first_shipping_override_date:'2026-10-15'}, {id:'later',first_shipping_override_date:'2026-11-15'}];
const pi = {id:'pi_fixture',customer:'cus_fixture',payment_method:'pm_fixture',created:checkout.getTime()/1000,metadata:{interval:'monthly'}};
const order = {id:'order_fixture',subscription_interval:'monthly'};
const build = (interval='monthly',prods=products) => buildBillingGroups(items,prods,checkout,interval,1200);
const date = (unix:number) => new Date(unix*1000+9*3600000).toISOString().slice(0,10);
beforeEach(() => {vi.useFakeTimers();vi.setSystemTime(checkout);vi.stubGlobal('fetch',vi.fn(() => {throw Error('External communication forbidden');}));});
afterEach(() => {vi.useRealTimers();vi.unstubAllGlobals();});
it.each([['monthly',['2026-11-10','2026-12-10']],['bimonthly',['2026-12-10','2027-01-10']],['quarterly',['2027-01-10','2027-02-10']]])('anchors each first shipment with %s cadence', (interval,expected) => {
  const groups=build(interval as string);
  expect(groups.map(group => date(group.anchor))).toEqual(expected);
  expect(groups.map(group => group.items.map(item => item.id))).toEqual([['early-item'],['later-item']]);
  expect(groups[0].items[0].quantity).toBe(2);
});
it('keeps same-date items together, uses the fallback for past/unset overrides, and leaves weekly untouched', () => {
  expect(build('monthly',products.map(p => ({...p,first_shipping_override_date:'2026-10-15'})))).toHaveLength(1);
  expect(build('monthly',products.map(p => ({...p,first_shipping_override_date:'2026-01-15'})))[0].firstShipping).toBe('2026-07-15');
  expect(build('weekly')).toEqual([]);
});
const links = {early:['shipping'],later:['shipping']};
const methods = [{id:'shipping',fee_type:'uniform',uniform_fee:600,max_items_per_box:3}];
it('calculates separate shipping by actual shipment, not by splitting the old combined fee', () => {
  const inputs=items.map(item => ({product_id:item.product_id,title:item.product_title,quantity:item.quantity,free:false}));
  expect(shipmentShippingPlan(inputs,links,methods,'東京都').totalCost).toBe(600);
  const separate=datedShipmentShippingPlan(inputs.map((item,index) => ({...item,firstShipping:products[index].first_shipping_override_date})),links,methods,'東京都');
  expect(separate.totalCost).toBe(1200);
  expect(separate.shipments.map(s => s.totalCost)).toEqual([600,600]);
});
it('supports regional legacy keys, size-box combinations, quantities and explicitly free items', () => {
  const input=[{product_id:'early',title:'Rice',quantity:3,free:false}];
  expect(shipmentShippingPlan(input,links,[{id:'shipping',fee_type:'area',max_items_per_box:2,area_fees:{kanto:700}}],'東京都').totalCost).toBe(1400);
  expect(shipmentShippingPlan(input,links,[{id:'shipping',fee_type:'size',size_fees:{small:{max_items_per_box:1,area_fees:{kanto_area:500}},large:{max_items_per_box:2,area_fees:{kanto_area:800}}}}],'東京都').totalCost).toBe(1300);
  expect(shipmentShippingPlan([{...input[0],free:true}],{},[],'東京都').totalCost).toBe(0);
  expect(() => shipmentShippingPlan(input,{},methods,'東京都')).toThrow();
  expect(() => shipmentShippingPlan(input,links,[{id:'shipping',fee_type:'area',area_fees:{hokkaido:800}}],'東京都')).toThrow();
});
function clients() {
  const metadata: Record<string,string>={interval:'monthly'};
  const cached = new Map<string,any>();
  const stripe={
    paymentIntents:{retrieve:vi.fn(async()=>({metadata:{...metadata}})),update:vi.fn(async(_id,params)=>{Object.assign(metadata,params.metadata);return {metadata};})},
    products:{create:vi.fn(async(_params:any,opts:any)=>{if(!cached.has(opts.idempotencyKey))cached.set(opts.idempotencyKey,{id:`prod_${cached.size}`});return cached.get(opts.idempotencyKey);})},
    subscriptions:{create:vi.fn(async(_params:any,opts:any)=>{if(!cached.has(opts.idempotencyKey))cached.set(opts.idempotencyKey,{id:`sub_${cached.size}`});return cached.get(opts.idempotencyKey);})},
  };
  const update=vi.fn();
  const db={from:()=>({update:(value:any)=>{update(value);return {eq:async()=>({error:null})};}})};
  return {stripe,db,metadata,update};
}
const quote = (groups:ReturnType<typeof build>) => async()=>{groups.forEach(g=>{g.shipping=600;});};
it('freezes membership, dates and postage before creates, and ignores later product-setting edits on retry',async()=>{
  const {stripe,db,update}=clients();const groups=build();
  const plan=await freezeBillingGroups(stripe,pi,groups,'monthly',1200,quote(groups));
  await createBillingGroups(stripe,db,pi,order,plan!,{interval:'month',interval_count:1});
  const changed=build('monthly',products.map(p=>({...p,first_shipping_override_date:'2027-02-15'})));
  const noQuote=vi.fn();const retry=await freezeBillingGroups(stripe,pi,changed,'monthly',1200,noQuote);
  expect(noQuote).not.toHaveBeenCalled();expect(retry!.map(g=>g.firstShipping)).toEqual(['2026-10-15','2026-11-15']);
  await createBillingGroups(stripe,db,pi,order,retry!,{interval:'month',interval_count:1});
  expect(stripe.subscriptions.create).toHaveBeenCalledTimes(2);expect(update).toHaveBeenCalledTimes(2);
  expect(stripe.subscriptions.create.mock.calls.map(call=>call[0].metadata.source_item_ids)).toEqual(['["early-item"]','["later-item"]']);
});
it('resumes after only the first contract is created, without duplicating it',async()=>{
  const {stripe,db,update}=clients();const create=stripe.subscriptions.create.getMockImplementation()!;
  stripe.subscriptions.create.mockImplementationOnce(create).mockRejectedValueOnce(Error('Temporary Stripe failure')).mockImplementation(create);
  const groups=build();await freezeBillingGroups(stripe,pi,groups,'monthly',1200,quote(groups));
  await expect(createBillingGroups(stripe,db,pi,order,groups,{interval:'month',interval_count:1})).rejects.toThrow();expect(update).not.toHaveBeenCalled();
  const retry=await freezeBillingGroups(stripe,pi,build(),'monthly',1200,vi.fn());
  await createBillingGroups(stripe,db,pi,order,retry!,{interval:'month',interval_count:1});
  expect(stripe.subscriptions.create).toHaveBeenCalledTimes(3);
  expect(stripe.subscriptions.create.mock.calls[0][0].metadata.source_item_ids).not.toBe(stripe.subscriptions.create.mock.calls[2][0].metadata.source_item_ids);
});
it('fails closed for old incomplete retries, mismatched item snapshots or malformed stored plans',async()=>{
  const {stripe,metadata,db}=clients();const groups=build();await freezeBillingGroups(stripe,pi,groups,'monthly',1200,quote(groups));
  metadata.split_plan_fingerprint='changed';await expect(freezeBillingGroups(stripe,pi,build(),'monthly',1200,quote(groups))).rejects.toThrow();
  vi.setSystemTime(new Date(checkout.getTime()+24*3600000));await expect(createBillingGroups(stripe,db,pi,order,groups,{interval:'month',interval_count:1})).rejects.toThrow();
  expect(stripe.subscriptions.create).not.toHaveBeenCalled();
});
it('does not introduce new contract metadata when the initial dates match',async()=>{
  const {stripe}=clients();const groups=build('monthly',products.map(p=>({...p,first_shipping_override_date:'2026-10-15'})));
  expect(await freezeBillingGroups(stripe,pi,groups,'monthly',1200,vi.fn())).toBeNull();expect(stripe.paymentIntents.update).not.toHaveBeenCalled();
});
it('never multiplies same-day postage when metadata limits require several chunks',async()=>{
  const many=Array.from({length:18},(_,index)=>({...items[0],id:`item-${String(index).padStart(2,'0')}`}));
  const groups=buildBillingGroups([...many,items[1]],products,checkout,'monthly',1200);
  const db={from:(table:string)=>({select:()=>({in:async()=>({data:table==='product_shipping_methods'?[{product_id:'early',shipping_method_id:'shipping'},{product_id:'later',shipping_method_id:'shipping'}]:[{...methods[0],max_items_per_box:100}],error:null})})})};
  await quoteBillingGroupShipping(db,{shipping_address:'東京都千代田区'},groups,products);
  expect(groups.reduce((sum,g)=>sum+g.shipping,0)).toBe(1200);
});
it('scopes original items, preserves old contracts, and keeps immutable scope during sync',()=>{
  const metadata={billing_group_version:'1',order_id:'initial',source_item_ids:'["later-item"]',recurring_shipping_yen:'600'};
  expect(scopeSubscriptionItems(items,metadata)).toEqual([items[1]]);expect(scopeSubscriptionItems(items,{})).toBe(items);
  expect(()=>scopeSubscriptionItems(items,{...metadata,source_item_ids:'["unknown"]'})).toThrow();
  expect(mergeSubscriptionMetadata(metadata,{source_item_ids:'["early-item"]'}).source_item_ids).toBe('["later-item"]');
  const sub={stripe_subscription_id:'sub_later',created_at:checkout.toISOString(),status:'trialing',interval:'monthly',next_billing_at:'2026-12-09T20:00:00Z',metadata:{...metadata,first_shipping_override:'2026-11-15'}};
  const orders=[{id:'initial',stripe_subscription_id:'sub_early',created_at:checkout.toISOString(),order_status:'processing',order_items:items}];
  expect(subscriptionOrders(sub,orders)[0].order_items).toEqual([items[1]]);expect(nextShipmentProduct(sub,orders)).toBe('Later rice');
  expect(shipmentTargets(sub,orders,'2026-11')[0].orderId).toBeNull(); // never ship the other group's items through an order-level handoff
  expect(orderShipmentDay({id:'renewal',created_at:'2027-01-02',subscription_shipping_date:'2026-12-15'},sub,'renewal')).toBe('2026-12-15');
});
