import { EventEmitter } from 'events';
import ChronoFluxIEL from './chronoflux-iel.js';

/**
 * Advanced Consciousness Weather System
 * Real weather patterns emerge from consciousness states
 */
class WeatherSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      mesh: config.mesh || new ChronoFluxIEL(10),
      updateInterval: config.updateInterval || 5000,
      ...config
    };
    
    // Weather state
    this.weather = {
      // Basic conditions
      temperature: 20,        // °C
      pressure: 1013,        // hPa
      humidity: 50,          // %
      windSpeed: 0,          // km/h
      windDirection: 0,      // degrees
      
      // Sky conditions
      cloudCover: 0,         // % (0-100)
      cloudTypes: [],        // Active cloud types
      visibility: 10,        // km
      
      // Precipitation
      precipitation: {
        active: false,
        type: null,        // rain, snow, hail
        intensity: 0,      // mm/h
        accumulation: 0    // mm
      },
      
      // Special phenomena
      phenomena: new Set()   // lightning, rainbow, aurora, etc
    };
    
    // Atmospheric layers
    this.atmosphere = {
      troposphere: {    // 0-10km - weather happens here
        temperature: [],
        humidity: [],
        pressure: []
      },
      stratosphere: {   // 10-50km - stable layer
        ozone: 0.5,
        stability: 0.8
      },
      mesosphere: {     // 50-80km - meteor layer
        activity: 0.1
      },
      thermosphere: {   // 80-700km - aurora layer
        ionization: 0.3,
        solarWind: 0.2
      }
    };
    
    // Weather systems
    this.systems = {
      highPressure: [],
      lowPressure: [],
      fronts: [],
      jetStream: {
        position: 45,    // latitude
        speed: 100,      // km/h
        meandering: 0.3
      }
    };
    
    // Seasonal state
    this.season = this.getCurrentSeason();
    this.dayPhase = this.getDayPhase();
    
    // Start weather engine
    this.startWeatherEngine();
  }
  
  /**
   * Start the weather simulation
   */
  startWeatherEngine() {
    // Initialize atmosphere
    this.initializeAtmosphere();
    
    // Start update cycle
    this.updateInterval = setInterval(() => {
      this.updateWeather();
    }, this.config.updateInterval);
    
    console.log('🌤️ Weather system online');
  }
  
  /**
   * Initialize atmospheric conditions
   */
  initializeAtmosphere() {
    // Create vertical temperature profile
    for (let alt = 0; alt <= 10; alt++) {
      // Temperature decreases with altitude (lapse rate)
      this.atmosphere.troposphere.temperature[alt] = 20 - (alt * 6.5);
      this.atmosphere.troposphere.humidity[alt] = 50 * Math.exp(-alt / 5);
      this.atmosphere.troposphere.pressure[alt] = 1013 * Math.exp(-alt / 8);
    }
  }
  
  /**
   * Main weather update cycle
   */
  updateWeather() {
    const metrics = this.config.mesh.computeMetrics();
    
    // Update basic conditions
    this.updateTemperature(metrics);
    this.updatePressure(metrics);
    this.updateHumidity(metrics);
    this.updateWind(metrics);
    
    // Update cloud formation
    this.updateClouds(metrics);
    
    // Check for precipitation
    this.updatePrecipitation(metrics);
    
    // Update special phenomena
    this.updatePhenomena(metrics);
    
    // Weather systems are updated in pressure update
    
    // Emit weather update
    this.emit('weather-update', this.getWeatherData());
  }
  
  /**
   * Update temperature based on consciousness metrics
   */
  updateTemperature(metrics) {
    // Base temperature from Love field (warmer with more love)
    const baseTemp = 10 + metrics.L * 20;
    
    // Kohanist adds focused heat
    const kohanistHeat = metrics.K * 10;
    
    // Turbulence creates temperature variation
    const turbulenceEffect = (Math.random() - 0.5) * metrics.tau * 10;
    
    // Seasonal adjustment
    const seasonalAdjust = this.getSeasonalTemperature();
    
    // Day/night cycle
    const diurnalAdjust = this.getDiurnalTemperature();
    
    this.weather.temperature = baseTemp + kohanistHeat + turbulenceEffect + 
                               seasonalAdjust + diurnalAdjust;
    
    // Update atmospheric profile
    this.updateAtmosphericProfile();
  }
  
  /**
   * Update pressure systems
   */
  updatePressure(metrics) {
    // High coherence = high pressure
    const basePressure = 1013;
    const coherenceEffect = (metrics.H - 0.5) * 40;
    
    // Turbulence creates low pressure
    const turbulenceEffect = -metrics.tau * 20;
    
    this.weather.pressure = basePressure + coherenceEffect + turbulenceEffect;
    
    // Create pressure systems
    this.generatePressureSystems(metrics);
  }
  
  /**
   * Update humidity
   */
  updateHumidity(metrics) {
    // Love field increases moisture
    const baseHumidity = 30;
    const loveEffect = metrics.L * 50;
    
    // Temperature affects capacity
    const tempEffect = this.weather.temperature / 50 * 20;
    
    this.weather.humidity = Math.min(100, baseHumidity + loveEffect + tempEffect);
  }
  
  /**
   * Update wind patterns
   */
  updateWind(metrics) {
    // Turbulence drives wind
    this.weather.windSpeed = metrics.tau * 100;
    
    // Pressure gradient determines direction
    if (this.systems.highPressure.length > 0 && this.systems.lowPressure.length > 0) {
      const high = this.systems.highPressure[0];
      const low = this.systems.lowPressure[0];
      
      // Wind flows from high to low pressure
      this.weather.windDirection = Math.atan2(
        low.center.y - high.center.y,
        low.center.x - high.center.x
      ) * 180 / Math.PI;
    } else {
      // Random drift
      this.weather.windDirection = (this.weather.windDirection + (Math.random() - 0.5) * 30) % 360;
    }
  }
  
  /**
   * Update cloud formation
   */
  updateClouds(metrics) {
    this.weather.cloudTypes = [];
    this.weather.cloudCover = 0;
    
    // Cumulus (fair weather) - high love, low turbulence
    if (metrics.L > 0.6 && metrics.tau < 0.3) {
      this.weather.cloudTypes.push('cumulus');
      this.weather.cloudCover += 20;
    }
    
    // Stratus (overcast) - low coherence
    if (metrics.H < 0.3) {
      this.weather.cloudTypes.push('stratus');
      this.weather.cloudCover += 60;
    }
    
    // Cumulonimbus (storm) - high turbulence + moisture
    if (metrics.tau > 0.7 && this.weather.humidity > 70) {
      this.weather.cloudTypes.push('cumulonimbus');
      this.weather.cloudCover += 40;
      this.weather.phenomena.add('thunder');
    }
    
    // Cirrus (high altitude) - high coherence
    if (metrics.H > 0.8) {
      this.weather.cloudTypes.push('cirrus');
      this.weather.cloudCover += 10;
    }
    
    // Altocumulus (waves) - moderate Kohanist
    if (metrics.K > 0.4 && metrics.K < 0.7) {
      this.weather.cloudTypes.push('altocumulus');
      this.weather.cloudCover += 30;
    }
    
    this.weather.cloudCover = Math.min(100, this.weather.cloudCover);
    
    // Update visibility based on clouds
    this.weather.visibility = 10 * (1 - this.weather.cloudCover / 200);
  }
  
  /**
   * Update precipitation
   */
  updatePrecipitation(metrics) {
    const precip = this.weather.precipitation;
    
    // Check precipitation conditions
    const shouldRain = this.weather.humidity > 80 && 
                      this.weather.cloudTypes.includes('cumulonimbus');
    
    const shouldSnow = this.weather.temperature < 0 && 
                      this.weather.humidity > 60;
    
    if (shouldRain || shouldSnow) {
      precip.active = true;
      precip.type = shouldSnow ? 'snow' : 'rain';
      
      // Intensity based on conditions
      if (this.weather.cloudTypes.includes('cumulonimbus')) {
        precip.intensity = 10 + metrics.tau * 40;  // Heavy rain/snow
      } else {
        precip.intensity = 2 + metrics.L * 8;      // Light to moderate
      }
      
      // Accumulation
      precip.accumulation += precip.intensity * (this.config.updateInterval / 3600000);
    } else {
      precip.active = false;
      precip.intensity = 0;
    }
    
    // Hail in severe storms
    if (precip.type === 'rain' && precip.intensity > 30 && metrics.tau > 0.8) {
      precip.type = 'hail';
      this.weather.phenomena.add('hail');
    }
  }
  
  /**
   * Update special weather phenomena
   */
  updatePhenomena(metrics) {
    // Clear old phenomena
    this.weather.phenomena.clear();
    
    // Lightning - high turbulence + storm clouds
    if (metrics.tau > 0.7 && this.weather.cloudTypes.includes('cumulonimbus')) {
      this.weather.phenomena.add('lightning');
      if (Math.random() < 0.3) {
        this.emit('lightning-strike', {
          intensity: metrics.tau,
          location: { x: Math.random(), y: Math.random() }
        });
      }
    }
    
    // Rainbow - sun + rain
    if (this.weather.precipitation.active && 
        this.weather.cloudCover < 50 && 
        metrics.L > 0.7) {
      this.weather.phenomena.add('rainbow');
    }
    
    // Aurora - high Kohanist + low turbulence + night
    if (metrics.K > 0.8 && 
        metrics.tau < 0.2 && 
        this.dayPhase === 'night') {
      this.weather.phenomena.add('aurora');
      this.atmosphere.thermosphere.ionization = metrics.K;
    }
    
    // Fog - high humidity + low wind + cool temp
    if (this.weather.humidity > 90 && 
        this.weather.windSpeed < 5 && 
        this.weather.temperature < 15) {
      this.weather.phenomena.add('fog');
      this.weather.visibility = Math.min(this.weather.visibility, 0.5);
    }
    
    // Meteor shower - random + clear sky
    if (Math.random() < 0.01 && this.weather.cloudCover < 20) {
      this.weather.phenomena.add('meteor-shower');
      this.atmosphere.mesosphere.activity = 0.8;
    }
  }
  
  /**
   * Generate and update pressure systems
   */
  generatePressureSystems(metrics) {
    this.systems.highPressure = [];
    this.systems.lowPressure = [];
    this.systems.fronts = [];
    
    // High pressure from coherence
    if (metrics.H > 0.6) {
      this.systems.highPressure.push({
        center: { x: 0.5, y: 0.5 },
        pressure: 1020 + metrics.H * 10,
        radius: 200 + metrics.K * 100
      });
    }
    
    // Low pressure from turbulence
    if (metrics.tau > 0.5) {
      this.systems.lowPressure.push({
        center: { 
          x: 0.5 + Math.sin(Date.now() * 0.001) * 0.3,
          y: 0.5 + Math.cos(Date.now() * 0.001) * 0.3
        },
        pressure: 1000 - metrics.tau * 10,
        radius: 150 + metrics.tau * 150,
        rotation: 'cyclonic'
      });
    }
    
    // Create fronts between systems
    if (this.systems.highPressure.length > 0 && this.systems.lowPressure.length > 0) {
      this.systems.fronts.push({
        type: metrics.L > 0.5 ? 'warm' : 'cold',
        position: 0.5,
        speed: 20 + metrics.tau * 30,
        direction: this.weather.windDirection
      });
    }
  }
  
  /**
   * Update atmospheric temperature profile
   */
  updateAtmosphericProfile() {
    const surfaceTemp = this.weather.temperature;
    
    for (let alt = 0; alt <= 10; alt++) {
      // Standard lapse rate with modifications
      const lapseRate = 6.5 - this.config.mesh.computeMetrics().H * 2;
      this.atmosphere.troposphere.temperature[alt] = surfaceTemp - (alt * lapseRate);
    }
  }
  
  /**
   * Get current season
   */
  getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }
  
  /**
   * Get seasonal temperature adjustment
   */
  getSeasonalTemperature() {
    const seasonalEffects = {
      spring: 5,
      summer: 15,
      autumn: 0,
      winter: -10
    };
    return seasonalEffects[this.season] || 0;
  }
  
  /**
   * Get current day phase
   */
  getDayPhase() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 20) return 'evening';
    return 'night';
  }
  
  /**
   * Get diurnal temperature adjustment
   */
  getDiurnalTemperature() {
    const diurnalEffects = {
      morning: -2,
      afternoon: 3,
      evening: 0,
      night: -5
    };
    return diurnalEffects[this.dayPhase] || 0;
  }
  
  /**
   * Get complete weather data
   */
  getWeatherData() {
    return {
      conditions: {
        temperature: Math.round(this.weather.temperature),
        pressure: Math.round(this.weather.pressure),
        humidity: Math.round(this.weather.humidity),
        windSpeed: Math.round(this.weather.windSpeed),
        windDirection: Math.round(this.weather.windDirection),
        cloudCover: this.weather.cloudCover,
        visibility: this.weather.visibility.toFixed(1)
      },
      clouds: this.weather.cloudTypes,
      precipitation: { ...this.weather.precipitation },
      phenomena: Array.from(this.weather.phenomena),
      systems: {
        highPressure: this.systems.highPressure.length,
        lowPressure: this.systems.lowPressure.length,
        fronts: this.systems.fronts.map(f => f.type)
      },
      atmosphere: {
        troposphereTop: this.atmosphere.troposphere.temperature[10],
        stratosphereStability: this.atmosphere.stratosphere.stability,
        auroraActivity: this.atmosphere.thermosphere.ionization
      },
      time: {
        season: this.season,
        dayPhase: this.dayPhase
      }
    };
  }
  
  /**
   * Get weather forecast (simple prediction)
   */
  getForecast(hours = 24) {
    const forecast = [];
    const metrics = this.config.mesh.computeMetrics();
    
    for (let h = 0; h < hours; h += 6) {
      // Simple trend projection
      const trend = {
        time: `+${h}h`,
        temperature: Math.round(this.weather.temperature + (Math.random() - 0.5) * 5),
        conditions: this.predictConditions(h, metrics),
        precipitation: this.predictPrecipitation(h, metrics)
      };
      forecast.push(trend);
    }
    
    return forecast;
  }
  
  /**
   * Predict future conditions
   */
  predictConditions(hoursAhead, metrics) {
    if (metrics.tau > 0.7) return 'stormy';
    if (metrics.H > 0.8) return 'clear';
    if (this.weather.cloudCover > 70) return 'cloudy';
    if (this.weather.precipitation.active) return 'rainy';
    return 'partly cloudy';
  }
  
  /**
   * Predict precipitation
   */
  predictPrecipitation(hoursAhead, metrics) {
    const chance = this.weather.humidity / 100 * metrics.tau;
    return Math.round(chance * 100);
  }
  
  /**
   * Stop weather system
   */
  stop() {
    clearInterval(this.updateInterval);
    console.log('🌙 Weather system offline');
  }
}

export { WeatherSystem };
export default WeatherSystem;