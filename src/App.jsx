import { useState } from 'react'
import Weather from './components/Weather'
import './App.css'

function App() {
  const [city, setCity] = useState('')
  const [submittedCity, setSubmittedCity] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    const trimmed = city.trim()
    if (trimmed) {
      setSubmittedCity(trimmed)
    }
  }

  return (
    <div className="app-container">
      <div className="app-header">
        <h1 className="app-title">
          <span className="title-icon">⛅</span> WeatherPro
        </h1>
        <p className="app-subtitle">Real-time weather for any city in the world</p>
      </div>

      <form className="search-form" onSubmit={handleSearch}>
        <div className="search-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search for a city..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            aria-label="City name"
          />
          <button type="submit" className="search-button" aria-label="Search">
            🔍
          </button>
        </div>
      </form>

      <Weather city={submittedCity} />
    </div>
  )
}

export default App
