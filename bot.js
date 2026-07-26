require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api").default;

const token = process.env.BOT_TOKEN;

const bot = new TelegramBot(token, {
    polling: true,
});

console.log("🚀 Chiko Bot Started");

// ==========================
// کاربران
// ==========================

const users = {};

function registerUser(id, name) {

    if (!users[id]) {

        users[id] = {
            id,
            name,
            xp: 0,
            coins: 0,
            joinDate: new Date().toISOString(),
        };

    }

    return users[id];

}

// ==========================
// بارگذاری دستورات
// ==========================

require("./commands/start")(
    bot,
    users,
    registerUser
);

require("./commands/profile")(
    bot,
    users,
    registerUser
);

require("./commands/top")(
    bot,
    users
);

require("./commands/dice")(
    bot,
    users
);

require("./commands/coin")(
    bot,
    users
);

require("./commands/joke")(
    bot
);

require("./commands/fact")(
    bot
);

require("./commands/luck")(
    bot
);

require("./commands/guess")(
    bot,
    users,
    registerUser
);

require("./commands/rps")(
    bot,
    users,
    registerUser
);

// ==========================
// Hokm
// ==========================

require("./commands/hokm")(
    bot
);

// ==========================
// دستور ناشناخته
// ==========================

const knownCommands = new Set([
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

    "hokm",
    "cancel",
]);

bot.onText(/^\/([^\s]+)/, (msg, match) => {

    const command = match[1];

    if (!knownCommands.has(command)) {

        bot.sendMessage(
            msg.chat.id,
            "❌ دستور ناشناخته.\n\nبرای مشاهده دستورات از /start استفاده کنید."
        );

    }

});

// ==========================
// خطاها
// ==========================

bot.on("polling_error", (err) => {

    console.error(
        "Polling Error:",
        err.message
    );

});

bot.on("error", (err) => {

    console.error(
        "Bot Error:",
        err
    );

});

process.on("unhandledRejection", (err) => {

    console.error(
        "Unhandled Rejection:",
        err
    );

});

process.on("uncaughtException", (err) => {

    console.error(
        "Uncaught Exception:",
        err
    );

});

console.log("✅ All commands loaded successfully.");