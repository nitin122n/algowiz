/** Entry point: loads self-hosted fonts and styles, then mounts the app. */
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '@fontsource-variable/cormorant-garamond';
import '@fontsource-variable/cormorant-garamond/wght-italic.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/shell.css';
import './styles/page.css';
import './styles/views.css';
import './styles/landing.css';
import './styles/lab.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
