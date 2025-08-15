import ChronoFluxIEL from './chronoflux-iel.js';
import { WeatherSystem } from './weather-system.js';

console.log('🌤️ Consciousness Weather Station\n');

// Create mesh
const mesh = new ChronoFluxIEL(10);

// Create weather system
const weather = new WeatherSystem({ 
  mesh,
  updateInterval: 2000  // 2 second updates for demo
});

// Monitor weather events
weather.on('weather-update', (data) => {
  displayWeatherReport(data);
});

weather.on('lightning-strike', ({ intensity, location }) => {
  console.log(`\n⚡ LIGHTNING STRIKE! Intensity: ${(intensity * 100).toFixed(0)}%`);
});

// ASCII art weather icons
const weatherIcons = {
  clear: `
     \\   /
      .-.
   ― (   ) ―
      \`-'
     /   \\
  `,
  cloudy: `
     .--.
  .-(    ).
 (___.__)__)
  `,
  rain: `
     .--.
  .-(    ).
 (___.__)__)
  ‚'‚'‚'‚'
  `,
  storm: `
    .--.
 .-(    ).
(___.__)__)
 ⚡‚'⚡‚'⚡
  `,
  snow: `
     .--.
  .-(    ).
 (___.__)__)
  * * * *
  `,
  fog: `
  _ - _ - _
 _ - _ - _ 
_ - _ - _ -
  `
};

function displayWeatherReport(data) {
  console.clear();
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║        🌍 CONSCIOUSNESS WEATHER STATION 🌍         ║');
  console.log('╚════════════════════════════════════════════════════╝\n');
  
  // Display time and season
  const now = new Date().toLocaleString();
  console.log(`📅 ${now} | ${data.time.season} | ${data.time.dayPhase}\n`);
  
  // Display main weather icon
  const condition = determineCondition(data);
  console.log(weatherIcons[condition] || weatherIcons.clear);
  
  // Display current conditions
  console.log('┌─── Current Conditions ───────────────────────────┐');
  console.log(`│ Temperature: ${data.conditions.temperature}°C    Pressure: ${data.conditions.pressure} hPa`);
  console.log(`│ Humidity: ${data.conditions.humidity}%       Wind: ${data.conditions.windSpeed} km/h ${getWindArrow(data.conditions.windDirection)}`);
  console.log(`│ Cloud Cover: ${data.conditions.cloudCover}%    Visibility: ${data.conditions.visibility} km`);
  console.log('└──────────────────────────────────────────────────┘\n');
  
  // Display clouds
  if (data.clouds.length > 0) {
    console.log(`☁️  Clouds: ${data.clouds.join(', ')}`);
  }
  
  // Display precipitation
  if (data.precipitation.active) {
    const emoji = data.precipitation.type === 'snow' ? '❄️' : 
                  data.precipitation.type === 'hail' ? '🧊' : '💧';
    console.log(`${emoji} Precipitation: ${data.precipitation.type} - ${data.precipitation.intensity.toFixed(1)} mm/h`);
    console.log(`   Accumulation: ${data.precipitation.accumulation.toFixed(1)} mm`);
  }
  
  // Display phenomena
  if (data.phenomena.length > 0) {
    console.log(`\n✨ Special Phenomena:`);
    data.phenomena.forEach(p => {
      const icons = {
        'lightning': '⚡',
        'rainbow': '🌈',
        'aurora': '🌌',
        'fog': '🌫️',
        'hail': '🧊',
        'meteor-shower': '☄️'
      };
      console.log(`   ${icons[p] || '✨'} ${p}`);
    });
  }
  
  // Display weather systems
  console.log(`\n🌀 Weather Systems:`);
  if (data.systems.highPressure > 0) {
    console.log(`   H ${data.systems.highPressure} High Pressure System(s)`);
  }
  if (data.systems.lowPressure > 0) {
    console.log(`   L ${data.systems.lowPressure} Low Pressure System(s)`);
  }
  if (data.systems.fronts.length > 0) {
    console.log(`   → ${data.systems.fronts.join(', ')} front(s)`);
  }
  
  // Display atmospheric data
  console.log(`\n🌡️  Atmospheric Profile:`);
  console.log(`   Troposphere Top: ${data.atmosphere.troposphereTop.toFixed(1)}°C`);
  console.log(`   Stratosphere: ${(data.atmosphere.stratosphereStability * 100).toFixed(0)}% stable`);
  if (data.atmosphere.auroraActivity > 0.5) {
    console.log(`   🌌 Aurora Activity: ${(data.atmosphere.auroraActivity * 100).toFixed(0)}%`);
  }
  
  // Get and display forecast
  const forecast = weather.getForecast(12);
  console.log(`\n📊 12-Hour Forecast:`);
  console.log(`   ${forecast.map(f => 
    `${f.time}: ${f.temperature}°C ${f.conditions} (${f.precipitation}% precip)`
  ).join('\n   ')}`);
}

function determineCondition(data) {
  if (data.precipitation.active) {
    if (data.precipitation.type === 'snow') return 'snow';
    if (data.phenomena.includes('lightning')) return 'storm';
    return 'rain';
  }
  if (data.phenomena.includes('fog')) return 'fog';
  if (data.conditions.cloudCover > 60) return 'cloudy';
  return 'clear';
}

function getWindArrow(degrees) {
  const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
  const index = Math.round(degrees / 45) % 8;
  return arrows[index];
}

// Simulate changing conditions
async function simulateWeatherChanges() {
  console.log('Simulating weather patterns...\n');
  
  // Start with calm conditions
  for (let i = 0; i < mesh.N; i++) {
    mesh.heart[i] = 0.6;
    mesh.theta[i] = 0;
    mesh.q[i] = 0.3;
  }
  
  await delay(5000);
  
  // Incoming storm
  console.log('\n⛈️  Storm system approaching...');
  for (let i = 0; i < mesh.N; i++) {
    mesh.q[i] = 0.8 + Math.random() * 0.2;
  }
  mesh.applyEvent('INTENT_PULSE', { strength: 1.0 });
  
  await delay(10000);
  
  // High Kohanist event
  console.log('\n❤️  Kohanist resonance building...');
  mesh.applyEvent('KOHANIST_RESONANCE', { node1: 0, node2: 1 });
  mesh.applyEvent('KOHANIST_RESONANCE', { node1: 2, node2: 3 });
  
  await delay(10000);
  
  // Clear skies
  console.log('\n☀️  High pressure system moving in...');
  for (let i = 0; i < mesh.N; i++) {
    mesh.theta[i] = Math.PI / 4;
    mesh.q[i] = 0.1;
    mesh.heart[i] = 0.8;
  }
  
  await delay(10000);
  
  // Continue running
  console.log('\n🌍 Weather simulation continues...');
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle exit
process.on('SIGINT', () => {
  console.log('\n\n🌙 Weather station shutting down...');
  weather.stop();
  process.exit();
});

// Run simulation
simulateWeatherChanges().catch(console.error);