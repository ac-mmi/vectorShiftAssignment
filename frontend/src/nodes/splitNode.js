import { useState } from 'react';
import { BaseNode } from './BaseNode';

export const SplitNode = ({ id, data }) => {
  console.log('🟡 Rendering SplitNode', id);
  const [delimiter, setDelimiter] = useState(data?.delimiter || ',');

  const delimiterInputId = `${id}-delimiter`;

  return (
    <BaseNode
      id={id}
      title="Split"
      inputs={[{ id: `${id}-input` }]}
      outputs={[
        { id: `${id}-part1` },
        { id: `${id}-part2` },
        { id: `${id}-part3` },
      ]}
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

