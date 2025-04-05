const express = require('express');
const router = express.Router();
const Kyc = require('../../SchemaDb/kyc');
const AccountCreate = require('../../SchemaDb/accountCreate');

// Update KYC information
const updateKyc= async (req, res) => {
    try {
        const { email, ...updateData } = req.body;

        // Find the KYC record by email and update it with the new data
        const updatedKyc = await Kyc.findOneAndUpdate({ email }, updateData, { new: true });

        if (!updatedKyc) {
            return res.status(404).json({ message: 'KYC record not found' });
        }

        // If KYC status is updated to 'verified', update the corresponding account's kycStatus
        if (updateData.kycStatus && updateData.kycStatus === 'verified') {
            await AccountCreate.findOneAndUpdate({ email: updatedKyc.email }, { kycStatuys: 'verified' });
        }

        res.status(200).json({ message: 'KYC information updated successfully', updatedKyc });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred while updating KYC information', error });
    }
};

module.exports = updateKyc;
