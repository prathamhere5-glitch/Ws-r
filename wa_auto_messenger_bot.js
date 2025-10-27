const TelegramBot = require('node-telegram-bot-api');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

const token = '8111876690:AAETmnCuSI71NXKiCI2VpgtoQiTq5sVliDw';
const bot = new TelegramBot(token, { polling: true });

const userSessions = {}; // Map telegram userId to WhatsApp sessions

const mainMenuKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [
                { text: 'Start', callback_data: 'start' },
                { text: 'Add Account', callback_data: 'add_account' },
                { text: 'List Linked Accounts', callback_data: 'list_accounts' }
            ],
            [
                { text: 'Delay', callback_data: 'delay' },
                { text: 'Schedule', callback_data: 'schedule' },
                { text: 'Stop', callback_data: 'stop' }
            ],
            [
                { text: 'Developer', url: 'https://t.me/yourdeveloperusername' }
            ]
        ]
    }
};

// Show main menu
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Welcome to WhatsApp Auto Messenger Bot! Choose an action:', mainMenuKeyboard);
});

bot.on('callback_query', async (query) => {
    const userId = query.from.id;
    const chatId = query.message.chat.id;

    switch (query.data) {
        case 'add_account':
            // Create a new WhatsApp Web client for this user
            if (userSessions[userId]) {
                bot.sendMessage(chatId, 'Account already linked or pending, use /list_accounts.');
                return;
            }
            bot.sendMessage(chatId, 'Generating QR code for WhatsApp login...');
            const client = new Client({
                authStrategy: new LocalAuth({ clientId: `telegram_${userId}` }),
            });
            client.on('qr', async (qr) => {
                const qrImage = await qrcode.toBuffer(qr);
                bot.sendPhoto(chatId, qrImage, {
                    caption: 'Scan this QR code with your WhatsApp app to link your account.',
                });
            });
            client.on('ready', () => {
                userSessions[userId] = client;
                bot.sendMessage(chatId, 'WhatsApp account linked successfully! ✅', mainMenuKeyboard);
            });
            client.on('auth_failure', msg => {
                bot.sendMessage(chatId, 'Authentication failed! Try again.', mainMenuKeyboard);
            });
            client.initialize();
            break;
        case 'list_accounts':
            if (userSessions[userId]) {
                bot.sendMessage(chatId, 'You have a WhatsApp account linked.');
            } else {
                bot.sendMessage(chatId, 'No WhatsApp account linked.');
            }
            break;
        case 'start':
            if (userSessions[userId]) {
                bot.sendMessage(chatId, 'Messaging automation started.');
                // Implement your messaging loop here, e.g., send random messages to contacts
            } else {
                bot.sendMessage(chatId, 'Please link your WhatsApp account first.');
            }
            break;
        case 'delay':
            bot.sendMessage(chatId, 'Please enter the delay in minutes (e.g., 5):');
            break;
        case 'schedule':
            bot.sendMessage(chatId, 'Please enter the schedule time range (e.g., 09:00-18:00):');
            break;
        case 'stop':
            bot.sendMessage(chatId, 'Messaging automation stopped.');
            break;
        default:
            bot.sendMessage(chatId, 'Unknown command.');
    }
});

// Optionally handle /help
bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id, `
Available commands:
- /start : Show main menu
- /help : Show this help message

Use inline buttons for all other actions.
    `, mainMenuKeyboard);
});

console.log('WhatsApp Auto Messenger Bot running...');
