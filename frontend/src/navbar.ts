export function createNavbar() {
    const nav = document.createElement("nav");
    nav.style.padding = "10px";
    nav.style.backgroundColor = "#333";
    nav.style.color = "white";

    const homeLink = document.createElement("a");
    homeLink.href = "index.html";
    homeLink.textContent = "Home";
    homeLink.style.marginRight = "15px";
    homeLink.style.color = "white";

    const detailLink = document.createElement("a");
    detailLink.href = "detail.html";
    detailLink.textContent = "Detail";
    detailLink.style.color = "white";

    nav.appendChild(homeLink);
    nav.appendChild(detailLink);

    document.body.prepend(nav);
}
