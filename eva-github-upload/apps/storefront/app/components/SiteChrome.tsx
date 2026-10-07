'use client';

import Link from 'next/link';
import type { CSSProperties, MutableRefObject, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import styles from './SiteChrome.module.css';

const EVA_MARK_SRC = '/brand/eva-mark.webp';
const EVA_WORDMARK_SRC = '/brand/eva-wordmark.webp';

const brandResetStyle: CSSProperties = {
  paddingLeft: 0,
  letterSpacing: 0,
  fontSize: 0,
  lineHeight: 0,
};

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
        <Link className={`${styles.brand} evaApprovedBrand`} href="/" aria-label="EVA">
          <img className="evaBrandLogoImage" src={EVA_MARK_SRC} alt="" width={160} height={137} decoding="async" />
        </Link>

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
            <Link className={styles.brand} href="/" aria-label="EVA" style={brandResetStyle}>
              <img src={EVA_WORDMARK_SRC} alt="" width={240} height={103} decoding="async" style={{ display: 'block', width: '138px', height: 'auto' }} />
            </Link>
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
          <div className={styles.longLoaderMark} aria-hidden="true">
            <div className={styles.longLoaderHalo}/>
            <img
              src={EVA_WORDMARK_SRC}
              alt=""
              width={240}
              height={103}
              decoding="async"
              style={{ position: 'relative', zIndex: 2, display: 'block', width: '132px', height: 'auto', animation: 'longLogoEnter .48s var(--eva-ease) forwards' }}
            />
            <div className={styles.longLoaderShimmer}/>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className={styles.mobileOverlay} role="dialog" aria-modal="true" aria-label="منوی EVA">
          <button className={styles.closeButton} onClick={() => setMenuOpen(false)} aria-label="بستن منو">×</button>
          <Link className={styles.mobileBrand} href="/" aria-label="EVA" style={{ ...brandResetStyle, display: 'inline-flex', alignItems: 'center' }}>
            <img src={EVA_WORDMARK_SRC} alt="" width={240} height={103} decoding="async" style={{ display: 'block', width: '126px', height: 'auto' }} />
          </Link>
          <nav className={styles.mobileNav}>{primaryNav.map(([href, label]) => <Link href={href} key={href}>{label}<span>←</span></Link>)}</nav>
          <div className={styles.mobileUtilities}>
            <Link href="/account">حساب من</Link><Link href="/wishlist">علاقه‌مندی‌ها {wishlistCount > 0 ? `(${new Intl.NumberFormat('fa-IR').format(wishlistCount)})` : ''}</Link><Link href="/cart">سبد خرید {cartCount > 0 ? `(${new Intl.NumberFormat('fa-IR').format(cartCount)})` : ''}</Link><Link href="/track-order">رهگیری سفارش</Link><Link href="/trust">اعتماد به EVA</Link><Link href="/contact">تماس</Link>
          </div>
        </div>
      )}
    </>
  );
}
