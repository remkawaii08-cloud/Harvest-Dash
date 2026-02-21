import Game from "../lib/Game";
import { sdk } from "@farcaster/miniapp-sdk";

(async () => {
  try {
    // Initialize Farcaster SDK
    await sdk.actions.ready();
    console.log("Farcaster SDK Ready");

    const game = new Game();
    game.init();
  } catch (error) {
    console.error("Game Initialization Failed:", error);

    // Visual Error Reporting for User
    const errorDiv = document.createElement("div");
    errorDiv.style.position = "fixed";
    errorDiv.style.top = "10px";
    errorDiv.style.left = "10px";
    errorDiv.style.background = "rgba(255, 0, 0, 0.9)";
    errorDiv.style.color = "white";
    errorDiv.style.padding = "20px";
    errorDiv.style.zIndex = "10000";
    errorDiv.innerHTML = `<h3>Game Crash!</h3><pre>${
      error instanceof Error
        ? error.message + "\n" + error.stack
        : String(error)
    }</pre>`;
    document.body.appendChild(errorDiv);

    // Also remove loading screen so we can see the error
    const splash = document.getElementById("splash-screen");
    if (splash) splash.style.display = "none";
  }
})();
