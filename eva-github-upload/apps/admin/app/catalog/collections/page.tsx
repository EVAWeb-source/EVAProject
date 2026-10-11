import AdminShell from '../../components/AdminShell';
import AdminPageHeader from '../../components/AdminPageHeader';
import CollectionManager from '../../components/CollectionManager';
import { loadDashboard, requireAdmin } from '../../lib/admin-data';

export const dynamic='force-dynamic';

export default async function CollectionsPage(){
  await requireAdmin();
  const {data,error}=await loadDashboard();
  return <AdminShell connected={!error}>
    <AdminPageHeader eyebrow="COLLECTIONS" title="کالکشن‌ها" description="ساخت، ویرایش و حذف امن کالکشن‌های کاتالوگ." actions={<><a href="/catalog">← محصولات</a><a href="/catalog/products/new">+ محصول جدید</a></>}/>
    {error||!data?<section className="setupCard"><h1>کالکشن‌ها قابل دریافت نیستند.</h1><p>{error}</p></section>:<CollectionManager collections={data.collections} products={data.products.map(product=>({id:product.id,collectionId:product.collectionId}))}/>} 
  </AdminShell>;
}
