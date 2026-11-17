import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import { Theme } from "@astryxdesign/core/theme";
import { themes, defaultThemeSlug } from "../src/astryx-themes";
export const metadata = { title: "Alpha Kids — Parent coach" };
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      data-theme="light"
      data-astryx-theme="parent-coach"
    >
      <body>
        <Theme theme={themes[defaultThemeSlug]} mode="light">
          {children}
        </Theme>
      </body>
    </html>
  );
}
