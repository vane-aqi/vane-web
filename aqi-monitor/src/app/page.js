'use client';

import { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import AQICard from './components/AQICard';
import Modal from './components/Modal';
import Footer from './components/Footer';

export default function Home() {
  const [sensorData, setSensorData] = useState({
    bme680: { temperature: null, humidity: null, pressure: null, gasResistance: null },
    scd41: { co2: null, temperature: null, humidity: null },
    timestamp: null
  });
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/data');
        const data = await response.json();
        setSensorData(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const tempC = sensorData.scd41?.temperature || 0;
  const tempF = (tempC * 9/5 + 32).toFixed(1);
  const co2 = sensorData.scd41?.co2 || 0;
  const humidity = sensorData.scd41?.humidity || 0;
  const pressure = sensorData.bme680?.pressure || 0;

  const getStatusMessage = (type) => {
    switch(type) {
      case 'co2':
        return co2 < 1000 ? 'a safe level!' : 'elevated - consider ventilating!';
      case 'temp':
        return tempF >= 68 && tempF <= 75 ? 'in the comfort range!' : 'outside the ideal comfort range but still safe!';
      case 'humidity':
        return humidity >= 30 && humidity <= 50 ? 'in the optimal range!' : 
               humidity > 50 ? 'at risk for mold and stuffy air!' : 'may cause dry skin and irritation!';
      case 'pressure':
        return Math.abs(pressure - 1013) < 20 ? 'normal!' : 'slightly unusual but not concerning!';
      default:
        return '';
    }
  };

  return (
    <div>
      <h1>Air Quality Levels</h1>
      <p>Click on "i" on each card to reach more!</p>
      <AQICard
        title="CO2"
        description="Indicates the level of carbon dioxide in the air"
        value={co2 ? `${co2} ppm` : '-- ppm'}
        icon="💨"
        color="green"
        onInfoClick={() => setActiveModal('co2')}
      />
      <AQICard
        title="Temperature"
        description="Measures the air's thermal condition"
        value={tempC ? `${tempC}°C / ${tempF}°F` : '--°C / --°F'}
        icon="🌡️"
        color="orange"
        onInfoClick={() => setActiveModal('temperature')}
      />
      <AQICard
        title="Humidity"
        description="Reflects the amount of water vapor in the air"
        value={humidity ? `${humidity}%` : '--%'}
        icon="💧"
        color="blue"
        onInfoClick={() => setActiveModal('humidity')}
      />
      <AQICard
        title="Air Pressure"
        description="Affects ventilation and pollutant movement"
        value={pressure ? `${pressure} hPa` : '---- hPa'}
        icon="☁️"
        color="purple"
        onInfoClick={() => setActiveModal('pressure')}
      />
      <Modal isOpen={activeModal === 'co2'} onClose={() => setActiveModal(null)} title="CO2" icon="💨">
        Carbon dioxide is a naturally occurring gas produced when we breathe and burn fuels.
        Indoors, rising CO₂ levels often mean poor ventilation or crowded spaces. High concentrations can cause fatigue, headaches, and reduced concentration, all signs that it's time to bring in more fresh air!
        Safe level:
        Below 1000 ppm is considered good; 400-800 ppm is typical for well-ventilated indoor spaces.
        ✓ Your CO2 level is currently {co2} ppm which is {getStatusMessage('co2')}
      </Modal>
      <Modal isOpen={activeModal === 'temperature'} onClose={() => setActiveModal(null)} title="Temperature" icon="🌡️">
        Temperature shows how warm or cool the air feels and affects comfort, energy use, and how pollutants move. Extreme temperatures can stress the body and affect air quality.
        Comfort range:
        Between 68-75°F (20-24°C) indoors is ideal for most people.
        ✓ Your current room temperature is {tempF}°F. This is {getStatusMessage('temp')}
      </Modal>
      <Modal isOpen={activeModal === 'humidity'} onClose={() => setActiveModal(null)} title="Humidity" icon="💧">
        Humidity measures the amount of water vapor in the air. High humidity can cause mold and stuffy air, while low humidity can cause dry skin, irritation, and static electricity.
        Optimal range:
        Between 30-50% relative humidity keeps air comfortable and healthy.
        {humidity >= 30 && humidity <= 50 ? '✓' : '⚠️'} Your current room humidity is {humidity}%. This is {getStatusMessage('humidity')}
      </Modal>
      <Modal isOpen={activeModal === 'pressure'} onClose={() => setActiveModal(null)} title="Air Pressure" icon="☁️">
        Air pressure, or atmospheric pressure, is the weight of air pressing down on us. Changes in air pressure can affect weather, ventilation, and how pollutants disperse in the air.
        Normal range:
        Standard atmospheric pressure at sea level is about 1013 hPa (hectopascals). Most indoor environments will be close to this value.
        ✓ Your current air pressure is {pressure} hPa, which is {getStatusMessage('pressure')}
      </Modal>
    </div>
  );
}