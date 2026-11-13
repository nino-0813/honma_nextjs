// @vitest-environment node
import { afterEach,it,expect,vi } from 'vitest';
const m=vi.hoisted(()=>({create:vi.fn()}));
vi.mock('stripe',()=>({default:class{
  customers={list:async()=>({data:[{id:'cus_fixture'}]})};paymentIntents={create:m.create};
}}));
import {POST} from '../app/api/create-subscription/route';
afterEach(()=>{vi.unstubAllEnvs();vi.resetAllMocks();});
it('does not trust a checkout client to supply the split billing manifest',async()=>{
  vi.stubEnv('STRIPE_SECRET_KEY','fixture');m.create.mockResolvedValue({id:'pi_fixture',client_secret:'fixture',livemode:false});
  const response=await POST(new Request('http://localhost/api/create-subscription',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
    email:'fixture@example.invalid',interval:'monthly',idempotency_key:'fixture_initial',shipping_cost:600,
    items:[{product_id:'rice',product_title:'Rice',unit_price:1000,quantity:1}],
    metadata:{split_plan_version:'1',split_plan_0:'forged',subtotal:'1000'},
  })}));
  expect(response.status).toBe(200);
  expect(m.create.mock.calls[0][0].metadata).toMatchObject({type:'subscription_init',interval:'monthly',subtotal:'1000'});
  expect(m.create.mock.calls[0][0].metadata.split_plan_version).toBeUndefined();expect(m.create.mock.calls[0][0].metadata.split_plan_0).toBeUndefined();
});
