import { notFound } from 'next/navigation';
import AdminShell from '../../../components/AdminShell';
import AdminPageHeader from '../../../components/AdminPageHeader';
import ProductEditor from '../../../components/ProductEditor';
import { loadCatalogReadiness, loadDashboard, requireAdmin, STOREFRONT_BASE } from '../../../lib/admin-data';

export const dynamic='force-dynamic';

export default async function ProductEditorPage({params}:{params:Promise<{id:string}>}){
  await requireAdmin();
  const {id}=await params;
  const [{data,error},{data:readiness}]=await Promise.all([loadDashboard(),loadCatalogReadiness()]);
  if(!data&&!error)notFound();
  const product=data?.products.find(item=>item.id===id);
  if(!product)notFound();
  const ready=readiness?.items.find(item=>item.id===id)??null;

  return <AdminShell connected={!error}>
    <AdminPageHeader eyebrow="PRODUCT EDITOR" title={product.nameFa} description={`${product.collection??'بدون کالکشن'} • ${product.masterSku}`} actions={<><a href="/catalog">← محصولات</a><a href={`${STOREFRONT_BASE}/products/${product.slug}`} target="_blank" rel="noreferrer">مشاهده در فروشگاه ↗</a></>}/>
    <ProductEditor product={product} collections={data!.collections} readiness={ready}/>
  </AdminShell>;
}
