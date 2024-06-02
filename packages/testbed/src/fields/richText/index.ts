import { AdapterArguments, RichTextElement, RichTextLeaf, slateEditor } from '@payloadcms/richtext-slate';
import { RichTextField } from 'payload/dist/fields/config/types';
import deepMerge from '../../utilities/deepMerge';
import link from '../link';
import elements from './elements';
import leaves from './leaves';

type RichText = (
  overrides?: Partial<RichTextField>,
  additions?: {
    elements?: RichTextElement[];
    leaves?: RichTextLeaf[];
    upload?: boolean;
  },
) => RichTextField;

const richText: RichText = (
  overrides,
  additions = {
    elements: [],
    leaves: [],
    upload: true,
  },
) => {
  const richText = deepMerge<AdapterArguments, any>(
    {
      admin: {
        elements: [...elements, ...(additions.elements || [])],
        leaves: [...leaves, ...(additions.leaves || [])],
        ...(additions.upload && {
          upload: {
            collections: {
              media: {
                fields: [
                  {
                    type: 'richText',
                    name: 'caption',
                    label: 'Caption',
                  },
                  {
                    type: 'radio',
                    name: 'alignment',
                    label: 'Alignment',
                    options: [
                      {
                        label: 'Left',
                        value: 'left',
                      },
                      {
                        label: 'Center',
                        value: 'center',
                      },
                      {
                        label: 'Right',
                        value: 'right',
                      },
                    ],
                  },
                  {
                    name: 'enableLink',
                    type: 'checkbox',
                    label: 'Enable Link',
                  },
                  link({
                    appearances: false,
                    disableLabel: true,
                    overrides: {
                      admin: {
                        condition: (_, data) => Boolean(data?.enableLink),
                      },
                    },
                  }),
                ],
              },
            },
          },
        }),
      },
    },
    overrides,
  );

  return {
    name: 'richText',
    type: 'richText',
    editor: slateEditor(richText),
  };
};

export default richText;
