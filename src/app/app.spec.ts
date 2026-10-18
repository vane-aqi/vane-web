import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { SampleSensorSource } from './core/sample-sensor-source';
import { SensorSource } from './core/sensor-source';
import { Landing } from './pages/landing/landing';
import { Overview } from './pages/overview/overview';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), { provide: SensorSource, useClass: SampleSensorSource }],
    }).compileComponents();
  });

  it('renders the wordmark', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('.brand')?.textContent).toContain('Vane');
  });

  it('shows the headline and a readout for each reading on the landing page', async () => {
    const fixture = TestBed.createComponent(Landing);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Read the air');
    expect(el.querySelectorAll('.readout-item').length).toBe(5);
    expect(el.querySelector('.readout-item .num')?.textContent).toBe('670');
  });

  it('shows the verdict, every reading and the actions on the dashboard', async () => {
    const fixture = TestBed.createComponent(Overview);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.verdict-word')?.textContent).toContain('Fair');
    expect(el.querySelectorAll('.room').length).toBe(4);
    expect(el.querySelector('h1')?.textContent).toContain('Living room');
    expect(el.querySelectorAll('.row').length).toBe(7);
    expect(el.querySelectorAll('.sub li').length).toBe(3);
    expect(el.querySelectorAll('.todo li').length).toBe(3);
  });

  it('switches rooms from the room input and shows an offline state', async () => {
    const fixture = TestBed.createComponent(Overview);
    fixture.componentRef.setInput('room', 'kitchen');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Kitchen');
    expect(el.querySelector('.verdict-word')?.textContent).toContain('Poor');

    fixture.componentRef.setInput('room', 'office');
    await fixture.whenStable();
    expect(el.querySelector('.offline')).toBeTruthy();
    expect(el.querySelectorAll('.row').length).toBe(0);
  });
});
