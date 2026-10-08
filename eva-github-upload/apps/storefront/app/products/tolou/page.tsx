import type { Metadata } from 'next';
import Link from 'next/link';
import { cache } from 'react';
import CatalogGrid, { type CatalogProduct } from '../../components/CatalogGrid';
import ProductMediaGallery from '../../components/ProductMediaGallery';
import ProductNotes from '../../components/ProductNotes';
import ProductStructuredData from '../../components/ProductStructuredData';
import { publicMetadata } from '../../lib/seo';
import ProductPurchase from './ProductPurchase';
import styles from './product.module.css';

export const dynamic='force-dynamic';

type ApiPricing={goldRateTomanPerGram:number;goldValueToman:number;makingToman:number;profitToman:number;taxToman:number;finalPriceToman:number;rateVersion:string;pricingFormulaVersion:string};
type ApiUnit={id:string;unitSku:string;exactWeightGram:string;currentPriceToman:string;status:string;pricing:ApiPricing};
type ProductImage={id:string;url:string;altText:string;role:'MAIN'|'GALLERY'|'ON_BODY'|'DETAIL';sortOrder:number};
type ApiProduct={nameFa:string;slug:string;masterSku:string;purity:number;shortDescription:string|null;story:string|null;goldColor:string|null;styleLabel:string|null;details:string|null;dimensions:string|null;sizeGuide:string|null;careInstructions:string|null;packagingNote:string|null;seoTitle:string|null;seoDescription:string|null;images:ProductImage[];collection:{nameFa:string;slug:string}|null;units:ApiUnit[]};

const apiBase=()=>process.env.API_URL??'https://eva-api-production-c864.up.railway.app';
const getTolou=cache(async ():Promise<ApiProduct>=>{const response=await fetch(`${apiBase()}/api/v1/products/tolou`,{cache:'no-store'});if(!response.ok)throw new Error(`Failed to load Tolou from EVA API: ${response.status}`);return response.json();});
const getCatalog=cache(async ():Promise<CatalogProduct[]>=>{const response=await fetch(`${apiBase()}/api/v1/products`,{cache:'no-store'});if(!response.ok)return [];return response.json();});
function toPersianWeight(value:string){return `${new Intl.NumberFormat('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:3}).format(Number(value))} گرم`;}
function categoryCode(sku:string){return sku.split('-')[2]??'';}

export async function generateMetadata():Promise<Metadata>{
  const product=await getTolou();
  const main=product.images?.find(image=>image.role==='MAIN')?.url;
  return publicMetadata({title:product.seoTitle||`${product.nameFa} | EVA`,description:product.seoDescription||product.shortDescription||'گردنبند طلوع از کالکشن آغاز ایوا.',path:'/products/tolou',images:main?[main]:[]});
}

export default async function TolouPage(){
  const product=await getTolou();
  const collectionName=product.collection?.nameFa??'آغاز';
  const availableUnits=product.units.filter(unit=>unit.status==='AVAILABLE').map(unit=>({id:unit.id,unitSku:unit.unitSku,weight:toPersianWeight(unit.exactWeightGram),price:Number(unit.currentPriceToman),pricing:unit.pricing}));
  const mainImage=[...(product.images??[])].sort((a,b)=>a.sortOrder-b.sortOrder).find(image=>image.role==='MAIN')??product.images?.[0];
  const notes=[product.details&&['جزئیات',product.details],product.dimensions&&['ابعاد / طول',product.dimensions],product.sizeGuide&&['راهنمای سایز',product.sizeGuide],product.careInstructions&&['مراقبت',product.careInstructions],product.packagingNote&&['بسته‌بندی',product.packagingNote]].filter(Boolean) as [string,string][];
  const structuredDescription=product.seoDescription||product.shortDescription||product.story;
  const catalog=await getCatalog();
  const related=catalog.filter(item=>item.slug!==product.slug).map(item=>({...item,units:(item.units??[]).filter(unit=>unit.status==='AVAILABLE')})).filter(item=>item.units.length>0&&(item.collection?.slug===product.collection?.slug||categoryCode(item.masterSku)==='NEC')).sort((a,b)=>Number(b.collection?.slug===product.collection?.slug)-Number(a.collection?.slug===product.collection?.slug)).slice(0,4);

  return <main className={styles.page}>
    <ProductStructuredData name={product.nameFa} slug={product.slug} sku={product.masterSku} purity={product.purity} category="گردنبند" description={structuredDescription} images={product.images??[]} units={product.units}/>

    <div className={styles.breadcrumb}><Link href="/">خانه</Link><span>/</span><Link href="/shop">فروشگاه</Link><span>/</span><Link href="/shop/necklaces">گردنبند</Link><span>/</span><span>{product.nameFa}</span></div>

    <section className={styles.productHero}>
      <ProductMediaGallery images={product.images??[]} name={product.nameFa}/>
      <ProductPurchase product={{name:product.nameFa,slug:product.slug,masterSku:product.masterSku,collection:collectionName,collectionSlug:product.collection?.slug??'aghaz',category:'گردنبند',purity:product.purity,shortDescription:product.shortDescription??undefined,imageUrl:mainImage?.url}} units={availableUnits}/>
    </section>

    <section className={styles.storySection}><div><span className={styles.eyebrow}>THE STORY</span><h2>داستان {product.nameFa}</h2></div><p>{product.story||'«طلوع» از لحظه‌ای الهام گرفته که اولین نور مرز تاریکی را باز می‌کند؛ فرمی مینیمال برای یادآوری یک شروع تازه.'}</p></section>

    <section className={styles.detailsSection}><div><span className={styles.eyebrow}>DETAILS</span><h2>مشخصات محصول</h2></div><dl><div><dt>دسته</dt><dd>گردنبند</dd></div><div><dt>کالکشن</dt><dd>{collectionName}</dd></div><div><dt>عیار</dt><dd>{product.purity} عیار</dd></div>{product.goldColor&&<div><dt>رنگ طلا</dt><dd>{product.goldColor}</dd></div>}{product.styleLabel&&<div><dt>استایل</dt><dd>{product.styleLabel}</dd></div>}<div><dt>کد محصول</dt><dd dir="ltr">{product.masterSku}</dd></div></dl></section>

    <ProductNotes items={notes}/>

    <section className={styles.assuranceSection}><article><span>01 / AUTHENTICITY</span><h3>وزن و عیار مشخص</h3><p>هر Unit با وزن دقیق و عیار ثبت‌شده خودش برای انتخاب نمایش داده می‌شود.</p></article><article><span>02 / INVOICE</span><h3>فاکتور متصل به قطعه</h3><p>سفارش بر اساس همان Unit و قیمت انتخاب‌شده ثبت می‌شود.</p></article><article><span>03 / DELIVERY</span><h3>ارسال و بسته‌بندی</h3><p>{product.packagingNote||'جزئیات ارسال و بسته‌بندی در مسیر ثبت سفارش به‌صورت شفاف نمایش داده می‌شود.'}</p></article></section>

    {related.length>0?<section className={styles.relatedSection}><div className={styles.relatedHeading}><div><span>YOU MAY ALSO LIKE</span><h2>شاید این‌ها را هم دوست داشته باشی</h2></div><Link href="/shop/necklaces">مشاهده بیشتر ←</Link></div><CatalogGrid products={related}/></section>:null}
  </main>;
}
