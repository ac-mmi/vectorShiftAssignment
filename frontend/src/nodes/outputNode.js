// outputNode.js

import { useState } from 'react';
import { BaseNode } from './BaseNode';

export const OutputNode = ({ id, data }) => {
  console.log('🟡 Rendering OutputNode', id);
  const [currName, setCurrName] = useState(data?.outputName || id.replace('customOutput-', 'output_'));
  const [outputType, setOutputType] = useState(data.outputType || 'Text');

  const nameInputId = `${id}-outputName`;
  const typeSelectId = `${id}-outputType`;

  const handleNameChange = (e) => {
    setCurrName(e.target.value);
  };

  const handleTypeChange = (e) => {
    setOutputType(e.target.value);
  };

  return (
    <BaseNode
      id={id}
      title="Output"
      inputs={[{ id: `${id}-value` }]}
      outputs={[]}
    >
      <div>
        <div className="mb-3">
          <label htmlFor={nameInputId} className="form-label mb-1">
            Name
          </label>
          <input
            id={nameInputId}
            type="text"
            className="form-control form-control-sm"
            value={currName}
            onChange={handleNameChange}
          />
        </div>

        <div>
          <label htmlFor={typeSelectId} className="form-label mb-0">
            Type
          </label>
          <select
            id={typeSelectId}
            className="form-select form-select-sm"
            value={outputType}
            onChange={handleTypeChange}
          >
            <option value="Text">Text</option>
            <option value="File">Image</option>
          </select>
        </div>
      </div>
    </BaseNode>
  );
}
