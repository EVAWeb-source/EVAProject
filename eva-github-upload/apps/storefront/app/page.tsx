import Link from 'next/link';

const categories = [
  { title: 'گردنبند', label: 'NECKLACES', symbol: '◯', href: '/shop/necklaces' },
  { title: 'انگشتر', label: 'RINGS', symbol: '◇', href: '/shop/rings' },
  { title: 'دستبند', label: 'BRACELETS', symbol: '⌒', href: '/shop/bracelets' },
  { title: 'گوشواره', label: 'EARRINGS', symbol: '⋮', href: '/shop/earrings' },
];

const products = [
  { name: 'طلوع', collection: 'کالکشن آغاز', weight: '۰.۸۴ گرم', price: '۱۴,۸۵۰,۰۰۰ تومان', art: 'sun', href: '/products/tolou' },
  { name: 'مسیر', collection: 'کالکشن آغاز', weight: '۰.۷۲ گرم', price: '۱۲,۹۰۰,۰۰۰ تومان', art: 'line', href: '/shop' },
  { name: 'راه', collection: 'کالکشن آغاز', weight: '۰.۹۱ گرم', price: '۱۵,۹۵۰,۰۰۰ تومان', art: 'arc', href: '/shop' },
  { name: 'روشن', collection: 'کالکشن آغاز', weight: '۰.۶۸ گرم', price: '۱۱,۹۵۰,۰۰۰ تومان', art: 'drop', href: '/shop' },
];

const trustItems = [
  ['قیمت شفاف', 'وزن، عیار و اجزای قیمت را واضح می‌بینی.'],
  ['فاکتور معتبر', 'هر خرید با فاکتور و اطلاعات همان قطعه ثبت می‌شود.'],
  ['تضمین اصالت', 'هر قطعه با مشخصات دقیق و قابل‌پیگیری عرضه می‌شود.'],
  ['ارسال امن', 'بسته‌بندی مطمئن و روند سفارش قابل‌پیگیری است.'],
];

function ProductVisual({ art }: { art: string }) {
  return (
    <div className={`productVisual productVisual--${art}`} aria-hidden="true">
      <span className="productChain" />
      <span className="productJewel" />
    </div>
  );
}

export default function HomePage() {
  return (
    <main>
      <section className="hero" id="top">
        <div className="heroContent">
          <div className="eyebrow">EVA • GOLD BOUTIQUE</div>
          <h1>طلا، برای لحظه‌هایی که با تو معنا می‌گیرند.</h1>
          <p>قطعه‌های ظریف و معاصر با وزن و قیمت شفاف؛ برای استفاده روزمره، هدیه و لحظه‌هایی که می‌خواهی ماندگارشان کنی.</p>
          <div className="actions">
            <Link className="primaryButton" href="/shop">مشاهده فروشگاه</Link>
            <Link className="textLink" href="/collections/aghaz">کشف کالکشن آغاز</Link>
          </div>
        </div>
        <div className="heroArt" aria-label="نمایش مفهومی یک قطعه طلای ایوا">
          <div className="heroHalo" />
          <div className="heroChain" />
          <div className="heroPendant"><span /></div>
          <div className="heroCaption">18K • LIGHTWEIGHT • EVA</div>
        </div>
      </section>

      <section className="categoryStrip" aria-label="دسته‌بندی محصولات">
        {categories.map((category) => (
          <Link className="categoryCard" href={category.href} key={category.title}>
            <span className="categorySymbol" aria-hidden="true">{category.symbol}</span>
            <span className="categoryLabel">{category.label}</span>
            <strong>{category.title}</strong>
          </Link>
        ))}
      </section>

      <section className="section" id="shop">
        <div className="sectionHeading rowHeading">
          <div><span>SELECTED FOR YOU</span><h2>انتخاب‌های ایوا</h2></div>
          <Link className="textLink" href="/shop">مشاهده همه محصولات</Link>
        </div>
        <div className="productGrid">
          {products.map((product) => (
            <article className="productCard" key={product.name}>
              <Link href={product.href} prefetch={product.href==='/products/tolou'?false:undefined} aria-label={`مشاهده ${product.name}`}>
                <div className="productMedia"><span className="wishlist" aria-hidden="true">♡</span><ProductVisual art={product.art} /></div>
                <div className="productInfo">
                  <div><h3>{product.name}</h3><span>{product.collection}</span></div>
                  <div className="productMeta"><span>{product.weight}</span><strong>{product.price}</strong></div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="collectionStory" id="collection">
        <div className="collectionVisual" aria-hidden="true"><span className="storyPoint" /><span className="storyPath storyPathOne" /><span className="storyPath storyPathTwo" /><span className="storyWord">آغاز</span></div>
        <div className="collectionCopy">
          <span className="eyebrow">COLLECTION 01</span><h2>آغاز</h2><p className="collectionLead">هر شروع، از یک نقطه شکل می‌گیرد.</p>
          <p>کالکشن «آغاز» از نقطه، حرکت و مسیر باز الهام گرفته؛ فرم‌هایی ظریف و ناتمام که یادآور امکانِ ادامه دادن‌اند.</p>
          <Link className="secondaryButton" href="/collections/aghaz">مشاهده کالکشن</Link>
        </div>
      </section>

      <section className="needSection">
        <div className="sectionHeading centeredHeading"><span>SHOP YOUR WAY</span><h2>از کجا شروع کنیم؟</h2><p>مسیر خرید را بر اساس چیزی که برایت مهم‌تر است کوتاه کرده‌ایم.</p></div>
        <div className="needGrid">
          <Link className="needCard" href="/shop"><span>01</span><h3>برای خودم</h3><p>قطعه‌های ظریف، مینیمال و مناسب استفاده روزمره.</p><b>مشاهده انتخاب‌ها ←</b></Link>
          <Link className="needCard needCard--warm" href="/gift"><span>02</span><h3>برای هدیه</h3><p>با بودجه و مناسبت شروع کن؛ ایوا انتخاب‌ها را برایت محدود می‌کند.</p><b>پیدا کردن هدیه ←</b></Link>
          <Link className="needCard needCard--dark" href="/lightweight"><span>03</span><h3>طلای سبک</h3><p>وزن کمتر، طراحی همچنان دقیق و ماندگار.</p><b>کشف طلای سبک ←</b></Link>
        </div>
      </section>

      <section className="trustSection" id="trust">
        <div className="trustIntro"><span className="eyebrow">THE EVA PROMISE</span><h2>زیبایی، بدون ابهام.</h2><p>اعتماد برای ما بخشی از تجربه خرید است؛ نه متنی که فقط پایین سایت نوشته شود.</p><Link className="textLink" href="/trust">مشاهده مرکز اعتماد EVA</Link></div>
        <div className="trustGrid">{trustItems.map(([title, body], index) => <article className="trustItem" key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
      </section>

      <section className="giftExperience">
        <div className="giftBox" aria-hidden="true"><div className="boxLid"><span>EVA</span></div><div className="boxBase" /><div className="giftCard">با تو معنا می‌گیرد.</div></div>
        <div className="giftCopy"><span className="eyebrow">EVA GIFT EXPERIENCE</span><h2>هدیه‌ای که از لحظه باز شدن شروع می‌شود.</h2><p>بسته‌بندی ایوا، پیام هدیه و امکان عدم نمایش قیمت برای سفارشی که قرار است مستقیم به دست عزیزت برسد.</p><Link className="primaryButton" href="/gift">انتخاب هدیه</Link></div>
      </section>
    </main>
  );
}
