const Room = require("./room");
const Player = require("./player");
const Game = require("./game");

class HokmManager {
    constructor() {
        this.rooms = new Map();
    }

    // -------------------------
    // ساخت روم
    // -------------------------

    createRoom(chatId, user) {
        if (this.rooms.has(chatId)) return null;

        const room = new Room(chatId, user.id);

        room.addPlayer(new Player(user.id, user.first_name));

        this.rooms.set(chatId, room);

        return room;
    }

    // -------------------------
    // ورود بازیکن
    // -------------------------

    joinRoom(chatId, user) {
        const room = this.rooms.get(chatId);

        if (!room) return null;

        const player = new Player(user.id, user.first_name);

        if (!room.addPlayer(player)) return false;

        return room;
    }

    // -------------------------
    // گرفتن روم
    // -------------------------

    getRoom(chatId) {
        return this.rooms.get(chatId) || null;
    }

    // -------------------------
    // گرفتن Game
    // -------------------------

    getGame(chatId) {
        const room = this.getRoom(chatId);

        if (!room) return null;

        return room.game;
    }

    // -------------------------
    // شروع بازی
    // -------------------------

    startGame(chatId) {
        const room = this.getRoom(chatId);

        if (!room) return null;

        if (room.game) return room.game;

        // اضافه کردن بات‌ها تا تکمیل شدن ۴ بازیکن
        const needBots = 4 - room.playerCount();

        if (needBots > 0) {
            room.addBots(needBots);
        }

        room.startGame();

        room.game = new Game(room);

        return room.game;
    }

    // -------------------------
    // انتخاب حکم
    // -------------------------

    chooseHokm(chatId, hokm) {
        const game = this.getGame(chatId);

        if (!game) return false;

        game.setHokm(hokm);

        return true;
    }

    // -------------------------
    // بازی کارت
    // -------------------------

    play(chatId, playerId, suit, value) {
        const game = this.getGame(chatId);

        if (!game) return false;

        return game.play(playerId, suit, value);
    }

    // -------------------------
    // لغو بازی
    // -------------------------

    cancel(chatId) {
        const room = this.getRoom(chatId);

        if (!room) return false;

        if (room.game) room.game.stop();

        this.rooms.delete(chatId);

        return true;
    }

    // -------------------------
    // خروج بازیکن
    // -------------------------

    leave(chatId, playerId) {
        const room = this.getRoom(chatId);

        if (!room) return false;

        room.removePlayer(playerId);

        if (room.playerCount() === 0) this.rooms.delete(chatId);

        return true;
    }

    // -------------------------
    // تعداد روم‌ها
    // -------------------------

    count() {
        return this.rooms.size;
    }

    // -------------------------
    // لیست روم‌ها
    // -------------------------

    allRooms() {
        return [...this.rooms.values()];
    }
}

module.exports = new HokmManager();
