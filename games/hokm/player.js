class Player {
    constructor(id, name, isBot = false) {
        this.id = id;
        this.name = name;
        this.isBot = isBot;

        // کارت‌های دست بازیکن
        this.hand = [];

        // تعداد دست‌های برده
        this.tricks = 0;

        this.ready = false;

        // تیم (0 یا 1)
        this.team = null;

        // آیا حکم را انتخاب می‌کند؟
        this.isHakem = false;
    }

    // دریافت یک کارت
    addCard(card) {
        this.hand.push(card);
    }

    // حذف یک کارت از دست
    removeCard(index) {
        if (index < 0 || index >= this.hand.length) {
            return null;
        }

        return this.hand.splice(index, 1)[0];
    }

    // حذف کارت بر اساس مقدار و خال
    playCard(value, suit) {
        const index = this.hand.findIndex(
            (card) => card.value === value && card.suit === suit,
        );

        if (index === -1) {
            return null;
        }

        return this.hand.splice(index, 1)[0];
    }

    // آیا کارت دارد؟
    hasSuit(suit) {
        return this.hand.some((card) => card.suit === suit);
    }

    // مرتب کردن کارت‌ها
    sortHand() {
        const suitOrder = {
            "♠": 0,
            "♥": 1,
            "♦": 2,
            "♣": 3,
        };

        const valueOrder = {
            2: 2,
            3: 3,
            4: 4,
            5: 5,
            6: 6,
            7: 7,
            8: 8,
            9: 9,
            10: 10,
            J: 11,
            Q: 12,
            K: 13,
            A: 14,
        };

        this.hand.sort((a, b) => {
            if (a.suit !== b.suit) {
                return suitOrder[a.suit] - suitOrder[b.suit];
            }

            return valueOrder[a.value] - valueOrder[b.value];
        });
    }

    // پاک کردن اطلاعات برای شروع دست جدید
    reset() {
        this.hand = [];
        this.tricks = 0;
        this.isHakem = false;
    }

    // نمایش کارت‌ها به صورت متن
    getHandText() {
        return this.hand.map((card) => `${card.value}${card.suit}`).join("  ");
    }
}

module.exports = Player;
