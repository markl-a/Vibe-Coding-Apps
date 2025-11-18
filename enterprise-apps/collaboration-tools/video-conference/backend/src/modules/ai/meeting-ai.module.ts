import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MeetingAIService } from './meeting-ai.service';
import { MeetingAIController } from './meeting-ai.controller';

@Module({
  imports: [ConfigModule],
  controllers: [MeetingAIController],
  providers: [MeetingAIService],
  exports: [MeetingAIService],
})
export class MeetingAIModule {}
