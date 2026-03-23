import { Handle, Position } from 'reactflow';
import '../styles/baseNode.css';
import { useStore } from '../store';

export const BaseNode = ({ id, title, inputs = [], outputs = [], children }) => {
  const deleteNode = useStore((state) => state.deleteNode);
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
    Input: 'Source',
    Output: 'Sink',
    LLM: 'Processor',
    Text: 'Template',
    'Const Text': 'Constant',
    Concat: 'Combine',
    Transform: 'Modify',
    If: 'Branch',
    Split: 'Divide',
  };

  const iconClass = iconClassByTitle[normalizedTitle] || 'bi-diagram-3';
  const subtitle = subtitleByTitle[normalizedTitle] || '';

  const iconThemeByTitle = {
    Input: { backgroundColor: '#0d6efd', color: '#fff' }, // blue
    Output: { backgroundColor: '#198754', color: '#fff' }, // green
    LLM: { backgroundColor: '#6f42c1', color: '#fff' }, // purple
    Text: { backgroundColor: '#fd7e14', color: '#fff' }, // orange
    'Const Text': { backgroundColor: '#0dcaf0', color: '#001a22' }, // cyan
    Concat: { backgroundColor: '#6610f2', color: '#fff' }, // indigo
    Transform: { backgroundColor: '#d63384', color: '#fff' }, // pink
    If: { backgroundColor: '#ffc107', color: '#3a2d00' }, // yellow
    Split: { backgroundColor: '#20c997', color: '#001a22' }, // teal
  };

  const iconTheme = iconThemeByTitle[normalizedTitle] || { backgroundColor: '#6c757d', color: '#fff' };
  const rootStyle = {
    borderColor: iconTheme.backgroundColor,
  };

  return (
    <div className="base-node d-flex flex-column" style={rootStyle}>
      <div className="base-node__actions">
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
        <div className="base-node__icon-wrap">
          <i
            className={`bi ${iconClass} base-node__icon`}
            style={{ backgroundColor: iconTheme.backgroundColor, color: iconTheme.color }}
          />
        </div>
        <div className="base-node__title-text">
          <div className="base-node__title">{title}</div>
          {subtitle ? <div className="base-node__subtitle">{subtitle}</div> : null}
        </div>
      </div>

      <div>{children}</div>

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
