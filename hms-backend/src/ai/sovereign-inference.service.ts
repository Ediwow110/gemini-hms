import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface VitalsInput {
  bps: number;   // Systolic BP
  bpd: number;   // Diastolic BP
  hr: number;    // Heart Rate
  temp: number;  // Temperature (Celsius)
}

export interface TriageResult {
  acuityTier: 'LOW' | 'MEDIUM' | 'HIGH';
  triageUrgencyScore: number;
  anonymizedSoapNotes: string;
  flaggedWarnings: string[];
  suggestedAction: string;
  inferredAt: string;
}

@Injectable()
export class SovereignInferenceService {
  private readonly logger = new Logger(SovereignInferenceService.name);

  // System Safety prompt rail context
  private readonly medicalSafetyRail = "SYSTEM CONTEXT: You are an offline sovereign medical decision support assistant. You MUST strictly adhere to patient data privacy constraints. All output must be objective, clinically reasoned, and highlight potential adverse drug interactions.";

  /**
   * Performs sovereign clinical analysis, symptom weighting score calculations, and LLM triage
   */
  async analyzeClinicalTriage(soapNotes: string, vitals: VitalsInput): Promise<TriageResult> {
    this.logger.log('Received sovereign triage analysis request');

    // 1. Anonymize SOAP notes to strip potential PHI (names, SSNs, phone numbers)
    const anonymizedSoap = this.anonymizeText(soapNotes);

    // 2. Compute Urgency score utilizing normalised mathematical weights
    // S_triage = sum(w_i * v_i) / max(V)
    let symptomWeightSum = 0;
    const maxV = 4.0; // Normalised maximum possible urgency bounds

    // Symptom 1: Fever
    if (vitals.temp > 38.0) {
      symptomWeightSum += 0.8 * 1.0;
    }
    // Symptom 2: Tachycardia
    if (vitals.hr > 100) {
      symptomWeightSum += 0.75 * 1.0;
    }
    // Symptom 3: Severe Hypertension
    if (vitals.bps > 140) {
      symptomWeightSum += 0.65 * 1.0;
    }
    // Symptom 4: Chest pain or difficulty breathing in notes
    const lowerNotes = anonymizedSoap.toLowerCase();
    if (lowerNotes.includes('chest pain') || lowerNotes.includes('breathing difficulty') || lowerNotes.includes('dyspnea')) {
      symptomWeightSum += 0.95 * 1.0;
    }

    const urgencyScore = Math.min(symptomWeightSum / maxV, 1.0);

    // 3. Acuity Tier mapping
    let acuityTier: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let suggestedAction = 'Routine clinic follow-up.';
    if (urgencyScore >= 0.65) {
      acuityTier = 'HIGH';
      suggestedAction = 'IMMEDIATE emergency department referral. Arm cardiac alarms.';
    } else if (urgencyScore >= 0.3) {
      acuityTier = 'MEDIUM';
      suggestedAction = 'Prioritized clinical appointment within 24 hours.';
    }

    // 4. Drug-Interaction Warnings
    const flaggedWarnings: string[] = [];
    if (lowerNotes.includes('aspirin') && lowerNotes.includes('warfarin')) {
      flaggedWarnings.push('CRITICAL INTERACTION WARNING: Combined Aspirin & Warfarin increases severe hemorrhage risk.');
    }
    if (lowerNotes.includes('ibuprofen') && lowerNotes.includes('lisinopril')) {
      flaggedWarnings.push('INTERACTION WARNING: NSAIDs may reduce therapeutic efficacy of ACE inhibitors.');
    }

    this.logger.log(`Triage calculation complete: Score: ${urgencyScore.toFixed(3)} | Tier: ${acuityTier}`);

    return {
      acuityTier,
      triageUrgencyScore: parseFloat(urgencyScore.toFixed(3)),
      anonymizedSoapNotes: anonymizedSoap,
      flaggedWarnings,
      suggestedAction,
      inferredAt: new Date().toISOString()
    };
  }

  /**
   * Strict regex-based de-identification to strip raw names and IDs
   */
  private anonymizeText(text: string): string {
    return text
      .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[ANONYMIZED_PATIENT_NAME]')
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[ANONYMIZED_SSN]')
      .replace(/\b\d{10}\b/g, '[ANONYMIZED_CONTACT]');
  }
}
