
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