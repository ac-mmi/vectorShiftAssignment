// submit.js

import { useState } from 'react';
import { useStore } from './store';
import './styles/submit.css';

export const SubmitButton = () => {
    const nodes = useStore((state) => state.nodes);
    const edges = useStore((state) => state.edges);
    const clearAll = useStore((state) => state.clearAll);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalState, setModalState] = useState({
        title: '',
        body: '',
        isError: false,
    });

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch('http://localhost:8000/pipelines/parse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nodes, edges }),
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const data = await response.json();
            setModalState({
                title: 'Pipeline parsed successfully',
                body:
                    `Nodes: ${data.num_nodes}\n` +
                    `Edges: ${data.num_edges}\n` +
                    `Is DAG: ${data.is_dag ? 'Yes' : 'No'}`,
                isError: false,
            });
            setModalOpen(true);
        } catch (error) {
            setModalState({
                title: 'Failed to parse pipeline',
                body: error.message,
                isError: true,
            });
            setModalOpen(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="d-flex align-items-center justify-content-between gap-2 submit-button-wrap">
                <button type="button" className="btn btn-outline-danger clear-all-button" onClick={clearAll}>Clear All</button>
                <button type="button" className="btn btn-primary submit-button" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
            </div>

            {modalOpen ? (
                <div
                    className="submit-modal-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="submit-modal-title"
                    onClick={() => setModalOpen(false)}
                >
                    <div
                        className={`submit-modal modal-content ${modalState.isError ? 'is-error' : 'is-success'}`}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="modal-header py-2 px-3 d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-2">
                                <span className={`submit-modal__icon ${modalState.isError ? 'is-error' : 'is-success'}`}>
                                    {modalState.isError ? '!' : '✓'}
                                </span>
                                <h5 id="submit-modal-title" className="modal-title fs-6 mb-0">
                                    {modalState.title}
                                </h5>
                            </div>
                            <button
                                type="button"
                                className="btn-close"
                                aria-label="Close"
                                onClick={() => setModalOpen(false)}
                            />
                        </div>
                        <div className="modal-body py-2 px-3">
                            <pre className={`submit-modal__body mb-0 ${modalState.isError ? 'is-error' : 'is-success'}`}>
                                {modalState.body}
                            </pre>
                        </div>
                        
                    </div>
                </div>
            ) : null}
        </>
    );
}
