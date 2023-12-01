import type { OpenAPIV3 } from 'openapi-types';

export const errorResponse: OpenAPIV3.SchemaObject = {
  title: 'Error response message',
  type: 'object',
  additionalProperties: false,
  properties: {
    errors: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          message: {
            type: 'string',
          },
        },
        required: ['message'],
      },
    },
  },
  required: ['errors'],
};
