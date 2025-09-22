import { createNavbar } from "./navbar.js";
createNavbar();
const div = document.createElement("div");
div.style.display = "flex";
div.style.flexDirection = "column";
document.body.appendChild(div);
const title = document.createElement("h1");
title.textContent = "ชื่อเรื่อง(ปี)";
title.style.margin = "20px";
div.appendChild(title);
const description = document.createElement("p");
description.textContent =
    "คำอธิบายย่อ ๆ เกี่ยวกับชื่อเรื่องนี้";
description.style.margin = "20px";
div.appendChild(description);
const image = document.createElement("img");
image.src = "https://www.serieslike.com/img/shop_01.png"; // เปลี่ยนเป็น path ของรูปภาพจริง
image.alt = "ชื่อเรื่อง";
image.style.width = "300px";
image.style.display = "block";
div.appendChild(image);
const iframe = document.createElement("iframe");
iframe.src = "https://www.youtube.com/embed/dytvU-Z-H1k?list=RD8ONLsKcc294&index=5";
iframe.width = "600";
iframe.height = "340";
iframe.style.display = "block";
iframe.allowFullscreen = true;
div.appendChild(iframe);
//# sourceMappingURL=detail.js.map