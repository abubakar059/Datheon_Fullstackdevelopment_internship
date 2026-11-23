'use strict';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const DEFAULT_CITY = 'Karachi, Pakistan';

const state = {
  location: null,
  weather: null,
  unit: 'C',
  searchResults: [],
  visibleLocations: [],
  activeSuggestionIndex: -1,
  suggestionController: null,
  suggestionTimer: null,
  requestController: null,
  revealObserver: null,
  toastTimer: null
};

const elements = {
  form: document.querySelector('#search-form'),
  input: document.querySelector('#city-input'),
  searchButton: document.querySelector('#search-button'),
  searchFeedback: document.querySelector('#search-feedback'),
  locationChoices: document.querySelector('#location-choices'),
  locationOptions: document.querySelector('#location-options'),
  choicesTitle: document.querySelector('#choices-title'),
  choicesNote: document.querySelector('#choices-note'),
  weatherPanel: document.querySelector('#weather-panel'),
  loadingState: document.querySelector('#loading-state'),
  weatherContent: document.querySelector('#weather-content'),
  locationName: document.querySelector('#location-name'),
  locationRegion: document.querySelector('#location-region'),
  localTime: document.querySelector('#local-time'),
  currentTemperature: document.querySelector('#current-temperature'),
  temperatureUnit: document.querySelector('#temperature-unit'),
  currentCondition: document.querySelector('#current-condition'),
  currentWeatherIcon: document.querySelector('#current-weather-icon'),
  feelsLike: document.querySelector('#feels-like'),
  sunriseSunset: document.querySelector('#sunrise-sunset'),
  daylightLabel: document.querySelector('#daylight-label'),
  humidityValue: document.querySelector('#humidity-value'),
  humidityTrack: document.querySelector('#humidity-track'),
  windValue: document.querySelector('#wind-value'),
  windDirection: document.querySelector('#wind-direction'),
  windNeedle: document.querySelector('#wind-needle'),
  pressureValue: document.querySelector('#pressure-value'),
  precipitationValue: document.querySelector('#precipitation-value'),
  precipitationDetail: document.querySelector('#precipitation-detail'),
  forecastList: document.querySelector('#forecast-list'),
  unitToggle: document.querySelector('#unit-toggle'),
  progressBar: document.querySelector('#scroll-progress-bar'),
  toast: document.querySelector('#toast')
};

const WEATHER_CODES = {
  0: { label: 'Clear sky', kind: 'clear', icon: 'sun' },
  1: { label: 'Mainly clear', kind: 'clear', icon: 'sun-cloud' },
  2: { label: 'Partly cloudy', kind: 'cloud', icon: 'sun-cloud' },
  3: { label: 'Overcast', kind: 'cloud', icon: 'cloud' },
  45: { label: 'Fog', kind: 'cloud', icon: 'fog' },
  48: { label: 'Depositing rime fog', kind: 'cloud', icon: 'fog' },
  51: { label: 'Light drizzle', kind: 'rain', icon: 'drizzle' },
  53: { label: 'Drizzle', kind: 'rain', icon: 'drizzle' },
  55: { label: 'Dense drizzle', kind: 'rain', icon: 'drizzle' },
  56: { label: 'Freezing drizzle', kind: 'rain', icon: 'drizzle' },
  57: { label: 'Freezing drizzle', kind: 'rain', icon: 'drizzle' },
  61: { label: 'Light rain', kind: 'rain', icon: 'rain' },
  63: { label: 'Rain', kind: 'rain', icon: 'rain' },
  65: { label: 'Heavy rain', kind: 'rain', icon: 'rain' },
  66: { label: 'Freezing rain', kind: 'rain', icon: 'rain' },
  67: { label: 'Heavy freezing rain', kind: 'rain', icon: 'rain' },
  71: { label: 'Light snow', kind: 'snow', icon: 'snow' },
  73: { label: 'Snow', kind: 'snow', icon: 'snow' },
  75: { label: 'Heavy snow', kind: 'snow', icon: 'snow' },
  77: { label: 'Snow grains', kind: 'snow', icon: 'snow' },
  80: { label: 'Rain showers', kind: 'rain', icon: 'rain' },
  81: { label: 'Rain showers', kind: 'rain', icon: 'rain' },
  82: { label: 'Heavy showers', kind: 'rain', icon: 'rain' },
  85: { label: 'Snow showers', kind: 'snow', icon: 'snow' },
  86: { label: 'Heavy snow showers', kind: 'snow', icon: 'snow' },
  95: { label: 'Thunderstorm', kind: 'rain', icon: 'storm' },
  96: { label: 'Thunderstorm with hail', kind: 'rain', icon: 'storm' },
  99: { label: 'Thunderstorm with hail', kind: 'rain', icon: 'storm' }
};

const ICONS = {
  sun: '<circle cx="24" cy="24" r="7.5"/><path d="M24 3.5v4M24 40.5v4M3.5 24h4m33 0h4M9.5 9.5l2.8 2.8m23.4 23.4 2.8 2.8m0-29-2.8 2.8M12.3 35.7l-2.8 2.8"/>',
  moon: '<path d="M35.5 29.5A16.5 16.5 0 0 1 18.5 7.8 16.6 16.6 0 1 0 40.2 26c-1.5 1.8-2.9 2.9-4.7 3.5Z"/><path d="M32.5 7.5v4m-2-2h4M39 15v3m-1.5-1.5h3"/>',
  'sun-cloud': '<circle cx="17" cy="15" r="6.2"/><path d="M17 3v2.8M17 24v2M5 15h2.7m18.6 0H29m-20.5-8 2 2m13 13 1.8 1.8m0-16.8-1.8 1.8M10.5 22.5l-2 2"/><path d="M13 37h19a7 7 0 0 0-.5-14 9.5 9.5 0 0 0-18.1 2.6A5.8 5.8 0 0 0 13 37Z"/>',
  cloud: '<path d="M11 35.5h23a8.5 8.5 0 0 0-.5-17 11.3 11.3 0 0 0-21.6 3.1A7 7 0 0 0 11 35.5Z"/>',
  fog: '<path d="M10 28h22a7 7 0 0 0 0-14 9.3 9.3 0 0 0-17.8 2.5A5.7 5.7 0 0 0 10 28Z"/><path d="M7 34h29M11 40h22"/>',
  drizzle: '<path d="M10 27h23a7.5 7.5 0 0 0-.4-15 10 10 0 0 0-19.1 2.7A6.2 6.2 0 0 0 10 27Z"/><path d="m15 33-1 2m9-2-1 2m9-2-1 2"/>',
  rain: '<path d="M10 25h23a7.5 7.5 0 0 0-.4-15 10 10 0 0 0-19.1 2.7A6.2 6.2 0 0 0 10 25Z"/><path d="m15 31-2 5m10-5-2 5m10-5-2 5"/>',
  snow: '<path d="M10 24h23a7.5 7.5 0 0 0-.4-15 10 10 0 0 0-19.1 2.7A6.2 6.2 0 0 0 10 24Z"/><path d="M15 30v9m-3-6 6 3m0-6-6 3m15-3v9m-3-6 6 3m0-6-6 3"/>',
  storm: '<path d="M10 24h23a7.5 7.5 0 0 0-.4-15 10 10 0 0 0-19.1 2.7A6.2 6.2 0 0 0 10 24Z"/><path d="m21 27-5 9h6l-2 8 9-12h-6l3-5"/>'
};

function iconMarkup(name, className = '') {
  const paths = ICONS[name] || ICONS.cloud;
  return `<svg class="${className}" viewBox="0 0 48 48" aria-hidden="true">${paths}</svg>`;
}

function weatherInfo(code, isDay = true) {
  const info = WEATHER_CODES[Number(code)] || { label: 'Variable conditions', kind: 'cloud', icon: 'cloud' };
  if (Number(code) === 0 && !isDay) return { ...info, label: 'Clear night', icon: 'moon' };
  return info;
}

function setLoading(isLoading, message = 'Reading the atmosphere...') {
  elements.weatherPanel.setAttribute('aria-busy', String(isLoading));
  elements.loadingState.hidden = !isLoading;
  elements.weatherContent.classList.toggle('is-dimmed', isLoading);
  elements.searchButton.classList.toggle('is-loading', isLoading);
  elements.searchButton.disabled = isLoading;
  if (isLoading) setSearchMessage(message);
}

function setSearchMessage(message) {
  elements.searchFeedback.textContent = message;
  elements.searchFeedback.classList.remove('is-error');
}

function setSearchError(message) {
  elements.searchFeedback.textContent = message;
  elements.searchFeedback.classList.add('is-error');
}

function closeLocationChoices() {
  elements.locationChoices.hidden = true;
  elements.input.setAttribute('aria-expanded', 'false');
  elements.input.removeAttribute('aria-activedescendant');
  state.activeSuggestionIndex = -1;
}

function cancelSuggestions() {
  window.clearTimeout(state.suggestionTimer);
  state.suggestionTimer = null;
  if (state.suggestionController) {
    state.suggestionController.abort();
    state.suggestionController = null;
  }
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('is-visible');
  window.clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => elements.toast.classList.remove('is-visible'), 2800);
}

async function fetchJson(url, signal) {
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Service responded with ${response.status}. Please try again.`);
  }
  const data = await response.json();
  if (data && data.error) throw new Error(data.reason || 'The weather service could not process this request.');
  return data;
}

async function fetchCityMatches(query, signal, count = 6) {
  const params = new URLSearchParams({ name: query.trim(), count: String(count), language: 'en', format: 'json' });
  const data = await fetchJson(`${GEOCODING_URL}?${params}`, signal);
  return Array.isArray(data.results) ? data.results : [];
}

function scheduleCitySuggestions(query) {
  cancelSuggestions();
  const trimmed = query.trim();
  state.visibleLocations = [];
  closeLocationChoices();

  if (trimmed.length < 2) {
    setSearchMessage('Start with a city name, such as Tokyo or Karachi');
    return;
  }

  state.suggestionTimer = window.setTimeout(() => fetchCitySuggestions(trimmed), 280);
}

async function fetchCitySuggestions(query) {
  if (state.suggestionController) state.suggestionController.abort();
  const controller = new AbortController();
  state.suggestionController = controller;

  try {
    const locations = await fetchCityMatches(query, controller.signal, 6);
    if (elements.input.value.trim().toLowerCase() !== query.toLowerCase()) return;
    state.visibleLocations = locations;
    state.activeSuggestionIndex = locations.length ? 0 : -1;
    renderLocationChoices(locations, { mode: 'suggestions', query });

    if (locations.length) {
      setSearchMessage('Choose a suggested city, or keep typing to refine your search.');
      setActiveSuggestion(0);
    } else {
      setSearchMessage('No matching city found. Try another spelling or add a country.');
    }
  } catch (error) {
    if (error.name !== 'AbortError' && elements.input.value.trim().toLowerCase() === query.toLowerCase()) {
      closeLocationChoices();
      setSearchMessage('City suggestions are unavailable. Press Search to try again.');
    }
  } finally {
    if (state.suggestionController === controller) state.suggestionController = null;
  }
}

async function searchCity(query) {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    setSearchError('Enter at least two characters to search.');
    elements.input.focus();
    return;
  }

  cancelSuggestions();
  if (state.requestController) state.requestController.abort();
  state.requestController = new AbortController();
  const { signal } = state.requestController;
  closeLocationChoices();
  state.visibleLocations = [];
  setLoading(true, 'Finding your location...');

  try {
    const results = await fetchCityMatches(trimmed, signal, 6);
    if (!results.length) {
      throw new Error(`No match found for “${trimmed}”. Try adding a country name.`);
    }

    state.searchResults = results;
    if (results.length > 1) {
      state.visibleLocations = results;
      renderLocationChoices(results, { mode: 'matches', query: trimmed });
      setLoading(false);
      setSearchMessage('Choose the matching city to view its conditions.');
      return;
    }

    await selectLocation(results[0]);
  } catch (error) {
    if (error.name === 'AbortError') return;
    setLoading(false);
    setSearchError(error.message || 'Something went wrong while searching. Please try again.');
  }
}

function locationSubtitle(location) {
  return [location.admin1, location.country].filter(Boolean).filter((part, index, list) => list.indexOf(part) === index).join(', ');
}

function renderLocationChoices(locations, { mode = 'matches', query = '' } = {}) {
  state.visibleLocations = locations;
  state.activeSuggestionIndex = locations.length ? 0 : -1;
  elements.choicesTitle.textContent = mode === 'suggestions' ? 'SUGGESTED LOCATIONS' : 'SELECT A LOCATION';
  elements.choicesNote.textContent = mode === 'suggestions' ? 'LIVE CITY MATCHES' : 'CHOOSE THE RIGHT MATCH';

  if (!locations.length) {
    elements.locationOptions.innerHTML = `<div class="location-empty">No places found for “${escapeHtml(query)}”. Try a different spelling or include the country.</div>`;
  } else {
    elements.locationOptions.innerHTML = locations.map((location, index) => `
      <button class="location-option${index === 0 ? ' is-active' : ''}" id="location-option-${index}" role="option" aria-selected="${index === 0}" type="button" data-location-index="${index}">
        <span><strong>${escapeHtml(location.name)}</strong><small>${escapeHtml(locationSubtitle(location) || 'Location')}</small></span>
        <span class="option-arrow" aria-hidden="true">↗</span>
      </button>
    `).join('');
  }

  elements.locationChoices.hidden = false;
  elements.input.setAttribute('aria-expanded', 'true');
}

function setActiveSuggestion(index) {
  const options = [...elements.locationOptions.querySelectorAll('.location-option')];
  if (!options.length) return;
  state.activeSuggestionIndex = (index + options.length) % options.length;
  options.forEach((option, optionIndex) => {
    const active = optionIndex === state.activeSuggestionIndex;
    option.classList.toggle('is-active', active);
    option.setAttribute('aria-selected', String(active));
  });
  const activeOption = options[state.activeSuggestionIndex];
  if (activeOption) {
    elements.input.setAttribute('aria-activedescendant', activeOption.id);
    activeOption.scrollIntoView({ block: 'nearest' });
  }
}

function chooseVisibleLocation(index) {
  const selected = state.visibleLocations[index];
  if (selected) selectLocation(selected);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

async function selectLocation(location) {
  cancelSuggestions();
  if (state.requestController) state.requestController.abort();
  state.requestController = new AbortController();
  const { signal } = state.requestController;
  state.location = location;
  closeLocationChoices();
  state.visibleLocations = [];
  setLoading(true, `Gathering conditions for ${location.name}...`);

  try {
    const params = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      current: [
        'temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'is_day',
        'precipitation', 'weather_code', 'cloud_cover', 'pressure_msl',
        'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m'
      ].join(','),
      daily: [
        'weather_code', 'temperature_2m_max', 'temperature_2m_min',
        'sunrise', 'sunset', 'precipitation_probability_max', 'wind_speed_10m_max'
      ].join(','),
      forecast_days: '7',
      timezone: 'auto',
      temperature_unit: 'celsius',
      wind_speed_unit: 'kmh'
    });

    const weather = await fetchJson(`${FORECAST_URL}?${params}`, signal);
    if (!weather.current || !weather.daily || !Array.isArray(weather.daily.time)) {
      throw new Error('Weather information is incomplete for this location. Please choose another city.');
    }
    const requiredCurrent = ['temperature_2m', 'relative_humidity_2m', 'wind_speed_10m', 'pressure_msl'];
    const missingCurrent = requiredCurrent.filter((field) => weather.current[field] === undefined || weather.current[field] === null);
    if (missingCurrent.length) throw new Error(`The weather service did not return: ${missingCurrent.join(', ')}. Please try again.`);

    state.weather = weather;
    state.unit = 'C';
    elements.input.value = `${location.name}${location.country ? `, ${location.country}` : ''}`;
    renderWeather();
    setLoading(false);
    setSearchMessage('Weather information updated.');
    observeReveals();
  } catch (error) {
    if (error.name === 'AbortError') return;
    setLoading(false);
    setSearchError(error.message || 'Unable to load weather right now. Please try again.');
  }
}

function convertTemperature(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '--';
  const converted = state.unit === 'F' ? (Number(value) * 9 / 5) + 32 : Number(value);
  return Math.round(converted);
}

function convertWind(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '--';
  return state.unit === 'F' ? (Number(value) * 0.621371).toFixed(1) : Math.round(Number(value));
}

function windUnit() { return state.unit === 'F' ? 'mph' : 'km/h'; }
function temperatureUnit() { return state.unit === 'F' ? '°F' : '°C'; }

function formatClock(isoString) {
  if (!isoString || typeof isoString !== 'string') return '--:--';
  const timePart = isoString.split('T')[1];
  if (!timePart) return '--:--';
  const [hourText, minuteText] = timePart.split(':');
  const hour = Number(hourText);
  if (!Number.isFinite(hour)) return '--:--';
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minuteText || '00'} ${suffix}`;
}

function formatDay(isoDate, index) {
  if (index === 0) return 'TODAY';
  const date = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date).toUpperCase();
}

function getWindDirection(degrees) {
  if (!Number.isFinite(Number(degrees))) return 'Direction unavailable';
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const direction = directions[Math.round(Number(degrees) / 45) % 8];
  return `${direction} wind · ${Math.round(Number(degrees))}°`;
}

function setTheme(kind, isDay) {
  document.body.classList.remove('theme-clear', 'theme-rain', 'theme-cloud', 'theme-snow', 'theme-night');
  if (!isDay) document.body.classList.add('theme-night');
  else if (kind === 'rain') document.body.classList.add('theme-rain');
  else if (kind === 'snow') document.body.classList.add('theme-snow');
  else if (kind === 'cloud') document.body.classList.add('theme-cloud');
  else document.body.classList.add('theme-clear');
}

function renderWeather() {
  const current = state.weather.current;
  const daily = state.weather.daily;
  const location = state.location;
  const todayInfo = weatherInfo(current.weather_code, Boolean(current.is_day));

  elements.locationName.textContent = location.name;
  elements.locationRegion.textContent = [location.admin1, location.country].filter(Boolean).filter((part, index, list) => list.indexOf(part) === index).join(', ');
  elements.localTime.textContent = `${formatClock(current.time)} LOCAL TIME`;
  elements.currentTemperature.textContent = convertTemperature(current.temperature_2m);
  elements.temperatureUnit.textContent = temperatureUnit();
  elements.currentCondition.textContent = todayInfo.label;
  elements.currentWeatherIcon.innerHTML = iconMarkup(todayInfo.icon);
  elements.feelsLike.textContent = `Feels like ${convertTemperature(current.apparent_temperature)}${temperatureUnit()}`;
  elements.sunriseSunset.innerHTML = `Sunrise ${formatClock(daily.sunrise?.[0])}<i></i>Sunset ${formatClock(daily.sunset?.[0])}`;
  elements.daylightLabel.textContent = current.is_day ? 'DAYLIGHT' : 'AFTER DARK';

  const humidity = Number(current.relative_humidity_2m);
  elements.humidityValue.textContent = Number.isFinite(humidity) ? Math.round(humidity) : '--';
  elements.humidityTrack.style.width = `${Math.min(100, Math.max(0, Number.isFinite(humidity) ? humidity : 0))}%`;
  elements.windValue.textContent = convertWind(current.wind_speed_10m);
  elements.windValue.nextElementSibling.textContent = windUnit();
  elements.windDirection.textContent = getWindDirection(current.wind_direction_10m);
  elements.windNeedle.style.transform = `rotate(${Number(current.wind_direction_10m) || 0}deg)`;
  const pressure = Number(current.pressure_msl ?? current.surface_pressure);
  elements.pressureValue.textContent = Number.isFinite(pressure) ? Math.round(pressure) : '--';
  const precipitation = Number(current.precipitation);
  elements.precipitationValue.textContent = Number.isFinite(precipitation) ? precipitation.toFixed(1) : '--';
  const rainChance = daily.precipitation_probability_max?.[0];
  elements.precipitationDetail.textContent = rainChance !== null && rainChance !== undefined
    ? `Rain chance today · ${Math.round(Number(rainChance))}%`
    : 'Current rainfall accumulation';

  setTheme(todayInfo.kind, Boolean(current.is_day));
  renderForecast(daily);
}

function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function renderForecast(daily) {
  const availableDates = Array.isArray(daily.time) ? daily.time : [];
  const fallbackDate = availableDates[0] || (state.weather.current.time || new Date().toISOString()).split('T')[0];
  const dates = Array.from({ length: 5 }, (_, index) => availableDates[index] || addDays(fallbackDate, index));

  const cards = dates.map((date, index) => {
    const hasData = index < availableDates.length;
    const details = hasData ? weatherInfo(daily.weather_code?.[index], true) : { label: 'Forecast unavailable', icon: 'cloud' };
    const highValue = daily.temperature_2m_max?.[index];
    const lowValue = daily.temperature_2m_min?.[index];
    const high = highValue === null || highValue === undefined ? '--' : convertTemperature(highValue);
    const low = lowValue === null || lowValue === undefined ? '--' : convertTemperature(lowValue);
    const rainChance = daily.precipitation_probability_max?.[index];
    const rainLabel = rainChance !== null && rainChance !== undefined
      ? `${Math.round(Number(rainChance))}% rain chance`
      : (hasData ? details.label : 'No forecast data');

    return `
      <article class="forecast-card" aria-label="${formatDay(date, index)} forecast">
        <span class="forecast-day">${formatDay(date, index)}</span>
        <div class="forecast-icon">${iconMarkup(details.icon)}</div>
        <span class="forecast-condition" title="${escapeHtml(details.label)}">${escapeHtml(details.label)}</span>
        <div class="forecast-temps"><strong>${high}${temperatureUnit()}</strong><span>${low}${temperatureUnit()}</span></div>
        <span class="forecast-rain">${escapeHtml(rainLabel)}</span>
      </article>
    `;
  });
  elements.forecastList.innerHTML = cards.join('');
}

function observeReveals() {
  if (state.revealObserver) state.revealObserver.disconnect();
  const revealElements = document.querySelectorAll('.reveal:not(.is-visible)');
  if (!('IntersectionObserver' in window)) {
    revealElements.forEach((element) => element.classList.add('is-visible'));
    return;
  }
  state.revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -25px 0px' });
  revealElements.forEach((element) => state.revealObserver.observe(element));
}

function updateScrollProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  elements.progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
}

function toggleUnit() {
  state.unit = state.unit === 'C' ? 'F' : 'C';
  if (state.weather) renderWeather();
  elements.unitToggle.setAttribute('aria-label', `Switch temperature unit. Current unit: ${state.unit === 'C' ? 'Celsius' : 'Fahrenheit'}`);
  showToast(`Temperature displayed in ${state.unit === 'C' ? 'Celsius' : 'Fahrenheit'}.`);
}

function bindEvents() {
  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!elements.locationChoices.hidden && state.visibleLocations.length) {
      const index = state.activeSuggestionIndex >= 0 ? state.activeSuggestionIndex : 0;
      chooseVisibleLocation(index);
      return;
    }
    searchCity(elements.input.value);
  });

  elements.input.addEventListener('input', () => {
    scheduleCitySuggestions(elements.input.value);
  });

  elements.input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' && !elements.locationChoices.hidden && state.visibleLocations.length) {
      event.preventDefault();
      setActiveSuggestion(state.activeSuggestionIndex + 1);
    } else if (event.key === 'ArrowUp' && !elements.locationChoices.hidden && state.visibleLocations.length) {
      event.preventDefault();
      setActiveSuggestion(state.activeSuggestionIndex - 1);
    } else if (event.key === 'Escape') {
      closeLocationChoices();
      cancelSuggestions();
    }
  });

  elements.locationOptions.addEventListener('click', (event) => {
    const option = event.target.closest('.location-option');
    if (option) chooseVisibleLocation(Number(option.dataset.locationIndex));
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.search-section')) closeLocationChoices();
  });

  elements.unitToggle.addEventListener('click', toggleUnit);
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', updateScrollProgress);
}

function init() {
  bindEvents();
  observeReveals();
  updateScrollProgress();
  elements.input.value = DEFAULT_CITY;
  searchCity(DEFAULT_CITY);
}

document.addEventListener('DOMContentLoaded', init);
