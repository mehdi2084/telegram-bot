const TelegramBot = require("node-telegram-bot-api").default;

const token = process.env.BOT_TOKEN;

const bot = new TelegramBot(token, {
    polling: true
});

console.log("Chiko Bot Started 🚀");

// ذخیره امتیاز کاربران
const users = {};

// تابع ثبت کاربر
function registerUser(id, name) {
    if (!users[id]) {
        users[id] = {
            name,
            xp: 0,
            coins: 100
        };
    }
}

// استارت
bot.onText(/\/start/, (msg) => {
    registerUser(msg.from.id, msg.from.first_name);

    bot.sendMessage(
        msg.chat.id,
        `سلام ${msg.from.first_name} 👋

به چیکو خوش اومدی 🤖

🎮 بازی‌ها:
/dice
/coin
/guess
/rps

😂 سرگرمی:
/joke
/fact
/luck

👤 پروفایل:
/profile
/top`
    );
});

// پروفایل
bot.onText(/\/profile/, (msg) => {
    registerUser(msg.from.id, msg.from.first_name);

    const user = users[msg.from.id];

    bot.sendMessage(
        msg.chat.id,
        `👤 ${user.name}

⭐ XP: ${user.xp}
🪙 Coins: ${user.coins}`
    );
});

// جدول رتبه بندی
bot.onText(/\/top/, (msg) => {
    const ranking = Object.values(users)
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 10);

    let text = "🏆 برترین کاربران:\n\n";

    ranking.forEach((u, i) => {
        text += `${i + 1}. ${u.name} - ${u.xp} XP\n`;
    });

    bot.sendMessage(msg.chat.id, text);
});

// تاس
bot.onText(/\/dice/, (msg) => {
    const number = Math.floor(Math.random() * 6) + 1;

    bot.sendMessage(
        msg.chat.id,
        `🎲 عدد تاس: ${number}`
    );
});

// شیر یا خط
bot.onText(/\/coin/, (msg) => {
    const result =
        Math.random() < 0.5 ? "🦁 شیر" : "🪙 خط";

    bot.sendMessage(msg.chat.id, result);
});

// شانس امروز
bot.onText(/\/luck/, (msg) => {
    const luck = Math.floor(Math.random() * 101);

    bot.sendMessage(
        msg.chat.id,
        `🍀 شانس امروزت: ${luck}%`
    );
});

// جوک
const jokes = [
    "😂 معلم: چرا تکلیف ننوشتی؟ دانش‌آموز: اینترنت قطع بود!",
    "😂 کامپیوترم مریض شده، ویروس گرفته!",
    "😂 برنامه‌نویس‌ها خواب نمی‌بینن، دیباگ می‌کنن!"
];

bot.onText(/\/joke/, (msg) => {
    const joke =
        jokes[Math.floor(Math.random() * jokes.length)];

    bot.sendMessage(msg.chat.id, joke);
});

// دانستنی
const facts = [
    "🦒 زبان زرافه تا 50 سانتی‌متر طول دارد.",
    "🐙 اختاپوس سه قلب دارد.",
    "🦈 کوسه‌ها قبل از دایناسورها وجود داشتند."
];

bot.onText(/\/fact/, (msg) => {
    const fact =
        facts[Math.floor(Math.random() * facts.length)];

    bot.sendMessage(msg.chat.id, fact);
});

// حدس عدد
const games = {};

bot.onText(/\/guess/, (msg) => {
    games[msg.chat.id] =
        Math.floor(Math.random() * 10) + 1;

    bot.sendMessage(
        msg.chat.id,
        "🎯 یک عدد بین 1 تا 10 حدس بزن."
    );
});

// سنگ کاغذ قیچی
bot.onText(/\/rps (سنگ|کاغذ|قیچی)/, (msg, match) => {
    const player = match[1];

    const choices = [
        "سنگ",
        "کاغذ",
        "قیچی"
    ];

    const botChoice =
        choices[Math.floor(Math.random() * 3)];

    let result = "";

    if (player === botChoice)
        result = "🤝 مساوی";

    else if (
        (player === "سنگ" && botChoice === "قیچی") ||
        (player === "کاغذ" && botChoice === "سنگ") ||
        (player === "قیچی" && botChoice === "کاغذ")
    )
        result = "🎉 شما بردید";

    else
        result = "😢 شما باختید";

    bot.sendMessage(
        msg.chat.id,
        `شما: ${player}
ربات: ${botChoice}

${result}`
    );
});

// دریافت پاسخ حدس عدد
bot.on("message", (msg) => {

    if (!msg.text) return;

    const game = games[msg.chat.id];

    if (game && /^[0-9]+$/.test(msg.text)) {

        const guess = parseInt(msg.text);

        registerUser(
            msg.from.id,
            msg.from.first_name
        );

        if (guess === game) {

            users[msg.from.id].xp += 10;
            users[msg.from.id].coins += 20;

            delete games[msg.chat.id];

            bot.sendMessage(
                msg.chat.id,
                "🎉 درست حدس زدی!\n⭐ +10 XP\n🪙 +20 Coins"
            );

        } else {

            bot.sendMessage(
                msg.chat.id,
                "❌ اشتباه بود. دوباره تلاش کن."
            );
        }
    }
});