import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ClinicalWorkflowService } from './clinical-workflow.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { SaveVitalsDto } from './dto/save-vitals.dto';
import { MarkVitalsErrorDto } from './dto/mark-vitals-error.dto';
import { SaveTriageDto } from './dto/save-triage.dto';
import { MarkTriageErrorDto } from './dto/mark-triage-error.dto';
import { SaveDraftSoapDto } from './dto/save-draft-soap.dto';
import { SaveDraftLabResultDto } from './dto/save-draft-lab-result.dto';
import { ValidateLabResultDto } from './dto/validate-lab-result.dto';
import { ReleaseLabResultDto } from './dto/release-lab-result.dto';
import { LabParameterDefinitionDto } from './dto/lab-parameter-definition.dto';
import { CreateClinicalOrderDto } from './dto/create-clinical-order.dto';
import { CancelClinicalOrderDto } from './dto/cancel-clinical-order.dto';
import { ReceiveLabOrderDto } from './dto/receive-lab-order.dto';
import type { RequestUser } from '../common/types/authenticated-request.type';
import {
  ClinicalWorkQueueDto,
  PatientClinicalSummaryDto,
  EncounterSummaryDto,
  VitalsSummaryDto,
  ClinicalOrderSummaryDto,
  ValidatedResultSummaryDto,
  ClinicalOrderItemSummaryDto,
  LabResultSummaryDto,
  PrescriptionSummaryDto,
  BillingHandoffSummaryDto,
  ClinicalDashboardSummaryDto,
  TriageSummaryDto,
  SoapDraftSummaryDto,
  LabSpecimenSummaryDto,
  LabResultDraftSummaryDto,
  LabResultDraftContextDto,
  LabValidationSummaryDto,
  ReleasedResultSummaryDto,
  ReleasedResultQueueDto,
  LabTestDefinitionSummaryDto,
} from './dto/workflow-summaries.dto';

@Controller('api/v1/clinical-workflow')
@UseGuards(RolesGuard)
export class ClinicalWorkflowController {
  constructor(private readonly workflowService: ClinicalWorkflowService) {}

  @Get('work-queue')
  @Roles('Doctor', 'Nurse', 'Med-Tech', 'Branch Admin', 'Super Admin')
  async getWorkQueue(
    @GetUser() user: RequestUser,
    @Query('branchId') branchId?: string,
  ): Promise<ClinicalWorkQueueDto[]> {
    const targetBranchId = branchId || user.branchId;
    if (!targetBranchId) return []; // Fail closed if no branch context

    return this.workflowService.getWorkQueue(
      user.tenantId,
      targetBranchId,
      user,
    );
  }

  @Get('patients/:patientId/summary')
  @Roles(
    'Doctor',
    'Nurse',
    'Med-Tech',
    'Branch Admin',
    'Super Admin',
    'Patient',
  )
  async getPatientSummary(
    @Param('patientId') patientId: string,
    @GetUser() user: RequestUser,
  ): Promise<PatientClinicalSummaryDto | null> {
    return this.workflowService.getPatientSummary(
      patientId,
      user.tenantId,
      user,
    );
  }

  @Get('patients/:patientId/encounters')
  @Roles('Doctor', 'Nurse', 'Branch Admin', 'Super Admin')
  async getEncounters(
    @Param('patientId') patientId: string,
    @GetUser() user: RequestUser,
  ): Promise<EncounterSummaryDto[]> {
    return this.workflowService.getEncounters(patientId, user.tenantId, user);
  }

  @Get('patients/:patientId/vitals')
  @Roles('Doctor', 'Nurse', 'Branch Admin', 'Super Admin')
  async getVitals(
    @Param('patientId') patientId: string,
    @GetUser() user: RequestUser,
  ): Promise<VitalsSummaryDto[]> {
    return this.workflowService.getVitals(patientId, user.tenantId, user);
  }

  @Get('patients/:patientId/orders')
  @Roles('Doctor', 'Nurse', 'Med-Tech', 'Branch Admin', 'Super Admin')
  async getOrders(
    @Param('patientId') patientId: string,
    @GetUser() user: RequestUser,
  ): Promise<ClinicalOrderSummaryDto[]> {
    return this.workflowService.getOrders(patientId, user.tenantId, user);
  }

  @Get('patients/:patientId/lab-results')
  @Roles(
    'Doctor',
    'Nurse',
    'Med-Tech',
    'Cashier',
    'Branch Admin',
    'Super Admin',
  )
  async getLabResults(
    @Param('patientId') patientId: string,
    @GetUser() user: RequestUser,
  ): Promise<LabResultSummaryDto[]> {
    return this.workflowService.getLabResults(patientId, user.tenantId, user);
  }

  @Get('patients/:patientId/prescriptions')
  @Roles('Doctor', 'Nurse', 'Branch Admin', 'Super Admin')
  async getPrescriptions(
    @Param('patientId') patientId: string,
    @GetUser() user: RequestUser,
  ): Promise<PrescriptionSummaryDto[]> {
    return this.workflowService.getPrescriptions(
      patientId,
      user.tenantId,
      user,
    );
  }

  @Get('patients/:patientId/billing-handoff')
  @Roles('Doctor', 'Nurse', 'Cashier', 'Branch Admin', 'Super Admin')
  async getBillingHandoff(
    @Param('patientId') patientId: string,
    @GetUser() user: RequestUser,
  ): Promise<BillingHandoffSummaryDto[]> {
    return this.workflowService.getBillingHandoff(
      patientId,
      user.tenantId,
      user,
    );
  }

  @Get('dashboard-summary')
  @Roles('Doctor', 'Nurse', 'Branch Admin', 'Super Admin')
  async getDashboardSummary(
    @GetUser() user: RequestUser,
    @Query('branchId') branchId?: string,
  ): Promise<ClinicalDashboardSummaryDto> {
    const targetBranchId = branchId || user.branchId;
    // Default to an empty dashboard if branch context is missing for branch-scoped users
    if (!targetBranchId && !user.roles?.includes('Super Admin')) {
      return {
        branchId: 'none',
        activePatients: 0,
        pendingTriage: 0,
        waitingForDoctor: 0,
        pendingLabResults: 0,
        completedEncountersToday: 0,
        timestamp: new Date(),
        accessLabel: 'Operational Dashboard',
        isReadOnly: true,
      };
    }

    return this.workflowService.getDashboardSummary(
      user.tenantId,
      targetBranchId!,
      user,
    );
  }

  @Post('patients/:patientId/vitals')
  @Roles('Doctor', 'Nurse', 'Branch Admin', 'Super Admin')
  async saveVitals(
    @Param('patientId') patientId: string,
    @Body() dto: SaveVitalsDto,
    @GetUser() user: RequestUser,
  ): Promise<VitalsSummaryDto> {
    return this.workflowService.saveVitals(patientId, user.tenantId, user, dto);
  }

  @Post('patients/:patientId/vitals/:vitalsId/entered-in-error')
  @Roles('Doctor', 'Nurse', 'Branch Admin', 'Super Admin')
  async markVitalsEnteredInError(
    @Param('patientId') patientId: string,
    @Param('vitalsId') vitalsId: string,
    @Body() dto: MarkVitalsErrorDto,
    @GetUser() user: RequestUser,
  ): Promise<void> {
    return this.workflowService.markVitalsEnteredInError(
      patientId,
      vitalsId,
      user.tenantId,
      user,
      dto,
    );
  }

  @Post('patients/:patientId/triage')
  @Roles('Doctor', 'Nurse', 'Branch Admin', 'Super Admin')
  async saveTriage(
    @Param('patientId') patientId: string,
    @Body() dto: SaveTriageDto,
    @GetUser() user: RequestUser,
  ): Promise<void> {
    return this.workflowService.saveTriage(patientId, user.tenantId, user, dto);
  }

  @Get('patients/:patientId/triage')
  @Roles('Doctor', 'Nurse', 'Branch Admin', 'Super Admin')
  async getTriage(
    @Param('patientId') patientId: string,
    @GetUser() user: RequestUser,
  ): Promise<TriageSummaryDto[]> {
    return this.workflowService.getTriage(patientId, user.tenantId, user);
  }

  @Post('patients/:patientId/triage/:triageId/entered-in-error')
  @Roles('Doctor', 'Nurse', 'Branch Admin', 'Super Admin')
  async markTriageEnteredInError(
    @Param('patientId') patientId: string,
    @Param('triageId') triageId: string,
    @Body() dto: MarkTriageErrorDto,
    @GetUser() user: RequestUser,
  ): Promise<void> {
    return this.workflowService.markTriageEnteredInError(
      patientId,
      triageId,
      user.tenantId,
      user,
      dto,
    );
  }

  @Post('patients/:patientId/encounters/:encounterId/soap-sign')
  @Roles('Doctor', 'Branch Admin', 'Super Admin')
  async signSOAP(
    @Param('patientId') patientId: string,
    @Param('encounterId') encounterId: string,
    @GetUser() user: RequestUser,
  ): Promise<SoapDraftSummaryDto> {
    return this.workflowService.signSOAP(
      patientId,
      encounterId,
      user.tenantId,
      user,
    );
  }

  @Post('patients/:patientId/encounters/:encounterId/orders')
  @Roles('Doctor', 'Branch Admin', 'Super Admin')
  async createClinicalOrder(
    @Param('patientId') patientId: string,
    @Param('encounterId') encounterId: string,
    @Body() dto: CreateClinicalOrderDto,
    @GetUser() user: RequestUser,
  ): Promise<ClinicalOrderSummaryDto> {
    return this.workflowService.createClinicalOrder(
      patientId,
      encounterId,
      user.tenantId,
      user,
      dto,
    );
  }

  @Post('patients/:patientId/encounters/:encounterId/orders/:orderId/cancel')
  @Roles('Doctor', 'Branch Admin', 'Super Admin')
  async cancelClinicalOrder(
    @Param('patientId') patientId: string,
    @Param('encounterId') encounterId: string,
    @Param('orderId') orderId: string,
    @Body() dto: CancelClinicalOrderDto,
    @GetUser() user: RequestUser,
  ): Promise<ClinicalOrderSummaryDto> {
    return this.workflowService.cancelClinicalOrder(
      patientId,
      encounterId,
      orderId,
      user.tenantId,
      user,
      dto,
    );
  }

  @Post('patients/:patientId/orders/:orderId/receive-lab')
  @Roles('Med-Tech', 'Branch Admin', 'Super Admin')
  async receiveLabOrder(
    @Param('patientId') patientId: string,
    @Param('orderId') orderId: string,
    @Body() dto: ReceiveLabOrderDto,
    @GetUser() user: RequestUser,
  ): Promise<LabSpecimenSummaryDto> {
    return this.workflowService.receiveLabOrder(
      patientId,
      orderId,
      user.tenantId,
      user,
      dto,
    );
  }

  @Post('patients/:patientId/orders/:orderId/draft-lab-result')
  @Roles('Med-Tech', 'Branch Admin', 'Super Admin')
  async saveDraftLabResult(
    @Param('patientId') patientId: string,
    @Param('orderId') orderId: string,
    @Body() dto: SaveDraftLabResultDto,
    @GetUser() user: RequestUser,
  ): Promise<LabResultDraftSummaryDto> {
    return this.workflowService.saveDraftLabResult(
      patientId,
      orderId,
      user.tenantId,
      user,
      dto,
    );
  }

  @Post('patients/:patientId/orders/:orderId/validate-lab-result')
  @Roles('Med-Tech', 'Branch Admin', 'Super Admin')
  async validateLabResult(
    @Param('patientId') patientId: string,
    @Param('orderId') orderId: string,
    @Body() dto: ValidateLabResultDto,
    @GetUser() user: RequestUser,
  ): Promise<LabValidationSummaryDto> {
    return this.workflowService.validateLabResult(
      patientId,
      orderId,
      user.tenantId,
      user,
      dto,
    );
  }

  @Post('patients/:patientId/orders/:orderId/release-lab-result')
  @Roles('Branch Admin', 'Super Admin')
  async releaseLabResult(
    @Param('patientId') patientId: string,
    @Param('orderId') orderId: string,
    @Body() dto: ReleaseLabResultDto,
    @GetUser() user: RequestUser,
  ): Promise<ReleasedResultSummaryDto> {
    return this.workflowService.releaseLabResult(
      patientId,
      orderId,
      user.tenantId,
      user,
      dto,
    );
  }

  @Get('lab/validated-results')
  @Roles('Med-Tech', 'Branch Admin', 'Super Admin')
  async getValidatedResults(
    @GetUser() user: RequestUser,
  ): Promise<ValidatedResultSummaryDto[]> {
    return this.workflowService.getValidatedResults(
      user.tenantId,
      user.branchId,
      user,
    );
  }

  @Get('lab/released-results')
  @Roles('Med-Tech', 'Branch Admin', 'Super Admin')
  async getReleasedResults(
    @GetUser() user: RequestUser,
  ): Promise<ReleasedResultQueueDto[]> {
    return this.workflowService.getReleasedResults(
      user.tenantId,
      user.branchId,
      user,
    );
  }

  @Get('patients/:patientId/orders/:orderId/released-lab-result')
  @Roles('Doctor', 'Nurse', 'Med-Tech', 'Branch Admin', 'Super Admin')
  async getReleasedLabResultDetail(
    @Param('patientId') patientId: string,
    @Param('orderId') orderId: string,
    @GetUser() user: RequestUser,
  ): Promise<ReleasedResultSummaryDto> {
    return this.workflowService.getReleasedLabResultDetail(
      patientId,
      orderId,
      user.tenantId,
      user,
    );
  }

  @Get('lab/orders/:orderId/parameter-definitions')
  @Roles('Med-Tech', 'Branch Admin', 'Super Admin')
  async getParameterDefinitions(
    @Param('orderId') orderId: string,
    @GetUser() user: RequestUser,
  ): Promise<LabParameterDefinitionDto[]> {
    return this.workflowService.getParameterDefinitions(
      orderId,
      user.tenantId,
      user.branchId,
      user,
    );
  }

  @Get('patients/:patientId/orders/:orderId/lab-draft-context')
  @Roles('Med-Tech', 'Branch Admin', 'Super Admin')
  async getLabDraftEncodingContext(
    @Param('patientId') patientId: string,
    @Param('orderId') orderId: string,
    @GetUser() user: RequestUser,
  ): Promise<LabResultDraftContextDto> {
    return this.workflowService.getLabDraftEncodingContext(
      patientId,
      orderId,
      user.tenantId,
      user,
    );
  }

  @Get('patients/:patientId/encounters/:encounterId/soap-draft')
  @Roles('Doctor', 'Branch Admin', 'Super Admin')
  async getDraftSOAP(
    @Param('patientId') patientId: string,
    @Param('encounterId') encounterId: string,
    @GetUser() user: RequestUser,
  ): Promise<SoapDraftSummaryDto | null> {
    return this.workflowService.getDraftSOAP(
      patientId,
      encounterId,
      user.tenantId,
      user,
    );
  }

  @Get('lab/test-definitions')
  @Roles('Doctor', 'Nurse', 'Med-Tech', 'Branch Admin', 'Super Admin')
  async getLabTestDefinitions(
    @GetUser() user: RequestUser,
  ): Promise<LabTestDefinitionSummaryDto[]> {
    return this.workflowService.getLabTestDefinitions(user.tenantId, user);
  }
}
