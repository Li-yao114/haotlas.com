import React from 'react';
import { hrefFor } from '../lib/navigation';

export default function ContentState({ title, children, back = 'home', backLabel = '返回首页', retry }) {
  return <section className="content-state"><h1>{title}</h1>{children && <p>{children}</p>}<div className="state-actions">{retry && <button className="text-link" onClick={retry}>重新加载</button>}<a className="text-link" href={hrefFor(back)}>{backLabel}</a></div></section>;
}
