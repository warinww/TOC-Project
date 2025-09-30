import { createNavbar } from "./navbar.js";
// import { createFooter } from "./footer.js";

createNavbar()
// createFooter()

const gobackbt = document.createElement("button");
gobackbt.className = "goBackBt";
gobackbt.addEventListener("click", () => {
    history.back();
});
const backicon = document.createElement("img");
backicon.src = "./assets/icons/back.svg";
const text = document.createElement("p");
text.textContent = "ย้อนกลับ";

gobackbt.appendChild(backicon);
gobackbt.appendChild(text);

const title = document.createElement("h1");
title.textContent = "ToC FromC";

document.body.appendChild(gobackbt);
document.body.appendChild(title);

interface Member {
  image: string;
  id: string;
  name: string;
}

function createMemberDiv(members: Member[]) {
  const container = document.createElement("div");
  container.className = "membersContainer";

  members.forEach(member => {
    const memberDiv = document.createElement("div");
    memberDiv.className = "member";

    const img = document.createElement("img");
    img.src = member.image;
    img.alt = member.name;
    img.className = "memberImg";

    const id = document.createElement("div");
    id.className = "memberId";
    id.textContent = member.id;

    const name = document.createElement("div");
    name.className = "memberName";
    name.textContent = member.name;

    memberDiv.appendChild(img);
    memberDiv.appendChild(id);
    memberDiv.appendChild(name);

    container.appendChild(memberDiv);
  });

  document.body.appendChild(container);
}

const members = [
    {image: "./assets/members_img/punchi.png",  id: "66010118", name: "จินต์ศุจี กองสะดี",},
    {image: "./assets/members_img/bell.png",    id: "66010452", name: "ปภาวรินทร์  ผลพิรุฬห์",},
    {image: "./assets/members_img/nuuplai.png", id: "66010575", name: "พิมพ์สิริน  สุวรรณบุตร",},
    {image: "./assets/members_img/wewe.png",    id: "66010737", name: "วรพร อัครเอกฒาลิน",},
    {image: "./assets/members_img/lele.png",    id: "66010751", name: "วรินทร  ลู่โรจน์เรือง",},
    {image: "./assets/members_img/tm.png",      id: "66010752", name: "วรินธร หวังประเสริฐกุล",},
    {image: "./assets/members_img/mo.png",      id: "66010808", name: "ศิริวรรณ  แจ่มเที่ยงตรง",},
    {image: "./assets/members_img/get.png",     id: "66010911", name: "อมรรัตน์  เครือวัลย์",},
    {image: "./assets/members_img/som.png",     id: "66010933", name: "อาริยา  อังศุวัฒนา",},
    {image: "./assets/members_img/pang.png",    id: "66011365", name: "ณิชกมล  ศรีจุดานุ",},
    {image: "./assets/members_img/pint.png",    id: "66011452", name: "ภาราดา  โพยนอก",},
]

createMemberDiv(members);