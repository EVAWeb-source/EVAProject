import AdminShell from '../components/AdminShell';
import AdminPageHeader from '../components/AdminPageHeader';
import PricingActions from '../components/PricingActions';
import { loadDashboard, requireAdmin } from '../lib/admin-data';
import styles from './pricing.module.css';

export const dynamic='force-dynamic';

function faNumber(value:number){
  return new Intl.NumberFormat('fa-IR').format(value);
}

export default async function PricingPage(){
  await requireAdmin();
  const {data,error}=await loadDashboard();
  const rate=data?.pricing.rate??null;
  const observed=rate?.observedAt
    ? new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(rate.observedAt))
    : '—';

  return <AdminShell connected={!error}>
    <AdminPageHeader eyebrow="GOLD RATE" title="نرخ طلا" description="نرخ پایه سراسری طلا برای محاسبه قیمت Unitها. اجرت، سود و مالیات داخل هر محصول مدیریت می‌شوند."/>
    {error||!data
      ? <section className="setupCard"><h1>نرخ طلا قابل دریافت نیست.</h1><p>{error}</p></section>
      : <section className={`panel ${styles.ratePanel}`}>
          <div className={styles.rateOverview}>
            <div className={styles.rateHero}>
              <span className={styles.rateLabel}>نرخ فعال طلای {rate?.purity??18} عیار / گرم</span>
              <div className={styles.rateValue}>
                <strong>{rate?faNumber(rate.tomanPerGram):'—'}</strong>
                <span>تومان</span>
              </div>
              <span className={styles.rateVersion}>{rate?.rateVersion??'NO ACTIVE RATE'}</span>
            </div>

            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <span>منبع نرخ</span>
                <strong dir="ltr">{rate?.source??'—'}</strong>
              </div>
              <div className={styles.metaItem}>
                <span>آخرین بروزرسانی</span>
                <strong>{observed}</strong>
              </div>
              <div className={styles.metaItem}>
                <span>وضعیت API</span>
                <strong className={styles.statusReady}>آماده اتصال</strong>
              </div>
              <div className={styles.metaItem}>
                <span>Fallback</span>
                <strong>ورود دستی فعال</strong>
              </div>
            </div>
          </div>

          {rate?.source==='ADMIN_MANUAL'&&<div className={styles.sourceHint}>نرخ فعلی به‌صورت دستی ثبت شده و تا زمان اتصال Provider واقعی استفاده می‌شود.</div>}
          <div className={styles.manualWrap}><PricingActions rate={rate}/></div>
        </section>}
  </AdminShell>;
}
