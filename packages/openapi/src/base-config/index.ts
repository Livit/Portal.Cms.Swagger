import type { OpenAPIV3 } from 'openapi-types';

import { errorResponse } from './error';
import { confirmation } from './confirm';
import where from './where';
import { Options } from '../options';
import { createResponse } from '../schemas';
import { paginatedDocument } from '../schemas/paginated-documents';
import { allParameters } from './parameters';

export * from './parameters';

const schemas: Record<string, OpenAPIV3.SchemaObject> = {
  errorResponse,
  confirmation,
  paginatedDocument,
  where,
};

const responses: Record<string, OpenAPIV3.ResponseObject> = {
  'InvalidRequestErrorResponse': createResponse('invalid request', 'errorResponse'),
  'UnauthorizedErrorResponse': createResponse('unauthorized', 'errorResponse'),
  'NotFoundErrorResponse': createResponse('not found', 'errorResponse'),
  confirmationResponse: createResponse('confirmed', 'confirmation'),
};

const createBaseConfig = (options: Options): OpenAPIV3.Document => ({
  openapi: '3.0.3',
  info: {
    title: 'Payload CMS',
    version: '1.0.0',
  },
  paths: {},
  components: {
    securitySchemes: {
      basicAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'jwt',
      },
      cookieAuth: {
        in: 'cookie',
        type: 'apiKey',
        name: options.access.cookieName,
      },
      ...(options.access.apiKey
        ? {
            apiKeyAuth: {
              in: 'header',
              type: 'apiKey',
              name: 'Authorization',
            },
          }
        : {}),
    },
    schemas,
    parameters: allParameters,
    responses,
  },
  externalDocs: {
    description: 'Payload REST API documentation',
    url: 'https://payloadcms.com/docs/rest-api/overview',
  },
});

export default createBaseConfig;
