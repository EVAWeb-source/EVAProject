import AdminShell from '../components/AdminShell';
import AdminPageHeader from '../components/AdminPageHeader';
import PricingActions from '../components/PricingActions';
import { faNumber, loadDashboard, requireAdmin, toman } from '../lib/admin-data';

export const dynamic='force-dynamic';

export default async function PricingPage(){
  await requireAdmin();
  const {data,error}=await loadDashboard();
  return <AdminShell connected={!error}>
    <AdminPageHeader eyebrow="PRICING ENGINE" title="قیمت‌گذاری" description="نرخ طلا، اجرت، سود و مالیات فعلی. تغییرات روی Unitهای قابل فروش اعمال می‌شوند و Snapshotهای قبلی دست‌نخورده می‌مانند."/>
    {error||!data?<section className="setupCard"><h1>قیمت‌گذاری قابل دریافت نیست.</h1><p>{error}</p></section>:<section className="panel pricingPanel"><div className="panelHead"><div><span>CURRENT CONFIG</span><h2>تنظیمات فعال</h2></div><small>Demo تا زمان اتصال منبع نرخ واقعی</small></div><div className="pricingGrid">
      <article><span>نرخ طلای {data.pricing.rate?.purity??18} عیار / گرم</span><strong>{data.pricing.rate?toman(data.pricing.rate.tomanPerGram):'—'}</strong><small>{data.pricing.rate?.rateVersion??'بدون نرخ'}</small></article>
      <article><span>اجرت</span><strong>{data.pricing.rule?`${faNumber(data.pricing.rule.makingPercent)}٪`:'—'}</strong><small>{data.pricing.rule?.formulaVersion??'—'}</small></article>
      <article><span>سود</span><strong>{data.pricing.rule?`${faNumber(data.pricing.rule.profitPercent)}٪`:'—'}</strong><small>{data.pricing.rule?.name??'—'}</small></article>
      <article><span>مالیات</span><strong>{data.pricing.rule?`${faNumber(data.pricing.rule.taxPercent)}٪`:'—'}</strong><small>قاعده فعلی آزمایشی</small></article>
    </div><PricingActions rate={data.pricing.rate} rule={data.pricing.rule}/></section>}
  </AdminShell>;
}
