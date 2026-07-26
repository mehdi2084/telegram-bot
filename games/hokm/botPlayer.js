const Player = require("./player");

class BotPlayer extends Player {

    constructor(id, name = "🤖 Bot") {
        super(id, name, true);
    }

    // انتخاب حکم
    chooseHokm() {

        const suits = {
            "♠": 0,
            "♥": 0,
            "♦": 0,
            "♣": 0
        };

        for (const card of this.hand) {
            suits[card.suit]++;
        }

        let bestSuit = "♠";
        let max = -1;

        for (const suit in suits) {
            if (suits[suit] > max) {
                max = suits[suit];
                bestSuit = suit;
            }
        }

        return bestSuit;
    }

    // انتخاب کارت برای بازی
    play(leadSuit = null) {

        // اگر اولین نفر است
        if (!leadSuit) {
            return this.removeCard(0);
        }

        // کارت‌های همان خال
        const sameSuit = this.hand.filter(card => card.suit === leadSuit);

        if (sameSuit.length > 0) {

            const card = sameSuit[0];

            const index = this.hand.findIndex(c =>
                c.value === card.value &&
                c.suit === card.suit
            );

            return this.removeCard(index);
        }

        // اگر آن خال را ندارد
        const random =
            Math.floor(Math.random() * this.hand.length);

        return this.removeCard(random);
    }

    // انتخاب کارت دلخواه
    playIndex(index) {

        return this.removeCard(index);

    }

}

module.exports = BotPlayer;