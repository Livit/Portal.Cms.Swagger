import { OpenAPIV3 } from 'openapi-types';
import { Endpoint } from 'payload/config';

export interface EndpointDocumentation {
  summary?: string;
  description: string;
  hasSecurity?: boolean;
  operationId: string;
  responseSchema: OpenAPIV3.SchemaObject | string;
  errorResponseSchemas?: Record<number, OpenAPIV3.SchemaObject | string>;
  queryParameters?: Record<
    string,
    {
      description?: string;
      required?: boolean;
      schema: OpenAPIV3.SchemaObject | string;
    }
  >;
}

type DocumentedEndpoint = Endpoint & EndpointDocumentation;

export function defineEndpoint(endpoint: DocumentedEndpoint): Endpoint {
  const {
    summary,
    description,
    operationId,
    responseSchema,
    errorResponseSchemas,
    hasSecurity,
    queryParameters,
    custom,
    ...rest
  } = endpoint;
  return {
    ...rest,
    custom: {
      ...custom,
      openapi: {
        summary,
        description,
        hasSecurity,
        operationId,
        responseSchema,
        errorResponseSchemas,
        queryParameters,
      },
    },
  };
}

export function getEndpointDocumentation(endpoint: Endpoint): EndpointDocumentation | undefined {
  return endpoint.custom?.openapi;
}
