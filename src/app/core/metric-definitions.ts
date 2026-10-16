import { GasDefinition, MetricDefinition } from './models';

/**
 * Everything the app knows about each gas: copy, scale and thresholds.
 * Thresholds are general indoor guidelines; tune them once the device is calibrated.
 */
export const GAS_DEFINITIONS: GasDefinition[] = [
  {
    id: 'co',
    name: 'Carbon monoxide',
    unit: 'ppm',
    about:
      'A colorless, odorless gas from combustion: cars, stoves and heaters. High levels can cause headaches and dizziness.',
    typical: 'Below 9 ppm (8-hour average)',
    read: (s) => s.coPpm,
    scale: {
      min: 0,
      max: 50,
      zones: [
        { from: 0, to: 9, tone: 'good', status: 'Safe', advice: '' },
        {
          from: 9,
          to: 50,
          tone: 'alert',
          status: 'Above safe level',
          advice:
            'Check fuel-burning appliances and ventilate now. If anyone feels headaches or dizziness, get to fresh air and make sure a CO alarm is working.',
        },
      ],
    },
  },
  {
    id: 'isoprene',
    name: 'Isoprene',
    unit: 'ppb',
    about:
      'A natural compound given off by plants and people. Elevated levels can point to poor ventilation or a nearby chemical source.',
    typical: 'Below 1 ppb in clean outdoor air',
    read: (s) => s.isoprenePpb,
    scale: {
      min: 0,
      max: 10,
      zones: [
        { from: 0, to: 1, tone: 'good', status: 'Normal', advice: '' },
        {
          from: 1,
          to: 10,
          tone: 'watch',
          status: 'Higher than normal',
          advice: 'Ventilate the room. Elevated isoprene can point to poor airflow or a nearby chemical source.',
        },
      ],
    },
  },
  {
    id: 'ethane',
    name: 'Ethane',
    unit: 'ppb',
    about: 'A hydrocarbon linked to fuel combustion and emissions. It can signal fuel or exhaust getting indoors.',
    typical: 'Under 2 ppb in clean air',
    read: (s) => s.ethanePpb,
    scale: {
      min: 0,
      max: 15,
      zones: [
        { from: 0, to: 2, tone: 'good', status: 'Normal', advice: '' },
        {
          from: 2,
          to: 15,
          tone: 'watch',
          status: 'Higher than normal',
          advice: 'Ventilate and check for fuel or exhaust getting in, for example from a garage or a busy road.',
        },
      ],
    },
  },
];

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  {
    id: 'co2',
    label: 'Carbon dioxide',
    shortLabel: 'CO₂',
    unit: 'ppm',
    decimals: 0,
    icon: 'co2',
    summary: 'From breathing and burning fuel.',
    about: 'Carbon dioxide is a naturally occurring gas produced when we breathe and burn fuels.',
    whyItMatters:
      'Indoors, rising CO₂ usually means poor ventilation or a crowded room. High concentrations can cause fatigue, headaches and trouble concentrating.',
    healthyRange: 'Below 1,000 ppm is considered good. 400–800 ppm is typical for a well-ventilated room.',
    read: (s) => s.co2Ppm,
    scale: {
      min: 0,
      max: 2000,
      zones: [
        {
          from: 0,
          to: 1000,
          tone: 'good',
          status: 'Good',
          advice: 'Keep doing what you are doing. If it climbs past 1,000 ppm, open a window or run a fan.',
        },
        {
          from: 1000,
          to: 1500,
          tone: 'watch',
          status: 'Stuffy',
          advice: 'Open a window or run a fan for 10 to 15 minutes to bring in fresh air.',
        },
        {
          from: 1500,
          to: 2000,
          tone: 'alert',
          status: 'Poor ventilation',
          advice: 'Ventilate now: open windows on opposite sides of the room and take a break outside.',
        },
      ],
    },
  },
  {
    id: 'temperature',
    label: 'Temperature',
    shortLabel: 'Temperature',
    unit: '°C',
    decimals: 1,
    icon: 'temperature',
    summary: 'How warm or cool the air feels.',
    about:
      'Temperature shows how warm or cool the air is. It affects comfort, energy use and how pollutants move.',
    whyItMatters:
      'Extreme temperatures stress the body and change air quality, for example by speeding up off-gassing from furniture and paint.',
    healthyRange: 'Between 68–75°F (20–24°C) indoors is ideal for most people.',
    read: (s) => s.temperatureC,
    scale: {
      min: 10,
      max: 32,
      zones: [
        {
          from: 10,
          to: 20,
          tone: 'watch',
          status: 'A bit cool',
          advice: 'Nudge the thermostat up a degree or two to reach 68°F (20°C).',
        },
        {
          from: 20,
          to: 24,
          tone: 'good',
          status: 'Comfortable',
          advice: 'Nothing to do. This is the comfort range for most people.',
        },
        {
          from: 24,
          to: 32,
          tone: 'watch',
          status: 'A bit warm',
          advice: 'Lower the thermostat, close blinds in direct sun, or open a window if it is cooler outside.',
        },
      ],
    },
  },
  {
    id: 'humidity',
    label: 'Humidity',
    shortLabel: 'Humidity',
    unit: '%',
    decimals: 0,
    icon: 'humidity',
    summary: 'How much water vapor is in the air.',
    about: 'Humidity measures the amount of water vapor in the air, shown as relative humidity.',
    whyItMatters:
      'High humidity can lead to mold and stuffy air. Low humidity can cause dry skin, irritation and static electricity.',
    healthyRange: 'Between 30–50% relative humidity keeps the air comfortable and healthy.',
    read: (s) => s.humidityPct,
    scale: {
      min: 0,
      max: 100,
      zones: [
        {
          from: 0,
          to: 30,
          tone: 'watch',
          status: 'Dry',
          advice: 'Use a humidifier, or dry laundry indoors, to bring it up to 30–50%.',
        },
        {
          from: 30,
          to: 50,
          tone: 'good',
          status: 'Comfortable',
          advice: 'Nothing to do. Humidity is in the healthy range.',
        },
        {
          from: 50,
          to: 70,
          tone: 'watch',
          status: 'Humid',
          advice: 'Open a window, run the bathroom or kitchen fan, or use a dehumidifier until it drops below 50%.',
        },
        {
          from: 70,
          to: 100,
          tone: 'alert',
          status: 'Very humid',
          advice: 'Run a dehumidifier and ventilate. Humidity this high for long periods encourages mold.',
        },
      ],
    },
  },
  {
    id: 'pressure',
    label: 'Air pressure',
    shortLabel: 'Pressure',
    unit: 'hPa',
    decimals: 0,
    icon: 'pressure',
    summary: 'Affects ventilation and how pollutants move.',
    about: 'Air pressure is the weight of the air around you, measured in hectopascals (hPa).',
    whyItMatters: 'Pressure changes affect how air flows through your home and how pollutants spread or settle.',
    healthyRange: 'About 1013 hPa is standard at sea level. Swings of a few hPa from day to day are normal.',
    read: (s) => s.pressureHpa,
    scale: {
      min: 950,
      max: 1050,
      zones: [
        {
          from: 950,
          to: 990,
          tone: 'watch',
          status: 'Low',
          advice: 'Low pressure often comes with stormy weather. Nothing to do indoors.',
        },
        {
          from: 990,
          to: 1030,
          tone: 'good',
          status: 'Normal',
          advice: 'Nothing to do. This reading is mostly useful as context for the others.',
        },
        {
          from: 1030,
          to: 1050,
          tone: 'watch',
          status: 'High',
          advice: 'High pressure can keep pollutants close to the ground. Ventilate when the outdoor air is clean.',
        },
      ],
    },
  },
  {
    id: 'gases',
    label: 'Gases',
    shortLabel: 'Gases',
    unit: 'ppm',
    decimals: 0,
    icon: 'gases',
    summary: 'Carbon monoxide, isoprene and ethane.',
    about: 'Your monitor tracks several gases that reveal air quality and possible pollution sources.',
    whyItMatters:
      'These gases often come from combustion: stoves, heaters, car exhaust or nearby traffic. Some are harmful even at low levels.',
    healthyRange: 'Carbon monoxide below 9 ppm. Isoprene usually below 1 ppb and ethane under 2 ppb in clean air.',
    // The gauge for the group shows carbon monoxide, the most important of the three.
    read: (s) => s.coPpm,
    scale: GAS_DEFINITIONS[0].scale,
  },
];
