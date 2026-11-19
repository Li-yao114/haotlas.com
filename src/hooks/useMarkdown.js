import { useEffect, useState } from 'react';
import { loadMarkdown, getInitialMarkdown } from '../lib/content';

export default function useMarkdown(file, initialBody) {
  const [state, setState] = useState(() => { const body = initialBody ?? getInitialMarkdown(file); return { file: body != null ? file : null, body: body || '', error: false }; });
  useEffect(() => {
    if (!file) return;
    let active = true;
    loadMarkdown(file).then(({ body }) => {
      if (active) setState({ file, body, error: false });
    }).catch(() => {
      if (active) setState({ file, body: '', error: true });
    });
    return () => { active = false; };
  }, [file]);
  return { body: state.file === file ? state.body : '', error: state.file === file && state.error, loading: state.file !== file };
}
