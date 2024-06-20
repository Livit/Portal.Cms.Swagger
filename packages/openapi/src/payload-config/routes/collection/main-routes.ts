import type { OpenAPIV3 } from 'openapi-types';
import { SanitizedCollectionConfig } from 'payload/types';
import { Options } from '../../../options';
import {
  createPaginatedDocumentSchema,
  createRef,
  createRequestBody,
  createResponse,
  createUpsertConfirmationSchema,
  entityToSchema,
} from '../../../schemas';
import { getRouteAccess, includeIfAvailable } from '../../route-access';
import { getSingular, getPlural, getSingularSchemaName, getPluralSchemaName } from '../../../utils';
import { SanitizedConfig } from 'payload/config';
import { createUpsertSchema } from '../../../schemas/upsert-schema';
import { basicQueryParams, findQueryParams, includeDraftParamIfAvailable } from '../../../base-config';

export const getMainRoutes = async (
  collection: SanitizedCollectionConfig,
  options: Options,
  payloadConfig: SanitizedConfig,
): Promise<Pick<Required<OpenAPIV3.Document>, 'paths' | 'components'>> => {
  const singleItem = getSingular(collection);
  const plural = getPlural(collection);
  const schemaName = getSingularSchemaName(collection);
  const pluralSchemaName = getPluralSchemaName(collection);

  const paths: OpenAPIV3.PathsObject = {
    [`/${collection.slug}`]: {
      ...includeIfAvailable(collection, 'read', {
        get: {
          summary: `Find paginated ${plural}`,
          description: `Find paginated ${plural}`,
          operationId: `get_${pluralSchemaName}`,
          tags: [collection.slug],
          security: await getRouteAccess(collection, 'read', options.access),
          parameters: [...findQueryParams, ...includeDraftParamIfAvailable(collection)],
          responses: {
            '200': createRef(pluralSchemaName, 'responses'),
          },
        },
      }),
      ...includeIfAvailable(collection, 'create', {
        post: {
          summary: `Create a new ${singleItem}`,
          description: `Create a new ${singleItem}`,
          operationId: `post_${schemaName}`,
          tags: [collection.slug],
          security: await getRouteAccess(collection, 'create', options.access),
          parameters: basicQueryParams,
          requestBody: createRef(schemaName, 'requestBodies'),
          responses: {
            '200': createRef(`${schemaName}UpsertConfirmation`, 'responses'),
          },
        },
      }),
    },
    [`/${collection.slug}/{id}`]: {
      ...includeIfAvailable(collection, 'read', {
        get: {
          summary: `Get a single ${singleItem} by its id`,
          description: `Get a single ${singleItem} by its id`,
          operationId: `get_${schemaName}_by_id`,
          tags: [collection.slug],
          security: await getRouteAccess(collection, 'read', options.access),
          parameters: [
            {
              name: 'id',
              in: 'path',
              description: `id of the ${singleItem}`,
              required: true,
              schema: { type: 'string' },
            },
            ...basicQueryParams,
            ...includeDraftParamIfAvailable(collection),
          ],
          responses: {
            '200': createRef(schemaName, 'responses'),
            '404': createRef('NotFoundError', 'responses'),
          },
        },
      }),
      ...includeIfAvailable(collection, 'update', {
        patch: {
          summary: `Updates a ${singleItem}`,
          description: `Updates a ${singleItem}`,
          operationId: `patch_${schemaName}_by_id`,
          tags: [collection.slug],
          security: await getRouteAccess(collection, 'update', options.access),
          parameters: [
            {
              name: 'id',
              in: 'path',
              description: `id of the ${singleItem}`,
              required: true,
              schema: { type: 'string' },
            },
            ...basicQueryParams,
          ],
          requestBody: createRef(schemaName, 'requestBodies'),
          responses: {
            '200': createRef(`${schemaName}UpsertConfirmation`, 'responses'),
            '404': createRef('NotFoundError', 'responses'),
          },
        },
      }),
      ...includeIfAvailable(collection, 'delete', {
        delete: {
          summary: `Deletes an existing ${singleItem}`,
          description: `Deletes an existing ${singleItem}`,
          operationId: `delete_${schemaName}_by_id`,
          tags: [collection.slug],
          security: await getRouteAccess(collection, 'delete', options.access),
          parameters: [
            {
              name: 'id',
              in: 'path',
              description: `id of the ${singleItem}`,
              required: true,
              schema: { type: 'string' },
            },
            ...basicQueryParams,
          ],
          responses: {
            '200': createRef(schemaName, 'responses'),
            '404': createRef('NotFoundError', 'responses'),
          },
        },
      }),
    },
  };

  const { schema, fieldDefinitions } = await entityToSchema(payloadConfig, collection);
  const { example, examples } = collection.custom?.openapi || {};
  const uploadEnabled = !!collection.upload;

  const components: OpenAPIV3.ComponentsObject = {
    schemas: {
      [schemaName]: { ...schema, ...{ example, examples } },
      ...includeIfAvailable(collection, 'read', {
        [pluralSchemaName]: createPaginatedDocumentSchema(schemaName, plural),
      }),
      ...includeIfAvailable(collection, ['create', 'update'], {
        [`${schemaName}UpsertConfirmation`]: createUpsertConfirmationSchema(schemaName, singleItem),
      }),
      ...fieldDefinitions,
    },
    requestBodies: {
      ...includeIfAvailable(collection, ['create', 'update'], {
        [`${schemaName}Request`]: createRequestBody(
          createUpsertSchema(payloadConfig, schema, !!collection.upload),
          uploadEnabled ? 'multipart/form-data' : undefined,
        ),
      }),
    },
    responses: {
      ...includeIfAvailable(collection, 'read', { [`${schemaName}Response`]: createResponse('ok', schemaName) }),
      ...includeIfAvailable(collection, 'read', { [`${pluralSchemaName}Response`]: createResponse('ok', pluralSchemaName) }),
      ...includeIfAvailable(collection, ['create', 'update'], {
        [`${schemaName}UpsertConfirmationResponse`]: createResponse('ok', `${schemaName}UpsertConfirmation`),
      }),
    },
  };

  return { paths, components };
};
