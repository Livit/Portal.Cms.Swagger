import type { OpenAPIV3 } from 'openapi-types';

export const createContent = (
  schema: string | OpenAPIV3.SchemaObject,
  mediaType: string = 'application/json',
): {
  [mediaType: string]: OpenAPIV3.MediaTypeObject;
} => ({
  [mediaType]: {
    schema:
      typeof schema === 'string'
        ? {
            '$ref': `#/components/schemas/${schema}`,
          }
        : schema,
  },
});

export const createRequestBody = (schema: string | OpenAPIV3.SchemaObject, mediaType?: string): OpenAPIV3.RequestBodyObject => ({
  content: createContent(schema, mediaType),
});

export const createResponse = (
  description: string,
  schema: string | OpenAPIV3.SchemaObject,
  mediaType?: string,
): OpenAPIV3.ResponseObject => ({
  description,
  content: createContent(schema, mediaType),
});

type ComponentType = 'schemas' | 'responses' | 'requestBodies';

const getPostfix = (type: ComponentType) => {
  switch (type) {
    case 'responses':
      return 'Response';
    case 'requestBodies':
      return 'Request';
    default:
      return '';
  }
};

export const createRef = (entity: string, type: ComponentType = 'schemas') => ({
  '$ref': `#/components/${type}/${entity}${getPostfix(type)}`,
});
