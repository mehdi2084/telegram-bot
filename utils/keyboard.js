// ==========================
// سازنده‌های کیبورد قابل استفاده مجدد
// (جایگزین کیبوردهای دستی و پراکنده در فایل‌های commands)
// ==========================

// کیبورد اصلی منو (همون چیزی که در start.js استفاده می‌شه)
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

// یک کیبورد عمومی «لغو» برای هر بازی/مراحل چندقسمتی
function cancelKeyboard(label = "❌ لغو") {
    return {
        reply_markup: {
            keyboard: [[label]],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    };
}

// حذف کامل کیبورد (پایان بازی)
function removeKeyboard() {
    return {
        reply_markup: {
            remove_keyboard: true,
        },
    };
}

// کیبورد بله/خیر برای تایید (مثل قبول دعوت به بازی حکم)
function confirmKeyboard(yesLabel = "✅ بله", noLabel = "❌ خیر") {
    return {
        reply_markup: {
            keyboard: [[yesLabel, noLabel]],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    };
}

// کیبورد اینلاین برای انتخاب خال حکم توسط حاکم
function hokmSuitInlineKeyboard() {
    const suits = ["♠️", "♥️", "♦️", "♣️"];

    return {
        reply_markup: {
            inline_keyboard: [
                suits.map((suit) => ({
                    text: suit,
                    callback_data: `hokm_suit_${suit}`,
                })),
            ],
        },
    };
}

// کیبورد اینلاین ورود/شروع به روم حکم
function hokmRoomInlineKeyboard(roomId) {
    return {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "🎮 ورود به روم", callback_data: `hokm_join_${roomId}` },
                    { text: "🚀 شروع بازی", callback_data: `hokm_start_${roomId}` },
                ],
                [{ text: "❌ لغو", callback_data: `hokm_cancel_${roomId}` }],
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
    hokmSuitInlineKeyboard,
    hokmRoomInlineKeyboard,
};
