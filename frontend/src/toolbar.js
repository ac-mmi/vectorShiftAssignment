// toolbar.js

import { useMemo, useState } from 'react';
import { DraggableNode } from './draggableNode';
import './styles/toolbar.css';

const TABS = [
  'General',
  'LLM',
  'Knowledge Base',
  'Integrations',
  'Triggers',
  'Data Loaders',
  'Multi Modal',
  'Logic',
  'Data Transformation',
  'Chat',
];

const TAB_GROUPS = {
  General: [
    {
      title: 'Node Library',
      nodes: [
        { type: 'customInput', label: 'Input' },
        { type: 'llm', label: 'LLM' },
        { type: 'customOutput', label: 'Output' },
        { type: 'text', label: 'Text' },
        { type: 'constText', label: 'Const Text' },
        { type: 'concat', label: 'Concat' },
        { type: 'transform', label: 'Transform' },
        { type: 'if', label: 'If' },
        { type: 'split', label: 'Split' },
      ],
    },
    {
      title: 'Workspace',
      actions: [
        { icon: 'bi-gear', label: 'Project Settings' },
        { icon: 'bi-person-gear', label: 'User Preferences' },
        { icon: 'bi-palette', label: 'Theme & Appearance' },
        { icon: 'bi-bell', label: 'Notifications' },
      ],
    },
  ],
  LLM: [
    {
      title: 'Modeling',
      actions: [
        { icon: 'bi-cpu', label: 'Model Selection' },
        { icon: 'bi-sliders', label: 'Temperature / Top-P' },
        { icon: 'bi-card-text', label: 'Prompt Templates' },
        { icon: 'bi-graph-up-arrow', label: 'Token Monitor' },
      ],
    },
  ],
  'Knowledge Base': [
    {
      title: 'Knowledge',
      actions: [
        { icon: 'bi-cloud-upload', label: 'Upload Documents' },
        { icon: 'bi-grid-3x3-gap', label: 'Manage Chunks' },
        { icon: 'bi-diagram-2', label: 'Embeddings Settings' },
        { icon: 'bi-search', label: 'Search Config' },
      ],
    },
  ],
  Integrations: [
    {
      title: 'Connections',
      actions: [
        { icon: 'bi-key', label: 'API Keys' },
        { icon: 'bi-link-45deg', label: 'Webhooks' },
        { icon: 'bi-box-arrow-up-right', label: 'Third-party Apps' },
      ],
    },
  ],
  Triggers: [
    {
      title: 'Automation',
      actions: [
        { icon: 'bi-lightning', label: 'Event Triggers' },
        { icon: 'bi-calendar-event', label: 'Scheduled Jobs' },
        { icon: 'bi-signpost-split', label: 'Conditional Triggers' },
      ],
    },
  ],
  'Data Loaders': [
    {
      title: 'Ingestion',
      actions: [
        { icon: 'bi-file-earmark-arrow-up', label: 'File Upload' },
        { icon: 'bi-globe', label: 'URL Scraper' },
        { icon: 'bi-database', label: 'DB Connector' },
        { icon: 'bi-collection', label: 'Batch Import' },
      ],
    },
  ],
  'Multi Modal': [
    {
      title: 'Media',
      actions: [
        { icon: 'bi-image', label: 'Image Input' },
        { icon: 'bi-mic', label: 'Audio Input' },
        { icon: 'bi-camera-video', label: 'Video Processing' },
        { icon: 'bi-card-image', label: 'OCR' },
      ],
    },
  ],
  Logic: [
    {
      title: 'Flow',
      actions: [
        { icon: 'bi-signpost', label: 'If / Else' },
        { icon: 'bi-bezier2', label: 'Flow Builder' },
        { icon: 'bi-diagram-3', label: 'Decision Nodes' },
      ],
    },
  ],
  'Data Transformation': [
    {
      title: 'Transform',
      actions: [
        { icon: 'bi-brush', label: 'Clean Data' },
        { icon: 'bi-distribute-horizontal', label: 'Normalize' },
        { icon: 'bi-arrow-repeat', label: 'Format Conversion' },
        { icon: 'bi-funnel', label: 'Filters' },
      ],
    },
  ],
  Chat: [
    {
      title: 'Conversation',
      actions: [
        { icon: 'bi-chat-dots', label: 'Chat UI Preview' },
        { icon: 'bi-clock-history', label: 'History' },
        { icon: 'bi-body-text', label: 'System Prompts' },
        { icon: 'bi-send-check', label: 'Response Settings' },
      ],
    },
  ],
};

const RibbonAction = ({ icon, label }) => {
  return (
    <button type="button" className="ribbon-action-btn" title={label}>
      <i className={`bi ${icon} ribbon-action-btn__icon`} />
      <span className="ribbon-action-btn__label">{label}</span>
    </button>
  );
};

export const PipelineToolbar = ({ isDarkMode, onToggleDarkMode }) => {
  const [activeTab, setActiveTab] = useState('General');
  const groups = useMemo(() => TAB_GROUPS[activeTab] || [], [activeTab]);

  return (
    <div className="pipeline-toolbar">
      <div className="pipeline-toolbar__tabs">
        <img
          src="/vectorshift_logo.jpg"
          alt="VectorShift logo"
          className="pipeline-toolbar__logo"
        />

        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`pipeline-toolbar__tab ${activeTab === tab ? 'is-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}

        <div className="pipeline-toolbar__theme-toggle">
          <input
            className="pipeline-toolbar__theme-toggle-input"
            type="checkbox"
            role="switch"
            id="themeSwitchToolbar"
            checked={!!isDarkMode}
            onChange={() => onToggleDarkMode && onToggleDarkMode()}
          />
          <label
            className="pipeline-toolbar__theme-toggle-label"
            htmlFor="themeSwitchToolbar"
            title="Toggle dark mode"
          >
            <i
              className={`bi ${
                isDarkMode ? 'bi-moon-stars-fill' : 'bi-sun-fill'
              } pipeline-toolbar__theme-toggle-icon`}
            />
          </label>
        </div>
      </div>

      <div className="pipeline-toolbar__panel">
        {groups.map((group) => (
          <div className="pipeline-toolbar__group" key={group.title}>
            <div className="pipeline-toolbar__group-content">
              {group.nodes ? (
                <div className="d-flex flex-wrap gap-2">
                  {group.nodes.map((node) => (
                    <DraggableNode key={node.type} type={node.type} label={node.label} />
                  ))}
                </div>
              ) : null}

              {group.actions ? (
                <div className="pipeline-toolbar__actions-grid">
                  {group.actions.map((action) => (
                    <RibbonAction key={action.label} icon={action.icon} label={action.label} />
                  ))}
                </div>
              ) : null}
            </div>
            <div className="pipeline-toolbar__group-title">{group.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
