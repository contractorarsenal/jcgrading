const body = document.body;
const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileNav = document.querySelector("[data-mobile-nav]");

if (menuToggle && mobileNav) {
  const menuIcon = menuToggle.querySelector(".material-symbols-outlined");

  const closeNav = () => {
    mobileNav.classList.add("hidden");
    body.classList.remove("nav-open");
    menuToggle.setAttribute("aria-expanded", "false");

    if (menuIcon) {
      menuIcon.textContent = "menu";
    }
  };

  menuToggle.addEventListener("click", () => {
    const isHidden = mobileNav.classList.toggle("hidden");
    const isOpen = !isHidden;

    body.classList.toggle("nav-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));

    if (menuIcon) {
      menuIcon.textContent = isOpen ? "close" : "menu";
    }
  });

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNav);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 768) {
      closeNav();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeNav();
    }
  });
}

document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = new Date().getFullYear();
});

/* ── Analytics helpers ──
   Thin wrappers so the rest of this file never has to guard against GA/
   Clarity failing to load (ad blockers, offline, etc). Never pass PII
   (names, emails, phone numbers, addresses, project descriptions) through
   either of these. */
const jcAnalytics = {
  gaEvent(name, params) {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, params || {});
    }
  },
  clarityEvent(name) {
    if (typeof window.clarity === "function") {
      window.clarity("event", name);
    }
  }
};

document.addEventListener("click", (event) => {
  const phoneLink = event.target.closest('a[href^="tel:"]');
  if (phoneLink) {
    jcAnalytics.gaEvent("phone_click", { page_location: window.location.pathname });
    jcAnalytics.clarityEvent("phone_clicked");
    return;
  }

  const financingApplyLink = event.target.closest("[data-financing-apply]");
  if (financingApplyLink) {
    jcAnalytics.gaEvent("financing_apply_click", { page_location: window.location.pathname });
    jcAnalytics.clarityEvent("financing_clicked");
    return;
  }

  const financingLink = event.target.closest('a[href^="financing.html"]');
  if (financingLink && !financingApplyLink) {
    jcAnalytics.gaEvent("financing_click", { page_location: window.location.pathname });
    jcAnalytics.clarityEvent("financing_clicked");
    return;
  }

  const estimateLink = event.target.closest(
    'a[href*="estimate-form"], a[href*="quick-form"]'
  );
  if (estimateLink) {
    jcAnalytics.gaEvent("estimate_cta_click", { page_location: window.location.pathname });
  }
});

/* ── Reduced motion: hero background video ── */
const heroVideo = document.querySelector("[data-hero-video]");
if (heroVideo) {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const applyMotionPreference = () => {
    if (motionQuery.matches) {
      heroVideo.pause();
      heroVideo.removeAttribute("autoplay");
    } else if (heroVideo.paused) {
      heroVideo.play().catch(() => {
        /* Autoplay can be blocked by the browser; the poster image still shows. */
      });
    }
  };

  applyMotionPreference();
  motionQuery.addEventListener("change", applyMotionPreference);
}

/* ── Accessible form-success dialog ── */
let successModalTimeout;
let lastFocusedBeforeModal = null;

const getFocusableElements = (container) =>
  Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );

const closeFormSuccessMessage = () => {
  const modal = document.querySelector("[data-form-success-modal]");

  if (!modal || !modal.classList.contains("is-visible")) {
    return;
  }

  window.clearTimeout(successModalTimeout);
  modal.classList.remove("is-visible");
  modal.setAttribute("aria-hidden", "true");
  document.removeEventListener("keydown", trapModalFocus);

  if (lastFocusedBeforeModal && typeof lastFocusedBeforeModal.focus === "function") {
    lastFocusedBeforeModal.focus({ preventScroll: true });
  }
  lastFocusedBeforeModal = null;
};

function trapModalFocus(event) {
  const modal = document.querySelector("[data-form-success-modal]");
  if (!modal || !modal.classList.contains("is-visible")) {
    return;
  }

  if (event.key === "Escape") {
    closeFormSuccessMessage();
    return;
  }

  if (event.key !== "Tab") {
    return;
  }

  const focusable = getFocusableElements(modal);
  if (focusable.length === 0) {
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

const getFormSuccessModal = () => {
  let modal = document.querySelector("[data-form-success-modal]");

  if (modal) {
    return modal;
  }

  modal = document.createElement("div");
  modal.className = "form-success-modal";
  modal.setAttribute("data-form-success-modal", "");
  modal.setAttribute("aria-hidden", "true");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "form-success-title");
  modal.setAttribute("aria-describedby", "form-success-copy");
  modal.innerHTML = `
    <div class="form-success-dialog">
      <div class="form-success-icon" aria-hidden="true">
        <span class="material-symbols-outlined">check_circle</span>
      </div>
      <p class="form-success-kicker">Request Submitted</p>
      <p class="form-success-title" id="form-success-title">Thanks, we got it.</p>
      <p class="form-success-copy" id="form-success-copy" data-form-success-copy></p>
      <button class="form-success-close" type="button" data-form-success-close>Close</button>
    </div>
  `;

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeFormSuccessMessage();
    }
  });

  modal
    .querySelector("[data-form-success-close]")
    .addEventListener("click", closeFormSuccessMessage);

  document.body.appendChild(modal);

  return modal;
};

const showFormSuccessMessage = (message) => {
  const modal = getFormSuccessModal();
  const copy = modal.querySelector("[data-form-success-copy]");
  const closeButton = modal.querySelector("[data-form-success-close]");

  if (copy) {
    copy.textContent = message;
  }

  lastFocusedBeforeModal = document.activeElement;

  window.clearTimeout(successModalTimeout);
  modal.classList.add("is-visible");
  modal.setAttribute("aria-hidden", "false");
  document.addEventListener("keydown", trapModalFocus);

  if (closeButton) {
    closeButton.focus({ preventScroll: true });
  }

  successModalTimeout = window.setTimeout(closeFormSuccessMessage, 9000);
};

const initWeb3Forms = () => {
  const forms = document.querySelectorAll(".web3form");

  forms.forEach((form) => {
    const status = form.querySelector("[data-form-status]");
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.innerHTML : "";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!status || !submitButton || submitButton.disabled) {
        return;
      }

      const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
      const photoInput = form.querySelector('input[type="file"]');
      if (photoInput && photoInput.files.length > 0) {
        const oversized = Array.from(photoInput.files).some((file) => file.size > MAX_PHOTO_BYTES);
        if (oversized) {
          status.textContent = "One or more photos are over 5MB. Please remove or resize them and try again.";
          status.className = "form-status is-visible is-error";
          return;
        }
      }

      status.textContent = "Submitting your request...";
      status.className = "form-status is-visible is-loading";
      submitButton.disabled = true;
      submitButton.style.opacity = "0.7";
      submitButton.innerHTML = "Submitting...";

      const formData = new FormData(form);

      if (!formData.get("subject")) {
        formData.append("subject", "New estimate request from JC Grading website");
      }

      if (!formData.get("from_name")) {
        formData.append("from_name", "JC Grading Website");
      }

      try {
        const response = await fetch(
          form.getAttribute("action") || "https://api.web3forms.com/submit",
          {
            method: "POST",
            headers: {
              Accept: "application/json"
            },
            body: formData
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Submission failed.");
        }

        const successMessage =
          form.dataset.successMessage ||
          "Thank you for submitting. We'll be in contact shortly.";

        // GA4 recommended lead event + Clarity event — fired only now,
        // after Web3Forms has confirmed the submission actually succeeded.
        // No personal data (name/email/phone/address/details) is sent.
        jcAnalytics.gaEvent("generate_lead", {
          form_name: form.dataset.formName || "estimate_form",
          page_location: window.location.pathname,
          service_interest: formData.get("service_type") || undefined
        });
        jcAnalytics.clarityEvent("lead_submitted");

        form.reset();
        status.textContent = successMessage;
        status.className = "form-status is-visible is-success";
        showFormSuccessMessage(successMessage);
      } catch (error) {
        status.textContent =
          "We couldn't submit your request right now. Please use the Call or Email button and try again shortly.";
        status.className = "form-status is-visible is-error";
      } finally {
        submitButton.disabled = false;
        submitButton.style.opacity = "1";
        submitButton.innerHTML = originalButtonText;
      }
    });
  });
};

initWeb3Forms();
