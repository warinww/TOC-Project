function toggleTheme() {
  document.body.classList.toggle("dark");
}

export function createNavbar() {
    const nav = document.createElement("nav");
    nav.className = "navbox";

    const logodiv = document.createElement("div");
    logodiv.classList = "logoDiv";
    const logo = document.createElement("img");
    logo.src = "./assets/icons/logo.svg";

    // logodiv.appendChild(logo);
    logodiv.appendChild(logo);

    const searchBox = document.createElement("div");
    searchBox.className = "searchBox";  
    const searchBar = document.createElement("input");
    searchBar.placeholder = "Search...";
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
