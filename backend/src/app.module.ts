import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TransactionsModule } from './transactions/transactions.module';
import { DbModule } from './db/db.module';

@Module({
  imports: [
    DbModule,
    AuthModule,
    TransactionsModule,
  ],
})
export class AppModule {}
