/**
 * Shared parsing / naming logic for Input ↔ Text variable edges.
 * Keep in sync with TextNode template behavior.
 */

export function fallbackFromId(nodeId) {
  return String(nodeId || '').replace('customInput-', 'input_');
}

export function resolveInputName(node) {
  return String(node?.data?.inputName || '').trim() || fallbackFromId(node?.id);
}

export function parseVariableTokens(text) {
  const s = String(text ?? '');
  const regex = /\{\{(.*?)\}\}/g;
  const matches = [...s.matchAll(regex)];
  const validIdentifier = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
  const seenValid = new Set();
  const seenInvalid = new Set();
  const validVariables = [];
  const invalidVariables = [];

  for (const match of matches) {
    const candidate = String(match[1] || '').trim();
    if (validIdentifier.test(candidate)) {
      if (!seenValid.has(candidate)) {
        seenValid.add(candidate);
        validVariables.push(candidate);
      }
    } else if (candidate && !seenInvalid.has(candidate)) {
      seenInvalid.add(candidate);
      invalidVariables.push(candidate);
    }
  }

  return { validVariables, invalidVariables };
}

export function parseValidVariablesFromText(text) {
  return parseVariableTokens(text).validVariables;
}
