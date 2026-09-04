/**
 * Progressive-enhancement address autocomplete using the current Places API
 * (New) PlaceAutocompleteElement widget. Every field this touches keeps
 * working as a plain manual text input with zero JS changes required:
 *
 *   - No API key configured (assets/js/maps-config.js)  -> does nothing.
 *   - Maps script fails to load (network/key/API issue) -> does nothing.
 *   - PlaceAutocompleteElement unsupported in a browser  -> does nothing.
 *
 * In every case above, the original <input name="project_address"> is left
 * exactly as it was, so the estimate forms never depend on this loading.
 */
(() => {
  const config = window.JC_MAPS_CONFIG || {};
  const targets = document.querySelectorAll("[data-address-autocomplete]");

  if (!config.apiKey || targets.length === 0) {
    return;
  }

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

  const enhanceField = async (input) => {
    if (!window.google?.maps?.places?.PlaceAutocompleteElement) {
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "jc-address-autocomplete-wrap";
    wrapper.style.position = "relative";

    const autocompleteEl = new window.google.maps.places.PlaceAutocompleteElement({
      includedRegionCodes: config.region ? [config.region] : undefined
    });
    autocompleteEl.id = `${input.id}-autocomplete`;
    autocompleteEl.className = input.className;
    autocompleteEl.setAttribute("placeholder", input.getAttribute("placeholder") || "Start typing your address");

    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) {
      autocompleteEl.setAttribute("aria-label", label.textContent.trim());
    }

    input.insertAdjacentElement("beforebegin", wrapper);
    wrapper.appendChild(autocompleteEl);

    // Keep the original field in the form for submission, but hide it from
    // view/tab order now that the enhanced widget is standing in for it.
    input.setAttribute("aria-hidden", "true");
    input.setAttribute("tabindex", "-1");
    input.style.position = "absolute";
    input.style.width = "1px";
    input.style.height = "1px";
    input.style.opacity = "0";
    input.style.pointerEvents = "none";

    autocompleteEl.addEventListener("gmp-select", async (event) => {
      try {
        const prediction = event.placePrediction;
        if (!prediction) {
          return;
        }
        const place = prediction.toPlace();
        await place.fetchFields({ fields: ["formattedAddress"] });

        if (place.formattedAddress) {
          input.value = place.formattedAddress;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));

          if (typeof window.gtag === "function") {
            window.gtag("event", "address_autocomplete_selected", {
              page_location: window.location.pathname
            });
          }
          if (typeof window.clarity === "function") {
            window.clarity("event", "address_autocomplete_selected");
          }
        }
      } catch (error) {
        // Selection failed to resolve — the visible manual field still has
        // whatever the user typed, so submission is unaffected.
      }
    });
  };

  loadMapsScript()
    .then(() => {
      targets.forEach((input) => {
        enhanceField(input).catch(() => {
          /* Leave the plain input in place on any per-field failure. */
        });
      });
    })
    .catch(() => {
      /* Maps failed to load — plain manual address inputs remain active. */
    });
})();
