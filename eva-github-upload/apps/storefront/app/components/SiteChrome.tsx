'use client';

import Link from 'next/link';
import type { MutableRefObject, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import styles from './SiteChrome.module.css';

const EVA_LOGO_DATA_URI = 'data:image/webp;base64,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';

const primaryNav = [
  ['/', 'خانه'],
  ['/collections', 'کالکشن‌ها'],
  ['/shop/necklaces', 'گردنبند'],
  ['/shop/rings', 'انگشتر'],
  ['/shop/earrings', 'گوشواره'],
  ['/about', 'درباره ما'],
] as const;

const minimalPrefixes = ['/invoice/', '/verify/', '/payment/', '/success'];
const LONG_NAV_DELAY_MS = 1100;
const LONG_LOADER_MIN_VISIBLE_MS = 460;
const LONG_LOADER_EXIT_MS = 240;
const LONG_NAV_SAFETY_MS = 12000;

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

function HeaderIcon({ type }: { type: 'search' | 'user' | 'heart' | 'bag' }) {
  if (type === 'search') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.2"/><path d="m15.5 15.5 4.2 4.2"/></svg>;
  if (type === 'user') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7.6" r="3.5"/><path d="M5.7 20c.4-4.3 2.5-6.5 6.3-6.5s5.9 2.2 6.3 6.5"/></svg>;
  if (type === 'heart') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.3 5.9c-1.8-1.8-4.8-1.8-6.6 0L12 7.6l-1.7-1.7c-1.8-1.8-4.8-1.8-6.6 0s-1.8 4.7 0 6.5L12 20l8.3-7.6c1.8-1.8 1.8-4.7 0-6.5Z"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.2 8.8h13.6l-1 11H6.2l-1-11Z"/><path d="M8.6 9V6.5A3.4 3.4 0 0 1 12 3.1a3.4 3.4 0 0 1 3.4 3.4V9"/></svg>;
}

export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [longLoaderVisible, setLongLoaderVisible] = useState(false);
  const [longLoaderLeaving, setLongLoaderLeaving] = useState(false);
  const showLoaderTimer = useRef<number | null>(null);
  const hideLoaderTimer = useRef<number | null>(null);
  const exitLoaderTimer = useRef<number | null>(null);
  const safetyTimer = useRef<number | null>(null);
  const loaderShownAt = useRef<number | null>(null);

  const minimal = minimalPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix));

  function clearTimer(ref: MutableRefObject<number | null>) {
    if (ref.current !== null) {
      window.clearTimeout(ref.current);
      ref.current = null;
    }
  }

  function clearNavigationTimers() {
    clearTimer(showLoaderTimer);
    clearTimer(hideLoaderTimer);
    clearTimer(exitLoaderTimer);
    clearTimer(safetyTimer);
  }

  function finishLongLoader(immediate = false) {
    clearTimer(showLoaderTimer);
    clearTimer(safetyTimer);

    if (!loaderShownAt.current || immediate) {
      setLongLoaderVisible(false);
      setLongLoaderLeaving(false);
      loaderShownAt.current = null;
      return;
    }

    const elapsed = Date.now() - loaderShownAt.current;
    const wait = Math.max(0, LONG_LOADER_MIN_VISIBLE_MS - elapsed);
    clearTimer(hideLoaderTimer);
    hideLoaderTimer.current = window.setTimeout(() => {
      setLongLoaderLeaving(true);
      clearTimer(exitLoaderTimer);
      exitLoaderTimer.current = window.setTimeout(() => {
        setLongLoaderVisible(false);
        setLongLoaderLeaving(false);
        loaderShownAt.current = null;
      }, LONG_LOADER_EXIT_MS);
    }, wait);
  }

  function beginLongNavigation() {
    clearNavigationTimers();
    setLongLoaderVisible(false);
    setLongLoaderLeaving(false);
    loaderShownAt.current = null;

    showLoaderTimer.current = window.setTimeout(() => {
      loaderShownAt.current = Date.now();
      setLongLoaderVisible(true);
    }, LONG_NAV_DELAY_MS);

    safetyTimer.current = window.setTimeout(() => {
      finishLongLoader();
    }, LONG_NAV_SAFETY_MS);
  }

  useEffect(() => {
    setMenuOpen(false);
    setWishlistCount(readWishlistCount());
    setCartCount(readCartCount());
    finishLongLoader();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen || longLoaderVisible ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen, longLoaderVisible]);

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

  useEffect(() => {
    const handleInternalNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const element = event.target instanceof Element ? event.target : null;
      const anchor = element?.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (destination.pathname === window.location.pathname) return;
      beginLongNavigation();
    };

    document.addEventListener('click', handleInternalNavigation, true);
    return () => {
      document.removeEventListener('click', handleInternalNavigation, true);
      clearNavigationTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (minimal) return <>{children}</>;

  const active = (href: string) => href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <header className={`${styles.header} evaApprovedHeader`}>
        <Link className={`${styles.brand} evaApprovedBrand`} href="/" aria-label="EVA"><img className="evaBrandLogoImage" src={EVA_LOGO_DATA_URI} alt="EVA" /></Link>

        <nav className={`${styles.desktopNav} evaApprovedNav`} aria-label="ناوبری اصلی">
          {primaryNav.map(([href, label]) => (
            <Link className={active(href) ? styles.active : ''} href={href} key={href}>{label}</Link>
          ))}
        </nav>

        <div className={`${styles.actions} evaApprovedActions`}>
          <Link className={`${styles.iconAction} evaApprovedAction`} href="/cart" aria-label="سبد خرید"><HeaderIcon type="bag" />{cartCount > 0 && <small>{new Intl.NumberFormat('fa-IR').format(cartCount)}</small>}</Link>
          <Link className={`${styles.iconAction} evaApprovedAction`} href="/wishlist" aria-label="علاقه‌مندی‌ها"><HeaderIcon type="heart" />{wishlistCount > 0 && <small>{new Intl.NumberFormat('fa-IR').format(wishlistCount)}</small>}</Link>
          <Link className={`${styles.iconAction} evaApprovedAction`} href="/account" aria-label="حساب کاربری"><HeaderIcon type="user" /></Link>
          <Link className={`${styles.iconAction} evaApprovedAction`} href="/shop" aria-label="جستجو"><HeaderIcon type="search" /></Link>
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

      {longLoaderVisible && (
        <div className={`${styles.longLoader}${longLoaderLeaving ? ` ${styles.longLoaderLeaving}` : ''}`} role="status" aria-live="polite" aria-busy="true">
          <span className={styles.srOnly}>در حال بارگذاری صفحه</span>
          <div className={styles.longLoaderMark} aria-hidden="true"><div className={styles.longLoaderHalo}/><div className={styles.longLoaderLogo}>EVA</div><div className={styles.longLoaderShimmer}/></div>
        </div>
      )}

      {menuOpen && (
        <div className={styles.mobileOverlay} role="dialog" aria-modal="true" aria-label="منوی EVA">
          <button className={styles.closeButton} onClick={() => setMenuOpen(false)} aria-label="بستن منو">×</button>
          <Link className={styles.mobileBrand} href="/" aria-label="EVA"><img className="evaMobileBrandLogo" src={EVA_LOGO_DATA_URI} alt="EVA" /></Link>
          <nav className={styles.mobileNav}>{primaryNav.map(([href, label]) => <Link href={href} key={href}>{label}<span>←</span></Link>)}</nav>
          <div className={styles.mobileUtilities}>
            <Link href="/account">حساب من</Link><Link href="/wishlist">علاقه‌مندی‌ها {wishlistCount > 0 ? `(${new Intl.NumberFormat('fa-IR').format(wishlistCount)})` : ''}</Link><Link href="/cart">سبد خرید {cartCount > 0 ? `(${new Intl.NumberFormat('fa-IR').format(cartCount)})` : ''}</Link><Link href="/track-order">رهگیری سفارش</Link><Link href="/trust">اعتماد به EVA</Link><Link href="/contact">تماس</Link>
          </div>
        </div>
      )}
    </>
  );
}
