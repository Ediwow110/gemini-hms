import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@UseGuards(PermissionsGuard)
@Controller('api/v1/patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @RequirePermissions('patient.create')
  create(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Body() createPatientDto: CreatePatientDto,
  ) {
    return this.patientsService.create(tenantId, userId, createPatientDto);
  }

  @Get()
  @RequirePermissions('patient.view')
  findAll(
    @GetUser('tenantId') tenantId: string,
    @Query('search') search?: string,
  ) {
    return this.patientsService.findAll(tenantId, search);
  }

  @Get(':id')
  @RequirePermissions('patient.view')
  findOne(@GetUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.patientsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions('patient.update')
  update(
    @GetUser('tenantId') tenantId: string,
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ) {
    return this.patientsService.update(tenantId, userId, id, updatePatientDto);
  }
}
