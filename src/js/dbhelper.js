import { storage } from "./storage";

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
    throw new Error("The network response was not ok");
  }

  /**
   * Fetch restaurants data - first try load from idb, next fetch from api and update idb data.
   */
  static async fetchAllRestaurantsFromApi() {
    const restaurants = await fetch(`${DBHelper.API_URL}/restaurants`).then(DBHelper.jsonFromResponse);
    const reviews = await fetch(`${DBHelper.API_URL}/reviews`).then(DBHelper.jsonFromResponse);
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
      return dbData && dbData.length ? dbData : apiData;
    }
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static async fetchRestaurantFromApi(id) {
    const restaurant = await fetch(`${DBHelper.API_URL}/restaurants/${id}`).then(DBHelper.jsonFromResponse);
    restaurant.reviews = await fetch(`${DBHelper.API_URL}/reviews?restaurant_id=${id}`).then(DBHelper.jsonFromResponse);
    storage.putRestaurant(restaurant);
    return restaurant;
  }

  static async fetchRestaurantById(id) {
    let dbData, apiData;
    try {
      dbData = await storage.getRestaurant(id);
      apiData = await DBHelper.fetchRestaurantFromApi(id);
    } finally {
      return dbData || apiData;
    }
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine = "all", neighborhood = "all") {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants().then(restaurants => {
      if (!restaurants) {
        return [];
      }

      let results = restaurants;
      if (cuisine != "all") {
        // filter by cuisine
        results = results.filter(r => r.cuisine_type == cuisine);
      }
      if (neighborhood != "all") {
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
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then(reg => {
          console.debug(`Service worker registered with scope ${reg.scope}`);
        })
        .catch(error => {
          console.error(`Registration of service worker failed with: ${error}`);
        });
    }
  }

  static registerSync(type) {
    return navigator.serviceWorker.ready.then(reg => {
      if (reg.sync) {
        return reg.sync
          .register(type)
          .then(event => {
            console.log("Sync registered", event);
          })
          .catch(error => {
            console.log("Sync registration failed", error);
          });
      } else {
        console.log("Sync not supported");
      }
    });
  }
}

export default DBHelper;
