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
    const searchBox = document.createElement("div");
    searchBox.className = "searchBox";  
    const searchBar = document.createElement("input");
    searchBar.placeholder = "Search...";
    searchBar.className = "searchBar";
    const searchIcon = document.createElement("img");
    searchIcon.src = "./public/search.svg";
    searchIcon.className = "searchIcon";
    const filterIcon = document.createElement("img");
    filterIcon.src = "./public/filter.svg";
    filterIcon.className = "searchIcon";
    searchBox.appendChild(searchIcon);
    searchBox.appendChild(searchBar);
    searchBox.appendChild(filterIcon);
    
    const darkMode = document.createElement("img");
    darkMode.src = "./public/dark_mode.svg";
    darkMode.className = "colorMode";

    const lightMode = document.createElement("img");
    lightMode.src = "./public/light_mode.svg";
    lightMode.className = "colorMode";

    // nav.appendChild(homeLink);
    // nav.appendChild(detailLink);
    nav.appendChild(searchBox);
    nav.appendChild(darkMode);
    nav.appendChild(lightMode);

    document.body.prepend(nav);
}
