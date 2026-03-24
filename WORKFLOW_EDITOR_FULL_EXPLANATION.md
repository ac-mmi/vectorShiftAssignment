# Workflow Editor: Full Easy Explanation

This file explains your **current app behavior** in simple language:

- how nodes are created
- how edges are created
- where data is stored
- how Text node variable detection works
- how variable detection leads to edge creation

---

## 1) Big Picture

Your app is a visual workflow editor built with:

- **React** for UI
- **React Flow** for node/edge canvas
- **Zustand** for global graph state

Main flow:

1. User drags a node from toolbar
2. Node is added to graph (`nodes` array in Zustand)
3. User connects handles OR types variables in Text node
4. Edges are created/removed in graph (`edges` array in Zustand)

---

## 2) Main Files and Their Roles

### `frontend/src/App.js`

Top-level layout:

- `PipelineToolbar` (ribbon/menu)
- `PipelineUI` (canvas with nodes + edges)
- `SubmitButton` (bottom actions)

---

### `frontend/src/ui.js`

This is the **React Flow canvas controller**.

It:

- reads `nodes`, `edges` from Zustand
- registers all node components (`nodeTypes`)
- registers custom edge component (`edgeTypes` -> `deletable`)
- handles drag-drop node creation

Important:

- Node drop uses `getNodeID(type)` and `addNode(newNode)`
- Edges are connected through `onConnect` from store

---

### `frontend/src/store.js`

This is the **single source of graph state**.

State:

- `nodes: []`
- `edges: []`

Important actions:

- `addNode(node)` -> adds node
- `onConnect(connection)` -> adds edge
- `deleteEdge(edgeId)` -> removes one edge
- `deleteNode(nodeId)` -> removes node + connected edges
- `clearAll()` -> clears everything
- `updateNodeField(...)` -> updates node data fields

Edge metadata behavior in `onConnect`:

- If connection already contains `data.type`, it keeps it (e.g. variable edge)
- Else defaults to manual edge: `data.type = 'manual'`

---

### `frontend/src/nodes/BaseNode.js`

Reusable base UI for all node types.

It renders:

- left input handles
- right output handles
- header/icon/title/subtitle
- children content (inputs/selects/textarea)

Also has hover action buttons:

- plus button: adds another node of same type
- delete button: deletes node

---

### `frontend/src/nodes/inputNode.js`

Input node:

- stores editable `inputName`
- stores `inputType`
- output handle id: `${id}-value`

It writes `inputName` into store via `updateNodeField`, which is crucial for Text variable matching.

---

### `frontend/src/nodes/textNode.js`

This is where variable-to-edge logic lives.

It:

- tracks textarea text (`currText`)
- parses variables like `{{name}}`
- validates names (JS-style identifier rules)
- checks matching input nodes
- synchronizes edges with delta logic
- keeps generic input handle always available
- shows only warnings (missing/invalid)
- provides autocomplete when user types `{{`

Detailed Text node logic is explained below.

---

### `frontend/src/edges/deletableEdge.js`

Custom edge renderer.

Shows a small `×` button at edge midpoint.
Clicking it calls `deleteEdge(edgeId)` from store.

---

## 3) Where Data Is Stored

Everything important is in Zustand store (`useStore`):

- All nodes (position, type, data)
- All edges (source, target, handles, metadata/style)

Text node also has local UI state (`currText`) for fast typing, but it syncs text back to node data with:

- `updateNodeField(id, 'text', nextText)`

So final graph state still lives in store.

---

## 4) How Nodes Are Formed

When user drags from toolbar and drops on canvas (`ui.js`):

1. `type` is read from drag payload
2. `nodeID = getNodeID(type)` (ex: `text-1`, `customInput-2`)
3. `newNode` is created with:
   - `id`
   - `type`
   - `position`
   - `data: { id, nodeType }`
4. `addNode(newNode)` stores it

Later, each node component updates its own `data` (like input name, text, etc.).

---

## 5) How Edges Are Formed

Two ways:

### A) Manual user connection (drag from handle)

React Flow calls store `onConnect(connection)`.
Store adds edge with:

- type `deletable` (custom renderer)
- style / marker
- metadata default `data.type = 'manual'` (if no type already provided)

### B) System-created from Text variables

Text node sync effect builds connection objects and calls `state.onConnect(connection)` with:

- source input node
- target text node
- variable-specific target handle
- metadata:
  - `type: 'variable'`
  - `createdBy: textNodeId`
  - `variableName: ...`

---

## 6) Text Node Variable Detection -> Edge Creation (Step-by-Step)

This is the key part.

### Step 1: User types in textarea

`handleTextChange` runs:

- updates local `currText`
- syncs text to store (`updateNodeField`)
- updates caret index (for autocomplete)

### Step 2: Parse variables from text

Regex used:

- `/\{\{(.*?)\}\}/g`

Then each token is:

- trimmed
- validated with JS-style identifier pattern
- deduplicated

So only fully formed + valid variables are used.

### Step 3: Build input name map

Text node resolves input names from all `customInput` nodes using one helper:

- `resolveInputName(node)`

It tries:

1. `node.data.inputName.trim()`
2. fallback from id (`customInput-2` -> `input_2`)

### Step 4: Debounced sync with stale guard

Sync runs in `useEffect` with `setTimeout(250ms)` and `syncVersionRef` guard.

This prevents stale old timers from applying outdated edge changes.

### Step 5: Compute desired variable edges

For each detected variable with matching input node, desired edge is:

- source: input node id
- sourceHandle: `${inputId}-value`
- target: text node id
- targetHandle: `${textId}-${variable}`
- data metadata: variable edge ownership

### Step 6: Delta reconcile (no full reset)

Compare desired edges vs existing Input->thisText edges.

- **toAdd**: desired edge missing -> create it
- **toRemove**: existing variable edge (owned by this text node) not desired anymore -> delete it

Important safety:

- manual edges are not deleted by variable cleanup
- variable edges from other text nodes are not deleted

### Step 7: Keep generic manual handle

Text node always keeps:

- generic input handle `${textId}-input` (manual)
- plus variable handles `${textId}-${var}` (system)

So manual connecting is always available.

---

## 7) Current Warning UI Behavior in Text Node

Text node shows warnings only (no green success noise):

- `variable ❌ missing input` -> valid syntax but no matching input node name
- `token ❌ invalid name` -> inside `{{ }}` but invalid identifier

Autocomplete is shown when user is inside an open `{{...` token and suggestions exist.

---

## 8) Why This Approach Is Stable

- State centralized in Zustand
- Edge sync uses **delta**, not full rebuild
- Debounce + version guard avoids stale race updates
- Metadata separates manual vs variable edges
- Text is not auto-mutated by sync effects

This gives predictable behavior similar to professional workflow tools.

---

## 9) Quick Debug Checklist (If Something Fails)

If variable edge does not appear:

1. Check variable is fully formed: `{{name}}`
2. Check input node name matches exactly (`name`)
3. Check `inputName` exists in store
4. Wait debounce window (~250ms)
5. Ensure edge not blocked by stale/manual conflict

Useful console checks:

- `useStore.getState().nodes`
- `useStore.getState().edges`

---

## 10) Short Summary

- **Nodes** are created from toolbar drag-drop and stored in Zustand.
- **Edges** are created manually or automatically from text variables.
- **Text node** parses `{{variable}}` and computes desired edges.
- **Delta sync** adds/removes only what changed.
- **Metadata** keeps manual and variable edges safely separated.

