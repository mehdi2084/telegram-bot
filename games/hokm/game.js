const EventEmitter = require("events");

const Deck = require("./deck");
const Rules = require("./rules");
const AI = require("./ai");

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

        this.teamScores = {
            team1: 0,
            team2: 0,
        };

        this.trickNumber = 1;

        this.started = false;

        this.finished = false;

        this.paused = false;

        this.logs = [];
    }
    //--------------------------------
    // شروع مسابقه
    //--------------------------------

    start() {
        if (this.started) return;

        this.started = true;

        this.chooseHakem();

        this.startRound();
    }

    //--------------------------------
    // شروع یک راند
    //--------------------------------

    startRound() {
        this.tableCards = [];

        this.trickNumber = 1;

        this.players.forEach((player) => {
            player.hand = [];

            player.tricks = 0;
        });

        this.deck.reset();

        // پنج کارت اول

        this.deck.dealCards(this.players, 5);

        // اگر حاکم انسان باشد
        // manager.js باید حکم را از او بگیرد

        if (!this.hakem.isBot) {
            this.emit("chooseHokm", this.hakem);

            return;
        }

        // اگر بات باشد

        this.hokm = AI.chooseHokm(this.hakem.hand);

        this.finishDeal();
    }

    //--------------------------------
    // ادامه پخش کارت
    //--------------------------------

    finishDeal() {
        this.deck.dealCards(this.players, 4);

        this.deck.dealCards(this.players, 4);

        this.players.forEach((player) => {
            player.sortHand();
        });

        this.currentPlayer = this.hakem;

        this.emit("roundStarted", {
            hokm: this.hokm,

            hakem: this.hakem,

            players: this.players,
        });
    }
    //--------------------------------
    // انتخاب حاکم
    //--------------------------------

    chooseHakem() {
        this.players.forEach((player) => {
            player.isHakem = false;
        });

        const index = Math.floor(Math.random() * 4);

        this.hakem = this.players[index];

        this.hakem.isHakem = true;
    }
    //--------------------------------
    // ثبت حکم
    //--------------------------------

    setHokm(hokm) {
        this.hokm = hokm;

        this.emit("hokmSelected", {
            hokm,
            hakem: this.hakem,
        });

        this.finishDeal();
    }
    //--------------------------------
    // نوبت بازیکن
    //--------------------------------

    nextPlayer() {
        const index = this.players.findIndex(
            (p) => p.id === this.currentPlayer.id,
        );

        this.currentPlayer = this.players[(index + 1) % 4];
    }

    //--------------------------------
    // شروع نوبت
    //--------------------------------

    startTurn() {
        if (this.finished) return;

        if (this.currentPlayer.isBot) {
            this.playBot();

            return;
        }

        this.emit("playerTurn", {
            player: this.currentPlayer,
        });
    }

    //--------------------------------
    // بازی کردن کارت
    //--------------------------------

    playCard(playerId, suit, value) {
        if (this.finished) return false;

        if (this.currentPlayer.id !== playerId) return false;

        const player = this.currentPlayer;

        const index = player.hand.findIndex(
            (card) => card.suit === suit && card.value === value,
        );

        if (index === -1) return false;

        const card = player.hand[index];

        const leadSuit =
            this.tableCards.length > 0 ? this.tableCards[0].card.suit : null;

        if (!Rules.canPlayCard(player, card, leadSuit)) {
            return false;
        }

        player.hand.splice(index, 1);

        this.tableCards.push({
            player,
            card,
        });

        this.emit("cardPlayed", {
            player,
            card,
            table: this.tableCards,
        });

        if (this.tableCards.length === 4) {
            this.finishTrick();
        } else {
            this.nextPlayer();
            this.startTurn();
        }

        return true;
    }

    //--------------------------------
    // نوبت بات
    //--------------------------------

    playBot() {
        const player = this.currentPlayer;

        const card = AI.play(player, this.tableCards, this.hokm);

        const index = player.hand.findIndex(
            (c) => c.suit === card.suit && c.value === card.value,
        );

        player.hand.splice(index, 1);

        this.tableCards.push({
            player,
            card,
        });

        this.emit("cardPlayed", {
            player,
            card,
            table: this.tableCards,
        });

        if (this.tableCards.length === 4) {
            this.finishTrick();

            return;
        }

        this.nextPlayer();

        this.startTurn();
    }
    //--------------------------------
    // پایان یک دست
    //--------------------------------

    finishTrick() {
        const winner = Rules.getWinner(this.tableCards, this.hokm);

        this.registerTrickWinner(winner);

        this.emit("trickFinished", {
            winner,
            cards: this.tableCards,
        });

        this.tableCards = [];

        this.trickNumber++;

        if (this.players[0].hand.length === 0) {
            this.finishRound();

            return;
        }

        this.startTurn();
    }

    //--------------------------------
    // پایان راند
    //--------------------------------

    finishRound() {
        const team1 = this.players[0].tricks + this.players[2].tricks;

        const team2 = this.players[1].tricks + this.players[3].tricks;

        if (team1 > team2) this.teamScores.team1++;
        else this.teamScores.team2++;

        this.emit("roundFinished", {
            team1,

            team2,

            score: this.teamScores,
        });

        if (this.teamScores.team1 >= 7 || this.teamScores.team2 >= 7) {
            this.finishMatch();

            return;
        }

        const winner = Rules.getHakemWinner(this.players, team1, team2);

        this.setHakem(winner);

        this.hakem.isHakem = true;

        this.round++;

        this.startRound();
    }

    //--------------------------------
    // پایان مسابقه
    //--------------------------------

    finishMatch() {
        this.finished = true;

        this.emit("matchFinished", {
            winner: this.teamScores.team1 > this.teamScores.team2 ? 1 : 2,

            score: this.teamScores,
        });
    }

    //--------------------------------
    // وضعیت بازی
    //--------------------------------

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
    //--------------------------------
    // ریست بازی
    //--------------------------------

    reset() {
        this.deck.reset();

        this.hokm = null;

        this.tableCards = [];

        this.round = 1;

        this.trickNumber = 1;

        this.started = false;

        this.finished = false;

        this.paused = false;

        this.logs = [];

        this.teamScores = {
            team1: 0,
            team2: 0,
        };

        this.players.forEach((player) => {
            player.hand = [];

            player.tricks = 0;

            player.isHakem = false;
        });
    }

    //--------------------------------
    // بازیکن بر اساس شناسه
    //--------------------------------

    getPlayer(id) {
        return this.players.find((player) => player.id === id);
    }

    //--------------------------------
    // تیم بازیکن
    //--------------------------------

    getTeam(player) {
        const index = this.players.indexOf(player);

        return index % 2 === 0 ? 1 : 2;
    }

    //--------------------------------
    // حریفان
    //--------------------------------

    getOpponents(player) {
        const team = this.getTeam(player);

        return this.players.filter((p) => this.getTeam(p) !== team);
    }

    //--------------------------------
    // هم‌تیمی
    //--------------------------------

    getPartner(player) {
        return this.players.find(
            (p) => p !== player && this.getTeam(p) === this.getTeam(player),
        );
    }

    //--------------------------------
    // کارت‌های باقی‌مانده
    //--------------------------------

    remainingCards() {
        return this.players.reduce(
            (sum, player) => sum + player.hand.length,
            0,
        );
    }

    //--------------------------------
    // آیا راند تمام شده؟
    //--------------------------------

    isRoundFinished() {
        return this.remainingCards() === 0;
    }

    //--------------------------------
    // آیا مسابقه تمام شده؟
    //--------------------------------

    isFinished() {
        return this.finished;
    }

    //--------------------------------
    // آیا شروع شده؟
    //--------------------------------

    isStarted() {
        return this.started;
    }

    //--------------------------------
    // کارت‌های روی زمین
    //--------------------------------

    getTableCards() {
        return [...this.tableCards];
    }

    //--------------------------------
    // کارت‌های بازیکن
    //--------------------------------

    getPlayerCards(id) {
        const player = this.getPlayer(id);

        if (!player) return [];

        return [...player.hand];
    }
    //--------------------------------
    // حذف Listenerها
    //--------------------------------

    destroy() {
        this.removeAllListeners();

        this.players = [];

        this.tableCards = [];

        this.deck = null;

        this.room = null;
    }

    //--------------------------------
    // اطلاعات راند
    //--------------------------------

    getRoundInfo() {
        return {
            round: this.round,

            trick: this.trickNumber,

            hokm: this.hokm,

            hakem: this.hakem,

            currentPlayer: this.currentPlayer,
        };
    }

    //--------------------------------
    // امتیاز تیم‌ها
    //--------------------------------

    getScores() {
        return {
            team1: this.teamScores.team1,

            team2: this.teamScores.team2,
        };
    }

    //--------------------------------
    // دست‌های گرفته شده
    //--------------------------------

    getTricks() {
        return {
            team1: this.players[0].tricks + this.players[2].tricks,

            team2: this.players[1].tricks + this.players[3].tricks,
        };
    }

    //--------------------------------
    // آیا نوبت این بازیکن است؟
    //--------------------------------

    isPlayerTurn(playerId) {
        return this.currentPlayer && this.currentPlayer.id === playerId;
    }

    //--------------------------------
    // کارت قابل بازی
    //--------------------------------

    canPlay(playerId, suit, value) {
        const player = this.getPlayer(playerId);

        if (!player) return false;

        const card = player.hand.find(
            (c) => c.suit === suit && c.value === value,
        );

        if (!card) return false;

        const leadSuit = this.tableCards.length
            ? this.tableCards[0].card.suit
            : null;

        return Rules.canPlayCard(player, card, leadSuit);
    }

    //--------------------------------
    // بازیکن بعدی
    //--------------------------------

    getNextPlayer() {
        const index = this.players.findIndex(
            (p) => p.id === this.currentPlayer.id,
        );

        return this.players[(index + 1) % 4];
    }

    //--------------------------------
    // شماره تیم
    //--------------------------------

    getPlayerTeam(playerId) {
        const player = this.getPlayer(playerId);

        if (!player) return null;

        return this.getTeam(player);
    }

    //--------------------------------
    // شروع اولین نوبت
    //--------------------------------

    begin() {
        this.start();

        if (this.started && this.currentPlayer) {
            this.startTurn();
        }
    }
    //--------------------------------
    // Event Registration
    //--------------------------------

    onChooseHokm(listener) {
        this.on("chooseHokm", listener);
    }

    onRoundStarted(listener) {
        this.on("roundStarted", listener);
    }

    onPlayerTurn(listener) {
        this.on("playerTurn", listener);
    }

    onCardPlayed(listener) {
        this.on("cardPlayed", listener);
    }

    onTrickFinished(listener) {
        this.on("trickFinished", listener);
    }

    onRoundFinished(listener) {
        this.on("roundFinished", listener);
    }

    onMatchFinished(listener) {
        this.on("matchFinished", listener);
    }

    //--------------------------------
    // ارسال وضعیت بازی
    //--------------------------------

    broadcastState() {
        this.emit("stateChanged", this.getState());
    }

    //--------------------------------
    // ثبت حرکت
    //--------------------------------

    logMove(player, card) {
        this.emit("moveLog", {
            round: this.round,

            trick: this.trickNumber,

            player,

            card,
        });
    }

    //--------------------------------
    // ثبت خطا
    //--------------------------------

    error(message) {
        this.emit("error", message);
    }

    //--------------------------------
    // اعتبارسنجی بازیکن
    //--------------------------------

    validatePlayer(playerId) {
        return this.players.some((player) => player.id === playerId);
    }

    //--------------------------------
    // اعتبارسنجی کارت
    //--------------------------------

    validateCard(player, suit, value) {
        return player.hand.some(
            (card) => card.suit === suit && card.value === value,
        );
    }

    //--------------------------------
    // پیدا کردن کارت
    //--------------------------------

    findCard(player, suit, value) {
        return player.hand.find(
            (card) => card.suit === suit && card.value === value,
        );
    }

    //--------------------------------
    // حذف کارت
    //--------------------------------

    removeCard(player, suit, value) {
        const index = player.hand.findIndex(
            (card) => card.suit === suit && card.value === value,
        );

        if (index === -1) return null;

        return player.hand.splice(index, 1)[0];
    }

    //--------------------------------
    // افزودن کارت روی زمین
    //--------------------------------

    addToTable(player, card) {
        this.tableCards.push({
            player,

            card,
        });
    }

    //--------------------------------
    // پاک کردن زمین
    //--------------------------------

    clearTable() {
        this.tableCards = [];
    }

    //--------------------------------
    // تعداد کارت روی زمین
    //--------------------------------

    tableCount() {
        return this.tableCards.length;
    }

    //--------------------------------
    // اولین کارت
    //--------------------------------

    leadCard() {
        if (this.tableCards.length === 0) return null;

        return this.tableCards[0].card;
    }

    //--------------------------------
    // خال شروع
    //--------------------------------

    leadSuit() {
        const card = this.leadCard();

        if (!card) return null;

        return card.suit;
    }
    //--------------------------------
    // بررسی وضعیت بازی
    //--------------------------------

    isReady() {
        return this.players.length === 4 && !this.started && !this.finished;
    }

    //--------------------------------
    // بازیکنان تیم ۱
    //--------------------------------

    getTeam1Players() {
        return [this.players[0], this.players[2]];
    }

    //--------------------------------
    // بازیکنان تیم ۲
    //--------------------------------

    getTeam2Players() {
        return [this.players[1], this.players[3]];
    }

    //--------------------------------
    // تعداد کارت‌های بازیکن
    //--------------------------------

    getHandCount(playerId) {
        const player = this.getPlayer(playerId);

        if (!player) return 0;

        return player.hand.length;
    }

    //--------------------------------
    // کارت آخر بازی شده
    //--------------------------------

    getLastPlayedCard() {
        if (this.tableCards.length === 0) return null;

        return this.tableCards[this.tableCards.length - 1];
    }

    //--------------------------------
    // آیا همه کارت بازی کرده‌اند؟
    //--------------------------------

    isTrickComplete() {
        return this.tableCards.length === 4;
    }

    //--------------------------------
    // ریست دست‌ها
    //--------------------------------

    resetHands() {
        this.players.forEach((player) => {
            player.hand = [];

            player.tricks = 0;
        });
    }

    //--------------------------------
    // حذف حکم
    //--------------------------------

    clearHokm() {
        this.hokm = null;
    }

    //--------------------------------
    // تغییر حاکم
    //--------------------------------

    setHakem(player) {
        this.players.forEach((p) => {
            p.isHakem = false;
        });

        player.isHakem = true;

        this.hakem = player;
    }

    //--------------------------------
    // کارت‌های بازی شده
    //--------------------------------

    playedCardsCount() {
        return 52 - this.remainingCards();
    }

    //--------------------------------
    // کارت‌های باقی‌مانده در دسته
    //--------------------------------

    remainingDeckCards() {
        return this.deck.remaining();
    }

    //--------------------------------
    // آیا حکم انتخاب شده؟
    //--------------------------------

    hasHokm() {
        return this.hokm !== null;
    }

    //--------------------------------
    // شروع دست بعد
    //--------------------------------

    startNextTrick() {
        this.clearTable();

        this.startTurn();
    }

    //--------------------------------
    // امتیاز تیم
    //--------------------------------

    addScore(team, amount = 1) {
        if (team === 1) this.teamScores.team1 += amount;
        else this.teamScores.team2 += amount;
    }

    //--------------------------------
    // بازیکن حاکم
    //--------------------------------

    getHakem() {
        return this.hakem;
    }

    //--------------------------------
    // بازیکن فعلی
    //--------------------------------

    getCurrentPlayer() {
        return this.currentPlayer;
    }
    //--------------------------------
    // ترتیب بازی
    //--------------------------------

    getPlayOrder() {
        const order = [];

        let player = this.currentPlayer;

        for (let i = 0; i < 4; i++) {
            order.push(player);

            const index = this.players.findIndex((p) => p.id === player.id);

            player = this.players[(index + 1) % 4];
        }

        return order;
    }

    //--------------------------------
    // آیا بازیکن بات است؟
    //--------------------------------

    isBot(playerId) {
        const player = this.getPlayer(playerId);

        if (!player) return false;

        return player.isBot;
    }

    //--------------------------------
    // بازیکنان واقعی
    //--------------------------------

    getHumanPlayers() {
        return this.players.filter((player) => !player.isBot);
    }

    //--------------------------------
    // بازیکنان بات
    //--------------------------------

    getBotPlayers() {
        return this.players.filter((player) => player.isBot);
    }

    //--------------------------------
    // تعداد بات‌ها
    //--------------------------------

    botCount() {
        return this.getBotPlayers().length;
    }

    //--------------------------------
    // تعداد بازیکنان واقعی
    //--------------------------------

    humanCount() {
        return this.getHumanPlayers().length;
    }

    //--------------------------------
    // پایان نوبت
    //--------------------------------

    endTurn() {
        if (this.isTrickComplete()) {
            this.finishTrick();

            return;
        }

        this.nextPlayer();

        this.startTurn();
    }

    //--------------------------------
    // بازی کارت
    //--------------------------------

    play(playerId, suit, value) {
        return this.playCard(playerId, suit, value);
    }

    //--------------------------------
    // بازی بات
    //--------------------------------

    playBotTurn() {
        this.playBot();
    }

    //--------------------------------
    // شروع خودکار بازی
    //--------------------------------

    autoStart() {
        if (!this.isReady()) return false;

        this.begin();

        return true;
    }

    //--------------------------------
    // خلاصه بازی
    //--------------------------------

    summary() {
        return {
            round: this.round,

            trick: this.trickNumber,

            hokm: this.hokm,

            hakem: this.hakem?.name,

            currentPlayer: this.currentPlayer?.name,

            team1: this.teamScores.team1,

            team2: this.teamScores.team2,

            remainingCards: this.remainingCards(),
        };
    }

    //--------------------------------
    // اطلاعات Debug
    //--------------------------------

    debug() {
        return {
            started: this.started,

            finished: this.finished,

            players: this.players,

            tableCards: this.tableCards,

            deck: this.deck.remaining(),

            hokm: this.hokm,

            hakem: this.hakem,

            currentPlayer: this.currentPlayer,
        };
    }
    //--------------------------------
    // ارسال وضعیت برای بازیکنان
    //--------------------------------

    updatePlayers() {
        this.emit("update", {
            state: this.getState(),

            players: this.players,
        });
    }

    //--------------------------------
    // پیام سیستم
    //--------------------------------

    systemMessage(text) {
        this.emit("systemMessage", text);
    }

    //--------------------------------
    // ثبت برنده دست
    //--------------------------------

    registerTrickWinner(player) {
        player.tricks++;

        this.currentPlayer = player;
    }

    //--------------------------------
    // کارت‌های مجاز بازیکن
    //--------------------------------

    getPlayableCards(playerId) {
        const player = this.getPlayer(playerId);

        if (!player) return [];

        if (this.tableCards.length === 0) return [...player.hand];

        const leadSuit = this.tableCards[0].card.suit;

        const sameSuit = player.hand.filter((card) => card.suit === leadSuit);

        if (sameSuit.length > 0) return sameSuit;

        return [...player.hand];
    }

    //--------------------------------
    // آیا کارت مجاز است؟
    //--------------------------------

    isCardPlayable(playerId, suit, value) {
        return this.getPlayableCards(playerId).some(
            (card) => card.suit === suit && card.value === value,
        );
    }

    //--------------------------------
    // تعداد دست‌های تیم
    //--------------------------------

    getTeamTricks(team) {
        if (team === 1) {
            return this.players[0].tricks + this.players[2].tricks;
        }

        return this.players[1].tricks + this.players[3].tricks;
    }

    //--------------------------------
    // تیم برنده راند
    //--------------------------------

    getRoundWinner() {
        const t1 = this.getTeamTricks(1);

        const t2 = this.getTeamTricks(2);

        if (t1 === t2) return null;

        return t1 > t2 ? 1 : 2;
    }
    //--------------------------------
    // بازیکن برنده مسابقه
    //--------------------------------

    getWinnerTeam() {
        if (this.teamScores.team1 >= 7) return 1;

        if (this.teamScores.team2 >= 7) return 2;

        return null;
    }

    //--------------------------------
    // آیا مسابقه تمام شده؟
    //--------------------------------

    matchEnded() {
        return this.getWinnerTeam() !== null;
    }

    //--------------------------------
    // وضعیت فعلی
    //--------------------------------

    status() {
        return {
            started: this.started,

            finished: this.finished,

            round: this.round,

            trick: this.trickNumber,

            hokm: this.hokm,

            hakem: this.hakem,

            currentPlayer: this.currentPlayer,

            teamScores: this.teamScores,

            tableCards: this.tableCards,

            remainingCards: this.remainingCards(),
        };
    }

    //--------------------------------
    // گرفتن اطلاعات یک بازیکن
    //--------------------------------

    playerState(playerId) {
        const player = this.getPlayer(playerId);

        if (!player) return null;

        return {
            id: player.id,

            name: player.name,

            hand: [...player.hand],

            tricks: player.tricks,

            isHakem: player.isHakem,

            isBot: player.isBot,
        };
    }

    //--------------------------------
    // همه اطلاعات بازیکنان
    //--------------------------------

    allPlayersState() {
        return this.players.map((player) => ({
            id: player.id,

            name: player.name,

            tricks: player.tricks,

            handCount: player.hand.length,

            isHakem: player.isHakem,

            isBot: player.isBot,
        }));
    }

    //--------------------------------
    // ارسال وضعیت جدید
    //--------------------------------

    refresh() {
        this.emit("refresh", {
            game: this.status(),

            players: this.allPlayersState(),
        });
    }

    //--------------------------------
    // اعلام پایان نوبت
    //--------------------------------

    turnFinished() {
        this.emit("turnFinished", {
            currentPlayer: this.currentPlayer,

            tableCards: this.tableCards,
        });
    }

    //--------------------------------
    // شروع نوبت بعدی
    //--------------------------------

    continueGame() {
        if (this.finished) return;

        if (this.isTrickComplete()) {
            this.finishTrick();

            return;
        }

        this.nextPlayer();

        this.startTurn();
    }

    //--------------------------------
    // خروج بازیکن
    //--------------------------------

    removePlayer(playerId) {
        const player = this.getPlayer(playerId);

        if (!player) return false;

        player.left = true;

        this.finished = true;

        this.emit("playerLeft", player);

        return true;
    }

    //--------------------------------
    // پایان اجباری مسابقه
    //--------------------------------

    stop(reason = "Game Stopped") {
        this.finished = true;

        this.emit("stopped", reason);
    }
    //--------------------------------
    // توقف بازی
    //--------------------------------

    pause() {
        if (!this.started) return false;

        this.paused = true;

        this.emit("paused");

        return true;
    }

    //--------------------------------
    // ادامه بازی
    //--------------------------------

    resume() {
        if (!this.paused) return false;

        this.paused = false;

        this.emit("resumed");

        this.startTurn();

        return true;
    }

    //--------------------------------
    // آیا بازی متوقف است؟
    //--------------------------------

    isPaused() {
        return this.paused === true;
    }

    //--------------------------------
    // تعیین بازیکن فعلی
    //--------------------------------

    setCurrentPlayer(player) {
        this.currentPlayer = player;

        this.emit("currentPlayerChanged", player);
    }

    //--------------------------------
    // گرفتن حکم
    //--------------------------------

    getHokm() {
        return this.hokm;
    }

    //--------------------------------
    // گرفتن بازیکن شروع کننده
    //--------------------------------

    getStarter() {
        return this.currentPlayer;
    }

    //--------------------------------
    // تعداد راندها
    //--------------------------------

    getRound() {
        return this.round;
    }

    //--------------------------------
    // شماره دست
    //--------------------------------

    getTrickNumber() {
        return this.trickNumber;
    }

    //--------------------------------
    // ریست دست‌ها
    //--------------------------------

    resetTricks() {
        this.players.forEach((player) => {
            player.tricks = 0;
        });
    }

    //--------------------------------
    // بررسی پایان راند
    //--------------------------------

    checkRoundEnd() {
        return this.players.every((player) => player.hand.length === 0);
    }

    //--------------------------------
    // بررسی پایان مسابقه
    //--------------------------------

    checkMatchEnd() {
        return this.teamScores.team1 >= 7 || this.teamScores.team2 >= 7;
    }

    //--------------------------------
    // اطلاعات خلاصه
    //--------------------------------

    toJSON() {
        return {
            roomId: this.room.id,

            started: this.started,

            finished: this.finished,

            paused: this.paused,

            round: this.round,

            trick: this.trickNumber,

            hokm: this.hokm,

            teamScores: this.teamScores,

            currentPlayer: this.currentPlayer?.id,

            hakem: this.hakem?.id,
        };
    }
    //--------------------------------
    // ثبت لاگ
    //--------------------------------

    addLog(type, data = {}) {
        this.logs.push({
            time: Date.now(),

            round: this.round,

            trick: this.trickNumber,

            type,

            data,
        });

        this.emit("log", this.logs[this.logs.length - 1]);
    }

    //--------------------------------
    // دریافت لاگ‌ها
    //--------------------------------

    getLogs() {
        return [...this.logs];
    }

    //--------------------------------
    // پاک کردن لاگ‌ها
    //--------------------------------

    clearLogs() {
        this.logs = [];
    }

    //--------------------------------
    // آخرین لاگ
    //--------------------------------

    lastLog() {
        if (this.logs.length === 0) return null;

        return this.logs[this.logs.length - 1];
    }

    //--------------------------------
    // تعداد لاگ‌ها
    //--------------------------------

    logCount() {
        return this.logs.length;
    }

    //--------------------------------
    // ذخیره شروع راند
    //--------------------------------

    logRoundStart() {
        this.addLog("ROUND_START", {
            round: this.round,

            hakem: this.hakem.id,

            hokm: this.hokm,
        });
    }

    //--------------------------------
    // ذخیره بازی کارت
    //--------------------------------

    logCard(player, card) {
        this.addLog("CARD_PLAYED", {
            player: player.id,

            suit: card.suit,

            value: card.value,
        });
    }

    //--------------------------------
    // ذخیره پایان دست
    //--------------------------------

    logTrick(winner) {
        this.addLog("TRICK_END", {
            winner: winner.id,

            tricks: winner.tricks,
        });
    }

    //--------------------------------
    // ذخیره پایان راند
    //--------------------------------

    logRoundEnd(team) {
        this.addLog("ROUND_END", {
            winner: team,

            score: this.teamScores,
        });
    }

    //--------------------------------
    // ذخیره پایان مسابقه
    //--------------------------------

    logMatchEnd(team) {
        this.addLog("MATCH_END", {
            winner: team,

            score: this.teamScores,
        });
    }
    //--------------------------------
    // آمار بازی
    //--------------------------------

    getStatistics() {
        return {
            rounds: this.round,

            tricksPlayed: this.trickNumber - 1,

            playedCards: 52 - this.remainingCards(),

            remainingCards: this.remainingCards(),

            deckCards: this.deck.remaining(),

            score: {
                team1: this.teamScores.team1,
                team2: this.teamScores.team2,
            },
        };
    }

    //--------------------------------
    // بازیکنان به ترتیب
    //--------------------------------

    getPlayers() {
        return [...this.players];
    }

    //--------------------------------
    // بازیکن بر اساس شماره
    //--------------------------------

    getPlayerByIndex(index) {
        if (index < 0 || index >= 4) return null;

        return this.players[index];
    }

    //--------------------------------
    // بازیکنان یک تیم
    //--------------------------------

    getPlayersByTeam(team) {
        return this.players.filter((player) => this.getTeam(player) === team);
    }

    //--------------------------------
    // آیا همه بازیکنان آماده‌اند؟
    //--------------------------------

    allPlayersReady() {
        return this.players.every((player) => player.ready === true);
    }

    //--------------------------------
    // آماده بودن بازیکن
    //--------------------------------

    setPlayerReady(playerId) {
        const player = this.getPlayer(playerId);

        if (!player) return false;

        player.ready = true;

        this.emit("playerReady", player);

        return true;
    }

    //--------------------------------
    // ریست وضعیت آماده بودن
    //--------------------------------

    resetReady() {
        this.players.forEach((player) => {
            player.ready = false;
        });
    }

    //--------------------------------
    // بررسی وجود بازیکن
    //--------------------------------

    hasPlayer(playerId) {
        return this.players.some((player) => player.id === playerId);
    }

    //--------------------------------
    // تعداد بازیکنان
    //--------------------------------

    playerCount() {
        return this.players.length;
    }

    //--------------------------------
    // آیا اتاق کامل است؟
    //--------------------------------

    isFull() {
        return this.players.length === 4;
    }

    //--------------------------------
    // آیا اتاق خالی است؟
    //--------------------------------

    isEmpty() {
        return this.players.length === 0;
    }
}

module.exports = Game;
