import React, { useEffect, useRef, useState } from 'react';
import { useTheme, THEMES } from './ThemeProvider';
import Icon from '../Icon';

const OPTIONS = [{ value: THEMES.LIGHT, label: '浅色', icon: 'sun' }, { value: THEMES.DARK, label: '深色', icon: 'moon' }, { value: THEMES.SYSTEM, label: '跟随系统', icon: 'system' }];

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const container = useRef(null), trigger = useRef(null);
  useEffect(() => {
    if (!open) return;
    const outside = event => { if (!container.current.contains(event.target)) setOpen(false); };
    const escape = event => { if (event.key === 'Escape') { setOpen(false); trigger.current.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  return <div className="theme-picker" ref={container}><button type="button" className="icon-btn" ref={trigger} aria-label="切换主题" aria-expanded={open} aria-controls="theme-options" onClick={() => setOpen(value => !value)}><Icon name={theme === THEMES.SYSTEM ? 'system' : resolvedTheme === THEMES.DARK ? 'moon' : 'sun'} /></button>{open && <div className="theme-menu" id="theme-options" role="group" aria-label="页面主题">{OPTIONS.map(option => <button type="button" key={option.value} aria-pressed={theme === option.value} onClick={() => { setTheme(option.value); setOpen(false); trigger.current.focus(); }}><Icon name={option.icon} /><span>{option.label}</span></button>)}</div>}</div>;
}
