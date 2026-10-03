import LightweightCatalog from './LightweightCatalog';
import type { CatalogProduct } from '../components/CatalogGrid';
import styles from './lightweight.module.css';

export const dynamic='force-dynamic';

async function getProducts():Promise<CatalogProduct[]> {
  const apiBase=process.env.API_URL ?? 'https://eva-api-production-c864.up.railway.app';
  const response=await fetch(apiBase+'/api/v1/products',{cache:'no-store'});
  if(!response.ok)throw new Error('Failed to load EVA catalog: '+response.status);
  return response.json();
}

export default async function LightweightPage(){
  const products=await getProducts();
  const lightweight=products.filter(product=>product.units.some(unit=>Number(unit.exactWeightGram)<1));

  return <main className={styles.page}>
    <div className={styles.announcement}>ارسال امن • فاکتور معتبر • قیمت شفاف</div>
    <header className={styles.header}>
      <a className={styles.brand} href="/">EVA</a>
      <nav><a href="/shop">فروشگاه</a><a href="/collections">کالکشن‌ها</a><a href="/gift">هدیه</a><a href="/lightweight">طلای سبک</a></nav>
      <div className={styles.actions}><a href="/wishlist">♡</a><a href="/account">حساب</a><a className={styles.cart} href="/cart">سبد</a></div>
    </header>

    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <span>LIGHTWEIGHT GOLD</span>
        <h1>طلای سبک، برای هر روز.</h1>
        <p>قطعه‌هایی با وزن کمتر که همچنان با وزن دقیق، عیار مشخص و قیمت شفاف انتخاب می‌شوند.</p>
        <a href="#lightweight-catalog">مشاهده قطعه‌های سبک</a>
      </div>
      <div className={styles.heroArt} aria-hidden="true">
        <div className={styles.halo}/>
        <span className={styles.chain}/>
        <span className={styles.pendant}/>
        <div className={styles.weightTag}><strong>&lt; 1.00 g</strong><span>LIVE UNIT FILTER</span></div>
      </div>
    </section>

    <section className={styles.definition}>
      <div><span>WHAT LIGHTWEIGHT MEANS</span><h2>سبک یعنی وزن کمتر؛ نه اطلاعات کمتر.</h2></div>
      <p>در این صفحه فعلاً محصولاتی نمایش داده می‌شوند که حداقل یک Unit موجود با وزن کمتر از ۱ گرم دارند. عدد دقیق وزن هر Unit و قیمت همان قطعه همچنان روی صفحه محصول مشخص است.</p>
    </section>

    <div id="lightweight-catalog"><LightweightCatalog products={lightweight}/></div>

    <section className={styles.why}>
      <div className={styles.whyHead}><span>WHY LIGHTWEIGHT</span><h2>برای چه کسی مناسب است؟</h2></div>
      <div className={styles.whyGrid}>
        <article><span>01</span><h3>استفاده روزمره</h3><p>وزن کمتر می‌تواند استفاده طولانی‌مدت و روزانه را راحت‌تر کند.</p></article>
        <article><span>02</span><h3>شروع خرید طلا</h3><p>برای کسی که می‌خواهد با بودجه کنترل‌شده‌تر وارد خرید طلای طراحی‌شده شود.</p></article>
        <article><span>03</span><h3>لایه‌سازی</h3><p>قطعه‌های سبک برای ترکیب با چند گردنبند، دستبند یا انگشتر دیگر مناسب‌ترند.</p></article>
        <article><span>04</span><h3>هدیه</h3><p>انتخابی ظریف و کاربردی برای هدیه‌ای که قرار است زیاد استفاده شود.</p></article>
      </div>
    </section>

    <section className={styles.transparency}>
      <div><span>TRANSPARENCY</span><h2>هر گرم مهم است.</h2></div>
      <p>در EVA سبک‌بودن یک برچسب تبلیغاتی نیست. اگر یک مدل چند Unit با وزن متفاوت داشته باشد، وزن و قیمت هر قطعه جداگانه نمایش داده می‌شود و انتخاب نهایی روی همان Unit انجام می‌شود.</p>
    </section>

    <footer className={styles.footer}><a className={styles.brand} href="/">EVA</a><p>بوتیک آنلاین طلای معاصر؛ طراحی ظریف و خرید شفاف.</p></footer>
  </main>;
}
