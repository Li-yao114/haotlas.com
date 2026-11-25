import React from 'react';

const paths = {
  location: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
  moon: <path d="M20.5 14.3A8.7 8.7 0 0 1 9.7 3.5a8.8 8.8 0 1 0 10.8 10.8Z" />,
  system: <><rect x="3" y="4" width="18" height="13" rx="1" /><path d="M8 21h8m-4-4v4" /></>,
  left: <path d="m14.5 5-7 7 7 7" />,
  right: <path d="m9.5 5 7 7-7 7" />,
  close: <path d="m5 5 14 14M19 5 5 19" />,
  expand: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />,
  up: <path d="m5 12 7-7 7 7m-7-7v16" />,
};

export default function Icon({ name, ...props }) {
  return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
