'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import styles from './SiteChrome.module.css';

const primaryNav = [
  ['/shop', 'فروشگاه'],
  ['/collections', 'کالکشن‌ها'],
  ['/gift', 'هدیه'],
  ['/lightweight', 'طلای سبک'],
  ['/about', 'درباره ایوا'],
  ['/help', 'راهنما'],
] as const;

const minimalPrefixes = ['/invoice/', '/verify/', '/payment/', '/success'];

function readWishlistCount() {
  try {
    const value = JSON.parse(window.localStorage.getItem('eva-wishlist') ?? '[]');
    return Array.isArray(value) ? value.length : 0;
  } catch {
    return 0;
  }
}

function readCartCount() {
  try {
    return window.localStorage.getItem('eva-cart') ? 1 : 0;
  } catch {
    return 0;
  }
}

export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  const minimal = minimalPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix));

  useEffect(() => {
    setMenuOpen(false);
    setWishlistCount(readWishlistCount());
    setCartCount(readCartCount());
  }, [pathname]);

  useEffect(() => {
    const refresh = () => {
      setWishlistCount(readWishlistCount());
      setCartCount(readCartCount());
    };

    refresh();
    const interval = window.setInterval(refresh, 700);
    window.addEventListener('storage', refresh);
    window.addEventListener('eva-wishlist-change', refresh);
    window.addEventListener('eva-cart-change', refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('eva-wishlist-change', refresh);
      window.removeEventListener('eva-cart-change', refresh);
    };
  }, []);

  if (minimal) return <>{children}</>;

  const active = (href: string) => href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <div className={styles.announcement}>ارسال امن • فاکتور معتبر • قیمت شفاف</div>
      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label="EVA">EVA</a>

        <nav className={styles.desktopNav} aria-label="ناوبری اصلی">
          {primaryNav.map(([href, label]) => (
            <a className={active(href) ? styles.active : ''} href={href} key={href}>{label}</a>
          ))}
        </nav>

        <div className={styles.actions}>
          <a className={styles.iconAction} href="/shop" aria-label="جستجو">⌕</a>
          <a className={styles.iconAction} href="/wishlist" aria-label="علاقه‌مندی‌ها">
            ♡{wishlistCount > 0 && <small>{new Intl.NumberFormat('fa-IR').format(wishlistCount)}</small>}
          </a>
          <a className={styles.accountAction} href="/account">حساب</a>
          <a className={styles.cartAction} href="/cart">
            سبد{cartCount > 0 && <small>{new Intl.NumberFormat('fa-IR').format(cartCount)}</small>}
          </a>
          <button className={styles.menuButton} onClick={() => setMenuOpen(true)} aria-label="باز کردن منو">☰</button>
        </div>
      </header>

      <div className={styles.content}>{children}</div>

      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <a className={styles.brand} href="/">EVA</a>
            <p>بوتیک آنلاین طلای معاصر؛ طراحی ظریف، وزن دقیق و خرید شفاف.</p>
          </div>
          <div className={styles.footerLinks}>
            <div><strong>خرید</strong><a href="/shop">فروشگاه</a><a href="/collections">کالکشن‌ها</a><a href="/gift">هدیه</a><a href="/lightweight">طلای سبک</a></div>
            <div><strong>راهنما</strong><a href="/help">مرکز راهنما</a><a href="/faq">سوالات متداول</a><a href="/shipping-returns">ارسال و مرجوعی</a><a href="/track-order">رهگیری سفارش</a></div>
            <div><strong>اعتماد</strong><a href="/trust">اعتماد به EVA</a><a href="/about">درباره EVA</a><a href="/contact">تماس</a><a href="/account">حساب من</a></div>
          </div>
        </div>
        <div className={styles.footerBottom}><span>© EVA 2026</span><span>طراحی‌شده برای یک تجربه آرام و شفاف از خرید طلا.</span></div>
      </footer>

      {menuOpen && (
        <div className={styles.mobileOverlay} role="dialog" aria-modal="true" aria-label="منوی EVA">
          <button className={styles.closeButton} onClick={() => setMenuOpen(false)} aria-label="بستن منو">×</button>
          <a className={styles.mobileBrand} href="/">EVA</a>
          <nav className={styles.mobileNav}>
            {primaryNav.map(([href, label]) => <a href={href} key={href}>{label}<span>←</span></a>)}
          </nav>
          <div className={styles.mobileUtilities}>
            <a href="/account">حساب من</a>
            <a href="/wishlist">علاقه‌مندی‌ها {wishlistCount > 0 ? `(${new Intl.NumberFormat('fa-IR').format(wishlistCount)})` : ''}</a>
            <a href="/cart">سبد خرید {cartCount > 0 ? `(${new Intl.NumberFormat('fa-IR').format(cartCount)})` : ''}</a>
            <a href="/track-order">رهگیری سفارش</a>
            <a href="/trust">اعتماد به EVA</a>
            <a href="/contact">تماس</a>
          </div>
        </div>
      )}
    </>
  );
}
