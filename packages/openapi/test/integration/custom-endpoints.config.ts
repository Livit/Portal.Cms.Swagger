import { buildConfig, Config } from 'payload/config';
import { defineEndpoint } from '../../src';

const config = {
  collections: [
    {
      slug: 'pages',
      fields: [
        {
          name: 'title',
          type: 'text',
          custom: { description: 'The title of this page' },
        },
      ],
      endpoints: [
        defineEndpoint({
          operationId: 'get_echo',
          summary: 'echo',
          description: 'echoes the value',
          path: '/echo/:value',
          method: 'get',
          responseSchema: {
            schema: { type: 'string' },
          },
          handler: (req, res) => {
            const { value } = req.params;
            res.json(value);
          },
        }),
        {
          path: '/hidden',
          method: 'get',
          handler: () => {
            /* do nothing */
          },
          custom: { openapi: false },
        },
      ],
    },
  ],
} as unknown as Config;

export default buildConfig(config);
