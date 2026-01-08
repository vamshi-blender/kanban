import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./config/authConfig";
import { UserPhotosProvider } from './context/UserPhotosContext';
import App from './App.tsx';
import './index.css';

const msalInstance = new PublicClientApplication(msalConfig);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <MsalProvider instance={msalInstance}>
        <UserPhotosProvider>
          <App />
        </UserPhotosProvider>
      </MsalProvider>
    </BrowserRouter>
  </StrictMode>
);
