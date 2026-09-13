'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('ServiceWorker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.error('ServiceWorker registration failed:', error);
          });
      });
    } else if ('serviceWorker' in navigator) {
      // Also register in dev mode if supported for local PWA testing
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('ServiceWorker registered in dev with scope:', registration.scope);
        })
        .catch(() => {});
    }
  }, []);

  return null;
}
