(() => {
  "use strict";

  const documentElement = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /** I titoli editoriali si compongono parola per parola mantenendo un nome
   *  accessibile unico per i lettori di schermo. */
  const composeElements = document.querySelectorAll("[data-compose]");

  const splitTextNode = (textNode, state) => {
    const parts = textNode.textContent.split(/(\s+)/);
    const fragment = document.createDocumentFragment();

    parts.forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        fragment.append(document.createTextNode(part));
        return;
      }

      const word = document.createElement("span");
      word.className = "compose-word";
      word.textContent = part;
      word.setAttribute("aria-hidden", "true");
      word.style.setProperty("--word-index", String(state.index));
      word.style.setProperty("--word-delay", `${35 + Math.min(state.index, 12) * 58}ms`);
      state.index += 1;
      fragment.append(word);
    });

    textNode.replaceWith(fragment);
  };

  const splitDescendantText = (node, state) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        splitTextNode(child, state);
        return;
      }

      if (child.nodeType === Node.ELEMENT_NODE && !child.classList.contains("compose-word")) {
        splitDescendantText(child, state);
      }
    });
  };

  composeElements.forEach((element) => {
    const accessibleText = element.innerText.replace(/\s+/g, " ").trim();
    if (accessibleText && !element.hasAttribute("aria-label")) {
      element.setAttribute("aria-label", accessibleText);
    }
    splitDescendantText(element, { index: 0 });
  });

  /** Regia editoriale: card e righe di testo ricevono un indice breve, così
   *  ogni blocco si costruisce in sequenza senza lasciare contenuti in attesa. */
  const motionChildren = (group) => Array.from(group.children).filter(
    (child) => !child.matches(".sr-only, .honeypot, [hidden], input[type=\"hidden\"]")
  );

  document.querySelectorAll("[data-stagger]").forEach((group) => {
    const soft = group.dataset.stagger === "soft";
    const baseDelay = soft ? 38 : 70;
    const delayStep = soft ? 52 : 92;

    motionChildren(group).forEach((child, index) => {
      child.style.setProperty("--stagger-index", String(Math.min(index, 6)));
      child.style.setProperty("--stagger-delay", `${baseDelay + Math.min(index, 6) * delayStep}ms`);
    });
  });

  document.querySelectorAll("[data-flow]").forEach((group) => {
    const tight = group.dataset.flow === "tight";
    const baseDelay = tight ? 55 : 90;
    const delayStep = tight ? 46 : 76;

    motionChildren(group).forEach((child, index) => {
      child.classList.add("flow-item");
      child.style.setProperty("--flow-index", String(Math.min(index, 8)));
      child.style.setProperty("--flow-delay", `${baseDelay + Math.min(index, 8) * delayStep}ms`);
    });
  });

  /** La skip link sposta sia lo scroll sia il focus sul contenuto principale. */
  const skipLink = document.querySelector(".skip-link");

  skipLink?.addEventListener("click", (event) => {
    const target = document.querySelector(skipLink.getAttribute("href"));
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: "auto", block: "start" });
    target.focus({ preventScroll: true });
  });

  /** Navigazione interna con smooth scroll accessibile. */
  document.querySelectorAll('a[href^="#"]:not(.skip-link)').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const targetId = anchor.getAttribute("href");
      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({
        behavior: reducedMotion.matches ? "auto" : "smooth",
        block: "start"
      });

      try {
        window.history.replaceState(null, "", targetId);
      } catch {
        // L’aggiornamento dell’hash non è essenziale per la navigazione.
      }
    });
  });

  const counterElements = document.querySelectorAll("[data-counter]");
  const numberFormatter = new Intl.NumberFormat("it-IT");

  const setCounterFinalValue = (counter) => {
    const output = counter.querySelector("[data-counter-output]") || counter;
    const value = Number(counter.dataset.counter || 0);
    const suffix = counter.dataset.counterSuffix || "";
    output.textContent = `${numberFormatter.format(value)}${suffix}`;
  };

  const animateCounter = (counter) => {
    if (counter.dataset.counterAnimated === "true") return;
    counter.dataset.counterAnimated = "true";

    if (reducedMotion.matches) {
      setCounterFinalValue(counter);
      return;
    }

    const output = counter.querySelector("[data-counter-output]") || counter;
    const target = Number(counter.dataset.counter || 0);
    const suffix = counter.dataset.counterSuffix || "";
    const duration = 1250;
    const startTime = performance.now();

    const render = (time) => {
      const progress = Math.min(1, (time - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      output.textContent = `${numberFormatter.format(Math.round(target * eased))}${suffix}`;
      if (progress < 1) window.requestAnimationFrame(render);
    };

    window.requestAnimationFrame(render);
  };

  /** Reveal coordinati: titoli, fotografie, testi e gruppi entrano quando
   *  raggiungono il punto di lettura. */
  const revealElements = document.querySelectorAll("[data-reveal], [data-compose], [data-stagger], [data-flow]");
  const canObserve = "IntersectionObserver" in window;

  if (reducedMotion.matches || !canObserve) {
    documentElement.classList.add("reveal-ready");
    revealElements.forEach((element) => element.classList.add("is-visible"));
    counterElements.forEach(setCounterFinalValue);
  } else {
    documentElement.classList.add("reveal-ready");

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          entry.target.querySelectorAll("[data-counter]").forEach(animateCounter);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10%", threshold: 0.1 }
    );

    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.35 }
    );

    revealElements.forEach((element) => revealObserver.observe(element));
    counterElements.forEach((counter) => counterObserver.observe(counter));

    /** Fallback geometrico: garantisce che nessun riquadro o ritratto resti
     *  nascosto se l'observer viene inizializzato mentre il browser ripristina
     *  lo scroll o mentre le immagini modificano l'altezza della pagina. */
    const revealVisibleElements = () => {
      const viewportHeight = window.innerHeight || documentElement.clientHeight;

      revealElements.forEach((element) => {
        if (element.classList.contains("is-visible")) return;

        const rect = element.getBoundingClientRect();
        const isInReadingArea = rect.top <= viewportHeight * 0.96 && rect.bottom >= 0;
        if (!isInReadingArea) return;

        element.classList.add("is-visible");
        element.querySelectorAll("[data-counter]").forEach(animateCounter);
        revealObserver.unobserve(element);
      });
    };

    let revealFallbackFrame = null;
    const queueRevealFallback = () => {
      if (revealFallbackFrame !== null) return;
      revealFallbackFrame = window.requestAnimationFrame(() => {
        revealFallbackFrame = null;
        revealVisibleElements();
      });
    };

    window.requestAnimationFrame(revealVisibleElements);
    window.setTimeout(revealVisibleElements, 500);
    window.addEventListener("pageshow", queueRevealFallback);
    window.addEventListener("scroll", queueRevealFallback, { passive: true });
    window.addEventListener("resize", queueRevealFallback, { passive: true });
  }

  /** Movimento prospettico limitato alle sole immagini vicine al viewport. */
  const parallaxElements = document.querySelectorAll("[data-parallax], [data-parallax-surface]");

  if (parallaxElements.length > 0) {
    const activeParallaxElements = new Set();
    const compactViewport = window.matchMedia("(max-width: 760px)");
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    let parallaxFrame = null;
    let parallaxIsActive = false;
    let parallaxObserver = null;

    const updateParallax = () => {
      const viewportCenter = window.innerHeight / 2;

      activeParallaxElements.forEach((element) => {
        const bounds = element.getBoundingClientRect();
        const elementCenter = bounds.top + bounds.height / 2;
        const progress = Math.max(-1, Math.min(1, (elementCenter - viewportCenter) / (window.innerHeight + bounds.height)));
        const amplitude = element.hasAttribute("data-parallax-surface") ? 14 : 18;
        element.style.setProperty("--parallax-y", `${(-progress * amplitude).toFixed(1)}px`);
      });

      parallaxFrame = null;
    };

    const requestParallaxUpdate = () => {
      if (parallaxFrame !== null) return;
      parallaxFrame = window.requestAnimationFrame(updateParallax);
    };

    const enableParallax = () => {
      if (parallaxIsActive) return;
      parallaxIsActive = true;
      parallaxObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              activeParallaxElements.add(entry.target);
            } else {
              activeParallaxElements.delete(entry.target);
              entry.target.style.removeProperty("--parallax-y");
            }
          });
          requestParallaxUpdate();
        },
        { rootMargin: "20% 0px" }
      );
      parallaxElements.forEach((element) => parallaxObserver.observe(element));
      updateParallax();
      window.addEventListener("scroll", requestParallaxUpdate, { passive: true });
      window.addEventListener("resize", requestParallaxUpdate);
    };

    const disableParallax = () => {
      if (!parallaxIsActive) return;
      parallaxIsActive = false;
      window.removeEventListener("scroll", requestParallaxUpdate);
      window.removeEventListener("resize", requestParallaxUpdate);
      parallaxObserver?.disconnect();
      parallaxObserver = null;
      activeParallaxElements.clear();
      if (parallaxFrame !== null) window.cancelAnimationFrame(parallaxFrame);
      parallaxFrame = null;
      parallaxElements.forEach((element) => element.style.removeProperty("--parallax-y"));
    };

    const syncParallaxPreference = () => {
      const saveData = navigator.connection?.saveData === true;
      if (!canObserve || reducedMotion.matches || compactViewport.matches || coarsePointer.matches || saveData) {
        disableParallax();
      } else {
        enableParallax();
      }
    };

    syncParallaxPreference();
    reducedMotion.addEventListener?.("change", syncParallaxPreference);
    compactViewport.addEventListener?.("change", syncParallaxPreference);
    coarsePointer.addEventListener?.("change", syncParallaxPreference);
  }

  /** Le pagine legali si aprono in un dialog accessibile; senza supporto al
   *  dialog i link continuano a funzionare come normali pagine HTML. */
  const legalDialog = document.querySelector("#legal-dialog");
  const legalFrame = document.querySelector("#legal-dialog-frame");
  const legalTitle = document.querySelector("#legal-dialog-title");
  const legalClose = document.querySelector("[data-legal-close]");
  let activeLegalTrigger = null;

  const closeLegalDialog = () => {
    if (legalDialog?.open) legalDialog.close();
  };

  if (legalDialog && legalFrame && typeof legalDialog.showModal === "function") {
    document.querySelectorAll("[data-legal-dialog]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        activeLegalTrigger = link;

        const dialogTitle = link.dataset.dialogTitle || link.textContent.trim() || "Documento legale";
        if (legalTitle) legalTitle.textContent = dialogTitle;
        legalFrame.title = dialogTitle;
        legalFrame.src = link.href;

        legalDialog.showModal();
        document.body.classList.add("legal-open");
        legalClose?.focus();
      });
    });

    legalClose?.addEventListener("click", closeLegalDialog);

    legalDialog.addEventListener("click", (event) => {
      if (event.target === legalDialog) closeLegalDialog();
    });

    legalDialog.addEventListener("close", () => {
      document.body.classList.remove("legal-open");
      legalFrame.src = "about:blank";
      activeLegalTrigger?.focus({ preventScroll: true });
      activeLegalTrigger = null;
    });
  }

  /** Sticky CTA mobile: si ritrae vicino al form e al footer. */
  const mobileCta = document.querySelector("#mobile-cta");
  const heroSection = document.querySelector("#top");
  const registrationSection = document.querySelector("#iscrizione");
  const footer = document.querySelector(".site-footer");

  if (mobileCta && "IntersectionObserver" in window) {
    const hiddenBySection = new Set();
    const updateMobileCta = () => {
      mobileCta.classList.toggle("is-hidden", hiddenBySection.size > 0);
    };

    const stickyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            hiddenBySection.add(entry.target);
          } else {
            hiddenBySection.delete(entry.target);
          }
        });
        updateMobileCta();
      },
      { rootMargin: "0px 0px -35%", threshold: 0.01 }
    );

    if (heroSection) stickyObserver.observe(heroSection);
    if (registrationSection) stickyObserver.observe(registrationSection);
    if (footer) stickyObserver.observe(footer);
  }

  /** Validazione e simulazione del modulo front-end. */
  const leadForm = document.querySelector("#lead-form");

  if (leadForm) {
    const formStatus = leadForm.querySelector("#form-status");
    const submitButton = leadForm.querySelector('button[type="submit"]');
    const submitLabel = submitButton?.querySelector("span");
    const initialSubmitLabel = submitLabel?.textContent || "Iscriviti gratuitamente";
    const fields = [
      leadForm.querySelector("#first-name"),
      leadForm.querySelector("#last-name"),
      leadForm.querySelector("#phone"),
      leadForm.querySelector("#email"),
      leadForm.querySelector("#privacy")
    ].filter(Boolean);

    const messages = {
      "first-name": "Inserisci il tuo nome.",
      "last-name": "Inserisci il tuo cognome.",
      phone: "Inserisci un numero di cellulare valido.",
      email: "Inserisci un indirizzo e-mail valido.",
      privacy: "È necessario accettare la Privacy Policy."
    };

    const getErrorElement = (field) => leadForm.querySelector(`#${field.id}-error`);

    const isFieldValid = (field) => {
      if (field.type === "checkbox") return field.checked;

      const value = field.value.trim();
      if (field.required && value === "") return false;
      if (field.validity.typeMismatch || field.validity.patternMismatch) return false;
      return field.checkValidity();
    };

    const validateField = (field) => {
      const isValid = isFieldValid(field);
      const errorElement = getErrorElement(field);

      field.setAttribute("aria-invalid", String(!isValid));
      if (errorElement) {
        errorElement.textContent = isValid ? "" : messages[field.id] || "Controlla questo campo.";
      }

      return isValid;
    };

    fields.forEach((field) => {
      const eventName = field.type === "checkbox" ? "change" : "blur";
      field.addEventListener(eventName, () => validateField(field));

      if (field.type !== "checkbox") {
        field.addEventListener("input", () => {
          if (field.getAttribute("aria-invalid") === "true") validateField(field);
        });
      }
    });

    leadForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      formStatus?.classList.remove("is-visible", "is-success", "is-error");
      if (formStatus) formStatus.textContent = "";

      const honeypot = leadForm.querySelector("#website");
      if (honeypot?.value) {
        leadForm.reset();
        return;
      }

      const invalidFields = fields.filter((field) => !validateField(field));
      if (invalidFields.length > 0) {
        if (formStatus) {
          formStatus.textContent = "Controlla i campi evidenziati e completa le informazioni richieste.";
          formStatus.classList.add("is-visible", "is-error");
        }
        invalidFields[0].focus();
        return;
      }

      if (submitButton) submitButton.disabled = true;
      if (submitLabel) submitLabel.textContent = "Invio in corso…";
      leadForm.setAttribute("aria-busy", "true");

      // TODO: collegare il modulo al CRM, webhook o endpoint del backend.
      await new Promise((resolve) => window.setTimeout(resolve, 800));

      leadForm.reset();
      fields.forEach((field) => field.removeAttribute("aria-invalid"));
      leadForm.setAttribute("aria-busy", "false");

      if (submitButton) submitButton.disabled = false;
      if (submitLabel) submitLabel.textContent = initialSubmitLabel;

      if (formStatus) {
        formStatus.textContent = "Demo completata: i dati sono validi. Prima della pubblicazione, collega il modulo al sistema dell’Accademia per rendere effettiva l’iscrizione alla Masterclass.";
        formStatus.classList.add("is-visible", "is-success");
        formStatus.focus({ preventScroll: true });
      }
    });
  }

  /** Copyright dinamico. */
  const currentYear = document.querySelector("#current-year");
  if (currentYear) currentYear.textContent = String(new Date().getFullYear());
})();
