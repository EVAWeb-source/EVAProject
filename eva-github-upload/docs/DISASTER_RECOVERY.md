# EVA Disaster Recovery Runbook

This document describes the safe recovery path for EVA Commerce. It is intentionally conservative: production data must never be overwritten as part of an untested restore.

## Recovery priorities

1. Protect paid orders, invoice snapshots, exact physical-unit state and after-sales history.
2. Preserve customer/order history and pricing snapshots.
3. Restore service first on an isolated database, verify, then switch traffic deliberately.
4. Never restore directly into a non-empty production database.

## Backup layers

### Layer 1 — PostgreSQL provider backup

The managed PostgreSQL service should have provider-level backups/snapshots enabled before launch. Treat this as the primary database recovery mechanism.

Recommended policy before launch:
- automatic daily backup at minimum;
- a manual backup immediately before schema changes or major releases;
- retention long enough to recover from a problem discovered several days later;
- periodically verify that a restore can be created into an isolated database.

Exact provider settings must be verified against the active Railway/PostgreSQL plan at launch time.

### Layer 2 — EVA business snapshot

Admin route: `/backup`

The downloadable JSON snapshot contains:
- Collection
- MasterProduct
- ProductImage metadata
- PhysicalUnit
- GoldRate
- PricingRule
- Customer
- Order / OrderLine
- Reservation
- PaymentAttempt
- Invoice / InvoiceLine
- AfterSalesCase
- SmsNotification
- AdminAuditLog

Intentionally excluded:
- OtpChallenge
- CustomerSession
- Railway/environment secrets

Every file includes a SHA-256 checksum and row counts.

## Validate a downloaded EVA snapshot

From the repository root:

```bash
npm run backup:validate -w @eva/api -- /absolute/path/to/eva-backup-YYYY-MM-DD.json
```

Do not attempt a restore if validation fails.

## Restore drill — isolated empty database only

1. Create a NEW empty PostgreSQL database/service. Never point this procedure at the production database.
2. Set `DATABASE_URL` only for the temporary recovery environment.
3. Apply the current Prisma schema to the empty database:

```bash
npm run db:push -w @eva/api
```

4. Validate the backup file.
5. Restore:

```bash
npm run backup:restore -w @eva/api -- /absolute/path/to/eva-backup-YYYY-MM-DD.json
```

The restore tool aborts if any protected target table already contains data. All inserts run inside one database transaction.

## Post-restore verification

Before routing any production traffic to a restored database verify:
- product and physical-unit counts;
- AVAILABLE / RESERVED / SOLD unit states;
- paid/refunded order counts;
- invoice count and a sample invoice snapshot;
- one customer order history;
- fulfillment states and tracking codes;
- open cancellation/return cases;
- latest pricing rule and gold-rate history;
- admin audit history.

Then run application smoke tests against the isolated recovery environment.

## Code rollback

Application code is versioned in GitHub. If a deployment breaks without corrupting data:
1. do not modify the database;
2. identify the last known-good commit;
3. redeploy that known-good commit/service version;
4. test API health, Storefront and Admin;
5. record the incident and corrective change.

## Schema-change rule

The project currently uses `prisma db push` at runtime and does not yet have a Prisma migration baseline. Before public launch, create a controlled migration baseline and move production schema changes to reviewed migrations. Do not switch an existing production database to `prisma migrate deploy` without first baselining its current schema.

## Incident rule

When data corruption is suspected:
- stop write operations if practical;
- take a fresh provider snapshot before attempting repair;
- do not run destructive SQL interactively on production;
- restore to an isolated database first;
- compare recovered data with production before any cutover.
