import styles from './collections.module.css';

export const dynamic='force-dynamic';

type Product={
  id:string;
  nameFa:string;
  slug:string;
  masterSku:string;
  collection:{nameFa:string;slug:string;story?:string|null}|null;
  units:Array<{currentPriceToman:string;exactWeightGram:string}>;
};

const knownCollections=[
  {slug:'aghaz',name:'آغاز',eyebrow:'BEGINNING',story:'هر شروع، از یک نقطه شکل می‌گیرد.',dna:'نقطه → حرکت → مسیر باز'},
  {slug:'raha',name:'رها',eyebrow:'FREEDOM',story:'فضای باز، حرکت نرم و حس سبکی.',dna:'سبکی → حرکت → رهایی'},
  {slug:'peyvand',name:'پیوند',eyebrow:'CONNECTION',story:'پیوند میان فرم، معنا و همراهی.',dna:'نزدیکی → اتصال → ماندگاری'},
];

async function getProducts():Promise<Product[]>{
  const apiBase=process.env.API_URL ?? 'https://eva-api-production-c864.up.railway.app';
  const response=await fetch(apiBase+'/api/v1/products',{cache:'no-store'});
  if(!response.ok)throw new Error('Failed to load EVA catalog: '+response.status);
  return response.json();
}

function toman(value:number){
  return new Intl.NumberFormat('fa-IR').format(value)+' تومان';
}

export default async function CollectionsPage(){
  const products=await getProducts();

  const dynamicCollections=Array.from(new Map(
    products
      .filter(product=>product.collection)
      .map(product=>[
        product.collection!.slug,
        {
          slug:product.collection!.slug,
          name:product.collection!.nameFa,
          eyebrow:'EVA COLLECTION',
          story:product.collection!.story ?? '',
          dna:'',
        },
      ])
  ).values());

  const merged=new Map<string,(typeof knownCollections)[number]>();
  for(const item of knownCollections)merged.set(item.slug,item);
  for(const item of dynamicCollections){
    const existing=merged.get(item.slug);
    merged.set(item.slug,{
      slug:item.slug,
      name:item.name,
      eyebrow:existing?.eyebrow ?? 'EVA COLLECTION',
      story:item.story || existing?.story || '',
      dna:existing?.dna ?? '',
    });
  }
  const collections=Array.from(merged.values());

  return <main className={styles.page}>
    <div className={styles.announcement}>ارسال امن • فاکتور معتبر • قیمت شفاف</div>
    <header className={styles.header}>
      <a className={styles.brand} href="/">EVA</a>
      <nav><a href="/shop">فروشگاه</a><a href="/collections">کالکشن‌ها</a><a href="/#gift">هدیه</a><a href="/#lightweight">طلای سبک</a></nav>
      <div className={styles.actions}><a href="/wishlist">♡</a><a href="/account">حساب</a><a className={styles.cart} href="/cart">سبد</a></div>
    </header>

    <section className={styles.hero}>
      <span>COLLECTIONS</span>
      <h1>کالکشن‌های EVA</h1>
      <p>هر کالکشن یک مسیر طراحی مستقل دارد؛ از یک ایده شروع می‌شود و در مجموعه‌ای از قطعه‌های قابل پوشیدن ادامه پیدا می‌کند.</p>
    </section>

    <section className={styles.grid}>
      {collections.map((collection,index)=>{
        const items=products.filter(product=>product.collection?.slug===collection.slug);
        const prices=items.flatMap(product=>product.units.map(unit=>Number(unit.currentPriceToman))).filter(Number.isFinite);
        const minPrice=prices.length?Math.min(...prices):null;

        return <article className={styles.card} key={collection.slug}>
          <a href={'/collections/'+collection.slug}>
            <div className={styles.visual}>
              <span>{String(index+1).padStart(2,'0')}</span>
              <div className={styles.orbit}><i/><b/></div>
            </div>
            <div className={styles.content}>
              <span>{collection.eyebrow}</span>
              <h2>{collection.name}</h2>
              <p>{collection.story}</p>
              {collection.dna&&<small>{collection.dna}</small>}
              <div className={styles.meta}>
                <strong>{new Intl.NumberFormat('fa-IR').format(items.length)} محصول</strong>
                <em>{minPrice!==null?'از '+toman(minPrice):'محصولات به‌زودی'}</em>
              </div>
            </div>
          </a>
        </article>;
      })}
    </section>

    <section className={styles.shopCta}>
      <div><span>ALL PIECES</span><h2>اگر هنوز بین کالکشن‌ها انتخاب نکردی</h2><p>همه قطعه‌های موجود را یک‌جا ببین و بر اساس نوع، وزن و قیمت فیلتر کن.</p></div>
      <a href="/shop">مشاهده فروشگاه</a>
    </section>

    <footer className={styles.footer}><a className={styles.brand} href="/">EVA</a><p>بوتیک آنلاین طلای معاصر؛ طراحی ظریف و خرید شفاف.</p></footer>
  </main>;
}
