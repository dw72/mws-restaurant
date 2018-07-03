let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  // Get id from URL
  const id = getParameterByName("id");
  if (!id) {
    console.error("Error: No restaurant id in URL");
  } else {
    // Fetch restaurant by id
    DBHelper.fetchRestaurantById(id)
      .then(restaurant => {
        if (restaurant) {
          self.restaurant = restaurant;
          fillRestaurantHTML();

          self.map = new google.maps.Map(document.getElementById("map"), {
            zoom: 16,
            center: restaurant.latlng,
            scrollwheel: false
          });

          fillBreadcrumb();
          DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
        }
      })
      .catch(err => {
        console.error(err);
      });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById("restaurant-name");
  name.innerHTML = restaurant.name;

  const address = document.getElementById("restaurant-address");
  address.setAttribute("aria-label", `Address: ${restaurant.address}`);
  address.innerHTML = restaurant.address;

  const image = document.getElementById("restaurant-img");
  image.className = "restaurant-img";
  image.srcset = DBHelper.imageSrcsetForRestaurant(restaurant);
  image.sizes = "(min-width: 1440px) 30vw, (min-width: 768px) 45vw, 100vw";
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = "";

  const cuisine = document.getElementById("restaurant-cuisine");
  cuisine.setAttribute("aria-label", `Cuisine: ${restaurant.cuisine_type}`);
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.querySelector("#restaurant-hours tbody");
  for (let key in operatingHours) {
    const row = document.createElement("tr");

    const day = document.createElement("td");
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement("td");
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById("reviews-container");
  const title = document.createElement("h2");
  title.innerHTML = "Reviews";
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement("p");
    noReviews.innerHTML = "No reviews yet!";
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById("reviews-list");
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = review => {
  const li = document.createElement("li");
  const name = document.createElement("p");
  name.innerHTML = review.name;
  name.setAttribute("aria-label", `Written by: ${review.name}`);
  li.appendChild(name);

  const date = document.createElement("p");
  const formatedDate = new Date(review.createdAt).toLocaleString();
  date.innerHTML = formatedDate;
  date.setAttribute("aria-label", `On: ${formatedDate}`);
  li.appendChild(date);

  const rating = document.createElement("p");
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement("p");
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById("breadcrumb");
  const li = document.createElement("li");
  li.innerHTML = restaurant.name;
  li.setAttribute("aria-current", "page");
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
};
