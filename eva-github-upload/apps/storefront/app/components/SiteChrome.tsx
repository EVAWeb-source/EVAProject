'use client';

import Link from 'next/link';
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
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    const refresh = () => {
      setWishlistCount(readWishlistCount());
      setCartCount(readCartCount());
    };

    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('eva-wishlist-change', refresh);
    window.addEventListener('eva-cart-change', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
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
        <Link className={styles.brand} href="/" aria-label="EVA">EVA</Link>

        <nav className={styles.desktopNav} aria-label="ناوبری اصلی">
          {primaryNav.map(([href, label]) => (
            <Link className={active(href) ? styles.active : ''} href={href} key={href}>{label}</Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <Link className={styles.iconAction} href="/shop" aria-label="جستجو">⌕</Link>
          <Link className={styles.iconAction} href="/wishlist" aria-label="علاقه‌مندی‌ها">
            ♡{wishlistCount > 0 && <small>{new Intl.NumberFormat('fa-IR').format(wishlistCount)}</small>}
          </Link>
          <Link className={styles.accountAction} href="/account">حساب</Link>
          <Link className={styles.cartAction} href="/cart">
            سبد{cartCount > 0 && <small>{new Intl.NumberFormat('fa-IR').format(cartCount)}</small>}
          </Link>
          <button className={styles.menuButton} onClick={() => setMenuOpen(true)} aria-label="باز کردن منو">☰</button>
        </div>
      </header>

      <div className={styles.content}>{children}</div>

      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <Link className={styles.brand} href="/">EVA</Link>
            <p>بوتیک آنلاین طلای معاصر؛ طراحی ظریف، وزن دقیق و خرید شفاف.</p>
          </div>
          <div className={styles.footerLinks}>
            <div><strong>خرید</strong><Link href="/shop">فروشگاه</Link><Link href="/collections">کالکشن‌ها</Link><Link href="/gift">هدیه</Link><Link href="/lightweight">طلای سبک</Link></div>
            <div><strong>راهنما</strong><Link href="/help">مرکز راهنما</Link><Link href="/faq">سوالات متداول</Link><Link href="/shipping-returns">ارسال و مرجوعی</Link><Link href="/track-order">رهگیری سفارش</Link></div>
            <div><strong>اعتماد</strong><Link href="/trust">اعتماد به EVA</Link><Link href="/about">درباره EVA</Link><Link href="/contact">تماس</Link><Link href="/account">حساب من</Link></div>
          </div>
        </div>
        <div className={styles.footerBottom}><span>© EVA 2026</span><span>طراحی‌شده برای یک تجربه آرام و شفاف از خرید طلا.</span></div>
      </footer>

      {menuOpen && (
        <div className={styles.mobileOverlay} role="dialog" aria-modal="true" aria-label="منوی EVA">
          <button className={styles.closeButton} onClick={() => setMenuOpen(false)} aria-label="بستن منو">×</button>
          <Link className={styles.mobileBrand} href="/">EVA</Link>
          <nav className={styles.mobileNav}>
            {primaryNav.map(([href, label]) => <Link href={href} key={href}>{label}<span>←</span></Link>)}
          </nav>
          <div className={styles.mobileUtilities}>
            <Link href="/account">حساب من</Link>
            <Link href="/wishlist">علاقه‌مندی‌ها {wishlistCount > 0 ? `(${new Intl.NumberFormat('fa-IR').format(wishlistCount)})` : ''}</Link>
            <Link href="/cart">سبد خرید {cartCount > 0 ? `(${new Intl.NumberFormat('fa-IR').format(cartCount)})` : ''}</Link>
            <Link href="/track-order">رهگیری سفارش</Link>
            <Link href="/trust">اعتماد به EVA</Link>
            <Link href="/contact">تماس</Link>
          </div>
        </div>
      )}
    </>
  );
}
