import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedagogicalDocument } from './pedagogical-document.entity';
import { PedagogicalDocsService } from './pedagogical-docs.service';
import { PedagogicalDocsController } from './pedagogical-docs.controller';
import { GeminiService } from './gemini.service';

@Module({
  imports: [TypeOrmModule.forFeature([PedagogicalDocument])],
  providers: [PedagogicalDocsService, GeminiService],
  controllers: [PedagogicalDocsController],
})
export class PedagogicalDocsModule {}










