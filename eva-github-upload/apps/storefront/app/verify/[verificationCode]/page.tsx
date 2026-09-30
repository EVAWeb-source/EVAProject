import styles from './verify.module.css';

export const dynamic='force-dynamic';

type Verification={
  valid:boolean;
  invoiceNumber:string;
  status:string;
  sellerName:string;
  issuedAt:string;
  orderNumber:string;
  totalToman:number;
  items:Array<{productNameFa:string;unitSku:string;exactWeightGram:string;purity:number;finalPriceToman:number}>;
};

const apiBase=process.env.API_URL ?? 'https://eva-api-production-c864.up.railway.app';
const toman=(value:number)=>`${new Intl.NumberFormat('fa-IR').format(value)} تومان`;
const weight=(value:string)=>`${new Intl.NumberFormat('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:3}).format(Number(value))} گرم`;

async function verifyInvoice(code:string):Promise<Verification>{
  const response=await fetch(`${apiBase}/api/v1/invoices/verify/${encodeURIComponent(code)}`,{cache:'no-store'});
  if(!response.ok)throw new Error(`Verification failed: ${response.status}`);
  return response.json();
}

export default async function VerifyPage({params}:{params:Promise<{verificationCode:string}>}){
  const {verificationCode}=await params;
  const data=await verifyInvoice(verificationCode);
  return <main className={styles.page} dir="rtl"><section className={styles.card}>
    <div className={styles.brand}>EVA</div>
    <div className={styles.ok}>{data.valid?'✓':'!'}</div>
    <span className={styles.eyebrow}>INVOICE VERIFICATION</span>
    <h1>{data.valid?'فاکتور معتبر است.':'فاکتور معتبر نیست.'}</h1>
    <p>این صفحه فقط اطلاعات لازم برای بررسی اصالت فاکتور را نمایش می‌دهد و اطلاعات شخصی خریدار عمومی نمی‌شود.</p>
    <div className={styles.rows}>
      <div className={styles.row}><span>شماره فاکتور</span><strong dir="ltr">{data.invoiceNumber}</strong></div>
      <div className={styles.row}><span>شماره سفارش</span><strong dir="ltr">{data.orderNumber}</strong></div>
      <div className={styles.row}><span>فروشنده</span><strong>{data.sellerName}</strong></div>
      <div className={styles.row}><span>تاریخ صدور</span><strong>{new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(data.issuedAt))}</strong></div>
      <div className={styles.row}><span>مبلغ</span><strong>{toman(data.totalToman)}</strong></div>
    </div>
    {data.items.map((item)=><div className={styles.items} key={item.unitSku}><strong>{item.productNameFa}</strong><p>{weight(item.exactWeightGram)} • {item.purity} عیار</p><p dir="ltr">{item.unitSku}</p><b>{toman(item.finalPriceToman)}</b></div>)}
    <div className={styles.actions}><a href="/">EVA</a></div>
  </section></main>;
}
