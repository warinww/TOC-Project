export function createNavbar() {
    function toggleTheme() {
        document.documentElement.classList.toggle("dark");
        // Save theme in localStorage for persistence
        if (document.documentElement.classList.contains("dark")) {
            localStorage.setItem("theme", "dark");
        }
        else {
            localStorage.setItem("theme", "light");
        }
    }
    // Apply saved theme on page load
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
    }
    const nav = document.createElement("nav");
    nav.className = "navbox";
    const logodiv = document.createElement("div");
    logodiv.classList = "logoDiv";
    const logo = document.createElement("img");
    logo.src = "./assets/icons/logo.svg";
    logodiv.appendChild(logo);
    const searchBox = document.createElement("div");
    searchBox.className = "searchBox";
    const searchBar = document.createElement("input");
    searchBar.placeholder = "Search...";
    searchBar.addEventListener("keydown", function (event) {
        if (event.key === "Enter") { // Enter pressed
            const query = searchBar.value.trim();
            if (query) {
                // Navigate to search results page with query as URL param
                // window.location.href = `search.html?q=${encodeURIComponent(query)}`;
            }
        }
    });
    const searchIcon = document.createElement("img");
    searchIcon.src = "./assets/icons/search.svg";
    const filterIcon = document.createElement("img");
    filterIcon.src = "./assets/icons/filter.svg";
    searchBox.appendChild(searchIcon);
    searchBox.appendChild(searchBar);
    searchBox.appendChild(filterIcon);
    const changeThemeDiv = document.createElement("div");
    changeThemeDiv.className = "changeThemeDiv";
    const darkMode = document.createElement("img");
    darkMode.src = "./assets/icons/dark_mode.svg";
    darkMode.className = "colorMode";
    const lightMode = document.createElement("img");
    lightMode.src = "./assets/icons/light_mode.svg";
    lightMode.className = "colorMode";
    changeThemeDiv.appendChild(darkMode);
    changeThemeDiv.appendChild(lightMode);
    darkMode.addEventListener("click", toggleTheme);
    lightMode.addEventListener("click", toggleTheme);
    nav.appendChild(logodiv);
    nav.appendChild(searchBox);
    nav.appendChild(changeThemeDiv);
    document.body.prepend(nav);
}
//# sourceMappingURL=navbar.js.map