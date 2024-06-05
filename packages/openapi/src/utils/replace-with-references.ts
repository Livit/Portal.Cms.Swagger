import { OpenAPIV3 } from 'openapi-types';

export const replaceWithReferences = (
  components: OpenAPIV3.ComponentsObject,
  referenceSchemas: {
    [key: string]: OpenAPIV3.SchemaObject;
  },
): OpenAPIV3.ComponentsObject => {
  let componentsAsString = JSON.stringify(components);
  Object.keys(referenceSchemas).forEach(schemaName => {
    componentsAsString = componentsAsString.replace(
      // escapeRegExp
      new RegExp(JSON.stringify(referenceSchemas[schemaName]).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      `"#/components/schemas/${schemaName}"`,
    );
  });

  return JSON.parse(componentsAsString);
};
