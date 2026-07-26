// ==========================
// ثابت‌های عمومی پروژه
// ==========================

// دستورات شناخته‌شده ربات (برای هندلر دستور ناشناخته در bot.js)
const KNOWN_COMMANDS = [
    "start",
    "profile",
    "top",

    "dice",
    "coin",
    "joke",
    "fact",
    "luck",
    "guess",
    "rps",

    "hokm", // در گروه: لابی با دکمه | در PV: بازیِ تکی فوری با ۳ ربات
    "cancel",
    // نکته: /join و /startgame و /hokmchoose و /play دیگر لازم نیستند —
    // در نسخه‌ی جدیدِ حکم همه‌چیز با دکمه‌های شیشه‌ای (inline keyboard) انجام می‌شود.
];

// پیام‌های عمومی تکرارشونده
const MESSAGES = {
    NOT_REGISTERED: "❌ ابتدا با /start ثبت نام کنید.",
    UNKNOWN_COMMAND: "❌ دستور ناشناخته.\n\nبرای مشاهده دستورات از /start استفاده کنید.",
    NO_ACTIVE_GAME: "❌ بازی فعالی وجود ندارد.",
    GAME_CANCELED: "❌ بازی لغو شد.",
};

// پاداش‌ها (هم‌راستا با config.js — از اینجا هم قابل استفاده در فایل‌های commands)
const REWARDS = {
    XP_PER_GAME: 5,
    XP_PER_WIN: 15,
    COINS_PER_WIN: 10,
    DAILY_LUCK_COINS: 5,
};

// سنگ کاغذ قیچی
const RPS_CHOICES = ["🪨", "📄", "✂️"];

const RPS_EMOJI_MAP = {
    "🪨": "سنگ",
    "📄": "کاغذ",
    "✂️": "قیچی",
};

// ==========================
// ثابت‌های بازی حکم
// ==========================

const HOKM_SUITS = ["♠️", "♥️", "♦️", "♣️"];

const HOKM_RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

const HOKM_TEAMS = {
    TEAM1: "team1",
    TEAM2: "team2",
};

const HOKM_MAX_PLAYERS = 4;

const HOKM_WINNING_TRICKS = 7; // تعداد دست لازم برای برد یک راند

module.exports = {
    KNOWN_COMMANDS,
    MESSAGES,
    REWARDS,
    RPS_CHOICES,
    RPS_EMOJI_MAP,
    HOKM_SUITS,
    HOKM_RANKS,
    HOKM_TEAMS,
    HOKM_MAX_PLAYERS,
    HOKM_WINNING_TRICKS,
};
