import { useState } from 'react';
import { BaseNode } from './BaseNode';

export const TransformNode = ({ id, data }) => {
  console.log('🟡 Rendering TransformNode', id);
  const [mode, setMode] = useState(data?.mode || 'uppercase');

  const modeSelectId = `${id}-mode`;

  return (
    <BaseNode
      id={id}
      title="Transform"
      inputs={[{ id: `${id}-input` }]}
      outputs={[{ id: `${id}-output` }]}
    >
      <div>
        <div className="mb-3">
          <label htmlFor={modeSelectId} className="form-label mb-1">
            Mode
          </label>
          <select id={modeSelectId} className="form-select form-select-sm" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="uppercase">uppercase</option>
            <option value="lowercase">lowercase</option>
            <option value="trim">trim</option>
          </select>
        </div>
      </div>
    </BaseNode>
  );
};

