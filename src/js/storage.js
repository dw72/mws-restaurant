import idb from 'idb';

export let storage = (() => {
  let db;

  function getDB() {
    if (!db) {
      db = idb
        .open('mws-restaurants', 1, upgradeDb => {
          switch (upgradeDb.oldVersion) {
            case 0:
              upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
              break;
          }
        })
        .catch(err => {
          console.error('Local database open failed: ', err.stack);
        });
    }
    return db;
  }

  return {
    async getAllRestaurants() {
      const db = await getDB();
      const restaurants = db
        .transaction('restaurants')
        .objectStore('restaurants')
        .getAll();
      return restaurants;
    },
    async getRestaurant(id) {
      const db = await getDB();
      const restaurant = db
        .transaction('restaurants')
        .objectStore('restaurants')
        .get(+id);
      return restaurant;
    },
    async putAllRestaurants(restaurants) {
      const db = await getDB();
      const tx = db.transaction('restaurants', 'readwrite');
      const store = tx.objectStore('restaurants');
      for (let restaurant of restaurants) {
        store.put(restaurant);
      }
      return tx.complete;
    },
    async putRestaurant(restaurant) {
      const db = await getDB();
      const tx = db.transaction('restaurants', 'readwrite');
      tx.objectStore('restaurants').put(restaurant);
      return tx.complete;
    }
  };
})();
