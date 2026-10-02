'use client';

import { useState } from 'react';
import styles from './account.module.css';

export default function LogoutButton() {
  const [busy, setBusy] = useState(false);
  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch('/api/customer/logout', { method: 'POST' });
    } finally {
      window.location.href = '/account';
    }
  }
  return <button className={styles.logout} onClick={logout} disabled={busy}>{busy ? '...' : 'خروج از حساب'}</button>;
}
