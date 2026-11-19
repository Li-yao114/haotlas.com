import test from 'node:test';
import assert from 'node:assert/strict';
import { LAUNCH_TIMESTAMP, formatDuration } from '../src/lib/runtime.js';

test('本站计时沿用 2023 年 10 月 31 日北京时间的启动时刻', () => {
  assert.equal(LAUNCH_TIMESTAMP, Date.UTC(2023, 9, 31, 13, 15, 9));
  assert.equal(formatDuration(Date.UTC(2023, 10, 1, 13, 15, 10) - LAUNCH_TIMESTAMP), '1 天 0 小时 0 分钟 1 秒');
  assert.equal(formatDuration(-1), '0 天 0 小时 0 分钟 0 秒');
});
