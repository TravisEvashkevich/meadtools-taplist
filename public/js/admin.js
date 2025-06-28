"use strict";
let data;
let images;
const newTapBtn = document.getElementById("new-tap-button");
const newTapFormContainer = document.getElementById("new-tap-form-container");
const themeToggle = document.getElementById("theme-toggle");
const fontToggle = document.getElementById("font-family-select");
const customThemeEditor = document.getElementById("custom-theme-editor");
const backgroundColorInput = document.getElementById("bg-color");
const textColorInput = document.getElementById("text-color");
const cardBorderColorInput = document.getElementById("card-border-color");
const cardBorderRadiusInput = document.getElementById("card-border-radius");
const titleInput = document.getElementById("taplist-name");
const form = document.getElementById("image-upload-form");
const tapContainer = document.getElementById("on-tap");
const fileInput = document.getElementById("file-input");
const fileNameDisplay = document.getElementById("file-name");
const dropZone = document.getElementById("drop-zone");
const fetchData = async () => {
    try {
        const res = await fetch("./taplist.json");
        const parsed = await res.json();
        data = parsed;
    }
    catch (err) {
        throw err;
    }
};
const setup = async () => {
    await fetchData();
    images = await loadImages();
    updateTaplist();
    newTapBtn.onclick = () => {
        if (!newTapFormContainer.innerHTML) {
            generateNewTapForm(newTapFormContainer);
        }
    };
    const currentTheme = data.themes[data.activeTheme];
    themeToggle.value = data.activeTheme;
    themeToggle.onchange = (e) => {
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
    fontToggle.value = currentTheme["font-family"] ?? "";
    fontToggle.onchange = (e) => {
        const select = e.target;
        const font = select.value;
        data.themes[data.activeTheme]["font-family"] = font;
        setCSSVariables(data.themes[data.activeTheme]);
        persistUpdates(); // POST updated theme
    };
    [backgroundColorInput, textColorInput, cardBorderColorInput].forEach((input) => (input.onchange = handleColorChange));
    if (data.activeTheme === "custom")
        updateCustomColors();
    if (!data.themes.custom) {
        data.themes.custom = currentTheme;
        updateTheme(data.activeTheme);
    }
    cardBorderRadiusInput.onchange = persistUpdates;
    cardBorderRadiusInput.value = (currentTheme["card-border-radius"] ?? 0).toString();
    cardBorderRadiusInput.oninput = async (e) => {
        const input = e.target;
        data.themes[data.activeTheme]["card-border-radius"] = parseFloat(input.value);
        setCSSVariables(data.themes[data.activeTheme]);
    };
    setCSSVariables(currentTheme);
    const fadeInput = document.getElementById("fade-time-seconds");
    fadeInput.value = (data.fadeTime / 1000).toString();
    fadeInput.onchange = (e) => {
        const input = e.target;
        const seconds = parseInt(input.value, 10);
        if (!isNaN(seconds) && seconds > 0) {
            data.fadeTime = seconds * 1000; // Convert to milliseconds
            persistUpdates();
        }
    };
    titleInput.value = data.title;
    titleInput.onchange = (e) => {
        const input = e.target;
        data.title = input.value;
        persistUpdates();
    };
    form.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(form); // ✅ use the form directly
        const res = await fetch("/upload-image", {
            method: "POST",
            body: formData,
        });
        const result = await res.text();
        console.log(result);
        await loadImages();
    };
    // Show file name
    const handleFile = (file) => {
        fileNameDisplay.textContent = file.name;
    };
    // Regular input change
    fileInput.onchange = () => {
        const file = fileInput.files?.[0];
        if (file)
            handleFile(file);
    };
    // Drag & drop logic
    dropZone.ondragover = (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
    };
    dropZone.ondragleave = () => {
        dropZone.classList.remove("dragover");
    };
    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
        const file = e.dataTransfer?.files?.[0];
        if (file) {
            fileInput.files = e.dataTransfer.files;
            handleFile(file);
        }
    };
};
const updateCustomColors = () => {
    customThemeEditor.classList.remove("hidden");
    const currentTheme = data.themes.custom;
    backgroundColorInput.value = currentTheme["bg-color"] ?? "";
    textColorInput.value = currentTheme["text-color"] ?? "";
    cardBorderColorInput.value = currentTheme["card-border-color"] ?? "";
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
const persistUpdates = async () => {
    try {
        await fetch("/update-taplist", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ ...data, lastUpdated: Date.now() }),
        });
    }
    catch (error) {
        console.error(error);
    }
    finally {
        await fetchData();
    }
};
const loadImages = async () => {
    const res = await fetch("/images");
    const images = await res.json();
    const gallery = document.getElementById("image-gallery");
    gallery.innerHTML = "";
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
        del.onclick = async () => {
            if (filename === "defaultImage.png") {
                alert("Cannot delete default image.");
                return;
            }
            const userConfirmation = confirm("Are you sure? This action cannot be undone.");
            if (userConfirmation) {
                await fetch(`/delete-image/${filename}`, { method: "DELETE" });
                loadImages();
            }
        };
        wrapper.append(img, caption, del);
        gallery.appendChild(wrapper);
    });
    return images;
};
const updateTaplist = () => {
    tapContainer.innerHTML = "";
    if (data.taps.length > 0)
        data.taps.forEach((tap) => {
            generateTapItem(tap, tapContainer);
        });
    else {
        tapContainer.innerHTML =
            "<p>Nothing on tap. Press the button below to add some.</p>";
    }
};
const createImageSelect = (selected) => {
    const label = document.createElement("label");
    label.textContent = "Label Image";
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "1rem";
    const select = document.createElement("select");
    select.id = `image-select-${Date.now()}`;
    select.style.maxWidth = "300px"; // avoid overflow
    const preview = document.createElement("img");
    preview.src = selected;
    preview.alt = "Preview";
    preview.style.maxHeight = "60px";
    preview.style.borderRadius = "0.25rem";
    preview.style.objectFit = "contain";
    images.forEach((filename) => {
        const path = `/images/${filename}`;
        const option = document.createElement("option");
        option.value = path;
        option.textContent = filename;
        if (path === selected) {
            option.selected = true;
            select.value = selected;
        }
        select.appendChild(option);
    });
    // Update preview on change
    select.onchange = () => {
        preview.src = select.value;
    };
    wrapper.append(select, preview);
    label.appendChild(wrapper);
    return { label, select };
};
const createInput = (labelText, value, type = "text", list, step) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = type;
    input.value = value.toString();
    input.disabled = true;
    if (list)
        input.setAttribute("list", list);
    if (type === "number" && step)
        input.setAttribute("step", step);
    label.append(labelText, input);
    return { label, input };
};
const generateTapItem = (tap, container) => {
    const tapContainer = document.createElement("form");
    tapContainer.classList.add("tap-info");
    const original = { ...tap };
    const { label: categoryLabel, input: categoryInput } = createInput("Category", tap.category, "text", "category-options");
    const { label: styleLabel, input: styleInput } = createInput("Style", tap.style, "text", "style-options");
    const { label: nameLabel, input: nameInput } = createInput("Name", tap.brewName);
    const { label: abvLabel, input: abvInput } = createInput("ABV", tap.abv, "number", undefined, "0.01");
    const { label: dateLabel, input: dateInput } = createInput("Date Added", new Date(tap.dateAdded).toISOString().split("T")[0], "date");
    const { label: labelImageLabel, select: labelImageSelect } = createImageSelect(tap.labelLink);
    labelImageSelect.disabled = true;
    const containerTypeLabel = document.createElement("label");
    containerTypeLabel.textContent = "Container Type";
    const containerTypeSelect = document.createElement("select");
    ["Keg", "Bottle", "Can", "Growler"].forEach((type) => {
        const option = document.createElement("option");
        option.value = type.toLowerCase(); // store lowercase value
        option.textContent = type; // show capitalized label
        containerTypeSelect.appendChild(option);
    });
    containerTypeSelect.disabled = true;
    containerTypeSelect.value = tap.containerType;
    containerTypeLabel.appendChild(containerTypeSelect);
    const descLabel = document.createElement("label");
    const descInput = document.createElement("textarea");
    descInput.disabled = true;
    descInput.value = tap.description;
    descLabel.append("Description", descInput);
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "Edit";
    editBtn.classList.add("edit");
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";
    deleteBtn.classList.add("delete");
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.textContent = "Cancel";
    cancelBtn.classList.add("cancel", "hidden");
    const submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.textContent = "Save";
    submitBtn.classList.add("submit", "hidden");
    const index = data.taps.findIndex((t) => t.id === tap.id);
    const moveUpBtn = document.createElement("button");
    moveUpBtn.type = "button";
    moveUpBtn.textContent = "↑";
    moveUpBtn.classList.add("move");
    if (index === 0)
        moveUpBtn.disabled = true;
    const moveDownBtn = document.createElement("button");
    moveDownBtn.type = "button";
    moveDownBtn.textContent = "↓";
    moveDownBtn.classList.add("move");
    if (index === data.taps.length - 1)
        moveDownBtn.disabled = true;
    editBtn.onclick = () => {
        [
            categoryInput,
            styleInput,
            nameInput,
            abvInput,
            dateInput,
            descInput,
            labelImageSelect,
            containerTypeSelect,
        ].forEach((el) => (el.disabled = false));
        editBtn.classList.add("hidden");
        moveUpBtn.classList.add("hidden");
        moveDownBtn.classList.add("hidden");
        deleteBtn.classList.add("hidden");
        cancelBtn.classList.remove("hidden");
        submitBtn.classList.remove("hidden");
    };
    cancelBtn.onclick = (e) => {
        e.preventDefault();
        categoryInput.value = original.category;
        styleInput.value = original.style;
        nameInput.value = original.brewName;
        abvInput.value = original.abv.toString();
        dateInput.value = new Date(original.dateAdded).toISOString().split("T")[0];
        descInput.value = original.description;
        labelImageSelect.value = original.labelLink;
        [
            categoryInput,
            styleInput,
            nameInput,
            abvInput,
            dateInput,
            descInput,
            labelImageSelect,
            containerTypeSelect,
        ].forEach((el) => (el.disabled = true));
        cancelBtn.classList.add("hidden");
        submitBtn.classList.add("hidden");
        editBtn.classList.remove("hidden");
        deleteBtn.classList.remove("hidden");
        moveUpBtn.classList.remove("hidden");
        moveDownBtn.classList.remove("hidden");
    };
    deleteBtn.onclick = async () => {
        const userConfirmation = confirm("Are you sure? This action cannot be undone.");
        if (userConfirmation) {
            const filtered = data.taps.filter((t) => t.id !== tap.id);
            data.taps = filtered;
            await persistUpdates();
            await fetchData();
            updateTaplist();
        }
    };
    moveUpBtn.onclick = async () => {
        const index = data.taps.findIndex((t) => t.id === tap.id);
        if (index > 0) {
            [data.taps[index - 1], data.taps[index]] = [
                data.taps[index],
                data.taps[index - 1],
            ];
            await persistUpdates();
            updateTaplist();
        }
    };
    moveDownBtn.onclick = async () => {
        const index = data.taps.findIndex((t) => t.id === tap.id);
        if (index < data.taps.length - 1) {
            [data.taps[index], data.taps[index + 1]] = [
                data.taps[index + 1],
                data.taps[index],
            ];
            await persistUpdates();
            updateTaplist();
        }
    };
    tapContainer.onsubmit = (e) => {
        e.preventDefault();
        const updated = {
            id: tap.id,
            category: categoryInput.value,
            style: styleInput.value,
            brewName: nameInput.value,
            abv: parseFloat(abvInput.value),
            labelLink: labelImageSelect.value,
            dateAdded: new Date(dateInput.value).getTime(),
            description: descInput.value,
            containerType: containerTypeSelect.value,
        };
        const index = data.taps.findIndex((t) => t.id === tap.id);
        if (index !== -1) {
            data.taps[index] = updated;
            persistUpdates();
            fetchData();
        }
        [
            categoryInput,
            styleInput,
            nameInput,
            abvInput,
            dateInput,
            descInput,
            labelImageSelect,
            containerTypeSelect,
        ].forEach((el) => (el.disabled = true));
        cancelBtn.classList.add("hidden");
        submitBtn.classList.add("hidden");
        editBtn.classList.remove("hidden");
        deleteBtn.classList.remove("hidden");
        moveUpBtn.classList.remove("hidden");
        moveDownBtn.classList.remove("hidden");
    };
    const buttonRow = document.createElement("div");
    buttonRow.classList.add("button-row");
    buttonRow.append(editBtn, deleteBtn, moveUpBtn, moveDownBtn, cancelBtn, submitBtn);
    tapContainer.append(nameLabel, categoryLabel, styleLabel, abvLabel, dateLabel, containerTypeLabel, labelImageLabel, descLabel, buttonRow);
    container.appendChild(tapContainer);
};
const generateNewTapForm = (container) => {
    const form = document.createElement("form");
    form.classList.add("tap-info");
    // Today's date in yyyy-mm-dd format
    const today = new Date().toISOString().split("T")[0];
    const { label: nameLabel, input: nameInput } = createInput("Name", "");
    const { label: categoryLabel, input: categoryInput } = createInput("Category", "", "text", "category-options");
    const { label: styleLabel, input: styleInput } = createInput("Style", "", "text", "style-options");
    const { label: abvLabel, input: abvInput } = createInput("ABV", "", "number", undefined, "0.01");
    const { label: dateLabel, input: dateInput } = createInput("Date Added", today, "date");
    const { label: labelImageLabel, select: labelImageSelect } = createImageSelect("./images/defaultImage.png");
    labelImageSelect.disabled = false;
    const containerTypeLabel = document.createElement("label");
    containerTypeLabel.textContent = "Container Type";
    const containerTypeSelect = document.createElement("select");
    ["Keg", "Bottle", "Can", "Growler"].forEach((type) => {
        const option = document.createElement("option");
        option.value = type.toLowerCase(); // store lowercase value
        option.textContent = type; // show capitalized label
        containerTypeSelect.appendChild(option);
    });
    containerTypeSelect.disabled = false;
    containerTypeLabel.appendChild(containerTypeSelect);
    [
        nameInput,
        categoryInput,
        styleInput,
        abvInput,
        dateInput,
        containerTypeSelect,
    ].forEach((input) => (input.disabled = false));
    const descLabel = document.createElement("label");
    const descInput = document.createElement("textarea");
    descInput.disabled = false;
    descLabel.append("Description", descInput);
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.textContent = "Cancel";
    cancelBtn.classList.add("cancel");
    const submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.textContent = "Add";
    submitBtn.classList.add("submit");
    cancelBtn.onclick = () => {
        container.innerHTML = "";
    };
    form.onsubmit = (e) => {
        e.preventDefault();
        const newTap = {
            id: Date.now(),
            category: categoryInput.value,
            style: styleInput.value,
            brewName: nameInput.value,
            abv: parseFloat(abvInput.value),
            labelLink: labelImageSelect.value,
            dateAdded: new Date(dateInput.value).getTime(),
            description: descInput.value,
            containerType: containerTypeSelect.value,
        };
        data.taps.push(newTap);
        persistUpdates();
        form.reset(); // Clears all inputs
        dateInput.value = today; // Re-set the date after reset
        labelImageSelect.value = "./images/defaultImage.png";
        updateTaplist();
    };
    const buttonRow = document.createElement("div");
    buttonRow.classList.add("button-row");
    buttonRow.append(cancelBtn, submitBtn);
    form.append(nameLabel, categoryLabel, styleLabel, abvLabel, dateLabel, containerTypeLabel, labelImageLabel, descLabel, buttonRow);
    container.appendChild(form);
};
const handleColorChange = (e) => {
    const input = e.target;
    const key = input.id;
    data.themes.custom[key] = input.value;
    setCSSVariables(data.themes["custom"]);
    persistUpdates();
};
const updateTheme = async (theme) => {
    data.activeTheme = theme;
    fontToggle.value = data.themes[theme]["font-family"] ?? "";
    setCSSVariables(data.themes[theme]);
    await persistUpdates();
};
window.onload = setup;
