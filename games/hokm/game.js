const EventEmitter = require("events");

const Deck = require("./deck");
const Rules = require("./rules");
const AI = require("./ai");

const WINNING_ROUNDS = 7; // تعداد راند لازم برای بردنِ کل مسابقه

class Game extends EventEmitter {
    constructor(room) {
        super();

        this.room = room;
        this.players = room.players;

        this.deck = new Deck();

        this.hokm = null;
        this.hakem = null;
        this.currentPlayer = null;

        this.tableCards = [];

        this.round = 1;
        this.trickNumber = 1;

        this.teamScores = { team1: 0, team2: 0 };

        this.started = false;
        this.finished = false;
    }

    // خالِ کارتِ اولِ روی میز (اگر میز خالی باشد null است)
    get leadSuit() {
        return this.tableCards.length > 0 ? this.tableCards[0].card.suit : null;
    }

    //--------------------------------
    // شروع کل مسابقه
    //--------------------------------
    start() {
        if (this.started) return;

        this.started = true;

        // حاکمِ راندِ اول به‌صورت تصادفی انتخاب می‌شود
        const index = Math.floor(Math.random() * this.players.length);
        this.players.forEach((p) => (p.isHakem = false));
        this.hakem = this.players[index];
        this.hakem.isHakem = true;

        this.startRound();
    }

    //--------------------------------
    // شروع یک راندِ جدید (تا رسیدن به ۷ راند برد ادامه دارد)
    //--------------------------------
    startRound() {
        this.tableCards = [];
        this.trickNumber = 1;

        this.players.forEach((player) => {
            player.hand = [];
            player.tricks = 0;
        });

        this.deck.reset();

        // ۵ کارت اول برای انتخاب حکم
        this.deck.dealCards(this.players, 5);

        this.emit("newRound", { round: this.round, hakem: this.hakem });

        if (!this.hakem.isBot) {
            // منتظر انتخاب حکم توسط بازیکنِ واقعی می‌مانیم
            this.emit("chooseHokm", { hakem: this.hakem, hand: this.hakem.hand });
            return;
        }

        this.hokm = AI.chooseHokm(this.hakem.hand);
        this.emit("hokmSelected", { hokm: this.hokm, hakem: this.hakem });
        this.finishDeal();
    }

    //--------------------------------
    // ثبت حکمِ انتخاب‌شده توسط بازیکنِ واقعی
    //--------------------------------
    setHokm(suit) {
        if (this.finished) return false;

        this.hokm = suit;

        this.emit("hokmSelected", { hokm: suit, hakem: this.hakem });

        this.finishDeal();

        return true;
    }

    //--------------------------------
    // پخشِ ۸ کارت باقی‌مانده و شروع اولین نوبت
    //--------------------------------
    finishDeal() {
        this.deck.dealCards(this.players, 4);
        this.deck.dealCards(this.players, 4);

        this.players.forEach((player) => player.sortHand());

        this.currentPlayer = this.hakem;

        this.emit("roundStarted", {
            round: this.round,
            hokm: this.hokm,
            hakem: this.hakem,
            players: this.players,
        });

        this.startTurn();
    }

    //--------------------------------
    // اطلاع‌رسانیِ نوبتِ فعلی (برای بات خودکار بازی می‌کند، برای انسان ایونت می‌زند)
    //--------------------------------
    startTurn() {
        if (this.finished) return;

        if (this.currentPlayer.isBot) {
            this._playBotTurn();
            return;
        }

        this.emit("playerTurn", {
            player: this.currentPlayer,
            leadSuit: this.leadSuit,
            playable: this.currentPlayer.getPlayableCards(this.leadSuit),
            table: this.tableCards,
        });
    }

    //--------------------------------
    // بازی‌کردنِ کارت توسط بازیکنِ واقعی (فراخوانی از روی کیبورد شیشه‌ای)
    // خروجی: { ok: boolean, reason?: string }
    //--------------------------------
    playCard(playerId, value, suit) {
        if (this.finished) return { ok: false, reason: "finished" };

        if (!this.currentPlayer || this.currentPlayer.id !== playerId) {
            return { ok: false, reason: "not_your_turn" };
        }

        const player = this.currentPlayer;

        const card = player.hand.find(
            (c) => c.value === value && c.suit === suit,
        );

        if (!card) return { ok: false, reason: "card_not_found" };

        if (!Rules.canPlayCard(player.hand, card, this.leadSuit)) {
            return { ok: false, reason: "must_follow_suit" };
        }

        this._applyPlay(player, card);

        return { ok: true, card };
    }

    //--------------------------------
    // نوبتِ خودکارِ بات
    //--------------------------------
    _playBotTurn() {
        const player = this.currentPlayer;
        const card = AI.chooseCard(player.hand, this.tableCards, this.hokm);

        this._applyPlay(player, card);
    }

    //--------------------------------
    // اعمالِ مشترکِ بازی‌کردنِ یک کارت (چه انسان چه بات)
    //--------------------------------
    _applyPlay(player, card) {
        const index = player.hand.findIndex(
            (c) => c.suit === card.suit && c.value === card.value,
        );

        if (index !== -1) player.hand.splice(index, 1);

        this.tableCards.push({ player, card });

        this.emit("cardPlayed", {
            player,
            card,
            table: this.tableCards,
            trickNumber: this.trickNumber,
        });

        if (this.tableCards.length === this.players.length) {
            this.finishTrick();
            return;
        }

        this._nextPlayer();
        this.startTurn();
    }

    _nextPlayer() {
        const index = this.players.findIndex((p) => p.id === this.currentPlayer.id);
        this.currentPlayer = this.players[(index + 1) % this.players.length];
    }

    //--------------------------------
    // پایانِ یک دست (وقتی هر ۴ نفر کارت گذاشتند)
    //--------------------------------
    finishTrick() {
        const winner = Rules.getWinner(this.tableCards, this.hokm);
        winner.tricks++;

        this.emit("trickFinished", {
            winner,
            cards: this.tableCards,
            trickNumber: this.trickNumber,
        });

        this.tableCards = [];
        this.trickNumber++;

        if (Rules.isRoundFinished(this.players)) {
            this.finishRound();
            return;
        }

        // برنده‌ی دست، نفرِ شروع‌کننده‌ی دستِ بعدی است
        this.currentPlayer = winner;
        this.startTurn();
    }

    //--------------------------------
    // پایانِ یک راند (۱۳ دست کامل شد)
    //--------------------------------
    finishRound() {
        const { team1, team2 } = Rules.calculateScore(this.players);

        if (team1 > team2) this.teamScores.team1++;
        else this.teamScores.team2++;

        this.emit("roundFinished", {
            round: this.round,
            tricks: { team1, team2 },
            score: { ...this.teamScores },
        });

        if (this.teamScores.team1 >= WINNING_ROUNDS || this.teamScores.team2 >= WINNING_ROUNDS) {
            this.finishMatch();
            return;
        }

        const nextHakem = Rules.getNextHakem(this.players, this.hakem.id);

        this.players.forEach((p) => (p.isHakem = false));
        this.hakem = nextHakem;
        this.hakem.isHakem = true;

        this.round++;
        this.hokm = null;

        this.startRound();
    }

    //--------------------------------
    // پایانِ کاملِ مسابقه (یک تیم به ۷ راند رسید)
    //--------------------------------
    finishMatch() {
        this.finished = true;

        this.emit("matchFinished", {
            winner: this.teamScores.team1 > this.teamScores.team2 ? 1 : 2,
            score: { ...this.teamScores },
        });
    }

    // توقفِ اجباریِ بازی (مثلاً با /cancel)
    stop() {
        this.finished = true;
        this.removeAllListeners();
    }

    // وضعیتِ فعلیِ بازی (برای دیباگ/نمایش)
    getState() {
        return {
            round: this.round,
            hokm: this.hokm,
            hakem: this.hakem,
            currentPlayer: this.currentPlayer,
            tableCards: this.tableCards,
            scores: this.teamScores,
            trick: this.trickNumber,
            players: this.players,
        };
    }
}

module.exports = Game;
