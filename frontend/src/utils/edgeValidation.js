import { parseValidVariablesFromText, resolveInputName } from './variableHelpers';

/**
 * Drops variable-type Input→Text edges that are inconsistent after an Input rename
 * or after text/template changes (when invoked from the store).
 *
 * Rules for edges with data.type === 'variable' and data.createdBy === target (Text node):
 * - edge.data.variableName must equal resolveInputName(input)
 * - that variable must still appear in the Text node's template
 */
export function removeStaleInputToTextEdges(nodes, edges, inputNodeId) {
  const inputNode = nodes.find((n) => n.id === inputNodeId);
  if (!inputNode || inputNode.type !== 'customInput') {
    return edges;
  }

  const currentName = resolveInputName(inputNode);
  const removeIds = new Set();

  for (const edge of edges) {
    if (edge.source !== inputNodeId) continue;

    const textNode = nodes.find((n) => n.id === edge.target);
    if (!textNode || textNode.type !== 'text') continue;

    if (edge.data?.type !== 'variable') continue;
    if (edge.data?.createdBy !== edge.target) continue;

    const varName = edge.data?.variableName;
    if (typeof varName !== 'string') {
      removeIds.add(edge.id);
      continue;
    }

    if (varName !== currentName) {
      removeIds.add(edge.id);
      continue;
    }

    const text = textNode.data?.text ?? '';
    const varsInText = parseValidVariablesFromText(text);
    if (!varsInText.includes(varName)) {
      removeIds.add(edge.id);
    }
  }

  if (removeIds.size === 0) return edges;
  return edges.filter((e) => !removeIds.has(e.id));
}

/**
 * True if an equivalent connection already exists (prevents duplicate addEdge).
 */
export function connectionAlreadyExists(edges, connection) {
  return edges.some(
    (e) =>
      e.source === connection.source &&
      e.target === connection.target &&
      e.sourceHandle === connection.sourceHandle &&
      e.targetHandle === connection.targetHandle
  );
}
