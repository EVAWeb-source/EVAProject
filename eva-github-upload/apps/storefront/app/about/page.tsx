import InfoShell from '../components/InfoShell';
import styles from '../components/InfoShell.module.css';

export default function AboutPage(){
  return <InfoShell eyebrow="ABOUT EVA" title="ایوا، طلا برای زندگی واقعی." lead="ایوا با یک ایده ساده شکل گرفته: خرید طلا می‌تواند هم زیبا و شخصی باشد و هم روشن، قابل‌فهم و بدون ابهام.">
    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>OUR POINT OF VIEW</span><h2>طلا، نزدیک‌تر به زندگی روزمره</h2></div>
      <div className={styles.sectionContent}>
        <p>ایوا یک بوتیک آنلاین طلای معاصر است؛ با تمرکز بر قطعه‌های ظریف، سبک و قابل استفاده در زندگی روزمره. انتخاب هر محصول فقط به ظاهر محدود نمی‌شود؛ وزن، فرم، کاربرد و داستان آن هم بخشی از تجربه است.</p>
        <p>هدف ما این است که فاصله میان «انتخاب یک قطعه زیبا» و «خرید مطمئن طلا» کمتر شود؛ بدون اینکه یکی به نفع دیگری قربانی شود.</p>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>WHAT WE VALUE</span><h2>سه اصل ایوا</h2></div>
      <div className={styles.grid3}>
        <article className={styles.card}><span>01 • CLARITY</span><h3>شفافیت</h3><p>وزن، عیار، قیمت و وضعیت سفارش باید پیش از تصمیم‌گیری روشن باشند.</p></article>
        <article className={styles.card}><span>02 • DELICACY</span><h3>ظرافت</h3><p>طراحی مینیمال و جزئیاتی که بدون شلوغی شخصیت خودشان را دارند.</p></article>
        <article className={styles.card}><span>03 • MEANING</span><h3>معنا</h3><p>هر قطعه می‌تواند بخشی از یک خاطره، هدیه یا انتخاب شخصی باشد.</p></article>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>HOW SHOPPING FEELS</span><h2>انتخاب ساده، اطلاعات دقیق</h2></div>
      <div className={styles.sectionContent}>
        <div className={styles.steps}>
          <div className={styles.step}><span>01</span><div><h3>مدل موردنظرت را پیدا کن</h3><p>از فروشگاه، کالکشن‌ها، طلای سبک یا مسیر هدیه به انتخاب مناسب برس.</p></div></div>
          <div className={styles.step}><span>02</span><div><h3>وزن واقعی را انتخاب کن</h3><p>اگر یک مدل در چند وزن موجود باشد، هر قطعه با وزن و قیمت خودش نمایش داده می‌شود.</p></div></div>
          <div className={styles.step}><span>03</span><div><h3>بعد از خرید هم مسیر روشن می‌ماند</h3><p>سفارش، فاکتور و وضعیت ارسال از حساب کاربری و رهگیری سفارش قابل مشاهده‌اند.</p></div></div>
        </div>
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionTitle}><span>DISCOVER EVA</span><h2>ایوا را از مسیر خودت ببین</h2></div>
      <div className={styles.grid2}>
        <article className={styles.card}><span>COLLECTIONS</span><h3>کالکشن‌های ایوا</h3><p>هر کالکشن زبان طراحی و روایت مستقل خودش را دارد.</p><a href="/collections">دیدن کالکشن‌ها ←</a></article>
        <article className={styles.card}><span>TRUST CENTER</span><h3>اعتماد و شفافیت</h3><p>درباره وزن، قیمت، فاکتور و رهگیری سفارش بیشتر بخوان.</p><a href="/trust">مرکز اعتماد ←</a></article>
      </div>
    </section>
  </InfoShell>;
}
