import { useState } from 'react';
import { BaseNode } from './BaseNode';

export const ConstTextNode = ({ id, data }) => {
  console.log('🟡 Rendering ConstTextNode', id);
  const [value, setValue] = useState(data?.value || '{{output}}');

  const textareaId = `${id}-constText`;

  return (
    <BaseNode
      id={id}
      title="Const Text"
      inputs={[]}
      outputs={[{ id: `${id}-output` }]}
    >
      <div>
        <div>
          <label htmlFor={textareaId} className="form-label mb-0">
            Value
          </label>
          <textarea
            id={textareaId}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="form-control form-control-sm"
            style={{ width: '100%', resize: 'none' }}
          />
        </div>
      </div>
    </BaseNode>
  );
};

