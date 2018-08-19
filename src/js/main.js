import 'lazysizes';
import GoogleMapsLoader from './gmaps';
import DBHelper from './dbhelper';
import { storage } from './storage';
import './notify';

const state = {
  restaurants: [],
  neighborhoods: [],
  cuisines: [],
  markers: [],
  interactive: false
};
let map;

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  DBHelper.registerServiceWorker();

  fetchNeighborhoods();
  fetchCuisines();

  loadStaticMap();

  document.querySelector('#neighborhoods-select').addEventListener('change', () => {
    updateRestaurants();
  });
  document.querySelector('#cuisines-select').addEventListener('change', () => {
    updateRestaurants();
  });

  document.querySelector('#map-container').addEventListener('click', loadGoogleMapsApi);
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
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.appendChild(option);
  });
};

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  // @ts-ignore
  const cIndex = cSelect.selectedIndex;
  // @ts-ignore
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  return DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood)
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
    ul.appendChild(createRestaurantHTML(restaurant));
  });
  if (state.interactive) {
    addMarkersToMap();
  } else {
    loadStaticMap();
  }
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = restaurant => {
  const isTrue = value => {
    if (value === true || value === 'true') return true;
    return false;
  };

  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img lazyload';
  const imageFile = require(`../img/${restaurant.id}.jpg`);
  image.setAttribute('data-src', imageFile.src);
  image.setAttribute('data-srcset', imageFile.srcSet);
  image.setAttribute('data-sizes', 'auto');
  image.alt = `Photo of ${restaurant.name}`;
  li.appendChild(image);

  const div = document.createElement('div');
  div.className = 'restaurant-header';
  li.appendChild(div);

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  div.appendChild(name);

  const favId = `favbox-${restaurant.id}`;
  const favInput = document.createElement('input');
  favInput.type = 'checkbox';
  favInput.checked = isTrue(restaurant.is_favorite);
  favInput.id = favId;
  favInput.setAttribute('aria-label', `"${restaurant.name}" is your favorite`);
  favInput.setAttribute('data-id', restaurant.id);
  favInput.addEventListener('change', toggleFavorite);
  div.appendChild(favInput);

  const favLabel = document.createElement('label');
  favLabel.htmlFor = favId;
  favLabel.innerHTML =
    '<svg viewBox="0 0 24 24"><path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" /></svg >';
  div.appendChild(favLabel);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.appendChild(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.appendChild(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-label', `View details of ${restaurant.name}`);
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.appendChild(more);

  return li;
};

/**
 * Favorite restaurant button clicked
 */

const toggleFavorite = async event => {
  const id = +event.target.dataset.id;
  const isFavorite = event.target.checked;
  let changes = await storage.getOutboxData(id);
  changes = { id, ...changes, is_favorite: isFavorite };
  await storage.putOutboxData(changes);
  // Sync outbox with api
  DBHelper.registerSync('sync-restaurants').catch(() => {
    DBHelper.toggleFavoriteForRestaurant(id, isFavorite);
  });
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
 * Load static map from Google Maps Static API
 */
const loadStaticMap = async () => {
  const URL = 'https://maps.googleapis.com/maps/api/staticmap';
  const KEY = 'AIzaSyCXhuoZlCytSxy3D-9LMn6ZLQPDSY8y2-o';
  const map = document.querySelector('#map');

  let zoom, scale, size;
  if (map.clientWidth <= 660) {
    scale = 1;
    zoom = 12;
    size = 'small';
  } else if (map.clientWidth <= 1200) {
    scale = 2;
    zoom = 11;
    size = 'mid';
  } else {
    scale = 2;
    zoom = 10;
    size = 'tiny';
  }

  if (!state.restaurants.length) {
    await updateRestaurants();
  }

  let bg = `${URL}?&key=${KEY}&center=40.722216,-73.987501&zoom=${zoom}&size=1280x400&scale=${scale}&markers=size:${size}`;
  for (let restaurant of state.restaurants) {
    bg += `|${restaurant.latlng.lat},${restaurant.latlng.lng}`;
  }
  map.setAttribute('style', `background: url(${bg}) center center no-repeat; background-size: cover;`);
};

/**
 * Load interactive Google Maps API
 */
const loadGoogleMapsApi = event => {
  GoogleMapsLoader.load(() => {
    let loc = {
      lat: 40.722216,
      lng: -73.987501
    };
    map = new google.maps.Map(document.getElementById('map'), {
      // @ts-ignore
      title: 'Restaurants Map',
      zoom: 12,
      center: loc,
      scrollwheel: false
    });
    addMarkersToMap();

    state.interactive = true;

    const mapContainer = document.querySelector('#map-container');
    mapContainer.removeEventListener('click', loadGoogleMapsApi);
    const mapDimmer = document.querySelector('#map-dimmer');
    mapDimmer.style.zIndex = -999;
    mapDimmer.classList.remove('active');
  });
};
