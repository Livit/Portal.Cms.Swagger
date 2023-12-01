import { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload/types';
import { getLabels } from './get-label';
import { formatNames } from 'payload/utilities';

const getText = (collection: SanitizedCollectionConfig | SanitizedGlobalConfig, kind: 'singular' | 'plural'): string => {
  const labels = getLabels(collection, kind);
  if (typeof labels === 'object' && labels.openapi) return labels.openapi;
  return formatNames(collection.slug)[kind];
};

export const getSingularSchemaName = (collection: SanitizedCollectionConfig | SanitizedGlobalConfig): string =>
  getText(collection, 'singular');

export const getPluralSchemaName = (collection: SanitizedCollectionConfig | SanitizedGlobalConfig): string =>
  getText(collection, 'plural');
