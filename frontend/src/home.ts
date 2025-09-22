import { createNavbar } from "./navbar.js";
createNavbar();

const onairing = document.createElement("p");
onairing.textContent = "กำลังออนแอร์";
onairing.className = "banner-text";
document.body.appendChild(onairing);

const banner = document.createElement("div");
// banner.textContent = "คลิกเพื่อดูรายละเอียด";
banner.className = "banner-ad";
banner.addEventListener("click", () => {
    window.location.href = "detail.html";
});
document.body.appendChild(banner);
