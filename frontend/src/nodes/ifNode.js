import { useState } from 'react';
import { BaseNode } from './BaseNode';

export const IfNode = ({ id, data }) => {
  console.log('🟡 Rendering IfNode', id);
  const [compare, setCompare] = useState(data?.compare || 'equals');
  const [expected, setExpected] = useState(data?.expected || '{{value}}');

  const compareSelectId = `${id}-compare`;
  const expectedInputId = `${id}-expected`;

  return (
    <BaseNode
      id={id}
      title="If"
      inputs={[{ id: `${id}-condition` }]}
      outputs={[
        { id: `${id}-true` },
        { id: `${id}-false` },
      ]}
    >
      <div>
        <div className="mb-3">
          <label htmlFor={compareSelectId} className="form-label mb-1">
            Compare
          </label>
          <select
            id={compareSelectId}
            className="form-select form-select-sm"
            value={compare}
            onChange={(e) => setCompare(e.target.value)}
          >
            <option value="equals">equals</option>
            <option value="not_equals">not equals</option>
          </select>
        </div>

        <div>
          <label htmlFor={expectedInputId} className="form-label mb-0">
            Expected
          </label>
          <input
            id={expectedInputId}
            type="text"
            className="form-control form-control-sm"
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
          />
        </div>
      </div>
    </BaseNode>
  );
};

