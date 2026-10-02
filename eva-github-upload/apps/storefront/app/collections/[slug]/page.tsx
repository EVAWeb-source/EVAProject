import { notFound } from 'next/navigation';
import FilteredCatalog from '../../components/FilteredCatalog';
import type { CatalogProduct } from '../../components/CatalogGrid';
import styles from './collection.module.css';

export const dynamic='force-dynamic';

const knownCollections:Record<string,{name:string;eyebrow:string;story:string;longStory:string;dna:string[]}> = {
  aghaz:{
    name:'آغاز',
    eyebrow:'BEGINNING',
    story:'هر شروع، از یک نقطه شکل می‌گیرد.',
    longStory:'آغاز درباره لحظه‌ای است که یک تصمیم کوچک به حرکت تبدیل می‌شود. فرم‌های این کالکشن از نقطه، مسیر و فضای باز الهام گرفته‌اند؛ ساده، سبک و مناسب همراهی روزمره.',
    dna:['نقطه','حرکت','مسیر باز'],
  },
  raha:{
    name:'رها',
    eyebrow:'FREEDOM',
    story:'فضای باز، حرکت نرم و حس سبکی.',
    longStory:'رها روی فرم‌های باز، منحنی‌های نرم و حس آزادی در حرکت تمرکز دارد؛ قطعه‌هایی که حضور دارند اما سنگین و پرزرق‌وبرق نیستند.',
    dna:['سبکی','حرکت نرم','فضای باز'],
  },
  peyvand:{
    name:'پیوند',
    eyebrow:'CONNECTION',
    story:'پیوند میان فرم، معنا و همراهی.',
    longStory:'پیوند از رابطه میان دو فرم و دو نقطه الهام می‌گیرد؛ نزدیک‌شدن، اتصال و ماندگاری بدون از دست‌دادن سادگی.',
    dna:['نزدیکی','اتصال','ماندگاری'],
  },
};

async function getProducts():Promise<CatalogProduct[]>{
  const apiBase=process.env.API_URL ?? 'https://eva-api-production-c864.up.railway.app';
  const response=await fetch(apiBase+'/api/v1/products',{cache:'no-store'});
  if(!response.ok)throw new Error('Failed to load EVA catalog: '+response.status);
  return response.json();
}

export default async function CollectionPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const allProducts=await getProducts();
  const products=allProducts.filter(product=>product.collection?.slug===slug);
  const liveCollection=products.find(product=>product.collection)?.collection;
  const known=knownCollections[slug];

  if(!known && !liveCollection)notFound();

  const name=liveCollection?.nameFa ?? known?.name ?? slug;
  const story=(liveCollection as any)?.story || known?.story || '';
  const eyebrow=known?.eyebrow ?? 'EVA COLLECTION';
  const longStory=known?.longStory ?? story;
  const dna=known?.dna ?? ['فرم','تعادل','سادگی'];

  return <main className={styles.page}>
    <div className={styles.announcement}>ارسال امن • فاکتور معتبر • قیمت شفاف</div>
    <header className={styles.header}>
      <a className={styles.brand} href="/">EVA</a>
      <nav><a href="/shop">فروشگاه</a><a href="/collections">کالکشن‌ها</a><a href="/#gift">هدیه</a><a href="/#lightweight">طلای سبک</a></nav>
      <div className={styles.actions}><a href="/wishlist">♡</a><a href="/account">حساب</a><a className={styles.cart} href="/cart">سبد</a></div>
    </header>

    <div className={styles.breadcrumb}><a href="/">خانه</a><span>/</span><a href="/collections">کالکشن‌ها</a><span>/</span><span>{name}</span></div>

    <section className={styles.hero}>
      <div className={styles.copy}>
        <span>{eyebrow}</span>
        <h1>{name}</h1>
        <p>{story}</p>
        <a href="#pieces">مشاهده قطعه‌ها</a>
      </div>
      <div className={styles.art}>
        <div className={styles.orbitOne}/>
        <div className={styles.orbitTwo}/>
        <span className={styles.line}/>
        <i className={styles.point}/>
      </div>
    </section>

    <section className={styles.dna}>
      <div><span>DESIGN DNA</span><h2>زبان طراحی {name}</h2></div>
      <div className={styles.dnaItems}>
        {dna.map((item,index)=><article key={item}><span>{String(index+1).padStart(2,'0')}</span><strong>{item}</strong></article>)}
      </div>
    </section>

    <section className={styles.story}>
      <span>THE STORY</span>
      <p>{longStory}</p>
    </section>

    <section className={styles.catalog} id="pieces">
      <div className={styles.sectionHead}>
        <div><span>THE PIECES</span><h2>قطعه‌های {name}</h2></div>
        <a href="/shop">همه فروشگاه</a>
      </div>
      <FilteredCatalog products={products} showCategory />
    </section>

    <section className={styles.next}>
      <div><span>EXPLORE MORE</span><h2>کالکشن‌های دیگر EVA</h2></div>
      <div>
        {Object.entries(knownCollections).filter(([key])=>key!==slug).map(([key,item])=><a key={key} href={'/collections/'+key}>{item.name}<span>←</span></a>)}
      </div>
    </section>

    <footer className={styles.footer}><a className={styles.brand} href="/">EVA</a><p>بوتیک آنلاین طلای معاصر؛ طراحی ظریف و خرید شفاف.</p></footer>
  </main>;
}
