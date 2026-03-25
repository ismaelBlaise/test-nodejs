import Joi from 'joi';

export const batchRequestSchema = Joi.object({
  userIds: Joi.array().items(Joi.string().min(1)).min(1).max(10000).required().messages({
    'array.min': 'userIds array must contain at least 1 item',
    'array.max': 'userIds array cannot contain more than 10000 items',
  }),
});

export function validateBatchRequest(data: unknown): {
  error?: Joi.ValidationError;
  value: { userIds: string[] };
} {
  const { error, value } = batchRequestSchema.validate(data, {
    abortEarly: false,
    allowUnknown: false,
  });

  return { error, value: value || { userIds: [] } };
}

export default validateBatchRequest;
