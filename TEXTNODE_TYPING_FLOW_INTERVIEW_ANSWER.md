## Why does the TextNode UI update immediately when I type `{{input}}`?

This editor updates instantly because the `TextNode` input is a *controlled component* backed by React state (`currText`). That local state drives both:
1. what the textarea displays right away, and
2. the derived data (`variables`) that determines the dynamic handles/UX inside the node.

The backend sync / edge sync happens *after* the immediate render, via an effect + a short debounce guard.

---

## Full flow (typing → state update → UI change)

### 1) User typing triggers the Textarea `onChange`

In `frontend/src/nodes/textNode.js`, the textarea is wired like this:

- `value={currText}`
- `onChange={handleTextChange}`

So whenever you type a character, React calls `handleTextChange(e)` with the new textarea value in `e.target.value`.

Relevant snippet (for context):

```js
const handleTextChange = (e) => {
  const nextText = e.target.value;
  setCurrText(nextText);
  updateNodeField(id, 'text', nextText);
  setCaretIndex(e.target.selectionStart || 0);
};
```

Key point: `setCurrText(nextText)` is the *immediate* mechanism that makes the UI reflect your keystroke.

---

### 2) `handleTextChange` updates local React state (the immediate UI driver)

Inside `handleTextChange`:

1. `setCurrText(nextText)`
2. `setCaretIndex(...)` (used for autocomplete positioning)

Because `currText` is local `useState`, React schedules a re-render of `TextNode` right away (same user action, without waiting for the backend).

Then, during that render:

- the textarea shows the new content because `value={currText}` now contains `nextText`.

That’s the core reason the UI “feels immediate”.

---

### 3) The TextNode also updates the graph state in Zustand (for persistence + sync)

Still inside `handleTextChange`, the code also calls:

- `updateNodeField(id, 'text', nextText)`

`updateNodeField` is a Zustand store action in `frontend/src/store.js`. It updates `nodes` immutably at the top level:

- it maps over `get().nodes`
- it replaces the matching node’s `data` with `{ ...node.data, [fieldName]: fieldValue }`
- it returns a new `nodes` array to Zustand via `set({ nodes: ... })`

So the store change:

- keeps the node text consistent with the global graph model (so other components can rely on it),
- and allows edge synchronization logic that depends on store state to eventually run.

Even though the *local* `currText` already updates the textarea immediately, updating the store ensures the rest of the editor (handles/edges/nodes list) stays consistent and serializable.

---

### 4) Render recomputes derived `variables` from the new `currText`

During the re-render triggered by `setCurrText`, `TextNode` recomputes multiple `useMemo` blocks that depend on `currText`.

Most importantly:

- `parsedTokenInfo` extracts fully-formed tokens using regex `/\{\{(.*?)\}\}/g`
- it validates the inner token against an identifier-like regex: `/^[A-Za-z_$][A-Za-z0-9_$]*$/`
- it separates valid vs invalid variables

Then:

- `variables` is derived from `parsedTokenInfo.validVariables`
- `missing` is derived from `variables` and `inputNames` (names of existing `customInput` nodes)

Because these are computed from `currText`, the variable handles UI updates as soon as the text includes `{{...}}` patterns that pass validation.

---

### 5) Dynamic handles are recalculated and re-rendered (BaseNode + ReactFlow)

`TextNode` passes a computed `inputs` array into `BaseNode`:

- `inputHandles` is a `useMemo` that uses `variables`
- for each variable `v`, it creates a handle id like `${id}-${v}`

So after typing:

1. `currText` changes
2. `variables` changes
3. `inputHandles` changes
4. `BaseNode` receives a different `inputs` list
5. `BaseNode` re-renders its `<Handle />` components for each handle id

Inside `BaseNode` (`frontend/src/nodes/BaseNode.js`), inputs are rendered like:

- `inputs.map((input) => <Handle type="target" position={Left} id={input.id} ... />)`

This is why the handle dots appear/disappear in direct response to typing.

---

### 6) `useEffect` updates ReactFlow internal “handle geometry” and syncs edges (slightly later)

ReactFlow often needs a notification when node internals (like handles) change. In this code, that happens in a `useEffect`:

- dependency includes `variables`
- it calls `updateNodeInternals(id)` so ReactFlow recalculates handle positions/metadata
- then it schedules `syncEdges()` after a short `setTimeout(..., 50)`

There is also a debounce/race guard:

- `syncVersionRef.current` is incremented each time
- the timeout checks `currentVersion !== syncVersionRef.current` and bails if the user typed again

So:

- **immediate UI** comes from React re-render + controlled textarea + recomputed `inputs`.
- **edge synchronization** happens asynchronously but correctly a moment later, without being stale.

---

### 7) Autoresize is another “immediate” UI effect driven by `currText`

There’s also an effect that runs whenever `currText` changes:

- it sets `textareaRef.current.style.height = 'auto'`
- then sets it to `scrollHeight`

So the node grows vertically as the content changes (or at least stays visually consistent), triggered by the same local state update.

---

## Summary answer (what you’d say in an interview)

When I type in the TextNode textarea, the textarea is controlled by React state (`currText`). The `onChange` handler sets `currText` immediately, which causes React to re-render `TextNode` right away. That re-render recomputes the parsed `{{...}}` variables via `useMemo`, which changes the `inputs` list passed to `BaseNode`. `BaseNode` then re-renders the ReactFlow `Handle` components for those variable ids, so the handle dots appear/disappear instantly. In parallel, the handler updates the Zustand store (`updateNodeField`) to keep the global graph model consistent. Separately, a `useEffect` runs when `variables` change to call `updateNodeInternals` and then (debounced) sync edges, but that’s downstream—after the immediate UI feedback is already in place.

