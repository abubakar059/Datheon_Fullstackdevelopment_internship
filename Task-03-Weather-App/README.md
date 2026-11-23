# Task 03 — Atmos Weather App

Atmos is a responsive global weather dashboard built for quickly understanding current conditions and the five-day forecast. Its interface uses a cool, weather-inspired palette, a prominent current-conditions panel, compact measurement cards, and a clear daily forecast layout.

## Features

- Search for cities around the world using live, debounced location suggestions as you type.
- Navigate city suggestions with the keyboard or choose them with the mouse; choose between matching locations when a city name is ambiguous.
- View current temperature, feels-like temperature, weather conditions, humidity, wind speed and direction, atmospheric pressure, current rainfall, and today’s precipitation probability.
- See sunrise and sunset times in the selected location's local time.
- Browse five forecast days with weather icons, daily highs and lows, and precipitation probability; the layout keeps all five days available on desktop and mobile.
- Switch between Celsius and Fahrenheit (wind speed switches between km/h and mph).
- Weather-responsive current-conditions panel for clear, cloudy, rainy, snowy, and nighttime conditions.
- Loading indicators, invalid-city messages, and network/API error handling.
- Responsive layout, subtle hover states, smooth transitions, scroll progress, and scroll-triggered reveal animations.
- Accessible labels, keyboard focus styles, and reduced-motion support.

## Technologies

- HTML5
- CSS3 (Grid, Flexbox, transitions, keyframe animations, responsive media queries)
- Vanilla JavaScript (ES6+, async/await, Fetch API, DOM manipulation)
- Open-Meteo Geocoding API and Forecast API

## Run locally

No build tools, package installation, or API key are required.

1. Open the `Task-03-Weather-App` folder in Visual Studio Code.
2. Open `index.html` with the VS Code Live Server extension, or open the file directly in a browser.
3. Search for a city such as `Karachi`, `Tokyo`, `Paris`, or `New York`.

The app needs an internet connection to retrieve location and weather data.

## Weather data

Atmos uses the Open-Meteo Geocoding API to resolve city names to coordinates and the Open-Meteo Forecast API to retrieve current conditions and daily forecast values. The app requests a seven-day response window to ensure the next five forecast days are available, then displays exactly five daily cards. The displayed current conditions are the provider's latest model-based weather data, not a guarantee of a direct observation from a nearby weather station.

- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)
- [Open-Meteo Forecast API](https://open-meteo.com/en/docs)

Weather data provided by [Open-Meteo](https://open-meteo.com/). Location data is based on GeoNames. Please review the provider's terms and attribution requirements before deploying the project commercially.

## Project structure

```text
Task-03-Weather-App/
├── index.html
├── styles.css
├── app.js
└── README.md
```
