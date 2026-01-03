
import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'HOME' | 'ADMIN'>('HOME');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#admin') {
        setCurrentPage('ADMIN');
      } else {
        // When leaving admin hash, we should force re-authentication next time
        setIsAdminAuthenticated(false);
        setCurrentPage('HOME');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    window.location.hash = '';
  };

  return (
    <div className="h-screen w-screen bg-white flex flex-col overflow-hidden">
      <main className="flex-grow flex flex-col h-full overflow-hidden">
        {currentPage === 'HOME' ? (
          <Home />
        ) : (
          <AdminDashboard 
            isAuthenticated={isAdminAuthenticated} 
            onLogin={() => setIsAdminAuthenticated(true)} 
            onLogout={handleLogout}
          />
        )}
      </main>
    </div>
  );
};

export default App;
