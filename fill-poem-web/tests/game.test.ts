import { expect, test } from 'vitest';
import { validateLead } from '#/game/lead-form.ts';
import { draw } from '#/game/lottery.ts';

test('validateLead flags empty name, bad phone and empty address', () => {
  expect(Object.keys(validateLead({ name: ' ', phone: '123', address: '' })).sort()).toEqual(['address', 'name', 'phone']);
  expect(validateLead({ name: '张三', phone: '13800138000', address: '北京' })).toEqual({});
});

test('draw wins only below the win rate', () => {
  expect(draw(() => 0).won).toBe(true);
  expect(draw(() => 0.99).won).toBe(false);
});
