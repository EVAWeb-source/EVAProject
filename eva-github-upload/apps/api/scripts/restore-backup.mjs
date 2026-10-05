import fs from 'node:fs';
import { createHash } from 'node:crypto';
import pg from 'pg';

const { Client } = pg;
const file = process.argv[2];
const connectionString = process.env.DATABASE_URL;

if (!file) {
  console.error('Usage: npm run backup:restore -w @eva/api -- /path/to/eva-backup.json');
  process.exit(1);
}
if (!connectionString) throw new Error('DATABASE_URL is required');

const snapshot = JSON.parse(fs.readFileSync(file, 'utf8'));
const manifest = snapshot?.manifest;
const data = snapshot?.data;
if (!manifest || manifest.format !== 'EVA_BUSINESS_BACKUP' || manifest.formatVersion !== 1 || !data || typeof data !== 'object') {
  throw new Error('Invalid EVA backup format');
}

const checksum = createHash('sha256').update(JSON.stringify(data)).digest('hex');
if (checksum !== manifest.checksumSha256) {
  throw new Error('Backup checksum mismatch. Restore aborted.');
}

const tableOrder = [
  'Collection',
  'MasterProduct',
  'ProductImage',
  'PhysicalUnit',
  'GoldRate',
  'PricingRule',
  'Customer',
  'Order',
  'OrderLine',
  'Reservation',
  'PaymentAttempt',
  'Invoice',
  'InvoiceLine',
  'AfterSalesCase',
  'SmsNotification',
  'AdminAuditLog',
];

for (const table of tableOrder) {
  if (!Array.isArray(data[table])) throw new Error(`Backup table ${table} is missing`);
}

const quoteIdentifier = (value) => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) throw new Error(`Unsafe identifier: ${value}`);
  return `"${value}"`;
};

const client = new Client({ connectionString });
await client.connect();

try {
  // Restore is intentionally allowed only on an empty target database.
  for (const table of tableOrder) {
    const exists = await client.query('SELECT to_regclass($1) AS name', [`public."${table}"`]);
    if (!exists.rows[0]?.name) {
      throw new Error(`Target schema is missing table ${table}. Apply the Prisma schema to the empty database first.`);
    }

    const count = await client.query(`SELECT COUNT(*)::int AS count FROM ${quoteIdentifier(table)}`);
    if (Number(count.rows[0]?.count ?? 0) > 0) {
      throw new Error(`Target database is not empty (${table} has data). Restore aborted.`);
    }
  }

  await client.query('BEGIN');

  for (const table of tableOrder) {
    const allowedColumnsResult = await client.query(
      'SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2',
      ['public', table],
    );
    const allowedColumns = new Set(allowedColumnsResult.rows.map((row) => row.column_name));

    for (const row of data[table]) {
      const columns = Object.keys(row);
      if (!columns.length) continue;
      for (const column of columns) {
        if (!allowedColumns.has(column)) throw new Error(`Unknown column ${table}.${column}`);
      }

      const values = columns.map((column) => row[column]);
      const columnSql = columns.map(quoteIdentifier).join(', ');
      const placeholders = columns.map((_column, index) => `$${index + 1}`).join(', ');
      await client.query(
        `INSERT INTO ${quoteIdentifier(table)} (${columnSql}) VALUES (${placeholders})`,
        values,
      );
    }
  }

  await client.query('COMMIT');
  console.log('EVA backup restore completed successfully on the empty target database.');
  console.log(`Backup created: ${manifest.createdAt}`);
  console.log(`Checksum: ${manifest.checksumSha256}`);
} catch (error) {
  await client.query('ROLLBACK').catch(() => undefined);
  throw error;
} finally {
  await client.end();
}
