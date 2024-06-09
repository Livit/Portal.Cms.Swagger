import type { OpenAPIV3 } from 'openapi-types';
import { SanitizedCollectionConfig } from 'payload/types';
import { Options } from '../../../options';
import { createRef, createResponse } from '../../../schemas';
import { getPlural, getPluralSchemaName, getSingularSchemaName } from '../../../utils';
import { getRouteAccess, includeIfAvailable } from '../../route-access';
import { bulkUpdateOrDeleteQueryParams } from '../../../base-config';

export const getBulkRoutes = async (
  collection: SanitizedCollectionConfig,
  options: Options,
): Promise<Pick<Required<OpenAPIV3.Document>, 'paths' | 'components'>> => {
  if (!options.supports.bulkOperations) return { paths: {}, components: {} };

  const plural = getPlural(collection);
  const schemaName = getSingularSchemaName(collection);
  const pluralSchemaName = getPluralSchemaName(collection);

  const paths: OpenAPIV3.PathsObject = {
    [`/${collection.slug}`]: {
      ...includeIfAvailable(collection, 'update', {
        patch: {
          summary: `Update multiple ${plural}`,
          description: `Update all ${plural} matching the where query`,
          operationId: `patch_${pluralSchemaName}`,
          tags: [collection.slug],
          security: await getRouteAccess(collection, 'update', options.access),
          parameters: bulkUpdateOrDeleteQueryParams,
          requestBody: createRef(schemaName, 'requestBodies'),
          responses: {
            '200': createRef(`${schemaName}Bulk`, 'responses'),
          },
        },
      }),
      ...includeIfAvailable(collection, 'delete', {
        delete: {
          summary: `Delete multiple ${plural}`,
          description: `Delete all ${plural} matching the where query`,
          operationId: `delete_${pluralSchemaName}`,
          tags: [collection.slug],
          security: await getRouteAccess(collection, 'delete', options.access),
          parameters: bulkUpdateOrDeleteQueryParams,
          responses: {
            '200': createRef(`${schemaName}Bulk`, 'responses'),
          },
        },
      }),
    },
  };

  return {
    paths,
    components: includeIfAvailable(collection, ['delete', 'update'], {
      responses: {
        [`${schemaName}BulkResponse`]: createResponse('ok', {
          type: 'object',
          properties: {
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'string' } },
            docs: { type: 'array', items: createRef(schemaName) },
          },
        }),
      },
    }),
  };
};
