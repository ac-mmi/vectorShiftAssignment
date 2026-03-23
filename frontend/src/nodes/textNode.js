// textNode.js

import { useEffect, useMemo, useRef, useState } from 'react';
import { BaseNode } from './BaseNode';
import { useStore } from '../store';

export const TextNode = ({ id, data }) => {
  console.log('🟡 Rendering TextNode', id);
  const [currText, setCurrText] = useState(data?.text || '{{input}}');
  const nodes = useStore((state) => state.nodes);

  const textareaId = `${id}-text`;

  const handleTextChange = (e) => {
    setCurrText(e.target.value);
  };

  // Extract variables from the current text using {{variable}} syntax.
  // JS naming rules: first char [A-Za-z_$], then [A-Za-z0-9_$]*.
  const variables = useMemo(() => {
    // Allow whitespace inside {{ ... }} and extract only the identifier.
    const regex = /\{\{\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\}\}/g;
    const matches = [...currText.matchAll(regex)];
    const seen = new Set();
    const varsInOrder = [];

    for (const match of matches) {
      const v = match[1];
      if (!seen.has(v)) {
        seen.add(v);
        varsInOrder.push(v);
      }
    }

    return varsInOrder;
  }, [currText]);

  // Soft validation: highlights variables without matching inputs
  // Does not block user to maintain flexible pipeline creation
  const inputNames = useMemo(() => {
    return nodes
      .filter((n) => n.type === 'customInput')
      .map((n) => n.data?.inputName)
      .filter(Boolean);
  }, [nodes]);

  const missing = useMemo(() => {
    return variables.filter((v) => !inputNames.includes(v));
  }, [variables, inputNames]);

  const missingSet = useMemo(() => new Set(missing), [missing]);

  // Auto-resizing textarea for better visibility as user types
  // (resize disabled; height follows scrollHeight so the full text stays visible)
  const textareaRef = useRef(null);
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [currText]);

  return (
    // Pass detected variables as dynamic input handles to BaseNode.
    <BaseNode
      id={id}
      title="Text"
      inputs={variables.map((v) => ({ id: `${id}-${v}` }))}
      outputs={[{ id: `${id}-output` }]}
    >
      <div>
        <div>
          <label htmlFor={textareaId} className="form-label mb-0">
            Text
          </label>
          <textarea
            ref={textareaRef}
            id={textareaId}
            className="form-control form-control-sm"
            value={currText}
            onChange={handleTextChange}
            style={{ width: '100%', resize: 'none', overflow: 'hidden' }}
          />
        </div>
        {variables.length > 0 ? (
          <div style={{ marginTop: 8 }}>
            {variables.map((v) => {
              const isMissing = missingSet.has(v);
              return (
                <div
                  key={v}
                  style={{ color: isMissing ? 'red' : 'black' }}
                >
                  {v} {isMissing ? '❌ missing input' : '✅'}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </BaseNode>
  );
}
