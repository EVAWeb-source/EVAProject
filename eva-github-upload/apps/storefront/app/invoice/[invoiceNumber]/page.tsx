import PrintButton from './PrintButton';
import styles from './invoice.module.css';

export const dynamic='force-dynamic';

type Invoice={
  invoiceNumber:string;
  verificationCode:string;
  status:string;
  sellerName:string;
  issuedAt:string;
  orderNumber:string;
  customer:{name:string;mobile:string;recipientName:string;province:string;city:string;address:string;postalCode:string};
  payment:{provider:string;reference:string};
  totalToman:number;
  items:Array<{
    productNameFa:string;masterSku:string;unitSku:string;exactWeightGram:string;purity:number;
    goldRateTomanPerGram:number|null;goldValueToman:number|null;makingToman:number|null;profitToman:number|null;taxToman:number|null;finalPriceToman:number;
    rateVersion:string|null;pricingFormulaVersion:string|null;
  }>;
};

const apiBase=process.env.API_URL ?? 'https://eva-api-production-c864.up.railway.app';
const siteBase=process.env.NEXT_PUBLIC_SITE_URL ?? 'https://evaproject-production.up.railway.app';
const toman=(value:number)=>`${new Intl.NumberFormat('fa-IR').format(value)} تومان`;
const weight=(value:string)=>`${new Intl.NumberFormat('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:3}).format(Number(value))} گرم`;

async function getInvoice(invoiceNumber:string):Promise<Invoice>{
  const response=await fetch(`${apiBase}/api/v1/invoices/${encodeURIComponent(invoiceNumber)}`,{cache:'no-store'});
  if(!response.ok)throw new Error(`Invoice load failed: ${response.status}`);
  return response.json();
}

export default async function InvoicePage({params}:{params:Promise<{invoiceNumber:string}>}){
  const {invoiceNumber}=await params;
  const invoice=await getInvoice(invoiceNumber);
  const item=invoice.items[0];
  const verifyUrl=`${siteBase}/verify/${invoice.verificationCode}`;

  return <main className={styles.page} dir="rtl">
    <article className={styles.sheet}>
      <header className={styles.head}>
        <div className={styles.title}><span className={styles.eyebrow}>OFFICIAL EVA INVOICE</span><h1>فاکتور خرید EVA</h1><div className={styles.meta}><span>شماره فاکتور: <b dir="ltr">{invoice.invoiceNumber}</b></span><span>شماره سفارش: <b dir="ltr">{invoice.orderNumber}</b></span><span>تاریخ صدور: {new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(invoice.issuedAt))}</span><span>وضعیت: {invoice.status==='ISSUED'?'صادر شده':invoice.status}</span></div></div>
        <div className={styles.brand}>EVA</div>
      </header>

      <section className={styles.section}><h2>خریدار و ارسال</h2><div className={styles.grid}><div className={styles.row}><span>نام خریدار</span><strong>{invoice.customer.name}</strong></div><div className={styles.row}><span>موبایل</span><strong dir="ltr">{invoice.customer.mobile}</strong></div><div className={styles.row}><span>گیرنده</span><strong>{invoice.customer.recipientName}</strong></div><div className={styles.row}><span>کدپستی</span><strong dir="ltr">{invoice.customer.postalCode}</strong></div></div><div className={styles.row}><span>آدرس</span><strong>{invoice.customer.province}، {invoice.customer.city}، {invoice.customer.address}</strong></div></section>

      {item&&<section className={styles.section}><h2>مشخصات قطعه</h2><div className={styles.grid}><div className={styles.row}><span>محصول</span><strong>{item.productNameFa}</strong></div><div className={styles.row}><span>وزن دقیق</span><strong>{weight(item.exactWeightGram)}</strong></div><div className={styles.row}><span>عیار</span><strong>{item.purity} عیار</strong></div><div className={styles.row}><span>Unit SKU</span><strong dir="ltr">{item.unitSku}</strong></div><div className={styles.row}><span>Master SKU</span><strong dir="ltr">{item.masterSku}</strong></div></div></section>}

      {item&&<section className={styles.section}><h2>جزئیات قیمت ثبت‌شده</h2>{item.goldRateTomanPerGram!==null&&<div className={styles.row}><span>نرخ طلا / گرم</span><strong>{toman(item.goldRateTomanPerGram)}</strong></div>}{item.goldValueToman!==null&&<div className={styles.row}><span>ارزش طلا</span><strong>{toman(item.goldValueToman)}</strong></div>}{item.makingToman!==null&&<div className={styles.row}><span>اجرت</span><strong>{toman(item.makingToman)}</strong></div>}{item.profitToman!==null&&<div className={styles.row}><span>سود</span><strong>{toman(item.profitToman)}</strong></div>}{item.taxToman!==null&&<div className={styles.row}><span>مالیات</span><strong>{toman(item.taxToman)}</strong></div>}<div className={`${styles.row} ${styles.total}`}><span>مبلغ نهایی</span><strong>{toman(item.finalPriceToman)}</strong></div></section>}

      <section className={styles.section}><h2>پرداخت</h2><div className={styles.grid}><div className={styles.row}><span>درگاه</span><strong>{invoice.payment.provider}</strong></div><div className={styles.row}><span>کد مرجع</span><strong dir="ltr">{invoice.payment.reference}</strong></div></div></section>

      <section className={styles.verify}><strong>تأیید اصالت فاکتور</strong><p>این فاکتور یک Verification Code یکتا دارد. صفحه عمومی تأیید، اطلاعات شخصی خریدار را نمایش نمی‌دهد.</p><code>{invoice.verificationCode}</code><a href={verifyUrl}>{verifyUrl}</a></section>

      <div className={styles.actions}><PrintButton/><a href={`/verify/${invoice.verificationCode}`}>بررسی فاکتور</a><a href="/shop">بازگشت به فروشگاه</a></div>
      <p className={styles.note}>این نسخه فعلاً برای تست زیرساخت EVA صادر شده است. اطلاعات حقوقی فروشنده، قواعد مالیاتی نهایی و قالب رسمی نهایی فاکتور پیش از Launch تکمیل می‌شوند.</p>
    </article>
  </main>;
}
