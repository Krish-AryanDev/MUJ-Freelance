'use client';

import { Toaster as HotToaster } from 'react-hot-toast';

export default function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          border: '1px solid #e4e4e7',
          borderRadius: '10px',
          background: '#fff',
          color: '#18181b',
        },
      }}
    />
  );
}
