import type { OpenAPIV3 } from 'openapi-types';
import { SanitizedCollectionConfig } from 'payload/types';

const basicParameters: Record<string, OpenAPIV3.ParameterObject> = {
  depth: {
    name: 'depth',
    in: 'query',
    description: 'number of levels to automatically populate relationships and uploads',
    schema: { type: 'number' },
  },
  locale: {
    name: 'locale',
    in: 'query',
    description: 'retrieves document(s) in a specific locale',
    schema: { type: 'string' },
  },
  fallbackLocale: {
    name: 'fallback-locale',
    in: 'query',
    description: 'specifies a fallback locale if no locale value exists',
    schema: { type: 'string' },
  },
};

const whereParameterObject: OpenAPIV3.ParameterObject = {
  name: 'where',
  in: 'query',
  description: 'pass a where query to constrain returned documents (complex type, see documentation)',
  style: 'deepObject',
  explode: true,
  allowReserved: true,
  schema: { $ref: '#/components/schemas/where' },
};

const whereParameters: Record<string, OpenAPIV3.ParameterObject> = {
  where: whereParameterObject,
  requiredWhere: {
    ...whereParameterObject,
    required: true,
  },
};

const paginationParameters: Record<string, OpenAPIV3.ParameterObject> = {
  sort: {
    name: 'sort',
    in: 'query',
    description: 'sort by field',
    schema: { type: 'string' },
  },
  limit: {
    name: 'limit',
    in: 'query',
    description: 'limit the returned documents to a certain number',
    schema: { type: 'number' },
  },
  page: {
    name: 'page',
    in: 'query',
    description: 'get a specific page of documents',
    schema: { type: 'number' },
  },
};

const draftParameters: Record<string, OpenAPIV3.ParameterObject> = {
  draft: {
    name: 'draft',
    in: 'query',
    description: 'Set it to false to exclude draft document, default is false',
    schema: { type: 'boolean' },
  },
};

export const allParameters = {
  ...basicParameters,
  ...draftParameters,
  ...whereParameters,
  ...paginationParameters,
};

const paginationQueryParams: OpenAPIV3.ReferenceObject[] = Object.keys(paginationParameters).map(name => ({
  $ref: `#/components/parameters/${name}`,
}));

export const basicQueryParams: OpenAPIV3.ReferenceObject[] = Object.keys(basicParameters).map(name => ({
  $ref: `#/components/parameters/${name}`,
}));

export const includeDraftParamIfAvailable = (collection: SanitizedCollectionConfig): OpenAPIV3.ReferenceObject[] =>
  collection.versions?.drafts ? [{ $ref: `#/components/parameters/draft` }] : [];

export const findQueryParams = [...basicQueryParams, ...paginationQueryParams, { $ref: `#/components/parameters/where` }];

export const bulkUpdateOrDeleteQueryParams = [
  ...basicQueryParams,
  ...paginationQueryParams,
  { $ref: `#/components/parameters/requiredWhere` },
];
