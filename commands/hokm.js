const manager = require("../games/hokm/manager");

module.exports = (bot) => {
    // =========================
    // ساخت روم
    // =========================

    bot.onText(/^\/hokm$/, (msg) => {
        const room = manager.createRoom(msg.chat.id, msg.from);

        if (!room) {
            bot.sendMessage(msg.chat.id, "❌ یک بازی در حال اجراست.");
            return;
        }

        bot.sendMessage(
            msg.chat.id,
            `♠️ روم ساخته شد

👤 ${msg.from.first_name} وارد بازی شد.

برای ورود:
/join`,
        );
    });

    // =========================
    // ورود
    // =========================

    bot.onText(/^\/join$/, (msg) => {
        const room = manager.joinRoom(msg.chat.id, msg.from);

        if (room === null) {
            bot.sendMessage(msg.chat.id, "❌ رومی وجود ندارد.");

            return;
        }

        if (room === false) {
            bot.sendMessage(msg.chat.id, "❌ امکان ورود وجود ندارد.");

            return;
        }

        bot.sendMessage(
            msg.chat.id,
            `✅ ${msg.from.first_name} وارد بازی شد.

👥 ${room.playerCount()}/4`,
        );
    });

    // =========================
    // شروع بازی
    // =========================

    bot.onText(/^\/startgame$/, (msg) => {
        const game = manager.startGame(msg.chat.id);

        if (game === null) {
            bot.sendMessage(msg.chat.id, "❌ روم وجود ندارد.");

            return;
        }

        if (game === false) {
            bot.sendMessage(msg.chat.id, "❌ هنوز چهار بازیکن کامل نشده‌اند.");

            return;
        }

        registerEvents(bot, msg.chat.id, game);

        game.begin();
    });

    // =========================
    // انتخاب حکم
    // =========================

    bot.onText(/^\/hokmchoose (♠|♥|♦|♣)$/, (msg, match) => {
        manager.chooseHokm(msg.chat.id, match[1]);
    });

    // =========================
    // بازی کارت
    // =========================

    bot.onText(/^\/play (.+) (♠|♥|♦|♣)$/, (msg, match) => {
        const ok = manager.play(msg.chat.id, msg.from.id, match[2], match[1]);

        if (!ok) {
            bot.sendMessage(msg.chat.id, "❌ حرکت نامعتبر.");
        }
    });

    // =========================
    // لغو
    // =========================

    bot.onText(/^\/cancel$/, (msg) => {
        const room = manager.getRoom(msg.chat.id);

        if (!room) {
            bot.sendMessage(msg.chat.id, "❌ بازی فعالی وجود ندارد.");

            return;
        }

        if (room.ownerId !== msg.from.id) {
            bot.sendMessage(
                msg.chat.id,
                "❌ فقط سازنده بازی می‌تواند بازی را لغو کند.",
            );

            return;
        }

        manager.cancel(msg.chat.id);

        bot.sendMessage(msg.chat.id, "🛑 بازی لغو شد.");
    });
};

// ===================================
// Eventها
// ===================================

function registerEvents(bot, chatId, game) {
    game.on("chooseHokm", (player) => {
        bot.sendMessage(
            chatId,
            `👑 ${player.name}

حکم را انتخاب کن.

/hokmchoose ♠
/hokmchoose ♥
/hokmchoose ♦
/hokmchoose ♣`,
        );
    });

    game.on("roundStarted", async (data) => {
        // پیام شروع بازی در گروه
        await bot.sendMessage(
            chatId,
            `🎮 بازی شروع شد

👑 حاکم: ${data.hakem.name}

🃏 حکم: ${data.hokm}`,
        );

        // ارسال دست هر بازیکن در PV
        for (const player of data.players) {
            // برای بات‌ها پیام ارسال نکن
            if (player.isBot) continue;

            // ساخت متن کارت‌ها
            const cards = player.hand
                .map((card) => `${card.value}${card.suit}`)
                .join("   ");

            try {
                await bot.sendMessage(
                    player.id,
                    `🃏 دست شما

${cards}

برای بازی کردن از دستور زیر استفاده کنید:

/play A ♠`,
                );
            } catch (err) {
                await bot.sendMessage(
                    chatId,
                    `⚠️ ${player.name} ابتدا باید ربات را در گفتگوی خصوصی (/start) اجرا کند تا بتوانم دستش را برایش ارسال کنم.`,
                );
            }
        }
    });

    game.on("playerTurn", (data) => {
        if (data.player.isBot) return;

        bot.sendMessage(
            chatId,
            `🎯 نوبت ${data.player.name}

مثال:

/play A ♠`,
        );
    });

    game.on("cardPlayed", (data) => {
        bot.sendMessage(
            chatId,
            `${data.player.name}

${data.card.value}${data.card.suit}`,
        );
    });

    game.on("trickFinished", (data) => {
        bot.sendMessage(
            chatId,
            `🏆 برنده دست:

${data.winner.name}`,
        );
    });

    game.on("roundFinished", (data) => {
        bot.sendMessage(
            chatId,
            `📊

تیم ۱ : ${data.score.team1}

تیم ۲ : ${data.score.team2}`,
        );
    });

    game.on("matchFinished", (data) => {
        bot.sendMessage(
            chatId,
            `🎉 بازی تمام شد

برنده تیم ${data.winner}`,
        );
    });
}
