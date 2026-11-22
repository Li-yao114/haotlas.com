import React, { useEffect, useRef } from 'react';

export default function Modal({ children, className = 'dialog', label, labelledBy, onClose }) {
  const ref = useRef(null);
  const previousFocus = useRef(typeof document === 'undefined' ? null : document.activeElement);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const dialog = ref.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus.current?.isConnected) previousFocus.current.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog ref={ref} className={className} aria-label={label} aria-labelledby={labelledBy}
      onCancel={event => { event.preventDefault(); close.current(); }}
      onClick={event => {
        if (event.target !== ref.current) return;
        const r = ref.current.getBoundingClientRect();
        if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close.current();
      }}>
      {children}
    </dialog>
  );
}
