// store.js

import { create } from "zustand";
import {
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    MarkerType,
  } from 'reactflow';
import { connectionAlreadyExists } from './utils/edgeValidation';
import { syncVariableEdgesForAllTextNodes } from './utils/syncTextNodeVariableEdges';

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
      console.log('🔵 onConnect called with:', connection);
      if (connectionAlreadyExists(get().edges, connection)) {
        return;
      }
      const edgeData = connection?.data?.type
        ? connection.data
        : { ...(connection?.data || {}), type: 'manual' };
      console.log('🔵 Edge data:', edgeData);
      set({
        edges: addEdge({
          ...connection,
          type: 'deletable',
          data: edgeData,
          animated: true,
          style: { stroke: '#6366F1', strokeWidth: 2 },
          markerEnd: { type: MarkerType.Arrow, color: '#6366F1', height: '13px', width: '13px' }
        }, get().edges),
      });
      console.log('🔵 Edges after connect:', get().edges);
    },
    updateNodeField: (nodeId, fieldName, fieldValue) => {
      const nextNodes = get().nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: { ...node.data, [fieldName]: fieldValue },
          };
        }

        return node;
      });
      const updatedNode = nextNodes.find((n) => n.id === nodeId);
      const nextEdges = get().edges;
      set({ nodes: nextNodes, edges: nextEdges });
      if (fieldName === 'inputName' && updatedNode?.type === 'customInput') {
        syncVariableEdgesForAllTextNodes(get);
      }
    },
    deleteNode: (nodeId) => {
      set({
        nodes: get().nodes.filter((node) => node.id !== nodeId),
        edges: get().edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      });
    },
    deleteEdge: (edgeId) => {
      set({
        edges: get().edges.filter((edge) => edge.id !== edgeId),
      });
    },
    clearAll: () => {
      set({
        nodes: [],
        edges: [],
      });
    },
  }));
