'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductContentPanel from './ProductContentPanel';

type Collection = { id: string; nameFa: string; slug: string; code: string };
type Product = {
  id: string;
  nameFa: string;
  masterSku: string;
  status: string;
  collectionId: string | null;
};
type Unit = {
  id: string;
  productId: string;
  unitSku: string;
  productNameFa: string;
  exactWeightGram: string;
  status: string;
};

type Props = { collections: Collection[]; products: Product[]; units: Unit[] };

const productStatuses = [
  ['DRAFT', 'پیش‌نویس'],
  ['ACTIVE', 'فعال'],
  ['OUT_OF_STOCK', 'ناموجود'],
  ['HIDDEN', 'مخفی'],
  ['DISCONTINUED', 'توقف عرضه'],
  ['ARCHIVED', 'آرشیو'],
];

const unitStatuses = [
  ['QC_PENDING', 'در انتظار QC'],
  ['AVAILABLE', 'موجود'],
  ['QUALITY_HOLD', 'توقف QC'],
  ['DAMAGED', 'آسیب‌دیده'],
  ['UNAVAILABLE', 'غیرقابل فروش'],
];

async function adminRequest(path: string, method: 'POST' | 'PATCH', payload: Record<string, unknown>) {
  const response = await fetch(`/api/admin/${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const raw = await response.text();
    try {
      const parsed = JSON.parse(raw);
      const message = Array.isArray(parsed.message) ? parsed.message.join('، ') : parsed.message;
      throw new Error(message || parsed.error || `HTTP ${response.status}`);
    } catch (error) {
      if (error instanceof Error && error.message !== 'Unexpected end of JSON input') throw error;
      throw new Error(raw || `HTTP ${response.status}`);
    }
  }
  return response.json();
}

export default function AdminActions({ collections, products, units }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function start() {
    setBusy(true);
    setMessage('');
    setError('');
  }
  function done(text: string) {
    setMessage(text);
    setBusy(false);
    router.refresh();
  }
  function failed(err: unknown) {
    setError(err instanceof Error ? err.message : 'عملیات انجام نشد.');
    setBusy(false);
  }

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    start();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await adminRequest('products', 'POST', {
        nameFa: data.get('nameFa'),
        slug: data.get('slug'),
        masterSku: data.get('masterSku'),
        purity: Number(data.get('purity') || 18),
        collectionId: data.get('collectionId') || null,
        status: data.get('status') || 'DRAFT',
      });
      form.reset();
      done('محصول جدید با موفقیت ساخته شد.');
    } catch (err) { failed(err); }
  }

  async function createUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    start();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await adminRequest('units', 'POST', {
        productId: data.get('productId'),
        unitSku: data.get('unitSku'),
        exactWeightGram: data.get('exactWeightGram'),
        status: data.get('status') || 'QC_PENDING',
      });
      form.reset();
      done('Unit جدید ساخته شد.');
    } catch (err) { failed(err); }
  }

  async function updateProduct(event: FormEvent<HTMLFormElement>, productId: string) {
    event.preventDefault();
    start();
    const data = new FormData(event.currentTarget);
    try {
      await adminRequest(`products/${productId}`, 'PATCH', {
        nameFa: data.get('nameFa'),
        status: data.get('status'),
        collectionId: data.get('collectionId') || null,
      });
      done('محصول بروزرسانی شد.');
    } catch (err) { failed(err); }
  }

  async function updateUnit(event: FormEvent<HTMLFormElement>, unitId: string) {
    event.preventDefault();
    start();
    const data = new FormData(event.currentTarget);
    try {
      await adminRequest(`units/${unitId}`, 'PATCH', {
        status: data.get('status'),
        exactWeightGram: data.get('exactWeightGram'),
      });
      done('Unit بروزرسانی شد.');
    } catch (err) { failed(err); }
  }

  return (
    <section id="management" className="panel managementPanel">
      <div className="panelHead">
        <div><span>CATALOG OPERATIONS</span><h2>مدیریت محصول و موجودی</h2></div>
        <small>تغییرات مستقیماً در PostgreSQL ذخیره می‌شوند</small>
      </div>

      {(message || error) && <div className={error ? 'actionMessage actionError' : 'actionMessage'}>{error || message}</div>}

      <div className="adminForms">
        <form className="adminForm" onSubmit={createProduct}>
          <div className="formTitle"><strong>افزودن محصول</strong><span>Master Product</span></div>
          <label>نام فارسی<input name="nameFa" required placeholder="مثلاً افق" /></label>
          <div className="formGrid">
            <label>Slug<input name="slug" required dir="ltr" placeholder="ofogh" /></label>
            <label>عیار<input name="purity" required type="number" min="1" max="24" defaultValue="18" /></label>
          </div>
          <label>Master SKU<input name="masterSku" required dir="ltr" placeholder="EVA-AGH-NEC-OFG-002" /></label>
          <div className="formGrid">
            <label>کالکشن<select name="collectionId" defaultValue=""><option value="">بدون کالکشن</option>{collections.map(c => <option key={c.id} value={c.id}>{c.nameFa}</option>)}</select></label>
            <label>وضعیت<select name="status" defaultValue="DRAFT">{productStatuses.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          </div>
          <button className="primaryButton" disabled={busy}>ساخت محصول</button>
        </form>

        <form className="adminForm" onSubmit={createUnit}>
          <div className="formTitle"><strong>افزودن قطعه</strong><span>Physical Unit</span></div>
          <label>محصول<select name="productId" required defaultValue=""><option value="" disabled>انتخاب محصول</option>{products.map(p => <option key={p.id} value={p.id}>{p.nameFa} — {p.masterSku}</option>)}</select></label>
          <label>Unit SKU<input name="unitSku" required dir="ltr" placeholder="EVA-AGH-NEC-OFG-002-U01" /></label>
          <div className="formGrid">
            <label>وزن دقیق (گرم)<input name="exactWeightGram" required type="number" step="0.001" min="0.001" placeholder="0.820" /></label>
            <label>وضعیت<select name="status" defaultValue="QC_PENDING">{unitStatuses.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          </div>
          <button className="primaryButton" disabled={busy}>ساخت Unit</button>
          <small className="formHint">پیشنهاد: Unit جدید ابتدا روی «در انتظار QC» ساخته شود و بعد از کنترل وزن روی «موجود» قرار بگیرد.</small>
        </form>
      </div>

      <ProductContentPanel products={products.map(({id,nameFa,masterSku})=>({id,nameFa,masterSku}))} />

      <div className="editorBlock">
        <h3>ویرایش محصولات</h3>
        <div className="editorList">
          {products.map(product => <form key={product.id} className="editorRow" onSubmit={(event)=>updateProduct(event, product.id)}>
            <div className="editorIdentity"><strong>{product.masterSku}</strong><small>Master Product</small></div>
            <input name="nameFa" defaultValue={product.nameFa} aria-label="نام محصول" />
            <select name="collectionId" defaultValue={product.collectionId ?? ''} aria-label="کالکشن"><option value="">بدون کالکشن</option>{collections.map(c => <option key={c.id} value={c.id}>{c.nameFa}</option>)}</select>
            <select name="status" defaultValue={product.status} aria-label="وضعیت محصول">{productStatuses.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select>
            <button disabled={busy}>ذخیره</button>
          </form>)}
        </div>
      </div>

      <div className="editorBlock">
        <h3>کنترل Unitها</h3>
        <div className="editorList">
          {units.map(unit => {
            const locked = unit.status === 'SOLD' || unit.status === 'RESERVED';
            return <form key={unit.id} className={`editorRow unitEditor ${locked ? 'lockedRow' : ''}`} onSubmit={(event)=>updateUnit(event, unit.id)}>
              <div className="editorIdentity"><strong dir="ltr">{unit.unitSku}</strong><small>{unit.productNameFa}</small></div>
              <input name="exactWeightGram" type="number" step="0.001" min="0.001" defaultValue={unit.exactWeightGram} disabled={locked} aria-label="وزن دقیق" />
              <select name="status" defaultValue={unit.status} disabled={locked} aria-label="وضعیت Unit">
                {locked ? <option value={unit.status}>{unit.status === 'SOLD' ? 'فروخته‌شده — قفل' : 'رزروشده — قفل'}</option> : unitStatuses.map(([value,label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <span className={`badge ${unit.status.toLowerCase()}`}>{locked ? 'قفل سیستمی' : 'قابل ویرایش'}</span>
              <button disabled={busy || locked}>{locked ? 'غیرقابل تغییر' : 'ذخیره'}</button>
            </form>;
          })}
        </div>
      </div>
    </section>
  );
}
