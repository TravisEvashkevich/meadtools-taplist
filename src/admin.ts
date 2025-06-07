let data: TapData;

const customThemeEditor = document.querySelector("#custom-theme-editor")!;
const backgroundColorInput = customThemeEditor.querySelector(
  "#bg-color"
)! as HTMLInputElement;
const textColorInput = customThemeEditor.querySelector(
  "#text-color"
)! as HTMLInputElement;
const cardBorderColorInput = customThemeEditor.querySelector(
  "#card-border-color"
)! as HTMLInputElement;

const getConfigData = async () => {
  try {
    const res = await fetch("./taplist.json");
    const data: TapData = await res.json();
    return data;
  } catch (err) {
    throw err;
  }
};

const updateTheme = async (theme: ThemeName) => {
  data.activeTheme = theme;
  setCSSVariables(data.themes[theme]);
  await updateTaplist(data);
};

const handleThemeChange = (e: Event) => {
  const select = e.target as HTMLSelectElement;
  const theme = select.value as ThemeName;
  if (theme === "custom") {
    updateCustomColors();
  } else {
    customThemeEditor.classList.add("hidden");
  }
  updateTheme(theme);
};

const fetchData = async () => {
  data = await getConfigData();
};

const setup = async () => {
  await fetchData();
  const currentTheme = data.themes[data.activeTheme];

  if (data.activeTheme === "custom") updateCustomColors();

  if (!data.themes.custom) {
    data.themes.custom = currentTheme;
    updateTheme(data.activeTheme);
  }
  setCSSVariables(currentTheme);
};
const handleColorChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const key = input.id as StringStyleKeys;
  data.themes.custom[key] = input.value;
  updateTaplist(data);
};

const updateTaplist = async (data: TapData) => {
  try {
    await fetch("/update-taplist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error(error);
  } finally {
    await fetchData();
  }
};

const updateCustomColors = () => {
  customThemeEditor.classList.remove("hidden");

  const currentTheme = data.themes.custom;

  backgroundColorInput.value = currentTheme["bg-color"] ?? "";
  textColorInput.value = currentTheme["text-color"] ?? "";
  cardBorderColorInput.value = currentTheme["card-border-color"] ?? "";
};

const setCSSVariables = (styles: Styles) => {
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

window.onload = setup;

console.log("tst");
