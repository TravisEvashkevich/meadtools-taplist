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
let currentThemes;
function switchTheme(name) {
    const newTheme = currentThemes[name];
    if (newTheme) {
        setStyles(newTheme);
    }
}
const getData = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield fetch("./taplist.json");
        const data = yield res.json();
        return data;
    }
    catch (err) {
        throw err;
    }
});
const createCard = (tap) => {
    const { brewName, labelLink, abv, dateAdded, style, description } = tap;
    const card = document.createElement("div");
    card.className = "tap-card";
    const cardImg = document.createElement("img");
    cardImg.src = labelLink;
    cardImg.alt = brewName;
    cardImg.className = "tap-image";
    const cardContent = document.createElement("div");
    cardContent.className = "tap-content";
    const cardTitle = document.createElement("h2");
    cardTitle.textContent = brewName;
    const desc = document.createElement("p");
    desc.textContent = description;
    const abvText = document.createElement("p");
    abvText.textContent = `${style} • ${abv}% ABV`;
    const date = document.createElement("p");
    date.textContent = `Kegged on: ${new Date(dateAdded).toLocaleDateString("en-US")}`;
    cardContent.append(cardTitle, desc, abvText, date);
    card.append(cardImg, cardContent);
    return card;
};
const setStyles = (styles) => {
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
const groupByCategory = (taps) => {
    var _a;
    const groups = {};
    for (const tap of taps) {
        const category = ((_a = tap.category) === null || _a === void 0 ? void 0 : _a.trim()) || "";
        if (!groups[category])
            groups[category] = [];
        groups[category].push(tap);
    }
    return groups;
};
const createCategoryWrapper = (category, taps) => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("wrapper");
    if (category) {
        const categoryHeading = document.createElement("h2");
        categoryHeading.className = "tap-category";
        categoryHeading.textContent = category;
        wrapper.appendChild(categoryHeading);
    }
    const groupContainer = document.createElement("div");
    groupContainer.className = "tap-group";
    taps.forEach((tap) => {
        const card = createCard(tap);
        groupContainer.appendChild(card);
    });
    wrapper.appendChild(groupContainer);
    return wrapper;
};
const startRotation = (container, wrappers, interval = 10000) => {
    const pages = [];
    let tempPage = [];
    let tempHeight = 0;
    const maxHeight = container.clientHeight;
    const buffer = maxHeight * 0.05;
    for (const wrapper of wrappers) {
        container.appendChild(wrapper);
        const height = wrapper.getBoundingClientRect().height;
        container.removeChild(wrapper);
        console.log(tempHeight + height, maxHeight - buffer);
        if (tempHeight + height <= maxHeight - buffer || tempPage.length === 0) {
            tempPage.push(wrapper);
            tempHeight += height;
        }
        else {
            pages.push([...tempPage]);
            tempPage = [wrapper];
            tempHeight = height;
        }
    }
    if (tempPage.length > 0) {
        pages.push(tempPage);
    }
    let pageIndex = 0;
    const showPage = () => {
        container.classList.remove("fade-in");
        container.classList.add("fade-out");
        setTimeout(() => {
            container.innerHTML = "";
            for (const wrapper of pages[pageIndex]) {
                container.appendChild(wrapper);
            }
            container.classList.remove("fade-out");
            container.classList.add("fade-in");
            pageIndex = (pageIndex + 1) % pages.length;
        }, 600);
    };
    if (pages.length > 1) {
        showPage();
        setInterval(showPage, interval);
    }
    else {
        container.innerHTML = "";
        for (const wrapper of pages[0]) {
            container.appendChild(wrapper);
        }
    }
};
const handleUpdate = () => __awaiter(void 0, void 0, void 0, function* () {
    const container = document.getElementById("taplist-container");
    const h1 = document.getElementById("title");
    try {
        const data = yield getData();
        const { taps, title, activeTheme, themes, fadeTime } = data;
        h1.textContent = title;
        const selectedTheme = themes[activeTheme];
        currentThemes = themes;
        setStyles(selectedTheme);
        container.innerHTML = "";
        const grouped = groupByCategory(taps);
        const sortedCategories = Object.keys(grouped);
        // .sort((a, b) => {
        //   if (a === "") return 1;
        //   if (b === "") return -1;
        //   return a.localeCompare(b);
        // });
        const wrappers = sortedCategories.map((category) => createCategoryWrapper(category, grouped[category]));
        startRotation(container, wrappers, fadeTime);
    }
    catch (err) {
        console.error(err);
        container.textContent = "An error has occurred.";
    }
});
window.onload = handleUpdate;
window.onresize = handleUpdate;
