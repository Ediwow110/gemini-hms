import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateClinicalNoteDto,
  UpdateClinicalNoteDto,
} from './dto/clinical.dto';
import { EncounterStatus } from '@prisma/client';

@Injectable()
export class ClinicalNoteService {
  private readonly logger = new Logger(ClinicalNoteService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async createNote(
    tenantId: string,
    userId: string,
    branchId: string,
    encounterId: string,
    dto: CreateClinicalNoteDto,
  ) {
    try {
      const encounter = await this.prisma.encounter.findFirst({
        where: { id: encounterId, tenantId },
      });

      if (!encounter) {
        throw new NotFoundException('Encounter not found');
      }

      if (encounter.status !== EncounterStatus.OPEN) {
        throw new ConflictException(
          'clinical_encounter_not_open: Cannot add clinical notes to a closed or cancelled encounter',
        );
      }

      return await this.prisma.$transaction(async (tx) => {
        const note = await tx.clinicalNote.create({
          data: {
            tenantId,
            encounterId,
            authorId: userId,
            subjective: dto.subjective,
            objective: dto.objective,
            assessment: dto.assessment,
            plan: dto.plan,
            createdBy: userId,
            updatedBy: userId,
          },
        });

        await this.audit.log(
          {
            tenantId,
            userId,
            eventKey: 'CLINICAL_NOTE_CREATED',
            recordType: 'ClinicalNote',
            recordId: note.id,
            newValues: {
              encounterId,
              authorId: userId,
            },
          },
          tx,
          branchId,
        );

        return note;
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(`Error in createNote: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateNote(
    tenantId: string,
    userId: string,
    noteId: string,
    dto: UpdateClinicalNoteDto,
  ) {
    try {
      const note = await this.prisma.clinicalNote.findFirst({
        where: { id: noteId, tenantId },
      });

      if (!note) {
        throw new NotFoundException('Clinical note not found');
      }

      if (note.lockedAt !== null) {
        throw new ConflictException(
          'clinical_note_locked: Cannot edit a locked clinical note',
        );
      }

      // Check if associated encounter is still open
      const encounter = await this.prisma.encounter.findFirst({
        where: { id: note.encounterId, tenantId },
      });

      if (encounter && encounter.status !== EncounterStatus.OPEN) {
        throw new ConflictException(
          'clinical_encounter_not_open: Cannot edit clinical notes of a closed or cancelled encounter',
        );
      }

      return await this.prisma.$transaction(async (tx) => {
        const updated = await tx.clinicalNote.update({
          where: { id: noteId },
          data: {
            subjective:
              dto.subjective !== undefined ? dto.subjective : note.subjective,
            objective:
              dto.objective !== undefined ? dto.objective : note.objective,
            assessment:
              dto.assessment !== undefined ? dto.assessment : note.assessment,
            plan: dto.plan !== undefined ? dto.plan : note.plan,
            updatedBy: userId,
          },
        });

        await this.audit.log(
          {
            tenantId,
            userId,
            eventKey: 'CLINICAL_NOTE_UPDATED',
            recordType: 'ClinicalNote',
            recordId: noteId,
            oldValues: {
              subjective: note.subjective,
              objective: note.objective,
              assessment: note.assessment,
              plan: note.plan,
            },
            newValues: {
              subjective: updated.subjective,
              objective: updated.objective,
              assessment: updated.assessment,
              plan: updated.plan,
            },
          },
          tx,
          encounter?.branchId,
        );

        return updated;
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(`Error in updateNote: ${error.message}`, error.stack);
      throw error;
    }
  }

  async lockNote(tenantId: string, userId: string, noteId: string) {
    try {
      const note = await this.prisma.clinicalNote.findFirst({
        where: { id: noteId, tenantId },
      });

      if (!note) {
        throw new NotFoundException('Clinical note not found');
      }

      if (note.lockedAt !== null) {
        throw new ConflictException(
          'clinical_note_already_locked: Clinical note is already locked',
        );
      }

      const encounter = await this.prisma.encounter.findFirst({
        where: { id: note.encounterId, tenantId },
      });

      return await this.prisma.$transaction(async (tx) => {
        const locked = await tx.clinicalNote.update({
          where: { id: noteId },
          data: {
            lockedAt: new Date(),
            lockedBy: userId,
            updatedBy: userId,
          },
        });

        await this.audit.log(
          {
            tenantId,
            userId,
            eventKey: 'CLINICAL_NOTE_LOCKED',
            recordType: 'ClinicalNote',
            recordId: noteId,
            newValues: {
              lockedAt: locked.lockedAt,
              lockedBy: userId,
            },
          },
          tx,
          encounter?.branchId,
        );

        return locked;
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(`Error in lockNote: ${error.message}`, error.stack);
      throw error;
    }
  }
}
