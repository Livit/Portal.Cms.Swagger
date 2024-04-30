import type { OpenAPIV3 } from 'openapi-types';

export const paginatedDocument: OpenAPIV3.SchemaObject = {
  title: 'Paginated Document',
  type: 'object',
  properties: {
    totalDocs: { type: 'number' },
    limit: { type: 'number' },
    totalPages: { type: 'number' },
    page: { type: 'number' },
    pagingCounter: { type: 'number' },
    hasPrevPage: { type: 'boolean' },
    hasNextPage: { type: 'boolean' },
    prevPage: { type: 'number' },
    nextPage: { type: 'number' },
  },
  required: ['totalDocs', 'limit', 'totalPages', 'page', 'pagingCounter', 'hasPrevPage', 'hasNextPage'],
};

export const createPaginatedDocumentSchema = (schemaName: string, title: string): OpenAPIV3.SchemaObject => {
  return {
    title,
    allOf: [
      {
        properties: {
          docs: {
            type: 'array',
            items: {
              '$ref': `#/components/schemas/${schemaName}`,
            },
          },
        },
        required: ['docs'],
      },
      {
        $ref: '#/components/schemas/paginatedDocument',
      },
    ],
  };
};
