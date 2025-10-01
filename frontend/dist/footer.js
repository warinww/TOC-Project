var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export function createFooter() {
    const footer = document.createElement("footer");
    footer.className = "footerBox";
    const exportcsv = document.createElement("button");
    exportcsv.id = "exportcsv";
    exportcsv.textContent = "export .csv";
    exportcsv.disabled = true;
    exportcsv.addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch("http://localhost:8000/download-csv");
        const blob = yield response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "series_titles.csv";
        link.click();
        URL.revokeObjectURL(url);
    }));
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
//# sourceMappingURL=footer.js.map