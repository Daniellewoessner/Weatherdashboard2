// Constants and DOM Elements
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

// API Configuration
const API_CONFIG = {
    baseUrl: '/api/weather',
    headers: {
        'Content-Type': 'application/json'
    }
};

// Weather Service
class WeatherService {
    async fetchWeather(cityName) {
        try {
            ELEMENTS.todayContainer?.classList.add('loading');
            
            const response = await fetch(`${API_CONFIG.baseUrl}/`, {
                method: 'POST',
                headers: API_CONFIG.headers,
                body: JSON.stringify({ cityName })
            });

            if (!response.ok) {
                throw new Error(`Weather data not found for ${cityName}`);
            }

            const weatherData = await response.json();
            return weatherData;
        } catch (error) {
            throw new Error(`Failed to fetch weather: ${error.message}`);
        } finally {
            ELEMENTS.todayContainer?.classList.remove('loading');
        }
    }

    async fetchSearchHistory() {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}/history`, {
                method: 'GET',
                headers: API_CONFIG.headers
            });

            if (!response.ok) {
                throw new Error('Failed to fetch search history');
            }

            return response.json();
        } catch (error) {
            console.error('History fetch error:', error);
            return [];
        }
    }

    async deleteCityFromHistory(id) {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}/history/${id}`, {
                method: 'DELETE',
                headers: API_CONFIG.headers
            });

            if (!response.ok) {
                throw new Error('Failed to delete city from history');
            }
        } catch (error) {
            console.error('Delete error:', error);
            throw error;
        }
    }
}

// UI Service
class UIService {
    renderCurrentWeather(currentWeather) {
        const { city, date, icon, iconDescription, tempF, windSpeed, humidity } = currentWeather;

        ELEMENTS.heading.textContent = `${city} (${date})`;
        ELEMENTS.weatherIcon.setAttribute('src', `https://openweathermap.org/img/w/${icon}.png`);
        ELEMENTS.weatherIcon.setAttribute('alt', iconDescription);
        ELEMENTS.weatherIcon.setAttribute('class', 'weather-img');
        ELEMENTS.heading.append(ELEMENTS.weatherIcon);
        ELEMENTS.tempEl.textContent = `Temp: ${tempF}°F`;
        ELEMENTS.windEl.textContent = `Wind: ${windSpeed} MPH`;
        ELEMENTS.humidityEl.textContent = `Humidity: ${humidity} %`;

        if (ELEMENTS.todayContainer) {
            ELEMENTS.todayContainer.innerHTML = '';
            ELEMENTS.todayContainer.append(ELEMENTS.heading, ELEMENTS.tempEl, ELEMENTS.windEl, ELEMENTS.humidityEl);
        }
    }

    renderForecast(forecast) {
        const headingCol = document.createElement('div');
        const heading = document.createElement('h4');
        headingCol.setAttribute('class', 'col-12');
        heading.textContent = '5-Day Forecast:';
        headingCol.append(heading);

        if (ELEMENTS.forecastContainer) {
            ELEMENTS.forecastContainer.innerHTML = '';
            ELEMENTS.forecastContainer.append(headingCol);
            forecast.forEach(day => this.renderForecastCard(day));
        }
    }

    renderForecastCard(forecast) {
        const { date, icon, iconDescription, tempF, windSpeed, humidity } = forecast;
        const card = this.createForecastCard();

        card.cardTitle.textContent = date;
        card.weatherIcon.setAttribute('src', `https://openweathermap.org/img/w/${icon}.png`);
        card.weatherIcon.setAttribute('alt', iconDescription);
        card.tempEl.textContent = `Temp: ${tempF} °F`;
        card.windEl.textContent = `Wind: ${windSpeed} MPH`;
        card.humidityEl.textContent = `Humidity: ${humidity} %`;

        if (ELEMENTS.forecastContainer) {
            ELEMENTS.forecastContainer.append(card.col);
        }
    }

    async renderSearchHistory(searchHistory) {
        const historyList = await searchHistory;
        
        if (ELEMENTS.searchHistoryContainer) {
            ELEMENTS.searchHistoryContainer.innerHTML = '';
            
            if (!historyList.length) {
                ELEMENTS.searchHistoryContainer.innerHTML = 
                    '<p class="text-center">No Previous Search History</p>';
                return;
            }

            // Render most recent searches first
            for (let i = historyList.length - 1; i >= 0; i--) {
                const historyItem = this.buildHistoryListItem(historyList[i]);
                ELEMENTS.searchHistoryContainer.append(historyItem);
            }
        }
    }

    // Helper methods
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

        // Add classes
        elements.col.classList.add('col-auto');
        elements.card.classList.add('forecast-card', 'card', 'text-white', 'bg-primary', 'h-100');
        elements.cardBody.classList.add('card-body', 'p-2');
        elements.cardTitle.classList.add('card-title');
        elements.tempEl.classList.add('card-text');
        elements.windEl.classList.add('card-text');
        elements.humidityEl.classList.add('card-text');

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
        deleteBtn.dataset.city = JSON.stringify(city);
        
        historyDiv.append(btn, deleteBtn);
        return historyDiv;
    }
}

// App Controller
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
        await this.getAndRenderHistory();
    }

    async handleSearchFormSubmit(event) {
        event.preventDefault();

        try {
            const searchTerm = ELEMENTS.searchInput?.value?.trim();
            
            if (!searchTerm) {
                throw new Error('Please enter a city name');
            }

            const weatherData = await this.weatherService.fetchWeather(searchTerm);
            this.uiService.renderCurrentWeather(weatherData[0]);
            this.uiService.renderForecast(weatherData.slice(1));
            
            await this.getAndRenderHistory();
            ELEMENTS.searchInput.value = '';
            
        } catch (error) {
            this.showError(error.message);
        }
    }

    async handleSearchHistoryClick(event) {
        if (event.target.matches('.history-btn')) {
            const city = event.target.textContent;
            try {
                const weatherData = await this.weatherService.fetchWeather(city);
                this.uiService.renderCurrentWeather(weatherData[0]);
                this.uiService.renderForecast(weatherData.slice(1));
                await this.getAndRenderHistory();
            } catch (error) {
                this.showError(error.message);
            }
        } else if (event.target.matches('.delete-city')) {
            event.stopPropagation();
            const cityData = JSON.parse(event.target.dataset.city);
            try {
                await this.weatherService.deleteCityFromHistory(cityData.id);
                await this.getAndRenderHistory();
            } catch (error) {
                this.showError('Failed to delete city from history');
            }
        }
    }

    async getAndRenderHistory() {
        const history = await this.weatherService.fetchSearchHistory();
        await this.uiService.renderSearchHistory(history);
    }

    showError(message) {
        // Could be enhanced with a proper error UI component
        alert(message);
    }
}

// Initialize the app
const weatherApp = new WeatherApp();
