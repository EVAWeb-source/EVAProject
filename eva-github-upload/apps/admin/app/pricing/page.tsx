import AdminShell from '../components/AdminShell';
import AdminPageHeader from '../components/AdminPageHeader';
import PricingActions from '../components/PricingActions';
import { loadDashboard, requireAdmin, toman } from '../lib/admin-data';

export const dynamic='force-dynamic';

export default async function PricingPage(){
  await requireAdmin();
  const {data,error}=await loadDashboard();
  const observed=data?.pricing.rate?.observedAt?new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(data.pricing.rate.observedAt)):'—';
  return <AdminShell connected={!error}>
    <AdminPageHeader eyebrow="GOLD RATE" title="نرخ طلا" description="نرخ هر گرم طلا تنظیم سراسری EVA است. اجرت، سود و مالیات به‌صورت مستقل داخل هر محصول مدیریت می‌شوند."/>
    {error||!data?<section className="setupCard"><h1>نرخ طلا قابل دریافت نیست.</h1><p>{error}</p></section>:<section className="panel pricingPanel"><div className="panelHead"><div><span>CURRENT GOLD RATE</span><h2>نرخ فعال</h2></div><small>{data.pricing.rate?.source==='ADMIN_MANUAL'?'ورود دستی تا زمان اتصال API واقعی':'منبع ثبت‌شده در سیستم'}</small></div><div className="pricingGrid">
      <article><span>طلای {data.pricing.rate?.purity??18} عیار / گرم</span><strong>{data.pricing.rate?toman(data.pricing.rate.tomanPerGram):'—'}</strong><small>{data.pricing.rate?.rateVersion??'بدون نرخ'}</small></article>
      <article><span>منبع نرخ</span><strong dir="ltr">{data.pricing.rate?.source??'—'}</strong><small>بعداً API Provider این مقدار را خودکار ثبت می‌کند.</small></article>
      <article><span>آخرین بروزرسانی</span><strong>{observed}</strong><small>زمان مشاهده نرخ ذخیره می‌شود.</small></article>
    </div><PricingActions rate={data.pricing.rate}/><div className="pricingCurrentLine"><span>وضعیت API</span><strong>آماده اتصال</strong><span>Fallback</span><strong>ورود دستی فعال</strong></div></section>}
  </AdminShell>;
}
