const TelegramBot = require('node-telegram-bot-api');
// const { Client, LocalAuth } = require('whatsapp-web.js'); // Uncomment for real WhatsApp integration

const token = '8111876690:AAETmnCuSI71NXKiCI2VpgtoQiTq5sVliDw';
const bot = new TelegramBot(token, { polling: true });

const whatsappAccounts = {};
const randomMessages = {};
const activeSessions = {};
const pairingCodes = {}; // key: telegramUserId, value: pairingCode

// Generate and send pairing code
bot.onText(/\/genpair/, (msg) => {
  const userId = msg.from.id;
  const pairingCode = Math.random().toString(36).substr(2, 8).toUpperCase();
  pairingCodes[userId] = pairingCode;
  bot.sendMessage(msg.chat.id, `Your WhatsApp pairing code: ${pairingCode}\nEnter this code in your WhatsApp app to link your account.`);
  // TODO: For real WhatsApp integration, generate QR/pairing code and handle login.
});

// User links WhatsApp using the pairing code
bot.onText(/\/link (\S+)/, (msg, match) => {
  const userId = msg.from.id;
  const enteredCode = match[1];
  if (pairingCodes[userId] && pairingCodes[userId] === enteredCode) {
    whatsappAccounts[userId] = { linked: true, pairingCode: enteredCode };
    bot.sendMessage(msg.chat.id, `WhatsApp account linked successfully using code: ${enteredCode}`);
  } else {
    bot.sendMessage(msg.chat.id, `Invalid pairing code. Please generate a new one using /genpair.`);
  }
});

// Set random messages
bot.onText(/\/setmessages (.+)/, (msg, match) => {
  const userId = msg.from.id;
  const messages = match[1].split(';').map(m => m.trim()).filter(Boolean);
  randomMessages[userId] = messages;
  bot.sendMessage(msg.chat.id, `Random messages set:\n${messages.map((m, i) => `${i+1}. ${m}`).join('\n')}`);
});

// Schedule bot activity
bot.onText(/\/schedule (\d{2}:\d{2})-(\d{2}:\d{2})/, (msg, match) => {
  const startTime = match[1];
  const endTime = match[2];
  activeSessions[msg.from.id] = { startTime, endTime, running: false };
  bot.sendMessage(msg.chat.id, `Scheduled bot activity from ${startTime} to ${endTime}. Use /startbot to begin.`);
});

// Start messaging loop
bot.onText(/\/startbot/, (msg) => {
  const userId = msg.from.id;
  if (activeSessions[userId] && whatsappAccounts[userId] && whatsappAccounts[userId].linked && randomMessages[userId]) {
    activeSessions[userId].running = true;
    bot.sendMessage(msg.chat.id, 'Bot is now active and will automate messaging.');
    startMessagingLoop(userId, msg.chat.id);
  } else {
    bot.sendMessage(msg.chat.id, 'Please make sure you have linked WhatsApp and set random messages and schedule.');
  }
});

bot.onText(/\/stopbot/, (msg) => {
  const userId = msg.from.id;
  if (activeSessions[userId]) {
    activeSessions[userId].running = false;
    bot.sendMessage(msg.chat.id, 'Bot stopped.');
  } else {
    bot.sendMessage(msg.chat.id, 'No active bot session found.');
  }
});

// Messaging loop (simulated)
function startMessagingLoop(userId, chatId) {
  if (!activeSessions[userId] || !activeSessions[userId].running) return;
  if (!whatsappAccounts[userId] || !randomMessages[userId]) {
    bot.sendMessage(chatId, 'Please link WhatsApp and set random messages first.');
    return;
  }

  // Simulate sending random messages at random intervals
  const delayMinutes = Math.floor(Math.random() * 5) + 1; // 1-5 minutes delay
  const messageCount = Math.floor(Math.random() * 4) + 1; // 1-4 messages
  const messagesToSend = [];

  for (let i = 0; i < messageCount; i++) {
    const msgPool = randomMessages[userId];
    if (msgPool.length === 0) break;
    const randomIndex = Math.floor(Math.random() * msgPool.length);
    messagesToSend.push(msgPool[randomIndex]);
  }

  bot.sendMessage(chatId, `Sending ${messageCount} random messages to your WhatsApp account in ${delayMinutes} minute(s):\n${messagesToSend.join('\n')}`);

  // TODO: Use WhatsApp API to actually send the messages here

  setTimeout(() => {
    if (activeSessions[userId] && activeSessions[userId].running) {
      startMessagingLoop(userId, chatId);
    }
  }, delayMinutes * 60 * 1000);
}

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, `
Commands:
/genpair - Generate WhatsApp pairing code
/link <pairing_code> - Link WhatsApp account using pairing code
/setmessages <m1;m2;m3;...> - Set random messages separated by semicolons
/schedule <HH:MM>-<HH:MM> - Set bot active time range
/startbot - Begin automated messaging
/stopbot - Stop messaging
/help - Show this help
  `);
});

console.log('Wa_Auto_Messenger_Bot is running...');
