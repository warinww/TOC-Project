export function createFooter() {
    const footer = document.createElement("footer");
    footer.className = "footerBox";

    const exportcsv = document.createElement("button");
    exportcsv.textContent = "export .csv";

    exportcsv.addEventListener("click", async () => {

        const response = await fetch("http://localhost:8000/static/data.csv");
        const blob = await response.blob();

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "yflix_series_details.csv";
        link.click();

        URL.revokeObjectURL(url);
    });

    const linkdiv = document.createElement("div");  
    const sourcecode = document.createElement("a");
    sourcecode.textContent = "source code";    
    sourcecode.href = "https://github.com/17punchisama/TOC-Project.git";
    const presentation = document.createElement("a");
    presentation.textContent = "นำเสนอ";
    presentation.href = "";
    const members = document.createElement("a");
    members.textContent = "สมาชิกกลุ่ม";
    members.href = "members.html";
    const ref = document.createElement("a");
    ref.textContent = "อ้างอิง";   
    ref.href = "https://yflix.me/";
    linkdiv.appendChild(sourcecode);
    linkdiv.appendChild(presentation);
    linkdiv.appendChild(members);
    linkdiv.appendChild(ref);

    footer.appendChild(exportcsv);
    footer.appendChild(linkdiv);

    document.body.appendChild(footer);
}