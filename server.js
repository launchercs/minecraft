const express = require("express");
const mcServerPing = require("mc-server-ping");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

app.get("/api/status", async (req, res) => {
    const host = String(req.query.host || "").trim();
    const port = Number(req.query.port || 25565);

    if (!host) {
        return res.status(400).json({
            online: false,
            error: "آی‌پی سرور وارد نشده است."
        });
    }

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        return res.status(400).json({
            online: false,
            error: "پورت نامعتبر است."
        });
    }

    const start = Date.now();

    try {
        const result = await mcServerPing(host, port);
        const ping = Date.now() - start;

        res.json({
            online: true,
            host,
            port,
            ping,
            players: {
                online: result.players?.online ?? 0,
                max: result.players?.max ?? 0
            },
            version: result.version?.name || "نامشخص",
            motd: result.description || result.motd || "بدون MOTD"
        });

    } catch (error) {
        res.json({
            online: false,
            host,
            port,
            ping: Date.now() - start,
            error: "سرور آفلاین است یا اتصال به آن امکان‌پذیر نیست."
        });
    }
});

app.get("*", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Minecraft Status Panel running on port ${PORT}`);
});