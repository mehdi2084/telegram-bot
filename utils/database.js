const fs = require('fs');
const path = require('path');
const config = require('../config');

class Database {
    constructor() {
        this.filePath = path.join(__dirname, '..', config.DATABASE.PATH);
        this.data = this.load();
    }

    // بارگذاری داده‌ها از فایل
    load() {
        try {
            const dir = path.dirname(this.filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            if (!fs.existsSync(this.filePath)) {
                fs.writeFileSync(this.filePath, JSON.stringify({}, null, 2));
                return {};
            }

            const data = fs.readFileSync(this.filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading database:', error);
            return {};
        }
    }

    // ذخیره داده‌ها در فایل
    save() {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.error('Error saving database:', error);
        }
    }

    // دریافت کاربر
    getUser(id) {
        return this.data[id] || null;
    }

    // بروزرسانی کاربر
    updateUser(id, data) {
        this.data[id] = { ...this.data[id], ...data };
        this.save();
        return this.data[id];
    }

    // حذف کاربر
    deleteUser(id) {
        delete this.data[id];
        this.save();
    }

    // دریافت همه کاربران
    getAllUsers() {
        return { ...this.data };
    }

    // دریافت لیست کاربران مرتب شده بر اساس XP
    getTopUsers(limit = 10) {
        const users = Object.values(this.data);
        users.sort((a, b) => b.xp - a.xp);
        return users.slice(0, limit);
    }

    // دریافت رتبه کاربر
    getUserRank(id) {
        const users = Object.values(this.data);
        users.sort((a, b) => b.xp - a.xp);
        const index = users.findIndex(u => u.id === id);
        return index + 1;
    }

    // افزایش XP کاربر
    addXP(id, amount) {
        const user = this.getUser(id);
        if (user) {
            user.xp += amount;
            this.save();
            return user.xp;
        }
        return null;
    }

    // افزایش Coins کاربر
    addCoins(id, amount) {
        const user = this.getUser(id);
        if (user) {
            user.coins += amount;
            this.save();
            return user.coins;
        }
        return null;
    }

    // ثبت بازی
    recordGame(id, won = false) {
        const user = this.getUser(id);
        if (user) {
            user.gamesPlayed = (user.gamesPlayed || 0) + 1;
            if (won) user.gamesWon = (user.gamesWon || 0) + 1;
            this.save();
            return user;
        }
        return null;
    }

    // پاک کردن همه داده‌ها
    clearAll() {
        this.data = {};
        this.save();
    }

    // تعداد کاربران
    count() {
        return Object.keys(this.data).length;
    }

    // آماری از دیتابیس
    getStats() {
        const users = Object.values(this.data);
        const totalXP = users.reduce((sum, u) => sum + (u.xp || 0), 0);
        const totalCoins = users.reduce((sum, u) => sum + (u.coins || 0), 0);
        
        return {
            totalUsers: users.length,
            totalXP,
            totalCoins,
            averageXP: users.length ? Math.round(totalXP / users.length) : 0,
            averageCoins: users.length ? Math.round(totalCoins / users.length) : 0
        };
    }

    // بکاپ گرفتن
    backup() {
        const backupPath = this.filePath.replace('.json', `_backup_${Date.now()}.json`);
        fs.copyFileSync(this.filePath, backupPath);
        return backupPath;
    }

    // بازیابی از بکاپ
    restore(backupPath) {
        if (fs.existsSync(backupPath)) {
            const data = fs.readFileSync(backupPath, 'utf8');
            this.data = JSON.parse(data);
            this.save();
            return true;
        }
        return false;
    }
}

module.exports = Database;