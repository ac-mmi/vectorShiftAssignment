import { Handle, Position } from 'reactflow';
import '../styles/baseNode.css';
import { useStore } from '../store';

export const BaseNode = ({ id, title, inputs = [], outputs = [], children, nodeStyle }) => {
  const deleteNode = useStore((state) => state.deleteNode);
  const addNode = useStore((state) => state.addNode);
  const getNodeID = useStore((state) => state.getNodeID);
  const nodes = useStore((state) => state.nodes);
  const normalizedTitle = String(title || '').trim();
  const iconClassByTitle = {
    Input: 'bi-box-arrow-in-left',
    Output: 'bi-box-arrow-in-right',
    LLM: 'bi-cpu',
    Text: 'bi-fonts',
    'Const Text': 'bi-clipboard-data',
    Concat: 'bi-diagram-2',
    Transform: 'bi-sliders',
    If: 'bi-diagram-3',
    Split: 'bi-share',
  };

  const subtitleByTitle = {
    Input: 'External data source input',
    Output: 'Final workflow output target',
    LLM: 'Language model processing node',
    Text: 'Prompt template with variables',
    'Const Text': 'Static text value producer',
    Concat: 'Combine multiple text inputs',
    Transform: 'Apply text transform operation',
    If: 'Conditional branch decision node',
    Split: 'Split input into multiple parts',
  };

  const iconClass = iconClassByTitle[normalizedTitle] || 'bi-diagram-3';
  const subtitle = subtitleByTitle[normalizedTitle] || '';

  const iconThemeByTitle = {
    Input: { color: '#3700FF' },   // primary purple
    LLM: { color: '#FF006A' },     // deeper purple
    Text: { color: '#a855f7' },    // lighter purple
    'Const Text': { color: '#c084fc' },
  
    Concat: { color: '#9333ea' },
    Transform: { color: '#7e22ce' },
    If: { color: '#6d28d9' },
    Split: { color: '#5b21b6' },
  
    Output: { color: '#50C9DE' },  // ONLY pink (end node)
  };

  const iconTheme = iconThemeByTitle[normalizedTitle] || { color: '#6c757d'};
  const handleAddNode = (event) => {
    event.stopPropagation();

    const currentNode = nodes.find((node) => node.id === id);
    if (!currentNode) return;

    const nodeType = currentNode.type;
    const newNodeId = getNodeID(nodeType);
    const newNode = {
      id: newNodeId,
      type: nodeType,
      position: {
        x: (currentNode.position?.x || 0) + 40,
        y: (currentNode.position?.y || 0) + 40,
      },
      data: {
        ...(currentNode.data || {}),
        id: newNodeId,
        nodeType,
      },
      selected: false,
      dragging: false,
    };

    addNode(newNode);
  };

  return (
    <div
      className="base-node d-flex flex-column"
      tabIndex={0}
      onMouseDown={(event) => {
        // Keep node focus in sync with click interactions for border highlight.
        event.currentTarget.focus();
      }}
      style={nodeStyle}
    >
      <div className="base-node__actions">
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={handleAddNode}
          title="Add node"
          aria-label="Add node"
        >
          <i className="bi bi-plus-lg" />
        </button>
        <button
          type="button"
          className="btn btn-sm btn-danger"
          onClick={(event) => {
            event.stopPropagation();
            deleteNode(id);
          }}
        >
          <i className="bi bi-trash-fill" />
        </button>
      </div>

      {inputs.map((input) => (
        <Handle
          key={input.id}
          type="target"
          position={Position.Left}
          id={input.id}
          style={input.style}
        />
      ))}

      <div className="base-node__header d-flex justify-content-between align-items-start">
  
        <div className="base-node__title-text">
          <div className="base-node__title"><i
            className={`bi ${iconClass} base-node__icon`}
            style={{ color: iconTheme.color }}
          /> {title}</div>
          {subtitle ? <div className="base-node__subtitle">{subtitle}</div> : null}
        </div>
      </div>

      <div className="base-node__content">{children}</div>

      {outputs.map((output) => (
        <Handle
          key={output.id}
          type="source"
          position={Position.Right}
          id={output.id}
          style={output.style}
        />
      ))}
    </div>
  );
};
