import { createNavbar } from "./navbar.js";

createNavbar();

const title = document.createElement("h1");
title.textContent = "ชื่อเรื่อง(ปี)";
title.style.margin = "20px";
document.body.appendChild(title);

const description = document.createElement("p");
description.textContent =
  "คำอธิบายย่อ ๆ เกี่ยวกับชื่อเรื่องนี้ คำอธิบายย่อ ๆ เกี่ยวกับชื่อเรื่องนี้ คำอธิบายย่อ ๆ เกี่ยวกับชื่อเรื่องนี้ คำอธิบายย่อ ๆ เกี่ยวกับชื่อเรื่องนี้ คำอธิบายย่อ ๆ เกี่ยวกับชื่อเรื่องนี้";
description.style.margin = "20px";
document.body.appendChild(description);
