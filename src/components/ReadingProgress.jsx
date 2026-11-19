import React, { useEffect, useRef } from 'react';

export default function ReadingProgress() {
  const ref = useRef(null);
  useEffect(() => {
    let frame;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const height = document.documentElement.scrollHeight - innerHeight;
        if (ref.current) ref.current.style.transform = `scaleX(${height > 0 ? Math.min(1, Math.max(0, scrollY / height)) : 0})`;
      });
    };
    const observer = new ResizeObserver(update);
    observer.observe(document.body);
    update();
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); removeEventListener('scroll', update); removeEventListener('resize', update); };
  }, []);
  return <div className="reading-progress" aria-hidden="true"><span ref={ref} /></div>;
}
