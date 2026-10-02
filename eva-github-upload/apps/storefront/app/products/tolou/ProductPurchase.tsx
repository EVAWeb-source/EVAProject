'use client';

import { useEffect, useState } from 'react';
import styles from './product.module.css';

type PurchasePricing = {
  goldRateTomanPerGram: number;
  goldValueToman: number;
  makingToman: number;
  profitToman: number;
  taxToman: number;
  finalPriceToman: number;
  rateVersion: string;
  pricingFormulaVersion: string;
};

type PurchaseUnit = {
  id: string;
  unitSku: string;
  weight: string;
  price: number;
  pricing: PurchasePricing;
};

type ProductInfo = {
  name: string;
  slug: string;
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
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    try {
      const current: string[] = JSON.parse(window.localStorage.getItem('eva-wishlist') ?? '[]');
      setLiked(current.includes(product.slug));
    } catch {
      setLiked(false);
    }
  }, [product.slug]);

  function toggleWishlist() {
    try {
      const current: string[] = JSON.parse(window.localStorage.getItem('eva-wishlist') ?? '[]');
      const next = current.includes(product.slug)
        ? current.filter((item) => item !== product.slug)
        : [...current, product.slug];
      window.localStorage.setItem('eva-wishlist', JSON.stringify(next));
      setLiked(next.includes(product.slug));
    } catch {}
  }

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

  const breakdown = selected.pricing;

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
      <div className={styles.secondaryActions}><button onClick={toggleWishlist}>{liked ? '♥ در علاقه‌مندی‌ها' : '♡ افزودن به علاقه‌مندی‌ها'}</button><button onClick={() => navigator.clipboard?.writeText(window.location.href)}>اشتراک‌گذاری</button></div>

      <div className={styles.microTrust}><span>تضمین اصالت</span><span>فاکتور معتبر</span><span>ارسال امن</span></div>

      <div className={styles.breakdown}>
        <button className={styles.breakdownToggle} onClick={() => setDetailsOpen(!detailsOpen)}>
          <span>جزئیات قیمت</span><b>{detailsOpen ? '−' : '+'}</b>
        </button>
        {detailsOpen && (
          <div className={styles.breakdownRows}>
            <div><span>نرخ پایه طلا / گرم</span><strong>{toman(breakdown.goldRateTomanPerGram)}</strong></div>
            <div><span>ارزش طلا</span><strong>{toman(breakdown.goldValueToman)}</strong></div>
            <div><span>اجرت</span><strong>{toman(breakdown.makingToman)}</strong></div>
            <div><span>سود</span><strong>{toman(breakdown.profitToman)}</strong></div>
            <div><span>مالیات</span><strong>{toman(breakdown.taxToman)}</strong></div>
            <div className={styles.total}><span>قیمت نهایی</span><strong>{toman(breakdown.finalPriceToman)}</strong></div>
            <p>
              موتور قیمت‌گذاری فعال است. فرمول فعلی برای تست و با نسخه{' '}
              <span dir="ltr">{breakdown.pricingFormulaVersion}</span> اجرا می‌شود و بعداً می‌توانیم قواعد دقیق نهایی را جایگزین کنیم.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
