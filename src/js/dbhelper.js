import { storage } from './storage';

class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get API_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}`;
  }

  /**
   * Check if response is ok and return json data
   */
  static jsonFromResponse(response) {
    if (response.ok) {
      return response.json();
    }
    throw new Error(`Server responded with status ${response.status}: ${response.statusText}`);
  }

  static handleFetchError(error) {
    console.log('Error while sending request to server', error);
  }

  /**
   * Fetch restaurants data - first try load from idb, next fetch from api and update idb data.
   */
  static async fetchAllRestaurantsFromApi() {
    const restaurants = await fetch(`${DBHelper.API_URL}/restaurants`)
      .then(DBHelper.jsonFromResponse)
      .catch(DBHelper.handleFetchError);
    const reviews = await fetch(`${DBHelper.API_URL}/reviews`)
      .then(DBHelper.jsonFromResponse)
      .catch(DBHelper.handleFetchError);
    restaurants.forEach(restaurant => {
      restaurant.reviews = reviews.filter(review => review.restaurant_id === restaurant.id).map(review => review);
    });
    storage.putAllRestaurants(restaurants);
    return restaurants;
  }

  static async fetchRestaurants() {
    let dbData, apiData;
    try {
      dbData = await storage.getAllRestaurants();
      apiData = await DBHelper.fetchAllRestaurantsFromApi();
    } finally {
      const restaurants = apiData || dbData;
      for (let restaurant of restaurants) {
        const changes = await storage.getOutboxData(restaurant.id);
        if (changes) {
          restaurant.is_favorite = changes.is_favorite;
        }
      }
      return restaurants;
    }
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static async fetchRestaurantFromApi(id) {
    const restaurant = await fetch(`${DBHelper.API_URL}/restaurants/${id}`)
      .then(DBHelper.jsonFromResponse)
      .catch(DBHelper.handleFetchError);
    restaurant.reviews = await fetch(`${DBHelper.API_URL}/reviews?restaurant_id=${id}`)
      .then(DBHelper.jsonFromResponse)
      .catch(DBHelper.handleFetchError);
    storage.putRestaurant(restaurant);
    return restaurant;
  }

  static async fetchRestaurantById(id) {
    let dbData, apiData;
    try {
      dbData = await storage.getRestaurant(id);
      apiData = await DBHelper.fetchRestaurantFromApi(id);
    } finally {
      const restaurant = apiData || dbData;
      const changes = await storage.getOutboxData(restaurant.id);
      if (changes && changes.reviews) {
        if (restaurant.reviews) {
          restaurant.reviews = restaurant.reviews.concat(changes.reviews);
        } else {
          restaurant.reviews = changes.reviews;
        }
      }
      return restaurant;
    }
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine = 'all', neighborhood = 'all') {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants().then(restaurants => {
      if (!restaurants) {
        return [];
      }

      let results = restaurants;
      if (cuisine != 'all') {
        // filter by cuisine
        results = results.filter(r => r.cuisine_type == cuisine);
      }
      if (neighborhood != 'all') {
        // filter by neighborhood
        results = results.filter(r => r.neighborhood == neighborhood);
      }
      return results;
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods() {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants().then(restaurants => {
      if (!restaurants) {
        return [];
      }

      // Get all neighborhoods from all restaurants
      const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
      // Remove duplicates from neighborhoods
      const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
      return uniqueNeighborhoods;
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines() {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants().then(restaurants => {
      if (!restaurants) {
        return [];
      }

      // Get all neighborhoods from all restaurants
      const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
      // Remove duplicates from cuisines
      const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
      return uniqueCuisines;
    });
  }

  /**
   * Put favorite status for restaurant specified by id.
   */
  static toggleFavoriteForRestaurant(id, favorite) {
    return fetch(`${DBHelper.API_URL}/restaurants/${id}/?is_favorite=${favorite}`, { method: 'PUT' })
      .then(DBHelper.jsonFromResponse)
      .catch(DBHelper.handleFetchError);
  }

  static postReview(review) {
    return fetch(`${DBHelper.API_URL}/reviews/`, {
      method: 'POST',
      body: JSON.stringify(review)
    })
      .then(DBHelper.jsonFromResponse)
      .catch(DBHelper.handleFetchError);
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      // @ts-ignore
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }

  /**
   * Register service worker
   */
  static registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(reg => {
          console.debug(`Service worker registered with scope ${reg.scope}`);
        })
        .catch(error => {
          console.error(`Registration of service worker failed with: ${error}`);
        });
    }
  }

  /**
   * Register service workers sync tag
   */
  static registerSync(tag) {
    return new Promise((resolve, reject) => {
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready
          .then(async reg => {
            resolve(
              reg.sync
                .register(tag)
                .then(() => {
                  console.debug(`${tag} registration successfull`);
                })
                .catch(err => {
                  console.error(`${tag} registration failed`, err);
                })
            );
          })
          .catch(err => {
            console.error('There is a problem with ServiceWorker', err);
            reject();
          });
      } else {
        console.debug('Background sync not supported');
        reject();
      }
    });
  }
}

export default DBHelper;
