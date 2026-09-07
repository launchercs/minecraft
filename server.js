import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pingJava } from "@minescope/mineping";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");

app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "public"),
        {
            extensions: ["html"],
            maxAge: "1h"
        }
    )
);

app.get("/healthz", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "minecraft-status-panel",
        version: "2.0.0"
    });
});

app.get("/api/status", async (req, res) => {
    const host = String(req.query.host || "").trim();
    const port = Number(req.query.port || 25565);

    if (!host) {
        return res.status(400).json({
            online: false,
            error: "IP یا دامنه سرور وارد نشده است."
        });
    }

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

    const start = Date.now();

    try {
        const result = await pingWithTimeout(
            host,
            port,
            8000
        );

        const ping = Date.now() - start;

        const data = normalizeMinecraftResponse(
            result
        );

        res.set("Cache-Control", "no-store");

        return res.json({
            online: true,
            host,
            port,
            ping,
            players: {
                online: data.playersOnline,
                max: data.playersMax
            },
            version: data.version,
            motd: data.motd
        });

    } catch (error) {
        const ping = Date.now() - start;

        console.error(
            `[Minecraft] ${host}:${port}`,
            error?.message || error
        );

        res.set("Cache-Control", "no-store");

        return res.json({
            online: false,
            host,
            port,
            ping,
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

async function pingWithTimeout(
    host,
    port,
    timeout
) {
    return Promise.race([
        pingJava(host, {
            port
        }),

        new Promise((_, reject) => {
            setTimeout(() => {
                reject(
                    new Error(
                        "Minecraft server ping timeout"
                    )
                );
            }, timeout);
        })
    ]);
}

function normalizeMinecraftResponse(data) {
    const players = data?.players || {};
    const version = data?.version || {};

    const playersOnline = Number(
        players.online ?? 0
    );

    const playersMax = Number(
        players.max ?? 0
    );

    const versionName =
        version.name ??
        "نامشخص";

    const motd = cleanText(
        extractText(
            data?.description ??
            data?.motd ??
            "بدون MOTD"
        )
    );

    return {
        playersOnline,
        playersMax,
        version: String(versionName),
        motd
    };
}

function extractText(value) {
    if (typeof value === "string") {
        return value;
    }

    if (Array.isArray(value)) {
        return value
            .map(extractText)
            .join("");
    }

    if (
        value &&
        typeof value === "object"
    ) {
        let text = "";

        if (typeof value.text === "string") {
            text += value.text;
        }

        if (value.extra) {
            text += extractText(value.extra);
        }

        if (value.content) {
            text += extractText(value.content);
        }

        return text;
    }

    return "";
}

function cleanText(text) {
    return String(text)
        .replace(/§[0-9a-fk-or]/gi, "")
        .replace(/\s+/g, " ")
        .trim();
}

app.get("*", (req, res) => {
    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );
});

app.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log(
            `Minecraft Status Panel V2 running on port ${PORT}`
        );
    }
);
