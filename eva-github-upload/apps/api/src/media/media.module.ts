import { Global, Module } from '@nestjs/common';
import { AdminMediaController } from './admin-media.controller.js';
import { MediaController } from './media.controller.js';
import { MediaService } from './media.service.js';

@Global()
@Module({
  controllers: [MediaController, AdminMediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
