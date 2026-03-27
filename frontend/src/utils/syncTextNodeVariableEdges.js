import { connectionAlreadyExists } from './edgeValidation';
import { parseValidVariablesFromText, resolveInputName } from './variableHelpers';

function hasVariableEdge(allEdges, textNodeId, variableName) {
  return allEdges.some(
    (edge) =>
      edge.target === textNodeId &&
      edge.data?.type === 'variable' &&
      edge.data?.createdBy === textNodeId &&
      edge.data?.variableName === variableName
  );
}

/**
 * Reconciles variable-type Input→Text edges for one Text node from the latest graph.
 * Call with `useStore.getState` (Zustand get) so it works from the store after Input
 * renames without relying on TextNode's local state or effects.
 */
export function syncVariableEdgesForTextNode(textNodeId, get) {
  const latestNodes = get().nodes;
  const textNode = latestNodes.find((n) => n.id === textNodeId && n.type === 'text');
  if (!textNode) return;

  const id = textNodeId;
  const genericInputHandleId = `${id}-input`;
  const text = textNode.data?.text ?? '';
  const variables = parseValidVariablesFromText(text);
  const variableHandleIds = variables
    .map((v) => `${id}-${v}`)
    .filter((handleId) => handleId !== genericInputHandleId);

  const latestEdges = get().edges;

  const latestInputByName = new Map();
  latestNodes.forEach((node) => {
    if (node.type !== 'customInput') return;
    const resolved = resolveInputName(node);
    if (resolved) latestInputByName.set(resolved, node);
  });

  const desiredConnections = [];
  variables.forEach((variableName) => {
    const handleId = `${id}-${variableName}`;
    const handleExists =
      variableHandleIds.includes(handleId) || handleId === genericInputHandleId;
    if (!handleExists) return;

    const inputNode = latestInputByName.get(variableName);
    if (!inputNode) return;

    desiredConnections.push({
      source: inputNode.id,
      sourceHandle: `${inputNode.id}-value`,
      target: id,
      targetHandle: handleId,
      data: {
        type: 'variable',
        createdBy: id,
        variableName,
      },
    });
  });

  const existingInputTextEdges = latestEdges.filter((edge) => {
    if (edge.target !== id) return false;
    const sourceNode = latestNodes.find((n) => n.id === edge.source);
    return sourceNode?.type === 'customInput';
  });

  const existingByKey = new Map(
    existingInputTextEdges.map((edge) => [
      `${edge.source}|${edge.sourceHandle}|${edge.targetHandle}`,
      edge,
    ])
  );

  const desiredKeys = new Set(
    desiredConnections.map((c) => `${c.source}|${c.sourceHandle}|${c.targetHandle}`)
  );

  desiredConnections.forEach((connection) => {
    const key = `${connection.source}|${connection.sourceHandle}|${connection.targetHandle}`;
    const variableEdgeAlreadyExists = hasVariableEdge(
      get().edges,
      id,
      connection.data.variableName
    );
    if (!existingByKey.has(key) && !variableEdgeAlreadyExists) {
      if (!connectionAlreadyExists(get().edges, connection)) {
        get().onConnect(connection);
      }
    }
  });

  existingInputTextEdges.forEach((edge) => {
    const isVariableEdgeForThisText =
      edge.data?.type === 'variable' && edge.data?.createdBy === id;
    if (!isVariableEdgeForThisText) return;

    const key = `${edge.source}|${edge.sourceHandle}|${edge.targetHandle}`;
    if (!desiredKeys.has(key)) {
      const latestStillExists = get().edges.some((e) => e.id === edge.id);
      if (latestStillExists) {
        get().deleteEdge(edge.id);
      }
    }
  });

  const edgesAfter = [...get().edges];
  edgesAfter.forEach((edge) => {
    if (edge.target !== id || edge.targetHandle !== genericInputHandleId) return;
    const hasSpecificForSource = desiredConnections.some((c) => c.source === edge.source);
    if (hasSpecificForSource) {
      const stillExists = get().edges.some((e) => e.id === edge.id);
      if (stillExists) {
        get().deleteEdge(edge.id);
      }
    }
  });
}

/**
 * After an Input's `inputName` changes, re-run variable edge reconciliation for every
 * Text node so edges are both removed (stale) and created (name matches template again).
 */
export function syncVariableEdgesForAllTextNodes(get) {
  const textNodes = get().nodes.filter((n) => n.type === 'text');
  for (const n of textNodes) {
    syncVariableEdgesForTextNode(n.id, get);
  }
}
