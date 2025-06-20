import React from 'react';
import Navbar from './Navbar';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow py-8">
        {children}
      </main>
      <footer className="bg-white shadow-inner py-4">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Grega Play - Montage Vidéo Collaboratif</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;