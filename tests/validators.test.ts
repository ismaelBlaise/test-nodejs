import { describe, it, expect } from '@jest/globals';
import validateBatchRequest from '../utils/validators';

describe('Batch Validators', () => {
  describe('validateBatchRequest', () => {
    it('should validate valid request', () => {
      const { error, value } = validateBatchRequest({ userIds: ['user-1', 'user-2'] });

      expect(error).toBeUndefined();
      expect(value.userIds).toEqual(['user-1', 'user-2']);
    });

    it('should reject empty user IDs', () => {
      const { error } = validateBatchRequest({ userIds: [] });

      expect(error).toBeDefined();
    });

    it('should reject invalid type', () => {
      const { error } = validateBatchRequest({ userIds: 'not-an-array' });

      expect(error).toBeDefined();
    });

    it('should reject extra fields', () => {
      const { error } = validateBatchRequest({
        userIds: ['user-1'],
        extraField: 'should-be-rejected',
      });

      expect(error).toBeDefined();
    });
  });
});
