import React from 'react';
export default function StarRating({ value, compact = false }) {
  if (value == null) return <span className="unrated">未评分</span>;
  return <span className={`star-rating${compact ? ' compact' : ''}`} role="img" aria-label={`${value} / 5 星`}><span className="stars" aria-hidden="true"><span>★★★★★</span><span className="stars-fill" style={{ width: `${value / 5 * 100}%` }}>★★★★★</span></span><span className="rating-number" aria-hidden="true">{Number(value).toFixed(1)}<small> / 5</small></span></span>;
}
