const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

const app = express();
app.use(express.json());

// Initialize Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

// CONFIGURATION - Uses Environment Variables on Render
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const PORT = process.env.PORT || 3000;

client.once('ready', () => {
    console.log(`Discord bot logged in as ${client.user.tag}!`);
});

// Root endpoint for health checks
app.get('/', (req, res) => {
    res.status(200).send('Bot server is running online!');
});

// Endpoint that Roblox calls when profit/balance updates occur
app.post('/api/profit', async (req, res) => {
    const { companyName, profitAmount, newTotalBalance } = req.body;

    if (!companyName) {
        return res.status(400).json({ error: 'Missing companyName in request body.' });
    }

    try {
        const channel = await client.channels.fetch(CHANNEL_ID);
        if (channel && channel.isTextBased()) {
            let message = `**company profits:** ${companyName}`;
            
            if (profitAmount !== undefined) {
                message += ` just made $${profitAmount} profit!`;
            }
            if (newTotalBalance !== undefined) {
                message += ` | **Total Balance:** $${newTotalBalance}`;
            }

            await channel.send(message);
            console.log(`Logged update for ${companyName}: +$${profitAmount} (Total: $${newTotalBalance})`);
            return res.status(200).json({ success: true });
        } else {
            console.error('Target channel was not found or is not text-based.');
            return res.status(404).json({ error: 'Channel not found' });
        }
    } catch (error) {
        console.error('Error publishing message to Discord:', error);
        return res.status(500).json({ error: 'Failed to post message to Discord' });
    }
});

// Start Express server and log into Discord
app.listen(PORT, () => {
    console.log(`Web server listening on port ${PORT}`);
});

client.login(BOT_TOKEN);