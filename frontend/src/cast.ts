import { createNavbar } from "./navbar.js";

createNavbar();

/* ====== กลับหน้าหลัก (รองรับคีย์บอร์ด/ARIA) ====== */
const navigate = document.createElement("div");
Object.assign(navigate.style, {
  fontSize: "18px",
  margin: "0",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  cursor: "pointer",
  padding: "12px 16px"
});
navigate.setAttribute("role", "link");
navigate.setAttribute("aria-label", "กลับไปหน้าหลัก");
navigate.tabIndex = 0;

const icon = document.createElement("img");
icon.src = "../assets/icons/back.svg";
icon.alt = "";
Object.assign(icon.style, {
  width: "40px",
  height: "40px"
});

const text = document.createElement("span");
text.textContent = "กลับไปหน้าหลัก";

navigate.appendChild(icon);
navigate.appendChild(text);

navigate.addEventListener("click", () => {
  window.location.href = "index.html";
});
navigate.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    window.location.href = "index.html";
  }
});

document.body.appendChild(navigate);

/* ====== คอนเทนเนอร์หลักให้ responsive และกึ่งกลางหน้า ====== */
const page = document.createElement("div");
Object.assign(page.style, {
  maxWidth: "1300px",
  margin: "0 auto",
  padding: "0 10vw" // << เดิมเขียนผิดเป็น 5v/w
});
document.body.appendChild(page);

/* ====== ชื่อเรื่อง ====== */
const title = document.createElement("p");
title.textContent = "ชื่อเรื่อง (ปี)";
Object.assign(title.style, {
  fontSize: "24px",
  textAlign: "left",
  margin: "10px 0 0 0",
  fontWeight: "bold"
});
page.appendChild(title);

/* ====== บล็อกซ้าย-ขวา (รูป + ข้อมูล) ====== */
const div_content = document.createElement("div");
Object.assign(div_content.style, {
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-start",
  // justifyItems: "end",
  gap: "5vw",
  margin: "20px 0",
  flexWrap: "wrap" // ให้พับลงเมื่อจอแคบ
});
page.appendChild(div_content);

/* ซ้าย: รูป */
const imageWrap = document.createElement("div");
Object.assign(imageWrap.style, {
  flex: "1 1 320px",
  maxWidth: "450px"
});
const image = document.createElement("img");
image.src = "https://www.serieslike.com/img/shop_01.png";
image.alt = "ชื่อเรื่อง";
Object.assign(image.style, {
  width: "100%",
  height: "auto",
  display: "block",
  borderRadius: "15px",
  boxShadow: "0 4px 16px rgba(0,0,0,.06)"
});
imageWrap.appendChild(image);
div_content.appendChild(imageWrap);

/* ขวา: รายละเอียด */
const div_info = document.createElement("div");
Object.assign(div_info.style, {
  flex: "1 1 400px",
  minWidth: "320px",
  display: "flex",
  flexDirection: "column",
  width: "100%",           // ✅ ขยายเต็มกล่อง
  boxSizing: "border-box"  // ✅ กัน padding/ขอบกินพื้นที่เกิน
});

div_content.appendChild(div_info);

const Header_description = document.createElement("p");
Header_description.textContent = "ข้อมูล";
Object.assign(Header_description.style, {
  fontSize: "20px",
  margin: "0 0 10px 0",
  fontWeight: "bold"
});
div_info.appendChild(Header_description);

const description = document.createElement("p");
description.textContent =
  "ภูริช ชายหนุ่มหน้าตาดีตัดสินใจย้ายจากกรุงเทพไปอาศัยอยู่บนเกาะ เพื่อเริ่มต้นชีวิตใหม่พร้อมเพื่อนสนิท ... ริช ชายหนุ่มหน้าตาดีตัดสินใจย้ายจากกรุงเทพไปอาศัยอยู่บนเกาะ เพื่อเริ่มต้นชีวิตใหม่พร้อมเพื่อนสนิท ... ริช ชายหนุ่มหน้าตาดีตัดสินใจย้ายจากกรุงเทพไปอาศัยอยู่บนเกาะ เพื่อเริ่มต้นชีวิตใหม่พร้อมเพื่อนสนิท ... ริช ชายหนุ่มหน้าตาดีตัดสินใจย้ายจากกรุงเทพไปอาศัยอยู่บนเกาะ เพื่อเริ่มต้นชีวิตใหม่พร้อมเพื่อนสนิท ... ริช ชายหนุ่มหน้าตาดีตัดสินใจย้ายจากกรุงเทพไปอาศัยอยู่บนเกาะ เพื่อเริ่มต้นชีวิตใหม่พร้อมเพื่อนสนิท ... ริช ชายหนุ่มหน้าตาดีตัดสินใจย้ายจากกรุงเทพไปอาศัยอยู่บนเกาะ เพื่อเริ่มต้นชีวิตใหม่พร้อมเพื่อนสนิท ... ริช ชายหนุ่มหน้าตาดีตัดสินใจย้ายจากกรุงเทพไปอาศัยอยู่บนเกาะ เพื่อเริ่มต้นชีวิตใหม่พร้อมเพื่อนสนิท ... ริช ชายหนุ่มหน้าตาดีตัดสินใจย้ายจากกรุงเทพไปอาศัยอยู่บนเกาะ เพื่อเริ่มต้นชีวิตใหม่พร้อมเพื่อนสนิท ...  ";
Object.assign(description.style, {
  height: "250px",     // ✅ ใช้ตัวเล็ก
  width: "100%",
  overflowY: "auto",
  margin: "0 0 16px 0" // ✅ เผื่อช่องว่างด้านล่าง กันทับองค์ประกอบถัดไป
});
div_info.appendChild(description);


const contact = document.createElement("p");
contact.textContent = "ติดต่อ";
Object.assign(contact.style, {
    fontSize: "20px",
    margin: "0",
    fontWeight: "bold"
});
div_info.appendChild(contact);

const MAX_IMAGES = 3;
const images = [
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSi815uJ9DcZ0_TXnyT3hxEaJoQ-nV8x6X0TQ&s",
  "https://i.pinimg.com/736x/d1/d1/ae/d1d1ae06f346ee3fa9fa36b88e4fc146.jpg",
  "" // ว่าง = ข้าม
];

const gallery = document.createElement("div");
Object.assign(gallery.style, {
  display: "none",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "16px",
  marginTop: "16px"
});

let appended = 0;
let finished = 0;

function tryAdd(src : string, alt : string) {
  if (!src || !src.trim()) { finished++; return; }

  const probe = new Image();
  probe.decoding = "async";
  probe.loading = "lazy";
  // ลองไม่ตั้ง referrerPolicy เพื่อลดโอกาสโดนบล็อกโหลด
  probe.src = src;

  probe.addEventListener("load", () => {
    if (appended >= MAX_IMAGES) { finished++; maybeShowOrRemove(); return; }

    const img = document.createElement("img");
    img.src = src;
    img.alt = alt;
    img.loading = "lazy";
    Object.assign(img.style, {
      width: "100%",
      height: "320px",
      aspectRatio: "16 / 9",
      objectFit: "cover",
      display: "block",
      borderRadius: "15px",
      boxShadow: "0 4px 16px rgba(0,0,0,.06)"
    });

    gallery.appendChild(img);
    appended++;
    finished++;
    if (appended === 1) gallery.style.display = "grid";
    maybeShowOrRemove();
  });

  probe.addEventListener("error", () => {
    finished++;
    maybeShowOrRemove();
  });
}

function maybeShowOrRemove() {
  // เมื่อเช็คครบทุก URL แล้ว
  if (finished === images.length) {
    if (appended === 0) {
      // ไม่มีรูปโหลดได้ → ไม่ต้องแสดงอะไร
      gallery.remove();
    } else {
      // มีอย่างน้อย 1 → แสดง grid แล้วจบ
      gallery.style.display = "grid";
    }
  }
}

images.forEach((src, i) => tryAdd(src, `รูปเพิ่มเติม ${i + 1}`));
div_info.appendChild(gallery);





/* ====== นักแสดง ====== */
const div_work = document.createElement("div");
Object.assign(div_work.style, {
  marginTop: "10px"
});
page.appendChild(div_work);

const Header_work = document.createElement("p");
Header_work.textContent = "ผลงาน";
Object.assign(Header_work.style, {
  fontSize: "20px",
  margin: "50px 0 20px 0",
  fontWeight: "bold"
});
div_work.appendChild(Header_work);

const workList = document.createElement("div");
Object.assign(workList.style, {
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  gap: "30px 35px",
  justifyContent: "flex-start"   // ✅ จัดให้อยู่ตรงกลาง
});
div_work.appendChild(workList);

/* ฟังก์ชันเพิ่มการ์ดนักแสดง (เอา type ของ TS ออกให้เป็น JS ล้วน) */
function addWork(nameLine1 : string, imgUrl : string ) {
  const card = document.createElement("div");
  Object.assign(card.style, {
    width: "140px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  });

  const img = document.createElement("img");
  img.src = imgUrl || "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg";
  img.alt = `${nameLine1}`;
  Object.assign(img.style, {
    width: "140px",
    height: "180px",
    objectFit: "cover",
    borderRadius: "20px",
    background: "#e5e7eb",
    // boxShadow: "0 4px 16px rgba(0,0,0,.06)"
  });
  card.appendChild(img);

  const p = document.createElement("p");
  Object.assign(p.style, {
    textAlign: "center",
    // fontSize: "18px",
    margin: "10px 0 0 0",
    lineHeight: "1.25"
  });
  p.append(nameLine1);
  p.append(document.createElement("br"));
  card.appendChild(p);

  workList.appendChild(card);
}

/* ตัวอย่างรายชื่อ */
addWork("ศุภัม",  "https://media.themoviedb.org/t/p/w500/6dSRJ5klTAikfYiEvtkU319mFT5.jpg");
addWork("ซัน", "https://i.pinimg.com/736x/bf/48/ba/bf48ba2afbcccfe9935faee86d245539.jpg");
addWork("ชื่อกำกับ", "");
addWork("ชื่อกำกับ", "");
addWork("ชื่อกำกับ", "");
addWork("ศุภัม", "https://media.themoviedb.org/t/p/w500/6dSRJ5klTAikfYiEvtkU319mFT5.jpg");
addWork("ซัน", "https://i.pinimg.com/736x/bf/48/ba/bf48ba2afbcccfe9935faee86d245539.jpg");
addWork("ชื่อกำกับ",  "");
addWork("ชื่อกำกับ",  "");
addWork("ศุภัม",  "https://media.themoviedb.org/t/p/w500/6dSRJ5klTAikfYiEvtkU319mFT5.jpg");
addWork("ซัน", "https://i.pinimg.com/736x/bf/48/ba/bf48ba2afbcccfe9935faee86d245539.jpg");
addWork("ชื่อกำกับ","");