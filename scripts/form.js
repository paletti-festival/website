const REQUIRED_ERROR_MESSAGE = {
    de: "Dieses Feld darf nicht leer sein.",
    en: "This field must not be empty."
}
const form = document.getElementById("sib-form");
const button = form.querySelector("button[type='submit']");
const successMessage = document.querySelector("#success-message");
const errorMessage = document.querySelector("#error-message");

const showError = (element, text) => {
    const error_label = element.closest(".form__entry").querySelector(".entry__error");
    error_label.innerText = text;
    error_label.style.display = "block";    
}

const hideError = (element) => {
    const error_label = element.closest(".form__entry").querySelector(".entry__error");
    error_label.style.display = "none"; 
}

const sendForm = async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
        return;
    }

    // Set loading state
    form.querySelector("svg").classList.remove("sib-hide-loader-icon")
    button.setAttribute("disabled", "disabled");
    form.classList.add("sib-form-block__button-disabled");

    // Hide error and message panels
    successMessage.classList.remove("sib-form-message-panel--active");
    errorMessage.classList.remove("sib-form-message-panel--active");

    formData = new FormData(form);

    try {
        const response = await fetch(`${form.getAttribute("action")}?isAjax=1`, {
            body: formData,
            method: "POST"
        });

        const resp = await response.json();


        if (!response.ok || !resp.success) {
            throw new Error("Network response was not OK", { cause: resp });
        }

        if (resp.redirect) {
            window.top.location.replace(resp.redirect);
        }
        else {
            successMessage.classList.add("sib-form-message-panel--active");
            successMessage.querySelector(".sib-form-message-panel__inner-text").innerText = resp.message;
        }
    } catch (error) {
        console.error("There has been a problem with your fetch operation:", error);
        errorMessage.classList.add("sib-form-message-panel--active");

        if (error.cause?.errors) {
            Object.entries(error.cause.errors).forEach(([name, text]) => {
                showError(form.querySelector(`input[name="${name}"]`), text);
            });
        }
    }

    // Unset loading state
    form.querySelector("svg").classList.add("sib-hide-loader-icon")
    button.removeAttribute("disabled");
    form.classList.remove("sib-form-block__button-disabled");
}
  
// Transfer validation to JS
form.setAttribute("novalidate", "novalidate");

form.addEventListener("submit", sendForm);
form.addEventListener("invalid", (event) => {
    event.preventDefault();    
    showError(event.target, REQUIRED_ERROR_MESSAGE[document.querySelector("html").getAttribute("lang")]);
}, true);

form.addEventListener("input", (event) => {
    hideError(event.target);
}, { passive: true });
