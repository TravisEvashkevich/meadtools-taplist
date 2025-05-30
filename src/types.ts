type Tap = {
  brewName: string;
  dateAdded: number;
  labelLink: string;
  style: string;
  abv: number;
};

type TapList = Tap[];

type ThemeName = "light" | "dark" | "retro";

type Styles = {
  "bg-color": string | null;
  "text-color": string | null;
  "heading-size": number;
  "subheading-size": number;
  "image-width": number;
  "card-width"?: number;
  "card-border-radius"?: number;
  "card-padding"?: string;
  "card-gap"?: string;
  "font-size-body"?: string;
  "font-family"?: string;
  "card-border-color"?: string;
};

type TapData = {
  title: string;
  activeTheme: ThemeName;
  themes: Record<ThemeName, Styles>;
  taps: TapList;
};
