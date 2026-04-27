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

const buildMailtoEstimateUrl = (formData, recipient) => {
  const labelMap = {
    name: "Name",
    phone: "Phone",
    email: "Email",
    project_address: "Project city or address",
    service_type: "Service needed",
    project_details: "Project details"
  };

  const ignoredFields = new Set(["access_key", "botcheck", "subject", "from_name"]);
  const lines = ["New estimate request from the JC Grading website", ""];

  formData.forEach((value, key) => {
    if (!value || ignoredFields.has(key)) {
      return;
    }

    const label = labelMap[key] || key;
    lines.push(`${label}: ${value}`);
  });

  const subject = String(formData.get("subject") || "New estimate request from JC Grading");
  const body = encodeURIComponent(lines.join("\n"));

  return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${body}`;
};

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

      const accessKey = String(formData.get("access_key") || "").trim();
      const hasConfiguredAccessKey =
        accessKey.length > 0 && accessKey !== "YOUR_WEB3FORMS_ACCESS_KEY";

      if (!hasConfiguredAccessKey) {
        const recipientEmail =
          form.dataset.recipientEmail || "projects@jcgradingpavingsolution.com";

        status.textContent = "Opening your email app with your request details...";
        status.className = "form-status is-visible is-loading";

        window.location.href = buildMailtoEstimateUrl(formData, recipientEmail);

        status.textContent =
          "If your email app did not open, use the Call or Email button on this page.";
        status.className = "form-status is-visible is-success";
        submitButton.disabled = false;
        submitButton.style.opacity = "1";
        submitButton.innerHTML = originalButtonText;
        return;
      }

      try {
        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: {
            Accept: "application/json"
          },
          body: formData
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Submission failed.");
        }

        form.reset();
        status.textContent =
          form.dataset.successMessage ||
          "Thank you for submitting. We'll be in contact shortly.";
        status.className = "form-status is-visible is-success";
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
