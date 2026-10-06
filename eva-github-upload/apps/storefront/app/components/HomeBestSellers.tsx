'use client';

import Link from 'next/link';
import { useRef } from 'react';
import styles from '../page.module.css';

const products = [
  { name: 'طلوع', meta: 'کالکشن آغاز', price: '۱۴,۸۵۰,۰۰۰ تومان', art: 'sun', href: '/products/tolou' },
  { name: 'افق', meta: 'کالکشن آغاز', price: '۱۵,۴۰۰,۰۰۰ تومان', art: 'drop', href: '/shop' },
  { name: 'بامداد', meta: 'کالکشن آغاز', price: '۱۳,۹۵۰,۰۰۰ تومان', art: 'double', href: '/shop' },
  { name: 'مسیر', meta: 'کالکشن آغاز', price: '۱۲,۹۰۰,۰۰۰ تومان', art: 'ring', href: '/shop' },
  { name: 'آستانه', meta: 'کالکشن آغاز', price: '۱۶,۲۰۰,۰۰۰ تومان', art: 'stone', href: '/shop' },
  { name: 'نقطه', meta: 'کالکشن آغاز', price: '۱۱,۹۵۰,۰۰۰ تومان', art: 'band', href: '/shop' },
  { name: 'راه', meta: 'کالکشن آغاز', price: '۱۵,۹۵۰,۰۰۰ تومان', art: 'arc', href: '/shop' },
  { name: 'گام', meta: 'کالکشن آغاز', price: '۱۳,۴۵۰,۰۰۰ تومان', art: 'line', href: '/shop' },
];

export default function HomeBestSellers() {
  const railRef = useRef<HTMLDivElement>(null);

  const move = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.82, behavior: 'smooth' });
  };

  return (
    <section className={styles.bestSection} aria-labelledby="home-best-title">
      <div className={styles.sectionHeading}>
        <span>BEST SELLERS</span>
        <h2 id="home-best-title">محبوب‌ترین‌ها</h2>
        <i aria-hidden="true" />
      </div>

      <Link className={styles.sectionLink} href="/shop">مشاهده همه محصولات ←</Link>

      <div className={styles.carouselShell}>
        <button className={`${styles.carouselArrow} ${styles.carouselPrev}`} type="button" onClick={() => move(-1)} aria-label="محصولات قبلی">‹</button>
        <div className={styles.productRail} ref={railRef}>
          {products.map((product) => (
            <article className={styles.productCard} key={product.name}>
              <Link href={product.href} prefetch={product.href === '/products/tolou' ? false : undefined}>
                <div className={styles.productMedia}>
                  <span className={styles.heart} aria-hidden="true">♡</span>
                  <div className={styles.jewelryArt} data-art={product.art} aria-hidden="true">
                    <span className={styles.artChain} />
                    <span className={styles.artJewel} />
                  </div>
                </div>
                <div className={styles.productInfo}>
                  <h3>{product.name}</h3>
                  <span>{product.meta}</span>
                  <strong>{product.price}</strong>
                </div>
              </Link>
            </article>
          ))}
        </div>
        <button className={`${styles.carouselArrow} ${styles.carouselNext}`} type="button" onClick={() => move(1)} aria-label="محصولات بعدی">›</button>
      </div>
    </section>
  );
}
