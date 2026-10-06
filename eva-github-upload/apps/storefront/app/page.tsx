import Link from 'next/link';
import HomeBestSellers from './components/HomeBestSellers';
import styles from './page.module.css';

const promises = [
  { icon: '◇', title: 'تضمین اصالت', body: 'مشخصات دقیق و قابل‌پیگیری' },
  { icon: '▤', title: 'فاکتور معتبر', body: 'ثبت رسمی اطلاعات همان قطعه' },
  { icon: '→', title: 'ارسال امن و سریع', body: 'روند سفارش قابل‌پیگیری' },
  { icon: '◫', title: 'بسته‌بندی ویژه', body: 'مناسب هدیه و تجربه بازکردن' },
];

const collections = [
  { title: 'گردنبندها', label: 'NECKLACES', type: 'necklace', href: '/shop/necklaces' },
  { title: 'گوشواره‌ها', label: 'EARRINGS', type: 'earrings', href: '/shop/earrings' },
  { title: 'انگشترها', label: 'RINGS', type: 'ring', href: '/shop/rings' },
  { title: 'دستبندها', label: 'BRACELETS', type: 'bracelet', href: '/shop/bracelets' },
];

export default function HomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span>FINE JEWELRY</span>
          <h1>جواهراتی برای لحظه‌های ماندگار</h1>
          <p>طراحی ظریف، وزن دقیق و خرید شفاف؛ برای قطعه‌هایی که قرار است بخشی از داستان تو شوند.</p>
          <Link className={styles.heroButton} href="/collections/aghaz">مشاهده کالکشن ←</Link>
        </div>
        <div className={styles.heroVisual} aria-label="فضای تصویری ادیتوریال EVA">
          <span className={styles.heroJewelry} aria-hidden="true" />
          <span className={styles.heroQuote} aria-hidden="true">BEAUTY LIVES IN EVERY DETAIL</span>
        </div>
      </section>

      <section className={styles.promiseStrip} aria-label="مزیت‌های خرید از EVA">
        {promises.map((item) => (
          <article key={item.title}>
            <span className={styles.promiseIcon} aria-hidden="true">{item.icon}</span>
            <div><strong>{item.title}</strong><small>{item.body}</small></div>
          </article>
        ))}
      </section>

      <HomeBestSellers />

      <section className={`${styles.storySection} homeStorySection`} aria-labelledby="home-story-title">
        <div className={styles.storyPanel}>
          <div className={styles.storyCopy}>
            <span>OUR STORY</span>
            <h2 id="home-story-title">داستان EVA</h2>
            <p>در EVA به قطعه‌هایی باور داریم که قرار نیست فقط دیده شوند؛ جواهراتی ظریف و امروزی که با زمان، بخشی از داستان شخصی تو می‌شوند.</p>
            <Link className={styles.storyButton} href="/about">درباره ما ←</Link>
          </div>
          <div className={styles.storyVisual} aria-hidden="true"><span className={styles.storyFloral} /></div>
        </div>
      </section>

      <section className={`${styles.collectionsSection} homeCollectionsSection`} aria-labelledby="home-collections-title">
        <div className={styles.sectionHeading}>
          <span>OUR COLLECTIONS</span>
          <h2 id="home-collections-title">کالکشن‌های ما</h2>
          <i aria-hidden="true" />
        </div>

        <div className={styles.collectionGrid}>
          {collections.map((collection) => (
            <Link className={styles.collectionCard} data-type={collection.type} href={collection.href} key={collection.title}>
              <i aria-hidden="true" />
              <div><span>{collection.label}</span><strong>{collection.title}</strong></div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
