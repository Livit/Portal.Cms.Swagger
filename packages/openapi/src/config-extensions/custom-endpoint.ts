import { OpenAPIV3 } from 'openapi-types';
import { Endpoint } from 'payload/config';

export type MediaTypeSchema = {
  schema: string | OpenAPIV3.SchemaObject;
  mediaType?: string;
};

export type PathParameters = Record<
  string,
  | {
      description?: string;
      schema: OpenAPIV3.SchemaObject | string;
    }
  | string
>;

export type QueryParameters = Record<
  string,
  {
    description?: string;
    required?: boolean;
    schema: OpenAPIV3.SchemaObject | string;
  }
>;

export interface EndpointDocumentation {
  summary?: string;
  description: string;
  hasSecurity?: boolean;
  operationId: string;
  requestBodySchema?: MediaTypeSchema;
  responseSchema: MediaTypeSchema;
  errorResponseSchemas?: Record<number, OpenAPIV3.SchemaObject | string>;
  pathParameters?: PathParameters;
  queryParameters?: QueryParameters;
}

type DocumentedEndpoint = Endpoint & EndpointDocumentation;

export function defineEndpoint(endpoint: DocumentedEndpoint): Endpoint {
  const {
    summary,
    description,
    operationId,
    requestBodySchema,
    responseSchema,
    errorResponseSchemas,
    hasSecurity,
    pathParameters,
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
        requestBodySchema,
        responseSchema,
        errorResponseSchemas,
        pathParameters,
        queryParameters,
      },
    },
  };
}

export function getEndpointDocumentation(endpoint: Endpoint): EndpointDocumentation | undefined {
  return endpoint.custom?.openapi;
}
