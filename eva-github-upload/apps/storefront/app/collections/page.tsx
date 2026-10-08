import Link from 'next/link';
import styles from './collections.module.css';

export const dynamic='force-dynamic';

type ProductImage={id:string;url:string;altText:string;role:string;sortOrder:number};
type Product={
  id:string;
  nameFa:string;
  slug:string;
  masterSku:string;
  images?:ProductImage[];
  collection:{nameFa:string;slug:string;story?:string|null}|null;
  units:Array<{currentPriceToman:string;exactWeightGram:string;status?:string}>;
};

type CollectionView={slug:string;name:string;eyebrow:string;story:string;dna:string};

const knownCollections:CollectionView[]=[
  {slug:'aghaz',name:'آغاز',eyebrow:'BEGINNING',story:'هر شروع، از یک نقطه شکل می‌گیرد.',dna:'نقطه · حرکت · مسیر باز'},
  {slug:'raha',name:'رها',eyebrow:'FREEDOM',story:'فضای باز، حرکت نرم و حس سبکی.',dna:'سبکی · حرکت · رهایی'},
  {slug:'peyvand',name:'پیوند',eyebrow:'CONNECTION',story:'پیوند میان فرم، معنا و همراهی.',dna:'نزدیکی · اتصال · ماندگاری'},
];

async function getProducts():Promise<Product[]>{
  const apiBase=process.env.API_URL ?? 'https://eva-api-production-c864.up.railway.app';
  const response=await fetch(apiBase+'/api/v1/products',{cache:'no-store'});
  if(!response.ok)throw new Error('Failed to load EVA catalog: '+response.status);
  return response.json();
}

function formatNumber(value:number){return new Intl.NumberFormat('fa-IR').format(value);}
function formatPrice(value:number){return new Intl.NumberFormat('fa-IR').format(value);}
function mainImage(product?:Product){
  if(!product?.images?.length)return null;
  const sorted=[...product.images].sort((a,b)=>a.sortOrder-b.sortOrder);
  return sorted.find(image=>image.role==='MAIN')??sorted[0]??null;
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

  const merged=new Map<string,CollectionView>();
  for(const item of knownCollections)merged.set(item.slug,item);
  for(const item of dynamicCollections){
    const existing=merged.get(item.slug);
    merged.set(item.slug,{
      slug:item.slug,
      name:item.name,
      eyebrow:existing?.eyebrow ?? item.eyebrow,
      story:item.story || existing?.story || '',
      dna:existing?.dna ?? '',
    });
  }
  const collections=Array.from(merged.values());
  const totalPieces=products.filter(product=>product.units.some(unit=>unit.status?unit.status==='AVAILABLE':true)).length;
  const heroCollection=collections.find(collection=>products.some(product=>product.collection?.slug===collection.slug))??collections[0];
  const heroProduct=products.find(product=>product.collection?.slug===heroCollection?.slug);
  const heroImage=mainImage(heroProduct);

  return <main className={styles.page}>
    <div className={styles.breadcrumb}><Link href="/">خانه</Link><span>/</span><span>کالکشن‌ها</span></div>

    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <span>COLLECTIONS</span>
        <h1>کالکشن‌های ایوا</h1>
        <p>هر کالکشن، یک روایت مستقل از فرم و معناست؛ قطعه‌هایی که کنار هم یک جهان بصری می‌سازند و جداگانه هم قابل زندگی‌اند.</p>
        <div className={styles.heroMeta}><span>{formatNumber(collections.length)} کالکشن</span><i/><span>{formatNumber(totalPieces)} قطعه در فروشگاه</span></div>
      </div>
      <Link className={styles.heroVisual} href={heroCollection?'/collections/'+heroCollection.slug:'/shop'}>
        {heroImage?<img src={heroImage.url} alt={heroImage.altText||heroProduct?.nameFa||'کالکشن ایوا'} width={1100} height={900} fetchPriority="high"/>:<div className={styles.fallbackArt}><i/><b/></div>}
        <div className={styles.heroCaption}><span>{heroCollection?.eyebrow??'EVA COLLECTION'}</span><strong>{heroCollection?.name??'ایوا'}</strong></div>
      </Link>
    </section>

    <section className={styles.intro}>
      <span>CURATED WORLDS</span>
      <p>به‌جای دسته‌بندی صرف، هر کالکشن ایوا با یک حس و زبان طراحی مشخص شکل می‌گیرد. وارد هر کدام شو و داستان، فرم‌ها و قطعه‌های همان جهان را ببین.</p>
    </section>

    <section className={styles.grid} aria-label="کالکشن‌های ایوا">
      {collections.map((collection,index)=>{
        const items=products.filter(product=>product.collection?.slug===collection.slug);
        const prices=items.flatMap(product=>product.units.map(unit=>Number(unit.currentPriceToman))).filter(Number.isFinite);
        const minPrice=prices.length?Math.min(...prices):null;
        const image=mainImage(items[0]);

        return <article className={styles.card} key={collection.slug}>
          <Link href={'/collections/'+collection.slug}>
            <div className={styles.visual}>
              {image?<img src={image.url} alt={image.altText||items[0]?.nameFa||collection.name} loading="lazy" decoding="async" width={900} height={1050}/>:<div className={styles.fallbackArt}><i/><b/></div>}
              <span className={styles.index}>{String(index+1).padStart(2,'0')}</span>
              <span className={styles.viewLabel}>مشاهده کالکشن ←</span>
            </div>
            <div className={styles.content}>
              <span>{collection.eyebrow}</span>
              <div className={styles.titleLine}><h2>{collection.name}</h2><em>{formatNumber(items.length)} قطعه</em></div>
              <p>{collection.story||'یک روایت مینیمال از فرم، طلا و همراهی روزمره.'}</p>
              {collection.dna&&<small>{collection.dna}</small>}
              <div className={styles.meta}>
                <span>{minPrice!==null?<>شروع قیمت <strong>{formatPrice(minPrice)}</strong> تومان</>:'محصولات به‌زودی'}</span>
                <b>←</b>
              </div>
            </div>
          </Link>
        </article>;
      })}
    </section>

    <section className={styles.shopCta}>
      <div><span>ALL PIECES</span><h2>هنوز بین کالکشن‌ها انتخاب نکردی؟</h2><p>همه قطعه‌های موجود را یک‌جا ببین و بر اساس نوع، کالکشن، وزن و قیمت انتخاب کن.</p></div>
      <Link href="/shop">مشاهده همه محصولات <b>←</b></Link>
    </section>
  </main>;
}
