import type { OpenAPIV3 } from 'openapi-types';
import nodePath from 'path';
import { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload/types';
import { createRequestBody, createResponse } from '../../schemas';
import { getEndpointDocumentation } from '../../config-extensions';
import { objectEntries } from 'ts-powertools';
import { getAuth } from '../route-access';
import { Options } from '../../options';
import { Endpoint, SanitizedConfig } from 'payload/config';
import { PathParameters, QueryParameters } from '../../config-extensions/custom-endpoint';

type Config = SanitizedConfig | SanitizedCollectionConfig | SanitizedGlobalConfig;
type ConfigType = 'payload' | 'global' | 'collection';
const isPayloadConfig = (config: Config): config is SanitizedConfig => !('slug' in config);

const getBasePath = (config: Config, type: ConfigType) => {
  if (isPayloadConfig(config)) return '';
  if (type === 'global') return `/globals/${config.slug}`;
  return `/${config.slug}`;
};

const getTags = (config: Config, type: ConfigType) => {
  if (isPayloadConfig(config)) return ['custom'];
  if (type === 'global') return [`global ${config.slug}`];
  return [config.slug];
};

// We could use the enum here, but prefer to keep the openapi-types lib as devdependecy only
const operations: readonly string[] = ['get', 'head', 'post', 'put', 'patch', 'delete', 'options'] as const;
const isOperation = (method: string): method is OpenAPIV3.HttpMethods => operations.includes(method);

const setOperation = (pathItem: OpenAPIV3.PathItemObject, operation: OpenAPIV3.OperationObject, methods: Endpoint['method']) => {
  const sanitizedMethod = methods.toLowerCase();

  if (sanitizedMethod === 'all') {
    setOperation(pathItem, operation, 'get');
    setOperation(pathItem, operation, 'head');
    setOperation(pathItem, operation, 'post');
    setOperation(pathItem, operation, 'put');
    setOperation(pathItem, operation, 'patch');
    setOperation(pathItem, operation, 'delete');
    setOperation(pathItem, operation, 'options');
  }

  if (isOperation(sanitizedMethod)) {
    pathItem[sanitizedMethod] = operation;
  }
};

const isRelevant = (endpoint: Omit<Endpoint, 'root'>, configType: ConfigType) => {
  switch (configType) {
    case 'global':
      if (endpoint.path === '/access' && endpoint.method === 'get') return false;
      if (endpoint.path === '/' && ['get', 'post'].includes(endpoint.method)) return false;
      break;
    case 'collection':
      if (endpoint.path === '/unlock' && endpoint.method === 'post') return false;
      if (endpoint.path === '/verify/:token' && endpoint.method === 'post') return false;
  }

  return true;
};

const getPath = (basePath: string, relativePath: string): { path: string; parameters?: OpenAPIV3.ParameterObject[] } => {
  const parameters: OpenAPIV3.ParameterObject[] = [];
  const sanitizedPath = relativePath
    .split('/')
    .map(part => {
      const match = part.match(/^(?<param>:)?(?<name>.*)(?<optional>\?)?$/);
      const { param, name, optional } = match!.groups!;
      if (!param) return part;

      parameters.push({
        name,
        in: 'path',
        required: !optional,
        schema: { type: 'string' },
      });
      return `{${name}}`;
    })
    .join('/');

  const path = nodePath.join(basePath, sanitizedPath);
  return { path, parameters };
};

const mergePathParams = (
  source: OpenAPIV3.ParameterObject[],
  target: PathParameters,
): (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[] => {
  return source.map(param => {
    const paramValue = target[param.name];
    if (!paramValue) {
      return param;
    }

    if (typeof paramValue === 'string') {
      return { $ref: `#/components/parameters/${paramValue}` };
    }

    const schema = paramValue.schema
      ? typeof paramValue.schema === 'string'
        ? { '$ref': `#/components/schemas/${paramValue.schema}` }
        : paramValue.schema
      : param.schema;

    return {
      ...param,
      schema,
      description: paramValue.description || param.description,
    };
  });
};

const getQueryParams = (params: QueryParameters) => {
  return objectEntries(params).map(([name, paramValue]) => {
    if (typeof paramValue === 'string') {
      return { $ref: `#/components/parameters/${paramValue}` };
    }
    const { description, required, schema } = paramValue;
    return {
      name,
      description: description || name,
      in: 'query',
      required,
      schema:
        typeof schema === 'string'
          ? {
              '$ref': `#/components/schemas/${schema}`,
            }
          : schema,
    };
  });
};

export const getCustomPaths = (
  config: Config,
  type: ConfigType,
  options: Options,
): Pick<Required<OpenAPIV3.Document>, 'paths' | 'components'> => {
  if (!config.endpoints || !config.endpoints.length) return { paths: {}, components: {} };

  const paths: OpenAPIV3.PathsObject = {};
  const basePath = getBasePath(config, type);
  const tags = getTags(config, type);

  for (const endpoint of config.endpoints.filter((endpoint: Endpoint) => isRelevant(endpoint, type))) {
    if (endpoint.custom?.openapi === false) continue;

    const { path, parameters = [] } = getPath(basePath, endpoint.path);
    const {
      summary,
      operationId,
      hasSecurity,
      description = 'custom operation',
      requestBodySchema,
      responseSchema = { schema: { type: 'object' } },
      errorResponseSchemas = {},
      pathParameters = {},
      queryParameters = {},
    } = getEndpointDocumentation(endpoint) || {};
    if (!paths[path]) paths[path] = {};

    const security = hasSecurity ? [getAuth(options.access.apiKey)] : undefined;
    const operation: OpenAPIV3.OperationObject = {
      summary: summary || description,
      description,
      operationId,
      security,
      tags,
      parameters: [...mergePathParams(parameters, pathParameters), ...getQueryParams(queryParameters)],
      requestBody: requestBodySchema && createRequestBody(requestBodySchema.schema, requestBodySchema.mediaType),
      responses: {
        '200': createResponse('succesful operation', responseSchema.schema, responseSchema.mediaType),
        ...Object.entries(errorResponseSchemas).reduce((responses, [code, schema]) => {
          responses[code] = createResponse(`${code} response`, schema);
          return responses;
        }, {} as OpenAPIV3.ResponsesObject),
      },
    };

    if ((endpoint as Endpoint).root) {
      operation.servers = [{ url: '' }];
    }

    setOperation(paths[path]!, operation, endpoint.method);
  }

  return { paths, components: {} };
};
