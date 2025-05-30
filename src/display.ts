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
  const { brewName, labelLink, abv, dateAdded } = tap;
  const card = document.createElement("div");
  card.className = "tap-card";
  const cardTitle = document.createElement("h2");
  cardTitle.textContent = brewName;

  const cardBody = document.createElement("div");
  cardBody.className = "card-body";
  const cardImg = document.createElement("img");
  const cardDescription = document.createElement("div");

  const abvText = document.createElement("p");
  abvText.textContent = `${abv}%`;

  const styleText = document.createElement("p");
  styleText.textContent = `Style: ${tap.style}`;

  const date = document.createElement("p");

  const formattedDate = new Date(dateAdded).toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  date.textContent = `Kegged on: ${formattedDate}`;

  cardImg.src = labelLink;
  cardDescription.append(styleText, abvText, date);
  cardBody.append(cardImg, cardDescription);

  card.append(cardTitle, cardBody);
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
    taps.forEach((tap) => {
      const card = createCard(tap);
      container.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    container.textContent = "An error has occurred.";
  }
};

window.onload = handleUpdate;
