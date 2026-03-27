// textNode.js

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BaseNode } from './BaseNode';
import { useStore } from '../store';
import { useUpdateNodeInternals } from 'reactflow';
import { parseVariableTokens, resolveInputName } from '../utils/variableHelpers';
import { syncVariableEdgesForTextNode } from '../utils/syncTextNodeVariableEdges';

export const TextNode = ({ id, data }) => {
  console.log('🟡 Rendering TextNode', id);
  const [currText, setCurrText] = useState(data?.text || '{{input}}');
  // Allow users to resize the Text node manually (width/height) via drag handle.
  const [manualWidth, setManualWidth] = useState(250);
  const [fixedHeight, setFixedHeight] = useState(null); // null => "auto" height (driven by textarea content)
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const updateNodeField = useStore((state) => state.updateNodeField);

  const textareaId = `${id}-text`;
  const genericInputHandleId = `${id}-input`;
  const syncVersionRef = useRef(0);
  const updateNodeInternals = useUpdateNodeInternals();
  const textareaRef = useRef(null);
  const autocompleteWrapRef = useRef(null);
  const [caretIndex, setCaretIndex] = useState(0);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const resizeHandleRef = useRef(null);
  const rafResizeRef = useRef(null);

  const handleTextChange = (e) => {
    const nextText = e.target.value;
    setCurrText(nextText);
    updateNodeField(id, 'text', nextText);
    setCaretIndex(e.target.selectionStart || 0);
  };

  const inputNames = useMemo(
    () =>
      nodes
        .filter((n) => n.type === 'customInput')
        .map((n) => resolveInputName(n))
        .filter(Boolean),
    [nodes]
  );

  const parsedTokenInfo = useMemo(() => parseVariableTokens(currText), [currText]);

  // Extract valid fully formed variables for sync.
  // Uses /{{(.*?)}}/g then validates JS-like identifier names.
  const variables = useMemo(() => {
    return parsedTokenInfo.validVariables;
  }, [parsedTokenInfo.validVariables]);
  console.log('🟡 Parsed Variables:', variables);

  const missing = useMemo(() => {
    return variables.filter((v) => !inputNames.includes(v));
  }, [variables, inputNames]);

  const missingSet = useMemo(() => new Set(missing), [missing]);

  const inputNodesByName = useMemo(() => {
    const map = new Map();
    nodes.forEach((node) => {
      if (node.type === 'customInput') {
        const resolvedInputName = resolveInputName(node);
        if (resolvedInputName) {
          map.set(resolvedInputName, node);
        }
      }
    });
    return map;
  }, [nodes]);

  const inputTextEdges = useMemo(() => {
    return edges.filter((edge) => {
      if (edge.target !== id) return false;
      const sourceNode = nodes.find((n) => n.id === edge.source);
      return sourceNode?.type === 'customInput';
    });
  }, [edges, id, nodes]);

  // Edge -> variable awareness only (non-intrusive; no textarea mutation).
  const connectedVariables = useMemo(() => {
    const vars = [];
    inputTextEdges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const resolvedInputName = resolveInputName(sourceNode);
      if (resolvedInputName && !vars.includes(resolvedInputName)) {
        vars.push(resolvedInputName);
      }
    });
    return vars;
  }, [inputTextEdges, nodes]);

  const manualGenericEdges = useMemo(
    () =>
      inputTextEdges.filter(
        (edge) => edge.targetHandle === genericInputHandleId && edge.data?.type === 'manual'
      ),
    [genericInputHandleId, inputTextEdges]
  );

  const unusedManualConnections = useMemo(() => {
    const names = [];
    manualGenericEdges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const resolved = resolveInputName(sourceNode);
      if (resolved && !variables.includes(resolved) && !names.includes(resolved)) {
        names.push(resolved);
      }
    });
    return names;
  }, [manualGenericEdges, nodes, variables]);

  const removeVariableFromText = useCallback(
    (variableName) => {
      const escaped = variableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\{\\{\\s*${escaped}\\s*\\}\\}\\s*`, 'g');
      const nextText = currText.replace(regex, ' ').replace(/\s{2,}/g, ' ').trim();
      setCurrText(nextText);
      updateNodeField(id, 'text', nextText);
    },
    [currText, id, updateNodeField]
  );

  const removeAllMissingVariables = useCallback(() => {
    let nextText = currText;
    missing.forEach((variableName) => {
      const escaped = variableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\{\\{\\s*${escaped}\\s*\\}\\}\\s*`, 'g');
      nextText = nextText.replace(regex, ' ');
    });
    nextText = nextText.replace(/\s{2,}/g, ' ').trim();
    setCurrText(nextText);
    updateNodeField(id, 'text', nextText);
  }, [currText, id, missing, updateNodeField]);

  const syncEdges = useCallback(() => {
    syncVariableEdgesForTextNode(id, useStore.getState);
  }, [id]);

  // Order: parse variables -> render handles -> update internals -> wait -> sync edges
  useEffect(() => {
    syncVersionRef.current += 1;
    const currentVersion = syncVersionRef.current;

    console.log('⚙️ Updating node internals for:', id);
    updateNodeInternals(id);

    const timer = setTimeout(() => {
      if (currentVersion !== syncVersionRef.current) return;
      syncEdges();
    }, 50);

    return () => clearTimeout(timer);
  }, [id, syncEdges, updateNodeInternals, variables]);

  // Autocomplete suggestions are shown when user is inside an open "{{...".
  const autocompleteQuery = useMemo(() => {
    const beforeCaret = currText.slice(0, caretIndex);
    const openIndex = beforeCaret.lastIndexOf('{{');
    if (openIndex < 0) return null;

    const maybeToken = beforeCaret.slice(openIndex + 2);
    // If current token already closed, do not suggest.
    if (maybeToken.includes('}}')) return null;

    return {
      openIndex,
      query: maybeToken.trim(),
    };
  }, [caretIndex, currText]);

  const suggestions = useMemo(() => {
    if (!autocompleteQuery) return [];
    const q = autocompleteQuery.query.toLowerCase();
    const candidates = inputNames.filter((name) =>
      name.toLowerCase().includes(q)
    );
    return candidates.slice(0, 8);
  }, [autocompleteQuery, inputNames]);

  useEffect(() => {
    const shouldOpen = Boolean(autocompleteQuery) && suggestions.length > 0;
    setAutocompleteOpen(shouldOpen);
    setActiveSuggestionIndex(0);
  }, [autocompleteQuery, suggestions.length]);

  useEffect(() => {
    const handleDocumentMouseDown = (event) => {
      if (!autocompleteWrapRef.current) return;
      if (!autocompleteWrapRef.current.contains(event.target)) {
        setAutocompleteOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown);
    };
  }, []);

  const applySuggestion = useCallback(
    (name) => {
      if (!autocompleteQuery) return;
      const before = currText.slice(0, autocompleteQuery.openIndex);
      const after = currText.slice(caretIndex);
      const inserted = `{{${name}}}`;
      const nextText = `${before}${inserted}${after}`;
      const nextCaret = before.length + inserted.length;

      setCurrText(nextText);
      updateNodeField(id, 'text', nextText);
      setAutocompleteOpen(false);

      requestAnimationFrame(() => {
        if (!textareaRef.current) return;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextCaret, nextCaret);
        setCaretIndex(nextCaret);
      });
    },
    [autocompleteQuery, caretIndex, currText, id, updateNodeField]
  );

  const handleTextareaKeyDown = (e) => {
    if (!autocompleteOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const selected = suggestions[activeSuggestionIndex];
      if (selected) applySuggestion(selected);
      return;
    }

    if (e.key === 'Escape') {
      setAutocompleteOpen(false);
    }
  };

  const inputHandles = useMemo(() => {
    // Always keep a generic input handle so users can manually connect first.
    const variableIds = variables
      .map((v) => `${id}-${v}`)
      .filter((handleId) => handleId !== genericInputHandleId);
    const ids = [genericInputHandleId, ...variableIds];
    const total = ids.length;

    return ids.map((handleId, index) => ({
      id: handleId,
      style: { top: `${((index + 1) * 100) / (total + 1)}%` },
    }));
  }, [genericInputHandleId, id, variables]);
  console.log('🟢 Rendering Handles for variables:', variables);

  useEffect(() => {
    setTimeout(() => {
      variables.forEach((v) => {
        const el = document.querySelector(`[data-handleid="${id}-${v}"]`);
        console.log(`🔍 Handle DOM check for ${v}:`, !!el);
      });
    }, 0);
  }, [id, variables]);

  // Auto-resizing textarea for better visibility as user types
  // (resize disabled; height follows scrollHeight so the full text stays visible)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [currText]);

  // Drag-resize handler for the Text node (width + height).
  const startResize = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      const handleEl = resizeHandleRef.current;
      const baseEl = handleEl ? handleEl.closest('.base-node') : null;
      if (!baseEl) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const startRect = baseEl.getBoundingClientRect();

      const startWidth = startRect.width;
      const startHeight = startRect.height;

      const minW = 220;
      const minH = 90;

      const onMove = (moveEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        const nextW = Math.max(minW, Math.round(startWidth + dx));
        const nextH = Math.max(minH, Math.round(startHeight + dy));

        // Avoid flooding state updates; coalesce via rAF.
        if (rafResizeRef.current) cancelAnimationFrame(rafResizeRef.current);
        rafResizeRef.current = requestAnimationFrame(() => {
          setManualWidth(nextW);
          setFixedHeight(nextH);
          updateNodeInternals(id);
        });
      };

      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        if (rafResizeRef.current) cancelAnimationFrame(rafResizeRef.current);
        rafResizeRef.current = null;
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [id, updateNodeInternals]
  );

  return (
    // Pass detected variables as dynamic input handles to BaseNode.
    <BaseNode
      id={id}
      title="Text"
      inputs={inputHandles}
      outputs={[{ id: `${id}-output` }]}
      nodeStyle={{
        width: manualWidth,
        ...(fixedHeight ? { height: fixedHeight } : null),
      }}
    >
        <div ref={autocompleteWrapRef}>
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
            onKeyDown={handleTextareaKeyDown}
            onClick={(e) => setCaretIndex(e.target.selectionStart || 0)}
            onKeyUp={(e) => setCaretIndex(e.target.selectionStart || 0)}
            style={{ width: '100%', resize: 'none', overflow: 'hidden' }}
          />
          {autocompleteOpen ? (
            <div
              style={{
                position: 'absolute',
                marginTop: 4,
                zIndex: 50,
                width: '100%',
                maxHeight: 180,
                overflowY: 'auto',
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.15)',
                borderRadius: 8,
                boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
              }}
            >
              {suggestions.map((name, idx) => (
                <button
                  key={name}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applySuggestion(name)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    background: idx === activeSuggestionIndex ? '#eef2ff' : '#fff',
                    padding: '8px 10px',
                    fontSize: 13,
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {variables.length > 0 || parsedTokenInfo.invalidVariables.length > 0 ? (
          <div style={{ marginTop: 8 }}>
            {variables.map((v) => {
              const isMissing = missingSet.has(v);
              if (!isMissing) return null;

              return <div key={v} style={{ color: 'red' }}>{v} ❌ missing input</div>;
            })}
            {parsedTokenInfo.invalidVariables.map((v) => (
              <div key={`invalid-${v}`} style={{ color: 'red' }}>
                {v} ❌ invalid name
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Resize grip: only affects TextNode sizing (width + height). */}
      <div
        ref={resizeHandleRef}
        onMouseDown={startResize}
        className="nodrag nopan"
        style={{
          position: 'absolute',
          right: 4,
          bottom: 4,
          width: 14,
          height: 14,
          cursor: 'nwse-resize',
          touchAction: 'none',
          borderRadius: 3,
          background: 'rgba(99, 102, 241, 0.35)',
          border: '1px solid rgba(99, 102, 241, 0.65)',
          zIndex: 30,
        }}
        title="Resize Text node"
        aria-label="Resize Text node"
      />
    </BaseNode>
  );
}
