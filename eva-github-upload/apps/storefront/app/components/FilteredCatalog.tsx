'use client';

import { useMemo, useState } from 'react';
import CatalogGrid, { type CatalogProduct } from './CatalogGrid';
import FilterMenu, { type FilterOption } from './FilterMenu';
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

const weightOptions: FilterOption[] = [
  { value: 'ALL', label: 'همه وزن‌ها' },
  { value: 'ULTRA', label: 'کمتر از ۰.۷ گرم', note: 'قطعه‌های بسیار سبک' },
  { value: 'LIGHT', label: '۰.۷ تا ۱ گرم', note: 'سبک و مناسب استفاده روزمره' },
  { value: 'REGULAR', label: '۱ گرم و بیشتر', note: 'قطعه‌های پرتر و سنگین‌تر' },
];

const sortOptions: FilterOption[] = [
  { value: 'RECOMMENDED', label: 'پیشنهادی' },
  { value: 'PRICE_ASC', label: 'قیمت: کم به زیاد' },
  { value: 'PRICE_DESC', label: 'قیمت: زیاد به کم' },
  { value: 'WEIGHT_ASC', label: 'وزن: سبک‌تر اول' },
];

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

  const categoryOptions = useMemo<FilterOption[]>(
    () => [{ value: 'ALL', label: 'همه انواع' }, ...categories.map((code) => ({ value: code, label: categoryLabels[code] ?? code }))],
    [categories],
  );

  const collectionOptions = useMemo<FilterOption[]>(
    () => [{ value: 'ALL', label: 'همه کالکشن‌ها' }, ...collections.map((name) => ({ value: name, label: name }))],
    [collections],
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
        <div className={styles.toolbarIntro}>
          <span>FILTER & SORT</span>
          <strong>{new Intl.NumberFormat('fa-IR').format(result.length)} محصول در این دسته</strong>
        </div>

        <div className={styles.controls}>
          {showCategory ? <FilterMenu label="نوع محصول" value={category} options={categoryOptions} onChange={setCategory}/> : null}
          {showCollection ? <FilterMenu label="کالکشن" value={collection} options={collectionOptions} onChange={setCollection}/> : null}
          <FilterMenu label="وزن" value={weight} options={weightOptions} onChange={setWeight}/>
          <FilterMenu label="مرتب‌سازی" value={sort} options={sortOptions} onChange={(value) => setSort(value as SortKey)}/>
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
