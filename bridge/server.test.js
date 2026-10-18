'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseLine } = require('./server.js');

test('maps the device fields onto the app fields', () => {
  assert.deepEqual(parseLine('{"temperature": 25.5, "humidity": 60, "pm25": 35, "pm10": 50}'), {
    temperatureC: 25.5,
    humidityPct: 60,
    pm25: 35,
    pm10: 50,
  });
});

test('leaves missing sensors out instead of reporting 0', () => {
  assert.deepEqual(parseLine('{"pm25": 8.1}'), { pm25: 8.1 });
});

test('ignores non-numeric values', () => {
  assert.deepEqual(parseLine('{"humidity": "high", "pm10": 20}'), { pm10: 20 });
});

test('rejects lines that are not usable', () => {
  assert.throws(() => parseLine('not json'));
  assert.throws(() => parseLine('{"battery": 90}'));
});
