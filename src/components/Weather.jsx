import { useState, useEffect } from 'react'
import './Weather.css'

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY
const API_BASE = 'https://api.openweathermap.org/data/2.5/weather'

const WEATHER_ICONS = {
  '01d': '☀️',
  '01n': '🌙',
  '02d': '🌤️',
  '02n': '🌤️',
  '03d': '☁️',
  '03n': '☁️',
  '04d': '☁️',
  '04n': '☁️',
  '09d': '🌧️',
  '09n': '🌧️',
  '10d': '🌦️',
  '10n': '🌧️',
  '11d': '⛈️',
  '11n': '⛈️',
  '13d': '❄️',
  '13n': '❄️',
  '50d': '🌫️',
  '50n': '🌫️',
}

function getWeatherIcon(iconCode) {
  return WEATHER_ICONS[iconCode] || '🌡️'
}

function getWindDirection(deg) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return directions[Math.round(deg / 45) % 8]
}

export default function Weather({ city }) {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!city) return

    const fetchWeather = async () => {
      setLoading(true)
      setError(null)
      setWeather(null)

      try {
        if (!API_KEY || API_KEY === 'your_openweathermap_api_key_here') {
          throw new Error('API_KEY_MISSING')
        }

        const url = `${API_BASE}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
        const response = await fetch(url)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('CITY_NOT_FOUND')
          } else if (response.status === 401) {
            throw new Error('INVALID_API_KEY')
          } else {
            throw new Error('FETCH_ERROR')
          }
        }

        const data = await response.json()
        setWeather(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [city])

  if (!city) {
    return (
      <div className="weather-placeholder">
        <div className="placeholder-icon">🌍</div>
        <p>Enter a city name above to get started</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="weather-placeholder">
        <div className="loading-spinner"></div>
        <p>Fetching weather data...</p>
      </div>
    )
  }

  if (error) {
    const errorMessages = {
      CITY_NOT_FOUND: {
        icon: '🔍',
        title: 'City not found',
        msg: `We couldn't find "${city}". Check the spelling and try again.`,
      },
      API_KEY_MISSING: {
        icon: '🔑',
        title: 'API key not configured',
        msg: 'Add your OpenWeatherMap API key to a .env file as VITE_WEATHER_API_KEY.',
      },
      INVALID_API_KEY: {
        icon: '🔑',
        title: 'Invalid API key',
        msg: 'The API key is invalid or expired. Please check your .env configuration.',
      },
      FETCH_ERROR: {
        icon: '⚠️',
        title: 'Something went wrong',
        msg: 'Unable to fetch weather data. Please try again later.',
      },
    }

    const errInfo = errorMessages[error] || errorMessages.FETCH_ERROR

    return (
      <div className="weather-error">
        <div className="error-icon">{errInfo.icon}</div>
        <h3>{errInfo.title}</h3>
        <p>{errInfo.msg}</p>
      </div>
    )
  }

  if (!weather) return null

  const {
    name,
    sys: { country },
    main: { temp, feels_like, humidity, temp_min, temp_max },
    weather: [{ description, icon }],
    wind: { speed, deg: windDeg },
    visibility,
    clouds: { all: cloudiness },
  } = weather

  const weatherIcon = getWeatherIcon(icon)
  const windDir = getWindDirection(windDeg ?? 0)

  return (
    <div className="weather-card">
      <div className="weather-location">
        <span className="location-icon">📍</span>
        <span className="location-name">{name}</span>
        <span className="location-country">{country}</span>
      </div>

      <div className="weather-main">
        <div className="weather-icon-large">{weatherIcon}</div>
        <div className="weather-temp">{Math.round(temp)}°C</div>
        <div className="weather-description">{description}</div>
        <div className="weather-feels-like">Feels like {Math.round(feels_like)}°C</div>
      </div>

      <div className="weather-temp-range">
        <span className="temp-high">↑ {Math.round(temp_max)}°C</span>
        <span className="temp-divider">|</span>
        <span className="temp-low">↓ {Math.round(temp_min)}°C</span>
      </div>

      <div className="weather-details">
        <div className="detail-item">
          <span className="detail-icon">💧</span>
          <span className="detail-label">Humidity</span>
          <span className="detail-value">{humidity}%</span>
        </div>
        <div className="detail-item">
          <span className="detail-icon">💨</span>
          <span className="detail-label">Wind</span>
          <span className="detail-value">{speed} m/s {windDir}</span>
        </div>
        <div className="detail-item">
          <span className="detail-icon">☁️</span>
          <span className="detail-label">Clouds</span>
          <span className="detail-value">{cloudiness}%</span>
        </div>
        <div className="detail-item">
          <span className="detail-icon">👁️</span>
          <span className="detail-label">Visibility</span>
          <span className="detail-value">{visibility ? `${(visibility / 1000).toFixed(1)} km` : 'N/A'}</span>
        </div>
      </div>
    </div>
  )
}
