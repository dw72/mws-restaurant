import 'lazysizes';
import GoogleMapsLoader from './gmaps';
import DBHelper from './dbhelper';
import { storage } from './storage';

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
document.addEventListener('DOMContentLoaded', () => {
  DBHelper.registerServiceWorker();

  fetchNeighborhoods();
  fetchCuisines();

  GoogleMapsLoader.load(() => {
    let loc = {
      lat: 40.722216,
      lng: -73.987501
    };
    map = new google.maps.Map(document.getElementById('map'), {
      title: 'Restaurants Map',
      zoom: 12,
      center: loc,
      scrollwheel: false
    });
    updateRestaurants();
  });
});

document.querySelector('#neighborhoods-select').addEventListener('change', () => {
  updateRestaurants();
});
document.querySelector('#cuisines-select').addEventListener('change', () => {
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
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
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
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
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
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

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
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = restaurant => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img lazyload';
  const imageFile = require(`../img/${restaurant.id}.jpg`);
  image.setAttribute('data-src', imageFile.src);
  image.setAttribute('data-srcset', imageFile.srcSet);
  image.setAttribute('data-sizes', 'auto');
  image.alt = '';
  li.append(image);

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-label', `View details of ${restaurant.name}`);
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = state.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url;
    });
    state.markers.push(marker);
  });
};

/**
 * Favorite restaurant button clicked
 */

const toggleFavorite = restaurant => {
  console.log('begin toggle', restaurant);
  const state = stringToBoolean(restaurant.is_favorite);
  fetch(`http://localhost:1337/restaurants/${restaurant.id}?is_favorite=${!state}`, { method: 'PUT' })
    .then(res => res.json())
    .then(restaurant => {
      const button = document.querySelector(`button[data-restaurant="${restaurant.id}"]`);
      button.innerHTML = stringToBoolean(restaurant.is_favorite) ? icons.star : icons.starOutline;
      console.log('end toggle', restaurant);
    });
};
