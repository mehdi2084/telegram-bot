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

// ثبت کاربر
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
// COMMANDS
// ==========================

const commands = {
    start: require("./commands/start"),
    profile: require("./commands/profile"),
    top: require("./commands/top"),

    dice: require("./commands/dice"),
    coin: require("./commands/coin"),
    joke: require("./commands/joke"),
    fact: require("./commands/fact"),
    luck: require("./commands/luck"),
    guess: require("./commands/guess"),
    rps: require("./commands/rps"),

    hokm: require("./commands/hokm"),
};

// ==========================
// LOAD COMMANDS
// ==========================

commands.start(
    bot,
    users,
    registerUser
);

commands.profile(
    bot,
    users,
    registerUser
);

commands.top(
    bot,
    users
);

commands.dice(
    bot,
    users
);

commands.coin(
    bot,
    users
);

commands.joke(
    bot
);

commands.fact(
    bot
);

commands.luck(
    bot
);

commands.guess(
    bot,
    users,
    registerUser
);

commands.rps(
    bot,
    users,
    registerUser
);

commands.hokm(
    bot,
    users,
    registerUser
);

// ==========================
// UNKNOWN COMMAND
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
    "join",
    "startgame",
    "cancel",
    "play",
    "hokmchoose",
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
// POLLING ERROR
// ==========================

bot.on(
    "polling_error",
    (err) => {

        console.error(
            "Polling Error:",
            err.message
        );

    }
);

// ==========================
// GENERAL ERROR
// ==========================

bot.on(
    "error",
    (err) => {

        console.error(
            "Bot Error:",
            err
        );

    }
);

// ==========================
// UNHANDLED PROMISE
// ==========================

process.on(
    "unhandledRejection",
    (err) => {

        console.error(
            "Unhandled Rejection:",
            err
        );

    }
);

// ==========================
// UNCAUGHT EXCEPTION
// ==========================

process.on(
    "uncaughtException",
    (err) => {

        console.error(
            "Uncaught Exception:",
            err
        );

    }
);

console.log("✅ All commands loaded successfully.");