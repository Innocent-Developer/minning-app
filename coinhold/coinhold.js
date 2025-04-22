const express = require('express');
const router = express.Router();
const AccountCreate = require('../SchemaDb/accountCreate');
const Stake = require('../SchemaDb/Stake');

const stakeRoute = async (req, res) => {
  const { userId, amount, duration, durationType } = req.body;

  if (!userId || !amount || !duration || !['month', 'year'].includes(durationType)) {
    return res.status(400).json({ error: 'Invalid request parameters.' });
  }

  try {
    const user = await AccountCreate.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const available = parseFloat(user.availableBalance || "0");
    const amt = parseFloat(amount);
    if (available < amt) return res.status(400).json({ error: 'Insufficient balance.' });

    // Calculate reward (1% per month)
    const months = durationType === 'year' ? duration * 12 : duration;
    const rewardPercent = months; // 1% per month
    const rewardAmount = +(amt * (rewardPercent / 200)).toFixed(2); // 0.5% per month

    // Calculate maturity date
    const stakedAt = new Date();
    const maturityDate = new Date(stakedAt);
    maturityDate.setMonth(maturityDate.getMonth() + months);

    // Save stake in Stake collection
    const stake = new Stake({
      userId,
      amount: amt,
      duration,
      durationType,
      rewardAmount,
      stakedAt,
      maturityDate
    });
    await stake.save();

    // Deduct balance from user
    user.availableBalance = (available - amt).toString();

    // Add staking info to user's document
    user.stakings.push({
      amount: amt,
      duration,
      durationType,
      rewardAmount,
      stakedAt,
      maturityDate,
      status: 'active'
    });

    await user.save();

    return res.status(200).json({
      message: 'Stake successful.',
      stake
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = stakeRoute;
 