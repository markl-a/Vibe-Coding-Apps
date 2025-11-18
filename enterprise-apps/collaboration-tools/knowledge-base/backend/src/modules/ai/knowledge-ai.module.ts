import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KnowledgeAIService } from './knowledge-ai.service';
import { KnowledgeAIController } from './knowledge-ai.controller';

@Module({
  imports: [ConfigModule],
  controllers: [KnowledgeAIController],
  providers: [KnowledgeAIService],
  exports: [KnowledgeAIService],
})
export class KnowledgeAIModule {}
