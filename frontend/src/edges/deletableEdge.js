import { BaseEdge, EdgeLabelRenderer, getBezierPath } from 'reactflow';
import { useStore } from '../store';
import '../styles/edge.css';

export const DeletableEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
}) => {
  const deleteEdge = useStore((state) => state.deleteEdge);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <button
          type="button"
          className="edge-delete-btn nodrag nopan"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
          onClick={(event) => {
            event.stopPropagation();
            deleteEdge(id);
          }}
          title="Delete connection"
          aria-label="Delete connection"
        >
          ×
        </button>
      </EdgeLabelRenderer>
    </>
  );
};

