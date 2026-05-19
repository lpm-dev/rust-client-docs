import { readFile } from "node:fs/promises";
import { join } from "node:path";

const WIDTH = 1200;
const HEIGHT = 630;

const STRIP_COLORS = {
  docs: "#227CE6",
  home: "#227CE6",
} as const;

const FONT_REGULAR_URL =
  "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZhrib2Au-0.ttf";
const FONT_BOLD_URL =
  "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZhrib2Au-0.ttf";

type AssetCache = {
  fontRegular: ArrayBuffer;
  fontBold: ArrayBuffer;
  logoDataUri: string;
};

let cachedAssets: Promise<AssetCache> | null = null;

function loadAssets(): Promise<AssetCache> {
  if (!cachedAssets) {
    cachedAssets = (async () => {
      const [regularRes, boldRes, svg] = await Promise.all([
        fetch(FONT_REGULAR_URL),
        fetch(FONT_BOLD_URL),
        readFile(join(process.cwd(), "public/lpm-og-logo.svg"), "utf-8"),
      ]);
      return {
        fontRegular: await regularRes.arrayBuffer(),
        fontBold: await boldRes.arrayBuffer(),
        logoDataUri: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
      };
    })();
  }
  return cachedAssets;
}

function truncate(text: string, maxLength = 180): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength).trim()}...`;
}

export type OgTemplateInput = {
  title: string;
  description?: string;
  type?: keyof typeof STRIP_COLORS;
  typeLabel?: string;
};

export async function renderOgTemplate({
  title,
  description,
  type = "docs",
  typeLabel,
}: OgTemplateInput) {
  const { fontRegular, fontBold, logoDataUri } = await loadAssets();
  const stripColor = STRIP_COLORS[type];
  const label = typeLabel ?? (type === "home" ? "lpm CLI" : "Documentation");

  const element = (
    <div
      style={{
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#121212",
        fontFamily: "Inter",
        color: "#FFFFFF",
      }}
    >
      <div
        style={{
          width: "100%",
          height: 16,
          backgroundColor: stripColor,
          flexShrink: 0,
        }}
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "56px 64px 0 64px",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: stripColor,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 20,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            lineHeight: 1.2,
            color: "#FFFFFF",
            display: "flex",
          }}
        >
          {title}
        </div>
        {description ? (
          <div
            style={{
              marginTop: 24,
              fontSize: 32,
              lineHeight: 1.5,
              color: "#A0A0A0",
              display: "flex",
            }}
          >
            {truncate(description)}
          </div>
        ) : null}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 64px",
          height: 88,
          marginBottom: 12,
          flexShrink: 0,
        }}
      >
        {/* biome-ignore lint/performance/noImgElement: rendered by Satori, not the DOM — next/image is not applicable */}
        <img src={logoDataUri} width={240} height={49} alt="LPM" />
      </div>
    </div>
  );

  return {
    element,
    options: {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        {
          name: "Inter",
          data: fontRegular,
          weight: 400 as const,
          style: "normal" as const,
        },
        {
          name: "Inter",
          data: fontBold,
          weight: 700 as const,
          style: "normal" as const,
        },
      ],
    },
  };
}
