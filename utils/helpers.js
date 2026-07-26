// توابع کمکی عمومی

// تولید شناسه یکتا
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// تأخیر (Promise)
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// فرمت کردن زمان
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('fa-IR');
}

// تبدیل کارت‌ها به متن
function cardsToString(cards) {
    return cards.map(c => `${c.value}${c.suit}`).join(' ');
}

// ایمنی متن
function sanitizeText(text) {
    if (!text) return '';
    return text.replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, '');
}

// بررسی عدد بودن
function isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}

// انتخاب تصادفی از آرایه
function randomChoice(array) {
    if (!array || array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
}

// خلاصه کردن متن
function truncate(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// گروه‌بندی آرایه
function groupBy(array, key) {
    return array.reduce((result, item) => {
        const group = item[key];
        if (!result[group]) result[group] = [];
        result[group].push(item);
        return result;
    }, {});
}

// شافل آرایه
function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// تبدیل به عدد فارسی
function toPersianNumber(number) {
    const persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return number.toString().replace(/[0-9]/g, d => persian[parseInt(d)]);
}

// تاریخ به فارسی
function toPersianDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('fa-IR');
}

// زمان به فارسی
function toPersianTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fa-IR');
}

// محاسبه اختلاف زمان
function timeDifference(timestamp) {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} روز پیش`;
    if (hours > 0) return `${hours} ساعت پیش`;
    if (minutes > 0) return `${minutes} دقیقه پیش`;
    return `${seconds} ثانیه پیش`;
}

// نمایش با فرمت فارسی
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

module.exports = {
    generateId,
    delay,
    formatTime,
    cardsToString,
    sanitizeText,
    isNumeric,
    randomChoice,
    truncate,
    groupBy,
    shuffle,
    toPersianNumber,
    toPersianDate,
    toPersianTime,
    timeDifference,
    formatNumber
};