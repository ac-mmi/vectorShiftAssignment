// store.js

import { create } from "zustand";
import {
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    MarkerType,
  } from 'reactflow';

export const useStore = create((set, get) => ({
    nodes: [],
    edges: [],
    getNodeID: (type) => {
        const newIDs = {...get().nodeIDs};
        if (newIDs[type] === undefined) {
            newIDs[type] = 0;
        }
        newIDs[type] += 1;
        set({nodeIDs: newIDs});
        return `${type}-${newIDs[type]}`;
    },
    addNode: (node) => {
        console.log('🟢 Adding Node', node);
        set({
            nodes: [...get().nodes, node]
        });
        console.log('🟢 Nodes after add', get().nodes);
    },
    onNodesChange: (changes) => {
      set({
        nodes: applyNodeChanges(changes, get().nodes),
      });
    },
    onEdgesChange: (changes) => {
      set({
        edges: applyEdgeChanges(changes, get().edges),
      });
    },
    onConnect: (connection) => {
      console.log('🔵 New Connection', connection);
      set({
        edges: addEdge({
          ...connection,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#009DFF', strokeWidth: 2 },
          markerEnd: { type: MarkerType.Arrow, color: '#009DFF', height: '13px', width: '13px' }
        }, get().edges),
      });
      console.log('🔵 Edges after connect', get().edges);
    },
    updateNodeField: (nodeId, fieldName, fieldValue) => {
      set({
        nodes: get().nodes.map((node) => {
          if (node.id === nodeId) {
            node.data = { ...node.data, [fieldName]: fieldValue };
          }
  
          return node;
        }),
      });
    },
    deleteNode: (nodeId) => {
      set({
        nodes: get().nodes.filter((node) => node.id !== nodeId),
        edges: get().edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      });
    },
    clearAll: () => {
      set({
        nodes: [],
        edges: [],
      });
    },
  }));
