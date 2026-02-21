import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { ShiftProvider } from './context/ShiftContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ShiftProvider>
      <App />
    </ShiftProvider>
  </StrictMode>,
);
