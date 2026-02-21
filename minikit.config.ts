export const minikitConfig = {
  accountAssociation: {
    header:
      "eyJmaWQiOjIzODAxMjYsInR5cGUiOiJhdXRoIiwia2V5IjoiMHhiRTU0NWRkNGEyZkU1QzJGQ0RFNmM1MmEyMjFiNjIyNUZiNjRGN2MzIn0",
    payload: "eyJkb21haW4iOiJoYXJ2ZXN0LWRhc2gudmVyY2VsLmFwcCJ9",
    signature:
      "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEEbnEt5CJumklWmNqnAG5JFXXtmr8miTHYsrrkW5UyWPVtRzr4dnVt2ywSxK-lWSDzoj-__KNMlKPciQvKRHJ5UHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  },
  miniapp: {
    version: "1",
    name: "Harvest Dash",
    homeUrl: "https://harvest-dash.vercel.app",
    iconUrl: "https://harvest-dash.vercel.app/harvestdash-logo.png",
    splashImageUrl: "https://harvest-dash.vercel.app/hay-bale.svg",
    splashBackgroundColor: "#000000",
    webhookUrl: "https://harvest-dash.vercel.app/api/webhook",
    subtitle: "Fast, fun, social",
    description: "A fast, fun way to challenge friends in real time.",
    screenshotUrls: [
      "https://harvest-dash.vercel.app/hay-bale.svg",
      "https://harvest-dash.vercel.app/hay-bale.svg",
      "https://harvest-dash.vercel.app/hay-bale.svg",
    ],
    primaryCategory: "games",
    tags: ["runner", "arcade", "action", "endless", "game"],
    heroImageUrl: "https://harvest-dash.vercel.app/harvestdash-logo.png",
    tagline: "Play instantly",
    ogTitle: "Harvest Dash",
    ogDescription: "Challenge friends in real time.",
    ogImageUrl: "https://harvest-dash.vercel.app/harvestdash-logo.png",
    noindex: true,
  },
} as const;
