/* Multi-step estimate form controller.

   Progressive enhancement: without JavaScript the form shows every field and
   the normal Web3Forms submit still works. With JavaScript the form becomes
   three steps. Submission still goes through assets/js/site.js (initWeb3Forms),
   which keeps the Web3Forms request, success and error states, and generate_lead.

   Analytics here never include names, phone numbers, emails or addresses. */

(() => {
  const track = (formId, eventName, params = {}) => {
    try {
      if (typeof jcAnalytics !== "undefined") {
        jcAnalytics.gaEvent(eventName, {
          form_id: formId,
          page_location: window.location.pathname,
          ...params
        });
      }
    } catch (error) {
      /* Analytics must never block the form. */
    }
  };

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  const isValidPhone = (value) => {
    const digits = value.replace(/\D/g, "");
    return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
  };
  const isValidStreet = (value) => {
    const text = value.trim();
    return text.length >= 6 && /\d/.test(text) && /[a-z]/i.test(text);
  };

  const setError = (form, key, message) => {
    const input = form.querySelector(`[name="${key}"]`);
    const error = form.querySelector(`[data-error-for="${key}"]`);
    if (error) {
      error.textContent = message || "";
      error.classList.toggle("is-visible", Boolean(message));
    }
    if (input && input.type !== "radio") {
      input.setAttribute("aria-invalid", message ? "true" : "false");
    }
  };

  const initForm = (form) => {
    const formId = form.dataset.formName || "estimate_form";
    const steps = Array.from(form.querySelectorAll("[data-step]"));
    const segments = Array.from(form.querySelectorAll("[data-progress-seg]"));
    const count = form.querySelector("[data-step-count]");
    const backButton = form.querySelector("[data-back]");
    const submitButton = form.querySelector("[data-next]");
    const total = steps.length;
    let current = 0;
    let started = false;

    form.classList.add("is-enhanced");
    form.noValidate = true;

    const stepLabels = {
      0: "Continue",
      [total - 1]: "Request My Free Estimate"
    };

    const render = () => {
      steps.forEach((step, index) => {
        step.hidden = index !== current;
      });
      segments.forEach((segment, index) => {
        segment.classList.toggle("is-done", index < current);
        segment.classList.toggle("is-current", index === current);
      });
      if (count) {
        count.textContent = `Step ${current + 1} of ${total}`;
      }
      if (backButton) {
        backButton.hidden = current === 0;
      }
      if (submitButton && !submitButton.disabled) {
        submitButton.textContent = current === total - 1 ? stepLabels[total - 1] : stepLabels[0];
      }
    };

    const focusStep = () => {
      const legend = steps[current] && steps[current].querySelector("legend");
      if (legend) {
        legend.focus({ preventScroll: false });
      }
    };

    const goTo = (index, moveFocus = true) => {
      current = Math.max(0, Math.min(index, total - 1));
      render();
      if (moveFocus) {
        focusStep();
      }
    };

    /* Validation for a single step. Returns true if the step is valid. */
    const validateStep = (index) => {
      const step = steps[index];
      let firstInvalid = null;
      let valid = true;

      const fail = (key, message, errorType) => {
        setError(form, key, message);
        track(formId, "form_error", { step: index + 1, error_type: errorType });
        if (!firstInvalid) {
          firstInvalid = form.querySelector(`[name="${key}"]`);
        }
        valid = false;
      };

      Array.from(step.querySelectorAll("input[name], select[name], textarea[name]")).forEach((el) => {
        if (el.type === "radio" || el.name === "botcheck") {
          return;
        }
        setError(form, el.name, "");
      });

      /* Service choice (radio group). */
      const serviceChecked = step.querySelector('input[name="service_type"]:checked');
      if (step.querySelector('input[name="service_type"]')) {
        if (!serviceChecked) {
          setError(form, "service_type", "Choose the service you need.");
          track(formId, "form_error", { step: index + 1, error_type: "required" });
          firstInvalid = firstInvalid || step.querySelector('input[name="service_type"]');
          valid = false;
        } else {
          setError(form, "service_type", "");
        }
      }

      const street = step.querySelector('[name="project_street_address"]');
      if (street) {
        if (!street.value.trim()) {
          fail("project_street_address", "Enter the street address for the project.", "required");
        } else if (!isValidStreet(street.value)) {
          fail("project_street_address", "Enter a street address with a number, for example 123 Main Street.", "invalid_address");
        }
      }

      const name = step.querySelector('[name="name"]');
      if (name) {
        if (name.value.trim().length < 2) {
          fail("name", "Enter your full name.", "required");
        }
      }

      const phone = step.querySelector('[name="phone"]');
      if (phone) {
        if (!phone.value.trim()) {
          fail("phone", "Enter your phone number.", "required");
        } else if (!isValidPhone(phone.value)) {
          fail("phone", "Enter a 10-digit phone number.", "invalid_phone");
        }
      }

      const email = step.querySelector('[name="email"]');
      if (email) {
        if (!email.value.trim()) {
          fail("email", "Enter your email address.", "required");
        } else if (!isValidEmail(email.value.trim())) {
          fail("email", "Enter a valid email address, for example name@example.com.", "invalid_email");
        }
      }

      if (firstInvalid && typeof firstInvalid.focus === "function") {
        firstInvalid.focus();
      }
      return valid;
    };

    /* Track the first real interaction, once per page load. */
    const markStarted = () => {
      if (!started) {
        started = true;
        track(formId, "form_start", { step: 1 });
      }
    };
    form.addEventListener("input", markStarted);
    form.addEventListener("change", markStarted);

    /* Continue / submit. The submit button is the only submit control, so Enter
       in a field also arrives here as a click. Earlier steps never submit. */
    form.addEventListener("click", (event) => {
      const button = event.target.closest('button[type="submit"]');
      if (!button) {
        return;
      }
      if (submitButton && submitButton.disabled) {
        event.preventDefault();
        return;
      }
      if (current < total - 1) {
        event.preventDefault();
        if (validateStep(current)) {
          goTo(current + 1);
          track(formId, "form_step", { step: current + 1 });
        }
        return;
      }
      /* Final step: every step must be valid before the real submit runs. */
      for (let index = 0; index < total; index += 1) {
        if (!validateStep(index)) {
          event.preventDefault();
          goTo(index);
          return;
        }
      }
      const service = form.querySelector('input[name="service_type"]:checked');
      track(formId, "form_submit_attempt", {
        step: total,
        service_interest: service ? service.value : undefined
      });
    });

    if (backButton) {
      backButton.addEventListener("click", () => {
        if (current > 0) {
          goTo(current - 1);
        }
      });
    }

    /* Escape steps back one screen. Values are kept. */
    form.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && current > 0) {
        event.preventDefault();
        goTo(current - 1);
      }
    });

    /* site.js calls form.reset() after a confirmed success. Return to step one. */
    form.addEventListener("reset", () => {
      window.setTimeout(() => {
        steps.forEach((step) => {
          step.querySelectorAll("[data-error-for]").forEach((error) => {
            error.textContent = "";
            error.classList.remove("is-visible");
          });
        });
        goTo(0, false);
      }, 0);
    });

    render();
  };

  document.querySelectorAll("form[data-multistep]").forEach(initForm);
})();
