import type { OpenAPIV3 } from 'openapi-types';
import { SanitizedGlobalConfig } from 'payload/types';
import { Options } from '../../../options';
import { createRef, createRequestBody, createResponse, createUpsertConfirmationSchema, entityToSchema } from '../../../schemas';
import { getSingular, getSingularSchemaName, merge } from '../../../utils';
import { getCustomPaths } from '../custom-paths';
import { getRouteAccess } from '../../route-access';
import { createVersionRoutes } from '../version-paths';
import { SanitizedConfig } from 'payload/config';
import { createUpsertSchema } from '../../../schemas/upsert-schema';
import { basicQueryParams } from '../../../base-config';

export const getGlobalRoutes = async (
  global: SanitizedGlobalConfig,
  options: Options,
  payloadConfig: SanitizedConfig,
): Promise<Pick<Required<OpenAPIV3.Document>, 'paths' | 'components'>> => {
  const singleItem = getSingular(global);
  const schemaName = getSingularSchemaName(global);

  const paths: OpenAPIV3.PathsObject = {
    [`/globals/${global.slug}`]: {
      get: {
        summary: `Get the ${singleItem}`,
        description: `Get the ${singleItem}`,
        operationId: `get_${schemaName}`,
        tags: [`global ${global.slug}`],
        security: await getRouteAccess(global, 'read', options.access),
        parameters: basicQueryParams,
        responses: {
          '200': createRef(schemaName, 'responses'),
        },
      },
      post: {
        summary: `Updates the ${singleItem}`,
        description: `Updates the ${singleItem}`,
        operationId: `post_${schemaName}`,
        tags: [`global ${global.slug}`],
        security: await getRouteAccess(global, 'update', options.access),
        parameters: basicQueryParams,
        requestBody: createRef(schemaName, 'requestBodies'),
        responses: {
          '200': createRef(`${schemaName}UpsertConfirmation`, 'responses'),
        },
      },
    },
  };

  const { schema, fieldDefinitions } = await entityToSchema(payloadConfig, global);
  const { example, examples } = global.custom?.openapi || {};

  const components: OpenAPIV3.ComponentsObject = {
    schemas: {
      [schemaName]: { ...schema, ...{ example, examples } },
      [`${schemaName}UpsertConfirmation`]: createUpsertConfirmationSchema(schemaName, singleItem),
      ...fieldDefinitions,
    },
    requestBodies: {
      [`${schemaName}Request`]: createRequestBody(createUpsertSchema(payloadConfig, schema)),
    },
    responses: {
      [`${schemaName}Response`]: createResponse('ok', schemaName),
      [`${schemaName}UpsertConfirmationResponse`]: createResponse('ok', `${schemaName}UpsertConfirmation`),
    },
  };

  const versionRoutes = await createVersionRoutes(global, options, payloadConfig);
  const customRoutes = getCustomPaths(global, 'global', options);

  return merge({ paths, components }, versionRoutes, customRoutes);
};
