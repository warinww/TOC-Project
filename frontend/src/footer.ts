export function createFooter() {
    const footer = document.createElement("footer");
    footer.className = "footerBox";

    const exportcsv = document.createElement("button");
    exportcsv.textContent = "export .csv";

    const linkdiv = document.createElement("div");  
    const sourcecode = document.createElement("a");
    sourcecode.textContent = "source code";    
    sourcecode.href = "";
    const presentation = document.createElement("a");
    presentation.textContent = "นำเสนอ";
    presentation.href = "";
    const members = document.createElement("a");
    members.textContent = "สมาชิกกลุ่ม";
    members.href = "members.html";
    const ref = document.createElement("a");
    ref.textContent = "อ้างอิง";   
    ref.href = "";
    linkdiv.appendChild(sourcecode);
    linkdiv.appendChild(presentation);
    linkdiv.appendChild(members);
    linkdiv.appendChild(ref);

    footer.appendChild(exportcsv);
    footer.appendChild(linkdiv);

    document.body.appendChild(footer);
}