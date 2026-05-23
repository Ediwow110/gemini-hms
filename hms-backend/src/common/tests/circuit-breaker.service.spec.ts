import { CircuitBreakerService } from '../config/circuit-breaker.service';

describe('CircuitBreakerService - Production Safety', () => {
  let service: CircuitBreakerService;
  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

  beforeEach(() => {
    service = new CircuitBreakerService();
    process.env.NODE_ENV = 'production';
  });

  afterAll(() => {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  });

  it('should return false for getToggleState in production', () => {
    const result = service.getToggleState('tenant1', 'MAINTENANCE_MODE');
    expect(result).toBe(false);
  });

  it('should throw an error for setToggleState in production', () => {
    expect(() => {
      service.setToggleState('tenant1', 'MAINTENANCE_MODE', true);
    }).toThrow('Circuit breaker filesystem state is disabled in production.');
  });
});
