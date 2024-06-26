import { Payload } from 'payload';
import { Config } from 'payload/config';
import { loadSwagger } from './swagger';
import { Options } from './types';
import path from 'path';

/**
 * Payload swagger plugin
 */
export const swagger =
  (options?: Options) =>
  (config: Config): Config => ({
    ...config,
    admin: {
      ...config.admin,
      webpack: webpackConfig => {
        const modifiedConfig = {
          ...webpackConfig,
          resolve: {
            ...webpackConfig.resolve,
            fallback: {
              fs: false,
              ...webpackConfig.resolve?.fallback,
            },
            alias: {
              ...webpackConfig.resolve?.alias,
              ...['./swagger', './openapi'].reduce(
                (acc, mockPath) => {
                  acc[path.resolve(__dirname, mockPath)] = path.resolve(__dirname, 'utils/dummy-module');
                  return acc;
                },
                {} as { [key: string]: string },
              ),
            },
          },
        } as any;

        if (config.admin?.webpack) {
          return config.admin.webpack(modifiedConfig);
        }
        return modifiedConfig;
      },
    },
    onInit: async (payload: Payload) => {
      await loadSwagger(payload, options);

      if (config.onInit) {
        return config.onInit(payload);
      }
    },
  });
