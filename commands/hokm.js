const manager = require("../games/hokm/manager");
const {
    hokmLobbyKeyboard,
    hokmSuitKeyboard,
    hokmCardsKeyboard,
} = require("../games/hokm/keyboard");

// آیدیِ چتِ روم برای هر بازیکن — چون دکمه‌های حکم/بازی‌کردنِ کارت
// در PV بازیکن فشرده می‌شوند، نه در گروه، پس باید بدانیم این PV مالِ کدام روم/گروه است.
const playerRoomMap = new Map();

let botUsernamePromise = null;
function getBotUsername(bot) {
    if (!botUsernamePromise) {
        botUsernamePromise = bot
            .getMe()
            .then((me) => me.username)
            .catch(() => null);
    }
    return botUsernamePromise;
}

module.exports = (bot) => {
    // =========================
    // شروعِ بازی
    // در گروه → لابی با دکمه‌ی ورود
    // در PV   → بازیِ تکی فوری با ۳ ربات
    // =========================
    bot.onText(/^\/hokm$/, async (msg) => {
        if (msg.chat.type === "private") {
            await startSoloGame(bot, msg);
            return;
        }

        createGroupLobby(bot, msg);
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
            bot.sendMessage(msg.chat.id, "❌ فقط سازنده‌ی بازی می‌تواند لغو کند.");
            return;
        }

        manager.cancel(msg.chat.id);
        bot.sendMessage(msg.chat.id, "🛑 بازی لغو شد.");
    });

    // =========================
    // دیسپچرِ دکمه‌های شیشه‌ای مربوط به حکم
    // =========================
    bot.on("callback_query", async (query) => {
        const data = query.data || "";

        if (!data.startsWith("hokm:")) return; // مالِ ماژول دیگری‌ست

        try {
            await handleCallback(bot, query, data);
        } catch (err) {
            console.error("Hokm callback error:", err);
            bot
                .answerCallbackQuery(query.id, { text: "⚠️ خطایی رخ داد." })
                .catch(() => {});
        }
    });
};

// ===================================
// ساختِ لابیِ گروهی
// ===================================
function createGroupLobby(bot, msg) {
    const room = manager.createRoom(msg.chat.id, msg.from);

    if (!room) {
        bot.sendMessage(
            msg.chat.id,
            "❌ یک بازی در همین گروه در حال اجراست.\nبرای لغوش /cancel بزن.",
        );
        return;
    }

    bot.sendMessage(
        msg.chat.id,
        `♠️♥️♦️♣️ لابیِ بازیِ حکم ساخته شد!\n\n${room.getLobbyText()}\nهر کس می‌خواد بازی کنه، روی «ورود به بازی» بزنه.\nهر وقت آماده بودید، سازنده‌ی بازی «شروع بازی» رو بزنه — جاهای خالی با ربات پر می‌شه.`,
        hokmLobbyKeyboard(),
    );
}

// ===================================
// بازیِ تکی درونِ PV (کاربر + ۳ ربات)
// ===================================
async function startSoloGame(bot, msg) {
    const existing = manager.getRoom(msg.chat.id);

    if (existing) {
        bot.sendMessage(
            msg.chat.id,
            "❌ یک بازی در همین چت در حال اجراست.\nبرای لغوش /cancel بزن.",
        );
        return;
    }

    const { room, game } = manager.createSoloRoom(msg.chat.id, msg.from);

    registerGameEvents(bot, room, game);

    await bot.sendMessage(
        msg.chat.id,
        `🎮 بازیِ تکیِ حکم شروع شد!\n\nتو با ۳ ربات هم‌بازی می‌شی 🤖🤖🤖\n\n${room.getInfo()}`,
    );

    game.start();
}

// ===================================
// دیسپچِ اکشن‌های دکمه‌ای
// ===================================
async function handleCallback(bot, query, data) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const parts = data.split(":");
    const action = parts[1];

    if (action === "join") return handleJoin(bot, query, chatId, userId);
    if (action === "startgame") return handleStartGame(bot, query, chatId, userId);
    if (action === "cancel") return handleCancel(bot, query, chatId, userId);
    if (action === "suit") return handleChooseSuit(bot, query, userId, parts[2]);
    if (action === "play") return handlePlayCard(bot, query, userId, parts[2], parts[3]);
    if (action === "retry") return handleRetry(bot, query, userId);

    return bot.answerCallbackQuery(query.id);
}

// ---- ورود به لابی ----
async function handleJoin(bot, query, chatId, userId) {
    const room = manager.getRoom(chatId);

    if (!room) {
        return bot.answerCallbackQuery(query.id, { text: "❌ لابی‌ای پیدا نشد." });
    }

    const result = manager.joinRoom(chatId, query.from);

    if (result === false) {
        return bot.answerCallbackQuery(query.id, {
            text: "⚠️ قبلاً وارد شدی، لابی پره، یا بازی شروع شده.",
            show_alert: true,
        });
    }

    await bot.answerCallbackQuery(query.id, { text: "✅ وارد شدی!" });

    await bot.editMessageText(
        `♠️♥️♦️♣️ لابیِ بازیِ حکم\n\n${room.getLobbyText()}\nهر کس می‌خواد بازی کنه، روی «ورود به بازی» بزنه.`,
        {
            chat_id: chatId,
            message_id: query.message.message_id,
            ...hokmLobbyKeyboard(),
        },
    );
}

// ---- شروعِ بازیِ گروهی ----
async function handleStartGame(bot, query, chatId, userId) {
    const room = manager.getRoom(chatId);

    if (!room) {
        return bot.answerCallbackQuery(query.id, { text: "❌ لابی‌ای پیدا نشد." });
    }

    if (room.ownerId !== userId) {
        return bot.answerCallbackQuery(query.id, {
            text: "❌ فقط سازنده‌ی بازی می‌تواند شروع کند.",
            show_alert: true,
        });
    }

    if (room.game) {
        return bot.answerCallbackQuery(query.id, { text: "بازی قبلاً شروع شده." });
    }

    const game = manager.startGame(chatId);

    await bot.answerCallbackQuery(query.id, { text: "🚀 بازی شروع شد!" });

    await bot.editMessageText(`🎮 بازی شروع شد!\n\n${room.getInfo()}`, {
        chat_id: chatId,
        message_id: query.message.message_id,
    });

    registerGameEvents(bot, room, game);
    game.start();
}

// ---- لغو از طریق دکمه ----
async function handleCancel(bot, query, chatId, userId) {
    const room = manager.getRoom(chatId);

    if (!room) {
        return bot.answerCallbackQuery(query.id, { text: "بازی‌ای وجود ندارد." });
    }

    if (room.ownerId !== userId) {
        return bot.answerCallbackQuery(query.id, {
            text: "فقط سازنده‌ی بازی می‌تواند لغو کند.",
            show_alert: true,
        });
    }

    manager.cancel(chatId);

    await bot.answerCallbackQuery(query.id, { text: "لغو شد." });

    await bot.editMessageText("🛑 بازی لغو شد.", {
        chat_id: chatId,
        message_id: query.message.message_id,
    });
}

// ---- انتخابِ خالِ حکم (فقط حاکمِ واقعی، از طریقِ PV) ----
async function handleChooseSuit(bot, query, userId, suit) {
    const roomChatId = playerRoomMap.get(userId);
    const game = roomChatId ? manager.getGame(roomChatId) : null;

    if (!game || !game.hakem || game.hakem.id !== userId || game.hokm) {
        return bot.answerCallbackQuery(query.id, {
            text: "الان نوبتِ انتخابِ حکم نیست.",
        });
    }

    game.setHokm(suit);

    await bot.answerCallbackQuery(query.id, { text: `حکم انتخاب شد: ${suit}` });

    await bot.editMessageText(`👑 حکم رو انتخاب کردی: ${suit}`, {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
    });
}

// ---- بازی‌کردنِ یک کارت ----
async function handlePlayCard(bot, query, userId, value, suit) {
    const roomChatId = playerRoomMap.get(userId);
    const result = roomChatId
        ? manager.playCard(roomChatId, userId, value, suit)
        : { ok: false, reason: "no_room" };

    if (!result.ok) {
        const messages = {
            not_your_turn: "الان نوبتِ تو نیست.",
            card_not_found: "این کارت رو نداری (شاید همین الان بازی شده).",
            must_follow_suit: "باید هم‌خالِ کارتِ اول بازی کنی.",
            no_game: "بازی‌ای پیدا نشد.",
            no_room: "بازی‌ای پیدا نشد.",
            finished: "بازی تمام شده.",
        };

        return bot.answerCallbackQuery(query.id, {
            text: messages[result.reason] || "❌ حرکت نامعتبر.",
            show_alert: true,
        });
    }

    await bot.answerCallbackQuery(query.id, { text: `✅ ${value}${suit} بازی شد.` });

    await bot.editMessageText(`✅ بازی کردی: ${value}${suit}`, {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
    });
}

// ---- تلاشِ مجدد برای ارسالِ دست/نوبت (وقتی کاربر تازه با ربات /start زده) ----
async function handleRetry(bot, query, userId) {
    const roomChatId = playerRoomMap.get(userId);
    const game = roomChatId ? manager.getGame(roomChatId) : null;

    if (!game) {
        return bot.answerCallbackQuery(query.id, { text: "بازی‌ای پیدا نشد." });
    }

    const player = game.players.find((p) => p.id === userId);

    if (!player) {
        return bot.answerCallbackQuery(query.id, { text: "تو در این بازی نیستی." });
    }

    player.canReceivePV = true;

    await sendCurrentPrompt(bot, game, player);

    await bot.answerCallbackQuery(query.id, { text: "دوباره فرستادم ✅" });
}

// ===================================
// ثبتِ رویدادهای موتورِ بازی → پیام‌رسانی در تلگرام
// (برای بازیِ گروهی و بازیِ تکی به یک شکل استفاده می‌شود)
// ===================================
function registerGameEvents(bot, room, game) {
    const chatId = room.chatId;

    game.on("newRound", ({ round, hakem }) => {
        bot.sendMessage(
            chatId,
            `🔄 راندِ ${round} شروع شد.\n👑 حاکمِ این راند: ${hakem.name}`,
        );
    });

    game.on("chooseHokm", async ({ hakem, hand }) => {
        if (hakem.isBot) return;

        playerRoomMap.set(hakem.id, chatId);

        const handText = hand.map((c) => `${c.value}${c.suit}`).join("   ");

        await sendToPlayer(
            bot,
            hakem,
            chatId,
            `👑 تو حاکمِ این راندی!\n\n🃏 دستِ ۵ کارتیِ تو:\n${handText}\n\nحالا خالِ حکم رو انتخاب کن:`,
            hokmSuitKeyboard(),
        );
    });

    game.on("hokmSelected", ({ hokm, hakem }) => {
        bot.sendMessage(chatId, `🃏 حکمِ این راند: ${hokm}\n👑 حاکم: ${hakem.name}`);
    });

    game.on("roundStarted", async ({ players }) => {
        for (const player of players) {
            if (player.isBot) continue;

            playerRoomMap.set(player.id, chatId);

            await sendToPlayer(
                bot,
                player,
                chatId,
                `🃏 دستِ کاملِ تو در این راند:\n\n${player.getHandText()}\n\nهر وقت نوبتت بشه، خودم کارت‌های قابل‌بازی رو با دکمه می‌فرستم — کافیه لمس کنی.`,
            );
        }
    });

    game.on("playerTurn", async ({ player, playable }) => {
        if (player.isBot) return;

        await sendToPlayer(
            bot,
            player,
            chatId,
            "🎯 نوبتِ توئه! یکی از این کارت‌ها رو انتخاب کن:",
            hokmCardsKeyboard(playable),
        );
    });

    game.on("cardPlayed", ({ player, card, table }) => {
        const tableText = table
            .map((t) => `${t.player.name}: ${t.card.value}${t.card.suit}`)
            .join("\n");

        bot.sendMessage(
            chatId,
            `🃏 ${player.name} بازی کرد: ${card.value}${card.suit}\n\nروی میز:\n${tableText}`,
        );
    });

    game.on("trickFinished", ({ winner }) => {
        bot.sendMessage(chatId, `🏆 برنده‌ی این دست: ${winner.name}`);
    });

    game.on("roundFinished", ({ round, tricks, score }) => {
        bot.sendMessage(
            chatId,
            `📊 پایانِ راندِ ${round}\n\nدست‌های این راند — تیم ۱: ${tricks.team1} | تیم ۲: ${tricks.team2}\n\n🏁 امتیازِ کل — تیم ۱: ${score.team1} | تیم ۲: ${score.team2}`,
        );
    });

    game.on("matchFinished", ({ winner, score }) => {
        bot.sendMessage(
            chatId,
            `🎉 بازی تمام شد!\n\n🏆 برنده: تیمِ ${winner}\n\nامتیازِ نهایی — تیم ۱: ${score.team1} | تیم ۲: ${score.team2}\n\nبرای بازیِ جدید /hokm رو بزن.`,
        );

        manager.cancel(chatId);
    });
}

// ===================================
// ارسالِ پیام به بازیکن در PV — با مدیریتِ حالتی که کاربر هنوز
// با ربات چتِ خصوصی شروع نکرده
// ===================================
async function sendToPlayer(bot, player, groupChatId, text, keyboardOpts = {}) {
    try {
        await bot.sendMessage(player.id, text, keyboardOpts);
        player.canReceivePV = true;
    } catch (err) {
        player.canReceivePV = false;

        // اگر همین الان هم در PV هستیم (بازیِ تکی)، دیگر کاری نمی‌شود کرد
        if (groupChatId === player.id) {
            return;
        }

        const username = await getBotUsername(bot);
        const startUrl = username ? `https://t.me/${username}?start=hokm` : null;

        const keyboard = {
            reply_markup: {
                inline_keyboard: [
                    ...(startUrl
                        ? [[{ text: "💬 شروعِ گفتگوی خصوصی با من", url: startUrl }]]
                        : []),
                    [{ text: "🔄 الان زدم، دوباره بفرست", callback_data: "hokm:retry" }],
                ],
            },
        };

        await bot
            .sendMessage(
                groupChatId,
                `⚠️ ${player.name} عزیز، برای دیدنِ دستت باید اول با من در PV چت رو شروع کنی، بعد «تلاش مجدد» رو بزن.`,
                keyboard,
            )
            .catch(() => {});
    }
}

// وقتی کاربر روی «تلاش مجدد» می‌زند، بر اساسِ وضعیتِ فعلیِ بازی
// دقیقاً همان چیزی که الان باید ببیند را دوباره برایش می‌فرستیم.
async function sendCurrentPrompt(bot, game, player) {
    const chatId = game.room.chatId;

    if (game.hakem && game.hakem.id === player.id && !game.hokm) {
        const handText = player.hand.map((c) => `${c.value}${c.suit}`).join("   ");

        return sendToPlayer(
            bot,
            player,
            chatId,
            `👑 تو حاکمِ این راندی!\n\n🃏 دستِ تو:\n${handText}\n\nخالِ حکم رو انتخاب کن:`,
            hokmSuitKeyboard(),
        );
    }

    if (game.currentPlayer && game.currentPlayer.id === player.id) {
        const playable = player.getPlayableCards(game.leadSuit);

        return sendToPlayer(
            bot,
            player,
            chatId,
            "🎯 نوبتِ توئه! یکی از این کارت‌ها رو انتخاب کن:",
            hokmCardsKeyboard(playable),
        );
    }

    return sendToPlayer(bot, player, chatId, `🃏 دستِ فعلیِ تو:\n\n${player.getHandText()}`);
}
