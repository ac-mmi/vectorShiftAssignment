# Edge Detection and Variable-Edge Sync: Current App Approach

This document explains how the current workflow editor synchronizes:

- Variables typed in the Text node (`{{variable_name}}`)
- Input-to-Text graph connections (edges)

It is based on the current implementation in:

- `frontend/src/nodes/textNode.js`
- `frontend/src/store.js`
- `frontend/src/ui.js`
- `frontend/src/edges/deletableEdge.js`

---

## 1) High-Level Architecture

### Core state

Global graph state is managed in Zustand (`frontend/src/store.js`):

- `nodes`: all node objects
- `edges`: all edge objects

Important actions:

- `onConnect(connection)`: adds an edge
- `deleteEdge(edgeId)`: removes one edge
- `deleteNode(nodeId)`: removes node + connected edges
- `clearAll()`: clears graph
- `updateNodeField(nodeId, fieldName, fieldValue)`: updates node data

### Text-node sync owner

All variable-edge synchronization logic lives inside `TextNode` (`frontend/src/nodes/textNode.js`).

### Edge rendering/deletion UX

Edges use a custom edge type (`deletable`) registered in `frontend/src/ui.js`.
The custom edge renderer (`frontend/src/edges/deletableEdge.js`) shows an inline `×` button at edge midpoint.

---

## 2) Source of Truth Model

Current effective source-of-truth behavior:

- Text variables are parsed from Text node content (debounced).
- Input node names are resolved from:
  1. `node.data.inputName`
  2. fallback from node id (`customInput-2` -> `input_2`)
- Edges are reconciled by computing **delta** between desired variable links and existing edges.

So the sync is not “rebuild all”; it is **incremental add/remove**.

---

## 3) Variable Detection Pipeline

In `TextNode`:

1. User types in textarea (`onChange`)
2. Local state `currText` updates immediately
3. Node data is persisted via `updateNodeField(id, 'text', nextText)`
4. A debounce (`250ms`) updates `debouncedText`
5. Variables are extracted from `debouncedText` using:
   - `/\{\{(.*?)\}\}/g`
   - then trimmed and validated with `/^[A-Za-z_$][A-Za-z0-9_$]*$/`
6. Duplicates are removed while preserving order

Important typing-safety property:

- Partial text like `{{input_` is ignored (no full `}}`, no valid token).
- Textarea content is not auto-modified by sync effects.

---

## 4) Input-Node Name Resolution

`inputNodesByName` map is built from all `customInput` nodes:

- key: resolved input name (`data.inputName` or id fallback)
- value: input node

Why fallback exists:

- Protects against timing/state sync edge cases where `inputName` may not yet be written.
- Allows matching `{{input_2}}` even if only id-derived naming exists.

---

## 5) Delta-Based Edge Synchronization (Critical Behavior)

This is the heart of the implementation in `TextNode`.

### Step A: Build desired connections from variables

For each parsed variable that matches an input node:

- `source = inputNode.id`
- `sourceHandle = ${inputNode.id}-value`
- `target = textNode.id`
- `targetHandle = ${textNode.id}-${variableName}`

### Step B: Build existing edge lookup

Filter existing edges to only Input->this Text node, then key by:

`source|sourceHandle|targetHandle`

### Step C: Compute and apply delta

- **toAdd**: desired connection key not found in existing lookup -> call `onConnect(...)`
- **toRemove**: existing variable-specific edge key not in desired keys -> call `deleteEdge(edge.id)`

This avoids the classic edge-loss bug (no mass reset).

---

## 6) Generic Input Handle Strategy

Text node always exposes:

- a generic target handle: `${textId}-input`
- variable-specific handles: `${textId}-${var}`

Why:

- User can manually connect to Text before typing variables.
- Once variable-specific edge exists for same source, generic edge is removed to avoid duplicate parallel links.

---

## 7) Edge -> Variable Awareness (Non-Intrusive)

The current implementation intentionally **does not auto-insert text** from manual edge connections.

Instead it provides awareness:

- Computes `connectedVariables` from existing Input->Text edges
- Displays lightweight “Connected: ...” information in Text node UI

This preserves typing flow and cursor position.

---

## 8) Validation and UX Rules Implemented

### Implemented

- Fully formed variable detection only
- Debounced background sync (250ms)
- Ignore non-matching variable names (no edge created)
- Prevent duplicate edges via key lookup
- Remove only stale edges, not all edges
- Multiple variable support (`{{a}} {{b}} {{c}}`)
- Backspace/retyping behavior (edge removed/re-added)
- Non-intrusive editing (no auto text overwrite)

### Also present in app

- Mid-edge delete button (`×`) for direct edge removal

---

## 9) Data Flow Example

Given:

- Input nodes named `input_1` and `input_2`
- Text content: `Write summary for {{input_1}} and {{input_2}}`

Flow:

1. Variables parsed -> `["input_1", "input_2"]`
2. Both found in `inputNodesByName`
3. Desired edges computed for both variable handles
4. Existing edges compared
5. Missing edges added only
6. If user removes `{{input_1}}`, only that edge is removed

---

## 10) Why This Is Stable

Stability comes from:

- Debounced sync loop (not every keystroke flushes graph operations)
- Keyed delta comparison (`desired` vs `existing`)
- Narrow scope (only Input->current Text edges touched)
- No text mutation from effects

This minimizes flicker, preserves existing valid links, and avoids racey full-resets.

---

## 11) Known Trade-offs / Notes

- `inputNames` validation list currently uses `data.inputName` only, while mapping uses fallback too.
  - This can show a temporary “missing” indicator if fallback name exists but `data.inputName` is absent.
- Current variable regex + identifier validation intentionally excludes invalid JS-like names.
- Manual edge connection does not auto-write prompt text by design (non-intrusive requirement).

---

## 12) Optional Future Enhancements

- Unify validation source with fallback-resolved names for perfectly consistent warning UI.
- Add visual distinction between:
  - variable exists
  - variable connected
- Expose debounce duration as a small config constant.
- Add unit tests for:
  - delta add/remove
  - duplicate prevention
  - backspace/retyping transitions

