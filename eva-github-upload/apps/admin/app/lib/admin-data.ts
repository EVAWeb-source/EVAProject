import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE, sessionValue } from './admin-auth';

export const API_BASE = process.env.API_URL ?? 'https://eva-api-production-c864.up.railway.app';
export const STOREFRONT_BASE = process.env.STOREFRONT_URL ?? 'https://evaproject-production.up.railway.app';

export type Dashboard = {
  generatedAt: string;
  summary: {
    activeProducts: number;
    units: { available: number; reserved: number; sold: number; total: number };
    orders: { paid: number; pending: number; cancelled: number };
    invoices: number;
    paidRevenueToman: number;
  };
  collections: Array<{ id: string; nameFa: string; slug: string; code: string }>;
  pricing: {
    rate: null | { purity: number; tomanPerGram: number; source: string; rateVersion: string; observedAt: string };
    rule: null | { id: string; name: string; formulaVersion: string; makingPercent: number; profitPercent: number; taxPercent: number; updatedAt: string };
  };
  products: Array<{
    id: string;
    nameFa: string;
    slug: string;
    masterSku: string;
    purity: number;
    status: string;
    collectionId: string | null;
    collection: string | null;
    unitCount: number;
    availableCount: number;
    units?: Array<{
      id: string;
      unitSku: string;
      exactWeightGram: string;
      currentPriceToman: number | null;
      status: string;
      reservedUntil: string | null;
    }>;
  }>;
  units: Array<{
    id: string;
    productId: string;
    unitSku: string;
    productNameFa: string;
    masterSku: string;
    exactWeightGram: string;
    currentPriceToman: number | null;
    status: string;
    reservedUntil: string | null;
    updatedAt?: string;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    fulfillmentStatus?: string;
    customerId: string | null;
    customerName: string;
    mobile: string;
    city: string;
    totalToman: number;
    createdAt: string;
    item: null | { productNameFa: string; unitSku: string; exactWeightGram: string };
    payment: null | { provider: string; status: string; referenceId: string | null; paidAt: string | null };
    invoiceNumber: string | null;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    orderId: string;
    status: string;
    customerName: string;
    customerMobile: string;
    totalToman: number;
    verificationCode: string;
    issuedAt: string;
    item: null | { productNameFa: string; unitSku: string };
  }>;
};

export type FulfillmentStatus = 'REGISTERED' | 'PREPARING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED';
export type FulfillmentData = {
  generatedAt: string;
  summary: Record<FulfillmentStatus, number>;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    fulfillmentStatus: FulfillmentStatus;
    customerName: string;
    mobile: string;
    recipientName: string;
    province: string;
    city: string;
    address: string;
    postalCode: string;
    shippingCarrier: string | null;
    trackingCode: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
    totalToman: number;
    createdAt: string;
    item: null | { productNameFa: string; unitSku: string; exactWeightGram: string };
    payment: null | { referenceId: string | null; paidAt: string | null };
    invoiceNumber: string | null;
  }>;
};

export type CatalogReadiness = {
  summary: { total:number; active:number; readyToPublish:number; needsContent:number; needsMedia:number; needsSeo:number; needsInventory:number };
  items: Array<{
    id:string; nameFa:string; slug:string; masterSku:string; status:string;
    completedSteps:number; totalSteps:number; readyToPublish:boolean; missing:string[];
  }>;
};

export type CustomersData = {
  generatedAt: string;
  summary: { total:number; withOrders:number; repeatCustomers:number; totalPaidToman:number };
  items: Array<{
    id:string;
    mobile:string;
    name:string|null;
    internalNote:string|null;
    orderCount:number;
    paidOrderCount:number;
    refundedOrderCount:number;
    totalPaidToman:number;
    lastOrderAt:string|null;
    createdAt:string;
    updatedAt:string;
  }>;
};

export type CustomerDetail = {
  id:string;
  mobile:string;
  name:string|null;
  internalNote:string|null;
  createdAt:string;
  updatedAt:string;
  summary:{ orderCount:number; paidOrderCount:number; refundedOrderCount:number; totalPaidToman:number };
  orders:Array<{
    id:string;
    orderNumber:string;
    status:string;
    fulfillmentStatus:string;
    customerName:string;
    recipientName:string;
    city:string;
    province:string;
    totalToman:number;
    createdAt:string;
    paymentStatus:string|null;
    invoiceNumber:string|null;
    invoiceStatus:string|null;
    item:null|{ productNameFa:string; unitSku:string; exactWeightGram:string };
    afterSales:null|{ type:string; status:string; reason:string };
  }>;
};

export async function requireAdmin() {
  const expected = sessionValue();
  const store = await cookies();
  if (expected && store.get(ADMIN_SESSION_COOKIE)?.value !== expected) redirect('/login');
}

async function adminFetch<T>(path: string): Promise<{ data: T | null; error: string | null }> {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) return { data: null, error: 'ADMIN_API_KEY برای سرویس پنل تنظیم نشده است.' };
  try {
    const response = await fetch(`${API_BASE}/api/v1/admin/${path}`, {
      cache: 'no-store',
      headers: { 'x-admin-key': adminKey },
    });
    if (!response.ok) return { data: null, error: `API پنل پاسخ ${response.status} داد.` };
    return { data: await response.json(), error: null };
  } catch {
    return { data: null, error: 'اتصال پنل به EVA-API برقرار نشد.' };
  }
}

export function loadDashboard() { return adminFetch<Dashboard>('dashboard'); }
export function loadFulfillment() { return adminFetch<FulfillmentData>('fulfillment'); }
export function loadCatalogReadiness() { return adminFetch<CatalogReadiness>('catalog-readiness'); }
export function loadCustomers() { return adminFetch<CustomersData>('customers'); }
export function loadCustomer(id:string) { return adminFetch<CustomerDetail>(`customers/${encodeURIComponent(id)}`); }

export function faNumber(value: number | string) {
  return new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 3 }).format(Number(value));
}
export function toman(value: number) { return `${new Intl.NumberFormat('fa-IR').format(value)} تومان`; }
export function faDate(value: string | Date) {
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
export function statusFa(status: string) {
  const labels: Record<string,string> = {
    ACTIVE:'فعال', DRAFT:'پیش‌نویس', OUT_OF_STOCK:'ناموجود', HIDDEN:'مخفی', DISCONTINUED:'توقف عرضه', ARCHIVED:'آرشیو',
    AVAILABLE:'موجود', RESERVED:'رزرو', SOLD:'فروخته‌شده', RETURNED:'مرجوع‌شده', QC_PENDING:'در انتظار QC', QUALITY_HOLD:'توقف QC', DAMAGED:'آسیب‌دیده', UNAVAILABLE:'غیرقابل فروش',
    PAID:'پرداخت‌شده', PENDING_PAYMENT:'در انتظار پرداخت', REFUND_PENDING:'در انتظار بازپرداخت', REFUNDED:'بازپرداخت‌شده', CANCELLED:'لغوشده',
    ISSUED:'صادرشده', VOID:'باطل‌شده', SUCCEEDED:'موفق', FAILED:'ناموفق', EXPIRED:'منقضی',
    REQUESTED:'درخواست ثبت‌شده', RETURN_IN_TRANSIT:'در مسیر بازگشت', COMPLETED:'تکمیل‌شده', REJECTED:'ردشده',
    CANCELLATION:'لغو سفارش', RETURN:'مرجوعی',
    REGISTERED:'ثبت‌شده', PREPARING:'در حال آماده‌سازی', READY_TO_SHIP:'آماده ارسال', SHIPPED:'ارسال‌شده', DELIVERED:'تحویل‌شده',
  };
  return labels[status] ?? status;
}
