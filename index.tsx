import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const cacheAppShellAssets = (registration: ServiceWorkerRegistration) => {
  const serviceWorker = registration.active || registration.waiting || registration.installing;
  if (!serviceWorker) return;

  const assetUrls = Array.from(
    document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>('script[src], link[rel="stylesheet"], link[rel="modulepreload"]')
  )
    .map((element) => element instanceof HTMLScriptElement ? element.src : element.href)
    .filter(Boolean);

  const urlsToCache = Array.from(new Set([
    `${window.location.origin}/`,
    `${window.location.origin}/index.html`,
    ...assetUrls
  ]));

  serviceWorker.postMessage({ type: 'CACHE_URLS', payload: urlsToCache });
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
      cacheAppShellAssets(registration);
      navigator.serviceWorker.ready.then(cacheAppShellAssets).catch(() => undefined);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}
