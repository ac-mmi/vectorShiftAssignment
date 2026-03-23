// draggableNode.js
import './styles/draggableNode.css';

export const DraggableNode = ({ type, label }) => {
    const iconClassByType = {
      customInput: 'bi-box-arrow-in-left',
      customOutput: 'bi-box-arrow-in-right',
      llm: 'bi-cpu',
      text: 'bi-fonts',
      constText: 'bi-clipboard-data',
      concat: 'bi-diagram-2',
      transform: 'bi-sliders',
      if: 'bi-diagram-3',
      split: 'bi-share',
    };

    const iconClass = iconClassByType[type] || 'bi-diagram-3';

    const onDragStart = (event, nodeType) => {
      const appData = { nodeType }
      event.target.style.cursor = 'grabbing';
      event.dataTransfer.setData('application/reactflow', JSON.stringify(appData));
      event.dataTransfer.effectAllowed = 'move';
    };
  
    return (
      <div
        className={`draggable-node ${type}`}
        onDragStart={(event) => onDragStart(event, type)}
        onDragEnd={(event) => (event.target.style.cursor = 'grab')}
        draggable
      >
          <i className={`bi ${iconClass} draggable-node__icon draggable-node__icon--${type}`} />
          <span className="draggable-node__label">{label}</span>
      </div>
    );
  };
  