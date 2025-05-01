//  ***IMPORTANT:  You MUST get your own API keys for OpenCage and Open-Meteo to use this!***
//  Replace the placeholders below with your actual API keys.

const OPEN_METEO_API_URL = 'https://api.open-meteo.com/v1/forecast';
const OPEN_CAGE_API_KEY = 'YOUR_OPENCAGE_API_KEY'; //  Get your API key from OpenCage
const DEFAULT_CITY = 'Vilnius';

const iconMap = {
    0: 'https://raw.githubusercontent.com/basmilius/weather-icons/master/production/fill/all/clear-day.svg',
    1: 'https://raw.githubusercontent.com/basmilius/weather-icons/master/production/fill/all/partly-cloudy-day.svg',
    2: 'https://raw.githubusercontent.com/basmilius/weather-icons/master/production/fill/all/cloudy-day.svg',
    3: 'https://raw.githubusercontent.com/basmilius/weather-icons/master/production/fill/all/cloudy.svg',
    45: 'https://raw.githubusercontent.com/basmilius/weather-icons/master/production/fill/all/fog.svg',
    51: 'https://raw.githubusercontent.com/basmilius/weather-icons/master/production/fill/all/rain.svg',
    56: 'https://raw.githubusercontent.com/basmilius/weather-icons/master/production/fill/all/rain.svg', // Drizzle
    61: 'https://raw.githubusercontent.com/basmilius/weather-icons/master/production/fill/all/rain.svg',
    66: 'https://raw.githubusercontent.com/basmilius/weather-icons/master/production/fill/all/rain.svg', // Freezing Rain
    71: 'https://raw.githubusercontent.com/basmilius/weather-icons/master/production/fill/all/snow.svg',
    80: 'https://raw.githubusercontent.com/basmilius/weather-icons/master/production/fill/all/rain.svg', // Rain Showers
    95: 'https://raw.githubusercontent.com/basmilius/weather-icons/master/production/fill/all/thunderstorms.svg',
    99: 'https://raw.githubusercontent.com/basmilius/weather-icons/master/production/fill/all/thunderstorms.svg',
    // Add more as needed
    'na': 'https://raw.githubusercontent.com/basmilius/weather-icons/master/production/fill/all/not-available.svg'
};

const conditionMap = {
    0: 'Giedra',
    1: 'Saulėta',
    2: 'Debesuota su pragiedruliais',
    3: 'Debesuota',
    45: 'Rūkas',
    51: 'Lietus',
    56: 'Dulksna',
    61: 'Lietus',
    66: 'Šalantis lietus',
    71: 'Sniegas',
    80: 'Lietus su perkūnija',
    95: 'Perkūnija',
    99: 'Perkūnija',
    // Add more as needed
    'na': 'Nėra duomenų'
};


async function geocodeCity(city) {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(city)}&key=${OPEN_CAGE_API_KEY}&language=lt&limit=1`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Geocoding klaida');
        const data = await response.json();
        if (data.results.length > 0) {
            const { lat, lng } = data.results[0].geometry;
            return { lat, lon: lng };
        } else {
            throw new Error('Miestas nerastas');
        }
    } catch (error) {
        console.error(error);
        alert('Nepavyko rasti miesto koordinačių.');
        return null;
    }
}

async function fetchForecast(lat, lon) {
    const url = `${OPEN_METEO_API_URL}?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('API klaida');
        return response.json();
    } catch (error) {
        console.error(error);
        alert('Nepavyko gauti orų duomenų.');
        return null;
    }
}

function updateCurrentWeather(data, cityName) {
    if (!data || !data.current_weather) return;

    const now = data.current_weather;
    document.getElementById('city-name').textContent = cityName;
    document.getElementById('current-date').textContent = new Date(now.time * 1000).toLocaleDateString('lt-LT', { weekday: 'long', month: 'long', day: 'numeric' });
    document.getElementById('temperature').textContent = `${Math.round(now.temperature)}°C`;
    document.getElementById('wind-speed').textContent = `${now.windspeed} m/s`;

    const conditionCode = now.weathercode;
    document.getElementById('condition-icon').src = iconMap[conditionCode] || iconMap['na'];
    document.getElementById('condition-icon').alt = conditionMap[conditionCode] || 'Oro sąlygos';
    document.getElementById('condition-text').textContent = conditionMap[conditionCode] || 'Nežinoma';

    // Optional fields -  Open-Meteo free tier has limited data
    document.getElementById('feels-like').textContent = '--°C';
    document.getElementById('humidity').textContent = '--%';
    document.getElementById('precipitation').textContent = '-- mm';
    document.getElementById('sunrise').textContent = '--';
    document.getElementById('sunset').textContent = '--';
}

function updateHourlyForecast(data) {
    if (!data || !data.hourly) return;

    const hourlyDiv = document.getElementById('hourly-forecast');
    hourlyDiv.innerHTML = '';
    const hours = data.hourly.time.slice(0, 24).map((t, i) => ({ time: t, temperature: data.hourly.temperature_2m[i], weathercode: data.hourly.weathercode[i] }));

    hours.forEach(hour => {
        const div = document.createElement('div');
        div.className = 'hour-card';
        div.innerHTML = `
            <div>${new Date(hour.time).toLocaleTimeString('lt-LT', { hour: '2-digit', minute: '2-digit' })}</div>
            <img src="${iconMap[hour.weathercode] || iconMap['na']}" alt="${conditionMap[hour.weathercode] || 'Oras'}">
            <div>${Math.round(hour.temperature)}°C</div>
        `;
        hourlyDiv.appendChild(div);
    });
}

function updateDailyForecast(data) {
    if (!data || !data.daily) return;

    const dailyDiv = document.getElementById('daily-forecast');
    dailyDiv.innerHTML = '';
    const days = data.daily.time.map((t, i) => ({ time: t, weathercode: data.daily.weathercode[i], temp_max: data.daily.temperature_2m_max[i], temp_min: data.daily.temperature_2m_min[i] }));

    days.forEach(day => {
        const date = new Date(day.time);
        const div = document.createElement('div');
        div.className = 'day-card';
        div.innerHTML = `
            <div>${date.toLocaleDateString('lt-LT', { weekday: 'short' })}</div>
            <img src="${iconMap[day.weathercode] || iconMap['na']}" alt="${conditionMap[day.weathercode] || 'Oras'}">
            <div>${conditionMap[day.weathercode] || '---'}</div>
            <div><strong>${Math.round(day.temp_max)}°</strong> / ${Math.round(day.temp_min)}°</div>
        `;
        dailyDiv.appendChild(div);
    });
}

function updateChart(data) {
    if (!data || !data.hourly) return;

    const ctx = document.getElementById('chart').getContext('2d');
    const times = data.hourly.time.slice(0, 24).map(t => new Date(t).toLocaleTimeString('lt-LT', { hour: '2-digit', minute: '2-digit' }));
    const temps = data.hourly.temperature_2m.slice(0, 24);

    if (window.tempChart) window.tempChart.destroy();

    window.tempChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: times,
            datasets: [{
                label: 'Temperatūra',
                data: temps,
                borderColor: '#4caf50',
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false //  Hide the legend
                }
            },
            scales: {
                y: {
                    beginAtZero: false // Don't force y-axis to start at 0
                }
            }
        }
    });
}

function toggleTabs() {
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            document.querySelectorAll('.forecast-content').forEach(c => c.classList.remove('active'));
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            document.getElementById(tab).classList.add('active');
            btn.classList.add('active');
        });
    });
}

async function getWeather(city) {
    document.getElementById('loading-indicator').style.display = 'block';

    try {
        const coords = await geocodeCity(city);
        if (!coords) return;  // Stop if geocoding fails

        const data = await fetchForecast(coords.lat, coords.lon);
        if (!data) return;    //  Stop if weather fetch fails

        updateCurrentWeather(data, city);
        updateHourlyForecast(data);
        updateDailyForecast(data);
        updateChart(data);


    } catch (err) {
        console.error(err);
        alert('Nepavyko gauti orų duomenų.');
    } finally {
        document.getElementById('loading-indicator').style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    toggleTabs();
    document.getElementById('get-weather-btn').addEventListener('click', () => {
        const city = document.getElementById('place-select').value;
        if (city) {
            getWeather(city);
        } else {
            alert("Prašome pasirinkti miestą.");
        }
    });

    // Initialize with a default city
    getWeather(DEFAULT_CITY);
});


//  Helper function (you might need more robust error handling)
function handleErrors(response) {
    if (!response.ok) {
        throw Error(response.statusText);
    }
    return response;
}