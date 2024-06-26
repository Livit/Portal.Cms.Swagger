import React, { useCallback } from 'react';
import { ElementButton } from '@payloadcms/richtext-slate';
import { Transforms } from 'slate';
import { useSlate, ReactEditor } from 'slate-react';

const baseClass = 'rich-text-hr-button';

const insertButton = editor => {
  const text = { text: ' ' };
  const button = {
    type: 'hr',
    children: [text],
  };

  const nodes = [button, { children: [{ text: '' }] }];

  if (editor.blurSelection) {
    Transforms.select(editor, editor.blurSelection);
  }

  Transforms.insertNodes(editor, nodes);
  ReactEditor.focus(editor);
};

const ToolbarButton: React.FC<{ path: string }> = () => {
  const editor = useSlate();

  const handleAddHR = useCallback(() => {
    insertButton(editor);
  }, [editor]);

  return (
    <ElementButton className={baseClass} format="hr" onClick={handleAddHR}>
      —
    </ElementButton>
  );
};

export default ToolbarButton;
