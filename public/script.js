const hostInput = document.getElementById("host");
const portInput = document.getElementById("port");
const checkButton = document.getElementById("checkButton");

const result = document.getElementById("result");
const message = document.getElementById("message");

const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");

const serverAddress = document.getElementById("serverAddress");
const players = document.getElementById("players");
const ping = document.getElementById("ping");
const version = document.getElementById("version");
const motd = document.getElementById("motd");
const lastUpdate = document.getElementById("lastUpdate");

function showMessage(text) {
    message.textContent = text;
    message.classList.remove("hidden");
}

function hideMessage() {
    message.classList.add("hidden");
}

function showResult() {
    result.classList.remove("hidden");
}

function hideResult() {
    result.classList.add("hidden");
}

function setLoading(loading) {
    checkButton.disabled = loading;

    checkButton.querySelector("span").textContent =
        loading ? "در حال بررسی..." : "بررسی سرور";
}

function updateOnline(data) {

    statusDot.classList.remove("offline");

    statusText.textContent = "آنلاین";

    serverAddress.textContent =
        `${data.host}:${data.port}`;

    players.textContent =
        `${data.players.online} / ${data.players.max}`;

    ping.textContent =
        `${data.ping} ms`;

    version.textContent =
        data.version || "نامشخص";

    motd.textContent =
        cleanMotd(data.motd);

    lastUpdate.textContent =
        new Date().toLocaleTimeString("fa-IR");

    showResult();
}

function updateOffline(data) {

    statusDot.classList.add("offline");

    statusText.textContent = "آفلاین";

    serverAddress.textContent =
        `${data.host}:${data.port}`;

    players.textContent = "0 / 0";

    ping.textContent =
        data.ping ? `${data.ping} ms` : "---";

    version.textContent = "---";

    motd.textContent =
        data.error || "سرور در دسترس نیست.";

    lastUpdate.textContent =
        new Date().toLocaleTimeString("fa-IR");

    showResult();
}

function cleanMotd(value) {

    if (!value) {
        return "بدون MOTD";
    }

    if (typeof value === "string") {
        return value
            .replace(/§[0-9a-fk-or]/gi, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    if (typeof value === "object") {
        return extractText(value);
    }

    return String(value);
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

async function checkServer() {

    const host = hostInput.value.trim();
    const port = Number(portInput.value);

    if (!host) {
        showMessage("لطفاً IP یا دامنه سرور را وارد کنید.");
        hideResult();
        return;
    }

    if (
        !Number.isInteger(port) ||
        port < 1 ||
        port > 65535
    ) {
        showMessage("پورت باید بین 1 تا 65535 باشد.");
        hideResult();
        return;
    }

    hideMessage();
    setLoading(true);

    try {

        const response = await fetch(
            `/api/status?host=${encodeURIComponent(host)}&port=${port}`,
            {
                cache: "no-store"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "خطا در دریافت اطلاعات."
            );
        }

        if (data.online) {
            updateOnline(data);
        } else {
            updateOffline(data);
        }

    } catch (error) {

        showMessage(
            error.message || "خطایی هنگام بررسی سرور رخ داد."
        );

        hideResult();

    } finally {
        setLoading(false);
    }
}

checkButton.addEventListener("click", checkServer);

hostInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        checkServer();
    }
});

portInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        checkServer();
    }
});  if (password.length >= 8) score++;
    if (password.length >= 14) score++;
    
    // ارزیابی پیچیدگی کاراکترها با الگوهای منظم (RegEx)
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    // امتیازدهی و رنگ‌بندی بر اساس مجموع فاکتورها
    if (password.length < 6) {
        updateStrengthBar('خیلی ضعیف', '25%', 'var(--danger)');
    } else if (score <= 2) {
        updateStrengthBar('ضعیف', '40%', 'var(--danger)');
    } else if (score === 3 || score === 4) {
        updateStrengthBar('متوسط', '60%', 'var(--warning)');
    } else if (score === 5) {
        updateStrengthBar('قوی', '80%', 'var(--accent)');
    } else if (score >= 6) {
        updateStrengthBar('بسیار قوی ✨', '100%', 'var(--success)');
    }
}

// تابع کمکی برای به روز رسانی گرافیکی نوار قدرت‌سنج
function updateStrengthBar(text, width, color) {
    strengthLabel.textContent = text;
    strengthLabel.style.color = color;
    strengthBar.style.width = width;
    strengthBar.style.backgroundColor = color;
}

// ریست کردن نوار قدرت‌سنج در مواقع لزوم
function resetStrengthBar() {
    strengthLabel.textContent = '-';
    strengthLabel.style.color = 'var(--text-muted)';
    strengthBar.style.width = '0%';
}

// کپی کردن رمز عبور در کلیپ‌بورد با استفاده از Clipboard API مدرن
async function copyToClipboard() {
    const password = passwordDisplay.value;
    if (!password) return;

    try {
        await navigator.clipboard.writeText(password);
        
        // نمایش Toast موفقیت‌آمیز
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    } catch (err) {
        console.error('خطا در کپی کردن متن: ', err);
    }
}

// رویدادها (Event Listeners)
generateBtn.addEventListener('click', generatePassword);
copyBtn.addEventListener('click', copyToClipboard);

// اجرای اولیه تابع به محض لود شدن کامل صفحه تا فیلد خالی نماند
document.addEventListener('DOMContentLoaded', generatePassword);
