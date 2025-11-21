const mongoose = require('mongoose');

// Simple counter collection to generate sequential numbers atomically
// Usage: findOneAndUpdate({ key: 'amc_subscription' }, { $inc: { seq: 1 } }, { upsert: true, new: true })
const counterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, required: true, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Counter', counterSchema);


