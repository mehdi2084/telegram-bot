const BotPlayer = require("./botPlayer");

class Room {
    /**
     * @param {number} chatId - در حالت گروهی: آیدی گروه. در حالت PV تکی: آیدی خودِ کاربر.
     * @param {number} ownerId
     * @param {"group"|"solo"} mode
     */
    constructor(chatId, ownerId, mode = "group") {
        this.id = chatId;
        this.chatId = chatId;
        this.ownerId = ownerId;
        this.mode = mode;

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

    // پر کردن جای خالی با بات — آیدی بات‌ها به روم متصل است تا بین روم‌های مختلف تداخل نکند
    addBots(count) {
        for (let i = 1; i <= count; i++) {
            this.players.push(new BotPlayer(`bot_${this.id}_${i}`, `🤖 ربات ${i}`));
        }
    }

    // حذف بازیکن
    removePlayer(id) {
        this.players = this.players.filter((p) => p.id !== id);
    }

    getPlayer(id) {
        return this.players.find((p) => p.id === id);
    }

    getPlayers() {
        return this.players;
    }

    getHumanPlayers() {
        return this.players.filter((p) => !p.isBot);
    }

    playerCount() {
        return this.players.length;
    }

    isFull() {
        return this.players.length === 4;
    }

    // تشکیل تیم‌ها — نفرات روبه‌رو (۰و۲ / ۱و۳) هم‌تیمی‌اند
    createTeams() {
        if (this.players.length !== 4) return false;

        this.players[0].team = 1;
        this.players[2].team = 1;

        this.players[1].team = 2;
        this.players[3].team = 2;

        return true;
    }

    // تعیین حاکمِ راند اول
    setHakem(index = 0) {
        this.players.forEach((p) => (p.isHakem = false));
        this.players[index].isHakem = true;

        return this.players[index];
    }

    getHakem() {
        return this.players.find((p) => p.isHakem);
    }

    // شروع رسمی بازی (بعد از تکمیل ۴ نفر)
    startGame() {
        if (!this.isFull()) return false;

        this.started = true;

        this.createTeams();

        return true;
    }

    // پایان کامل بازی/روم
    endGame() {
        this.started = false;
        this.players.forEach((p) => p.reset());
    }

    // متن خلاصه‌ی لابی برای پیام گروه (قبل از شروع بازی)
    getLobbyText() {
        let text = `👥 بازیکنان (${this.playerCount()}/4):\n\n`;

        this.players.forEach((player, index) => {
            text += `${index + 1}. ${player.name}${player.id === this.ownerId ? " 👑" : ""}\n`;
        });

        return text;
    }

    // متن خلاصه‌ی وضعیت تیم‌ها/حاکم (بعد از شروع بازی)
    getInfo() {
        let text = "";

        this.players.forEach((player, index) => {
            text += `${index + 1}. ${player.name}`;

            if (player.isBot) text += " 🤖";
            if (player.isHakem) text += " 👑";
            if (player.team) text += ` | تیم ${player.team}`;

            text += "\n";
        });

        return text;
    }
}

module.exports = Room;
