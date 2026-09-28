'use client';

import { useMemo, useState } from 'react';
import styles from './product.module.css';

const units = [
  { id: 'U01', weight: '۰.۸۱ گرم', price: 14300000 },
  { id: 'U02', weight: '۰.۸۴ گرم', price: 14850000 },
  { id: 'U03', weight: '۰.۸۹ گرم', price: 15650000 },
];

function toman(value: number) {
  return `${new Intl.NumberFormat('fa-IR').format(value)} تومان`;
}

export default function ProductPurchase() {
  const [selected, setSelected] = useState(units[1]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [added, setAdded] = useState(false);

  const breakdown = useMemo(() => {
    const gold = Math.round(selected.price * 0.78);
    const making = Math.round(selected.price * 0.11);
    const profit = Math.round(selected.price * 0.06);
    const tax = selected.price - gold - making - profit;
    return { gold, making, profit, tax };
  }, [selected]);

  return (
    <div className={styles.purchasePanel}>
      <a className={styles.collectionLink} href="/#collection">کالکشن آغاز</a>
      <h1>طلوع</h1>
      <p className={styles.subtitle}>گردنبند طلای ۱۸ عیار، ظریف و مناسب استفاده روزمره</p>

      <div className={styles.priceBlock}>
        <strong>{toman(selected.price)}</strong>
        <span>{selected.weight} • ۱۸ عیار</span>
      </div>

      <div className={styles.selectorBlock}>
        <div className={styles.labelRow}><strong>وزن‌های موجود</strong><span>هر وزن یک قطعه واقعی است</span></div>
        <div className={styles.units}>
          {units.map((unit) => (
            <button
              key={unit.id}
              className={selected.id === unit.id ? styles.unitActive : ''}
              onClick={() => { setSelected(unit); setAdded(false); }}
            >
              <span>{unit.weight}</span>
              <small>{toman(unit.price)}</small>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.availability}><span /> موجود و آماده سفارش</div>

      <button className={styles.addToCart} onClick={() => setAdded(true)}>
        {added ? '✓ به سبد اضافه شد' : 'افزودن به سبد'}
      </button>
      <div className={styles.secondaryActions}><button>♡ افزودن به علاقه‌مندی‌ها</button><button>اشتراک‌گذاری</button></div>

      <div className={styles.microTrust}><span>تضمین اصالت</span><span>فاکتور معتبر</span><span>ارسال امن</span></div>

      <div className={styles.breakdown}>
        <button className={styles.breakdownToggle} onClick={() => setDetailsOpen(!detailsOpen)}>
          <span>جزئیات قیمت</span><b>{detailsOpen ? '−' : '+'}</b>
        </button>
        {detailsOpen && (
          <div className={styles.breakdownRows}>
            <div><span>ارزش طلا</span><strong>{toman(breakdown.gold)}</strong></div>
            <div><span>اجرت</span><strong>{toman(breakdown.making)}</strong></div>
            <div><span>سود</span><strong>{toman(breakdown.profit)}</strong></div>
            <div><span>مالیات</span><strong>{toman(breakdown.tax)}</strong></div>
            <div className={styles.total}><span>قیمت نهایی</span><strong>{toman(selected.price)}</strong></div>
            <p>این اعداد فعلاً نمونه نمایشی هستند و در مرحله اتصال موتور قیمت‌گذاری به داده واقعی تبدیل می‌شوند.</p>
          </div>
        )}
      </div>
    </div>
  );
}
