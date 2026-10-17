import Link from 'next/link';
import HomeBestSellers from './components/HomeBestSellers';
import styles from './page.module.css';
import cards from './home-cards.module.css';
import editorial from './home-story.module.css';

type SiteMediaItem={slot:string;altText:string|null;asset:{id:string;url:string;originalName:string}|null};
type SiteMediaMap=Record<string,SiteMediaItem>;

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
  try{
    const response=await fetch(`${apiBase}/api/v1/site-media`,{next:{revalidate:60}});
    if(!response.ok)return {};
    return await response.json() as SiteMediaMap;
  }catch{return {};}
}

export default async function HomePage() {
  const media=await loadSiteMedia();
  const heroDesktop=media.HOME_HERO_DESKTOP;
  const heroMobile=media.HOME_HERO_MOBILE;
  const storyImage=media.HOME_STORY;

  return (
    <main className={styles.page}>
      <section className={`${styles.hero} evaHomeHero`}>
        <div className={`${styles.heroCopy} evaHomeHeroCopy`}>
          <span>FINE JEWELRY</span>
          <h1>جواهراتی برای لحظه‌های ماندگار</h1>
          <p>طراحی ظریف، وزن دقیق و خرید شفاف؛ برای قطعه‌هایی که قرار است بخشی از داستان تو شوند.</p>
          <Link className={`${styles.heroButton} evaHomeHeroButton`} href="/collections/aghaz">مشاهده کالکشن ←</Link>
        </div>
        <div className={`${styles.heroVisual} ${heroDesktop?.asset||heroMobile?.asset?styles.hasMedia:''} evaHomeHeroVisual`} aria-label={heroDesktop?.altText??heroMobile?.altText??'فضای تصویری ادیتوریال EVA'}>
          {heroDesktop?.asset||heroMobile?.asset?<picture className={styles.mediaPicture}>{heroMobile?.asset&&<source media="(max-width: 820px)" srcSet={heroMobile.asset.url}/>}<img className={styles.heroMediaImage} src={heroDesktop?.asset?.url??heroMobile?.asset?.url} alt={heroDesktop?.altText??heroMobile?.altText??'EVA Fine Jewelry'}/></picture>:<><span className={styles.heroJewelry} aria-hidden="true" /><span className={styles.heroQuote} aria-hidden="true">BEAUTY LIVES IN EVERY DETAIL</span></>}
        </div>
      </section>

      <section className={`${styles.promiseStrip} ${editorial.promiseStrip}`} aria-label="مزیت‌های خرید از EVA">
        {promises.map((item) => (
          <article key={item.title}>
            <span className={`${styles.promiseIcon} ${editorial.promiseIcon}`} aria-hidden="true">{item.icon}</span>
            <div><strong>{item.title}</strong><small>{item.body}</small></div>
          </article>
        ))}
      </section>

      <HomeBestSellers />

      <section className={`${styles.storySection} ${editorial.storySection} homeStorySection`} aria-labelledby="home-story-title">
        <div className={`${styles.storyPanel} ${editorial.storyPanel}`}>
          <div className={`${styles.storyCopy} ${editorial.storyCopy}`}>
            <span>OUR STORY</span>
            <h2 id="home-story-title">داستان ایوا</h2>
            <p>در EVA به قطعه‌هایی باور داریم که قرار نیست فقط دیده شوند؛ جواهراتی ظریف و امروزی که با زمان، بخشی از داستان شخصی تو می‌شوند.</p>
            <Link className={`${styles.storyButton} ${editorial.storyButton}`} href="/about">درباره ما ←</Link>
          </div>
          <div className={`${styles.storyVisual} ${storyImage?.asset?styles.hasMedia:''} ${editorial.storyVisual}`} aria-hidden={!storyImage?.asset}>{storyImage?.asset?<img className={styles.storyMediaImage} src={storyImage.asset.url} alt={storyImage.altText??'داستان EVA'}/>:<span className={`${styles.storyFloral} ${editorial.storyFloral}`} />}</div>
        </div>
      </section>

      <section className={`${styles.collectionsSection} homeCollectionsSection`} aria-labelledby="home-collections-title">
        <div className={styles.sectionHeading}>
          <span>OUR COLLECTIONS</span>
          <h2 id="home-collections-title">کالکشن‌های ما</h2>
          <i aria-hidden="true" />
        </div>

        <div className={`${styles.collectionGrid} ${cards.collectionGrid}`}>
          {collections.map((collection) => {const image=media[collection.slot];return <Link className={`${styles.collectionCard} ${image?.asset?styles.collectionCardWithMedia:''} ${cards.collectionCard}`} data-type={collection.type} href={collection.href} key={collection.title}>
              {image?.asset?<img className={styles.collectionMediaImage} src={image.asset.url} alt={image.altText??collection.title}/>:<i aria-hidden="true" />}
              <div><span>{collection.label}</span><strong>{collection.title}</strong></div>
            </Link>;})}
        </div>
      </section>
    </main>
  );
}
