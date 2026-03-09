import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(30, 30, 30, 0.9)',
            color: '#fff',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(218, 165, 32, 0.3)',
            borderRadius: '12px',
          },
          success: {
            iconTheme: { primary: '#DAA520', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </>
  );
}
