## Video Walkthrough Script (VectorShift Frontend Technical Assessment)

Goal: explain **what you built**, **how it’s structured**, **how you approached each part**, and **demo it smoothly** in ~5–8 minutes.

---

## 0) Setup (before recording)

- Start backend: `uvicorn main:app --reload`
- Start frontend: `npm start`
- Open browser console (optional, for quick debug credibility).

---

## 1) Opening (15–25 seconds)

**Script:**

“Hi, I’m <NAME>. This is my VectorShift frontend assessment. I built a small pipeline editor using React Flow where you can drag nodes from a toolbar, connect them, and submit the graph to a FastAPI backend that returns the node count, edge count, and whether the pipeline is a DAG.”

---

## 2) High-level architecture (45–75 seconds)

### What the app is made of

**Script:**

“Architecturally, there are three core layers:
- The **React Flow canvas** which renders nodes/edges and handles drag-and-drop.
- A **global state store** using Zustand that owns the source of truth for `nodes` and `edges`.
- A set of **node components** that render UI and define handles, most of which share structure through a `BaseNode` abstraction.”

### Point to the key files (quickly)

- **Canvas**: `frontend/src/ui.js`
- **Store**: `frontend/src/store.js`
- **Nodes**: `frontend/src/nodes/*` (+ `BaseNode.js`)
- **Text variable / edge sync helpers**: `frontend/src/utils/syncTextNodeVariableEdges.js`, `frontend/src/utils/variableHelpers.js`
- **Submit + modal**: `frontend/src/submit.js`
- **Backend**: `backend/main.py`
- **Styling**: `frontend/src/styles/*`

---

## 3) Part 1 — Node Abstraction (60–90 seconds)

### What was the problem?

**Script:**

“The initial nodes had repeated structure: container, header, handle rendering, and basic layout. Copy/pasting to create new nodes would increase duplication and make styling changes harder.”

### What you built

**Script:**

“I introduced `BaseNode` as an abstraction. Nodes now pass:
- `title`
- `inputs` and `outputs` arrays (handle configs)
- `children` for the node-specific UI.

This keeps node-specific logic small and makes it easy to create new node types quickly.”

### Prove it with the 5 new nodes

**Script:**

“To demonstrate flexibility, I added five nodes with different handle shapes:
- Const Text (no inputs → one output)
- Concat (two inputs → one output)
- Transform (one input → one output + select UI)
- If (one input → two outputs)
- Split (one input → three outputs)

They share the same base layout but differ by handle config + inner UI.”

---

## 4) Part 2 — Styling (45–75 seconds)

### What you changed

**Script:**

“I applied a unified UI style inspired by product-like editors:
- A ribbon-style toolbar
- Styled draggable node tiles with icons
- Consistent node headers, typography, and spacing
- A custom submit result modal instead of a plain alert

I kept styles in `frontend/src/styles/` so the components stay readable.”

### Mention dark mode (optional quick callout)

**Script:**

“I also added a dark mode toggle and persisted it via localStorage so theme preference survives refresh.”

---

## 5) Part 3 — Text Node Logic (90–140 seconds)

### Requirement A: Text node resizes with content

**Script:**

“For usability, the Text node grows as you type:
- The textarea auto-resizes vertically based on `scrollHeight`
- The node width can be adjusted so long templates remain readable”

### Requirement B: Variables create dynamic handles

**Script:**

“The Text node supports variables using `{{variableName}}`. When it detects a valid JavaScript identifier in double braces, it creates a matching input handle on the left side. This mimics real workflow tools and makes templates connectable.”

### Extra UX you added (keep brief)

Pick only 1–2 points:
- Soft validation: missing variables show warnings (doesn’t block typing).
- Autocomplete: typing `{{` shows suggestions from input node names.

---

## 6) Part 4 — Backend Integration (60–90 seconds)

### Frontend submit flow

**Script:**

“When the user clicks Submit, the frontend sends `{nodes, edges}` to the backend `/pipelines/parse` endpoint. I show the response in a user-friendly modal with node count, edge count, and DAG status.”

### Backend parse logic

**Script:**

“On the backend, the endpoint counts nodes and edges and runs a DAG check using a topological approach. The response is exactly `{ num_nodes, num_edges, is_dag }`.”

---

## 7) Demo checklist (what to do on screen)

### A) Quick build + connect

- Drag **Input**, **Text**, **LLM**, **Output**
- Connect: Input → Text, Text → LLM, LLM → Output

### B) Text variables → handles

- In Text, type: `Summarize {{pdf}} with title {{title}}`
- Show that two left handles appear for `pdf` and `title`
- (Optional) Rename a connected **Input** so it no longer matches a token → show the variable edge go away; rename it back to match `{{...}}` → edge can sync again

### C) Edge delete UX

- Click the edge “×” button to remove a connection

### D) DAG vs cycle

- Submit a normal chain → show modal “Is DAG: Yes”
- Create a cycle (connect back) → submit → “Is DAG: No”

### E) Theme persistence (optional)

- Toggle dark mode
- Refresh page
- Confirm it stays in the selected theme

---

## 8) Testing approach (30–60 seconds)

**Script:**

“For this kind of UI-heavy graph editor, the most valuable validation is a focused manual test checklist:
- Node creation via drag/drop
- Connections between handles
- Dynamic Text handles from variables
- Submit request/response integration
- DAG correctness on a cyclic vs acyclic graph

If this were production, I’d add:
- unit tests for parsing + DAG helpers
- and Playwright/Cypress E2E tests for drag/drop + connect flows.”

---

## 9) Closing (10–20 seconds)

**Script:**

“That’s the full walkthrough. The key outcomes are: a reusable node abstraction, a polished UI, a smarter Text node with variables and resizing, and a working backend integration that validates DAG structure.”

