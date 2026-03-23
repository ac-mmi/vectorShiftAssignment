// inputNode.js

import { useEffect, useState } from 'react';
import { BaseNode } from './BaseNode';
import { useStore } from '../store';

export const InputNode = ({ id, data }) => {
  console.log('🟡 Rendering InputNode', id);
  const [currName, setCurrName] = useState(data?.inputName || id.replace('customInput-', 'input_'));
  const [inputType, setInputType] = useState(data.inputType || 'Text');
  const updateNodeField = useStore((state) => state.updateNodeField);

  const nameInputId = `${id}-inputName`;
  const typeSelectId = `${id}-inputType`;

  const handleNameChange = (e) => {
    const newValue = e.target.value;
    setCurrName(newValue);
    updateNodeField(id, 'inputName', newValue);
  };

  const handleTypeChange = (e) => {
    setInputType(e.target.value);
  };

  // Ensure the initial derived name is also reflected in Zustand for validation to work.
  useEffect(() => {
    updateNodeField(id, 'inputName', currName);
  }, [id, currName, updateNodeField]);

  return (
    <BaseNode
      id={id}
      title="Input"
      inputs={[]}
      outputs={[{ id: `${id}-value` }]}
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
            value={inputType}
            onChange={handleTypeChange}
          >
            <option value="Text">Text</option>
            <option value="File">File</option>
          </select>
        </div>
      </div>
    </BaseNode>
  );
}
