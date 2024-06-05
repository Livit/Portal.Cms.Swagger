import convert from '@openapi-contrib/json-schema-to-openapi-schema';
import { SanitizedConfig } from 'payload/config';
import { RichTextField } from 'payload/types';
import { getCollectionIDFieldTypes } from 'payload/utilities';
import { stripEmptyRequired } from './entity-to-schema';
import { OpenAPIV3 } from 'openapi-types';

export const richTextSchemaName = 'RichText';
export const getRichTextSchemas = async (
  config: SanitizedConfig,
): Promise<{
  [key: string]: OpenAPIV3.SchemaObject;
}> => {
  const collectionIDFieldTypes = getCollectionIDFieldTypes({ config, defaultIDType: 'text' });
  const sampleRTField: RichTextField = {
    name: 'sampleRTField',
    type: 'richText',
  };

  const jsonSchema = config.editor?.outputSchema({
    collectionIDFieldTypes,
    config,
    field: sampleRTField,
    interfaceNameDefinitions: {} as never,
    isRequired: true,
  });

  if (!jsonSchema) {
    return {};
  }

  const schema = stripEmptyRequired(await convert(jsonSchema));
  return {
    [richTextSchemaName]: schema,
    [`${richTextSchemaName}Nullable`]: {
      ...schema,
      'nullable': true,
    },
  };
};
