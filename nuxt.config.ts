// nuxt.config.ts
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: false },

  // SPA build for GitHub Pages
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
    // Keep "/" — the GitHub Action will inject the proper base path during CI
    baseURL: "/",
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

  // Safer prerender defaults for GH Pages (keeps build green on soft 404s)
  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: false,
    },
  },
});
