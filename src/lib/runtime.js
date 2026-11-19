// The original launch time is Beijing time, independent of a visitor's timezone.
export const LAUNCH_TIMESTAMP = Date.parse('2023-10-31T21:15:09+08:00');

export function formatDuration(ms) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 86400)} 天 ${Math.floor(seconds % 86400 / 3600)} 小时 ${Math.floor(seconds % 3600 / 60)} 分钟 ${seconds % 60} 秒`;
}
