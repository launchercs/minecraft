const express = require("express");
const mcServerPing = require("mc-server-ping");
const path = require("path");

const app = express();

// Render خودش PORT را تعیین می‌کند
const PORT = process.env.PORT || 3000;

// JSON API
app.use(express.json());

// فایل‌های استاتیک داخل public
app.use(express.static(path.join(__dirname, "public")));

// ================================
// Health Check - مخصوص Render
// ================================
app.get("/healthz", (req, res) => {
    res.status(200).send("OK");
});

// ================================
// Minecraft Server Status API
// ================================
app.get("/api/status", async (req, res) => {
    const host = String(req.query.host || "").trim();
    const port = Number(req.query.port || 25565);

    // بررسی IP / دامنه
    if (!host) {
        return res.status(400).json({
            online: false,
            error: "آی‌پی یا دامنه سرور وارد نشده است."
        });
    }

    // بررسی Port
    if (
        !Number.isInteger(port) ||
        port < 1 ||
        port > 65535
    ) {
        return res.status(400).json({
            online: false,
            error: "پورت باید بین 1 تا 65535 باشد."
        });
    }

    const startTime = Date.now();

    try {
        // Ping سرور Minecraft Java
        const result = await mcServerPing(host, port);

        const ping = Date.now() - startTime;

        res.json({
            online: true,

            host: host,
            port: port,

            ping: ping,

            players: {
                online: result.players?.online ?? 0,
                max: result.players?.max ?? 0
            },

            version:
                result.version?.name ||
                result.version?.protocol ||
                "نامشخص",

            motd:
                result.description ||
                result.motd ||
                "بدون MOTD"
        });

    } catch (error) {

        console.error(
            `Minecraft server check failed for ${host}:${port}`,
            error.message
        );

        res.json({
            online: false,

            host: host,
            port: port,

            ping: Date.now() - startTime,

            players: {
                online: 0,
                max: 0
            },

            version: "نامشخص",

            motd: "سرور آفلاین یا در دسترس نیست.",

            error: "اتصال به سرور Minecraft برقرار نشد."
        });
    }
});

// ================================
// Frontend
// ================================
app.get("*", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});

// ================================
// Start Server
// ================================
app.listen(PORT, "0.0.0.0", () => {
    console.log(
        `Minecraft Status Panel running on port ${PORT}`
    );
});

حالا در GitHub باید فایل دقیقاً اینجا باشد:

📁 minecraft-status/
├── 📄 server.js          ← این کد
├── 📄 package.json
├── 📄 .gitignore
└── 📁 public/
    ├── 📄 index.html
    ├── 📄 style.css
    └── 📄 script.js

در Render هم:

❤️ Health Check Path
/healthz

و بقیه Advanced را همان‌طور که گفتیم بگذار.

بعد از اینکه "server.js" را در GitHub ذخیره کردی، Render با "Auto-Deploy → On Commit" باید خودش Deploy جدید را شروع کند.
