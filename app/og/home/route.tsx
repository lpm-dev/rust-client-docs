import { ImageResponse } from "next/og";
import { renderOgTemplate } from "@/lib/og";
import { appName, appTagline } from "@/lib/shared";

export const revalidate = false;
export const dynamic = "force-static";

export async function GET() {
  const { element, options } = await renderOgTemplate({
    title: appName,
    description: appTagline,
    type: "home",
    typeLabel: "lpm CLI",
  });

  return new ImageResponse(element, options);
}
