// NOTE: OpenWeather API key.
// Keep this private; rotate it if you share the project publicly.
const OPEN_WEATHER_KEY = "78aa7949da5831636075ec1c1f0f2863";

const form = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const geoButton = document.getElementById("geoButton");
const themeToggle = document.getElementById("themeToggle");

const weatherCard = document.getElementById("weatherCard");
const cityNameEl = document.getElementById("cityName");
const countryEl = document.getElementById("country");
const updatedAtEl = document.getElementById("updatedAt");
const temperatureEl = document.getElementById("temperature");
const feelsLikeEl = document.getElementById("feelsLike");
const conditionEl = document.getElementById("condition");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const pressureEl = document.getElementById("pressure");
const minMaxEl = document.getElementById("minMax");
const sunTimesEl = document.getElementById("sunTimes");

const stateSection = document.getElementById("stateSection");
const stateInner = document.getElementById("stateInner");
const stateMessage = document.getElementById("stateMessage");
const spinnerOverlay = document.getElementById("spinnerOverlay");
const weatherIconEl = document.getElementById("weatherIcon");

function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("weather-theme", theme);
    const icon = theme === "light" ? "☀" : "☾";
    themeToggle.querySelector(".theme-icon").textContent = icon;
}

// Initialize theme
(function initTheme() {
    const saved = localStorage.getItem("weather-theme");
    if (saved === "light" || saved === "dark") {
        setTheme(saved);
    } else {
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        setTheme(prefersDark ? "dark" : "light");
    }
})();

// Theme toggle
if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme") || "dark";
        setTheme(current === "dark" ? "light" : "dark");
    });
}

function showState(message, { loading = false, isError = false } = {}) {
    if (!stateMessage) return;
    stateMessage.textContent = message;
    stateMessage.classList.toggle("error", isError);
    stateMessage.hidden = loading;
    if (spinnerOverlay) {
        spinnerOverlay.hidden = !loading;
        if (loading) {
            const spinnerText = spinnerOverlay.querySelector(".spinner-text");
            if (spinnerText) spinnerText.textContent = message;
        }
    }
}

function formatTimeFromUnix(unix, tzOffsetSeconds) {
    if (!unix || typeof unix !== "number") return "—";
    const date = new Date((unix + tzOffsetSeconds) * 1000);
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
}

function formatUpdatedTime(unix, tzOffsetSeconds) {
    if (!unix || typeof unix !== "number") return "Updated just now";
    const localMillis = (unix + tzOffsetSeconds) * 1000;
    const date = new Date(localMillis);
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    return `Updated at ${hours}:${minutes}`;
}

function renderWeather(data) {
    if (!data || !data.main || !data.weather || !data.weather[0]) {
        showState("Unexpected response from server.", { isError: true });
        return;
    }

    const { name, sys, main, weather, wind, dt, timezone } = data;
    const condition = weather[0];

    const temp = Math.round(main.temp);
    const feelsLike = Math.round(main.feels_like);
    const tempMin = Math.round(main.temp_min);
    const tempMax = Math.round(main.temp_max);
    const humidity = Math.round(main.humidity);
    const windSpeed = wind && typeof wind.speed === "number" ? wind.speed : 0;
    const pressure = Math.round(main.pressure);

    cityNameEl.textContent = name || "Unknown";
    countryEl.textContent = sys && sys.country ? sys.country : "";
    updatedAtEl.textContent = formatUpdatedTime(dt, timezone || 0);

    temperatureEl.textContent = `${temp}°C`;
    feelsLikeEl.textContent = `Feels like ${feelsLike}°C`;
    conditionEl.textContent = condition.description
        ? condition.description[0].toUpperCase() + condition.description.slice(1)
        : "—";
    humidityEl.textContent = `${humidity}%`;
    windEl.textContent = `${(windSpeed * 3.6).toFixed(1)} km/h`; // m/s -> km/h
    pressureEl.textContent = `${pressure} hPa`;
    minMaxEl.textContent = `${tempMin}° / ${tempMax}°`;

    // Show weather icon from OpenWeather
    if (weatherIconEl && condition.icon) {
        weatherIconEl.src = `https://openweathermap.org/img/wn/${condition.icon}@2x.png`;
        weatherIconEl.alt = condition.description || "Weather icon";
        weatherIconEl.hidden = false;
    }

    if (sys && typeof sys.sunrise === "number" && typeof sys.sunset === "number") {
        const sunrise = formatTimeFromUnix(sys.sunrise, timezone || 0);
        const sunset = formatTimeFromUnix(sys.sunset, timezone || 0);
        sunTimesEl.textContent = `Sunrise ${sunrise} • Sunset ${sunset}`;
    } else {
        sunTimesEl.textContent = "Sunrise — • Sunset —";
    }

    // Re-trigger card animation by toggling a class
    weatherCard.classList.remove("card-animate");
    requestAnimationFrame(() => {
        weatherCard.classList.add("card-animate");
    });
    weatherCard.hidden = false;
}

async function fetchWeatherByCity(city) {
    if (!OPEN_WEATHER_KEY || OPEN_WEATHER_KEY === "YOUR_API_KEY_HERE") {
        showState("Please set your OpenWeather API key in script.js.", {
            isError: true,
        });
        return;
    }

    const query = encodeURIComponent(city.trim());
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${OPEN_WEATHER_KEY}&units=metric`;

    showState("Fetching latest weather…", { loading: true });

    try {
        const res = await fetch(url);
        if (!res.ok) {
            if (res.status === 404) {
                throw new Error("City not found. Check spelling.");
            }
            throw new Error("Unable to fetch data. Try again.");
        }
        const data = await res.json();
        renderWeather(data);
        showState(`Live weather for ${data.name}, ${data.sys?.country || ""}.`);
    } catch (err) {
        console.error(err);
        showState(err.message || "Something went wrong.", { isError: true });
    } finally {
        if (spinnerOverlay) spinnerOverlay.hidden = true;
        if (stateMessage) stateMessage.hidden = false;
    }
}

async function fetchWeatherByCoords(lat, lon) {
    if (!OPEN_WEATHER_KEY || OPEN_WEATHER_KEY === "YOUR_API_KEY_HERE") {
        showState("Please set your OpenWeather API key in script.js.", {
            isError: true,
        });
        return;
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPEN_WEATHER_KEY}&units=metric`;
    showState("Detecting your location & fetching weather…", { loading: true });

    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error("Unable to fetch data for your location.");
        }
        const data = await res.json();
        renderWeather(data);
        showState(`Live weather for your location: ${data.name}.`);
    } catch (err) {
        console.error(err);
        showState(err.message || "Location-based lookup failed.", { isError: true });
    } finally {
        if (spinnerOverlay) spinnerOverlay.hidden = true;
        if (stateMessage) stateMessage.hidden = false;
    }
}

// Form submit
if (form) {
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const value = cityInput.value.trim();
        if (!value) return;
        fetchWeatherByCity(value);
    });
}

// Geolocation
if (geoButton && "geolocation" in navigator) {
    geoButton.addEventListener("click", () => {
        showState("Requesting location permission…", { loading: true });
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                fetchWeatherByCoords(latitude, longitude);
            },
            (err) => {
                console.error(err);
                showState("Location permission denied or unavailable.", { isError: true });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 600000,
            }
        );
    });
} else if (geoButton) {
    geoButton.disabled = true;
    geoButton.title = "Geolocation not supported in this browser";
}

// Optional: fetch default city on first load (e.g., Delhi)
window.addEventListener("load", () => {
    // Comment this out if you prefer a blank start
    fetchWeatherByCity("Delhi");
});
