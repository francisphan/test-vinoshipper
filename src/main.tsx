import React from 'react';
import ReactDOM from 'react-dom/client';
import VinoshipperAgent from '../multi-account-proto';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <VinoshipperAgent />
  </React.StrictMode>
);