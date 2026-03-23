// submit.js

import { useStore } from './store';
import './styles/submit.css';

export const SubmitButton = () => {
    const nodes = useStore((state) => state.nodes);
    const edges = useStore((state) => state.edges);
    const clearAll = useStore((state) => state.clearAll);

    const handleSubmit = async () => {
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
            alert(
                `Pipeline parsed successfully!\n` +
                `Nodes: ${data.num_nodes}\n` +
                `Edges: ${data.num_edges}\n` +
                `Is DAG: ${data.is_dag ? 'Yes' : 'No'}`
            );
        } catch (error) {
            alert(`Failed to parse pipeline: ${error.message}`);
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-between gap-2 submit-button-wrap">
            <button type="button" className="btn btn-outline-danger clear-all-button" onClick={clearAll}>Clear All</button>
            <button type="button" className="btn btn-primary submit-button" onClick={handleSubmit}>Submit</button>
        </div>
    );
}
