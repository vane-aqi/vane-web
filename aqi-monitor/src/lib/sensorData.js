let latestData = {
  bme680: {
    temperature: null,
    humidity: null,
    pressure: null,
    gasResistance: null
  },
  scd41: {
    co2: null,
    temperature: null,
    humidity: null
  },
  timestamp: null
};

export function getData() {
  return latestData;
}

export function setData(data) {
  latestData = {
    ...data,
    timestamp: new Date().toISOString()
  };
  return latestData;
}
