import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  UseGuards,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TransactionsService, SearchFilters } from './transactions.service';
import { JwtAuthGuard } from '../auth/auth.guard';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype !== 'application/pdf') {
        cb(new BadRequestException('Only PDF files are allowed'), false);
      } else {
        cb(null, true);
      }
    },
  }))
  async uploadAndProcess(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    console.log(`📤 Received file: ${file.originalname} (${file.size} bytes)`);
    
    const insertedTransactions = await this.transactionsService.processAndStorePdf(
      file.buffer,
      file.originalname,
    );

    return {
      success: true,
      message: `Successfully processed ${insertedTransactions.length} transactions`,
      count: insertedTransactions.length,
      transactions: insertedTransactions,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() filters: SearchFilters) {
    const transactions = await this.transactionsService.findAll(filters);
    return {
      success: true,
      count: transactions.length,
      transactions,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const transaction = await this.transactionsService.findById(id);
    
    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    return {
      success: true,
      transaction,
    };
  }

  @Delete('all')
  @UseGuards(JwtAuthGuard)
  async deleteAll() {
    await this.transactionsService.deleteAll();
    return {
      success: true,
      message: 'All transactions deleted',
    };
  }
}
