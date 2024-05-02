import { Request, Response } from 'express';
import { openapiFilter } from './open-api-filter';

export const specsHandler = (document: any) => (req: Request, res: Response) => {
  const { filterOperations, debug } = req.query as unknown as { filterOperations: string | string[]; debug?: string };
  if (!filterOperations?.length) {
    return res.json(document);
  }

  const filterOperationsAsArray = Array.isArray(filterOperations)
    ? (JSON.parse(decodeURIComponent(JSON.stringify(filterOperations))) as string[])
    : decodeURIComponent(filterOperations).split(',');

  return res.json(openapiFilter(document, { filterOperations: filterOperationsAsArray, debug: debug === 'true' }));
};
