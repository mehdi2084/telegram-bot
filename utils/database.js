// مشکل: با ری‌استارت ربات، همه داده‌ها از دست می‌روند
const users = {};

// راه حل: استفاده از دیتابیس یا فایل
// utils/database.js
const fs = require('fs');
const path = require('path');

class Database {
    constructor() {
        this.filePath = path.join(__dirname, '../data/users.json');
        this.data = this.load();
    }

    load() {
        try {
            return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        } catch {
            return {};
        }
    }

    save() {
        fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    }

    getUser(id) {
        return this.data[id] || null;
    }

    updateUser(id, data) {
        this.data[id] = { ...this.data[id], ...data };
        this.save();
    }
}