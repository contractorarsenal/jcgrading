/**
 * Single configuration point for Google Maps Platform (Places API).
 *
 * Leave apiKey empty until a browser-restricted Maps key exists — the
 * address autocomplete feature in assets/js/address-autocomplete.js checks
 * this value and simply does nothing (plain manual address entry keeps
 * working) when it is blank. No other file needs to be touched to turn
 * autocomplete on: fill in apiKey below once the key is issued.
 *
 * Required Google Cloud API: "Places API (New)" (and "Maps JavaScript API",
 * which the Places library loads through). See the deployment notes in the
 * project report for exact HTTP-referrer and API restrictions to apply to
 * this key before it goes into a production build.
 */
window.JC_MAPS_CONFIG = {
  apiKey: "",
  region: "US"
};
