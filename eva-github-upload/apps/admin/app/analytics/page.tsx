import AdminShell from '../components/AdminShell';
import AdminPageHeader from '../components/AdminPageHeader';
import { Composition, Funnel, HorizontalBars, RevenueTrend, TrafficTrend } from '../components/AnalyticsVisuals';
import { faDate, faNumber, requireAdmin, toman } from '../lib/admin-data';
import { loadAnalytics } from '../lib/analytics-data';
import styles from './analytics.module.css';

export const dynamic='force-dynamic';

function Delta({value}:{value:number|null}){
  if(value===null)return <span className={styles.deltaNeutral}>بدون دوره مبنا</span>;
  const positive=value>0,negative=value<0;
  return <span className={positive?styles.deltaUp:negative?styles.deltaDown:styles.deltaNeutral}>{positive?'↑ ':negative?'↓ ':''}{faNumber(Math.abs(value))}٪ نسبت به دوره قبل</span>;
}

export default async function AnalyticsPage({searchParams}:{searchParams:Promise<{days?:string}>}){
  await requireAdmin();
  const params=await searchParams;
  const days=[7,30,90].includes(Number(params.days))?Number(params.days):30;
  const {data,error}=await loadAnalytics(days);

  return <AdminShell connected={!error}>
    <AdminPageHeader eyebrow="BUSINESS INTELLIGENCE" title="تحلیل و آمار" description="تصویر یکپارچه فروش، رفتار سایت، مشتری، پرداخت و موجودی EVA." meta={data?`بروزرسانی: ${faDate(data.generatedAt)}`:undefined} actions={<div className={styles.range}>{[7,30,90].map(value=><a key={value} className={days===value?styles.rangeActive:''} href={`/analytics?days=${value}`}>{value} روز</a>)}</div>}/>
    {error||!data?<div className={styles.error}>{error??'داده تحلیل در دسترس نیست.'}</div>:<>
      <section className={styles.kpis}>
        <article className={styles.heroKpi}><span>فروش ناخالص</span><b>{toman(data.summary.revenueToman)}</b><Delta value={data.changes.revenue}/></article>
        <article><span>فروش خالص</span><b>{toman(data.summary.netRevenueToman)}</b><Delta value={data.changes.netRevenue}/></article>
        <article><span>سفارش پرداخت‌شده</span><b>{faNumber(data.summary.orders)}</b><Delta value={data.changes.orders}/></article>
        <article><span>میانگین سبد خرید</span><b>{toman(data.summary.aovToman)}</b><Delta value={data.changes.aov}/></article>
        <article><span>Session سایت</span><b>{faNumber(data.summary.sessions)}</b><Delta value={data.changes.sessions}/></article>
        <article><span>Page View</span><b>{faNumber(data.summary.pageViews)}</b><Delta value={data.changes.pageViews}/></article>
        <article><span>نرخ تبدیل</span><b>{faNumber(data.summary.conversionRate)}٪</b><Delta value={data.changes.conversion}/></article>
        <article><span>موفقیت پرداخت</span><b>{faNumber(data.summary.paymentSuccessRate)}٪</b><Delta value={data.changes.paymentSuccess}/></article>
      </section>

      {!data.siteTrackingSince&&<div className={styles.trackingNote}>جمع‌آوری آمار First‑party سایت از همین نسخه فعال شده؛ نمودار بازدید با ورود داده واقعی به‌تدریج کامل می‌شود.</div>}

      <section className={styles.primaryGrid}>
        <article className={`${styles.panel} ${styles.span2}`}><div className={styles.panelHead}><div><span>REVENUE</span><h2>روند فروش</h2></div><small>{days} روز اخیر</small></div><div className={styles.chartPad}><RevenueTrend data={data.daily}/></div></article>
        <article className={styles.panel}><div className={styles.panelHead}><div><span>ORDER MIX</span><h2>وضعیت سفارش‌ها</h2></div></div><div className={styles.panelBody}><Composition centerLabel="سفارش" items={[{label:'پرداخت‌شده',value:data.orderStatus.paid},{label:'در انتظار پرداخت',value:data.orderStatus.pending},{label:'لغوشده',value:data.orderStatus.cancelled},{label:'Refund',value:data.orderStatus.refunded+data.orderStatus.refundPending}]}/></div></article>
      </section>

      <section className={styles.secondaryGrid}>
        <article className={`${styles.panel} ${styles.span2}`}><div className={styles.panelHead}><div><span>SITE TRAFFIC</span><h2>رفتار بازدید سایت</h2></div><small>{data.siteTrackingSince?`از ${faDate(data.siteTrackingSince)}`:'در حال شروع جمع‌آوری'}</small></div><div className={styles.chartPad}><TrafficTrend data={data.daily}/></div></article>
        <article className={styles.panel}><div className={styles.panelHead}><div><span>FUNNEL</span><h2>قیف خرید</h2></div></div><div className={styles.panelBody}><Funnel items={data.funnel}/></div></article>
      </section>

      <section className={styles.twoCol}>
        <article className={styles.panel}><div className={styles.panelHead}><div><span>PRICING COMPONENTS</span><h2>ترکیب مالی فروش</h2></div></div><div className={styles.panelBody}><HorizontalBars format="money" items={[{label:'ارزش طلای خام',value:data.financialBreakdown.gold},{label:'اجرت',value:data.financialBreakdown.making},{label:'سهم سود قیمت‌گذاری',value:data.financialBreakdown.profit},{label:'مالیات',value:data.financialBreakdown.tax},{label:'ارزش سنگ',value:data.financialBreakdown.stone}]}/><div className={styles.financialFoot}><span>Refund دوره</span><b>{toman(data.summary.refundsToman)}</b></div></div></article>
        <article className={styles.panel}><div className={styles.panelHead}><div><span>TOP PRODUCTS</span><h2>محصولات پرفروش</h2></div></div><div className={styles.panelBody}>{data.topProducts.length?<HorizontalBars format="money" items={data.topProducts.map(item=>({label:item.name,sub:`${item.sku} • ${faNumber(item.quantity)} فروش`,value:item.revenueToman}))}/>:<div className={styles.empty}>هنوز فروش پرداخت‌شده‌ای در این بازه ثبت نشده.</div>}</div></article>
      </section>

      <section className={styles.twoCol}>
        <article className={styles.panel}><div className={styles.panelHead}><div><span>TOP PAGES</span><h2>صفحات پربازدید</h2></div></div><div className={styles.panelBody}>{data.topPages.length?<HorizontalBars items={data.topPages.map(item=>({label:item.path,sub:`${faNumber(item.sessions)} session`,value:item.views}))}/>:<div className={styles.empty}>آمار صفحات از این نسخه به بعد جمع‌آوری می‌شود.</div>}</div></article>
        <article className={styles.panel}><div className={styles.panelHead}><div><span>FULFILLMENT</span><h2>جریان ارسال سفارش</h2></div></div><div className={styles.panelBody}><HorizontalBars items={data.fulfillment.map(item=>({label:{REGISTERED:'ثبت‌شده',PREPARING:'آماده‌سازی',READY_TO_SHIP:'آماده ارسال',SHIPPED:'ارسال‌شده',DELIVERED:'تحویل‌شده'}[item.status]??item.status,value:item.count}))}/></div></article>
      </section>

      <section className={styles.snapshot}>
        <article><span>مشتری جدید</span><b>{faNumber(data.summary.newCustomers)}</b><small>در بازه انتخاب‌شده</small></article>
        <article><span>مشتری تکراری</span><b>{faNumber(data.summary.repeatCustomers)}</b><small>حداقل ۲ خرید پرداخت‌شده</small></article>
        <article><span>Unit موجود</span><b>{faNumber(data.inventory.available)}</b><small>{toman(data.inventory.availableValueToman)} ارزش فروش فعلی</small></article>
        <article><span>Unit رزرو</span><b>{faNumber(data.inventory.reserved)}</b><small>در فرآیند خرید</small></article>
        <article><span>نیازمند توجه</span><b>{faNumber(data.inventory.attention)}</b><small>QC / Hold / Damaged</small></article>
      </section>
    </>}
  </AdminShell>;
}
