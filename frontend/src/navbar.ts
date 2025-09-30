function toggleTheme() {
  document.body.classList.toggle("dark");
}

export function createNavbar() {
    const nav = document.createElement("nav");
    nav.className = "navbox";

    // const homeLink = document.createElement("a");
    // homeLink.href = "index.html";
    // homeLink.textContent = "Home";
    // homeLink.style.marginRight = "15px";
    // homeLink.style.color = "white";

    // const detailLink = document.createElement("a");
    // detailLink.href = "detail.html";
    // detailLink.textContent = "Detail";
    // detailLink.style.color = "white";

    const logo = document.createElement("img");
    logo.src = "./assets/icons/logo.svg";
    // logo.style.height = "50%";

    const searchBox = document.createElement("div");
    searchBox.className = "searchBox";  
    const searchBar = document.createElement("input");
    searchBar.placeholder = "Search...";
    searchBar.className = "searchBar";
    const searchIcon = document.createElement("img");
    searchIcon.src = "./assets/icons/search.svg";
    searchIcon.className = "searchIcon";
    const filterIcon = document.createElement("img");
    filterIcon.src = "./assets/icons/filter.svg";
    filterIcon.className = "searchIcon";
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

    // nav.appendChild(homeLink);
    // nav.appendChild(detailLink);
    nav.appendChild(logo);
    nav.appendChild(searchBox);
    nav.appendChild(changeThemeDiv);

    document.body.prepend(nav);
}
