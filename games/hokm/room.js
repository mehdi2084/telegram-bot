const BotPlayer = require("./botPlayer");

class Room {
    constructor(chatId, ownerId) {
        this.id = chatId;
        this.chatId = chatId;
        this.ownerId = ownerId;

        this.players = [];

        this.started = false;

        this.game = null;
    }

    // اضافه کردن بازیکن واقعی
    addPlayer(player) {
        if (this.started) return false;

        if (this.players.length >= 4) return false;

        if (this.players.find((p) => p.id === player.id)) return false;

        this.players.push(player);

        return true;
    }

    // اضافه کردن بات
    addBots(count) {
        for (let i = 1; i <= count; i++) {
            this.players.push(new BotPlayer("bot_" + i, `🤖 Bot ${i}`));
        }
    }

    // حذف بازیکن
    removePlayer(id) {
        this.players = this.players.filter((p) => p.id !== id);
    }

    // پیدا کردن بازیکن
    getPlayer(id) {
        return this.players.find((p) => p.id === id);
    }

    // همه بازیکنان
    getPlayers() {
        return this.players;
    }

    // تعداد بازیکنان
    playerCount() {
        return this.players.length;
    }

    // آیا اتاق کامل است؟
    isFull() {
        return this.players.length === 4;
    }

    // تشکیل تیم‌ها
    createTeams() {
        if (this.players.length !== 4) return false;

        this.players[0].team = 1;
        this.players[2].team = 1;

        this.players[1].team = 2;
        this.players[3].team = 2;

        return true;
    }

    // تعیین حاکم
    setHakem(index = 0) {
        this.players.forEach((p) => (p.isHakem = false));

        this.players[index].isHakem = true;

        return this.players[index];
    }

    // حاکم فعلی
    getHakem() {
        return this.players.find((p) => p.isHakem);
    }

    // شروع بازی
    startGame() {
        if (!this.isFull()) return false;

        this.started = true;

        this.createTeams();

        this.setHakem();

        return true;
    }

    // پایان بازی
    endGame() {
        this.started = false;

        this.players.forEach((p) => {
            p.reset();
        });
    }

    // خلاصه اتاق
    getInfo() {
        let text = "";

        this.players.forEach((player, index) => {
            text += `${index + 1}. ${player.name}`;

            if (player.isBot) text += " 🤖";

            if (player.isHakem) text += " 👑";

            if (player.team) text += ` | Team ${player.team}`;

            text += "\n";
        });

        return text;
    }
}

module.exports = Room;
