import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { RequestUser } from '../common/types/authenticated-request.type';

@UseGuards(PermissionsGuard)
@Controller('api/v1/admin/branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @RequirePermissions('admin.health.view')
  async listBranches(
    @GetUser() actor: RequestUser,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.branchesService.listBranches(actor, {
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @RequirePermissions('admin.health.view')
  async getBranch(@GetUser() actor: RequestUser, @Param('id') id: string) {
    return this.branchesService.getBranch(actor, id);
  }
}
