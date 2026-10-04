import AdminShell from '../components/AdminShell';
import AdminPageHeader from '../components/AdminPageHeader';
import InventoryManager from '../components/InventoryManager';
import { loadDashboard, requireAdmin } from '../lib/admin-data';

export const dynamic='force-dynamic';

export default async function InventoryPage({searchParams}:{searchParams:Promise<{productId?:string}>}){
  await requireAdmin();
  const {productId}=await searchParams;
  const {data,error}=await loadDashboard();
  return <AdminShell connected={!error}>
    <AdminPageHeader eyebrow="PHYSICAL INVENTORY" title="موجودی و Unitها" description="کنترل قطعات واقعی، وزن دقیق، QC و وضعیت فروش هر Unit." actions={<a href="/catalog">محصولات</a>}/>
    {error||!data?<section className="setupCard"><h1>موجودی قابل دریافت نیست.</h1><p>{error}</p></section>:<InventoryManager products={data.products.map(({id,nameFa,masterSku})=>({id,nameFa,masterSku}))} units={data.units} initialProductId={productId}/>} 
  </AdminShell>;
}
