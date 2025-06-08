"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let data;
const themeToggle = document.querySelector("#theme-toggle");
const fontToggle = document.querySelector("#font-family-select");
const customThemeEditor = document.querySelector("#custom-theme-editor");
const backgroundColorInput = customThemeEditor.querySelector("#bg-color");
const textColorInput = customThemeEditor.querySelector("#text-color");
const cardBorderColorInput = customThemeEditor.querySelector("#card-border-color");
const cardBorderRadiusInput = document.querySelector("#card-border-radius");
const getConfigData = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield fetch("./taplist.json");
        const data = yield res.json();
        return data;
    }
    catch (err) {
        throw err;
    }
});
const updateTheme = (theme) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    data.activeTheme = theme;
    fontToggle.value = (_a = data.themes[theme]["font-family"]) !== null && _a !== void 0 ? _a : "";
    setCSSVariables(data.themes[theme]);
    yield updateTaplist(data);
});
const handleThemeChange = (e) => {
    const select = e.target;
    const theme = select.value;
    if (theme === "custom") {
        updateCustomColors();
    }
    else {
        customThemeEditor.classList.add("hidden");
    }
    updateTheme(theme);
};
const fetchData = () => __awaiter(void 0, void 0, void 0, function* () {
    data = yield getConfigData();
});
const setup = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    yield fetchData();
    yield loadImages();
    const currentTheme = data.themes[data.activeTheme];
    themeToggle.value = data.activeTheme;
    fontToggle.value = (_a = currentTheme["font-family"]) !== null && _a !== void 0 ? _a : "";
    if (data.activeTheme === "custom")
        updateCustomColors();
    if (!data.themes.custom) {
        data.themes.custom = currentTheme;
        updateTheme(data.activeTheme);
    }
    cardBorderRadiusInput.value = ((_b = currentTheme["card-border-radius"]) !== null && _b !== void 0 ? _b : 0).toString();
    setCSSVariables(currentTheme);
});
const handleColorChange = (e) => {
    const input = e.target;
    const key = input.id;
    data.themes.custom[key] = input.value;
    setCSSVariables(data.themes["custom"]);
    updateTaplist(data);
};
const updateTaplist = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield fetch("/update-taplist", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
    }
    catch (error) {
        console.error(error);
    }
    finally {
        yield fetchData();
    }
});
const updateCustomColors = () => {
    var _a, _b, _c;
    customThemeEditor.classList.remove("hidden");
    const currentTheme = data.themes.custom;
    backgroundColorInput.value = (_a = currentTheme["bg-color"]) !== null && _a !== void 0 ? _a : "";
    textColorInput.value = (_b = currentTheme["text-color"]) !== null && _b !== void 0 ? _b : "";
    cardBorderColorInput.value = (_c = currentTheme["card-border-color"]) !== null && _c !== void 0 ? _c : "";
};
const setCSSVariables = (styles) => {
    const defaults = {
        "bg-color": "#1a1a1a",
        "text-color": "#ffffff",
    };
    const apply = (key, value) => {
        if (value !== undefined && value !== null) {
            const formatted = typeof value === "number"
                ? key.includes("width") ||
                    key.includes("gap") ||
                    key.includes("padding")
                    ? `${value}px`
                    : `${value}rem`
                : value.toString();
            document.documentElement.style.setProperty(`--${key}`, formatted);
        }
        else if (key in defaults) {
            document.documentElement.style.setProperty(`--${key}`, defaults[key]);
        }
    };
    Object.entries(styles).forEach(([key, value]) => apply(key, value));
};
const handleFontChange = (e) => {
    const select = e.target;
    const font = select.value;
    data.themes[data.activeTheme]["font-family"] = font;
    setCSSVariables(data.themes[data.activeTheme]);
    updateTaplist(data); // POST updated theme
};
const updateRangeInput = (e) => __awaiter(void 0, void 0, void 0, function* () {
    const input = e.target;
    data.themes[data.activeTheme]["card-border-radius"] = parseFloat(input.value);
    setCSSVariables(data.themes[data.activeTheme]);
});
const persistUpdates = () => __awaiter(void 0, void 0, void 0, function* () {
    yield updateTaplist(data); // Save to JSON
});
const uploadImage = (e) => __awaiter(void 0, void 0, void 0, function* () {
    e.preventDefault();
    const form = document.getElementById("image-upload-form");
    const formData = new FormData(form); // ✅ use the form directly
    const res = yield fetch("/upload-image", {
        method: "POST",
        body: formData,
    });
    const result = yield res.text();
    console.log(result);
    yield loadImages();
});
const loadImages = () => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield fetch("/images");
    const images = yield res.json();
    const gallery = document.getElementById("image-gallery");
    const select = document.getElementById("image-select");
    gallery.innerHTML = "";
    select.innerHTML = "";
    images.forEach((filename) => {
        const wrapper = document.createElement("div");
        wrapper.className = "image-wrapper";
        const img = document.createElement("img");
        img.src = `/images/${filename}`;
        img.alt = filename;
        const caption = document.createElement("div");
        caption.className = "image-caption";
        caption.title = filename;
        caption.textContent = filename;
        const del = document.createElement("button");
        del.textContent = "Delete";
        del.onclick = () => __awaiter(void 0, void 0, void 0, function* () {
            yield fetch(`/delete-image/${filename}`, { method: "DELETE" });
            loadImages();
        });
        wrapper.append(img, caption, del);
        gallery.appendChild(wrapper);
        const option = document.createElement("option");
        option.value = `/images/${filename}`;
        option.textContent = filename;
        select.appendChild(option);
    });
});
const fileInput = document.getElementById("file-input");
const fileNameDisplay = document.getElementById("file-name");
const dropZone = document.getElementById("drop-zone");
// Show file name
const handleFile = (file) => {
    fileNameDisplay.textContent = file.name;
};
// Regular input change
fileInput.addEventListener("change", () => {
    var _a;
    const file = (_a = fileInput.files) === null || _a === void 0 ? void 0 : _a[0];
    if (file)
        handleFile(file);
});
// Drag & drop logic
dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
});
dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
});
dropZone.addEventListener("drop", (e) => {
    var _a, _b;
    e.preventDefault();
    dropZone.classList.remove("dragover");
    const file = (_b = (_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.files) === null || _b === void 0 ? void 0 : _b[0];
    if (file) {
        fileInput.files = e.dataTransfer.files;
        handleFile(file);
    }
});
window.onload = setup;
