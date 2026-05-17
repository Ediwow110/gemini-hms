import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('ledger')
@UseGuards(RolesGuard)
@Roles('Admin', 'Finance')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get('entries')
  async getEntries(
    @GetUser('tenantId') tenantId: string,
    @Query('referenceType') referenceType: string,
    @Query('referenceId') referenceId: string,
  ) {
    return this.ledgerService.getEntriesByReference(
      tenantId,
      referenceType,
      referenceId,
    );
  }

  @Get('balance')
  async getBalance(
    @GetUser('tenantId') tenantId: string,
    @Query('account') account: string,
    @Query('from') fromStr?: string,
    @Query('to') toStr?: string,
  ) {
    const from = fromStr ? new Date(fromStr) : undefined;
    const to = toStr ? new Date(toStr) : undefined;
    const balance = await this.ledgerService.getAccountBalance(
      tenantId,
      account,
      from,
      to,
    );
    return { balance };
  }
}
