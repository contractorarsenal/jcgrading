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

let successModalTimeout;

const closeFormSuccessMessage = () => {
  const modal = document.querySelector("[data-form-success-modal]");

  if (!modal) {
    return;
  }

  window.clearTimeout(successModalTimeout);
  modal.classList.remove("is-visible");
  modal.setAttribute("aria-hidden", "true");
};

const getFormSuccessModal = () => {
  let modal = document.querySelector("[data-form-success-modal]");

  if (modal) {
    return modal;
  }

  modal = document.createElement("div");
  modal.className = "form-success-modal";
  modal.setAttribute("data-form-success-modal", "");
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <div class="form-success-dialog" role="status" aria-live="polite">
      <div class="form-success-icon" aria-hidden="true">
        <span class="material-symbols-outlined">check_circle</span>
      </div>
      <p class="form-success-kicker">Request Submitted</p>
      <p class="form-success-title">Thanks, we got it.</p>
      <p class="form-success-copy" data-form-success-copy></p>
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

  window.clearTimeout(successModalTimeout);
  modal.classList.add("is-visible");
  modal.setAttribute("aria-hidden", "false");

  if (closeButton) {
    closeButton.focus({ preventScroll: true });
  }

  successModalTimeout = window.setTimeout(closeFormSuccessMessage, 9000);
};

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeFormSuccessMessage();
  }
});

const initWeb3Forms = () => {
  const forms = document.querySelectorAll(".web3form");

  forms.forEach((form) => {
    const status = form.querySelector("[data-form-status]");
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.innerHTML : "";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!status || !submitButton) {
        return;
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
