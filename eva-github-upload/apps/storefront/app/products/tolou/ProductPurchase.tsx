'use client';

import { useMemo, useState } from 'react';
import styles from './product.module.css';

type PurchaseUnit = {
  id: string;
  unitSku: string;
  weight: string;
  price: number;
};

type ProductInfo = {
  name: string;
  masterSku: string;
  collection: string;
  purity: number;
};

type ProductPurchaseProps = {
  product: ProductInfo;
  units: PurchaseUnit[];
};

function toman(value: number) {
  return `${new Intl.NumberFormat('fa-IR').format(value)} تومان`;
}

export default function ProductPurchase({ product, units }: ProductPurchaseProps) {
  const [selected, setSelected] = useState<PurchaseUnit | null>(units[0] ?? null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [added, setAdded] = useState(false);

  const breakdown = useMemo(() => {
    if (!selected) return null;
    const gold = Math.round(selected.price * 0.78);
    const making = Math.round(selected.price * 0.11);
    const profit = Math.round(selected.price * 0.06);
    const tax = selected.price - gold - making - profit;
    return { gold, making, profit, tax };
  }, [selected]);

  function addToCart() {
    if (!selected) return;

    const cartItem = {
      productId: product.masterSku,
      unitId: selected.id,
      unitSku: selected.unitSku,
      name: product.name,
      collection: `کالکشن ${product.collection}`,
      weight: selected.weight,
      purity: `${product.purity} عیار`,
      price: selected.price,
    };

    window.localStorage.setItem('eva-cart', JSON.stringify(cartItem));
    setAdded(true);
  }

  if (!selected) {
    return (
      <div className={styles.purchasePanel}>
        <a className={styles.collectionLink} href="/#collection">کالکشن {product.collection}</a>
        <h1>{product.name}</h1>
        <p className={styles.subtitle}>گردنبند طلای {product.purity} عیار، ظریف و مناسب استفاده روزمره</p>
        <div className={styles.availability}>این محصول فعلاً موجود نیست.</div>
      </div>
    );
  }

  return (
    <div className={styles.purchasePanel}>
      <a className={styles.collectionLink} href="/#collection">کالکشن {product.collection}</a>
      <h1>{product.name}</h1>
      <p className={styles.subtitle}>گردنبند طلای {product.purity} عیار، ظریف و مناسب استفاده روزمره</p>

      <div className={styles.priceBlock}>
        <strong>{toman(selected.price)}</strong>
        <span>{selected.weight} • {product.purity} عیار</span>
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

      <button className={styles.addToCart} onClick={addToCart}>
        {added ? '✓ به سبد اضافه شد' : 'افزودن به سبد'}
      </button>
      {added && <a href="/cart" className={styles.cartLink}>مشاهده سبد خرید ←</a>}
      <div className={styles.secondaryActions}><button>♡ افزودن به علاقه‌مندی‌ها</button><button>اشتراک‌گذاری</button></div>

      <div className={styles.microTrust}><span>تضمین اصالت</span><span>فاکتور معتبر</span><span>ارسال امن</span></div>

      <div className={styles.breakdown}>
        <button className={styles.breakdownToggle} onClick={() => setDetailsOpen(!detailsOpen)}>
          <span>جزئیات قیمت</span><b>{detailsOpen ? '−' : '+'}</b>
        </button>
        {detailsOpen && breakdown && (
          <div className={styles.breakdownRows}>
            <div><span>ارزش طلا</span><strong>{toman(breakdown.gold)}</strong></div>
            <div><span>اجرت</span><strong>{toman(breakdown.making)}</strong></div>
            <div><span>سود</span><strong>{toman(breakdown.profit)}</strong></div>
            <div><span>مالیات</span><strong>{toman(breakdown.tax)}</strong></div>
            <div className={styles.total}><span>قیمت نهایی</span><strong>{toman(selected.price)}</strong></div>
            <p>قیمت نهایی و موجودی از دیتابیس EVA خوانده می‌شود. تفکیک اجزای قیمت در مرحله اتصال موتور قیمت‌گذاری واقعی جایگزین این محاسبه نمایشی خواهد شد.</p>
          </div>
        )}
      </div>
    </div>
  );
}
