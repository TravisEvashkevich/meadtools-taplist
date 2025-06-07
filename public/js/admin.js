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
const customThemeEditor = document.querySelector("#custom-theme-editor");
const backgroundColorInput = customThemeEditor.querySelector("#bg-color");
const textColorInput = customThemeEditor.querySelector("#text-color");
const cardBorderColorInput = customThemeEditor.querySelector("#card-border-color");
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
    data.activeTheme = theme;
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
    yield fetchData();
    const currentTheme = data.themes[data.activeTheme];
    if (data.activeTheme === "custom")
        updateCustomColors();
    if (!data.themes.custom) {
        data.themes.custom = currentTheme;
        updateTheme(data.activeTheme);
    }
    setCSSVariables(currentTheme);
});
const handleColorChange = (e) => {
    const input = e.target;
    const key = input.id;
    data.themes.custom[key] = input.value;
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
window.onload = setup;
