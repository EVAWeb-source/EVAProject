import type { CSSProperties } from 'react';
import Link from 'next/link';
import HomeBestSellers from './components/HomeBestSellers';
import styles from './page.module.css';
import mediaStyles from './home-media.module.css';
import cards from './home-cards.module.css';
import editorial from './home-story.module.css';

type SiteMediaItem={slot:string;altText:string|null;positionX:number;positionY:number;zoom:number;asset:{id:string;url:string;originalName:string}|null};
type SiteMediaMap=Record<string,SiteMediaItem>;
type HomeContent={heroEyebrow:string;heroTitle:string;heroBody:string;heroCtaLabel:string;heroCtaHref:string;storyEyebrow:string;storyTitle:string;storyBody:string;storyCtaLabel:string;storyCtaHref:string};

const defaultHomeContent:HomeContent={
  heroEyebrow:'FINE JEWELRY',heroTitle:'جواهراتی برای لحظه‌های ماندگار',heroBody:'طراحی ظریف، وزن دقیق و خرید شفاف؛ برای قطعه‌هایی که قرار است بخشی از داستان تو شوند.',heroCtaLabel:'مشاهده کالکشن ←',heroCtaHref:'/collections/aghaz',
  storyEyebrow:'OUR STORY',storyTitle:'داستان ایوا',storyBody:'در EVA به قطعه‌هایی باور داریم که قرار نیست فقط دیده شوند؛ جواهراتی ظریف و امروزی که با زمان، بخشی از داستان شخصی تو می‌شوند.',storyCtaLabel:'درباره ما ←',storyCtaHref:'/about',
};

const promises = [
  { icon: '◇', title: 'تضمین اصالت', body: 'مشخصات دقیق و قابل‌پیگیری' },
  { icon: '▤', title: 'فاکتور معتبر', body: 'ثبت رسمی اطلاعات همان قطعه' },
  { icon: '→', title: 'ارسال امن و سریع', body: 'روند سفارش قابل‌پیگیری' },
  { icon: '◫', title: 'بسته‌بندی ویژه', body: 'مناسب هدیه و تجربه بازکردن' },
];

const collections = [
  { title: 'گردنبندها', label: 'NECKLACES', type: 'necklace', href: '/shop/necklaces', slot:'COLLECTION_NECKLACES' },
  { title: 'گوشواره‌ها', label: 'EARRINGS', type: 'earrings', href: '/shop/earrings', slot:'COLLECTION_EARRINGS' },
  { title: 'انگشترها', label: 'RINGS', type: 'ring', href: '/shop/rings', slot:'COLLECTION_RINGS' },
  { title: 'دستبندها', label: 'BRACELETS', type: 'bracelet', href: '/shop/bracelets', slot:'COLLECTION_BRACELETS' },
];

async function loadSiteMedia():Promise<SiteMediaMap>{
  const apiBase=process.env.API_URL??'https://eva-api-production-c864.up.railway.app';
  try{const response=await fetch(`${apiBase}/api/v1/site-media`,{next:{revalidate:60}});if(!response.ok)return {};return await response.json() as SiteMediaMap;}catch{return {};}
}

async function loadHomeContent():Promise<HomeContent>{
  const apiBase=process.env.API_URL??'https://eva-api-production-c864.up.railway.app';
  try{const response=await fetch(`${apiBase}/api/v1/site-content/home`,{next:{revalidate:30}});if(!response.ok)return defaultHomeContent;return {...defaultHomeContent,...await response.json() as Partial<HomeContent>};}catch{return defaultHomeContent;}
}

function mediaStyle(item:SiteMediaItem|undefined):CSSProperties|undefined{
  if(!item)return undefined;
  const x=Number.isFinite(item.positionX)?item.positionX:50;const y=Number.isFinite(item.positionY)?item.positionY:50;const zoom=Number.isFinite(item.zoom)?item.zoom:100;
  return {objectPosition:`${x}% ${y}%`,transform:`scale(${zoom/100})`,transformOrigin:`${x}% ${y}%`};
}

export default async function HomePage() {
  const [media,content]=await Promise.all([loadSiteMedia(),loadHomeContent()]);
  const heroDesktop=media.HOME_HERO_DESKTOP;
  const heroMobile=media.HOME_HERO_MOBILE;
  const storyImage=media.HOME_STORY;

  return (
    <main className={styles.page}>
      <section className={`${styles.hero} evaHomeHero`}>
        <div className={`${styles.heroCopy} evaHomeHeroCopy`}>
          <span>{content.heroEyebrow}</span>
          <h1>{content.heroTitle}</h1>
          <p>{content.heroBody}</p>
          <Link className={`${styles.heroButton} evaHomeHeroButton`} href={content.heroCtaHref}>{content.heroCtaLabel}</Link>
        </div>
        <div className={`${styles.heroVisual} ${heroDesktop?.asset||heroMobile?.asset?mediaStyles.hasMedia:''} evaHomeHeroVisual`} aria-label={heroDesktop?.altText??heroMobile?.altText??'فضای تصویری ادیتوریال EVA'}>
          {heroDesktop?.asset||heroMobile?.asset?<>
            {heroDesktop?.asset&&<img className={`${mediaStyles.heroMediaImage} ${heroMobile?.asset?mediaStyles.heroDesktopOnly:''}`} src={heroDesktop.asset.url} alt={heroDesktop.altText??'EVA Fine Jewelry'} style={mediaStyle(heroDesktop)}/>}
            {heroMobile?.asset&&<img className={`${mediaStyles.heroMediaImage} ${heroDesktop?.asset?mediaStyles.heroMobileOnly:''}`} src={heroMobile.asset.url} alt={heroMobile.altText??heroDesktop?.altText??'EVA Fine Jewelry'} style={mediaStyle(heroMobile)}/>}
          </>:<><span className={styles.heroJewelry} aria-hidden="true" /><span className={styles.heroQuote} aria-hidden="true">BEAUTY LIVES IN EVERY DETAIL</span></>}
        </div>
      </section>

      <section className={`${styles.promiseStrip} ${editorial.promiseStrip}`} aria-label="مزیت‌های خرید از EVA">
        {promises.map((item) => (<article key={item.title}><span className={`${styles.promiseIcon} ${editorial.promiseIcon}`} aria-hidden="true">{item.icon}</span><div><strong>{item.title}</strong><small>{item.body}</small></div></article>))}
      </section>

      <HomeBestSellers />

      <section className={`${styles.storySection} ${editorial.storySection} homeStorySection`} aria-labelledby="home-story-title">
        <div className={`${styles.storyPanel} ${editorial.storyPanel}`}>
          <div className={`${styles.storyCopy} ${editorial.storyCopy}`}>
            <span>{content.storyEyebrow}</span>
            <h2 id="home-story-title">{content.storyTitle}</h2>
            <p>{content.storyBody}</p>
            <Link className={`${styles.storyButton} ${editorial.storyButton}`} href={content.storyCtaHref}>{content.storyCtaLabel}</Link>
          </div>
          <div className={`${styles.storyVisual} ${storyImage?.asset?mediaStyles.hasMedia:''} ${editorial.storyVisual}`} aria-hidden={!storyImage?.asset}>{storyImage?.asset?<img className={mediaStyles.storyMediaImage} src={storyImage.asset.url} alt={storyImage.altText??'داستان EVA'} style={mediaStyle(storyImage)}/>:<span className={`${styles.storyFloral} ${editorial.storyFloral}`} />}</div>
        </div>
      </section>

      <section className={`${styles.collectionsSection} homeCollectionsSection`} aria-labelledby="home-collections-title">
        <div className={styles.sectionHeading}><span>OUR COLLECTIONS</span><h2 id="home-collections-title">کالکشن‌های ما</h2><i aria-hidden="true" /></div>
        <div className={`${styles.collectionGrid} ${cards.collectionGrid}`}>
          {collections.map((collection) => {const image=media[collection.slot];return <Link className={`${styles.collectionCard} ${image?.asset?mediaStyles.collectionCardWithMedia:''} ${cards.collectionCard}`} data-type={collection.type} href={collection.href} key={collection.title}>
              {image?.asset?<img className={mediaStyles.collectionMediaImage} src={image.asset.url} alt={image.altText??collection.title} style={mediaStyle(image)}/>:<i aria-hidden="true" />}
              <div><span>{collection.label}</span><strong>{collection.title}</strong></div>
            </Link>;})}
        </div>
      </section>
    </main>
  );
}
