# EVA Commerce

پایه فنی فروشگاه آنلاین طلای EVA.

## معماری

- `apps/storefront` — فروشگاه مشتری با Next.js
- `apps/admin` — پنل مدیریت با Next.js
- `apps/api` — API با NestJS
- `packages/ui` — Design tokens و UI مشترک
- `packages/contracts` — قراردادهای TypeScript مشترک
- PostgreSQL — مرجع اصلی داده و موجودی
- Redis — cache / TTL / queue در مراحل بعدی

## پیش‌نیازها

- Node.js 22+
- npm 10+
- Docker Desktop یا PostgreSQL + Redis محلی

## اجرای محلی

```bash
cp .env.example .env
npm install

docker compose up -d

npm run db:generate
npm run db:migrate -- --name init

npm run dev
```

سپس:

- Storefront: http://localhost:3000
- Admin: http://localhost:3001
- API Health: http://localhost:4000/api/v1/health
- Products API: http://localhost:4000/api/v1/products

## تصمیم‌های مهم

1. قیمت نهایی فقط Server-side محاسبه خواهد شد.
2. هر قطعه فیزیکی طلا یک `PhysicalUnit` مستقل دارد.
3. PostgreSQL Source of Truth موجودی است.
4. Money در لایه دامنه با integer IRR نگهداری می‌شود.
5. وزن با Decimal ذخیره می‌شود.
6. Prisma فعلاً روی major 7 نگه داشته شده چون Prisma 8 در زمان Bootstrap هنوز RC است.

## گام بعد

Phase 9.2: Design System واقعی و سپس Phase 9.3: مدل کامل Catalog / Inventory / Pricing.
