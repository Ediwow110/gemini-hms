import { Injectable } from '@nestjs/common';

@Injectable()
export class RegionConfig {
  getRegion(): string {
    return process.env.REGION || 'us-east-1';
  }

  getDatabaseUrlForRegion(region: string): string {
    const defaultUrl = process.env.DATABASE_URL;
    if (!defaultUrl) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'CRITICAL: DATABASE_URL environment variable is not defined in production.',
        );
      }
      return 'postgresql://postgres:postgres@localhost:5432/hms_db';
    }
    switch (region) {
      case 'us-east-1':
        return process.env.DATABASE_URL_US_EAST_1 || defaultUrl;
      case 'eu-west-1':
        return process.env.DATABASE_URL_EU_WEST_1 || defaultUrl;
      case 'ap-southeast-1':
        return process.env.DATABASE_URL_AP_SOUTHEAST_1 || defaultUrl;
      default:
        return defaultUrl;
    }
  }

  getFeatureFlagsForRegion(region: string) {
    return {
      enableRegionalDataIsolation: region === 'eu-west-1', // E.g., GDPR containment
      enableHighThroughputCaching: region === 'ap-southeast-1',
      enableComplianceAuditChain: true,
    };
  }
}
