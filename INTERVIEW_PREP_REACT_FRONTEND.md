## Interview Prep (React + Frontend Systems + This Project)

This is a practical prep sheet so you can explain your work clearly and confidently in a YC-style interview.

---

## 1) How to introduce yourself + project (60–90 sec)

Use this structure:

1. **Problem**: “I built a workflow editor where users create node/edge pipelines.”
2. **Architecture**: “React Flow for canvas, Zustand for global graph state, FastAPI backend for graph parsing + DAG validation.”
3. **What you improved**:
   - Base node abstraction + 5 new nodes
   - Text node dynamic handles from `{{variable}}`
   - Better UI/UX and modal submit response
   - Dark mode + persistence
4. **Why it matters**: “Reduced duplication, better maintainability, better user feedback, cleaner integration.”

---

## 2) High-probability React questions (and what to say)

### Q: Why use `useState` vs Zustand store?
- **`useState`** for local, component-only UI state (input typing, open/close dropdowns).
- **Zustand** for shared app state across nodes/canvas (`nodes`, `edges`, actions).
- Good answer: “I keep transient UI local and persist cross-component graph state globally.”

### Q: Why `useMemo`, `useCallback`, `useEffect` in TextNode?
- `useMemo`: derived values from text (`variables`, `missing`, maps) to avoid recomputation.
- `useCallback`: stable function references for effects and event handlers.
- `useEffect`: sync side effects (resize textarea, update node internals, edge sync logic).
- Good answer: “I separated pure derivation from side effects to keep behavior predictable.”

### Q: What is a stale closure and how did you avoid it?
- Stale closure = effect/callback reading old state snapshot.
- In sync-heavy areas, use latest store via `useStore.getState()` and version/debounce guards.
- Good answer: “I avoid relying on stale captured arrays during edge synchronization.”

### Q: Controlled vs uncontrolled input?
- Controlled: `value` comes from React state, changes through `onChange`.
- Why here: easier validation, parsing, sync to store/backend payload.

---

## 3) React rendering/performance concepts you should know

### Re-renders
- A component re-renders when:
  - its state changes
  - props change
  - selected store slice changes

### Optimization principles
- Memoize expensive derived logic (`useMemo`)
- Keep state minimal
- Avoid unnecessary store-wide subscriptions
- Keep effects narrow and deterministic

### In this project examples
- Variables parsed from text only when text changes
- Input name maps built from node list
- Edge sync as delta add/remove (not full reset)

---

## 4) React Flow concepts they may ask

### Node/edge model
- Node: `id`, `type`, `position`, `data`
- Edge: `source`, `target`, optional `sourceHandle`, `targetHandle`, custom `data`

### Handles
- Handles are connection points.
- Dynamic handles in TextNode are generated from detected variables.

### Custom node and edge types
- `nodeTypes` map type keys to React components.
- `edgeTypes` map edge type keys to custom edge renderers (e.g., deletable edge).

### `updateNodeInternals`
- Needed when node handle geometry changes dynamically, so React Flow recalculates internals.

---

## 5) State management questions (Zustand)

### Why Zustand?
- Lightweight, simple API, no boilerplate reducers required.
- Easy colocated actions (`addNode`, `onConnect`, `deleteEdge`, etc.).

### Important store actions in your app
- `addNode`
- `onNodesChange` / `onEdgesChange`
- `onConnect`
- `updateNodeField`
- `deleteNode`, `deleteEdge`, `clearAll`

### Interview-ready point
- “I keep graph mutation logic in store actions to avoid scattered ad-hoc updates across components.”

---

## 6) Text parsing + validation concepts

### Regex and identifiers
- Detect tokens like `{{ input }}`.
- Trim inner text and validate JS identifier:
  - starts with `[A-Za-z_$]`
  - followed by `[A-Za-z0-9_$]*`

### Soft validation
- Non-blocking warnings for missing/invalid variables.
- UI informs user without preventing pipeline construction.

### Why this design is strong
- Better UX than hard errors during editing.
- Users can iterate quickly while still seeing problems.

---

## 7) Backend integration questions

### API flow
- Frontend sends `{nodes, edges}` to `/pipelines/parse`.
- Backend returns:
  - `num_nodes`
  - `num_edges`
  - `is_dag`

### DAG check concept
- Topological-sort style (Kahn’s algorithm).
- If visited node count == total nodes, graph is DAG.
- Otherwise there is a cycle.

### Good explanation
- “This gives immediate structural feedback to users before execution.”

---

## 8) UI/UX decisions you can defend

- Custom modal instead of plain alert for better product feel.
- Edge delete button for direct graph editing.
- Dark mode with persistence.
- Toolbar + node iconography for visual scanning and affordance.
- Focus states and clear form labeling for accessibility.

---

## 9) Testing strategy (what to say if asked)

Even if no full automated suite was required, show mature thinking:

### Manual functional tests you performed
- Node drag/drop for each type
- Edge connect/disconnect behavior
- Text variable handle generation
- Submit response correctness
- DAG true/false scenarios
- Theme persistence after refresh

### What you would automate next
- Unit tests:
  - variable parser
  - DAG helper
- E2E tests:
  - drag/drop + connect + submit flow
  - cycle detection flow

---

## 10) Common “deep dive” questions and sample answers

### “What tradeoff did you make?”
Sample:
“I prioritized maintainability and predictable state updates over hyper-optimizing early. The BaseNode abstraction removed duplication significantly and made node additions faster.”

### “What was the hardest bug?”
Sample:
“Synchronizing dynamic TextNode handles with edge state and React Flow internals. The key fix was sequencing updates and using delta-based edge operations to avoid destructive resets.”

### “How would you scale this?”
Sample:
“- Extract parser/sync logic into utilities with tests  
- Introduce typed contracts for node data  
- Add feature flags/config-driven node schemas  
- Add E2E tests for graph interactions”

### “How do you ensure correctness?”
Sample:
“I separate pure derived logic from side effects, keep store actions centralized, and validate behavior through deterministic scenarios like DAG vs cycle and variable match/mismatch.”

---

## 11) Red flags to avoid in interview

- Don’t say: “Cursor did most of it.”
- Instead say:
  - “I used tooling for speed, but I designed the architecture and validated behavior.”
  - “I can explain each tradeoff and why each piece exists.”

---

## 12) 1-minute confident closing script

“My main focus was making the editor maintainable and product-ready.  
I introduced a reusable node abstraction, demonstrated extensibility with five additional nodes, enhanced TextNode behavior with dynamic variable handles and resizing, and completed end-to-end backend integration with DAG validation feedback.  
I also improved UX with clearer controls, modal responses, and theme persistence.  
If we had more time, I’d formalize parser/sync tests and add E2E automation for graph interactions.”

---

## 13) Last 24-hour prep checklist

- Rehearse 3 times: 5–7 minute walkthrough.
- Be able to explain `useEffect` dependencies in TextNode.
- Be able to explain why store updates live in Zustand actions.
- Be able to explain DAG check in plain words.
- Prepare one “bug story” + one “tradeoff story.”
- Keep one fallback phrase:
  - “Great question — I optimized for correctness and maintainability first, then UX polish.”

