
//theme toggle logic
const toggleTheme = document.getElementById('themeToggle');
const toggleText = document.getElementById('toggle-text');
const originalClasses = toggleTheme.className;


const para =document.createElement('p');
para.innerText= 'This page only have dark mode';
para.classList.add('text-blue-200', 'text-center', 'text-xl', 'font-bold', 'm-2');

 toggleTheme.addEventListener('click', ()=>{
   
    toggleText.appendChild(para);
    toggleTheme.disabled = true;
    toggleTheme.className = 'opacity-75 cursor-not-allowed'; // Replace all classes
    //reset after 3 seconds
    setTimeout(()=>{
        para.remove();
        toggleTheme.disabled= false;
        toggleTheme.className = originalClasses; // Restore original classes
        // console.log(originalClasses);    
    },3000);
});

//toggle theme end
// ..........................................................

// enabled the use current location

document.getElementById('current-location').addEventListener('click' , ()=>{
    if("geolocation" in navigator){
        navigator.geolocation.getCurrentPosition((position)=>{
            const lat = position.coords.latitude;
            const long = position.coords.longitude;

            //store in localstorage
            localStorage.setItem("userLocation", JSON.stringify({lat, long}));
            alert('Location saved successfully!');
         }, 
         (error)=>{
            alert("Error getting location: " + error.message);
         }
        );
    }
    else{
        alert("Geolocation is not supported by this browser.");
    }
        
});

//......................................................
//fetch the location from api call

// Initialize elements
let cityInput = document.getElementById('city-input');
let searchBtn = document.getElementById('searchBtn');
let api_key = '19c2262d4893941270dd3f6f6a5834e7';

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
    if(savedCities.length > 0) citiesContainer.classList.remove('hidden');
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
    if(!isDuplicate) {
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
            if(!e.target.classList.contains('delete-btn')){
                getWeatherDetails(cityData.name, cityData.lat, cityData.lon, cityData.country, cityData.state);
            }
        });

        //add delete functionality
        const deleteBtn = city_item.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e)=>{
            e.stopPropagation();

            //Remove the item from DOM
            city_item.remove();

            //remove also from localstorage
            const savedCities = JSON.parse(localStorage.getItem('weatherCities')) || [];
            const updatedCities = savedCities.filter(c =>
                !(c.name === cityData.name && c.country === cityData.country)
            );
            localStorage.setItem('weatherCities' , JSON.stringify(updatedCities));

            //hide container if it is empty
            if(city_list.children.length === 0){
                citiesContainer.classList.add('hidden');
            }
        });

        city_list.appendChild(city_item);
        
        // Update localStorage :- array of object for cities 
        const savedCities = JSON.parse(localStorage.getItem('weatherCities')) || [];
        if(!savedCities.some(c => c.name === cityData.name && c.country === cityData.country)) {
            savedCities.push(cityData);
            localStorage.setItem('weatherCities', JSON.stringify(savedCities));
        }
        //whenever a new city add the city list will update and this list will appear 
        if(citiesContainer.classList.contains('hidden')) {
            citiesContainer.classList.remove('hidden');
        }
    }
}

// Main function to get coordinates
function getCityCoordinates() {
    const cityName = cityInput.value.trim();
    cityInput.value = '';
    if(!cityName) return;

    const GEOCODING_API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${api_key}`;

    fetch(GEOCODING_API_URL)
    .then(res => {
        if(!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
    })
    .then(data => {
        if(data.length === 0) {
            alert('City not found! Please check spelling.');
            return;
        }

        const { name, lat, lon, country, state } = data[0];
        const cityData = { name, lat, lon, country, state };
        
        createCityItem(cityData);

        //ab ye chalana he , isme api call hogi or data milega
        getWeatherDetails(name, lat, lon, country, state);
    })
    .catch(error => {
        alert(`Failed to fetch coordinates: ${error.message}`);
    });
}

searchBtn.addEventListener('click', getCityCoordinates);