import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const mock = vi.hoisted(() => ({ slug: ['wakeari'], products: [] as any[], from: vi.fn(), insert: vi.fn(), push: vi.fn(), editor: false }));
vi.mock('next/link', () => ({default:({children,...p}:any)=><a {...p}>{children}</a>}));
vi.mock('next/navigation', () => ({useParams:()=>mock.editor?{handle:'new'}:{slug:mock.slug},useSearchParams:()=>new URLSearchParams(),useRouter:()=>({push:mock.push})}));
vi.mock('../hooks/useProducts', () => ({useProducts:()=>({products:mock.products,loading:false,error:null})}));
vi.mock('../lib/supabase', () => ({supabase:{from:mock.from}}));
vi.mock('../components/UI', () => ({
 FadeInImage:({src,alt}:any)=><img src={src} alt={alt}/>,
 LoadingButton:({children,loading,onClick}:any)=><button disabled={loading} onClick={onClick}>{children}</button>,
}));
vi.mock('../components/YearlySubscriptionLP',()=>({default:()=>null}));
import ProductCategoryNav from '../components/product/ProductCategoryNav';
import CollectionsPage from '../app/(main)/collections/[[...slug]]/page';
import { generateMetadata } from '../app/(main)/collections/[[...slug]]/layout';
import ProductEditor from '../admin/ProductEditor';
import { CATEGORY_NAV } from '../components/navigation';
const product=(id:string,category:string,categories?:string[])=>({id,title:id,category,categories,price:1000,image:'/fixture.jpg',images:[],handle:id,soldOut:false,stock:10,is_visible:true});
beforeEach(()=>{
 vi.clearAllMocks(); mock.editor=false;mock.slug=['wakeari'];mock.products=[];
 vi.spyOn(window,'scrollTo').mockImplementation(()=>{});vi.spyOn(window,'alert').mockImplementation(()=>{});
 mock.from.mockImplementation(()=>{
  const q:any={select:()=>q,order:()=>q,limit:()=>q,eq:()=>q,delete:()=>q,
   insert:(value:any)=>{mock.insert(value);return q;},single:async()=>({data:{id:'fixture'},error:null}),
   then:(resolve:any)=>Promise.resolve({data:[],error:null}).then(resolve)};
  return q;
 });
});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('inserts the tag between Crescentmoon and tickets with the same category navigation pattern',()=>{
 render(<ProductCategoryNav current="all"/>);
 const links=screen.getAllByRole('link');
 const labels=links.map(x=>x.textContent);
 expect(labels.indexOf('ワケあり')).toBe(labels.indexOf('Crescentmoon')+1);
 expect(labels.indexOf('チケット')).toBe(labels.indexOf('ワケあり')+1);
 expect(screen.getByRole('link',{name:'ワケあり'}).getAttribute('href')).toBe('/collections/wakeari');
 const menu=CATEGORY_NAV.children.map(x=>x.label);
 expect(menu.indexOf('ワケあり')).toBe(menu.indexOf('Crescentmoon')+1);
});
it('filters by saved category, supports multiple categories and excludes hidden or title-only matches',async()=>{
 mock.products=[product('訳あり柿','ワケあり'),product('柿の詰め合わせ','その他',['その他','ワケあり']),
  product('旧表記の柿','訳あり'),product('通常の柿','その他'),product('ワケありと書いてあるだけ','その他'),
  {...product('非公開の柿','ワケあり'),is_visible:false}];
 render(<CollectionsPage/>);
 await screen.findByText('訳あり柿');
 expect(screen.getByText('柿の詰め合わせ')).toBeTruthy();expect(screen.getByText('旧表記の柿')).toBeTruthy();
 expect(screen.queryByText('通常の柿')).toBeNull();expect(screen.queryByText('ワケありと書いてあるだけ')).toBeNull();expect(screen.queryByText('非公開の柿')).toBeNull();
 expect(screen.getByText('ワケあり').getAttribute('aria-current')).toBe('page');
});
it('retains visibility in all products and shows a clear empty category',async()=>{
 mock.slug=[];mock.products=[product('訳あり柿','ワケあり'),product('通常の柿','その他')];
 const view=render(<CollectionsPage/>);await screen.findByText('訳あり柿');expect(screen.getByText('通常の柿')).toBeTruthy();
 view.unmount();mock.slug=['wakeari'];mock.products=[];render(<CollectionsPage/>);
 await screen.findByText('商品が見つかりませんでした');
});
it('provides category-specific metadata instead of noindex fallback',async()=>{
 const metadata=await generateMetadata({params:Promise.resolve({slug:['wakeari']})});
 expect(metadata.title).toBe('ワケあり商品一覧');expect(metadata.alternates?.canonical).toBe('/collections/wakeari');expect(metadata.robots).toBeUndefined();
});
it('saves the selected category in the existing product fields without rice subcategories',async()=>{
 mock.editor=true;
 const {container}=render(<ProductEditor/>);
 await waitFor(()=>expect(mock.from).toHaveBeenCalledWith('products'));
 fireEvent.click(screen.getByRole('checkbox',{name:'ワケあり'}));
 fireEvent.click(screen.getByRole('checkbox',{name:/^お米$/}));
 fireEvent.change(screen.getByPlaceholderText('例: 自然栽培 コシヒカリ 5kg'),{target:{value:'訳あり柿'}});
 fireEvent.change(screen.getByPlaceholderText('例: koshihikari-5kg'),{target:{value:'wakeari-kaki'}});
 fireEvent.change(container.querySelector('input[type="number"][required]')!,{target:{value:'1200'}});
 fireEvent.click(screen.getByRole('button',{name:'保存する'}));
 await waitFor(()=>expect(mock.insert).toHaveBeenCalled());
 const saved=mock.insert.mock.calls[0][0][0];
 expect(saved.category).toBe('ワケあり');expect(saved.categories).toEqual(['ワケあり']);expect(saved.subcategories).toEqual([]);
 expect(mock.push).toHaveBeenCalledWith('/admin/products');
});
