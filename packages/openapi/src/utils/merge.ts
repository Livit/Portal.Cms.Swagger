import { DeepPartial, NonEmptyArray } from './types';
import deepmerge, { ArrayMergeOptions } from 'deepmerge';

const combineMerge = (target: any[], source: any[], options: ArrayMergeOptions) => {
  const destination = target.slice();
  source.forEach((item: any, index: number) => {
    if (typeof destination[index] === 'undefined') {
      destination[index] = options.cloneUnlessOtherwiseSpecified(item, options);
    } else if (options.isMergeableObject(item)) {
      destination[index] = merge(target[index], item, options);
    } else if (target.indexOf(item) === -1) {
      destination.push(item);
    }
  });
  return destination;
};

export const merge = <T extends object>(...args: NonEmptyArray<DeepPartial<T>>): T => {
  console;
  return deepmerge.all([...args], {
    arrayMerge: combineMerge,
  }) as T;
};
