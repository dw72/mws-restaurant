import GoogleMapsLoader from 'google-maps';

GoogleMapsLoader.KEY = process.env.GMAPS_KEY || 'AIzaSyBeRuarAl0xOgQAoPM-FHSWp10qeay3qNw';
GoogleMapsLoader.LIBRARIES = ['places'];

export default GoogleMapsLoader;
