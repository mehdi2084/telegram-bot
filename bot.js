const TelegramBot = require("node-telegram-bot-api").default;

const Player = require("./games/hokm/player");
const Room = require("./games/hokm/room");
const Game = require("./games/hokm/game");

const token = process.env.BOT_TOKEN;

const bot = new TelegramBot(token, {
    polling: true,
});

console.log("Chiko Bot Started 🚀");

// کاربران
const users = {};

// اتاق‌های حکم
const rooms = {};

// ثبت کاربر
function registerUser(id, name) {
    if (!users[id]) {
        users[id] = {
            name,

            xp: 0,

            coins: 0,
        };
    }
}

// ==========================
// START
// ==========================

bot.onText(/\/start/, (msg) => {
    registerUser(msg.from.id, msg.from.first_name);

    bot.sendMessage(
        msg.chat.id,

        `سلام ${msg.from.first_name} 👋

به چیکو خوش آمدی 🤖


🎮 بازی‌ها:

/hokm
/join
/startgame


😂 سرگرمی:

/dice
/coin
/joke


👤 پروفایل:

/profile
/top`,
    );
});

// ==========================
// PROFILE
// ==========================

bot.onText(/\/profile/, (msg) => {
    registerUser(msg.from.id, msg.from.first_name);

    const user = users[msg.from.id];

    bot.sendMessage(
        msg.chat.id,

        `👤 ${user.name}

⭐ XP : ${user.xp}
🪙 Coins : ${user.coins}`,
    );
});

// ==========================
// ساخت روم حکم
// ==========================

bot.onText(/\/hokm/, (msg) => {
    const chatId = msg.chat.id;

    if (rooms[chatId]) {
        bot.sendMessage(chatId, "❌ یک بازی از قبل ساخته شده.");

        return;
    }

    const room = new Room(chatId, msg.from.id);

    rooms[chatId] = room;

    const player = new Player(msg.from.id, msg.from.first_name);

    room.addPlayer(player);

    bot.sendMessage(
        chatId,

        `♠️ بازی حکم ساخته شد

👤 ${player.name} وارد شد

بازیکنان دیگر:
 /join`,
    );
});

// ==========================
// ورود بازیکن
// ==========================

bot.onText(/\/join/, (msg) => {
    const room = rooms[msg.chat.id];

    if (!room) {
        bot.sendMessage(msg.chat.id, "❌ بازی وجود ندارد");

        return;
    }

    const player = new Player(
        msg.from.id,

        msg.from.first_name,
    );

    const result = room.addPlayer(player);

    if (!result) {
        bot.sendMessage(msg.chat.id, "❌ امکان ورود نیست");

        return;
    }

    bot.sendMessage(
        msg.chat.id,

        `✅ ${player.name} وارد بازی شد

👥 تعداد بازیکنان:
${room.playerCount()}/4`,
    );
});

// ==========================
// شروع بازی
// ==========================

bot.onText(/\/startgame/, (msg) => {
    const room = rooms[msg.chat.id];

    if (!room) {
        bot.sendMessage(msg.chat.id, "❌ روم وجود ندارد");

        return;
    }

    if (!room.isFull()) {
        bot.sendMessage(
            msg.chat.id,

            "❌ هنوز 4 بازیکن کامل نشده",
        );

        return;
    }

    room.addBots(0);

    const game = new Game(room);

    room.game = game;

    game.on("chooseHokm", (player) => {
        bot.sendMessage(
            msg.chat.id,

            `👑 ${player.name}

حکم خود را انتخاب کن:

♠️ ♣️ ♥️ ♦️`,
        );
    });

    game.on(
        "roundStarted",

        (data) => {
            bot.sendMessage(
                msg.chat.id,

                `🎮 بازی شروع شد

👑 حاکم:
${data.hakem.name}

🃏 حکم:
${data.hokm}`,
            );

            game.startTurn();
        },
    );

    game.on(
        "playerTurn",

        (data) => {
            if (data.player.isBot) return;

            bot.sendMessage(
                msg.chat.id,

                `🎯 نوبت ${data.player.name}

کارت خود را ارسال کن:

مثال:

/play A ♠`,
            );
        },
    );

    game.on(
        "cardPlayed",

        (data) => {
            bot.sendMessage(
                msg.chat.id,

                `${data.player.name}
کارت ${data.card.value}${data.card.suit} بازی کرد`,
            );
        },
    );

    game.on(
        "trickFinished",

        (data) => {
            bot.sendMessage(
                msg.chat.id,

                `🏆 این دست را ${data.winner.name} برد`,
            );
        },
    );

    game.on(
        "matchFinished",

        (data) => {
            bot.sendMessage(
                msg.chat.id,

                `🎉 بازی تمام شد

برنده تیم ${data.winner}

امتیاز:

${JSON.stringify(data.score)}`,
            );
        },
    );

    game.begin();
});

// ==========================
// انتخاب حکم
// ==========================

bot.onText(
    /\/hokmchoose (♠|♥|♦|♣)/,

    (msg, match) => {
        const room = rooms[msg.chat.id];

        if (!room || !room.game) return;

        room.game.setHokm(match[1]);
    },
);

// ==========================
// لغو بازی حکم
// ==========================

bot.onText(/\/cancel/, (msg) => {
    const room = rooms[msg.chat.id];

    if (!room) {
        bot.sendMessage(msg.chat.id, "❌ بازی فعالی وجود ندارد.");

        return;
    }

    // فقط سازنده روم می‌تواند لغو کند
    if (room.ownerId !== msg.from.id) {
        bot.sendMessage(
            msg.chat.id,
            "❌ فقط سازنده بازی می‌تواند آن را لغو کند.",
        );

        return;
    }

    if (room.game) {
        room.game.stop("Cancelled");
    }

    delete rooms[msg.chat.id];

    bot.sendMessage(msg.chat.id, "🛑 بازی حکم لغو شد.");
});

// ==========================
// بازی کارت
// ==========================

bot.onText(
    /\/play (.+) (♠|♥|♦|♣)/,

    (msg, match) => {
        const room = rooms[msg.chat.id];

        if (!room || !room.game) return;

        const playerId = msg.from.id;

        const value = match[1];

        const suit = match[2];

        const result = room.game.play(playerId, suit, value);

        if (!result) {
            bot.sendMessage(msg.chat.id, "❌ حرکت غیرمجاز");
        }
    },
);

// ==========================
// تاس
// ==========================

bot.onText(/\/dice/, (msg) => {
    const n = Math.floor(Math.random() * 6) + 1;

    bot.sendMessage(
        msg.chat.id,

        `🎲 ${n}`,
    );
});

// ==========================
// سکه
// ==========================

bot.onText(/\/coin/, (msg) => {
    bot.sendMessage(
        msg.chat.id,

        Math.random() < 0.5 ? "🦁 شیر" : "🪙 خط",
    );
});

// ==========================
// جوک
// ==========================

bot.onText(/\/joke/, (msg) => {
    bot.sendMessage(
        msg.chat.id,

        "😂 برنامه نویس خواب نمیبینه، دیباگ میکنه!",
    );
});
