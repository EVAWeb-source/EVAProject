import { notFound } from 'next/navigation';
import FilteredCatalog from '../../components/FilteredCatalog';
import type { CatalogProduct } from '../../components/CatalogGrid';
import styles from './category.module.css';

export const dynamic='force-dynamic';

const categories:Record<string,{code:string;name:string;eyebrow:string;intro:string;guideTitle:string;guide:string}> = {
  necklaces:{code:'NEC',name:'گردنبند',eyebrow:'NECKLACES',intro:'گردنبندهای ظریف و معاصر برای استفاده روزمره، هدیه و استایل‌های مینیمال.',guideTitle:'راهنمای انتخاب گردنبند',guide:'برای انتخاب بهتر، به طول زنجیر، محل قرارگیری روی گردن و وزن دقیق قطعه توجه کن. در صفحه هر محصول، وزن واقعی Unit و قیمت همان قطعه نمایش داده می‌شود.'},
  pendants:{code:'PEN',name:'آویز',eyebrow:'PENDANTS',intro:'آویزهای سبک و مینیمال برای ترکیب با زنجیرهای ساده و استفاده شخصی.',guideTitle:'راهنمای انتخاب آویز',guide:'اندازه آویز، وزن و تناسب آن با زنجیر مهم است. اگر بین چند وزن یک مدل انتخاب می‌کنی، قیمت هر Unit بر اساس وزن واقعی خودش محاسبه می‌شود.'},
  bracelets:{code:'BRA',name:'دستبند',eyebrow:'BRACELETS',intro:'دستبندهای سبک و ظریف برای استفاده روزانه و ترکیب با ساعت یا اکسسوری‌های دیگر.',guideTitle:'راهنمای انتخاب دستبند',guide:'اندازه مچ و میزان آزادی موردنظر را در نظر بگیر. جزئیات سایز و طول نهایی هر مدل در مرحله تکمیل محتوای محصول ثبت می‌شود.'},
  rings:{code:'RIN',name:'انگشتر',eyebrow:'RINGS',intro:'انگشترهای مینیمال EVA با فرم‌های ساده، باز و قابل استفاده در استایل روزمره.',guideTitle:'راهنمای انتخاب انگشتر',guide:'برای انگشتر، سایز دقیق مهم‌تر از هر چیز است. در نسخه نهایی فروشگاه، راهنمای سایز و Unitهای موجود برای هر سایز به‌صورت جدا نمایش داده می‌شوند.'},
  earrings:{code:'EAR',name:'گوشواره',eyebrow:'EARRINGS',intro:'گوشواره‌های سبک با فرم‌های ظریف برای استفاده روزمره و هدیه.',guideTitle:'راهنمای انتخاب گوشواره',guide:'نوع گوشواره، وزن و طول آن روی حس استفاده روزانه اثر دارد. اطلاعات دقیق هر قطعه در صفحه محصول نمایش داده می‌شود.'},
  sets:{code:'SET',name:'ست',eyebrow:'SETS',intro:'ست‌های سبک EVA برای هدیه یا یک انتخاب هماهنگ و آماده.',guideTitle:'راهنمای انتخاب ست',guide:'در صفحه هر ست، اجزای مجموعه و وزن واقعی ثبت می‌شود تا مشخص باشد دقیقاً چه قطعاتی خریداری می‌شوند.'},
  anklets:{code:'ANK',name:'پابند',eyebrow:'ANKLETS',intro:'پابندهای مینیمال و سبک برای استایل‌های ظریف و غیررسمی.',guideTitle:'راهنمای انتخاب پابند',guide:'طول و میزان آزادی پابند در راحتی استفاده مهم است. جزئیات اندازه هر مدل در اطلاعات محصول ثبت خواهد شد.'},
  charms:{code:'CHM',name:'چارم',eyebrow:'CHARMS',intro:'چارم‌های کوچک و معنادار برای شخصی‌سازی و ترکیب با قطعات دیگر.',guideTitle:'راهنمای انتخاب چارم',guide:'برای چارم به اندازه، وزن و نحوه اتصال آن توجه کن. سازگاری با زنجیر یا دستبند در مشخصات محصول درج خواهد شد.'},
};

async function getProducts():Promise<CatalogProduct[]>{
  const apiBase=process.env.API_URL ?? 'https://eva-api-production-c864.up.railway.app';
  const response=await fetch(apiBase+'/api/v1/products',{cache:'no-store'});
  if(!response.ok)throw new Error('Failed to load EVA catalog: '+response.status);
  return response.json();
}

export default async function CategoryPage({params}:{params:Promise<{category:string}>}){
  const {category}=await params;
  const meta=categories[category];
  if(!meta)notFound();

  const products=(await getProducts()).filter(product=>product.masterSku.split('-')[2]===meta.code);

  return <main className={styles.page}>
    <div className={styles.announcement}>ارسال امن • فاکتور معتبر • قیمت شفاف</div>
    <header className={styles.header}>
      <a className={styles.brand} href="/">EVA</a>
      <nav><a href="/shop">فروشگاه</a><a href="/collections">کالکشن‌ها</a><a href="/#gift">هدیه</a><a href="/#lightweight">طلای سبک</a></nav>
      <div className={styles.actions}><a href="/wishlist">♡</a><a href="/account">حساب</a><a className={styles.cart} href="/cart">سبد</a></div>
    </header>

    <div className={styles.breadcrumb}><a href="/">خانه</a><span>/</span><a href="/shop">فروشگاه</a><span>/</span><span>{meta.name}</span></div>

    <section className={styles.hero}>
      <div><span>{meta.eyebrow}</span><h1>{meta.name}</h1><p>{meta.intro}</p></div>
      <div className={styles.symbol}><i/><b/></div>
    </section>

    <nav className={styles.categoryNav}>
      {Object.entries(categories).map(([slug,item])=><a className={slug===category?styles.active:''} key={slug} href={'/shop/'+slug}>{item.name}</a>)}
    </nav>

    <section className={styles.catalog}>
      <FilteredCatalog products={products} showCollection />
    </section>

    <section className={styles.guide}>
      <div><span>CATEGORY GUIDE</span><h2>{meta.guideTitle}</h2></div>
      <p>{meta.guide}</p>
    </section>

    <section className={styles.discovery}>
      <div><span>DISCOVER</span><h2>از کالکشن‌ها پیدا کن</h2><p>اگر به‌جای نوع محصول، داستان و فضای طراحی برایت مهم‌تر است، کالکشن‌های EVA را ببین.</p></div>
      <a href="/collections">مشاهده کالکشن‌ها</a>
    </section>

    <footer className={styles.footer}><a className={styles.brand} href="/">EVA</a><p>بوتیک آنلاین طلای معاصر؛ طراحی ظریف و خرید شفاف.</p></footer>
  </main>;
}
