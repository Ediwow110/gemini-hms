import { Injectable, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { RehabSessionDto } from './dto/rehab-session.dto';

export interface PatientRehabState {
  patientId: string;
  tenantId: string;
  complexityTier: number; // Scaling from Tier 1 (Basic) to 5 (Advanced)
  consecutiveLowScores: number;
}

export interface DeviceRegistry {
  deviceId: string;
  tenantId: string;
}

@Injectable()
export class CognitiveRehabService {
  private readonly logger = new Logger(CognitiveRehabService.name);
  
  public patientStates = new Map<string, PatientRehabState>();
  public deviceRegistry = new Map<string, DeviceRegistry>();
  public auditLogs: { status: string, message: string }[] = [];

  constructor() {
    this.seedRegistry();
  }

  private seedRegistry() {
    this.deviceRegistry.set('tactile-block-01', { deviceId: 'tactile-block-01', tenantId: '234f5c00-f6a3-4d55-996a-281e1306d7ca' });
    this.patientStates.set('pat-777', { patientId: 'pat-777', tenantId: '234f5c00-f6a3-4d55-996a-281e1306d7ca', complexityTier: 3, consecutiveLowScores: 0 });
  }

  async processTherapyPacket(tenantId: string, payload: RehabSessionDto): Promise<PatientRehabState> {
    this.logger.log(`Processing cognitive rehab packet for patient: ${payload.patientId}`);
    
    // 1. Multi-Tenant Interceptor Fencing
    if (payload.tenantId !== tenantId) {
      throw new ForbiddenException('Tenant ID mismatch in payload.');
    }
    
    const device = this.deviceRegistry.get(payload.deviceId);
    if (!device || device.tenantId !== tenantId) {
      throw new ForbiddenException('Device is not registered or assigned to a different tenant namespace.');
    }

    const state = this.patientStates.get(payload.patientId);
    if (!state || state.tenantId !== tenantId) {
      throw new ForbiddenException('Patient state not found or isolated tenant mismatch.');
    }

    // 2. Atomic Data Integrity Guard (Intercepting dropped connections)
    if (payload.isSessionAborted) {
      this.logger.error(`🚨 [ATOMIC_ROLLBACK] Device disconnected mid-session mutation loop. Safely rolling back session logs to preserve data integrity.`);
      throw new BadRequestException('SESSION_ABORTED_MID_MUTATION');
    }

    // 3. Adaptive Pacing Equation
    // P_rehab = \beta * M_accuracy + (1 - \beta) * (T_target / T_response)
    const beta = 0.6;
    const tRatio = payload.targetLatency / Math.max(0.001, payload.actualLatency); 
    const cappedTRatio = Math.min(1.0, tRatio); // Prevent runaway scaling if response is instantaneous
    
    const pRehab = (beta * payload.accuracyRate) + ((1 - beta) * cappedTRatio);
    
    this.logger.log(`P_rehab precision coefficient calculated: ${pRehab.toFixed(3)}`);

    // 4. Adaptive Complexity Evaluation Matrix
    if (pRehab < 0.45) {
      state.consecutiveLowScores += 1;
      this.logger.warn(`[WARNING] Degradation captured. Consecutive low scores counter: ${state.consecutiveLowScores}`);
      
      if (state.consecutiveLowScores >= 3) {
        if (state.complexityTier > 1) {
          state.complexityTier -= 1;
          this.logger.error(`🚨 [CRITICAL_REGRESSION_ALERT] Continuous regression anomaly intercepted! Downgrading therapeutic complexity tier to ${state.complexityTier}.`);
          this.auditLogs.push({ 
            status: 'CRITICAL_REGRESSION_ALERT', 
            message: `Patient ${payload.patientId} degraded performance dynamically. Target tier dropped to ${state.complexityTier}.` 
          });
        }
        state.consecutiveLowScores = 0; // Reset evaluation loop
      }
    } else {
      state.consecutiveLowScores = 0; // Clear anomalous behavior
      if (pRehab > 0.85) {
        if (state.complexityTier < 5) {
          state.complexityTier += 1;
          this.logger.log(`🟢 [PACING_ADVANCED] Patient excelled. Incrementing complexity tier up to ${state.complexityTier}.`);
        }
      }
    }

    return state;
  }
}
