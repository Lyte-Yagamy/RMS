import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';

// Initial debug marker
console.log('RMS: Application bootstrap starting...');

window.onerror = (message, source, lineno, colno, error) => {
  console.error('RMS: Global Runtime Error:', { message, source, lineno, colno, error });
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
  console.log('RMS: render() called successfully');
} else {
  console.error('RMS: Failed to find root element');
}
