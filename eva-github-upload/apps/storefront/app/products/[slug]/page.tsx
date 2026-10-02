import ProductPurchase from '../tolou/ProductPurchase';
import styles from '../tolou/product.module.css';
import { notFound } from 'next/navigation';

export const dynamic='force-dynamic';

type ApiPricing={
  goldRateTomanPerGram:number;
  goldValueToman:number;
  makingToman:number;
  profitToman:number;
  taxToman:number;
  finalPriceToman:number;
  rateVersion:string;
  pricingFormulaVersion:string;
};

type ApiUnit={
  id:string;
  unitSku:string;
  exactWeightGram:string;
  currentPriceToman:string;
  status:string;
  pricing:ApiPricing;
};

type ApiProduct={
  nameFa:string;
  slug:string;
  masterSku:string;
  purity:number;
  collection:{nameFa:string}|null;
  units:ApiUnit[];
};

const categoryLabels:Record<string,string>={
  NEC:'گردنبند',PEN:'آویز',BRA:'دستبند',RIN:'انگشتر',
  EAR:'گوشواره',SET:'ست',ANK:'پابند',CHM:'چارم'
};

function category(sku:string){
  return categoryLabels[sku.split('-')[2]??'']??'قطعه طلا';
}

function faWeight(value:string){
  return new Intl.NumberFormat('fa-IR',{
    minimumFractionDigits:2,
    maximumFractionDigits:3
  }).format(Number(value)) + ' گرم';
}

async function getProduct(slug:string):Promise<ApiProduct|null>{
  const apiBase=process.env.API_URL ?? 'https://eva-api-production-c864.up.railway.app';
  const response=await fetch(apiBase + '/api/v1/products/' + encodeURIComponent(slug),{cache:'no-store'});
  if(response.status===404)return null;
  if(!response.ok)throw new Error('Failed to load product: ' + response.status);
  return response.json();
}

export default async function ProductPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const product=await getProduct(slug);
  if(!product)notFound();

  const collectionName=product.collection?.nameFa ?? 'EVA';
  const availableUnits=product.units
    .filter(u=>u.status==='AVAILABLE')
    .map(u=>({
      id:u.id,
      unitSku:u.unitSku,
      weight:faWeight(u.exactWeightGram),
      price:Number(u.currentPriceToman),
      pricing:u.pricing
    }));
  const cat=category(product.masterSku);

  return <main className={styles.page}>
    <div className={styles.announcement}>ارسال امن • فاکتور معتبر • قیمت شفاف</div>
    <header className={styles.header}>
      <a className={styles.brand} href="/">EVA</a>
      <nav><a href="/shop">فروشگاه</a><a href="/#collection">کالکشن‌ها</a><a href="/#gift">هدیه</a><a href="/#lightweight">طلای سبک</a></nav>
      <div className={styles.actions}><a href="/wishlist">♡</a><a href="/account">حساب</a><a href="/cart" className={styles.cart}>سبد</a></div>
    </header>

    <div className={styles.breadcrumb}>
      <a href="/">خانه</a><span>/</span><a href="/shop">فروشگاه</a><span>/</span><span>{product.nameFa}</span>
    </div>

    <section className={styles.productHero}>
      <div className={styles.gallery}>
        <div className={styles.galleryCard + ' ' + styles.galleryMain}>
          <div className={styles.heroJewel}><span className={styles.chain}/><span className={styles.pendant}><i/></span></div>
          <span className={styles.imageLabel}>نمای اصلی</span>
        </div>
        <div className={styles.galleryCard}>
          <div className={styles.onBody}><span className={styles.neck}/><span className={styles.bodyChain}/><span className={styles.bodyPendant}/></div>
          <span className={styles.imageLabel}>نمای روی بدن</span>
        </div>
        <div className={styles.galleryCard}>
          <div className={styles.detailJewel}><span/></div>
          <span className={styles.imageLabel}>جزئیات</span>
        </div>
      </div>

      <ProductPurchase
        product={{
          name:product.nameFa,
          slug:product.slug,
          masterSku:product.masterSku,
          collection:collectionName,
          purity:product.purity
        }}
        units={availableUnits}
      />
    </section>

    <section className={styles.storySection}>
      <div><span className={styles.eyebrow}>THE PIECE</span><h2>{product.nameFa}</h2></div>
      <p>یک قطعه از مجموعه EVA با فرم مینیمال و وزن دقیق هر Unit. داستان، تصاویر و محتوای اختصاصی این محصول در مرحله محتوای نهایی از پنل مدیریت تکمیل می‌شود.</p>
    </section>

    <section className={styles.detailsSection}>
      <div><span className={styles.eyebrow}>DETAILS</span><h2>مشخصات محصول</h2></div>
      <dl>
        <div><dt>دسته</dt><dd>{cat}</dd></div>
        <div><dt>کالکشن</dt><dd>{collectionName}</dd></div>
        <div><dt>عیار</dt><dd>{product.purity} عیار</dd></div>
        <div><dt>SKU</dt><dd dir="ltr">{product.masterSku}</dd></div>
      </dl>
    </section>

    <section className={styles.assuranceSection}>
      <article><span>01</span><h3>اصالت</h3><p>هر Unit با وزن و عیار دقیق خودش ثبت می‌شود.</p></article>
      <article><span>02</span><h3>فاکتور</h3><p>فاکتور به همان قطعه و قیمت ثبت‌شده متصل است.</p></article>
      <article><span>03</span><h3>بسته‌بندی</h3><p>سفارش در بسته‌بندی EVA آماده می‌شود.</p></article>
    </section>
  </main>;
}
