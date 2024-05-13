import { buildConfig, Config } from 'payload/config';

const config = {
  collections: [
    {
      slug: 'pages',
      access: {
        read: () => true,
        create: () => true,
        update: () => true,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          custom: { description: 'The title of this page' },
        },
        {
          type: 'group',
          name: 'meta',
          interfaceName: 'SharedMeta',
          fields: [
            {
              name: 'title',
              type: 'text',
            },
            {
              name: 'description',
              type: 'text',
            },
          ],
        },
      ],
      custom: { externalLink: 'https://foo.bar' },
    },
  ],
  globals: [
    {
      slug: 'my-global',
      fields: [
        {
          name: 'title',
          type: 'text',
          custom: { description: 'The title of my global' },
        },
        {
          type: 'group',
          name: 'meta',
          interfaceName: 'SharedMeta',
          fields: [
            {
              name: 'title',
              type: 'text',
            },
            {
              name: 'description',
              type: 'text',
            },
          ],
        },
      ],
      custom: { foo: 'bar' },
    },
  ],
} as unknown as Config;

export default buildConfig(config);
