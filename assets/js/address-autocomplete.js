/**
 * Progressive-enhancement address autocomplete using the current Places API
 * (New) PlaceAutocompleteElement widget, attached to the street-address
 * field of a structured Street / City / State / ZIP address group.
 *
 * Every field this touches keeps working as plain manual text inputs with
 * zero JS changes required:
 *
 *   - No API key configured (assets/js/maps-config.js)  -> does nothing.
 *   - Maps script fails to load (network/key/API issue) -> does nothing.
 *   - PlaceAutocompleteElement unsupported in a browser  -> does nothing.
 *
 * In every case above, the original <input data-address-street> is left
 * exactly as it was, so no form ever depends on this loading, and a user
 * can always finish typing the street/city/state/zip fields by hand.
 */
(() => {
  const config = window.JC_MAPS_CONFIG || {};
  const streetInputs = document.querySelectorAll("[data-address-street]");

  if (!config.apiKey || streetInputs.length === 0) {
    return;
  }

  // Maps administrative_area_level_1 short codes to the full state names
  // used as <option> values in the State dropdown, in case Google returns
  // only a short code for a given result.
  const STATE_ABBR_TO_NAME = {
    AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
    CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
    FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
    IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
    ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan",
    MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
    NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
    NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota",
    OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
    RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
    TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
    WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming"
  };

  const loadMapsScript = () =>
    new Promise((resolve, reject) => {
      if (window.google && window.google.maps && window.google.maps.places) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      const params = new URLSearchParams({
        key: config.apiKey,
        libraries: "places",
        loading: "async",
        v: "weekly"
      });
      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Google Maps script failed to load"));
      document.head.appendChild(script);
    });

  const setFieldValue = (field, value, { onlyIfEmpty = false } = {}) => {
    if (!field || !value) {
      return;
    }
    if (onlyIfEmpty && field.value.trim()) {
      return;
    }
    field.value = value;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const getComponent = (components, type) =>
    components.find((component) => component.types.includes(type));

  const applyAddressComponents = (place, group) => {
    const components = place.addressComponents || [];

    const streetNumber = getComponent(components, "street_number");
    const route = getComponent(components, "route");
    const locality =
      getComponent(components, "locality") || getComponent(components, "postal_town");
    const state = getComponent(components, "administrative_area_level_1");
    const postalCode = getComponent(components, "postal_code");
    const subpremise = getComponent(components, "subpremise");

    const streetParts = [streetNumber?.longText, route?.longText].filter(Boolean);
    const streetValue = streetParts.length > 0 ? streetParts.join(" ") : place.formattedAddress;
    setFieldValue(group.street, streetValue);

    setFieldValue(group.city, locality?.longText);
    setFieldValue(group.zip, postalCode?.longText);

    if (group.unit && subpremise?.longText) {
      setFieldValue(group.unit, subpremise.longText, { onlyIfEmpty: true });
    }

    if (group.state && state) {
      const stateName =
        state.longText && Array.from(group.state.options).some((opt) => opt.value === state.longText)
          ? state.longText
          : STATE_ABBR_TO_NAME[state.shortText] || null;
      setFieldValue(group.state, stateName);
    }
  };

  const enhanceField = async (streetInput) => {
    if (!window.google?.maps?.places?.PlaceAutocompleteElement) {
      return;
    }

    const form = streetInput.closest("form");
    const group = {
      street: streetInput,
      city: form?.querySelector("[data-address-city]") || null,
      state: form?.querySelector("[data-address-state]") || null,
      zip: form?.querySelector("[data-address-zip]") || null,
      unit: form?.querySelector("[data-address-unit]") || null
    };

    const wrapper = document.createElement("div");
    wrapper.className = "jc-address-autocomplete-wrap";
    wrapper.style.position = "relative";

    const autocompleteEl = new window.google.maps.places.PlaceAutocompleteElement({
      includedRegionCodes: config.region ? [config.region] : undefined,
      includedPrimaryTypes: ["street_address", "premise", "subpremise", "route"],
      locationBias: {
        radius: 400000,
        center: { lat: 37.3382, lng: -121.8863 } // South Bay, CA — soft bias only, does not exclude other results
      }
    });
    autocompleteEl.id = `${streetInput.id}-autocomplete`;
    autocompleteEl.className = streetInput.className;
    autocompleteEl.setAttribute(
      "placeholder",
      streetInput.getAttribute("placeholder") || "Start typing your street address"
    );

    const label = document.querySelector(`label[for="${streetInput.id}"]`);
    if (label) {
      autocompleteEl.setAttribute("aria-label", label.textContent.trim());
    }

    streetInput.insertAdjacentElement("beforebegin", wrapper);
    wrapper.appendChild(autocompleteEl);

    // Keep the original field in the form for submission/validation, but
    // hide it from view/tab order now that the enhanced widget stands in.
    streetInput.setAttribute("aria-hidden", "true");
    streetInput.setAttribute("tabindex", "-1");
    streetInput.style.position = "absolute";
    streetInput.style.width = "1px";
    streetInput.style.height = "1px";
    streetInput.style.opacity = "0";
    streetInput.style.pointerEvents = "none";

    autocompleteEl.addEventListener("gmp-select", async (event) => {
      try {
        const prediction = event.placePrediction;
        if (!prediction) {
          return;
        }
        const place = prediction.toPlace();
        await place.fetchFields({ fields: ["addressComponents", "formattedAddress"] });

        applyAddressComponents(place, group);

        if (typeof window.gtag === "function") {
          window.gtag("event", "address_autocomplete_selected", {
            page_location: window.location.pathname
          });
        }
        if (typeof window.clarity === "function") {
          window.clarity("event", "address_autocomplete_selected");
        }
      } catch (error) {
        // Selection failed to resolve — the visible manual fields still have
        // whatever the user typed, so submission is unaffected.
      }
    });
  };

  loadMapsScript()
    .then(() => {
      streetInputs.forEach((input) => {
        enhanceField(input).catch(() => {
          /* Leave the plain input in place on any per-field failure. */
        });
      });
    })
    .catch(() => {
      /* Maps failed to load — plain manual address inputs remain active. */
    });
})();
