/* eslint-disable func-names */
import { OpenAPIV3 } from 'openapi-types';

type FilterComponents = {
  [k in keyof OpenAPIV3.ComponentsObject]: string[];
};

/**
 * Converts a string path to a Regular Expression.
 * Transforms path parameters into named RegExp groups.
 * @param {*} path the path pattern to match
 * @returns {RegExp} Return a regex
 * @no-unit-tests
 */
function pathToRegExp(path: string): RegExp {
  const pattern = path
    // Escape literal dots
    .replace(/\./g, '\\.')
    // Escape literal slashes
    .replace(/\//g, '/')
    // Escape literal question marks
    .replace(/\?/g, '\\?')
    // Ignore trailing slashes
    .replace(/\/+$/, '')
    // Replace wildcard with any zero-to-any character sequence
    .replace(/\*+/g, '.*')
    // Replace parameters with named capturing groups
    .replace(/:([^\d|^\\/][a-zA-Z0-9_]*(?=(?:\/|\\.)|$))/g, (_, paramName) => `(?<${paramName}>[^\\/]+?)`)
    // Allow optional trailing slash
    .concat('(\\/|$)');
  return new RegExp(pattern, 'gi');
}

/**
 * Matches a given url against a path, with Wildcard support (based on the node-match-path package)
 * @param {*} path the path pattern to match
 * @param {*} url the entered URL is being evaluated for matching
 * @returns {boolean} matching information
 */
function matchPath(path: unknown, url: string): boolean {
  const expression = path instanceof RegExp ? path : pathToRegExp(path as string);
  const match = expression.exec(url) || false;
  // Matches in strict mode: match string should equal to input (url)
  // Otherwise loose matches will be considered truthy:
  // match('/messages/:id', '/messages/123/users') // true
  // eslint-disable-next-line one-var,no-implicit-coercion
  const matches = path instanceof RegExp ? !!match : !!match && match[0] === match.input;
  return matches;
}

/**
 * A check if the OpenAPI operation item matches a target definition .
 * @param {object} operationPath the OpenAPI path item to match
 * @param {object} operationMethod the OpenAPI method item to match
 * @param {string} target the entered operation definition that is a combination of the method & path, like GET::/lists
 * @returns {boolean} matching information
 */
function isMatchOperationItem(operationPath: string, operationMethod: string, target: string): boolean | string {
  if (operationPath && operationMethod && target) {
    const targetSplit = target.split('::');
    if (targetSplit[0] && targetSplit[1]) {
      let targetMethod = [targetSplit[0].toLowerCase()];
      const targetPath = targetSplit[1].toLowerCase();
      // Wildcard support
      if (targetMethod.includes('*')) {
        // These are the methods supported in the PathItem schema
        // https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#pathItemObject
        targetMethod = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
      }
      return (
        operationMethod &&
        targetMethod.includes(operationMethod.toLowerCase()) &&
        operationPath &&
        matchPath(targetPath, operationPath.toLowerCase())
      );
    }
  }
  return false;
}

const filterComponentObjectKeys: (keyof OpenAPIV3.ComponentsObject)[] = ['schemas', 'responses', 'requestBodies'];
const getRefs = (node: unknown): FilterComponents => {
  const matchedResults = Array.from(
    new Set<string>(JSON.stringify(node).match(/#\/components\/(?:schemas|responses|requestBodies)\/(?:[^"]+)/g) ?? []),
  );

  const refs = JSON.parse(JSON.stringify(matchedResults).replace(/#\/components\//g, '')) as string[];
  const result = refs.reduce(
    (acc: FilterComponents, ref: string) => {
      const [component, value] = ref.split('/') as [keyof FilterComponents, string];
      if (acc[component]?.includes(value)) {
        return acc;
      }
      acc[component]?.push(value);
      return acc;
    },
    {
      schemas: [],
      responses: [],
      requestBodies: [],
    },
  );
  return result;
};

const getRefRelations = (
  oaObj: OpenAPIV3.Document,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target?: any,
  tempRefRelations?: { [key: string]: string[] },
  parents: string[] = [],
): { [item: string]: string[] } => {
  let result = tempRefRelations ?? {};
  if (!target) {
    Object.keys(oaObj.components ?? {})
      .filter(componentKey => filterComponentObjectKeys.includes(componentKey as keyof OpenAPIV3.ComponentsObject))
      .forEach(componentKey => {
        result = {
          ...result,
          ...getRefRelations(oaObj, oaObj.components?.[componentKey as keyof OpenAPIV3.ComponentsObject], result),
        };
      });

    return result;
  }

  Object.keys(target).forEach(key => {
    if (result[key] || parents.includes(key)) {
      return;
    }

    result[key] = [];
    // To avoid circular references
    parents.push(key);
    // Get ref relations from object
    const refsResult = getRefs(target[key as keyof OpenAPIV3.ComponentsObject]);
    Object.keys(refsResult).forEach(refKey => {
      (refsResult[refKey as keyof FilterComponents] ?? []).forEach(refItemKey => {
        if (!result[key]) {
          result[key] = [];
        }
        // Do not add self reference
        if ((result[key] ?? []).includes(refItemKey)) {
          return;
        }
        // When the ref is already in the result, add the ref and its relations to the current key
        if (result[refItemKey]?.length) {
          result[key].push(refItemKey, ...result[refItemKey]);
          return;
        }

        // Get the component object from the OpenAPI object
        const componentItemObject = oaObj.components?.[refKey as keyof OpenAPIV3.ComponentsObject]?.[refItemKey];
        if (!componentItemObject) {
          return;
        }
        result[key].push(refItemKey);
        const refRelationsResult = getRefRelations(oaObj, { [refItemKey]: componentItemObject }, result, parents);
        result = {
          ...result,
          ...refRelationsResult,
          [key]: [...result[key], ...(refRelationsResult[refItemKey] ?? [])],
        };
      });
    });
  });

  return result;
};

export const openapiFilter = (
  oaObj: OpenAPIV3.Document,
  options: {
    filterOperations: string[];
    debug?: boolean;
  },
) => {
  // Deep copy of the schema object
  const jsonObj = JSON.parse(JSON.stringify(oaObj));
  const usedComponents = new Set<string>();
  const unusedComponents = new Set<string>();
  const metadata: { [key: string]: any } = {
    filterOperations: options.filterOperations,
  };

  const refRelations = getRefRelations(oaObj);
  Object.keys(oaObj.paths ?? {}).forEach(path => {
    Object.keys(oaObj.paths[path] ?? {}).forEach(method => {
      const shouldRemovePath = options.filterOperations.some(filter => isMatchOperationItem(path, method, filter));

      const refsComponents = getRefs(oaObj.paths[path]?.[method as OpenAPIV3.HttpMethods]);
      if (shouldRemovePath) {
        delete jsonObj.paths[path][method];
        metadata.removedOperations = [...(metadata.removedOperations ?? []), `${method}::${path}`];
      }

      filterComponentObjectKeys.forEach(key => {
        const componentKey = key as keyof OpenAPIV3.ComponentsObject;
        (refsComponents?.[componentKey] ?? []).forEach(ref => {
          // Add unused components
          if (shouldRemovePath && !usedComponents.has(ref)) {
            if (unusedComponents.has(ref)) {
              return;
            }

            [...(refRelations[ref] ?? []), ref]
              .filter(item => !usedComponents.has(item))
              .forEach(refItem => {
                unusedComponents.add(refItem);
              });
            return;
          }

          // When the ref exist in the unusedComponents, remove it
          if (shouldRemovePath) {
            unusedComponents.delete(ref);
          }

          // Add ref and its relations to used components
          if (!usedComponents.has(ref)) {
            [...(refRelations[ref] ?? []), ref].forEach(refItem => {
              usedComponents.add(refItem);
            });
          }
        });
      });
    });
  });

  // Clean-up jsonObj
  Object.keys(jsonObj.paths ?? {}).forEach(path => {
    if (Object.keys(jsonObj.paths[path] ?? {}).length === 0) {
      delete jsonObj.paths[path];
    }
  });

  if (unusedComponents.size === 0) {
    return jsonObj;
  }

  // Remove unused components
  Object.keys(oaObj.components ?? {}).forEach(componentKey => {
    Object.keys(oaObj.components?.[componentKey as keyof OpenAPIV3.ComponentsObject] ?? {}).forEach(componentItemKey => {
      const shouldRemoveComponent = unusedComponents.has(componentItemKey) && !usedComponents.has(componentItemKey);
      if (shouldRemoveComponent) {
        delete jsonObj.components?.[componentKey as keyof OpenAPIV3.ComponentsObject]?.[
          componentItemKey as keyof OpenAPIV3.ComponentsObject
        ];

        if (options.debug) {
          metadata.removedComponents = {
            ...metadata.removedComponents,
            [componentKey]: [...(metadata.removedComponents?.[componentKey] ?? []), componentItemKey],
          };
        }
      }
    });
  });

  if (options.debug) {
    const totalRemovedComponents = Object.keys(metadata.removedComponents ?? {}).reduce(
      (acc, componentKey) => acc + (metadata.removedComponents?.[componentKey]?.length ?? 0),
      0,
    );
    metadata.totalRemovedComponents = totalRemovedComponents;
    jsonObj['x-openapi-filter'] = metadata;
  }

  return jsonObj;
};
