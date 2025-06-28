type Tap = {
  id: number;
  category: string;
  brewName: string;
  style: string;
  abv: number;
  labelLink: string;
  dateAdded: number;
  description: string;
  containerType: string;
};

type TapList = Tap[];

type TapData = {
  title: string;
  activeTheme: ThemeName;
  themes: Record<ThemeName, Styles>;
  fadeTime: number;
  "card-min-width": number;
  "font-size-body": string;
  taps: TapList;
  lastUpdated?: number;
};

type ThemeName = "light" | "dark" | "retro" | "chalkboard" | "custom";

type Styles = {
  "bg-color": string | null;
  "text-color": string | null;
  "image-width": number;
  "card-width"?: number;
  "card-border-radius"?: number;
  "card-padding"?: string;
  "card-gap"?: string;
  "font-family"?: string;
  "card-border-color"?: string;
};

type StringStyleKeys = Extract<
  {
    [K in keyof Styles]: Styles[K] extends string | null ? K : never;
  }[keyof Styles],
  string
>;
