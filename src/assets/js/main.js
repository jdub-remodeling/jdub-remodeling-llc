(() => {
  "use strict";

  /* ---------- Analytics (consent-gated, no personal data) ---------- */

  const CONSENT_KEY = "jdub-analytics-consent";
  const gaId = document.body.dataset.ga4Id || "";
  let gaLoaded = false;

  function readConsent() {
    try {
      return localStorage.getItem(CONSENT_KEY);
    } catch {
      return null;
    }
  }

  function saveConsent(value) {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      /* storage unavailable: choice lasts for this page view only */
    }
  }

  function loadAnalytics() {
    if (!gaId || gaLoaded) return;
    gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", gaId);
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    document.head.appendChild(script);
  }

  function clearAnalyticsCookies() {
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      if (name.startsWith("_ga")) {
        const host = location.hostname;
        document.cookie = `${name}=; Max-Age=0; path=/`;
        document.cookie = `${name}=; Max-Age=0; path=/; domain=${host}`;
        document.cookie = `${name}=; Max-Age=0; path=/; domain=.${host.replace(/^www\./, "")}`;
      }
    });
  }

  // Only event names and non-identifying parameters are ever sent.
  function track(eventName, params = {}) {
    if (!gaLoaded || typeof window.gtag !== "function") return;
    window.gtag("event", eventName, params);
  }

  function setupConsent() {
    if (!gaId) return;
    const banner = document.querySelector("[data-consent]");
    const consent = readConsent();

    if (consent === "granted") loadAnalytics();
    else if (!consent && banner) banner.hidden = false;

    document.querySelectorAll("[data-consent-choice]").forEach((button) => {
      button.addEventListener("click", () => {
        const choice = button.dataset.consentChoice;
        saveConsent(choice);
        if (banner) banner.hidden = true;
        if (choice === "granted") {
          loadAnalytics();
        } else {
          clearAnalyticsCookies();
          if (gaLoaded) {
            // Stop the already-loaded tag for the rest of this page view.
            window[`ga-disable-${gaId}`] = true;
          }
        }
      });
    });

    document.querySelectorAll("[data-consent-open]").forEach((button) => {
      button.addEventListener("click", () => {
        if (!banner) return;
        banner.hidden = false;
        const first = banner.querySelector("button");
        if (first) first.focus();
      });
    });
  }

  const CLICK_EVENTS = {
    phone: "click_to_call",
    text: "click_to_text",
    email: "click_to_email",
    "invoice-payment-link": "invoice_payment_link_click",
  };

  function setupClickTracking() {
    document.addEventListener("click", (event) => {
      const link = event.target.closest("[data-track]");
      if (!link) return;
      const eventName = CLICK_EVENTS[link.dataset.track];
      if (eventName) track(eventName, { link_location: location.pathname });
    });
  }

  /* ---------- Mobile navigation ---------- */

  function setupNav() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;

    const close = () => {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    };

    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        close();
        toggle.focus();
      }
    });

    window.matchMedia("(min-width: 960px)").addEventListener("change", close);
  }

  /* ---------- Quote form ---------- */

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setupQuoteForm() {
    const form = document.querySelector("[data-quote-form]");
    if (!form) return;

    const summary = document.querySelector("[data-form-summary]");
    const summaryList = document.querySelector("[data-form-summary-list]");
    const status = form.querySelector("[data-form-status]");
    const submit = form.querySelector("[data-submit]");
    const fields = {
      name: form.elements.name,
      email: form.elements.email,
      phone: form.elements.phone,
      description: form.elements.description,
    };

    // With JavaScript, email is no longer required on its own: email or phone will do.
    fields.email.required = false;

    function setError(key, message) {
      const error = form.querySelector(`[data-error-for="${key}"]`);
      if (error) error.textContent = message || "";
      const input = fields[key];
      if (input) {
        if (message) input.setAttribute("aria-invalid", "true");
        else input.removeAttribute("aria-invalid");
      }
    }

    function validate() {
      const errors = [];
      const name = fields.name.value.trim();
      const email = fields.email.value.trim();
      const phone = fields.phone.value.trim();
      const phoneDigits = phone.replace(/\D/g, "");
      const description = fields.description.value.trim();

      ["name", "email", "phone", "description", "contact"].forEach((key) => setError(key, ""));
      fields.email.removeAttribute("aria-invalid");
      fields.phone.removeAttribute("aria-invalid");

      if (!name) {
        setError("name", "Enter your name.");
        errors.push({ id: "f-name", message: "Enter your name." });
      }

      const emailValid = email && EMAIL_PATTERN.test(email);
      const phoneValid = phone && phoneDigits.length >= 10 && phoneDigits.length <= 15;

      if (email && !emailValid) {
        setError("email", "Enter a valid email address, like name@example.com.");
        errors.push({ id: "f-email", message: "Enter a valid email address." });
      }
      if (phone && !phoneValid) {
        setError("phone", "Enter a phone number with area code, like 850-555-0123.");
        errors.push({ id: "f-phone", message: "Enter a phone number with area code." });
      }
      if (!email && !phone) {
        const message = "Enter an email address or phone number so Justin can reply.";
        setError("contact", message);
        fields.email.setAttribute("aria-invalid", "true");
        fields.phone.setAttribute("aria-invalid", "true");
        errors.push({ id: "f-email", message });
      }

      if (!description) {
        setError("description", "Describe your project.");
        errors.push({ id: "f-details", message: "Describe your project." });
      }

      return errors;
    }

    function showSummary(errors) {
      summaryList.innerHTML = "";
      errors.forEach((error) => {
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.href = `#${error.id}`;
        link.textContent = error.message;
        link.addEventListener("click", (event) => {
          event.preventDefault();
          document.getElementById(error.id).focus();
        });
        item.appendChild(link);
        summaryList.appendChild(item);
      });
      summary.hidden = false;
      summary.focus();
    }

    function setStatus(kind, message) {
      status.className = `form-status is-${kind}`;
      status.textContent = message;
    }

    // When the form cannot be sent, give the visitor three working ways to reach Justin right now.
    // The email link carries what they typed, so nothing they wrote is lost.
    function showFallback() {
      const phone = form.dataset.phone;
      const email = form.dataset.email;
      const lines = [
        `Name: ${fields.name.value.trim()}`,
        `Email: ${fields.email.value.trim()}`,
        `Phone: ${fields.phone.value.trim()}`,
        `Project type: ${form.elements["project-type"].value}`,
        `City or ZIP: ${form.elements.location.value.trim()}`,
        "",
        fields.description.value.trim(),
      ];
      const mailto = `mailto:${email}?subject=${encodeURIComponent("Quote request")}&body=${encodeURIComponent(lines.join("\n"))}`;

      status.className = "form-status is-error";
      status.textContent = "";
      const message = document.createElement("p");
      message.textContent = "Your request didn’t go through, and nothing was sent. You can reach Justin right now:";
      const actions = document.createElement("div");
      actions.className = "status-actions";
      [
        [`Call ${form.dataset.phoneDisplay}`, `tel:${phone}`],
        ["Text Justin", `sms:${phone}`],
        ["Email this request", mailto],
      ].forEach(([label, href]) => {
        const link = document.createElement("a");
        link.className = "btn btn-secondary";
        link.href = href;
        link.textContent = label;
        actions.appendChild(link);
      });
      status.append(message, actions);
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      status.className = "form-status";
      status.textContent = "";

      const errors = validate();
      if (errors.length) {
        showSummary(errors);
        return;
      }
      summary.hidden = true;

      submit.disabled = true;
      const label = submit.textContent;
      submit.textContent = "Sending…";

      try {
        const body = new URLSearchParams(new FormData(form)).toString();
        const response = await fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "text/html" },
          body,
        });
        // Netlify marks every response it serves; anything else (a local preview, a proxy) did not store the form.
        if (!response.ok || !response.headers.has("x-nf-request-id")) {
          throw new Error(`Submission not accepted (status ${response.status})`);
        }

        form.reset();
        setStatus("success", "Thanks, your request was sent. Justin will get back to you about your project.");
        status.focus();
        track("generate_lead", { form_name: "quote" });
      } catch {
        showFallback();
        status.focus();
      } finally {
        submit.disabled = false;
        submit.textContent = label;
      }
    });

    // Clear an error as soon as the visitor fixes it.
    form.addEventListener("input", (event) => {
      const key = event.target.name;
      if (key === "email" || key === "phone") {
        if (fields.email.value.trim() || fields.phone.value.trim()) setError("contact", "");
        setError(key, "");
        if (!form.querySelector('[data-error-for="contact"]').textContent) {
          fields.email.removeAttribute("aria-invalid");
          fields.phone.removeAttribute("aria-invalid");
        }
      } else if (fields[key] && event.target.value.trim()) {
        setError(key, "");
      }
    });
  }

  /* ---------- Project gallery ---------- */

  function setupFilters() {
    const group = document.querySelector("[data-filters]");
    if (!group) return;
    const cards = document.querySelectorAll("[data-project-grid] .project-card");
    const statusEl = document.querySelector("[data-filter-status]");

    group.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      const filter = button.dataset.filter;
      group.querySelectorAll("[data-filter]").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      let shown = 0;
      cards.forEach((card) => {
        const match = filter === "all" || card.dataset.category === filter;
        card.hidden = !match;
        if (match) shown += 1;
      });
      if (statusEl) statusEl.textContent = `Showing ${shown} ${shown === 1 ? "project" : "projects"}.`;
    });
  }

  function setupLightbox() {
    const dialog = document.querySelector("[data-lightbox-dialog]");
    if (!dialog || typeof dialog.showModal !== "function") return;

    const img = dialog.querySelector("[data-lightbox-img]");
    const caption = dialog.querySelector("[data-lightbox-caption]");
    const count = dialog.querySelector("[data-lightbox-count]");
    let items = [];
    let index = 0;
    let opener = null;

    function visibleItems() {
      return [...document.querySelectorAll("[data-lightbox]")].filter((el) => !el.closest("[hidden]"));
    }

    function show(i) {
      index = (i + items.length) % items.length;
      const item = items[index];
      img.src = item.dataset.full;
      img.alt = item.dataset.alt || "";
      caption.textContent = item.dataset.caption || "";
      count.textContent = items.length > 1 ? `Photo ${index + 1} of ${items.length}` : "";
      const multiple = items.length > 1;
      dialog.querySelector("[data-lightbox-prev]").hidden = !multiple;
      dialog.querySelector("[data-lightbox-next]").hidden = !multiple;
    }

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-lightbox]");
      if (!trigger) return;
      items = visibleItems();
      opener = trigger;
      show(items.indexOf(trigger));
      dialog.showModal();
      dialog.querySelector("[data-lightbox-close]").focus();
    });

    dialog.querySelector("[data-lightbox-prev]").addEventListener("click", () => show(index - 1));
    dialog.querySelector("[data-lightbox-next]").addEventListener("click", () => show(index + 1));
    dialog.querySelector("[data-lightbox-close]").addEventListener("click", () => dialog.close());

    dialog.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") show(index - 1);
      if (event.key === "ArrowRight") show(index + 1);
      if (event.key === "Escape") {
        event.preventDefault();
        dialog.close();
      }
    });

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog || event.target.classList.contains("lightbox-stage")) dialog.close();
    });

    dialog.addEventListener("close", () => {
      img.removeAttribute("src");
      if (opener) opener.focus();
    });

    let touchX = null;
    const stage = dialog.querySelector(".lightbox-stage");
    stage.addEventListener("touchstart", (event) => {
      touchX = event.touches[0].clientX;
    }, { passive: true });
    stage.addEventListener("touchend", (event) => {
      if (touchX === null) return;
      const dx = event.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) show(dx < 0 ? index + 1 : index - 1);
      touchX = null;
    });
  }

  setupConsent();
  setupClickTracking();
  setupNav();
  setupQuoteForm();
  setupFilters();
  setupLightbox();
})();
