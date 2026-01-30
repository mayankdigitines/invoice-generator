const cron = require('node-cron');
const Business = require('../models/Business');
const { sendSubscriptionExpiryEmail } = require('./emailService');

const initCronJobs = () => {
    // Run every day at 9:00 AM
    // Cron syntax: minute hour day-of-month month day-of-week
    cron.schedule('0 9 * * *', async () => {
        console.log('Running daily subscription expiry check...');
        try {
            const now = new Date();
            const fiveDaysFromNow = new Date();
            fiveDaysFromNow.setDate(now.getDate() + 5);
            fiveDaysFromNow.setHours(23, 59, 59, 999); // Include the end of the 5th day

            // Find businesses with active subscriptions expiring in the next 5 days
            // We use $gte: now to ensure we don't pick up already expired ones (if status wasn't updated)
            // But relying on 'active' status is also key.
            const query = {
                'subscription.status': 'active',
                'subscription.endDate': {
                    $gt: now,
                    $lte: fiveDaysFromNow
                }
            };

            const expiringBusinesses = await Business.find(query);

            console.log(`Found ${expiringBusinesses.length} businesses with subscriptions expiring soon.`);

            for (const business of expiringBusinesses) {
                if (business.email) {
                    console.log(`Sending expiry reminder to ${business.name} (${business.email})`);
                    await sendSubscriptionExpiryEmail(
                        business.email, 
                        business.name, 
                        business.subscription.endDate
                    );
                } else {
                    console.warn(`Business ${business.name} (ID: ${business._id}) has no email address. Skipping notification.`);
                }
            }
        } catch (error) {
            console.error('Error in subscription cron job:', error);
        }
    });

    console.log('Subscription expiry cron job initialized (Schedule: 0 9 * * *).');
};

module.exports = initCronJobs;
