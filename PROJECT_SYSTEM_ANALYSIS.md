# Frontend + Backend System Analysis

## 1) Project Overview

This is a visual pipeline builder with a React frontend and a FastAPI backend.

- The **frontend** lets users drag node types onto a canvas, connect them with edges, and (eventually) submit the pipeline.
- The **backend** is currently a thin API scaffold with a health endpoint and a placeholder parse endpoint.

At a high level, the app is intended to model a directed flow of data between processing nodes (Input, Text, LLM, Output), then validate/parse that graph server-side.

## 2) Frontend Analysis (`/frontend`)

### High-Level Structure

```text
frontend/
  src/
    App.js               # Composes toolbar + canvas + submit button
    toolbar.js           # Draggable palette of node types
    draggableNode.js     # Drag source behavior + tile UI
    ui.js                # React Flow canvas + drop logic
    store.js             # Zustand state for nodes/edges + graph actions
    submit.js            # Submit button UI (no API call yet)
    nodes/
      inputNode.js
      outputNode.js
      llmNode.js
      textNode.js
```

### Main Runtime Flow

1. `PipelineToolbar` renders draggable tiles (`Input`, `LLM`, `Output`, `Text`).
2. Dragging a tile sets `application/reactflow` payload with `{ nodeType }`.
3. Dropping on canvas in `PipelineUI`:
   - computes position via `reactFlowInstance.project(...)`
   - generates unique node ID via `store.getNodeID(type)`
   - creates and stores a new node in Zustand
4. React Flow renders node components via `nodeTypes` map.
5. Connecting handles creates edges through `store.onConnect`.

### Focus: `/src/nodes`

All node components use React Flow `Handle` objects to declare input/output ports.

#### `InputNode` (`inputNode.js`)

- **What it does**
  - Represents a pipeline entry point.
  - Captures a user-editable input name and input type.
- **UI rendered**
  - Title: `Input`
  - `Name` text input
  - `Type` select (`Text` or `File`)
  - One right-side **source** handle (`${id}-value`)
- **Props/logic**
  - Receives `id`, `data`.
  - Local state:
    - `currName` default: `data.inputName` or derived from ID (`input_...`)
    - `inputType` default: `data.inputType` or `Text`
  - Updates are local only (not synced back to store currently).

#### `OutputNode` (`outputNode.js`)

- **What it does**
  - Represents a pipeline sink/output target.
  - Captures output name and output type.
- **UI rendered**
  - Left-side **target** handle (`${id}-value`)
  - Title: `Output`
  - `Name` text input
  - `Type` select (`Text` or `Image` label, value currently `"File"`)
- **Props/logic**
  - Receives `id`, `data`.
  - Local state:
    - `currName` default: `data.outputName` or derived from ID (`output_...`)
    - `outputType` default: `data.outputType` or `Text`
  - Also local-only state (not persisted to global store).

#### `LLMNode` (`llmNode.js`)

- **What it does**
  - Represents an LLM processing stage.
  - Accepts two inputs and emits one output.
- **UI rendered**
  - Two left **target** handles:
    - `${id}-system`
    - `${id}-prompt`
  - Label text (`LLM`, `This is a LLM.`)
  - One right **source** handle (`${id}-response`)
- **Props/logic**
  - Receives `id`, `data` but currently does not use `data`.
  - No local state.

#### `TextNode` (`textNode.js`)

- **What it does**
  - Represents literal/interpolated text content in the pipeline.
- **UI rendered**
  - Title: `Text`
  - `Text` input (default `{{input}}`)
  - One right **source** handle (`${id}-output`)
- **Props/logic**
  - Receives `id`, `data`.
  - Local `currText` state from `data.text` or `{{input}}`.
  - Local-only update handler (`setCurrText`), no store sync.

### Shared Patterns Across Nodes

- Same React component signature (`({ id, data })`).
- Same outer card style repeated inline (`width`, `height`, `border`).
- Each node defines one or more `Handle` components.
- Input/output field state is handled via local `useState`.
- Node title + body sections follow similar structure.

### Repeated Code

- Repeated container styling in every node.
- Repeated name/type form patterns in `InputNode` and `OutputNode`.
- Similar default-value derivation from node IDs.
- Repeated handle setup syntax (type, position, id).

### Key Differences Between Nodes

- **I/O shape**:
  - Input: source only
  - Output: target only
  - LLM: 2 targets + 1 source
  - Text: source only (currently no input handle)
- **Statefulness**:
  - Input/Output/Text have local state
  - LLM is static
- **Semantics**:
  - Input/Output are boundary nodes
  - LLM/Text are transform/content nodes

## 3) Node System Understanding

### Conceptual Model

The graph is a directed node-edge model:

- **Node** = compute/content unit with typed ports (handles)
- **Edge** = directed connection from source handle to target handle
- **Graph state** = `{ nodes, edges }` in Zustand

### What Are Handles?

In React Flow, `Handle` is a connectable port on a node.

- `type="source"` means outgoing connector.
- `type="target"` means incoming connector.
- `id` (e.g., `${id}-prompt`) allows multiple distinct ports on one node.
- `position` controls where handle appears (`Left`, `Right`).

### How Connections (Edges) Work

- User drags from a source handle to a target handle.
- `onConnect(connection)` in store calls `addEdge(...)`.
- Added edge properties:
  - `type: 'smoothstep'`
  - `animated: true`
  - arrow marker on end

### React Flow Structure in This Project

- `PipelineUI` owns the `<ReactFlow>` instance and drag/drop orchestration.
- `nodeTypes` maps node type keys to React components:
  - `customInput`, `llm`, `customOutput`, `text`
- Canvas helpers enabled: `Background`, `Controls`, `MiniMap`.
- State source of truth is externalized into Zustand (`useStore`).

## 4) Abstraction Opportunities (Important)

### Common Structure (Abstractable)

- Node card shell:
  - width/height/border/layout
  - title region
  - content region
- Handle rendering pattern:
  - map of handle configs -> `<Handle />`
- Field rows:
  - labeled text/select controls with change handlers
- Data synchronization behavior:
  - initialize from `data`
  - persist edits to store

### Variable Parts (Node-Specific)

- Title text (`Input`, `Output`, `LLM`, `Text`)
- Handle list (count, side, IDs, offset positions)
- Body fields and field types
- Field defaults and validation rules
- Optional informational content (e.g., LLM description)

### Suggested `BaseNode` Design (Concept Only)

Use a configurable `BaseNode` component that receives:

- `title: string`
- `handles: Array<{ type, position, idSuffix, style? }>`
- `fields: Array<{ key, label, controlType, options?, defaultValue }>`
- `data`, `id`, and `onFieldChange`
- optional `children` slot for custom content

Then each specific node becomes a thin adapter that only supplies config:

- `InputNode`: source `value` + `name/type` fields
- `OutputNode`: target `value` + `name/type` fields
- `LLMNode`: targets `system/prompt`, source `response`, static text
- `TextNode`: text field + (future) dynamic target handles for variables

This removes duplication and centralizes styling, field behavior, and handle generation.

## 5) Backend Analysis (`/backend`)

### FastAPI Structure

- Single file: `backend/main.py`
- Constructs `app = FastAPI()`
- Two endpoints defined:

1. `GET /`
   - Returns `{"Ping": "Pong"}`
   - Health/check endpoint

2. `GET /pipelines/parse`
   - Signature expects `pipeline: str = Form(...)`
   - Returns `{"status": "parsed"}`

### What `/pipelines/parse` Currently Does

- It does **not** parse graph data yet.
- It does **not** validate nodes/edges.
- It does **not** compute node/edge counts or DAG validity.
- It only returns a static success response.

Note: using `Form(...)` with `GET` is atypical; parsing pipeline payload is more naturally a `POST` with JSON body.

## 6) Integration Flow (Frontend <-> Backend)

### Intended Data Flow

1. Frontend gathers current graph from store:
   - `nodes`
   - `edges`
2. Frontend submits payload to backend parse endpoint.
3. Backend validates/derives metadata:
   - node count
   - edge count
   - DAG (acyclic) status
4. Backend returns structured result; frontend displays outcome.

### Data That Should Be Passed

Recommended payload structure:

```json
{
  "nodes": [
    { "id": "text-1", "type": "text", "position": { "x": 100, "y": 120 }, "data": { "text": "{{input}}" } }
  ],
  "edges": [
    { "id": "e1", "source": "text-1", "sourceHandle": "text-1-output", "target": "llm-1", "targetHandle": "llm-1-prompt" }
  ]
}
```

Current code status:

- Frontend has no submit API call yet (`SubmitButton` is presentational only).
- Backend does not yet accept this JSON schema.

## 7) Implementation Plan

### Step 1: Node Abstraction

- Introduce `BaseNode` in `frontend/src/nodes/`.
- Move shared card layout + handle rendering + common field rendering there.
- Refactor existing node files into config-driven wrappers.
- Ensure each wrapper preserves existing handle IDs/types to avoid breaking edge behavior.

### Step 2: Styling

- Replace inline node styles with a shared style module/CSS classes.
- Standardize spacing, typography, and node dimensions.
- Ensure toolbar node tiles and canvas nodes look visually consistent.

### Step 3: Text Node Logic

- Parse `{{variable}}` tokens from text input.
- Auto-generate target handles per unique variable.
- Recompute node height/layout dynamically based on variable count.
- Keep stable handle IDs for consistent reconnection behavior.

### Step 4: Backend Integration

- Update submit flow to call backend with `{ nodes, edges }`.
- Implement backend parse endpoint with request model (Pydantic).
- Add graph analysis:
  - node/edge counts
  - DAG detection (cycle check)
- Return parse summary and surface in frontend alert/UI.

## 8) Risks / Things To Watch

### Potential Bugs

- **State not persisted**: node input fields use local state only; edits may be lost/reinitialized.
- **Type mismatch risk**: output select shows `Image` label but underlying value is `"File"`.
- **ReactFlow typo**: canvas wrapper style uses `width: '100wv'` (likely intended `'100vw'` or `'100%'`).
- **ID coupling**: deriving defaults from string replace of IDs can break if naming scheme changes.
- **Endpoint contract mismatch**: frontend currently has no call and backend expects form string on GET.

### Edge Cases (DAG + Variable Parsing)

- **Cycle detection**:
  - self-loop edges
  - multi-node cycles
  - disconnected subgraphs (should still be valid DAG if each component is acyclic)
- **Handle validity**:
  - edges referencing missing nodes/handles
  - duplicate edges between same ports (decide allow/disallow)
- **Variable parsing**:
  - duplicate placeholders `{{x}} {{x}}` (dedupe handles)
  - malformed tokens (`{{`, `}}`, nested braces)
  - whitespace variants (`{{ name }}`) and canonicalization
  - variable rename causing stale edges

## Suggested First Checks Before Coding

- Confirm expected backend parse response schema from assignment.
- Confirm whether `TextNode` should accept upstream input as well as emit output.
- Confirm allowed graph constraints (single output? multiple roots? no isolated nodes?).
- Decide where field state should live (local node state vs centralized store updates).

