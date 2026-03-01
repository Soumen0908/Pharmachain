/**
 * Simple JSON file-based database for PharmaChain
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getFilePath(collection) {
    return path.join(DATA_DIR, `${collection}.json`);
}

function readCollection(collection) {
    const filePath = getFilePath(collection);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '[]', 'utf8');
        return [];
    }
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

function writeCollection(collection, data) {
    fs.writeFileSync(getFilePath(collection), JSON.stringify(data, null, 2), 'utf8');
}

function findOne(collection, predicate) {
    const items = readCollection(collection);
    return items.find(predicate) || null;
}

function findAll(collection, predicate) {
    const items = readCollection(collection);
    return predicate ? items.filter(predicate) : items;
}

function insertOne(collection, doc) {
    const items = readCollection(collection);
    items.push(doc);
    writeCollection(collection, items);
    return doc;
}

function updateOne(collection, predicate, updates) {
    const items = readCollection(collection);
    const idx = items.findIndex(predicate);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...updates };
    writeCollection(collection, items);
    return items[idx];
}

function deleteOne(collection, predicate) {
    const items = readCollection(collection);
    const idx = items.findIndex(predicate);
    if (idx === -1) return false;
    items.splice(idx, 1);
    writeCollection(collection, items);
    return true;
}

module.exports = { readCollection, writeCollection, findOne, findAll, insertOne, updateOne, deleteOne };
