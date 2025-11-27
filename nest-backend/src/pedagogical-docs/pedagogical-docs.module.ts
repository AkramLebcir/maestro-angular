import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedagogicalDocument } from './pedagogical-document.entity';
import { PedagogicalDocsService } from './pedagogical-docs.service';
import { PedagogicalDocsController } from './pedagogical-docs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PedagogicalDocument])],
  providers: [PedagogicalDocsService],
  controllers: [PedagogicalDocsController],
})
export class PedagogicalDocsModule {}


