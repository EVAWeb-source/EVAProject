'use client';

import Link from 'next/link';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import FilterMenu, { type FilterOption } from '../components/FilterMenu';
import styles from './shop.module.css';

type Unit = {
  id: string;
  unitSku: string;
  exactWeightGram: string;
  currentPriceToman: string;
  status: string;
};

type ProductImage = {
  id: string;
  url: string;
  altText: string;
  role: string;
  sortOrder: number;
};

export type ShopProduct = {
  id: string;
  nameFa: string;
  slug: string;
  masterSku: string;
  purity: number;
  shortDescription?: string | null;
  images?: ProductImage[];
  collection: { nameFa: string; slug: string } | null;
  units: Unit[];
};

type PreparedProduct = {
  product: ShopProduct;
  code: string;
  label: string;
  minWeight: number;
  minPrice: number;
  searchText: string;
  originalIndex: number;
};

type SortKey = 'RECOMMENDED' | 'PRICE_ASC' | 'PRICE_DESC' | 'WEIGHT_ASC';

const categories: Record<string, string> = {
  NEC: 'گردنبند',
  PEN: 'آویز',
  BRA: 'دستبند',
  RIN: 'انگشتر',
  EAR: 'گوشواره',
  SET: 'ست',
  ANK: 'پابند',
  CHM: 'چارم',
};

const categorySlugs: Record<string, string> = {
  NEC: 'necklaces',
  PEN: 'pendants',
  BRA: 'bracelets',
  RIN: 'rings',
  EAR: 'earrings',
  SET: 'sets',
  ANK: 'anklets',
  CHM: 'charms',
};

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

function categoryCode(masterSku: string) {
  return masterSku.split('-')[2] ?? 'OTHER';
}

function price(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

function weight(value: number) {
  return new Intl.NumberFormat('fa-IR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(value) + ' گرم';
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase('fa').replace(/ي/g, 'ی').replace(/ك/g, 'ک');
}

function primaryImage(product: ShopProduct) {
  const sorted = [...(product.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  return sorted.find((image) => image.role === 'MAIN') ?? sorted[0];
}

function Visual({ code }: { code: string }) {
  const variant =
    code === 'RIN'
      ? styles.ring
      : code === 'BRA'
        ? styles.arc
        : code === 'EAR'
          ? styles.drop
          : code === 'SET'
            ? styles.double
            : styles.sun;

  return (
    <div className={styles.visual + ' ' + variant}>
      <span className={styles.chain}/>
      <span className={styles.jewel}/>
    </div>
  );
}

export default function ShopClient({ products }: { products: ShopProduct[] }) {
  const [query, setQuery] = useState('');
  const [collection, setCollection] = useState('ALL');
  const [weightBand, setWeightBand] = useState('ALL');
  const [sort, setSort] = useState<SortKey>('RECOMMENDED');
  const [wishlist, setWishlist] = useState<string[]>([]);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    try {
      setWishlist(JSON.parse(window.localStorage.getItem('eva-wishlist') ?? '[]'));
    } catch {
      setWishlist([]);
    }
  }, []);

  const prepared = useMemo<PreparedProduct[]>(() => products.map((product, originalIndex) => {
    const code = categoryCode(product.masterSku);
    const label = categories[code] ?? 'سایر';
    const weights = product.units.map((unit) => Number(unit.exactWeightGram));
    const prices = product.units.map((unit) => Number(unit.currentPriceToman));

    return {
      product,
      code,
      label,
      minWeight: weights.length ? Math.min(...weights) : Number.POSITIVE_INFINITY,
      minPrice: prices.length ? Math.min(...prices) : Number.POSITIVE_INFINITY,
      searchText: normalize([
        product.nameFa,
        product.shortDescription,
        product.masterSku,
        product.collection?.nameFa,
        label,
      ].filter(Boolean).join(' ')),
      originalIndex,
    };
  }), [products]);

  const collections = useMemo(
    () => Array.from(new Set(products.map((product) => product.collection?.nameFa).filter(Boolean) as string[])),
    [products],
  );

  const collectionOptions = useMemo<FilterOption[]>(
    () => [{ value: 'ALL', label: 'همه کالکشن‌ها' }, ...collections.map((name) => ({ value: name, label: name }))],
    [collections],
  );

  const hero = useMemo(() => {
    for (const product of products) {
      const image = primaryImage(product);
      if (image) return { product, image };
    }
    return null;
  }, [products]);

  const result = useMemo(() => {
    const q = normalize(deferredQuery);
    const filtered = prepared.filter((item) => {
      const { product, minWeight } = item;
      if (product.units.length === 0) return false;

      return (
        (!q || item.searchText.includes(q)) &&
        (collection === 'ALL' || product.collection?.nameFa === collection) &&
        (
          weightBand === 'ALL' ||
          (weightBand === 'ULTRA' && minWeight < 0.7) ||
          (weightBand === 'LIGHT' && minWeight >= 0.7 && minWeight < 1) ||
          (weightBand === 'REGULAR' && minWeight >= 1)
        )
      );
    });

    return [...filtered].sort((a, b) => {
      if (sort === 'PRICE_ASC') return a.minPrice - b.minPrice;
      if (sort === 'PRICE_DESC') return b.minPrice - a.minPrice;
      if (sort === 'WEIGHT_ASC') return a.minWeight - b.minWeight;
      return a.originalIndex - b.originalIndex;
    });
  }, [prepared, deferredQuery, collection, weightBand, sort]);

  const filtersActive = Boolean(
    query || collection !== 'ALL' || weightBand !== 'ALL' || sort !== 'RECOMMENDED',
  );

  function toggleWishlist(slug: string) {
    setWishlist((current) => {
      const next = current.includes(slug)
        ? current.filter((item) => item !== slug)
        : [...current, slug];
      window.localStorage.setItem('eva-wishlist', JSON.stringify(next));
      window.dispatchEvent(new Event('eva-wishlist-change'));
      return next;
    });
  }

  function reset() {
    setQuery('');
    setCollection('ALL');
    setWeightBand('ALL');
    setSort('RECOMMENDED');
  }

  return (
    <>
      <div className={styles.breadcrumb}>
        <Link href="/">خانه</Link><span>/</span><span>فروشگاه</span>
      </div>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span>EVA SHOP</span>
          <h1>فروشگاه</h1>
          <p>قطعه‌های موجود ایوا را با وزن و قیمت شفاف ببین و انتخابت را بر اساس کالکشن، وزن یا بودجه محدود کن.</p>
          <small>{new Intl.NumberFormat('fa-IR').format(result.length)} محصول برای انتخاب</small>
        </div>

        <div className={styles.heroVisual}>
          {hero ? (
            <img src={hero.image.url} alt={hero.image.altText || hero.product.nameFa} decoding="async" />
          ) : (
            <Visual code="NEC"/>
          )}
          <div className={styles.heroCaption}>
            <span>CURATED BY EVA</span>
            <b>{hero?.product.nameFa ?? 'جواهرات ایوا'}</b>
          </div>
        </div>
      </section>

      <nav className={styles.categoryNav} aria-label="دسته‌بندی محصولات">
        <Link className={styles.active} href="/shop">همه محصولات</Link>
        {Object.entries(categorySlugs).map(([code, slug]) => (
          <Link key={code} href={'/shop/' + slug}>{categories[code] ?? code}</Link>
        ))}
      </nav>

      <section className={styles.searchArea} aria-label="جستجوی محصولات">
        <label className={styles.searchBox}>
          <span aria-hidden="true">⌕</span>
          <div>
            <small>جستجو در فروشگاه</small>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="نام محصول، کالکشن یا کد محصول را بنویس..."
              aria-label="جستجو در فروشگاه"
            />
          </div>
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="پاک کردن جستجو">×</button>
          )}
        </label>
      </section>

      <section className={styles.toolbar} aria-label="فیلتر و مرتب‌سازی محصولات">
        <div className={styles.toolbarIntro}>
          <span>FILTER & SORT</span>
          <strong>انتخابت را دقیق‌تر کن</strong>
        </div>

        <div className={styles.tools}>
          <FilterMenu label="کالکشن" value={collection} options={collectionOptions} onChange={setCollection}/>
          <FilterMenu label="وزن" value={weightBand} options={weightOptions} onChange={setWeightBand}/>
          <FilterMenu label="مرتب‌سازی" value={sort} options={sortOptions} onChange={(value) => setSort(value as SortKey)}/>
        </div>
      </section>

      {filtersActive && (
        <div className={styles.filterState}>
          <span>{new Intl.NumberFormat('fa-IR').format(result.length)} نتیجه با انتخاب فعلی</span>
          <button type="button" onClick={reset}>پاک‌کردن جستجو و فیلترها</button>
        </div>
      )}

      {result.length > 0 ? (
        <section className={styles.grid} aria-label="محصولات فروشگاه">
          {result.map((item) => {
            const product = item.product;
            const multiple = product.units.length > 1;
            const liked = wishlist.includes(product.slug);
            const image = primaryImage(product);
            const href = '/products/' + product.slug;

            return (
              <article className={styles.card} key={product.id}>
                <div className={styles.media}>
                  <button
                    type="button"
                    className={liked ? styles.heart + ' ' + styles.heartActive : styles.heart}
                    onClick={() => toggleWishlist(product.slug)}
                    aria-label={liked ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
                  >
                    {liked ? '♥' : '♡'}
                  </button>
                  <Link href={href} prefetch={false} aria-label={product.nameFa}>
                    {image ? (
                      <img
                        className={styles.productImage}
                        src={image.url}
                        alt={image.altText || product.nameFa}
                        loading="lazy"
                        decoding="async"
                        width={800}
                        height={1000}
                      />
                    ) : (
                      <Visual code={item.code}/>
                    )}
                  </Link>
                </div>

                <Link className={styles.cardBody} href={href} prefetch={false}>
                  <div className={styles.info}>
                    <div className={styles.infoTop}>
                      <div>
                        <h2>{product.nameFa}</h2>
                        <p>{item.label}{product.collection ? ' • کالکشن ' + product.collection.nameFa : ''}</p>
                      </div>
                      <span className={styles.purity}>{product.purity}K</span>
                    </div>
                    <div className={styles.meta}>
                      <span>{multiple ? 'از ' : ''}{weight(item.minWeight)}</span>
                      <strong className={styles.price}>
                        {multiple ? <small>از</small> : null}
                        <b dir="ltr">{price(item.minPrice)}</b>
                        <small>تومان</small>
                      </strong>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </section>
      ) : (
        <section className={styles.emptyState}>
          <span>NO RESULTS</span>
          <h2>محصولی با این انتخاب پیدا نشد.</h2>
          <p>جستجو یا فیلترها را تغییر بده و دوباره محصولات را ببین.</p>
          <button type="button" onClick={reset}>نمایش همه محصولات</button>
        </section>
      )}
    </>
  );
}