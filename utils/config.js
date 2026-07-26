// تنظیمات کلی پروژه
// این فایل باید کنار bot.js (ریشه‌ی پروژه) قرار بگیره

module.exports = {

    // تنظیمات دیتابیس JSON
    DATABASE: {
        PATH: "data/users.json", // مسیر نسبت به ریشه پروژه
    },

    // پاداش‌های بازی‌ها
    REWARDS: {
        XP_PER_GAME: 5,
        XP_PER_WIN: 15,
        COINS_PER_WIN: 10,
        DAILY_LUCK_COINS: 5,
    },

    // محدودیت‌ها
    LIMITS: {
        GUESS_MAX_ATTEMPTS: 10,
        HOKM_MAX_PLAYERS: 4,
    },

};
