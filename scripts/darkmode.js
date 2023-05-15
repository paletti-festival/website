const toggle = document.querySelector(".tgl");
const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

if (document.body.classList.contains("dark-theme")) {
    toggle.checked = true
}
else {
    toggle.false = true
}

toggle.addEventListener("change", function () {
    if (prefersDarkScheme.matches) {
        document.body.classList.toggle("light-theme");
        var theme = document.body.classList.contains("light-theme")
            ? "light"
            : "dark";
    } else {
        document.body.classList.toggle("dark-theme");
        var theme = document.body.classList.contains("dark-theme")
            ? "dark"
            : "light";
    }
    localStorage.setItem("theme", theme);
});
