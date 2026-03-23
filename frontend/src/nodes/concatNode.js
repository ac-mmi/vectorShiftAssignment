import { useState } from 'react';
import { BaseNode } from './BaseNode';

export const ConcatNode = ({ id, data }) => {
  console.log('🟡 Rendering ConcatNode', id);
  const [delimiter, setDelimiter] = useState(data?.delimiter || '');

  const delimiterInputId = `${id}-delimiter`;

  return (
    <BaseNode
      id={id}
      title="Concat"
      inputs={[
        { id: `${id}-a` },
        { id: `${id}-b` },
      ]}
      outputs={[{ id: `${id}-output` }]}
    >
      <div>
        <div className="mb-3">
          <label htmlFor={delimiterInputId} className="form-label mb-1">
            Delimiter
          </label>
          <input
            id={delimiterInputId}
            type="text"
            className="form-control form-control-sm"
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value)}
          />
        </div>
      </div>
    </BaseNode>
  );
};

