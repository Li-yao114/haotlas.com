import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function ArticleImage({ src, alt, title }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <a href={src} target="_blank" rel="noreferrer">{alt || '查看原图'}（图片暂不可用）</a>;
  return <img src={src} alt={alt || ''} title={title} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}

const components = { img: ArticleImage };
const plugins = [remarkGfm];

export default function MarkdownContent({ children, resolveImage }) {
  const renderers = useMemo(() => resolveImage ? { ...components, img: props => <ArticleImage {...props} src={resolveImage(props.src)} /> } : components, [resolveImage]);
  return <ReactMarkdown remarkPlugins={plugins} components={renderers}>{children}</ReactMarkdown>;
}
