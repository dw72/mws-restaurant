const notifyOnlineStatus = () => {
  const snackBar = document.querySelector('#snackbar');

  console.log('Online:', navigator.onLine);
  if (navigator.onLine) {
    snackBar.innerHTML = '<p><strong>You are back Online!</strong></p><p>All changes will be saved immediately.</p>';
  } else {
    snackBar.innerHTML =
      '<p><strong>You are offline!</strong></p><p>All changes will be saved after connection is back.</p>';
  }

  snackBar.classList.toggle('show');
  setTimeout(() => {
    snackBar.classList.toggle('show');
  }, 4000);
};

window.addEventListener('online', notifyOnlineStatus);
window.addEventListener('offline', notifyOnlineStatus);
