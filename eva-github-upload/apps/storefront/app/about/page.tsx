import InfoShell from '../components/InfoShell';
import styles from '../components/InfoShell.module.css';

export default function AboutPage(){
  return <InfoShell eyebrow="ABOUT EVA" title="ایوا، طلا برای زندگی واقعی." lead="EVA با یک ایده ساده شکل گرفته: خرید طلا می‌تواند هم زیبا و شخصی باشد و هم روشن، قابل‌فهم و بدون ابهام.">
    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>OUR POINT OF VIEW</span><h2>ظرافتی که معنا دارد</h2></div>
      <div className={styles.sectionContent}>
        <p>ایوا یک بوتیک آنلاین طلای معاصر است؛ با تمرکز بر قطعه‌های ظریف، سبک و قابل استفاده در زندگی روزمره. برای ما طراحی فقط ظاهر یک قطعه نیست؛ انتخاب وزن، فرم، اسم و داستان هر محصول بخشی از همان تجربه است.</p>
        <p>در کنار طراحی، شفافیت برای EVA یک اصل عملیاتی است. مشتری باید بداند چه قطعه‌ای با چه وزن و عیاری می‌خرد، قیمت چگونه شکل گرفته و سفارش در چه مرحله‌ای قرار دارد.</p>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>WHAT WE VALUE</span><h2>سه ستون EVA</h2></div>
      <div className={styles.grid3}>
        <article className={styles.card}><span>01 • TRUST</span><h3>اعتماد و اطمینان</h3><p>وزن، عیار، قیمت، فاکتور و وضعیت سفارش باید روشن و قابل‌پیگیری باشند.</p></article>
        <article className={styles.card}><span>02 • DELICACY</span><h3>ظرافت و تمایز</h3><p>فرم‌های مینیمال، وزن‌های کنترل‌شده و جزئیاتی که بدون شلوغی شخصیت دارند.</p></article>
        <article className={styles.card}><span>03 • STORY</span><h3>هویت و داستان</h3><p>هر کالکشن و هر نام بخشی از یک روایت است؛ چیزی فراتر از یک کد محصول.</p></article>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>HOW EVA WORKS</span><h2>زیبایی در جلو، دقت در پشت صحنه</h2></div>
      <div className={styles.sectionContent}>
        <div className={styles.steps}>
          <div className={styles.step}><span>01</span><div><h3>هر مدل یک Master Product است</h3><p>نام، کالکشن و هویت طراحی در سطح مدل نگهداری می‌شود.</p></div></div>
          <div className={styles.step}><span>02</span><div><h3>هر قطعه واقعی یک Unit مستقل است</h3><p>وزن دقیق، موجودی و وضعیت فروش برای همان قطعه کنترل می‌شود.</p></div></div>
          <div className={styles.step}><span>03</span><div><h3>قیمت به همان Unit متصل است</h3><p>مشتری قطعه‌ای را می‌بیند و می‌خرد که وزن و قیمت مشخص خودش را دارد.</p></div></div>
        </div>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>DISCOVER EVA</span><h2>از داستان به قطعه</h2></div>
      <div className={styles.grid2}>
        <article className={styles.card}><span>COLLECTIONS</span><h3>کالکشن‌های EVA</h3><p>آغاز، رها و پیوند هرکدام زبان طراحی و روایت مستقل خودشان را دارند.</p><a href="/collections">دیدن کالکشن‌ها ←</a></article>
        <article className={styles.card}><span>SHOP</span><h3>فروشگاه</h3><p>محصولات واقعاً موجود را بر اساس نوع، وزن، کالکشن و قیمت پیدا کن.</p><a href="/shop">رفتن به فروشگاه ←</a></article>
      </div>
    </section>
  </InfoShell>;
}
