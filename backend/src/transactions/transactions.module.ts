import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { PdfParserService } from './pdf-parser.service';
import { TranslationService } from './translation.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, PdfParserService, TranslationService],
})
export class TransactionsModule {}
