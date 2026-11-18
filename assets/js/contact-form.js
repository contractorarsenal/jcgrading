/* Single-page estimate form: validation and form_start.

   Submission itself stays in assets/js/site.js (initWeb3Forms): the Web3Forms
   request, duplicate-submit protection, success and error states, and
   generate_lead after confirmed success.

   This file runs in the window capture phase, so an invalid form is stopped
   before site.js sees the submit event. Analytics never include names, email
   addresses, phone numbers, or street addresses. */

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
  const isValidAddress = (value) => {
    const text = value.trim();
    return text.length >= 6 && /\d/.test(text) && /[a-z]/i.test(text);
  };

  const rules = {
    name: {
      check: (v) => v.trim().length >= 2,
      required: "Enter your full name.",
      invalid: "Enter your full name."
    },
    email: {
      check: (v) => isValidEmail(v.trim()),
      required: "Enter your email address.",
      invalid: "Enter a valid email address, for example name@example.com."
    },
    phone: {
      check: (v) => isValidPhone(v),
      required: "Enter your phone number.",
      invalid: "Enter a 10-digit phone number."
    },
    project_street_address: {
      check: (v) => isValidAddress(v),
      required: "Enter the project address.",
      invalid: "Enter the project address, including the street number."
    }
  };

  const setError = (form, name, message) => {
    const input = form.querySelector(`[name="${name}"]`);
    const error = form.querySelector(`[data-error-for="${name}"]`);
    if (error) {
      error.textContent = message || "";
      error.classList.toggle("is-visible", Boolean(message));
    }
    if (input) {
      input.setAttribute("aria-invalid", message ? "true" : "false");
    }
  };

  const clearErrors = (form) => {
    Object.keys(rules).forEach((name) => setError(form, name, ""));
  };

  const initForm = (form) => {
    const formId = form.dataset.formName || "estimate_form";
    let started = false;
    form.noValidate = true;
    form.classList.add("is-enhanced");

    const markStarted = () => {
      if (!started) {
        started = true;
        track(formId, "form_start", { step: 1 });
      }
    };
    form.addEventListener("input", markStarted);
    form.addEventListener("focusin", markStarted);

    /* Clear a field's message as soon as it becomes valid. */
    form.addEventListener("input", (event) => {
      const rule = rules[event.target.name];
      if (rule && rule.check(event.target.value)) {
        setError(form, event.target.name, "");
      }
    });

    form.addEventListener("reset", () => {
      window.setTimeout(() => clearErrors(form), 0);
    });

    /* Runs before site.js, so invalid or duplicate submits never reach the request code. */
    window.addEventListener("submit", (event) => {
      if (event.target !== form) {
        return;
      }
      const submitButton = form.querySelector("[data-submit]");
      if (submitButton && submitButton.disabled) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      let firstInvalid = null;
      let errorType = null;
      Object.keys(rules).forEach((name) => {
        const input = form.querySelector(`[name="${name}"]`);
        if (!input) {
          return;
        }
        const value = input.value || "";
        const rule = rules[name];
        if (!value.trim()) {
          setError(form, name, rule.required);
          errorType = errorType || "required";
          firstInvalid = firstInvalid || input;
        } else if (!rule.check(value)) {
          setError(form, name, rule.invalid);
          errorType = errorType || name;
          firstInvalid = firstInvalid || input;
        } else {
          setError(form, name, "");
        }
      });

      if (firstInvalid) {
        event.preventDefault();
        event.stopImmediatePropagation();
        track(formId, "form_error", { error_type: errorType });
        firstInvalid.focus();
      }
    }, true);
  };

  document.querySelectorAll("form.cf-form").forEach(initForm);
})();
