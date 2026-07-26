class Deck {
    constructor() {
        this.cards = [];
        this.reset();
    }

    // ساخت دسته کارت (۵۲ کارت، بدون جوکر)
    create() {
        this.cards = [];

        const suits = ["♠", "♥", "♦", "♣"];

        const values = [
            "2", "3", "4", "5", "6", "7", "8",
            "9", "10", "J", "Q", "K", "A",
        ];

        for (const suit of suits) {
            for (const value of values) {
                this.cards.push({ suit, value });
            }
        }
    }

    // بر زدن کارت‌ها
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    // ریست کامل دسته کارت (برای شروع هر راند)
    reset() {
        this.create();
        this.shuffle();
    }

    // گرفتن یک کارت از بالای دسته
    draw() {
        if (this.cards.length === 0) return null;
        return this.cards.pop();
    }

    // پخش تعداد مشخصی کارت بین بازیکنان (به‌نوبت)
    dealCards(players, count) {
        if (players.length !== 4) {
            throw new Error("Hokm requires exactly 4 players.");
        }

        for (let i = 0; i < count; i++) {
            for (const player of players) {
                const card = this.draw();

                if (!card) {
                    throw new Error("Deck is empty.");
                }

                player.hand.push(card);
            }
        }
    }

    // تعداد کارت باقی‌مانده در دسته
    remaining() {
        return this.cards.length;
    }

    // آیا دسته کارت خالی است؟
    isEmpty() {
        return this.cards.length === 0;
    }
}

module.exports = Deck;
