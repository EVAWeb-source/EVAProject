'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './cart.module.css';

type CartItem = {
  productId: string;
  unitId: string;
  name: string;
  collection: string;
  weight: string;
  purity: string;
  price: number;
};

function toman(value: number) {
  return `${new Intl.NumberFormat('fa-IR').format(value)} تومان`;
}

export default function CartPage() {
  const [item, setItem] = useState<CartItem | null>(null);
  const [gift, setGift] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem('eva-cart');
    if (raw) {
      try {
        setItem(JSON.parse(raw));
      } catch {
        window.localStorage.removeItem('eva-cart');
      }
    }
  }, []);

  const shipping = 0;
  const total = useMemo(() => (item?.price ?? 0) + shipping, [item]);

  function removeItem() {
    window.localStorage.removeItem('eva-cart');
    setItem(null);
  }

  if (!item) {
    return (
      <main className={styles.page}>
        <header className={styles.header}><a href="/" className={styles.brand}>EVA</a></header>
        <section className={styles.empty}>
          <span>YOUR CART</span>
          <h1>سبدت هنوز خالیه.</h1>
          <p>از فروشگاه شروع کن و قطعه‌ای که دوست داری را انتخاب کن.</p>
          <a className={styles.primaryButton} href="/shop">مشاهده فروشگاه</a>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a href="/" className={styles.brand}>EVA</a>
        <a href="/shop" className={styles.back}>ادامه خرید</a>
      </header>

      <section className={styles.cartWrap}>
        <div className={styles.cartMain}>
          <div className={styles.titleRow}>
            <div>
              <span>YOUR CART</span>
              <h1>سبد خرید</h1>
            </div>
            <b>۱ قطعه</b>
          </div>

          <article className={styles.itemCard}>
            <div className={styles.visual} aria-hidden="true">
              <span className={styles.chain} />
              <span className={styles.jewel}><i /></span>
            </div>
            <div className={styles.itemInfo}>
              <div>
                <span className={styles.collection}>{item.collection}</span>
                <h2>{item.name}</h2>
                <p>{item.weight} • {item.purity}</p>
                <small>کد قطعه: {item.unitId}</small>
              </div>
              <strong>{toman(item.price)}</strong>
              <button className={styles.remove} onClick={removeItem}>حذف از سبد</button>
            </div>
          </article>

          <div className={styles.reservationNote}>
            <span>◌</span>
            <div><strong>این قطعه برای مدت کوتاهی برای سبد شما نگه داشته می‌شود.</strong><p>در نسخه نهایی، زمان رزرو واقعی به موجودی متصل خواهد شد.</p></div>
          </div>

          <label className={styles.giftOption}>
            <input type="checkbox" checked={gift} onChange={(event) => setGift(event.target.checked)} />
            <div>
              <strong>این سفارش هدیه است</strong>
              <span>بسته‌بندی هدیه، پیام شخصی و عدم نمایش قیمت</span>
            </div>
          </label>

          {gift && (
            <div className={styles.giftPanel}>
              <label>پیام هدیه<textarea placeholder="پیامت را اینجا بنویس..." /></label>
              <label className={styles.hidePrice}><input type="checkbox" defaultChecked /> قیمت داخل بسته نمایش داده نشود</label>
            </div>
          )}
        </div>

        <aside className={styles.summary}>
          <span className={styles.summaryEyebrow}>ORDER SUMMARY</span>
          <h2>خلاصه سفارش</h2>
          <div className={styles.summaryRows}>
            <div><span>محصول</span><strong>{toman(item.price)}</strong></div>
            <div><span>ارسال</span><strong>در مرحله بعد محاسبه می‌شود</strong></div>
            {gift && <div><span>بسته‌بندی هدیه</span><strong>رایگان</strong></div>}
          </div>
          <div className={styles.total}><span>مبلغ قابل پرداخت</span><strong>{toman(total)}</strong></div>
          <a href="/checkout" className={styles.checkoutButton}>ادامه و ثبت اطلاعات ارسال</a>
          <p className={styles.trust}>تضمین اصالت • فاکتور معتبر • پرداخت امن</p>
        </aside>
      </section>
    </main>
  );
}
