'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState, useRef } from 'react';

export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>();

  useEffect(() => {
    setMounted(true);
    containerRef.current = document.createElement('div');
    document.body.appendChild(containerRef.current);

    return () => {
      if (containerRef.current) {
        document.body.removeChild(containerRef.current);
      }
    };
  }, []);

  if (!mounted || !containerRef.current) return null;

  return createPortal(children, containerRef.current);
}