import type { MetadataRoute } from "next";

/** 홈 화면에 추가하면 앱처럼 실행됩니다 (PWA) */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "우리 아기 육아일지",
    short_name: "육아일지",
    start_url: "/",
    display: "standalone",
    background_color: "#fdf8f3",
    theme_color: "#e8795a",
    lang: "ko",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
