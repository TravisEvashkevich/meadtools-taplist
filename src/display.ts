let currentThemes: Record<ThemeName, Styles>;

function switchTheme(name: ThemeName) {
  const newTheme = currentThemes[name];
  if (newTheme) {
    setStyles(newTheme);
  }
}

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

  // Left: image
  const cardImg = document.createElement("img");
  cardImg.src = labelLink;
  cardImg.alt = brewName;
  cardImg.className = "tap-image";

  // Right: text content
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
    const category = tap.category?.trim() || ""; // Empty string = no heading
    if (!groups[category]) groups[category] = [];
    groups[category].push(tap);
  }

  return groups;
};
const handleUpdate = async () => {
  const container = document.getElementById("taplist-container")!;
  const h1 = document.getElementById("title")!;
  try {
    const data = await getData();
    const { taps, title, activeTheme, themes } = data;

    h1.textContent = title;

    const selectedTheme = themes[activeTheme];
    setStyles(selectedTheme);

    container.innerHTML = "";
    const grouped = groupByCategory(taps);

    const sortedCategories = Object.keys(grouped).sort((a, b) => {
      if (a === "") return 1; // Put empty last
      if (b === "") return -1;
      return a.localeCompare(b);
    });

    for (const category of sortedCategories) {
      const group = grouped[category];

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

      group.forEach((tap) => {
        const card = createCard(tap);
        groupContainer.appendChild(card);
      });

      wrapper.appendChild(groupContainer);

      container.appendChild(wrapper);
    }
  } catch (err) {
    console.error(err);
    container.textContent = "An error has occurred.";
  }
};

window.onload = handleUpdate;
