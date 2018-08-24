# Mobile Web Specialist Certification Course

**Restaurant Reviews** project.

---

## Prequisites

Before running this project You need to install and run [Local Development API Server](https://github.com/udacity/mws-restaurant-stage-3)

## Steps to run the project

1. Clone repository

   ```sh
   git clone git@github.com:dw72/mws-restaurant.git
   ```

1. Go to the app folder

   ```sh
   cd mws-restaurant
   ```

1. Install dependencies (if you don't have node install it first)

   ```sh
   npm install
   ```

1. Add your API keys

   - Google Maps API key in line 3 of _gmaps.js_ file

   ```javascript
   GoogleMapsLoader.KEY = "YOUR_GOOGLE_MAPS_API_KEY";
   ```

   - Google Maps Static API in line 251 of _main.js_ file

   ```javascript
   const KEY = "YOUR_GOOGLE_MAPS_STATIC_API_KEY";
   ```

1. If you want build project and run preview production server

   ```sh
   npm run build
   npm start
   ```

   If you want run development server with live updates

   ```sh
   npm run dev
   ```

1. Open site `http://localhost:5500` in your browser.
