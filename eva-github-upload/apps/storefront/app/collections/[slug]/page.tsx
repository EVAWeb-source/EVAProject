import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import FilteredCatalog from '../../components/FilteredCatalog';
import type { CatalogProduct } from '../../components/CatalogGrid';
import { publicMetadata } from '../../lib/seo';
import styles from './collection.module.css';

export const dynamic='force-dynamic';

type KnownCollection={name:string;eyebrow:string;story:string;longStory:string;dna:string[]};
type ImageLike={id:string;url:string;altText:string;role:string;sortOrder:number};
type LiveCollection={nameFa:string;slug:string;story?:string|null};

const knownCollections:Record<string,KnownCollection> = {
  aghaz:{name:'آغاز',eyebrow:'BEGINNING',story:'هر شروع، از یک نقطه شکل می‌گیرد.',longStory:'آغاز درباره لحظه‌ای است که یک تصمیم کوچک به حرکت تبدیل می‌شود. فرم‌های این کالکشن از نقطه، مسیر و فضای باز الهام گرفته‌اند؛ ساده، سبک و مناسب همراهی روزمره.',dna:['نقطه','حرکت','مسیر باز']},
  raha:{name:'رها',eyebrow:'FREEDOM',story:'فضای باز، حرکت نرم و حس سبکی.',longStory:'رها روی فرم‌های باز، منحنی‌های نرم و حس آزادی در حرکت تمرکز دارد؛ قطعه‌هایی که حضور دارند اما سنگین و پرزرق‌وبرق نیستند.',dna:['سبکی','حرکت نرم','فضای باز']},
  peyvand:{name:'پیوند',eyebrow:'CONNECTION',story:'پیوند میان فرم، معنا و همراهی.',longStory:'پیوند از رابطه میان دو فرم و دو نقطه الهام می‌گیرد؛ نزدیک‌شدن، اتصال و ماندگاری بدون از دست‌دادن سادگی.',dna:['نزدیکی','اتصال','ماندگاری']},
};

const getProducts=cache(async ():Promise<CatalogProduct[]>=>{
  const apiBase=process.env.API_URL ?? 'https://eva-api-production-c864.up.railway.app';
  const response=await fetch(apiBase+'/api/v1/products',{cache:'no-store'});
  if(!response.ok)throw new Error('Failed to load EVA catalog: '+response.status);
  return response.json();
});

function formatNumber(value:number){return new Intl.NumberFormat('fa-IR').format(value);}
function formatWeight(value:number){return new Intl.NumberFormat('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:3}).format(value);}
function mainImage(product?:CatalogProduct){
  if(!product?.images?.length)return null;
  const sorted=[...product.images].sort((a,b)=>a.sortOrder-b.sortOrder) as ImageLike[];
  return sorted.find(image=>image.role==='MAIN')??sorted[0]??null;
}
function availableUnits(product:CatalogProduct){return product.units.filter(unit=>unit.status==='AVAILABLE');}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  const known=knownCollections[slug];
  try{
    const products=await getProducts();
    const live=products.find(product=>product.collection?.slug===slug)?.collection as LiveCollection|undefined;
    const image=mainImage(products.find(product=>product.collection?.slug===slug));
    if(live||known){
      const name=live?.nameFa??known?.name??slug;
      const description=live?.story||known?.story||`مشاهده قطعه‌های کالکشن ${name} از ایوا.`;
      return publicMetadata({title:`کالکشن ${name} | EVA`,description,path:`/collections/${slug}`,images:image?[image.url]:[]});
    }
  }catch{
    if(known)return publicMetadata({title:`کالکشن ${known.name} | EVA`,description:known.story,path:`/collections/${slug}`});
  }
  return {robots:{index:false,follow:false}};
}

export default async function CollectionPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const allProducts=await getProducts();
  const products=allProducts.filter(product=>product.collection?.slug===slug);
  const liveCollection=products.find(product=>product.collection)?.collection as LiveCollection|null|undefined;
  const known=knownCollections[slug];

  if(!known && !liveCollection)notFound();

  const name=liveCollection?.nameFa ?? known?.name ?? slug;
  const story=liveCollection?.story || known?.story || 'یک روایت مینیمال از فرم، معنا و طلای قابل پوشیدن.';
  const eyebrow=known?.eyebrow ?? 'EVA COLLECTION';
  const longStory=known?.longStory ?? story;
  const dna=known?.dna ?? ['فرم','تعادل','سادگی'];
  const heroProduct=products.find(product=>mainImage(product))??products[0];
  const heroImage=mainImage(heroProduct);
  const units=products.flatMap(availableUnits);
  const weights=units.map(unit=>Number(unit.exactWeightGram)).filter(Number.isFinite);
  const minWeight=weights.length?Math.min(...weights):null;
  const maxWeight=weights.length?Math.max(...weights):null;

  const collectionMap=new Map<string,{slug:string;name:string;image:ImageLike|null}>();
  for(const product of allProducts){
    if(!product.collection||product.collection.slug===slug)continue;
    if(!collectionMap.has(product.collection.slug))collectionMap.set(product.collection.slug,{slug:product.collection.slug,name:product.collection.nameFa,image:mainImage(product)});
  }
  for(const [key,item] of Object.entries(knownCollections)){
    if(key===slug||collectionMap.has(key))continue;
    collectionMap.set(key,{slug:key,name:item.name,image:null});
  }
  const otherCollections=Array.from(collectionMap.values()).slice(0,3);

  return <main className={styles.page}>
    <div className={styles.breadcrumb}><Link href="/">خانه</Link><span>/</span><Link href="/collections">کالکشن‌ها</Link><span>/</span><span>{name}</span></div>

    <section className={styles.hero}>
      <div className={styles.copy}>
        <span>{eyebrow}</span>
        <h1>{name}</h1>
        <p>{story}</p>
        <div className={styles.heroStats}>
          <div><strong>{formatNumber(products.length)}</strong><span>قطعه</span></div>
          {minWeight!==null&&maxWeight!==null?<div><strong>{formatWeight(minWeight)}–{formatWeight(maxWeight)}</strong><span>گرم</span></div>:null}
        </div>
        <a href="#pieces">مشاهده قطعه‌ها <b>↓</b></a>
      </div>
      <div className={styles.visual}>
        {heroImage?<img src={heroImage.url} alt={heroImage.altText||heroProduct?.nameFa||name} width={1100} height={1300} fetchPriority="high"/>:<div className={styles.fallbackArt}><i/><b/></div>}
        <div className={styles.visualCaption}><span>CURATED BY EVA</span><strong>{heroProduct?.nameFa??`کالکشن ${name}`}</strong></div>
      </div>
    </section>

    <section className={styles.story}>
      <div><span>THE STORY</span><h2>روایت {name}</h2></div>
      <p>{longStory}</p>
    </section>

    <section className={styles.dna}>
      <div className={styles.dnaHeading}><span>DESIGN DNA</span><h2>زبان طراحی {name}</h2><p>سه ایده‌ای که فرم و حس این کالکشن را به هم وصل می‌کنند.</p></div>
      <div className={styles.dnaItems}>{dna.map((item,index)=><article key={item}><span>{String(index+1).padStart(2,'0')}</span><strong>{item}</strong></article>)}</div>
    </section>

    <section className={styles.catalog} id="pieces">
      <div className={styles.sectionHead}><div><span>THE PIECES</span><h2>قطعه‌های {name}</h2><p>هر وزن یک Unit واقعی با قیمت همان قطعه است.</p></div><Link href="/shop">همه فروشگاه ←</Link></div>
      <FilteredCatalog products={products} showCategory />
    </section>

    {otherCollections.length?<section className={styles.next}>
      <div className={styles.nextHeading}><span>EXPLORE MORE</span><h2>کالکشن‌های دیگر ایوا</h2></div>
      <div className={styles.nextGrid}>{otherCollections.map(item=><Link key={item.slug} href={'/collections/'+item.slug} className={styles.nextCard}>
        <div className={styles.nextVisual}>{item.image?<img src={item.image.url} alt={item.image.altText||item.name} loading="lazy" decoding="async" width={700} height={500}/>:<div className={styles.fallbackArt}><i/><b/></div>}</div>
        <div><strong>{item.name}</strong><span>مشاهده ←</span></div>
      </Link>)}</div>
    </section>:null}
  </main>;
}
