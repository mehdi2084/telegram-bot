const Rules = require("./rules");
const { CARD_VALUES } = Rules;

class AI {
    // انتخاب خال حکم توسط حاکمِ بات (بیشترین خال در دست ۵ کارتی را انتخاب می‌کند)
    static chooseHokm(hand) {
        const counts = { "♠": 0, "♥": 0, "♦": 0, "♣": 0 };

        hand.forEach((card) => {
            counts[card.suit]++;
        });

        let best = "♠";

        for (const suit in counts) {
            if (counts[suit] > counts[best]) best = suit;
        }

        return best;
    }

    // انتخاب کارت برای بازی کردن (فقط تصمیم می‌گیرد، از دست حذف نمی‌کند)
    static chooseCard(hand, tableCards, hokm) {
        // اگر اولین نفرِ این دست است
        if (tableCards.length === 0) {
            return this.lowestCard(hand);
        }

        const leadSuit = tableCards[0].card.suit;

        // اگر هم‌خالِ کارتِ اول را دارد، باید همان را بازی کند
        const sameSuit = hand.filter((c) => c.suit === leadSuit);

        if (sameSuit.length > 0) {
            return this.lowestCard(sameSuit);
        }

        // اگر خال را ندارد ولی حکم دارد، با کمترین حکم می‌برد
        const hokmCards = hand.filter((c) => c.suit === hokm);

        if (hokmCards.length > 0) {
            return this.lowestCard(hokmCards);
        }

        // هیچ‌کدام را ندارد؛ بی‌فایده‌ترین کارت را دور می‌ریزد
        return this.lowestCard(hand);
    }

    static lowestCard(cards) {
        return cards.reduce((lowest, card) =>
            CARD_VALUES[card.value] < CARD_VALUES[lowest.value] ? card : lowest,
        );
    }

    static highestCard(cards) {
        return cards.reduce((highest, card) =>
            CARD_VALUES[card.value] > CARD_VALUES[highest.value] ? card : highest,
        );
    }
}

module.exports = AI;
