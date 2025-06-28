"use strict";
let currentThemes;
let lastUpdated = null;
const getData = async () => {
    try {
        const res = await fetch("./taplist.json");
        const data = await res.json();
        return data;
    }
    catch (err) {
        throw err;
    }
};
const createCard = (tap) => {
    const { brewName, labelLink, abv, dateAdded, style, description, containerType, } = tap;
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
    const label = {
        keg: "Kegged on",
        bottle: "Bottled on",
        can: "Canned on",
        growler: "Filled on",
    }[containerType] || "Added on";
    date.textContent = `${label}: ${new Date(dateAdded).toLocaleDateString("en-US")}`;
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
    const groups = {};
    for (const tap of taps) {
        const category = tap.category?.trim() || "";
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
    const buffer = maxHeight * 0.1;
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
const handleUpdate = async () => {
    const container = document.getElementById("taplist-container");
    const h1 = document.getElementById("title");
    try {
        const data = await getData();
        const { taps, title, activeTheme, themes, fadeTime } = data;
        h1.textContent = title;
        const selectedTheme = themes[activeTheme];
        currentThemes = themes;
        setStyles(selectedTheme);
        container.innerHTML = "";
        if (taps.length === 0) {
            const baseUrl = window.location.href.replace(/\/+$/, "");
            const adminUrl = `${baseUrl}/admin`;
            const message = `
  <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100vw; text-align: center;">
    <p>
      Connect to the "<strong>Taplist Setup</strong>" WiFi network to set up your display.
    </p>
    <p>
      Or, if your Taplist is connected to your local network, visit
      <a href="${adminUrl}" style="color: var(--text-color);" title="Only works if your Pi is connected to your network.">
        ${adminUrl}
      </a>
    </p>
  </div>
`;
            throw new Error(message);
        }
        const grouped = groupByCategory(taps);
        const sortedCategories = Object.keys(grouped);
        const wrappers = sortedCategories.map((category) => createCategoryWrapper(category, grouped[category]));
        startRotation(container, wrappers, fadeTime);
        lastUpdated = data.lastUpdated ?? null;
    }
    catch (err) {
        console.error(err);
        container.innerHTML = err.message;
    }
};
window.onload = handleUpdate;
window.onresize = handleUpdate;
const pollForChanges = async () => {
    try {
        const res = await fetch(`./taplist.json?ts=${Date.now()}`, {
            cache: "no-store",
        });
        const data = await res.json();
        const updated = data.lastUpdated ?? null;
        if (updated !== null && updated !== lastUpdated) {
            location.reload();
        }
    }
    catch (err) {
        console.warn("Failed to check for updates", err);
    }
};
setInterval(pollForChanges, 5000);
