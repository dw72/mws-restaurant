/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get API_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}`;
  }

  static get IDB() {
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }

    return idb
      .open("mws-restaurants", 1, upgradeDb => {
        switch (upgradeDb.oldVersion) {
          case 0:
            upgradeDb.createObjectStore("restaurants", { keyPath: "id" });
            break;
        }
      })
      .catch(err => {
        console.error("Local database open failed: ", err.stack);
      });
  }

  /**
   * Fetch all reviews from api.
   */
  static fetchReviewsFromAPI() {
    return fetch(`${DBHelper.API_URL}/reviews`).then(res => {
      if (res.ok) {
        return res.json();
      }
      throw new Error("The network response was not ok");
    });
  }

  /**
   * Fetch reviews for restaurant from api.
   */
  static fetchReviewsForRestaurantFromAPI(restaurantId) {
    return fetch(`${DBHelper.API_URL}/reviews?restaurant_id=${restaurantId}`).then(res => {
      if (res.ok) {
        return res.json();
      }
      throw new Error("The network response was not ok");
    });
  }

  /**
   * Fetch all restaurants from api.
   */
  static fetchRestaurantsFromAPI() {
    return fetch(`${DBHelper.API_URL}/restaurants`).then(res => {
      if (res.ok) {
        return res.json();
      }
      throw new Error("The network response was not ok");
    });
  }

  /**
   * Fetch all restaurants from local database.
   */
  static fetchRestaurantsFromDB(database) {
    return database
      .transaction("restaurants")
      .objectStore("restaurants")
      .getAll();
  }

  /**
   * Put restaurants to local database
   */
  static putRestaurantsToDatabase(restaurants, database) {
    const tx = database.transaction("restaurants", "readwrite");
    const store = tx.objectStore("restaurants");
    restaurants.forEach(restaurant => {
      store.put(restaurant);
    });

    tx.complete;
    return restaurants;
  }

  /**
   * Fetch restaurants data - first try load from idb, next fetch from api and update idb data.
   */
  static fetchRestaurants() {
    return DBHelper.IDB.then(db => {
      if (!db) return;

      const restaurantsFromDB = this.fetchRestaurantsFromDB(db);

      // Fetch restaurants and reviews from api and combine the proper reviews for each restaurant
      const restaurantsFromAPI = Promise.all([this.fetchRestaurantsFromAPI(), this.fetchReviewsFromAPI()])
        .then(([restaurants, reviews]) => {
          restaurants.forEach(restaurant => {
            const restaurantReviews = reviews.filter(review => review.restaurant_id === restaurant.id);
            restaurant.reviews = restaurantReviews.map(review => review);
          });

          return restaurants;
        })
        // Put fetched restaurants into local database
        .then(restaurants => this.putRestaurantsToDatabase(restaurants, db))
        .catch(err => {
          console.error("Error while fetching all restaurants from API", err);
        });

      return restaurantsFromDB.then(restaurants => {
        return restaurants && restaurants.length ? restaurantsFromDB : restaurantsFromAPI;
      });
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static async fetchRestaurantById(id) {
    return DBHelper.IDB.then(db => {
      if (!db) return;
      // Try load restaurant from local database
      const restaurantFromDB = db
        .transaction("restaurants")
        .objectStore("restaurants")
        .get(+id);

      // Fetch restaurant from API
      const restaurantFromAPI = fetch(`${DBHelper.API_URL}/restaurants/${id}`)
        .then(res => {
          if (res.ok) {
            return res.json();
          }

          throw new Error("The network response was not ok");
        })
        .then(restaurant => {
          if (restaurant) {
            // Fetch restaurant reviews from API
            return this.fetchReviewsForRestaurantFromAPI(restaurant.id).then(reviews => {
              restaurant.reviews = reviews.map(review => review);
              return restaurant;
            });
          }

          return restaurant;
        })
        .then(restaurant => {
          if (restaurant) {
            // Put fetched restaurant into local database
            const tx = db.transaction("restaurants", "readwrite");
            const store = tx.objectStore("restaurants");
            store.put(restaurant);
            tx.complete;
          }

          return restaurant;
        })
        .catch(err => {
          console.error("Error while fetching restaurant from API", err);
        });

      return restaurantFromDB.then(restaurant => {
        return restaurant && Object.keys(restaurant).length ? restaurantFromDB : restaurantFromAPI;
      });
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static async fetchRestaurantByCuisineAndNeighborhood(cuisine = "all", neighborhood = "all") {
    // Fetch all restaurants
    return await DBHelper.fetchRestaurants().then(restaurants => {
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
  static async fetchNeighborhoods() {
    // Fetch all restaurants
    return await DBHelper.fetchRestaurants().then(restaurants => {
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
  static async fetchCuisines() {
    // Fetch all restaurants
    return await DBHelper.fetchRestaurants().then(restaurants => {
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
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    const size = 840;
    const name = restaurant.photograph || "placeholder";
    const ext = "jpg";
    return `/img/${name}-${size}px.${ext}`;
  }

  /**
   * Restaurant image srcset.
   */
  static imageSrcsetForRestaurant(restaurant) {
    const sizes = [840, 720, 600, 480, 360];
    const name = restaurant.photograph || "placeholder";
    const ext = "jpg";
    return sizes.map(size => `/img/${name}-${size}px.${ext} ${size}w`).join(",");
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
}
