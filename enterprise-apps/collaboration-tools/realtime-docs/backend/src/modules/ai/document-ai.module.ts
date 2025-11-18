import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DocumentAIService } from './document-ai.service';
import { DocumentAIController } from './document-ai.controller';

@Module({
  imports: [ConfigModule],
  controllers: [DocumentAIController],
  providers: [DocumentAIService],
  exports: [DocumentAIService],
})
export class DocumentAIModule {}
