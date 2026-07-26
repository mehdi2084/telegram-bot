module.exports = (bot, users, rooms, registerUser, Player, Room, Game) => {
    // ساخت روم حکم
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
            `♠️ بازی حکم ساخته شد\n\n👤 ${player.name} وارد شد\n\nبازیکنان دیگر:\n/join`
        );
    });

    // ورود به بازی
    bot.onText(/\/join/, (msg) => {
        const room = rooms[msg.chat.id];
        if (!room) {
            bot.sendMessage(msg.chat.id, "❌ بازی وجود ندارد");
            return;
        }

        const player = new Player(msg.from.id, msg.from.first_name);
        const result = room.addPlayer(player);

        if (!result) {
            bot.sendMessage(msg.chat.id, "❌ امکان ورود نیست");
            return;
        }

        bot.sendMessage(
            msg.chat.id,
            `✅ ${player.name} وارد بازی شد\n\n👥 تعداد بازیکنان: ${room.playerCount()}/4`
        );
    });

    // شروع بازی
    bot.onText(/\/startgame/, (msg) => {
        const room = rooms[msg.chat.id];
        if (!room) {
            bot.sendMessage(msg.chat.id, "❌ روم وجود ندارد");
            return;
        }

        if (!room.isFull()) {
            bot.sendMessage(msg.chat.id, "❌ هنوز 4 بازیکن کامل نشده");
            return;
        }

        room.addBots(0);
        const game = new Game(room);
        room.game = game;

        // Event handlers
        game.on("chooseHokm", (player) => {
            bot.sendMessage(
                msg.chat.id,
                `👑 ${player.name}\n\nحکم خود را انتخاب کن:\n\n/hokmchoose ♠\n/hokmchoose ♥\n/hokmchoose ♦\n/hokmchoose ♣`
            );
        });

        game.on("roundStarted", (data) => {
            bot.sendMessage(
                msg.chat.id,
                `🎮 بازی شروع شد\n\n👑 حاکم: ${data.hakem.name}\n🃏 حکم: ${data.hokm}`
            );
            game.startTurn();
        });

        game.on("playerTurn", (data) => {
            if (data.player.isBot) return;
            bot.sendMessage(
                msg.chat.id,
                `🎯 نوبت ${data.player.name}\n\nکارت خود را ارسال کن:\nمثال: /play A ♠`
            );
        });

        game.on("cardPlayed", (data) => {
            bot.sendMessage(
                msg.chat.id,
                `${data.player.name} کارت ${data.card.value}${data.card.suit} بازی کرد`
            );
        });

        game.on("trickFinished", (data) => {
            bot.sendMessage(
                msg.chat.id,
                `🏆 این دست را ${data.winner.name} برد`
            );
        });

        game.on("matchFinished", (data) => {
            bot.sendMessage(
                msg.chat.id,
                `🎉 بازی تمام شد\n\nبرنده تیم ${data.winner}\n\nامتیاز:\n${JSON.stringify(data.score, null, 2)}`
            );
        });

        game.begin();
    });

    // انتخاب حکم
    bot.onText(/\/hokmchoose (♠|♥|♦|♣)/, (msg, match) => {
        const room = rooms[msg.chat.id];
        if (!room || !room.game) return;
        room.game.setHokm(match[1]);
    });

    // بازی کارت
    bot.onText(/\/play (.+) (♠|♥|♦|♣)/, (msg, match) => {
        const room = rooms[msg.chat.id];
        if (!room || !room.game) return;
        const playerId = msg.from.id;
        const value = match[1];
        const suit = match[2];
        const result = room.game.play(playerId, suit, value);
        if (!result) {
            bot.sendMessage(msg.chat.id, "❌ حرکت غیرمجاز");
        }
    });

    // لغو بازی
    bot.onText(/\/cancel/, (msg) => {
        const room = rooms[msg.chat.id];
        if (!room) {
            bot.sendMessage(msg.chat.id, "❌ بازی فعالی وجود ندارد.");
            return;
        }

        if (room.ownerId !== msg.from.id) {
            bot.sendMessage(msg.chat.id, "❌ فقط سازنده بازی می‌تواند آن را لغو کند.");
            return;
        }

        if (room.game) {
            room.game.stop("Cancelled");
        }

        delete rooms[msg.chat.id];
        bot.sendMessage(msg.chat.id, "🛑 بازی حکم لغو شد.");
    });
};