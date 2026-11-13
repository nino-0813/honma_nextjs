// @vitest-environment node
import { beforeEach,afterEach,it,expect,vi } from 'vitest';
const m=vi.hoisted(()=>({from:vi.fn(),rpc:vi.fn(),event:{} as any,product:vi.fn(),create:vi.fn(),retrievePI:vi.fn(),updatePI:vi.fn()}));
vi.mock('@supabase/supabase-js',()=>({createClient:()=>({from:m.from,rpc:m.rpc})}));
vi.mock('@/lib/brevo',()=>({sendBrevoEmail:vi.fn()}));
vi.mock('@/lib/stripePaymentMethod',()=>({resolveStripePaymentMethod:async()=> 'card'}));
vi.mock('stripe',()=>({default:class {
  webhooks={constructEvent:()=>m.event};products={create:m.product};subscriptions={create:m.create};paymentIntents={retrieve:m.retrievePI,update:m.updatePI};
}}));
import {POST} from '../app/api/stripe-webhook/route';
let order:any,products:any[],metadata:Record<string,string>,items:any[],writes:any[];
const deliver=()=>POST(new Request('http://localhost/api/stripe-webhook',{method:'POST',headers:{'stripe-signature':'fixture'},body:'{}'}));
beforeEach(()=>{
  vi.useFakeTimers();vi.setSystemTime(new Date('2026-07-08T12:00:00Z'));
  for(const [key,value] of Object.entries({STRIPE_SECRET_KEY:'fixture',STRIPE_WEBHOOK_SECRET:'fixture',SUPABASE_URL:'http://127.0.0.1:1',SUPABASE_SERVICE_ROLE_KEY:'fixture',GAS_URL:''}))vi.stubEnv(key,value);
  vi.stubGlobal('fetch',vi.fn(()=>{throw Error('External communication forbidden');}));
  metadata={type:'subscription_init',interval:'monthly'};writes=[];
  order={id:'original',created_at:'2026-07-08T12:00:00Z',total:5200,subtotal:4000,shipping_cost:1200,payment_status:'paid',subscription_interval:'monthly',shipping_address:'東京都千代田区',stripe_subscription_id:null};
  products=[{id:'early',first_shipping_override_date:'2026-10-15'},{id:'later',first_shipping_override_date:'2026-11-15'}];
  items=[{id:'early-item',product_id:'early',product_title:'Early rice',product_price:1000,quantity:1,is_subscription:true},{id:'later-item',product_id:'later',product_title:'Later rice',product_price:3000,quantity:1,is_subscription:true}];
  m.event={id:'evt_initial',type:'payment_intent.succeeded',data:{object:{id:'pi_fixture',created:Date.now()/1000,amount_received:5200,customer:'cus_fixture',payment_method:'pm_fixture',metadata:{...metadata}}}};
  m.retrievePI.mockImplementation(async()=>({metadata:{...metadata}}));
  m.updatePI.mockImplementation(async(_id,params)=>{Object.assign(metadata,params.metadata);return {metadata:{...metadata}};});
  const cache=new Map<string,any>();
  m.product.mockImplementation(async(_p,opts)=>{if(!cache.has(opts.idempotencyKey))cache.set(opts.idempotencyKey,{id:`prod_${cache.size}`});return cache.get(opts.idempotencyKey);});
  m.create.mockImplementation(async(_p,opts)=>{if(!cache.has(opts.idempotencyKey))cache.set(opts.idempotencyKey,{id:`sub_${cache.size}`});return cache.get(opts.idempotencyKey);});
  m.rpc.mockResolvedValue({error:null});
  m.from.mockImplementation((table:string)=>{
    let update:any=null;
    const q:any={
      select:()=>q,eq:()=>q,in:()=>q,delete:()=>q,
      insert:()=>q,update:(value:any)=>{update=value;return q;},
      maybeSingle:async()=>({data:table==='orders'?{...order}:null,error:null}),
      then:(resolve:any)=>{
        if(update){writes.push({table,value:update});if(table==='orders')Object.assign(order,update);}
        const data=table==='order_items'?items:table==='products'?products:table==='product_shipping_methods'?[{product_id:'early',shipping_method_id:'shipping'},{product_id:'later',shipping_method_id:'shipping'}]:table==='shipping_methods'?[{id:'shipping',fee_type:'uniform',uniform_fee:600,max_items_per_box:3}]:null;
        return Promise.resolve({data,error:null}).then(resolve);
      },
    };return q;
  });
});
afterEach(()=>{vi.resetAllMocks();vi.unstubAllEnvs();vi.unstubAllGlobals();vi.useRealTimers();});
it('splits the real payment webhook into independent November/December renewals without charging again',async()=>{
  expect((await deliver()).status).toBe(200);
  expect(m.create).toHaveBeenCalledTimes(2);
  const params=m.create.mock.calls.map(call=>call[0]);
  expect(params.map(p=>new Date(p.trial_end*1000).toISOString())).toEqual(['2026-11-09T20:00:00.000Z','2026-12-09T20:00:00.000Z']);
  expect(params.map(p=>p.metadata.first_shipping_override)).toEqual(['2026-10-15','2026-11-15']);
  expect(params.map(p=>p.items.map((item:any)=>item.price_data.unit_amount))).toEqual([[1000,600],[3000,600]]);
  expect(order.stripe_subscription_id).toMatch(/^sub_/);expect(order.total).toBe(5200);expect(m.rpc).not.toHaveBeenCalled();
  expect((await deliver()).status).toBe(200);expect(m.create).toHaveBeenCalledTimes(2);
});
it('retries an interrupted split after payment without billing or duplicating the completed group',async()=>{
  const create=m.create.getMockImplementation()!;
  m.create.mockImplementationOnce(create).mockRejectedValueOnce(Error('Temporary failure')).mockImplementation(create);
  expect((await deliver()).status).toBe(503);expect(order.stripe_subscription_id).toBeNull();
  products=products.map(product=>({...product,first_shipping_override_date:'2027-02-15'}));
  expect((await deliver()).status).toBe(200);expect(m.create).toHaveBeenCalledTimes(3);
  expect(m.create.mock.calls[2][0].metadata.first_shipping_override).toBe('2026-11-15');
  expect(m.rpc).not.toHaveBeenCalled();
});
it('does not create a new split or rewrite existing customer contracts',async()=>{
  order.stripe_subscription_id='sub_existing';
  expect((await deliver()).status).toBe(200);expect(m.create).not.toHaveBeenCalled();expect(m.retrievePI).not.toHaveBeenCalled();
});
it('fails before creating contracts if shipment postage differs from the accepted checkout amount',async()=>{
  order.shipping_cost=600;
  expect((await deliver()).status).toBe(503);expect(m.create).not.toHaveBeenCalled();expect(m.product).not.toHaveBeenCalled();
});
it('keeps same-date carts on one contract with an idempotent create key',async()=>{
  products=products.map(product=>({...product,first_shipping_override_date:'2026-10-15'}));
  expect((await deliver()).status).toBe(200);expect(m.create).toHaveBeenCalledTimes(1);
  const [params,options]=m.create.mock.calls[0];
  expect(params.metadata.billing_group_version).toBeUndefined();
  expect(new Date(params.trial_end*1000).toISOString()).toBe('2026-11-09T20:00:00.000Z');
  expect(options.idempotencyKey).toBe('subscription-init-v1:pi_fixture:contract');
});
