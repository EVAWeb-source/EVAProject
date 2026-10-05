import { Controller, Get } from '@nestjs/common';
import { AdminAuditService } from './admin-audit.service.js';
import { AdminBackupService } from './admin-backup.service.js';

@Controller('admin/backup')
export class AdminBackupController {
  constructor(
    private readonly backup: AdminBackupService,
    private readonly audit: AdminAuditService,
  ) {}

  @Get('status')
  status() {
    return this.backup.status();
  }

  @Get('export')
  async exportSnapshot() {
    const snapshot = await this.backup.exportSnapshot();
    await this.audit.record({
      action: 'BACKUP_EXPORTED',
      entityType: 'SYSTEM',
      summary: 'نسخه پشتیبان داده‌های حیاتی EVA ساخته شد',
      metadata: {
        checksumSha256: snapshot.manifest.checksumSha256,
        createdAt: snapshot.manifest.createdAt,
        counts: snapshot.manifest.counts,
      },
    });
    return snapshot;
  }
}
