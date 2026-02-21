"use client";

import { useEffect } from "react";

export default function GamePage() {
  useEffect(() => {
    // Dynamically import game init to ensure it only runs client-side
    import("./game-init").catch(console.error);
  }, []);

  return (
    <>
      {/* Splash Screen */}
      <div
        id="splash-screen"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "#87CEEB",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transition: "opacity 0.5s",
        }}
      >
        <div
          className="hay-bale-logo"
          style={{
            width: 150,
            height: 150,
            background: "#FFD700",
            borderRadius: "50%",
            border: "8px solid #DAA520",
            boxShadow: "0 10px 0 #B8860B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 80,
            marginBottom: 20,
          }}
        >
          🚜
        </div>
        <h1
          style={{
            color: "white",
            textShadow: "2px 2px 0 #000",
            fontFamily: "'Arial Black', sans-serif",
          }}
        >
          HARVEST DASH
        </h1>
        <div
          className="loading-bar-container"
          style={{
            width: 200,
            height: 10,
            background: "rgba(0,0,0,0.2)",
            borderRadius: 5,
            overflow: "hidden",
            marginTop: 20,
          }}
        >
          <div
            id="loading-bar-fill"
            style={{
              width: "0%",
              height: "100%",
              background: "#4CAF50",
              transition: "width 0.1s",
            }}
          />
        </div>
        <p style={{ color: "white", marginTop: 10, fontWeight: "bold" }}>
          LOADING ASSETS...
        </p>
      </div>

      {/* Weather Overlay */}
      <div
        id="weather-overlay"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 50,
          transition: "background 1s",
          opacity: 0.4,
        }}
      />

      {/* UI Container */}
      <div id="ui-container">
        {/* Start Screen */}
        <div id="start-screen" className="screen active">
          <h1 className="main-title">HARVEST DASH</h1>
          <p>Harvest the coins, avoid the obstacles!</p>
          <button id="music-toggle-start" className="music-toggle">
            🔊
          </button>

          <div className="menu-buttons">
            <button id="start-btn">START GAME</button>
            <button id="shop-btn-start">SHOP</button>
            <button
              id="quests-btn-start"
              style={{ background: "#FF9800", borderColor: "#E65100" }}
            >
              QUESTS
            </button>
            <button
              id="guide-btn-start"
              className="guide-btn"
              style={{ background: "#4A148C", borderColor: "#9C27B0" }}
            >
              GUIDE
            </button>
          </div>

          <div className="start-gold-display">
            GOLD: <span className="coin-icon" />
            <span id="start-total-gold">0</span>
            <span style={{ marginLeft: 15 }}>JADES: </span>
            <span className="jade-icon" />
            <span id="start-total-jades">0</span>
            <span style={{ marginLeft: 15 }}>BEST: </span>
            <span id="start-high-score">0</span>m
          </div>
          <div style={{ marginTop: 10, color: "#ddd", fontSize: "1.2rem" }}>
            LIFETIME: <span id="start-total-dist">0</span>m
          </div>

          <p style={{ fontSize: "1rem", marginTop: 20, opacity: 0.8 }}>
            ARROW KEYS / A-D to Move | SPACE / W to Jump
          </p>
        </div>

        {/* Game Over Screen */}
        <div id="game-over-screen" className="screen">
          <h1>Harvest Dash</h1>
          <p>
            Distance: <span id="run-distance-over">0</span>m
          </p>
          <p style={{ fontSize: "1.2rem", color: "#FFD700" }}>
            BEST: <span id="high-score-over">0</span>m
          </p>
          <p>
            Coins: <span className="coin-icon" />
            <span id="run-gold-over">0</span>
          </p>
          <p>
            Wallet: <span className="coin-icon" />
            <span id="wallet-over">0</span>
          </p>

          <div id="revive-container" style={{ marginBottom: 20 }}>
            <div
              id="revive-timer-text"
              style={{ fontSize: "1.5rem", color: "#ff0000", marginBottom: 10 }}
            >
              Revive in: <span id="revive-countdown">10</span>s
            </div>
            <button
              id="revive-btn"
              style={{
                background: "#4CAF50",
                borderColor: "#2E7D32",
                color: "white",
              }}
            >
              REVIVE (100 G)
            </button>
          </div>

          <button id="restart-btn">Try Again</button>
          <button id="shop-btn-over" className="shop-btn">
            Shop
          </button>
          <button id="menu-btn-over" style={{ marginTop: 10 }}>
            Main Menu
          </button>
        </div>

        {/* Quests Screen */}
        <div id="quests-screen" className="screen">
          <h1 style={{ color: "#FF9800" }}>DAILY QUESTS</h1>
          <div
            id="quests-list"
            style={{ marginBottom: 20, width: "clamp(250px, 80vw, 400px)" }}
          />
          <button id="close-quests-btn">CLOSE</button>
        </div>

        {/* Shop Screen */}
        <div id="shop-screen" className="screen">
          <p className="balance">
            WALLET: <span className="coin-icon" />
            <span id="shop-gold">0</span>
            &nbsp;|&nbsp; JADES: <span className="jade-icon" />
            <span id="shop-jades">0</span>
          </p>

          <div className="shop-tabs">
            <button id="tab-store" className="tab-btn active">
              GENERAL STORE
            </button>
            <button id="tab-skins" className="tab-btn">
              SKINS
            </button>
            <button id="tab-mint" className="tab-btn">
              MINTING STATION
            </button>
          </div>

          <div id="skins-content" className="tab-content">
            <p style={{ fontSize: "0.9rem", marginBottom: 10 }}>
              Customize your Runner!
            </p>
            <div id="skins-list" className="shop-items" />
          </div>

          <div id="store-content" className="tab-content active">
            <div className="shop-items">
              <button id="buy-magnet" className="item-btn">
                <div>Magnet</div>
                <div style={{ fontSize: "0.8rem", opacity: 0.9 }}>
                  Pulls all nearby Gold
                </div>
                <div className="price">30 G</div>
              </button>
              <button id="buy-potion" className="item-btn">
                <div>Iron Potion</div>
                <div style={{ fontSize: "0.8rem", opacity: 0.9 }}>
                  Smash through obstacles!
                </div>
                <div className="price">100 G</div>
              </button>
            </div>
          </div>

          <div id="mint-content" className="tab-content">
            <div className="shop-items">
              <button
                id="mint-horseshoe"
                className="item-btn"
                style={{ minWidth: 200 }}
              >
                <div style={{ fontSize: "2.5rem" }}>👟</div>
                <div>Horse Shoe (NFT)</div>
                <div className="price">1000 G + 100 JADES</div>
              </button>
            </div>
            <p style={{ fontSize: "1rem", opacity: 0.8 }}>
              NFT Verified Cosmetics • Unique Collection
            </p>
          </div>

          <button id="shop-back" style={{ marginTop: 20 }}>
            Back
          </button>
        </div>

        {/* Paused Screen */}
        <div id="paused-screen" className="screen">
          <h1>PAUSED</h1>
          <button id="music-toggle-pause" className="music-toggle">
            🔊
          </button>
          <button id="resume-btn">Resume</button>
          <button id="shop-btn-pause" className="shop-btn">
            Shop
          </button>
          <button id="guide-btn-pause" className="guide-btn">
            Guide &amp; Info
          </button>
          <button id="menu-btn-pause" style={{ marginTop: 10 }}>
            Main Menu
          </button>
        </div>

        {/* Guide Screen */}
        <div id="guide-screen" className="screen">
          <h1>GAME GUIDE</h1>
          <div className="guide-scrollable">
            <section>
              <h2 style={{ color: "#4CAF50" }}>BASICS</h2>
              <p style={{ fontSize: "1.1rem" }}>
                Swipe or Click the sides of the screen to move between lanes.
                Use the Jump button or Space/W to leap over obstacles and pits!
              </p>
            </section>
            <section>
              <h2 style={{ color: "#FFD700" }}>OBSTACLES</h2>
              <p style={{ fontSize: "1.1rem" }}>
                Avoid Hay Bales, Crate Boxes, and <strong>Double Boxes</strong>.
                Double Boxes are taller—you <strong>MUST JUMP</strong> to clear
                them! <strong>STONES</strong> are rare and have a high chance to
                drop <strong>JADES</strong> when smashed!
              </p>
            </section>
            <section>
              <h2 style={{ color: "#00ffff" }}>POTIONS</h2>
              <p style={{ fontSize: "1.1rem" }}>
                <strong>🧲 MAGNET:</strong> Automatically loots all nearby gold
                for 30 seconds.
              </p>
              <p style={{ fontSize: "1.1rem" }}>
                <strong>🧪 IRON BODY:</strong> Grants invincibility and allows
                you to smash through any obstacle for massive bonuses!
              </p>
            </section>
          </div>
          <button id="guide-close" style={{ marginTop: 20 }}>
            CLOSE
          </button>
        </div>

        {/* Bag Screen */}
        <div id="bag-screen" className="screen">
          <h1>YOUR BAG</h1>
          <div id="bag-items-list" className="shop-items" />
          <button id="bag-close" style={{ marginTop: 20 }}>
            Close
          </button>
        </div>

        {/* HUD */}
        <div id="hud" className="hidden">
          <div id="distance-hud">0000m</div>

          {/* Touch Zones */}
          <div id="touch-move-left" className="touch-zone" />
          <div id="touch-move-right" className="touch-zone" />

          {/* Quick Items */}
          <div id="quick-items-mobile">
            <button
              id="quick-magnet"
              className="quick-btn"
              style={{ display: "none" }}
            >
              🧲 <span className="count">0</span>
            </button>
            <button
              id="quick-potion"
              className="quick-btn"
              style={{ display: "none" }}
            >
              🧪 <span className="count">0</span>
            </button>
          </div>

          {/* Gold Display */}
          <div id="gold-display">
            <div className="hud-item">
              <span className="coin-icon" style={{ width: 20, height: 20 }} />
              <span id="run-gold-val">0</span>
            </div>
            <div className="hud-item wallet-hud">
              <span className="wallet-label">WALLET:</span>
              <span id="total-gold-hud">0</span>
            </div>
            <div className="hud-item wallet-hud">
              <span className="wallet-label">JADES:</span>
              <span id="total-jades-hud" style={{ color: "#4CAF50" }}>
                0
              </span>
            </div>
            <div
              id="magnet-timer"
              style={{
                display: "none",
                fontSize: "1.2rem",
                color: "#00ffff",
                textShadow: "1px 1px 0 #000",
                marginTop: 5,
              }}
            >
              MAGNET: <span id="magnet-time-left">30</span>s
            </div>
            <div
              id="potion-hud"
              style={{
                display: "none",
                fontSize: "1.2rem",
                color: "#C0C0C0",
                textShadow: "1px 1px 0 #000",
                marginTop: 5,
              }}
            >
              IRON BODY: <span id="potion-charges">0</span>s
            </div>
          </div>

          {/* Notification */}
          <div
            id="notification"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -150%)",
              fontSize: "3rem",
              color: "#00ffff",
              pointerEvents: "none",
              opacity: 0,
              transition: "opacity 0.3s, transform 0.5s",
              textShadow: "3px 3px 0 #000",
              zIndex: 1500,
              textAlign: "center",
              width: "100%",
            }}
          />

          <button
            id="jump-btn-mobile"
            className="mobile-jump-btn"
            style={{ display: "none" }}
          >
            JUMP
          </button>
          <button id="bag-btn" className="mobile-bag-btn">
            🎒
          </button>
        </div>
      </div>
    </>
  );
}
