import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import './styles/theme.css';
import App from './App.jsx';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext.jsx';

createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
      <Toaster position="top-right" />
    </ThemeProvider>
  </React.StrictMode>
);