import AdminShell from '../components/AdminShell';
import AdminPageHeader from '../components/AdminPageHeader';
import styles from './settings.module.css';
import { requireAdmin } from '../lib/admin-data';

export const dynamic='force-dynamic';

const items=[
  {eyebrow:'PAYMENTS',title:'درگاه پرداخت',status:'Demo',text:'Flow پرداخت و Invoice آماده است؛ Provider واقعی نزدیک Launch متصل می‌شود.',note:'نیازمند Merchant/Provider credentials در Railway Variables.'},
  {eyebrow:'MESSAGING',title:'SMS و OTP',status:'Outbox Ready',text:'Outbox و Eventها آماده‌اند؛ ارسال واقعی هنوز فعال نشده است.',note:'Provider و OTP واقعی در فاز Integrations.'},
  {eyebrow:'GOLD RATE',title:'نرخ طلا',status:'Manual',text:'موتور Pricing فعال است اما نرخ فعلی به‌صورت دستی مدیریت می‌شود.',note:'منبع نرخ آنلاین بعداً Adapter می‌گیرد.'},
  {eyebrow:'MEDIA',title:'Storage / CDN',status:'URL Ready',text:'Media Model آماده است و فعلاً URL تصویر ذخیره می‌شود.',note:'آپلود فایل و CDN در مرحله اتصال Storage.'},
  {eyebrow:'ANALYTICS',title:'Analytics & Pixel',status:'Pending',text:'ساختار سایت آماده است اما Analytics و Pixel هنوز متصل نشده‌اند.',note:'بعد از نهایی‌شدن Domain و Consent.'},
  {eyebrow:'DOMAIN',title:'دامنه و Hosting',status:'Railway',text:'نسخه فعلی روی Railway اجرا می‌شود و GitHub منبع اصلی کد است.',note:'دامنه نهایی و تصمیم Hosting نزدیک Launch.'},
];

export default async function SettingsPage(){
  await requireAdmin();
  return <AdminShell>
    <AdminPageHeader eyebrow="SYSTEM" title="تنظیمات و Integrations" description="وضعیت سرویس‌های بیرونی که عمداً تا نزدیک Launch به تعویق انداختیم."/>
    <section className={styles.grid}>{items.map(item=><article className={styles.card} key={item.eyebrow}><div className={styles.top}><span>{item.eyebrow}</span><b className={item.status==='Outbox Ready'||item.status==='URL Ready'?styles.ready:''}>{item.status}</b></div><h2>{item.title}</h2><p>{item.text}</p><small>{item.note}</small></article>)}</section>
    <section className={styles.launch}><span>LAUNCH INTEGRATIONS</span><h2>اتصال سرویس‌ها را یکجا انجام می‌دهیم.</h2><p>وقتی هسته، محتوا و طراحی نهایی بسته شد، از همین بخش چک‌لیست اتصال درگاه پرداخت، SMS/OTP، نرخ آنلاین طلا، Storage/CDN، Analytics و دامنه را مرحله‌به‌مرحله جلو می‌بریم.</p></section>
  </AdminShell>;
}
