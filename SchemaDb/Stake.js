const mongoose = require('mongoose');
const { Schema } = mongoose;

const stakeSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'AccountCreate', required: true },
  amount: { type: Number, required: true },
  duration: { type: Number, required: true },
  durationType: { type: String, enum: ['month', 'year'], required: true },
  rewardAmount: { type: Number, required: true },
  stakedAt: { type: Date, default: Date.now },
  maturityDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'completed'], default: 'active' }
});

const Stake = mongoose.model('Stake', stakeSchema);
module.exports = Stake;
