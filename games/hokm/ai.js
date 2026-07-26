const Rules = require("./rules");

const CARD_VALUES = {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    "J": 11,
    "Q": 12,
    "K": 13,
    "A": 14
};

class AI {

    // انتخاب حکم
    static chooseHokm(hand) {

        const suits = {
            "♠": 0,
            "♥": 0,
            "♦": 0,
            "♣": 0
        };

        hand.forEach(card => {
            suits[card.suit]++;
        });

        let best = "♠";

        for (const suit in suits) {

            if (suits[suit] > suits[best])
                best = suit;

        }

        return best;
    }

    // انتخاب کارت
    static playCard(player, tableCards, hokm) {

        const hand = player.hand;

        // اولین نفر
        if (tableCards.length === 0) {

            return this.lowestCard(hand);

        }

        const leadSuit = tableCards[0].card.suit;

        // کارت‌های هم‌خال
        const sameSuit =
            hand.filter(c => c.suit === leadSuit);

        // اگر هم‌خال دارد
        if (sameSuit.length > 0) {

            return this.lowestCard(sameSuit);

        }

        // کارت‌های حکم
        const hokmCards =
            hand.filter(c => c.suit === hokm);

        if (hokmCards.length > 0) {

            return this.lowestCard(hokmCards);

        }

        // هیچ‌کدام نبود
        return this.lowestCard(hand);

    }

    // کمترین کارت
    static lowestCard(cards) {

        let lowest = cards[0];

        cards.forEach(card => {

            if (
                CARD_VALUES[card.value] <
                CARD_VALUES[lowest.value]
            ) {

                lowest = card;

            }

        });

        return lowest;

    }

    // بیشترین کارت
    static highestCard(cards) {

        let highest = cards[0];

        cards.forEach(card => {

            if (
                CARD_VALUES[card.value] >
                CARD_VALUES[highest.value]
            ) {

                highest = card;

            }

        });

        return highest;

    }

    // حذف کارت انتخاب‌شده از دست
    static removePlayedCard(player, card) {

        const index =
            player.hand.findIndex(c =>
                c.value === card.value &&
                c.suit === card.suit
            );

        if (index !== -1)
            player.hand.splice(index, 1);

    }

    // اجرای نوبت بات
    static play(bot, tableCards, hokm) {

        const card =
            this.playCard(
                bot,
                tableCards,
                hokm
            );

        this.removePlayedCard(bot, card);

        return card;

    }

}

module.exports = AI;