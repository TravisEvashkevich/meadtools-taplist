let data: TapData;

const themeToggle = document.querySelector(
  "#theme-toggle"
)! as HTMLSelectElement;
const fontToggle = document.querySelector(
  "#font-family-select"
)! as HTMLSelectElement;
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
const cardBorderRadiusInput = document.querySelector(
  "#card-border-radius"
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
  fontToggle.value = data.themes[theme]["font-family"] ?? "";
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
  await loadImages();
  const currentTheme = data.themes[data.activeTheme];
  themeToggle.value = data.activeTheme;
  fontToggle.value = currentTheme["font-family"] ?? "";

  if (data.activeTheme === "custom") updateCustomColors();

  if (!data.themes.custom) {
    data.themes.custom = currentTheme;
    updateTheme(data.activeTheme);
  }

  cardBorderRadiusInput.value = (
    currentTheme["card-border-radius"] ?? 0
  ).toString();

  setCSSVariables(currentTheme);
};
const handleColorChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const key = input.id as StringStyleKeys;
  data.themes.custom[key] = input.value;
  setCSSVariables(data.themes["custom"]);
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

const handleFontChange = (e: Event) => {
  const select = e.target as HTMLSelectElement;
  const font = select.value;

  data.themes[data.activeTheme]["font-family"] = font;
  setCSSVariables(data.themes[data.activeTheme]);
  updateTaplist(data); // POST updated theme
};

const updateRangeInput = async (e: Event) => {
  const input = e.target as HTMLInputElement;

  data.themes[data.activeTheme]["card-border-radius"] = parseFloat(input.value);
  setCSSVariables(data.themes[data.activeTheme]);
};

const persistUpdates = async () => {
  await updateTaplist(data); // Save to JSON
};

const uploadImage = async (e: Event) => {
  e.preventDefault();
  const form = document.getElementById("image-upload-form") as HTMLFormElement;
  const formData = new FormData(form); // ✅ use the form directly

  const res = await fetch("/upload-image", {
    method: "POST",
    body: formData,
  });

  const result = await res.text();
  console.log(result);
  await loadImages();
};

const loadImages = async () => {
  const res = await fetch("/images");
  const images = await res.json();

  const gallery = document.getElementById("image-gallery")!;
  const select = document.getElementById("image-select")! as HTMLSelectElement;

  gallery.innerHTML = "";
  select.innerHTML = "";

  images.forEach((filename: string) => {
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
    del.onclick = async () => {
      await fetch(`/delete-image/${filename}`, { method: "DELETE" });
      loadImages();
    };

    wrapper.append(img, caption, del);
    gallery.appendChild(wrapper);

    const option = document.createElement("option");
    option.value = `/images/${filename}`;
    option.textContent = filename;
    select.appendChild(option);
  });
};

const fileInput = document.getElementById("file-input") as HTMLInputElement;
const fileNameDisplay = document.getElementById("file-name")!;
const dropZone = document.getElementById("drop-zone")!;

// Show file name
const handleFile = (file: File) => {
  fileNameDisplay.textContent = file.name;
};

// Regular input change
fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (file) handleFile(file);
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
  e.preventDefault();
  dropZone.classList.remove("dragover");

  const file = e.dataTransfer?.files?.[0];
  if (file) {
    fileInput.files = e.dataTransfer.files;
    handleFile(file);
  }
});

window.onload = setup;
