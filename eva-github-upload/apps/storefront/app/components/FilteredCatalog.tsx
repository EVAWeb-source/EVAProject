'use client';

import { useMemo, useState } from 'react';
import CatalogGrid, { type CatalogProduct } from './CatalogGrid';
import styles from './FilteredCatalog.module.css';

const categoryLabels: Record<string, string> = {
  NEC: 'گردنبند',
  PEN: 'آویز',
  BRA: 'دستبند',
  RIN: 'انگشتر',
  EAR: 'گوشواره',
  SET: 'ست',
  ANK: 'پابند',
  CHM: 'چارم',
};

type SortKey = 'RECOMMENDED' | 'PRICE_ASC' | 'PRICE_DESC' | 'WEIGHT_ASC';

function categoryCode(sku: string) {
  return sku.split('-')[2] ?? 'OTHER';
}

export default function FilteredCatalog({
  products,
  showCategory = false,
  showCollection = false,
}: {
  products: CatalogProduct[];
  showCategory?: boolean;
  showCollection?: boolean;
}) {
  const [category, setCategory] = useState('ALL');
  const [collection, setCollection] = useState('ALL');
  const [weight, setWeight] = useState('ALL');
  const [sort, setSort] = useState<SortKey>('RECOMMENDED');

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => categoryCode(product.masterSku)))),
    [products],
  );

  const collections = useMemo(
    () => Array.from(new Set(products.map((product) => product.collection?.nameFa).filter(Boolean) as string[])),
    [products],
  );

  const result = useMemo(() => {
    const filtered = products.filter((product) => {
      if (product.units.length === 0) return false;
      const minWeight = Math.min(...product.units.map((unit) => Number(unit.exactWeightGram)));
      const categoryMatch = !showCategory || category === 'ALL' || categoryCode(product.masterSku) === category;
      const collectionMatch = !showCollection || collection === 'ALL' || product.collection?.nameFa === collection;
      const weightMatch =
        weight === 'ALL' ||
        (weight === 'ULTRA' && minWeight < 0.7) ||
        (weight === 'LIGHT' && minWeight >= 0.7 && minWeight < 1) ||
        (weight === 'REGULAR' && minWeight >= 1);

      return categoryMatch && collectionMatch && weightMatch;
    });

    return [...filtered].sort((a, b) => {
      const aPrice = Math.min(...a.units.map((unit) => Number(unit.currentPriceToman)));
      const bPrice = Math.min(...b.units.map((unit) => Number(unit.currentPriceToman)));
      const aWeight = Math.min(...a.units.map((unit) => Number(unit.exactWeightGram)));
      const bWeight = Math.min(...b.units.map((unit) => Number(unit.exactWeightGram)));

      if (sort === 'PRICE_ASC') return aPrice - bPrice;
      if (sort === 'PRICE_DESC') return bPrice - aPrice;
      if (sort === 'WEIGHT_ASC') return aWeight - bWeight;
      return 0;
    });
  }, [products, showCategory, showCollection, category, collection, weight, sort]);

  function reset() {
    setCategory('ALL');
    setCollection('ALL');
    setWeight('ALL');
    setSort('RECOMMENDED');
  }

  const filtered = category !== 'ALL' || collection !== 'ALL' || weight !== 'ALL' || sort !== 'RECOMMENDED';

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <div className={styles.count} aria-live="polite">{new Intl.NumberFormat('fa-IR').format(result.length)} محصول</div>

        <div className={styles.controls}>
          {showCategory && (
            <label>
              <span>نوع محصول</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="نوع محصول">
                <option value="ALL">همه انواع</option>
                {categories.map((code) => <option key={code} value={code}>{categoryLabels[code] ?? code}</option>)}
              </select>
            </label>
          )}

          {showCollection && (
            <label>
              <span>کالکشن</span>
              <select value={collection} onChange={(event) => setCollection(event.target.value)} aria-label="کالکشن">
                <option value="ALL">همه کالکشن‌ها</option>
                {collections.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
          )}

          <label>
            <span>وزن</span>
            <select value={weight} onChange={(event) => setWeight(event.target.value)} aria-label="وزن">
              <option value="ALL">همه وزن‌ها</option>
              <option value="ULTRA">کمتر از ۰.۷ گرم</option>
              <option value="LIGHT">۰.۷ تا ۱ گرم</option>
              <option value="REGULAR">۱ گرم و بیشتر</option>
            </select>
          </label>

          <label>
            <span>مرتب‌سازی</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)} aria-label="مرتب‌سازی">
              <option value="RECOMMENDED">پیشنهادی</option>
              <option value="PRICE_ASC">قیمت: کم به زیاد</option>
              <option value="PRICE_DESC">قیمت: زیاد به کم</option>
              <option value="WEIGHT_ASC">وزن: سبک‌تر اول</option>
            </select>
          </label>
        </div>
      </div>

      {filtered && (
        <div className={styles.filterState}>
          <span>فیلتر روی محصولات این دسته فعال است</span>
          <button type="button" onClick={reset}>پاک‌کردن فیلترها</button>
        </div>
      )}

      <CatalogGrid products={result}/>
    </div>
  );
}
