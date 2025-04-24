
//theme toggle logic
const toggleTheme = document.getElementById('themeToggle');
const toggleText = document.getElementById('toggle-text');
const originalClasses = toggleTheme.className;


const para = document.createElement('p');
para.innerText = 'This page only have dark mode';
para.classList.add('text-blue-200', 'text-center', 'text-xl', 'font-bold', 'm-2');

toggleTheme.addEventListener('click', () => {

    toggleText.appendChild(para);
    toggleTheme.disabled = true;
    toggleTheme.className = 'opacity-75 cursor-not-allowed'; // Replace all classes
    //reset after 3 seconds
    setTimeout(() => {
        para.remove();
        toggleTheme.disabled = false;
        toggleTheme.className = originalClasses; // Restore original classes
        // console.log(originalClasses);    
    }, 3000);
});

//toggle theme end
// ..........................................................

// enabled the use current location

document.getElementById('current-location').addEventListener('click', () => {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const long = position.coords.longitude;

            //from this url i get the name using lat and lon
            const REVERSE_GEO_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${long}&limit=1&appid=${api_key}`;

            fetch(REVERSE_GEO_URL)
                .then(res => res.json()).then(data => {
                    if (data.length === 0) {
                        alert("city name is not found for current location.");
                        return;
                    }
                    const { name } = data[0]; // as we need only name 

                    //call the functions using current location
                    getWeatherDetails(name, lat, long);
                    updateCurrentWeather(lat, long);

                    //store in localstorage
                    localStorage.setItem("userLocation", JSON.stringify({ lat, long }));
                    alert(`Location (${name})saved successfully!`);
                }).catch(err =>{
                    console.error("failed to fetch city name: ", err);
                    alert("Failed to get city name");
                });

        },
            (error) => {
                alert("Error getting location: " + error.message);
            }
        );
    }
    else {
        alert("Geolocation is not supported by this browser.");
    }

});

//......................................................
//fetch the location from api call

// Initialize elements
let cityInput = document.getElementById('city-input');
let searchBtn = document.getElementById('searchBtn');
let api_key = '19c2262d4893941270dd3f6f6a5834e7';

//get current weahter 
function updateCurrentWeather(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${api_key}`;
    fetch(url).then(res => res.json()).then(data => {
        if (!data.main || !data.main.temp) {
            console.warn("Incomplete data:", data);
            return;
        }
        const currentTemp = Math.round(data.main.temp);
        const weather = data.weather[0].description;
        const iconCode = data.weather[0].icon;
        document.getElementById("current_temp").textContent = `${currentTemp}°`;
        document.getElementById("weather-icon").src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        document.getElementById("weather-desc").textContent = weather;

    }).catch(err => console.error(err.message));
}
//get current weather is done

//function to get weather detaits for 5 days 
function getWeatherDetails(name, lat, lon) {

    document.getElementById("city_name").textContent = name;

    const DAYS_API_CALL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${api_key}`;
    fetch(DAYS_API_CALL).then(res => res.json()).then(data => {
        console.log(data); //40 entries - (8*5)
        const forecastList = data.list;
        // Filter for 12:00:00 time each day (roughly the middle of the day)
        const dailyForecast = forecastList.filter(item => item.dt_txt.includes("12:00:00"));


        // Store or use the daily forecast
        // Define preferred time slots in reverse order of preference (latest to earliest)
        const preferredTimes1 = ["21:00:00", "18:00:00", "15:00:00", "12:00:00"];

        const formattedForecast = dailyForecast.map(item => {
            const date = item.dt_txt.split(" ")[0];

            // Find latest available time slot for that date from preferred list
            const fallbackForecast = preferredTimes1
                .map(time => forecastList.find(entry => entry.dt_txt === `${date} ${time}`))
                .find(entry => entry !== undefined);

            return {
                date: date,
                weather: fallbackForecast?.weather?.[0]?.description || "N/A",
                icon: fallbackForecast ? `https://openweathermap.org/img/wn/${fallbackForecast.weather[0].icon}.png` : "",
                temp_max: item.main.temp_max,
                temp_min: fallbackForecast?.main?.temp_min || "N/A"
            };
        });
        //update the right aside bar
        //here we loop our every day and change the forecast there based on the [present date] and we'll show the 5 days from the current date 

        const trimmedForecast = formattedForecast.slice(0, 5);

        trimmedForecast.forEach((forecast, index) => {
            const card = document.getElementById(`day-${index}`);
            if (!card) return;

            card.querySelector(".forecast-date").textContent = forecast.date;
            card.querySelector(".forecast-icon").src = forecast.icon;
            card.querySelector(".forecast-weather").textContent = forecast.weather;
            card.querySelector(".temp-max").textContent = Math.round(forecast.temp_max);
            card.querySelector(".temp-min").textContent = forecast.temp_min !== "N/A" ? Math.round(forecast.temp_min) : "N/A";
        });

        //update done for right aside bar 


        console.log("5-Day Forecast:", formattedForecast);
        //this will give us the 5 day forecast array


        //we grab now today's hourly forecast

        const targetTimesToday = ["12:00:00", "15:00:00", "18:00:00", "21:00:00"];
        const targetTimesTomorrow = ["00:00:00", "03:00:00"];

        const today = new Date().toISOString().split("T")[0]; //we get today date and based on that we'll take the weather from the time we call the api
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];//+1 day in ms
        // Filter forecastList for each target time
        const targetForecasts = [
            ...targetTimesToday.map(time => {

                const forecast = forecastList.find(item => item.dt_txt === `${today} ${time}`)
                return forecast || { dt_txt: `${today} ${time}`, noData: true };
            }),
            ...targetTimesTomorrow.map(time => {
                const forecast = forecastList.find(item => item.dt_txt === `${tomorrow} ${time}`)
                return forecast || { dt_txt: `${tomorrow} ${time}`, noData: true };
            })
        ];
        console.log("6 slots forecast", targetForecasts);
        //slots forecast fetch ends 

        //update the dom fro 3 hrs forecast 
        const tempSlotIds = [
            "temp_12_pm", // 12:00 PM
            "temp_03_pm", // 03:00 PM
            "temp_06_pm", // 06:00 PM
            "temp_09_pm", // 09:00 PM
            "temp_12_am", // 12:00 AM
            "temp_03_am", // 03:00 AM
        ];
        //loop through each forecast and update respective dom
        targetForecasts.forEach((forecast, index) => {
            const id = tempSlotIds[index];
            const el = document.getElementById(id);

            if (!el) return;

            if (forecast.noData || !forecast.main) {
                el.textContent = "--";
            } else {
                const temp = Math.round(forecast.main.temp);
                el.textContent = `${temp}°`
            }
        });

        //done the 3 hr forecast part

        //start the air conditions part

        //first we have to find the valid time frame according to the time 
        const preferredTimes = ["12:00:00", "15:00:00", "18:00:00"]; // priority order

        // find the first available forecast in the preferred time slots
        const noonForecast = preferredTimes
            .map(time => targetForecasts.find(item => item?.dt_txt?.includes(time) && !item?.noData))
            .find(item => item); // get the first non-undefined

        //extract and update air conditions based on selected city

        if (noonForecast && noonForecast.main && noonForecast.wind && noonForecast.weather) {
            const feelsLike = noonForecast.main.feels_like;
            const windSpeed = noonForecast.wind.speed;
            const chanceOfRain = noonForecast.weather[0].description;  // Example: "clear sky"
            const humidity = noonForecast.main.humidity;

            //once try to console
            console.log("Air Conditions:");
            console.log("Feels Like:", feelsLike);
            console.log("Wind Speed:", windSpeed);
            console.log("Chance of Rain:", chanceOfRain);
            console.log("Humidity:", humidity);


            //update the dom 
            document.getElementById("feels-alike").textContent = `${Math.round(feelsLike)}°`;
            document.getElementById("wind-speed").textContent = `${windSpeed} m/s`;
            document.querySelectorAll(".chance_of_rain").forEach(el => {
                el.textContent = chanceOfRain;
            });
            document.getElementById("humidity").textContent = `${humidity}%`;
        } else {
            console.warn("Incomplete noonForecast data:", noonForecast);
        }

        //end the air condition part 

    }).catch(err => console.log(err));
}

// Cities section elements
let citiesContainer = document.getElementById('cities-container');
let citiesList = document.getElementById('cities-list');
let toggleCitiesBtn = document.getElementById('toggleCities');
let city_list = document.createElement('ul');
citiesList.appendChild(city_list);

// Load saved cities when page loads
document.addEventListener('DOMContentLoaded', () => {
    const savedCities = JSON.parse(localStorage.getItem('weatherCities')) || [];
    savedCities.forEach(city => {
        createCityItem(city);
    });
    if (savedCities.length > 0) citiesContainer.classList.remove('hidden');
});

// Toggle visibility function
function toggleCitiesList() {
    citiesContainer.classList.toggle('hidden');
}

toggleCitiesBtn.addEventListener('click', (e) => {
    e.preventDefault();
    toggleCitiesList();
});

// Create city list item function
function createCityItem(cityData) {
    //check for alreay existing city in the list 
    const existingCities = Array.from(city_list.children);
    const isDuplicate = existingCities.some(item => {
        //here first child is city name from city list 
        const cityName = item.querySelector('span:first-child').textContent;
        // last child is country code from city list
        const countryCode = item.querySelector('span:last-child').textContent;
        return cityName === cityData.name && countryCode === cityData.country;
    });

    //isDuplicate is false that means city is not present already so we can add this city to the list now
    if (!isDuplicate) {
        const city_item = document.createElement('li');
        city_item.className = 'group text-blue-200 hover:bg-gray-700 p-2 rounded-md cursor-pointer transition-colors flex justify-between items-center';
        city_item.dataset.city = JSON.stringify(cityData);
        city_item.innerHTML = `
             <div>
                <span class="font-medium">${cityData.name}</span>
                <span class="text-sm text-gray-400 ml-2">${cityData.country}</span>
            </div>
            <button class="delete-btn text-red-500 text-lg opacity-0 group-hover:opacity-100 transition-opacity px-2 hover:text-red-400">
                x
            </button>
        `;

        //every city is clickable and when click on it , get the weather of that city
        city_item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-btn')) {
                getWeatherDetails(cityData.name, cityData.lat, cityData.lon);
                updateCurrentWeather(cityData.lat, cityData.lon);
            }
        });

        //add delete functionality
        const deleteBtn = city_item.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();

            //Remove the item from DOM
            city_item.remove();

            //remove also from localstorage
            const savedCities = JSON.parse(localStorage.getItem('weatherCities')) || [];
            const updatedCities = savedCities.filter(c =>
                !(c.name === cityData.name && c.country === cityData.country)
            );
            localStorage.setItem('weatherCities', JSON.stringify(updatedCities));

            //hide container if it is empty
            if (city_list.children.length === 0) {
                citiesContainer.classList.add('hidden');
            }
        });

        city_list.appendChild(city_item);

        // Update localStorage :- array of object for cities 
        const savedCities = JSON.parse(localStorage.getItem('weatherCities')) || [];
        if (!savedCities.some(c => c.name === cityData.name && c.country === cityData.country)) {
            savedCities.push(cityData);
            localStorage.setItem('weatherCities', JSON.stringify(savedCities));
        }
        //whenever a new city add the city list will update and this list will appear 
        if (citiesContainer.classList.contains('hidden')) {
            citiesContainer.classList.remove('hidden');
        }
    }
}



// Main function to get coordinates
function getCityCoordinates() {
    const cityName = cityInput.value.trim();
    cityInput.value = '';
    if (!cityName) return;

    const GEOCODING_API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${api_key}`;

    fetch(GEOCODING_API_URL)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then(data => {
            if (data.length === 0) {
                alert('City not found! Please check spelling.');
                return;
            }

            const { name, lat, lon, country, state } = data[0];
            const cityData = { name, lat, lon, country, state };


            createCityItem(cityData);

            //ab ye chalana he , isme api call hogi or data milega
            getWeatherDetails(name, lat, lon);
            updateCurrentWeather(lat, lon);
        })
        .catch(error => {
            alert(`Failed to fetch coordinates: ${error.message}`);
        });
}

searchBtn.addEventListener('click', getCityCoordinates);