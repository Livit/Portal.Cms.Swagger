import { Endpoint } from 'payload/config';
import { CollectionConfig, GlobalConfig } from 'payload/types';

import type { EndpointDocumentation, Example } from '@livit/portal.cms.payload-openapi';
export type { EndpointDocumentation, Example } from '@livit/portal.cms.payload-openapi';

type DocumentedEndpoint = Endpoint & EndpointDocumentation;

export function defineEndpoint(endpoint: DocumentedEndpoint): Endpoint {
  const { summary, description, operationId, responseSchema, errorResponseSchemas, queryParameters, custom, ...rest } = endpoint;
  return {
    ...rest,
    custom: {
      ...custom,
      openapi: {
        summary,
        description,
        operationId,
        responseSchema,
        errorResponseSchemas,
        queryParameters,
      },
    },
  };
}

export function defineCollection<T = any>(config: CollectionConfig & Example<T>): CollectionConfig {
  const { example, examples, custom, ...rest } = config as CollectionConfig & Record<'example' | 'examples', any>;
  return {
    ...rest,
    custom: {
      ...custom,
      openapi: {
        example,
        examples,
      },
    },
  };
}

export function defineGlobal<T = any>(config: GlobalConfig & Example<T>): GlobalConfig {
  const { example, examples, custom, ...rest } = config as GlobalConfig & Record<'example' | 'examples', any>;
  return {
    ...rest,
    custom: {
      ...custom,
      openapi: {
        example,
        examples,
      },
    },
  };
}
