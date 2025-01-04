// DOM Elements
const ELEMENTS = {
    searchForm: document.getElementById('search-form'),
    searchInput: document.getElementById('search-input'),
    todayContainer: document.querySelector('#today'),
    forecastContainer: document.querySelector('#forecast'),
    searchHistoryContainer: document.getElementById('history'),
    heading: document.getElementById('search-title'),
    weatherIcon: document.getElementById('weather-img'),
    tempEl: document.getElementById('temp'),
    windEl: document.getElementById('wind'),
    humidityEl: document.getElementById('humidity')
};

const API_KEY = "7bbf422e069710e712fbd1dfa94e8628";
const STORAGE_KEY = 'weatherSearchHistory';

class WeatherService {
    async fetchWeather(cityName) {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${API_KEY}&units=imperial`
            );
            
            if (!response.ok) {
                throw new Error(`Weather data not found for ${cityName}`);
            }

            const data = await response.json();
            return this.formatWeatherData(data);
        } catch (error) {
            throw new Error(`Failed to fetch weather: ${error.message}`);
        }
    }

    formatWeatherData(data) {
        const weatherData = [];
        const city = data.city.name;
        
        // Current weather (first item in list)
        weatherData.push({
            city,
            date: new Date(data.list[0].dt * 1000).toLocaleDateString(),
            icon: data.list[0].weather[0].icon,
            iconDescription: data.list[0].weather[0].description,
            tempF: Math.round(data.list[0].main.temp),
            windSpeed: Math.round(data.list[0].wind.speed),
            humidity: data.list[0].main.humidity
        });

        // Get one forecast per day (every 8th item is a new day)
        for (let i = 7; i < data.list.length; i += 8) {
            const forecast = data.list[i];
            weatherData.push({
                date: new Date(forecast.dt * 1000).toLocaleDateString(),
                icon: forecast.weather[0].icon,
                iconDescription: forecast.weather[0].description,
                tempF: Math.round(forecast.main.temp),
                windSpeed: Math.round(forecast.wind.speed),
                humidity: forecast.main.humidity
            });
        }

        return weatherData;
    }

    getSearchHistory() {
        const history = localStorage.getItem(STORAGE_KEY);
        return history ? JSON.parse(history) : [];
    }

    addToSearchHistory(cityName) {
        const history = this.getSearchHistory();
        
        // Remove if city already exists
        const filteredHistory = history.filter(city => city.name !== cityName);
        
        // Add new city to start
        filteredHistory.unshift({
            id: Date.now(),
            name: cityName
        });

        // Keep only last 10 searches
        if (filteredHistory.length > 10) {
            filteredHistory.pop();
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredHistory));
        return filteredHistory;
    }

    removeFromHistory(id) {
        const history = this.getSearchHistory();
        const filteredHistory = history.filter(city => city.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredHistory));
        return filteredHistory;
    }
}

class UIService {
    renderCurrentWeather(currentWeather) {
        const { city, date, icon, iconDescription, tempF, windSpeed, humidity } = currentWeather;

        ELEMENTS.heading.textContent = `${city} (${date})`;
        ELEMENTS.weatherIcon.setAttribute('src', `https://openweathermap.org/img/w/${icon}.png`);
        ELEMENTS.weatherIcon.setAttribute('alt', iconDescription);
        ELEMENTS.weatherIcon.setAttribute('class', 'weather-img');
        ELEMENTS.tempEl.textContent = `Temp: ${tempF}°F`;
        ELEMENTS.windEl.textContent = `Wind: ${windSpeed} MPH`;
        ELEMENTS.humidityEl.textContent = `Humidity: ${humidity} %`;

        ELEMENTS.todayContainer?.appendChild(ELEMENTS.heading);
        ELEMENTS.todayContainer?.appendChild(ELEMENTS.tempEl);
        ELEMENTS.todayContainer?.appendChild(ELEMENTS.windEl);
        ELEMENTS.todayContainer?.appendChild(ELEMENTS.humidityEl);
    }

    renderForecast(forecast) {
        if (!ELEMENTS.forecastContainer) return;

        ELEMENTS.forecastContainer.innerHTML = '';
        
        const headingCol = document.createElement('div');
        const heading = document.createElement('h4');
        headingCol.setAttribute('class', 'col-12');
        heading.textContent = '5-Day Forecast:';
        headingCol.append(heading);
        ELEMENTS.forecastContainer.append(headingCol);

        forecast.forEach(day => this.renderForecastCard(day));
    }

    renderForecastCard(forecast) {
        const card = this.createForecastCard();
        const { date, icon, iconDescription, tempF, windSpeed, humidity } = forecast;

        card.cardTitle.textContent = date;
        card.weatherIcon.setAttribute('src', `https://openweathermap.org/img/w/${icon}.png`);
        card.weatherIcon.setAttribute('alt', iconDescription);
        card.tempEl.textContent = `Temp: ${tempF} °F`;
        card.windEl.textContent = `Wind: ${windSpeed} MPH`;
        card.humidityEl.textContent = `Humidity: ${humidity} %`;

        ELEMENTS.forecastContainer?.append(card.col);
    }

    renderSearchHistory(history) {
        if (!ELEMENTS.searchHistoryContainer) return;

        ELEMENTS.searchHistoryContainer.innerHTML = '';
        
        if (!history.length) {
            ELEMENTS.searchHistoryContainer.innerHTML = 
                '<p class="text-center">No Previous Search History</p>';
            return;
        }

        history.forEach(city => {
            const historyItem = this.buildHistoryListItem(city);
            ELEMENTS.searchHistoryContainer.append(historyItem);
        });
    }

    createForecastCard() {
        const elements = {
            col: document.createElement('div'),
            card: document.createElement('div'),
            cardBody: document.createElement('div'),
            cardTitle: document.createElement('h5'),
            weatherIcon: document.createElement('img'),
            tempEl: document.createElement('p'),
            windEl: document.createElement('p'),
            humidityEl: document.createElement('p')
        };

        elements.col.append(elements.card);
        elements.card.append(elements.cardBody);
        elements.cardBody.append(
            elements.cardTitle, 
            elements.weatherIcon, 
            elements.tempEl, 
            elements.windEl, 
            elements.humidityEl
        );

        elements.col.classList.add('col-auto');
        elements.card.classList.add('forecast-card', 'card', 'text-white', 'bg-primary', 'h-100');
        elements.cardBody.classList.add('card-body', 'p-2');
        elements.cardTitle.classList.add('card-title');
        [elements.tempEl, elements.windEl, elements.humidityEl].forEach(el => 
            el.classList.add('card-text')
        );

        return elements;
    }

    buildHistoryListItem(city) {
        const historyDiv = document.createElement('div');
        historyDiv.classList.add('display-flex', 'gap-2', 'col-12', 'm-1');

        const btn = document.createElement('button');
        btn.setAttribute('type', 'button');
        btn.setAttribute('aria-controls', 'today forecast');
        btn.classList.add('history-btn', 'btn', 'btn-secondary', 'col-10');
        btn.textContent = city.name;

        const deleteBtn = document.createElement('button');
        deleteBtn.setAttribute('type', 'button');
        deleteBtn.classList.add('fas', 'fa-trash-alt', 'delete-city', 'btn', 'btn-danger', 'col-2');
        deleteBtn.dataset.cityId = city.id;

        historyDiv.append(btn, deleteBtn);
        return historyDiv;
    }

    showError(message) {
        alert(message);
    }
}

class WeatherApp {
    constructor() {
        this.weatherService = new WeatherService();
        this.uiService = new UIService();
        this.setupEventListeners();
        this.initializeApp();
    }

    setupEventListeners() {
        ELEMENTS.searchForm?.addEventListener('submit', this.handleSearchFormSubmit.bind(this));
        ELEMENTS.searchHistoryContainer?.addEventListener('click', this.handleSearchHistoryClick.bind(this));
    }

    async initializeApp() {
        const history = this.weatherService.getSearchHistory();
        this.uiService.renderSearchHistory(history);
    }

    async handleSearchFormSubmit(event) {
        event.preventDefault();

        try {
            const searchTerm = ELEMENTS.searchInput?.value?.trim();
            
            if (!searchTerm) {
                throw new Error('Please enter a city name');
            }

            ELEMENTS.todayContainer?.classList.add('loading');
            const weatherData = await this.weatherService.fetchWeather(searchTerm);
            
            this.uiService.renderCurrentWeather(weatherData[0]);
            this.uiService.renderForecast(weatherData.slice(1));
            
            const history = this.weatherService.addToSearchHistory(searchTerm);
            this.uiService.renderSearchHistory(history);
            
            ELEMENTS.searchInput.value = '';
            
        } catch (error) {
            this.uiService.showError(error.message);
        } finally {
            ELEMENTS.todayContainer?.classList.remove('loading');
        }
    }

    async handleSearchHistoryClick(event) {
        if (event.target.matches('.history-btn')) {
            const city = event.target.textContent;
            try {
                ELEMENTS.todayContainer?.classList.add('loading');
                const weatherData = await this.weatherService.fetchWeather(city);
                this.uiService.renderCurrentWeather(weatherData[0]);
                this.uiService.renderForecast(weatherData.slice(1));
            } catch (error) {
                this.uiService.showError(error.message);
            } finally {
                ELEMENTS.todayContainer?.classList.remove('loading');
            }
        } else if (event.target.matches('.delete-city')) {
            const cityId = Number(event.target.dataset.cityId);
            const history = this.weatherService.removeFromHistory(cityId);
            this.uiService.renderSearchHistory(history);
        }
    }
}

// Initialize the app
const weatherApp = new WeatherApp();
