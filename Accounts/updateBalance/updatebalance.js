

const AccountCreate = require('../../SchemaDb/accountCreate.js');

const updateAvailableBalance = async () => {
    try {
        // Get all verified user accounts
        const accounts = await AccountCreate.find({ kycStatuys: "verifed" });

        for (const account of accounts) {
            // Convert balances to numbers
            const totalBalance = parseFloat(account.totalBalance) || 0;
            const currentAvailable = parseFloat(account.availableBalance) || 0;

            // Stop updating if availableBalance is equal to or greater than totalBalance
            if (currentAvailable >= totalBalance) {
                
                continue;
            }

            // Calculate 1% of totalBalance
            const tenPercentAmount = totalBalance * 0.010;
            
            // Calculate new available balance
            let newAvailableBalance = currentAvailable + tenPercentAmount;

            // Ensure availableBalance does not exceed totalBalance
            if (newAvailableBalance > totalBalance) {
                newAvailableBalance = totalBalance;
            }

            // Update the account
            await AccountCreate.findByIdAndUpdate(
                account._id,
                { availableBalance: newAvailableBalance.toString() },
                { new: true }
            );

            console.log(`Updated user ${account._id}: New available balance = ${newAvailableBalance} ${new Date().toLocaleString()}`);
        }

        console.log(`Available balances updated successfully for verified users at ${new Date().toLocaleString()}`);
    } catch (error) {
        console.error('Error updating available balances:', error);
    }
};

// Run the update every 1 minute (60000 milliseconds)
setInterval(updateAvailableBalance, 60000);

module.exports = updateAvailableBalance;

