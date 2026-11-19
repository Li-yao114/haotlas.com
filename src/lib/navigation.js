export function hrefFor(page, slug) {
  if (page === 'home') return '/';
  return `/${page}/${slug ? `${encodeURIComponent(slug)}/` : ''}`;
}

export function getRoute() {
  const source = window.location.hash.startsWith('#/') ? window.location.hash.slice(1) : window.location.pathname;
  const [rawPage, ...parts] = source.replace(/^\//, '').replace(/\/$/, '').split('/');
  const page = rawPage || 'home';
  try {
    return { page, slug: parts.length ? decodeURIComponent(parts.join('/')) : null };
  } catch {
    return { page: 'missing', slug: null };
  }
}

export function displayDate(date) {
  return String(date || '').slice(0, 10).replaceAll('-', '.');
}
