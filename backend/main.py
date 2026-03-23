from collections import deque
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/')
def read_root():
    return {'Ping': 'Pong'}

def _is_dag(nodes: list[dict[str, Any]], edges: list[dict[str, Any]]) -> bool:
    node_ids = {node.get('id') for node in nodes if node.get('id') is not None}
    adjacency = {node_id: [] for node_id in node_ids}
    in_degree = {node_id: 0 for node_id in node_ids}

    for edge in edges:
        source = edge.get('source')
        target = edge.get('target')

        # Treat edges pointing to unknown nodes as invalid graph for DAG checks.
        if source not in node_ids or target not in node_ids:
            return False

        adjacency[source].append(target)
        in_degree[target] += 1

    queue = deque([node_id for node_id, degree in in_degree.items() if degree == 0])
    visited = 0

    while queue:
        current = queue.popleft()
        visited += 1

        for neighbor in adjacency[current]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return visited == len(node_ids)


@app.post('/pipelines/parse')
def parse_pipeline(payload: dict[str, Any]):
    nodes = payload.get('nodes', [])
    edges = payload.get('edges', [])

    num_nodes = len(nodes)
    num_edges = len(edges)
    is_dag = _is_dag(nodes, edges)

    return {
        'num_nodes': num_nodes,
        'num_edges': num_edges,
        'is_dag': is_dag,
    }
