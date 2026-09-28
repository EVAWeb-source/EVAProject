import styles from './shop.module.css';

const products = [
  { name: 'طلوع', type: 'گردنبند', collection: 'آغاز', weight: '۰.۸۴ گرم', price: '۱۴,۸۵۰,۰۰۰ تومان', href: '/products/tolou', art: 'sun' },
  { name: 'افق', type: 'گردنبند', collection: 'آغاز', weight: '۰.۹۲ گرم', price: '۱۶,۲۰۰,۰۰۰ تومان', href: '#', art: 'arc' },
  { name: 'مسیر', type: 'انگشتر', collection: 'آغاز', weight: '۰.۷۲ گرم', price: '۱۲,۹۰۰,۰۰۰ تومان', href: '#', art: 'line' },
  { name: 'راه', type: 'دستبند', collection: 'آغاز', weight: '۰.۹۱ گرم', price: '۱۵,۹۵۰,۰۰۰ تومان', href: '#', art: 'arc' },
  { name: 'روشن', type: 'گوشواره', collection: 'آغاز', weight: '۰.۶۸ گرم', price: '۱۱,۹۵۰,۰۰۰ تومان', href: '#', art: 'drop' },
  { name: 'نوا', type: 'گوشواره', collection: 'آغاز', weight: '۰.۷۵ گرم', price: '۱۳,۲۰۰,۰۰۰ تومان', href: '#', art: 'sun' },
  { name: 'فردا', type: 'ست', collection: 'آغاز', weight: '۱.۳۴ گرم', price: '۲۳,۹۰۰,۰۰۰ تومان', href: '#', art: 'line' },
  { name: 'پروا', type: 'ست', collection: 'آغاز', weight: '۱.۱۸ گرم', price: '۲۱,۳۰۰,۰۰۰ تومان', href: '#', art: 'drop' },
];

function Visual({ art }: { art: string }) {
  return <div className={`${styles.visual} ${styles[art]}`}><span className={styles.chain} /><span className={styles.jewel} /></div>;
}

export default function ShopPage() {
  return (
    <main className={styles.page}>
      <div className={styles.announcement}>ارسال امن • فاکتور معتبر • قیمت شفاف</div>
      <header className={styles.header}>
        <a className={styles.brand} href="/">EVA</a>
        <nav><a href="/shop">فروشگاه</a><a href="/#collection">کالکشن‌ها</a><a href="/#gift">هدیه</a><a href="/#lightweight">طلای سبک</a></nav>
        <div className={styles.actions}><button>⌕</button><button>♡</button><button className={styles.cart}>سبد ۰</button></div>
      </header>

      <section className={styles.intro}>
        <div><span>EVA SHOP</span><h1>فروشگاه</h1><p>قطعه‌های موجود ایوا را بر اساس نوع، وزن و بودجه پیدا کن.</p></div>
        <div className={styles.count}>۸ محصول</div>
      </section>

      <section className={styles.toolbar}>
        <div className={styles.chips}>
          <button className={styles.active}>همه</button><button>گردنبند</button><button>انگشتر</button><button>دستبند</button><button>گوشواره</button><button>طلای سبک</button>
        </div>
        <div className={styles.tools}><button>فیلترها</button><button>مرتب‌سازی: پیشنهادی</button></div>
      </section>

      <section className={styles.grid}>
        {products.map((product) => (
          <article className={styles.card} key={product.name}>
            <a href={product.href}>
              <div className={styles.media}><span className={styles.heart}>♡</span><Visual art={product.art} /></div>
              <div className={styles.info}>
                <div><h2>{product.name}</h2><p>{product.type} • کالکشن {product.collection}</p></div>
                <div className={styles.meta}><span>{product.weight}</span><strong>{product.price}</strong></div>
              </div>
            </a>
          </article>
        ))}
      </section>

      <div className={styles.loadMore}><button>نمایش محصولات بیشتر</button></div>
      <footer className={styles.footer}><a className={styles.brand} href="/">EVA</a><p>بوتیک آنلاین طلای معاصر؛ طراحی ظریف و خرید شفاف.</p></footer>
    </main>
  );
}
