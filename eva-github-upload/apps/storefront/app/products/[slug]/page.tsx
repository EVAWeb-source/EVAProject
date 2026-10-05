import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import ProductMediaGallery from '../../components/ProductMediaGallery';
import ProductNotes from '../../components/ProductNotes';
import ProductStructuredData from '../../components/ProductStructuredData';
import { publicMetadata } from '../../lib/seo';
import ProductPurchase from '../tolou/ProductPurchase';
import styles from '../tolou/product.module.css';

export const dynamic='force-dynamic';

type ApiPricing={goldRateTomanPerGram:number;goldValueToman:number;makingToman:number;profitToman:number;taxToman:number;finalPriceToman:number;rateVersion:string;pricingFormulaVersion:string};
type ApiUnit={id:string;unitSku:string;exactWeightGram:string;currentPriceToman:string;status:string;pricing:ApiPricing};
type ProductImage={id:string;url:string;altText:string;role:'MAIN'|'GALLERY'|'ON_BODY'|'DETAIL';sortOrder:number};
type ApiProduct={nameFa:string;slug:string;masterSku:string;purity:number;shortDescription:string|null;story:string|null;goldColor:string|null;styleLabel:string|null;details:string|null;dimensions:string|null;sizeGuide:string|null;careInstructions:string|null;packagingNote:string|null;seoTitle:string|null;seoDescription:string|null;images:ProductImage[];collection:{nameFa:string;slug:string}|null;units:ApiUnit[]};

const categoryLabels:Record<string,string>={NEC:'گردنبند',PEN:'آویز',BRA:'دستبند',RIN:'انگشتر',EAR:'گوشواره',SET:'ست',ANK:'پابند',CHM:'چارم'};
function category(sku:string){return categoryLabels[sku.split('-')[2]??'']??'قطعه طلا';}
function faWeight(value:string){return new Intl.NumberFormat('fa-IR',{minimumFractionDigits:2,maximumFractionDigits:3}).format(Number(value))+' گرم';}
const getProduct=cache(async (slug:string):Promise<ApiProduct|null>=>{const apiBase=process.env.API_URL??'https://eva-api-production-c864.up.railway.app';const response=await fetch(apiBase+'/api/v1/products/'+encodeURIComponent(slug),{cache:'no-store'});if(response.status===404)return null;if(!response.ok)throw new Error('Failed to load product: '+response.status);return response.json();});

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  const product=await getProduct(slug);
  if(!product)return {robots:{index:false,follow:false}};
  const main=product.images?.find(image=>image.role==='MAIN')?.url;
  return publicMetadata({
    title:product.seoTitle||`${product.nameFa} | EVA`,
    description:product.seoDescription||product.shortDescription||`خرید ${product.nameFa} از EVA با وزن و قیمت شفاف.`,
    path:`/products/${product.slug}`,
    images:main?[main]:[],
  });
}

export default async function ProductPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;const product=await getProduct(slug);if(!product)notFound();
  const collectionName=product.collection?.nameFa??'EVA';const availableUnits=product.units.filter(u=>u.status==='AVAILABLE').map(u=>({id:u.id,unitSku:u.unitSku,weight:faWeight(u.exactWeightGram),price:Number(u.currentPriceToman),pricing:u.pricing}));const cat=category(product.masterSku);
  const notes=[product.details&&['جزئیات',product.details],product.dimensions&&['ابعاد / طول',product.dimensions],product.sizeGuide&&['راهنمای سایز',product.sizeGuide],product.careInstructions&&['مراقبت',product.careInstructions],product.packagingNote&&['بسته‌بندی',product.packagingNote]].filter(Boolean) as [string,string][];
  const structuredDescription=product.seoDescription||product.shortDescription||product.story;

  return <main className={styles.page}>
    <ProductStructuredData name={product.nameFa} slug={product.slug} sku={product.masterSku} purity={product.purity} category={cat} description={structuredDescription} images={product.images??[]} units={product.units}/>
    <div className={styles.breadcrumb}><Link href="/">خانه</Link><span>/</span><Link href="/shop">فروشگاه</Link><span>/</span><span>{product.nameFa}</span></div>
    <section className={styles.productHero}><ProductMediaGallery images={product.images??[]} name={product.nameFa}/><ProductPurchase product={{name:product.nameFa,slug:product.slug,masterSku:product.masterSku,collection:collectionName,collectionSlug:product.collection?.slug??'eva',category:cat,purity:product.purity,shortDescription:product.shortDescription??undefined}} units={availableUnits}/></section>
    <section className={styles.storySection}><div><span className={styles.eyebrow}>THE STORY</span><h2>داستان {product.nameFa}</h2></div><p>{product.story||'این قطعه از زبان مینیمال EVA ساخته شده؛ با وزن دقیق هر Unit و اطلاعات شفاف برای انتخابی آگاهانه.'}</p></section>
    <section className={styles.detailsSection}><div><span className={styles.eyebrow}>DETAILS</span><h2>مشخصات محصول</h2></div><dl><div><dt>دسته</dt><dd>{cat}</dd></div><div><dt>کالکشن</dt><dd>{collectionName}</dd></div><div><dt>عیار</dt><dd>{product.purity} عیار</dd></div>{product.goldColor&&<div><dt>رنگ طلا</dt><dd>{product.goldColor}</dd></div>}{product.styleLabel&&<div><dt>استایل</dt><dd>{product.styleLabel}</dd></div>}<div><dt>SKU</dt><dd dir="ltr">{product.masterSku}</dd></div></dl></section>
    <ProductNotes items={notes}/>
    <section className={styles.assuranceSection}><article><span>01</span><h3>اصالت</h3><p>هر Unit با وزن و عیار دقیق خودش ثبت می‌شود.</p></article><article><span>02</span><h3>فاکتور</h3><p>فاکتور به همان قطعه و قیمت ثبت‌شده متصل است.</p></article><article><span>03</span><h3>بسته‌بندی</h3><p>{product.packagingNote||'سفارش در بسته‌بندی EVA آماده می‌شود.'}</p></article></section>
  </main>;
}
