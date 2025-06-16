let currentThemes: Record<ThemeName, Styles>;
let lastUpdated: number | null = null;

const getData = async () => {
  try {
    const res = await fetch("./taplist.json");
    const data: TapData = await res.json();
    return data;
  } catch (err) {
    throw err;
  }
};

const createCard = (tap: Tap) => {
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

const setStyles = (styles: Styles) => {
  const defaults: Record<string, string> = {
    "bg-color": "#1a1a1a",
    "text-color": "#ffffff",
  };

  const apply = (key: keyof Styles, value?: string | number | null) => {
    if (value !== undefined && value !== null) {
      const formatted =
        typeof value === "number"
          ? key.includes("width") ||
            key.includes("gap") ||
            key.includes("padding")
            ? `${value}px`
            : `${value}rem`
          : value.toString();

      document.documentElement.style.setProperty(`--${key}`, formatted);
    } else if (key in defaults) {
      document.documentElement.style.setProperty(`--${key}`, defaults[key]);
    }
  };

  Object.entries(styles).forEach(([key, value]) =>
    apply(key as keyof Styles, value)
  );
};

const groupByCategory = (taps: Tap[]) => {
  const groups: Record<string, Tap[]> = {};

  for (const tap of taps) {
    const category = tap.category?.trim() || "";
    if (!groups[category]) groups[category] = [];
    groups[category].push(tap);
  }

  return groups;
};

const createCategoryWrapper = (category: string, taps: Tap[]) => {
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

const startRotation = (
  container: HTMLElement,
  wrappers: HTMLElement[],
  interval = 10000
) => {
  const pages: HTMLElement[][] = [];

  let tempPage: HTMLElement[] = [];
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
    } else {
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
  } else {
    container.innerHTML = "";
    for (const wrapper of pages[0]) {
      container.appendChild(wrapper);
    }
  }
};

const handleUpdate = async () => {
  const container = document.getElementById("taplist-container")!;
  const h1 = document.getElementById("title")!;
  try {
    const data = await getData();
    const { taps, title, activeTheme, themes, fadeTime } = data;

    h1.textContent = title;

    const selectedTheme = themes[activeTheme];
    currentThemes = themes;
    setStyles(selectedTheme);

    container.innerHTML = "";

    if (taps.length === 0) {
      throw new Error("Please Fill out your taplist!");
    }

    const grouped = groupByCategory(taps);

    const sortedCategories = Object.keys(grouped);

    const wrappers = sortedCategories.map((category) =>
      createCategoryWrapper(category, grouped[category])
    );

    startRotation(container, wrappers, fadeTime);
    lastUpdated = data.lastUpdated ?? null;
  } catch (err) {
    console.error(err);
    container.textContent = (err as Error).message;
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
  } catch (err) {
    console.warn("Failed to check for updates", err);
  }
};

setInterval(pollForChanges, 5000);
