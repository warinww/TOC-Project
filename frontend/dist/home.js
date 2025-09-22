import { createNavbar } from "./navbar.js";
createNavbar();
// const title = document.createElement("h1");
// title.textContent = "Welcome to Home Page";
// document.body.appendChild(title);
const onairing = document.createElement("p");
onairing.textContent = "กำลังออนแอร์";
onairing.style.fontSize = "48";
onairing.style.fontWeight = "bold";
const banner = document.createElement("div");
banner.style.width = "100%";
banner.style.height = "20vh";
banner.style.width = "80vw";
banner.style.display = "flex";
banner.style.alignItems = "center";
banner.style.backgroundColor = "#000";
document.body.prepend(onairing);
document.body.prepend(banner);
//# sourceMappingURL=home.js.map