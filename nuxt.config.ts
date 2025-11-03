// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: false },

  // SPA build (good for GitHub Pages)
  ssr: false,

  css: ["~/assets/styles/main.scss"],

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/styles/variables.scss" as *;',
        },
      },
    },
  },

  app: {
    // IMPORTANT: set to your repo name for project pages
    // If you later deploy to a user/org root (username.github.io), change this to "/"
    baseURL: "/Offline-Client-Side-ICS-Viewer/",
    head: {
      title: "ICS Viewer",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content: "View ICS calendar files offline in your browser",
        },
      ],
    },
  },

  // GitHub Pages-friendly output (creates 404.html fallback, etc.)
  nitro: {
    preset: "github-pages",
    prerender: {
      crawlLinks: true,
      failOnError: false,
      routes: ["/"], // ensure index is generated
    },
  },

  // Optional: if you want to control via env in CI
  // runtimeConfig: {
  //   public: {
  //     baseURL: process.env.NUXT_APP_BASE_URL || "/Offline-Client-Side-ICS-Viewer/",
  //   },
  // },
});
