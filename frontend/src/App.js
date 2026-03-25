import { useEffect, useState } from 'react';
import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { SubmitButton } from './submit';
import './styles/theme.css';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = window.localStorage.getItem('theme');
    return saved === 'dark';
  });

  useEffect(() => {
    window.localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <PipelineToolbar isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode((v) => !v)} />
      <div className={`app-main ${isDarkMode ? 'app-main--dark' : ''}`} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <PipelineUI isDarkMode={isDarkMode} />
        <SubmitButton />
      </div>
    </div>
  );
}

export default App;
