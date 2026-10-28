import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const mock = vi.hoisted(() => ({rpc:vi.fn(),from:vi.fn()}));
vi.mock('../lib/supabase', () => ({supabase:mock}));
import InventoryAutoMapping from '../admin/InventoryAutoMapping';
const id='30000000-0000-0000-0000-000000000001';
const candidate = {
 item_id:id,order_number:'ORD-fixture',title:'3品種お試しセット 令和8年産',status:'ready',reason:'fixture',
 fingerprint:'a'.repeat(32),quantity:1,harvest_year:2026,excluded:false,
 components:[{season_id:'40000000-0000-0000-0000-000000000001',variety_key:'koshihikari',unit_kg:0.3,milling:'white'}],
};
let saved: any;
beforeEach(() => {
 vi.clearAllMocks(); saved={id,harvest_year:2026,processed:0,candidates:[candidate]};
 mock.rpc.mockImplementation(async (name: string) => name==='kg_auto_mapping_prepare'
  ? {data:{batch_id:id,summary:[{status:'review',reason:'年産不明',harvest_year:null,items:51}]},error:null}
  : {data:{applied:1,remaining:0,processed:1},error:null});
 mock.from.mockImplementation(() => {
  const q: any={select:()=>q,eq:()=>q,is:()=>q,order:()=>q,limit:()=>q,
   single:async()=>({data:saved,error:null}),then:(resolve: any)=>Promise.resolve({data:[{id}],error:null}).then(resolve)};
  return q;
 });
});
afterEach(cleanup);
async function inspect() {
 fireEvent.click(screen.getByRole('button',{name:'自動判定する'}));
 await screen.findAllByText('ORD-fixture · 3品種お試しセット 令和8年産 × 1');
}
function confirmReview() {
 fireEvent.click(screen.getByRole('checkbox'));
 fireEvent.change(screen.getByLabelText('確認・反映の理由（必須）'),{target:{value:'実データと手動計上の重複を照合済み'}});
}
it('previews without applying, then requires approval and reason', async () => {
 render(<InventoryAutoMapping harvestYear={2026} onRefresh={vi.fn()}/>);
 expect(mock.rpc).not.toHaveBeenCalled();
 await inspect();
 expect(mock.rpc).toHaveBeenCalledWith('kg_auto_mapping_prepare',{p_year:2026});
 const apply=screen.getByRole('button',{name:'確認済みの残り1明細を一括反映'}) as HTMLButtonElement;
 expect(apply.disabled).toBe(true);
 fireEvent.click(screen.getByRole('checkbox')); expect(apply.disabled).toBe(true);
 fireEvent.change(screen.getByLabelText('確認・反映の理由（必須）'),{target:{value:'確認済み'}});
 expect(apply.disabled).toBe(false);
 fireEvent.click(apply);
 await screen.findByText(/一括反映が完了/);
 expect(mock.rpc).toHaveBeenCalledWith('kg_auto_mapping_apply_batch',expect.objectContaining({p_batch:id,p_no_manual_overlap:true,p_limit:100}));
});
it('does not fall back to mutation or legacy mapping when SQL is missing', async () => {
 mock.rpc.mockResolvedValue({error:{code:'PGRST202'}});
 render(<InventoryAutoMapping harvestYear={2026} onRefresh={vi.fn()}/>);
 fireEvent.click(screen.getByRole('button',{name:'自動判定する'}));
 expect(await screen.findByRole('alert')).toHaveProperty('textContent',expect.stringContaining('SQL'));
 expect(mock.rpc).toHaveBeenCalledTimes(1);
 expect(screen.queryByRole('checkbox')).toBeNull();
});
it('stops after a failed chunk and requires reloading before another apply', async () => {
 mock.rpc.mockImplementation(async (name: string) => name==='kg_auto_mapping_prepare'
  ? {data:{batch_id:id},error:null} : {error:{code:'40001'}});
 render(<InventoryAutoMapping harvestYear={2026} onRefresh={vi.fn()}/>);
 await inspect(); confirmReview();
 fireEvent.click(screen.getByRole('button',{name:'確認済みの残り1明細を一括反映'}));
 await screen.findByRole('alert');
 expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(true);
 expect(mock.rpc.mock.calls.filter(([name])=>name==='kg_auto_mapping_apply_batch')).toHaveLength(1);
 fireEvent.click(screen.getByRole('button',{name:'保存済みの処理状況を再取得'}));
 await waitFor(()=>expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(false));
 expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
});
it('resumes saved progress instead of repeating completed chunks', async () => {
 saved={...saved,processed:1,candidates:[candidate,{...candidate,item_id:'30000000-0000-0000-0000-000000000002'}]};
 render(<InventoryAutoMapping harvestYear={2026} onRefresh={vi.fn()}/>);
 fireEvent.click(screen.getByRole('button',{name:'保存済みの処理状況を再取得'}));
 await screen.findByRole('button',{name:'確認済みの残り1明細を一括反映'});
 expect(mock.rpc).not.toHaveBeenCalled();
 confirmReview(); fireEvent.click(screen.getByRole('button',{name:'確認済みの残り1明細を一括反映'}));
 await screen.findByText(/一括反映が完了/);
});
it('applies bounded chunks and updates the inventory only on explicit refresh', async () => {
 saved.candidates=Array.from({length:101},(_,i)=>({...candidate,item_id:`30000000-0000-0000-0000-${String(i+1).padStart(12,'0')}`}));
 let count=0; const refresh=vi.fn();
 mock.rpc.mockImplementation(async (name: string)=>name==='kg_auto_mapping_prepare'
  ? {data:{batch_id:id},error:null} : {data:{remaining:++count===1?1:0},error:null});
 render(<InventoryAutoMapping harvestYear={2026} onRefresh={refresh}/>);
 await inspect(); confirmReview();
 fireEvent.click(screen.getByRole('button',{name:'確認済みの残り101明細を一括反映'}));
 await screen.findByText(/一括反映が完了/);
 expect(count).toBe(2); expect(refresh).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'在庫表示を更新'})); expect(refresh).toHaveBeenCalledTimes(1);
});
it('clears an old review when switching scope and uses explicit all-year selection', async () => {
 render(<InventoryAutoMapping harvestYear={2026} onRefresh={vi.fn()}/>);
 await inspect();
 fireEvent.change(screen.getByLabelText('判定する年産範囲'),{target:{value:'all'}});
 expect(screen.queryByRole('checkbox')).toBeNull(); saved.harvest_year=null;
 fireEvent.click(screen.getByRole('button',{name:'自動判定する'}));
 await screen.findByRole('checkbox');
 expect(mock.rpc).toHaveBeenLastCalledWith('kg_auto_mapping_prepare',{p_year:null});
});
it('stops between chunks while allowing the already submitted chunk to finish', async () => {
 saved.candidates=Array.from({length:101},(_,i)=>({...candidate,item_id:`30000000-0000-0000-0000-${String(i+1).padStart(12,'0')}`}));
 let finish: ((v: any)=>void) | undefined;
 mock.rpc.mockImplementation((name: string)=>name==='kg_auto_mapping_prepare'
  ? Promise.resolve({data:{batch_id:id},error:null}) : new Promise(resolve=>{finish=resolve;}));
 render(<InventoryAutoMapping harvestYear={2026} onRefresh={vi.fn()}/>);
 await inspect(); confirmReview();
 fireEvent.click(screen.getByRole('button',{name:'確認済みの残り101明細を一括反映'}));
 fireEvent.click(await screen.findByRole('button',{name:'次の100件へ進まず停止'}));
 await act(async()=>{finish!({data:{remaining:1},error:null});});
 await screen.findByText(/停止しました。処理済み分は保存/);
 expect(mock.rpc.mock.calls.filter(([name])=>name==='kg_auto_mapping_apply_batch')).toHaveLength(1);
 expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
 expect(screen.getByRole('button',{name:'確認済みの残り1明細を一括反映'})).toBeTruthy();
});
