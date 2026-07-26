const Room = require("./room");
const Player = require("./player");
const Game = require("./game");

class HokmManager {
    constructor() {
        // کلید = chatId (برای بازیِ گروهی: آیدی گروه / برای بازیِ تکی: آیدی کاربر در PV)
        this.rooms = new Map();
    }

    // -------------------------
    // ساخت روم گروهی (لابی — منتظر /join بقیه)
    // -------------------------
    createRoom(chatId, user) {
        if (this.rooms.has(chatId)) return null;

        const room = new Room(chatId, user.id, "group");
        room.addPlayer(new Player(user.id, user.first_name));

        this.rooms.set(chatId, room);

        return room;
    }

    // -------------------------
    // ساخت و شروعِ فوریِ بازیِ تکی درون PV (کاربر + ۳ بات)
    // -------------------------
    createSoloRoom(chatId, user) {
        if (this.rooms.has(chatId)) return null;

        const room = new Room(chatId, user.id, "solo");
        room.addPlayer(new Player(user.id, user.first_name));
        room.addBots(3);

        room.startGame();

        const game = new Game(room);
        room.game = game;

        this.rooms.set(chatId, room);

        return { room, game };
    }

    // -------------------------
    // ورود بازیکنِ جدید به لابیِ گروهی
    // خروجی: room | null (رومی نیست) | false (پر است/شروع شده/تکراری)
    // -------------------------
    joinRoom(chatId, user) {
        const room = this.rooms.get(chatId);

        if (!room) return null;
        if (room.started) return false;

        const player = new Player(user.id, user.first_name);

        if (!room.addPlayer(player)) return false;

        return room;
    }

    getRoom(chatId) {
        return this.rooms.get(chatId) || null;
    }

    getGame(chatId) {
        const room = this.getRoom(chatId);
        return room ? room.game : null;
    }

    // -------------------------
    // شروعِ بازیِ گروهی (جاهای خالی را بات پر می‌کند)
    // خروجی: game | null (رومی نیست) | false (کمتر از ۲ نفرند)
    // -------------------------
    startGame(chatId) {
        const room = this.getRoom(chatId);

        if (!room) return null;
        if (room.game) return room.game;

        // حداقل باید سازنده‌ی روم حضور داشته باشد
        if (room.playerCount() < 1) return false;

        const needBots = 4 - room.playerCount();
        if (needBots > 0) room.addBots(needBots);

        room.startGame();

        const game = new Game(room);
        room.game = game;

        return game;
    }

    chooseHokm(chatId, suit) {
        const game = this.getGame(chatId);
        if (!game) return false;

        return game.setHokm(suit);
    }

    // بازی‌کردنِ یک کارت — امضا با ترتیبِ (value, suit) هم‌راستا با دکمه‌های کیبورد
    playCard(chatId, playerId, value, suit) {
        const game = this.getGame(chatId);
        if (!game) return { ok: false, reason: "no_game" };

        return game.playCard(playerId, value, suit);
    }

    cancel(chatId) {
        const room = this.getRoom(chatId);
        if (!room) return false;

        if (room.game) room.game.stop();

        this.rooms.delete(chatId);

        return true;
    }

    leave(chatId, playerId) {
        const room = this.getRoom(chatId);
        if (!room) return false;

        room.removePlayer(playerId);

        if (room.playerCount() === 0) this.rooms.delete(chatId);

        return true;
    }

    count() {
        return this.rooms.size;
    }

    allRooms() {
        return [...this.rooms.values()];
    }
}

module.exports = new HokmManager();
