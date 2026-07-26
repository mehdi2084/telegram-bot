// ==========================
// سازنده‌های کیبورد قابل استفاده مجدد
// ==========================

// کیبورد اصلی منو (استفاده‌شده در start.js)
function mainMenuKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                ["🎮 بازی‌ها", "😂 سرگرمی"],
                ["👤 پروفایل", "📊 رتبه‌بندی"],
            ],
            resize_keyboard: true,
        },
    };
}

// کیبورد سنگ کاغذ قیچی
function rpsKeyboard() {
    return {
        reply_markup: {
            keyboard: [
                ["🪨", "📄", "✂️"],
                ["❌ لغو"],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    };
}

// یک کیبورد عمومی «لغو»
function cancelKeyboard(label = "❌ لغو") {
    return {
        reply_markup: {
            keyboard: [[label]],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    };
}

// حذف کامل کیبورد
function removeKeyboard() {
    return { reply_markup: { remove_keyboard: true } };
}

// کیبورد بله/خیر
function confirmKeyboard(yesLabel = "✅ بله", noLabel = "❌ خیر") {
    return {
        reply_markup: {
            keyboard: [[yesLabel, noLabel]],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    };
}

// ==========================
// کیبوردهای اینلاینِ بازیِ حکم
// (همه‌ی callback_data ها با پیشوند "hokm:" شروع می‌شوند تا در dispatcher قابل تشخیص باشند)
// ==========================

// دکمه‌های لابیِ گروهی: ورود / شروع / لغو
function hokmLobbyKeyboard() {
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: "✅ ورود به بازی", callback_data: "hokm:join" }],
                [{ text: "🚀 شروع بازی (باقی با ربات پر می‌شود)", callback_data: "hokm:startgame" }],
                [{ text: "❌ لغو", callback_data: "hokm:cancel" }],
            ],
        },
    };
}

// انتخاب خالِ حکم توسط حاکم (فقط برای خودِ حاکم در PV ارسال می‌شود)
function hokmSuitKeyboard() {
    const suits = [
        { emoji: "♠️", value: "♠" },
        { emoji: "♥️", value: "♥" },
        { emoji: "♦️", value: "♦" },
        { emoji: "♣️", value: "♣" },
    ];

    return {
        reply_markup: {
            inline_keyboard: [
                suits.map((s) => ({
                    text: s.emoji,
                    callback_data: `hokm:suit:${s.value}`,
                })),
            ],
        },
    };
}

// کارت‌های قابل‌بازی به‌صورت دکمه (فقط کارت‌های مجاز پاس داده شود، نه کل دست)
function hokmCardsKeyboard(cards) {
    const rows = [];

    for (let i = 0; i < cards.length; i += 4) {
        rows.push(
            cards.slice(i, i + 4).map((card) => ({
                text: `${card.value}${card.suit}`,
                callback_data: `hokm:play:${card.value}:${card.suit}`,
            })),
        );
    }

    return { reply_markup: { inline_keyboard: rows } };
}

// دکمه‌ی «تلاش مجدد» برای کسی که هنوز با ربات در PV چت نزده
function hokmRetryKeyboard() {
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🔄 الان /start زدم، دوباره بفرست", callback_data: "hokm:retry" }],
            ],
        },
    };
}

module.exports = {
    mainMenuKeyboard,
    rpsKeyboard,
    cancelKeyboard,
    removeKeyboard,
    confirmKeyboard,
    hokmLobbyKeyboard,
    hokmSuitKeyboard,
    hokmCardsKeyboard,
    hokmRetryKeyboard,
};
