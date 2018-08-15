import "lazysizes";
import GoogleMapsLoader from "./gmaps";
import DBHelper from "./dbhelper";
import { storage } from "./storage";

const state = {
  restaurants: [],
  neighborhoods: [],
  cuisines: [],
  markers: []
};
let map;

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", () => {
  DBHelper.registerServiceWorker();

  fetchNeighborhoods();
  fetchCuisines();

  GoogleMapsLoader.load(() => {
    let loc = {
      lat: 40.722216,
      lng: -73.987501
    };
    map = new google.maps.Map(document.getElementById("map"), {
      // @ts-ignore
      title: "Restaurants Map",
      zoom: 12,
      center: loc,
      scrollwheel: false
    });
    updateRestaurants();
  });
});

document.querySelector("#neighborhoods-select").addEventListener("change", () => {
  updateRestaurants();
});
document.querySelector("#cuisines-select").addEventListener("change", () => {
  updateRestaurants();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods()
    .then(neighborhoods => {
      if (neighborhoods) {
        state.neighborhoods = neighborhoods;
        fillNeighborhoodsHTML();
      }
    })
    .catch(err => {
      console.log(err);
    });
};

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = state.neighborhoods) => {
  const select = document.getElementById("neighborhoods-select");
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement("option");
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.appendChild(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines()
    .then(cuisines => {
      if (cuisines) {
        state.cuisines = cuisines;
        fillCuisinesHTML();
      }
    })
    .catch(err => {
      console.log(err);
    });
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = state.cuisines) => {
  const select = document.getElementById("cuisines-select");

  cuisines.forEach(cuisine => {
    const option = document.createElement("option");
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.appendChild(option);
  });
};

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById("cuisines-select");
  const nSelect = document.getElementById("neighborhoods-select");

  // @ts-ignore
  const cIndex = cSelect.selectedIndex;
  // @ts-ignore
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood)
    .then(restaurants => {
      if (restaurants) {
        resetRestaurants(restaurants);
        fillRestaurantsHTML();
      }
    })
    .catch(err => {
      console.log(err);
    });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = restaurants => {
  // Remove all restaurants
  state.restaurants = [];
  const ul = document.getElementById("restaurants-list");
  ul.innerHTML = "";

  // Remove all map markers
  if (state.markers) {
    state.markers.forEach(m => m.setMap(null));
    state.markers = [];
  }
  state.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = state.restaurants) => {
  const ul = document.getElementById("restaurants-list");
  restaurants.forEach(restaurant => {
    ul.appendChild(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = restaurant => {
  const li = document.createElement("li");

  const image = document.createElement("img");
  image.className = "restaurant-img lazyload";
  const imageFile = require(`../img/${restaurant.id}.jpg`);
  image.setAttribute("data-src", imageFile.src);
  image.setAttribute("data-srcset", imageFile.srcSet);
  image.setAttribute("data-sizes", "auto");
  image.alt = "";
  li.appendChild(image);

  const div = document.createElement("div");
  div.className = "restaurant-headline";
  li.appendChild(div);

  const name = document.createElement("h3");
  name.innerHTML = restaurant.name;
  div.appendChild(name);

  const favId = `favbox-${restaurant.id}`;
  const favInput = document.createElement("input");
  favInput.type = "checkbox";
  favInput.checked = restaurant.is_favorite === "true";
  favInput.id = favId;
  favInput.setAttribute("aria-label", `"${restaurant.name}" is your favorite`);
  favInput.setAttribute("data-id", restaurant.id);
  favInput.addEventListener("change", toggleFavorite);
  div.appendChild(favInput);

  const favLabel = document.createElement("label");
  favLabel.htmlFor = favId;
  favLabel.innerHTML =
    '<svg style="width:24px;height:24px" viewBox="0 0 24 24"><path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z" /></svg>';
  div.appendChild(favLabel);

  const neighborhood = document.createElement("p");
  neighborhood.innerHTML = restaurant.neighborhood;
  li.appendChild(neighborhood);

  const address = document.createElement("p");
  address.innerHTML = restaurant.address;
  li.appendChild(address);

  const more = document.createElement("a");
  more.innerHTML = "View Details";
  more.setAttribute("aria-label", `View details of ${restaurant.name}`);
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.appendChild(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = state.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, map);
    google.maps.event.addListener(marker, "click", () => {
      window.location.href = marker.url;
    });
    state.markers.push(marker);
  });
};

/**
 * Favorite restaurant button clicked
 */

const toggleFavorite = async event => {
  const restaurant = await storage.getRestaurant(event.target.dataset.id);
  restaurant.is_favorite = event.target.checked ? "true" : "false";
  restaurant.sync = { ...restaurant.sync, favorite: true };
  await storage.putRestaurant(restaurant);
  // Sync database changes with api
  navigator.serviceWorker.ready.then(sw => {
    return sw.sync.register("sync-favorites");
  });
};
