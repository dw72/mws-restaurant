/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`
  }

  /**
   * Fetch all restaurants.
   */
  static async fetchRestaurants(callback) {
    // Fetch all restaurants
    return await fetch(DBHelper.DATABASE_URL)
      .then(res => {
        if (res.ok) {
          return res.json()
        }
        throw new Error('The network response was not ok')
      })
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static async fetchRestaurantById(id) {
    // Fetch restaurant by id.
    const dbUrl = `${DBHelper.DATABASE_URL}/${id}`
    return await fetch(dbUrl)
      .then(res => {
        if (res.ok) {
          return res.json()
        }
        throw new Error('The network response was not ok')
      })
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static async fetchRestaurantByCuisineAndNeighborhood(cuisine = 'all', neighborhood = 'all') {
    // Fetch all restaurants
    return await DBHelper.fetchRestaurants().then(restaurants => {
      if (!restaurants) {
        return []
      }

      let results = restaurants
      if (cuisine != 'all') {
        // filter by cuisine
        results = results.filter(r => r.cuisine_type == cuisine)
      }
      if (neighborhood != 'all') {
        // filter by neighborhood
        results = results.filter(r => r.neighborhood == neighborhood)
      }
      return results
    })
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static async fetchNeighborhoods() {
    // Fetch all restaurants
    return await DBHelper.fetchRestaurants().then(restaurants => {
      if (!restaurants) {
        return []
      }

      // Get all neighborhoods from all restaurants
      const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
      // Remove duplicates from neighborhoods
      const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
      return uniqueNeighborhoods
    })
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static async fetchCuisines() {
    // Fetch all restaurants
    return await DBHelper.fetchRestaurants().then(restaurants => {
      if (!restaurants) {
        return []
      }

      // Get all neighborhoods from all restaurants
      const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
      // Remove duplicates from cuisines
      const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
      return uniqueCuisines
    })
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    const name = restaurant.photograph || 'ph'
    const ext = 'jpg'
    return `/img/${name}-820px.${ext}`
  }

  /**
   * Restaurant image srcset.
   */
  static imageSrcsetForRestaurant(restaurant) {
    const sizes = [820, 740, 570, 440, 320]
    const name = restaurant.photograph || 'ph'
    const ext = 'jpg'
    return sizes.map(size => `/img/${name}-${size}px.${ext} ${size}w`).join(',')
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
    })
    return marker
  }
}
