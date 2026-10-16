import { TestBed } from '@angular/core/testing';
import { markerPct, overallHealth, segmentsFor, zoneFor } from './evaluate';
import { METRIC_DEFINITIONS } from './metric-definitions';
import { Preferences } from './preferences';
import { ReadingsStore } from './readings-store';
import { SampleSensorSource } from './sample-sensor-source';
import { SensorSource } from './sensor-source';

const humidity = METRIC_DEFINITIONS.find((m) => m.id === 'humidity')!.scale;

describe('evaluate', () => {
  it('finds the zone a value falls in', () => {
    expect(zoneFor(humidity, 40).status).toBe('Comfortable');
    expect(zoneFor(humidity, 67).status).toBe('Humid');
  });

  it('uses the nearest zone for values off the scale', () => {
    expect(zoneFor(humidity, -5).status).toBe('Dry');
    expect(zoneFor(humidity, 120).status).toBe('Very humid');
  });

  it('keeps the marker inside the bar', () => {
    expect(markerPct(humidity, 50)).toBe(50);
    expect(markerPct(humidity, 0)).toBe(2);
    expect(markerPct(humidity, 100)).toBe(98);
  });

  it('turns zones into segments that fill the scale', () => {
    const total = segmentsFor(humidity).reduce((sum, s) => sum + s.widthPct, 0);
    expect(total).toBeCloseTo(100);
  });

  it('rates overall health from the worst readings', () => {
    expect(overallHealth(['good', 'good']).label).toBe('Good');
    expect(overallHealth(['alert', 'good']).label).toBe('Fair');
    expect(overallHealth(['watch', 'watch']).label).toBe('Fair');
    expect(overallHealth(['alert', 'alert']).label).toBe('Poor');
  });
});

describe('ReadingsStore with sample data', () => {
  let store: ReadingsStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [{ provide: SensorSource, useClass: SampleSensorSource }],
    });
    store = TestBed.inject(ReadingsStore);
  });

  const reading = (id: string) => store.primary().readings.find((r) => r.id === id)!;

  it('flags the gas group as an alert because carbon monoxide is high', () => {
    const gases = reading('gases');
    expect(gases.tone).toBe('alert');
    expect(gases.gases.map((g) => g.tone)).toEqual(['alert', 'watch', 'watch']);
  });

  it('converts temperature to the chosen unit', () => {
    expect(reading('temperature').display).toBe('67');
    TestBed.inject(Preferences).temperatureUnit.set('C');
    expect(reading('temperature').display).toBe('19.4');
    expect(reading('temperature').healthy).toBe('20–24°C');
  });

  it('lists the most urgent action first', () => {
    expect(store.primary().actions.map((r) => r.id)).toEqual(['gases', 'temperature', 'humidity']);
    expect(store.primary().overall?.label).toBe('Fair');
  });

  it('evaluates every room and leaves offline ones empty', () => {
    const rooms = store.monitors();
    expect(rooms.map((m) => m.overall?.label ?? 'Offline')).toEqual(['Fair', 'Good', 'Poor', 'Offline']);
    expect(store.monitor('office').readings).toEqual([]);
    expect(store.monitor('nope').id).toBe('living-room');
  });

  it('keeps the decimal on small gas values', () => {
    const isoprene = store.monitor('bedroom').readings.find((r) => r.id === 'gases')!.gases[1];
    expect(isoprene.display).toBe('0.6');
  });
});
