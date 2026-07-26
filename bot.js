const TelegramBot = require("node-telegram-bot-api").default;

const token = process.env.BOT_TOKEN;

const bot = new TelegramBot(token, {
    polling: true
});

console.log("Chiko Bot Started 🚀");

// ذخیره امتیاز کاربران
const users = {};

// ذخیره بازی‌های حکم
const hokmGames = {};

// کارت‌های بازی
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUES = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, 
    '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

// تابع ثبت کاربر
function registerUser(id, name) {
    if (!users[id]) {
        users[id] = {
            name,
            xp: 0,
            coins: 100
        };
    }
}

// ساخت دسته کارت
function createDeck() {
    const deck = [];
    for (let suit of SUITS) {
        for (let rank of RANKS) {
            deck.push({ suit, rank, value: RANK_VALUES[rank] });
        }
    }
    return shuffleDeck(deck);
}

// بر زدن کارت‌ها
function shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ============== سیستم بازی حکم بازسازی شده ==============

// ساخت بازی جدید حکم
bot.onText(/\/hokm/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userName = msg.from.first_name;
    
    registerUser(userId, userName);
    
    // بررسی وجود بازی فعال
    const activeGame = Object.values(hokmGames).find(
        g => g.chatId === chatId && g.status !== 'finished'
    );
    
    if (activeGame) {
        bot.sendMessage(chatId, 
            "⚠️ یک بازی حکم در این گروه در حال انجام است.\n" +
            "برای پیوستن از دستور /join_hokm استفاده کنید."
        );
        return;
    }
    
    const gameId = `hokm_${chatId}_${Date.now()}`;
    hokmGames[gameId] = {
        id: gameId,
        chatId: chatId,
        creator: userId,
        players: [{ id: userId, name: userName, cards: [], team: 'none' }],
        status: 'waiting', // waiting, choosing_teams, choosing_hokm, playing, finished
        mode: 'multi', // multi or single
        deck: [],
        hokmSuit: null,
        hokmChooser: null,
        currentPlayer: 0,
        roundCards: [],
        scores: { teamA: 0, teamB: 0 },
        roundScores: { teamA: 0, teamB: 0 },
        maxRounds: 13,
        currentRound: 0,
        teamA: [],
        teamB: []
    };
    
    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '👥 بازی گروهی (2-4 نفر)', callback_data: `hokm_mode_multi_${gameId}` }],
                [{ text: '🤖 بازی تک نفره با ربات', callback_data: `hokm_mode_single_${gameId}` }]
            ]
        }
    };
    
    bot.sendMessage(chatId, 
        `🃏 **بازی حکم**\n\n` +
        `سازنده: ${userName}\n` +
        `لطفاً نوع بازی را انتخاب کنید:`,
        { parse_mode: 'Markdown', ...keyboard }
    );
});

// مدیریت انتخاب نوع بازی
bot.on('callback_query', async (query) => {
    const userId = query.from.id;
    const data = query.data;
    
    if (data.startsWith('hokm_mode_')) {
        const parts = data.split('_');
        const mode = parts[2];
        const gameId = parts.slice(3).join('_');
        
        const game = hokmGames[gameId];
        if (!game || game.creator !== userId) {
            bot.answerCallbackQuery(query.id, { text: '❌ شما سازنده بازی نیستید!' });
            return;
        }
        
        game.mode = mode;
        
        if (mode === 'single') {
            // شروع بازی تک نفره
            game.players = [
                { id: userId, name: query.from.first_name, cards: [], team: 'A' },
                { id: 'bot1', name: '🤖 ربات ۱', cards: [], team: 'B' },
                { id: 'bot2', name: '🤖 ربات ۲', cards: [], team: 'A' },
                { id: 'bot3', name: '🤖 ربات ۳', cards: [], team: 'B' }
            ];
            game.teamA = [userId, 'bot2'];
            game.teamB = ['bot1', 'bot3'];
            game.status = 'choosing_hokm';
            
            bot.editMessageText('🃏 **بازی حکم تک نفره**\n\nشما در تیم A هستید با ربات ۲\nدر حال شروع بازی...', {
                chat_id: game.chatId,
                message_id: query.message.message_id,
                parse_mode: 'Markdown'
            });
            
            startHokmGame(game);
        } else {
            // حالت گروهی - انتخاب تیم
            game.status = 'choosing_teams';
            
            const keyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔴 تیم A', callback_data: `hokm_team_A_${gameId}` }],
                        [{ text: '🔵 تیم B', callback_data: `hokm_team_B_${gameId}` }]
                    ]
                }
            };
            
            bot.editMessageText(
                `👥 **بازی گروهی حکم**\n\n` +
                `برای پیوستن: /join_hokm\n` +
                `بازیکنان، تیم خود را انتخاب کنید:\n\n` +
                `تیم A: ${game.teamA.length}/2\n` +
                `تیم B: ${game.teamB.length}/2`,
                {
                    chat_id: game.chatId,
                    message_id: query.message.message_id,
                    parse_mode: 'Markdown',
                    ...keyboard
                }
            );
        }
        
        bot.answerCallbackQuery(query.id);
    }
    
    // انتخاب تیم
    if (data.startsWith('hokm_team_')) {
        const parts = data.split('_');
        const team = parts[2];
        const gameId = parts.slice(3).join('_');
        
        const game = hokmGames[gameId];
        if (!game || game.status !== 'choosing_teams') {
            bot.answerCallbackQuery(query.id, { text: '❌ بازی در دسترس نیست!' });
            return;
        }
        
        // بررسی آیا کاربر در بازی هست
        const player = game.players.find(p => p.id === userId);
        if (!player) {
            bot.answerCallbackQuery(query.id, { text: '❌ ابتدا با /join_hokm وارد بازی شوید!' });
            return;
        }
        
        // بررسی ظرفیت تیم
        const teamArray = team === 'A' ? game.teamA : game.teamB;
        const otherTeam = team === 'A' ? game.teamB : game.teamA;
        
        if (teamArray.includes(userId)) {
            bot.answerCallbackQuery(query.id, { text: '⚠️ شما قبلاً در این تیم هستید!' });
            return;
        }
        
        if (teamArray.length >= 2) {
            bot.answerCallbackQuery(query.id, { text: '⚠️ این تیم پر شده است!' });
            return;
        }
        
        // حذف از تیم دیگر اگر بود
        const otherIndex = otherTeam.indexOf(userId);
        if (otherIndex > -1) {
            otherTeam.splice(otherIndex, 1);
        }
        
        // اضافه به تیم جدید
        teamArray.push(userId);
        player.team = team;
        
        bot.answerCallbackQuery(query.id, { text: `✅ شما به تیم ${team} پیوستید!` });
        
        // به‌روزرسانی پیام
        const keyboard = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔴 تیم A', callback_data: `hokm_team_A_${gameId}` }],
                    [{ text: '🔵 تیم B', callback_data: `hokm_team_B_${gameId}` }],
                    [{ text: '✅ شروع بازی', callback_data: `hokm_start_${gameId}` }]
                ]
            }
        };
        
        bot.editMessageText(
            `👥 **بازی گروهی حکم**\n\n` +
            `تیم A: ${game.teamA.map(id => game.players.find(p => p.id === id)?.name || 'نامشخص').join(', ') || 'خالی'}\n` +
            `تیم B: ${game.teamB.map(id => game.players.find(p => p.id === id)?.name || 'نامشخص').join(', ') || 'خالی'}\n\n` +
            `برای شروع نیاز به حداقل ۲ بازیکن (۱ نفر در هر تیم) دارید.`,
            {
                chat_id: game.chatId,
                message_id: query.message.message_id,
                parse_mode: 'Markdown',
                ...keyboard
            }
        );
    }
    
    // شروع بازی گروهی
    if (data.startsWith('hokm_start_')) {
        const gameId = data.split('_').slice(2).join('_');
        const game = hokmGames[gameId];
        
        if (!game || game.creator !== userId) {
            bot.answerCallbackQuery(query.id, { text: '❌ فقط سازنده بازی می‌تواند شروع کند!' });
            return;
        }
        
        if (game.teamA.length === 0 || game.teamB.length === 0) {
            bot.answerCallbackQuery(query.id, { text: '⚠️ هر تیم باید حداقل ۱ بازیکن داشته باشد!' });
            return;
        }
        
        // تکمیل تیم‌ها با ربات اگر needed
        while (game.teamA.length < 2) {
            const botId = `bot_${Date.now()}_${Math.random()}`;
            const botPlayer = { id: botId, name: `🤖 ربات ${game.teamA.length + 1}`, cards: [], team: 'A' };
            game.players.push(botPlayer);
            game.teamA.push(botId);
        }
        
        while (game.teamB.length < 2) {
            const botId = `bot_${Date.now()}_${Math.random()}`;
            const botPlayer = { id: botId, name: `🤖 ربات ${game.teamB.length + 1}`, cards: [], team: 'B' };
            game.players.push(botPlayer);
            game.teamB.push(botId);
        }
        
        game.status = 'choosing_hokm';
        
        bot.editMessageText('🎮 بازی شروع شد!', {
            chat_id: game.chatId,
            message_id: query.message.message_id
        });
        
        startHokmGame(game);
        bot.answerCallbackQuery(query.id);
    }
});

// پیوستن به بازی
bot.onText(/\/join_hokm/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userName = msg.from.first_name;
    
    registerUser(userId, userName);
    
    const activeGame = Object.values(hokmGames).find(
        g => g.chatId === chatId && (g.status === 'waiting' || g.status === 'choosing_teams')
    );
    
    if (!activeGame) {
        bot.sendMessage(chatId, "❌ بازی فعالی برای پیوستن وجود ندارد.");
        return;
    }
    
    if (activeGame.players.find(p => p.id === userId)) {
        bot.sendMessage(chatId, "⚠️ شما قبلاً به بازی پیوسته‌اید.");
        return;
    }
    
    if (activeGame.players.length >= 4 && activeGame.mode !== 'multi') {
        bot.sendMessage(chatId, "⚠️ بازی پر شده است.");
        return;
    }
    
    activeGame.players.push({ 
        id: userId, 
        name: userName, 
        cards: [], 
        team: 'none'
    });
    
    bot.sendMessage(chatId, 
        `✅ ${userName} به بازی پیوست.\n` +
        `حالا تیم خود را با دکمه‌های زیر انتخاب کنید!`
    );
});

// خروج از بازی
bot.onText(/\/leave_hokm/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const activeGame = Object.values(hokmGames).find(
        g => g.chatId === chatId && (g.status === 'waiting' || g.status === 'choosing_teams')
    );
    
    if (!activeGame) {
        bot.sendMessage(chatId, "❌ بازی فعالی برای خروج وجود ندارد.");
        return;
    }
    
    const playerIndex = activeGame.players.findIndex(p => p.id === userId);
    if (playerIndex === -1) {
        bot.sendMessage(chatId, "❌ شما در این بازی نیستید.");
        return;
    }
    
    // حذف از تیم‌ها
    const teamAIndex = activeGame.teamA.indexOf(userId);
    if (teamAIndex > -1) activeGame.teamA.splice(teamAIndex, 1);
    
    const teamBIndex = activeGame.teamB.indexOf(userId);
    if (teamBIndex > -1) activeGame.teamB.splice(teamBIndex, 1);
    
    activeGame.players.splice(playerIndex, 1);
    bot.sendMessage(chatId, 
        `${msg.from.first_name} از بازی خارج شد.\n` +
        `تعداد بازیکنان: ${activeGame.players.length}`
    );
    
    if (activeGame.players.length === 0) {
        delete hokmGames[activeGame.id];
    }
});

// لغو بازی
bot.onText(/\/cancel_hokm/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const activeGame = Object.values(hokmGames).find(
        g => g.chatId === chatId && g.status !== 'finished'
    );
    
    if (!activeGame) {
        bot.sendMessage(chatId, "❌ بازی فعالی برای لغو وجود ندارد.");
        return;
    }
    
    if (activeGame.creator !== userId) {
        bot.sendMessage(chatId, "❌ فقط سازنده بازی می‌تواند آن را لغو کند.");
        return;
    }
    
    delete hokmGames[activeGame.id];
    bot.sendMessage(chatId, "🃏 بازی حکم لغو شد.");
});

// شروع بازی حکم
function startHokmGame(game) {
    game.status = 'choosing_hokm';
    game.deck = createDeck();
    
    // تقسیم کارت‌ها (۵ کارت اول)
    for (let i = 0; i < 5; i++) {
        for (let player of game.players) {
            player.cards.push(game.deck.pop());
        }
    }
    
    // انتخاب تصادفی تعیین کننده حکم (از بازیکنان واقعی)
    const realPlayers = game.players.filter(p => !p.id.startsWith('bot'));
    const hokmChooser = realPlayers.length > 0 ? 
        realPlayers[Math.floor(Math.random() * realPlayers.length)] : 
        game.players[0];
    
    game.hokmChooser = hokmChooser.id;
    
    // ارسال کارت‌ها به صورت خصوصی (فقط به بازیکنان واقعی)
    game.players.forEach(player => {
        if (!player.id.startsWith('bot')) {
            const cardsText = formatCards(player.cards);
            bot.sendMessage(player.id, 
                `🃏 کارت‌های شما:\n${cardsText}`
            ).catch(() => {
                bot.sendMessage(game.chatId, 
                    `⚠️ ${player.name} لطفاً ربات را در PV استارت کنید تا کارت‌هایتان ارسال شود.`
                );
            });
        }
    });
    
    const chooserPlayer = game.players.find(p => p.id === game.hokmChooser);
    
    if (chooserPlayer.id.startsWith('bot')) {
        // ربات حکم را انتخاب می‌کند
        const randomSuit = SUITS[Math.floor(Math.random() * SUITS.length)];
        setTimeout(() => setHokmSuit(game, randomSuit), 2000);
        
        bot.sendMessage(game.chatId, 
            `🎯 ${chooserPlayer.name} در حال انتخاب حکم...`
        );
    } else {
        // بازیکن واقعی حکم را انتخاب می‌کند
        bot.sendMessage(game.chatId, 
            `🎯 ${chooserPlayer.name} باید حکم را تعیین کند.\n` +
            `لطفاً یکی از خال‌ها را انتخاب کنید:\n` +
            `♠️ - /hokm_suit_spades\n` +
            `♥️ - /hokm_suit_hearts\n` +
            `♦️ - /hokm_suit_diamonds\n` +
            `♣️ - /hokm_suit_clubs`
        );
    }
}

// تنظیم حکم
function setHokmSuit(game, suit) {
    game.hokmSuit = suit;
    game.status = 'playing';
    
    // توزیع بقیه کارت‌ها
    for (let i = 0; i < 8; i++) {
        for (let player of game.players) {
            player.cards.push(game.deck.pop());
        }
    }
    
    // ارسال کارت‌های نهایی به بازیکنان واقعی
    game.players.forEach(player => {
        if (!player.id.startsWith('bot')) {
            const cardsText = formatCards(player.cards);
            bot.sendMessage(player.id, 
                `🃏 کارت‌های نهایی شما:\n${cardsText}`
            ).catch(() => {});
        }
    });
    
    const suitNames = {
        '♠': 'پیک ♠️',
        '♥': 'دل ♥️',
        '♦': 'خشت ♦️',
        '♣': 'گشنیز ♣️'
    };
    
    // تنظیم نوبت اول
    game.currentPlayer = game.players.findIndex(p => p.id === game.hokmChooser);
    
    bot.sendMessage(game.chatId, 
        `🎯 حکم: ${suitNames[suit]}\n\n` +
        `بازی شروع شد!\n` +
        `دور ${game.currentRound + 1} - نوبت ${game.players[game.currentPlayer].name}`
    );
    
    // اگر نوبت ربات است
    if (game.players[game.currentPlayer].id.startsWith('bot')) {
        setTimeout(() => botPlay(game), 2000);
    }
}

// بازی ربات
function botPlay(game) {
    const player = game.players[game.currentPlayer];
    if (!player || !player.id.startsWith('bot')) return;
    
    // انتخاب کارت هوشمندانه
    let cardIndex;
    
    if (game.roundCards.length === 0) {
        // ربات اول بازی می‌کند
        cardIndex = Math.floor(Math.random() * player.cards.length);
    } else {
        const firstSuit = game.roundCards[0].card.suit;
        const hasSuit = player.cards.filter(c => c.suit === firstSuit);
        
        if (hasSuit.length > 0) {
            // کارت از همون خال
            cardIndex = player.cards.indexOf(hasSuit[Math.floor(Math.random() * hasSuit.length)]);
        } else {
            // کارت حکم اگر دارد
            const hasHokm = player.cards.filter(c => c.suit === game.hokmSuit);
            if (hasHokm.length > 0) {
                cardIndex = player.cards.indexOf(hasHokm[Math.floor(Math.random() * hasHokm.length)]);
            } else {
                cardIndex = Math.floor(Math.random() * player.cards.length);
            }
        }
    }
    
    const playedCard = player.cards.splice(cardIndex, 1)[0];
    game.roundCards.push({ playerId: player.id, card: playedCard });
    
    bot.sendMessage(game.chatId, 
        `${player.name} بازی کرد: ${playedCard.rank}${playedCard.suit}`
    );
    
    if (game.roundCards.length === 4) {
        finishRound(game);
    } else {
        game.currentPlayer = (game.currentPlayer + 1) % 4;
        
        if (game.players[game.currentPlayer].id.startsWith('bot')) {
            setTimeout(() => botPlay(game), 2000);
        } else {
            bot.sendMessage(game.chatId, 
                `نوبت ${game.players[game.currentPlayer].name}\n` +
                `برای بازی: /play [شماره کارت]`
            );
        }
    }
}

// فرمت کردن کارت‌ها برای نمایش
function formatCards(cards) {
    return cards.map((card, index) => 
        `${index + 1}. ${card.rank}${card.suit}`
    ).join('\n');
}

// انتخاب حکم
const suitCommands = {
    '/hokm_suit_spades': '♠',
    '/hokm_suit_hearts': '♥',
    '/hokm_suit_diamonds': '♦',
    '/hokm_suit_clubs': '♣'
};

Object.entries(suitCommands).forEach(([command, suit]) => {
    bot.onText(new RegExp(command), (msg) => {
        const userId = msg.from.id;
        
        const activeGame = Object.values(hokmGames).find(
            g => g.hokmChooser === userId && g.status === 'choosing_hokm'
        );
        
        if (!activeGame) {
            bot.sendMessage(msg.chat.id, "❌ شما اجازه انتخاب حکم را ندارید.");
            return;
        }
        
        setHokmSuit(activeGame, suit);
    });
});

// بازی کارت
bot.onText(/\/play (\d+)/, (msg, match) => {
    const userId = msg.from.id;
    const cardIndex = parseInt(match[1]) - 1;
    
    const activeGame = Object.values(hokmGames).find(
        g => g.status === 'playing' && 
        g.players[g.currentPlayer]?.id === userId
    );
    
    if (!activeGame) {
        bot.sendMessage(msg.chat.id, "❌ نوبت شما نیست یا بازی فعالی وجود ندارد.");
        return;
    }
    
    const player = activeGame.players[activeGame.currentPlayer];
    
    if (cardIndex < 0 || cardIndex >= player.cards.length) {
        bot.sendMessage(userId, "❌ شماره کارت نامعتبر است.");
        return;
    }
    
    // بررسی قوانین بازی
    if (activeGame.roundCards.length > 0) {
        const firstSuit = activeGame.roundCards[0].card.suit;
        const hasSuit = player.cards.some(c => c.suit === firstSuit);
        
        if (hasSuit && player.cards[cardIndex].suit !== firstSuit) {
            bot.sendMessage(userId, `❌ باید از خال ${firstSuit} بازی کنید.`);
            return;
        }
    }
    
    // بازی کارت
    const playedCard = player.cards.splice(cardIndex, 1)[0];
    activeGame.roundCards.push({ playerId: userId, card: playedCard });
    
    bot.sendMessage(activeGame.chatId, 
        `${player.name} بازی کرد: ${playedCard.rank}${playedCard.suit}`
    );
    
    // ارسال کارت‌های باقی‌مانده به بازیکن
    if (!player.id.startsWith('bot')) {
        bot.sendMessage(userId, 
            `کارت‌های باقی‌مانده:\n${formatCards(player.cards)}`
        ).catch(() => {});
    }
    
    // بررسی پایان دور
    if (activeGame.roundCards.length === 4) {
        finishRound(activeGame);
    } else {
        // نوبت بعدی
        activeGame.currentPlayer = (activeGame.currentPlayer + 1) % 4;
        const nextPlayer = activeGame.players[activeGame.currentPlayer];
        
        bot.sendMessage(activeGame.chatId, 
            `نوبت ${nextPlayer.name}`
        );
        
        // اگر نوبت ربات است
        if (nextPlayer.id.startsWith('bot')) {
            setTimeout(() => botPlay(activeGame), 2000);
        }
    }
});

// پایان دور
function finishRound(game) {
    // تعیین برنده دور
    const firstSuit = game.roundCards[0].card.suit;
    let winnerIndex = 0;
    let highestValue = game.roundCards[0].card.value;
    
    for (let i = 1; i < game.roundCards.length; i++) {
        const card = game.roundCards[i].card;
        
        if (card.suit === game.hokmSuit && game.roundCards[winnerIndex].card.suit !== game.hokmSuit) {
            winnerIndex = i;
            highestValue = card.value;
        } else if (card.suit === game.hokmSuit && game.roundCards[winnerIndex].card.suit === game.hokmSuit) {
            if (card.value > highestValue) {
                winnerIndex = i;
                highestValue = card.value;
            }
        } else if (card.suit === firstSuit && game.roundCards[winnerIndex].card.suit !== game.hokmSuit) {
            if (card.value > highestValue) {
                winnerIndex = i;
                highestValue = card.value;
            }
        }
    }
    
    const winner = game.players.find(p => p.id === game.roundCards[winnerIndex].playerId);
    const teamKey = winner.team === 'A' ? 'teamA' : 'teamB';
    game.roundScores[teamKey]++;
    
    const suitNames = {
        '♠': '♠️', '♥': '♥️', '♦': '♦️', '♣': '♣️'
    };
    
    bot.sendMessage(game.chatId, 
        `🏆 ${winner.name} این دور را برد!\n` +
        `کارت برنده: ${game.roundCards[winnerIndex].card.rank}${suitNames[game.roundCards[winnerIndex].card.suit]}\n` +
        `امتیاز تیم A: ${game.roundScores.teamA} | تیم B: ${game.roundScores.teamB}`
    );
    
    game.currentRound++;
    game.roundCards = [];
    
    // بررسی پایان بازی
    if (game.currentRound >= game.maxRounds || 
        game.players[0].cards.length === 0) {
        finishGame(game);
    } else {
        game.currentPlayer = game.players.findIndex(p => p.id === winner.id);
        const nextPlayer = game.players[game.currentPlayer];
        
        bot.sendMessage(game.chatId, 
            `دور ${game.currentRound + 1} - نوبت ${nextPlayer.name}`
        );
        
        // اگر نوبت ربات است
        if (nextPlayer.id.startsWith('bot')) {
            setTimeout(() => botPlay(game), 2000);
        }
    }
}

// پایان بازی
function finishGame(game) {
    game.status = 'finished';
    
    const winner = game.roundScores.teamA > game.roundScores.teamB ? 'تیم A' : 'تیم B';
    const isDraw = game.roundScores.teamA === game.roundScores.teamB;
    
    let resultText = `🎮 **بازی تمام شد!**\n\n` +
        `امتیاز نهایی:\n` +
        `🔴 تیم A: ${game.roundScores.teamA}\n` +
        `🔵 تیم B: ${game.roundScores.teamB}\n\n`;
    
    if (isDraw) {
        resultText += `🤝 بازی مساوی شد!\n\n`;
    } else {
        resultText += `🏆 برنده: ${winner}\n\n`;
    }
    
    // اهدای جوایز
    game.players.forEach(player => {
        if (player.id.startsWith('bot')) return;
        
        const playerTeam = player.team === 'A' ? 'teamA' : 'teamB';
        
        if (isDraw) {
            users[player.id].xp += 30;
            users[player.id].coins += 50;
            resultText += `${player.name}: ⭐ +30 XP, 🪙 +50 Coins\n`;
        } else if ((winner === 'تیم A' && player.team === 'A') || 
                   (winner === 'تیم B' && player.team === 'B')) {
            users[player.id].xp += 50;
            users[player.id].coins += 100;
            resultText += `${player.name}: ⭐ +50 XP, 🪙 +100 Coins\n`;
        } else {
            users[player.id].xp += 10;
            users[player.id].coins += 20;
            resultText += `${player.name}: ⭐ +10 XP, 🪙 +20 Coins\n`;
        }
    });
    
    bot.sendMessage(game.chatId, resultText, { parse_mode: 'Markdown' });
    
    // پاکسازی بازی
    setTimeout(() => {
        delete hokmGames[game.id];
    }, 5000);
}

// نمایش وضعیت بازی
bot.onText(/\/hokm_status/, (msg) => {
    const chatId = msg.chat.id;
    
    const activeGame = Object.values(hokmGames).find(
        g => g.chatId === chatId && g.status !== 'finished'
    );
    
    if (!activeGame) {
        bot.sendMessage(chatId, "❌ بازی فعالی وجود ندارد.");
        return;
    }
    
    let status = `📊 **وضعیت بازی حکم**\n\n` +
        `حالت: ${activeGame.mode === 'single' ? 'تک نفره 🤖' : 'گروهی 👥'}\n` +
        `وضعیت: ${activeGame.status}\n`;
    
    if (activeGame.hokmSuit) {
        const suitNames = {
            '♠': 'پیک ♠️',
            '♥': 'دل ♥️',
            '♦': 'خشت ♦️',
            '♣': 'گشنیز ♣️'
        };
        status += `حکم: ${suitNames[activeGame.hokmSuit]}\n`;
        status += `دور: ${activeGame.currentRound + 1}/${activeGame.maxRounds}\n`;
        status += `🔴 تیم A: ${activeGame.roundScores.teamA}\n`;
        status += `🔵 تیم B: ${activeGame.roundScores.teamB}\n`;
    }
    
    status += `\n**تیم A:**\n`;
    activeGame.players.filter(p => p.team === 'A').forEach(p => {
        status += `- ${p.name}\n`;
    });
    
    status += `\n**تیم B:**\n`;
    activeGame.players.filter(p => p.team === 'B').forEach(p => {
        status += `- ${p.name}\n`;
    });
    
    bot.sendMessage(chatId, status, { parse_mode: 'Markdown' });
});

// ============== بازی‌های قبلی ==============

// استارت
bot.onText(/\/start/, (msg) => {
    registerUser(msg.from.id, msg.from.first_name);

    bot.sendMessage(
        msg.chat.id,
        `سلام ${msg.from.first_name} 👋

به چیکو خوش اومدی 🤖

🎮 بازی‌ها:
/dice
/coin
/guess
/rps
/hokm - بازی حکم (تک نفره و گروهی)

😂 سرگرمی:
/joke
/fact
/luck

👤 پروفایل:
/profile
/top`
    );
});

// پروفایل
bot.onText(/\/profile/, (msg) => {
    registerUser(msg.from.id, msg.from.first_name);

    const user = users[msg.from.id];

    bot.sendMessage(
        msg.chat.id,
        `👤 ${user.name}

⭐ XP: ${user.xp}
🪙 Coins: ${user.coins}`
    );
});

// جدول رتبه بندی
bot.onText(/\/top/, (msg) => {
    const ranking = Object.values(users)
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 10);

    let text = "🏆 برترین کاربران:\n\n";

    ranking.forEach((u, i) => {
        text += `${i + 1}. ${u.name} - ${u.xp} XP\n`;
    });

    bot.sendMessage(msg.chat.id, text);
});

// تاس
bot.onText(/\/dice/, (msg) => {
    const number = Math.floor(Math.random() * 6) + 1;
    bot.sendMessage(msg.chat.id, `🎲 عدد تاس: ${number}`);
});

// شیر یا خط
bot.onText(/\/coin/, (msg) => {
    const result = Math.random() < 0.5 ? "🦁 شیر" : "🪙 خط";
    bot.sendMessage(msg.chat.id, result);
});

// شانس امروز
bot.onText(/\/luck/, (msg) => {
    const luck = Math.floor(Math.random() * 101);
    bot.sendMessage(msg.chat.id, `🍀 شانس امروزت: ${luck}%`);
});

// جوک
const jokes = [
    "😂 معلم: چرا تکلیف ننوشتی؟ دانش‌آموز: اینترنت قطع بود!",
    "😂 کامپیوترم مریض شده، ویروس گرفته!",
    "😂 برنامه‌نویس‌ها خواب نمی‌بینن، دیباگ می‌کنن!"
];

bot.onText(/\/joke/, (msg) => {
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    bot.sendMessage(msg.chat.id, joke);
});

// دانستنی
const facts = [
    "🦒 زبان زرافه تا 50 سانتی‌متر طول دارد.",
    "🐙 اختاپوس سه قلب دارد.",
    "🦈 کوسه‌ها قبل از دایناسورها وجود داشتند."
];

bot.onText(/\/fact/, (msg) => {
    const fact = facts[Math.floor(Math.random() * facts.length)];
    bot.sendMessage(msg.chat.id, fact);
});

// حدس عدد
const guessGames = {};

bot.onText(/\/guess/, (msg) => {
    guessGames[msg.chat.id] = Math.floor(Math.random() * 10) + 1;
    bot.sendMessage(msg.chat.id, "🎯 یک عدد بین 1 تا 10 حدس بزن.");
});

// سنگ کاغذ قیچی
bot.onText(/\/rps (سنگ|کاغذ|قیچی)/, (msg, match) => {
    const player = match[1];
    const choices = ["سنگ", "کاغذ", "قیچی"];
    const botChoice = choices[Math.floor(Math.random() * 3)];

    let result = "";
    if (player === botChoice) result = "🤝 مساوی";
    else if (
        (player === "سنگ" && botChoice === "قیچی") ||
        (player === "کاغذ" && botChoice === "سنگ") ||
        (player === "قیچی" && botChoice === "کاغذ")
    ) result = "🎉 شما بردید";
    else result = "😢 شما باختید";

    bot.sendMessage(msg.chat.id, `شما: ${player}\nربات: ${botChoice}\n\n${result}`);
});

// دریافت پاسخ حدس عدد
bot.on("message", (msg) => {
    if (!msg.text) return;

    const game = guessGames[msg.chat.id];

    if (game && /^[0-9]+$/.test(msg.text)) {
        const guess = parseInt(msg.text);
        registerUser(msg.from.id, msg.from.first_name);

        if (guess === game) {
            users[msg.from.id].xp += 10;
            users[msg.from.id].coins += 20;
            delete guessGames[msg.chat.id];
            bot.sendMessage(msg.chat.id, "🎉 درست حدس زدی!\n⭐ +10 XP\n🪙 +20 Coins");
        } else {
            bot.sendMessage(msg.chat.id, "❌ اشتباه بود. دوباره تلاش کن.");
        }
    }
});