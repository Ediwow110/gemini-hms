import { Test, TestingModule } from '@nestjs/testing';
import { MarketplaceService } from './marketplace.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ListingStatus } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('MarketplaceService', () => {
  let service: MarketplaceService;
  let prisma: PrismaService;
  let audit: AuditService;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-456';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketplaceService,
        {
          provide: PrismaService,
          useValue: {
            serviceItem: {
              findFirst: jest.fn(),
            },
            marketplaceListing: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MarketplaceService>(MarketplaceService);
    prisma = module.get<PrismaService>(PrismaService);
    audit = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createListing', () => {
    it('should create a listing and log audit', async () => {
      const dto = {
        serviceItemId: 'item-uuid',
        description: 'New listing',
      };

      (prisma.serviceItem.findFirst as jest.Mock).mockResolvedValue({
        id: 'item-uuid',
      });
      (prisma.marketplaceListing.create as jest.Mock).mockResolvedValue({
        id: 'listing-123',
        ...dto,
      });

      const result = await service.createListing(mockTenantId, mockUserId, dto);

      expect(result.id).toBe('listing-123');
      expect(prisma.marketplaceListing.create).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'MARKETPLACE_LISTING_CREATED',
        }),
      );
    });

    it('should throw NotFoundException if item does not exist', async () => {
      (prisma.serviceItem.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createListing(mockTenantId, mockUserId, {
          serviceItemId: 'invalid',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('moderateListing', () => {
    it('should update status and log audit', async () => {
      const listingId = 'listing-123';
      const dto = { status: ListingStatus.APPROVED };

      (prisma.marketplaceListing.findFirst as jest.Mock).mockResolvedValue({
        id: listingId,
      });
      (prisma.marketplaceListing.update as jest.Mock).mockResolvedValue({
        id: listingId,
        status: ListingStatus.APPROVED,
      });

      const result = await service.moderateListing(
        mockTenantId,
        mockUserId,
        listingId,
        dto,
      );

      expect(result.status).toBe(ListingStatus.APPROVED);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventKey: 'MARKETPLACE_LISTING_MODERATED',
        }),
      );
    });
  });
});
