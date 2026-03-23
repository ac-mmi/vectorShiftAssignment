// llmNode.js

import { BaseNode } from './BaseNode';

export const LLMNode = ({ id, data }) => {
  console.log('🟡 Rendering LLMNode', id);

  return (
    <BaseNode
      id={id}
      title="LLM"
      inputs={[
        { id: `${id}-system`, style: { top: `${100 / 3}%` } },
        { id: `${id}-prompt`, style: { top: `${200 / 3}%` } },
      ]}
      outputs={[{ id: `${id}-response` }]}
    >
      <div>
        <span>This is a LLM.</span>
      </div>
    </BaseNode>
  );
}
