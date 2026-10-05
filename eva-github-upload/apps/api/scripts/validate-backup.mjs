import fs from 'node:fs';
import { createHash } from 'node:crypto';

const file = process.argv[2];
if (!file) {
  console.error('Usage: npm run backup:validate -w @eva/api -- /path/to/eva-backup.json');
  process.exit(1);
}

const snapshot = JSON.parse(fs.readFileSync(file, 'utf8'));
const manifest = snapshot?.manifest;
const data = snapshot?.data;

if (!manifest || manifest.format !== 'EVA_BUSINESS_BACKUP' || manifest.formatVersion !== 1 || !data || typeof data !== 'object') {
  throw new Error('Invalid EVA backup format');
}

const actualChecksum = createHash('sha256').update(JSON.stringify(data)).digest('hex');
if (actualChecksum !== manifest.checksumSha256) {
  throw new Error('Backup checksum mismatch. The file may be incomplete or modified.');
}

for (const [table, expectedCount] of Object.entries(manifest.counts ?? {})) {
  const rows = data[table];
  if (!Array.isArray(rows)) throw new Error(`Backup table ${table} is missing`);
  if (rows.length !== expectedCount) throw new Error(`Backup row count mismatch for ${table}`);
}

console.log('EVA backup is valid.');
console.log(`Created: ${manifest.createdAt}`);
console.log(`Schema: ${manifest.schemaVersion}`);
console.log(`Checksum: ${manifest.checksumSha256}`);
console.log(`Tables: ${Object.keys(data).length}`);
