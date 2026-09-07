const express = require("express");
const path = require("path");
const mcServerPing = require("mc-server-ping");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.get("/healthz", (req, res) => {
    res.status(200).send("OK");
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

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        return res.status(400).json({
            online: false,
            error: "پورت باید بین 1 تا 65535 باشد."
        });
    }

    const startTime = Date.now();

    try {
        const result = await pingMinecraft(host, port);

        const ping = Date.now() - startTime;
        const data = normalizeResult(result);

        return res.json({
            online: true,
            host,
            port,
            ping: data.ping || ping,
            players: {
                online: data.playersOnline,
                max: data.playersMax
            },
            version: data.version,
            motd: data.motd
        });

    } catch (error) {
        console.error(
            `Minecraft ping failed: ${host}:${port}`,
            error.message
        );

        return res.json({
            online: false,
            host,
            port,
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

function pingMinecraft(host, port) {
    return new Promise((resolve, reject) => {
        let finished = false;

        const done = (error, result) => {
            if (finished) return;

            finished = true;

            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        };

        try {
            const result = mcServerPing(host, port, done);

            if (result && typeof result.then === "function") {
                result
                    .then((data) => {
                        if (finished) return;

                        finished = true;
                        resolve(data);
                    })
                    .catch((error) => {
                        if (finished) return;

                        finished = true;
                        reject(error);
                    });
            } else if (
                result !== undefined &&
                typeof result !== "function"
            ) {
                if (finished) return;

                finished = true;
                resolve(result);
            }

        } catch (error) {
            if (!finished) {
                finished = true;
                reject(error);
            }
        }
    });
}

function normalizeResult(result) {
    const data = result || {};
    const players = data.players || {};

    let motd =
        data.description ??
        data.motd ??
        data.message ??
        "بدون MOTD";

    if (typeof motd === "object") {
        motd = extractText(motd);
    }

    const version =
        data.version?.name ??
        data.version ??
        "نامشخص";

    return {
        playersOnline: Number(
            players.online ??
            data.playerCount ??
            data.online ??
            0
        ),

        playersMax: Number(
            players.max ??
            data.maxPlayers ??
            data.max ??
            0
        ),

        version: String(version),

        motd: cleanText(String(motd)),

        ping: Number(
            data.latency ??
            data.ping ??
            0
        )
    };
}

function extractText(value) {
    if (typeof value === "string") {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(extractText).join("");
    }

    if (value && typeof value === "object") {
        let text = "";

        if (value.text) {
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
    return text
        .replace(/§[0-9a-fk-or]/gi, "")
        .replace(/\s+/g, " ")
        .trim();
}

app.get("*", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(
        `Minecraft Status Panel running on port ${PORT}`
    );
});
