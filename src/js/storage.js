import idb from 'idb';
import DBHelper from './dbhelper';

export let storage = (() => {
  let db;

  function getDB() {
    if (!db) {
      db = idb
        .open('mws-restaurants', 2, upgradeDb => {
          switch (upgradeDb.oldVersion) {
          case 0:
            upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
          case 1:
            upgradeDb.createObjectStore('outbox', { keyPath: 'id' });
          }
        })
        .catch(err => {
          console.error('Local database open failed: ', err.stack);
        });
    }
    return db;
  }

  async function getStore(name, mode = 'readonly') {
    const db = await getDB();
    return db.transaction(name, mode).objectStore(name);
  }

  return {
    async getAllRestaurants() {
      const store = await getStore('restaurants');
      return store.getAll();
    },
    async getRestaurant(id) {
      const store = await getStore('restaurants');
      return store.get(+id);
    },
    async putAllRestaurants(restaurants) {
      const store = await getStore('restaurants', 'readwrite');
      for (let restaurant of restaurants) {
        await store.put(restaurant);
      }
    },
    async putRestaurant(restaurant) {
      const store = await getStore('restaurants', 'readwrite');
      return store.put(restaurant);
    },
    async getAllOutboxData() {
      const store = await getStore('outbox');
      return store.getAll();
    },
    async getOutboxData(id) {
      const store = await getStore('outbox');
      return store.get(+id);
    },
    async putOutboxData(data) {
      const store = await getStore('outbox', 'readwrite');
      return store.put(data);
    },
    async deleteOutboxData(id) {
      const store = await getStore('outbox', 'readwrite');
      return store.delete(+id);
    },
    async syncRestaurants() {
      console.log('Begin background sync of outbox data');
      try {
        const changes = await this.getAllOutboxData();
        for (let change of changes) {
          const restaurant = await this.getRestaurant(change.id);
          if (change.hasOwnProperty('reviews')) {
            for (let review of change.reviews) {
              const res = await DBHelper.postReview(review);
              restaurant.reviews = restaurant.reviews || [];
              restaurant.reviews.push(res);
            }
          }
          if (change.hasOwnProperty('is_favorite')) {
            const res = await DBHelper.toggleFavoriteForRestaurant(change.id, change.is_favorite);
            restaurant.is_favorite = res.is_favorite;
          }
          await storage.deleteOutboxData(change.id);
          await storage.putRestaurant(restaurant);
        }
        return Promise.resolve();
      } catch (err) {
        return Promise.reject();
      }
    }
  };
})();
