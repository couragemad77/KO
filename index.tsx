
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { seedService } from './services/seedService';

const Root: React.FC = () => {
  useEffect(() => {
    // Seeding is now enabled.
    // The seed service checks if data already exists before performing any operations.
    seedService.run((percent, status) => {
      if (percent === 100) {
        console.log("System Ready: Database synchronized.");
      }
    });
  }, []);

  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(<Root />);
