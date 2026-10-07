'use client';

import Link from 'next/link';
import { useRef } from 'react';
import styles from '../page.module.css';
import cards from '../home-cards.module.css';

const products = [
  { name: 'طلوع', meta: 'کالکشن آغاز', price: 14850000, art: 'sun', href: '/products/tolou' },
  { name: 'افق', meta: 'کالکشن آغاز', price: 15400000, art: 'drop', href: '/shop' },
  { name: 'بامداد', meta: 'کالکشن آغاز', price: 13950000, art: 'double', href: '/shop' },
  { name: 'مسیر', meta: 'کالکشن آغاز', price: 12900000, art: 'ring', href: '/shop' },
  { name: 'آستانه', meta: 'کالکشن آغاز', price: 16200000, art: 'stone', href: '/shop' },
  { name: 'نقطه', meta: 'کالکشن آغاز', price: 11950000, art: 'band', href: '/shop' },
  { name: 'راه', meta: 'کالکشن آغاز', price: 15950000, art: 'arc', href: '/shop' },
  { name: 'گام', meta: 'کالکشن آغاز', price: 13450000, art: 'line', href: '/shop' },
];

function formatPrice(value: number) {
  return new Intl.NumberFormat('fa-IR').format(value);
}

export default function HomeBestSellers() {
  const railRef = useRef<HTMLDivElement>(null);

  const move = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.82, behavior: 'smooth' });
  };

  return (
    <section className={`${styles.bestSection} homeBestSection`} aria-labelledby="home-best-title">
      <div className={styles.sectionHeading}>
        <span>BEST SELLERS</span>
        <h2 id="home-best-title">محبوب‌ترین‌ها</h2>
        <i aria-hidden="true" />
      </div>

      <Link className={styles.sectionLink} href="/shop">مشاهده همه محصولات ←</Link>

      <div className={`${styles.carouselShell} homeCarouselShell`}>
        <button className={`${styles.carouselArrow} homeCarouselArrow homeCarouselArrowLeft`} type="button" onClick={() => move(-1)} aria-label="نمایش محصولات سمت چپ">←</button>
        <div className={`${styles.productRail} homeProductRail`} ref={railRef}>
          {products.map((product) => (
            <article className={`${styles.productCard} ${cards.productCard}`} key={product.name}>
              <Link href={product.href} prefetch={product.href === '/products/tolou' ? false : undefined}>
                <div className={`${styles.productMedia} ${cards.productMedia}`}>
                  <span className={`${styles.heart} ${cards.heart}`} aria-hidden="true">♡</span>
                  <div className={styles.jewelryArt} data-art={product.art} aria-hidden="true">
                    <span className={styles.artChain} />
                    <span className={styles.artJewel} />
                  </div>
                </div>
                <div className={`${styles.productInfo} ${cards.productInfo}`}>
                  <h3>{product.name}</h3>
                  <span>{product.meta}</span>
                  <div className={cards.priceTag}>
                    <small className={cards.priceCurrency}><span>تو</span><span>مان</span></small>
                    <strong className={cards.priceValue}>{formatPrice(product.price)}</strong>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
        <button className={`${styles.carouselArrow} homeCarouselArrow homeCarouselArrowRight`} type="button" onClick={() => move(1)} aria-label="نمایش محصولات سمت راست">→</button>
      </div>
    </section>
  );
}
