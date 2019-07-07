const TelegramBot = require("node-telegram-bot-api");
const config = require("./config");
const axios = require("axios");
const patterns = require("./templates/patterns");

const TOKEN = config.token;
const bot = new TelegramBot(TOKEN, { polling: true });

const DEVICES_URL = "https://eliot-project.herokuapp.com/devices";

const COMMAND_VIEW_DEVICES = "COMMAND_VIEW_DEVICES";
const COMMAND_SETTINGS = "COMMAND_SETTINGS";
const COMMAND_BACK_TO_START = "COMMAND_BACK_TO_START";

const startKeyboard = [
  [
    {
      text: "\u{1F50E}  Переглянути полички",
      callback_data: COMMAND_VIEW_DEVICES
    }
  ],
  [{ text: "\u{1F527}  Налаштування", callback_data: COMMAND_SETTINGS }]
];

const settingsKeyboard = [
  [{ text: "Зареєструвати поличку", callback_data: "1" }],
  [{ text: "Редагувати поличку", callback_data: "2" }],
  [{ text: "Видалити поличку", callback_data: "3" }],
  [{ text: "Назад", callback_data: COMMAND_BACK_TO_START }]
];

// On START
bot.onText(/\/start/, msg => {
  const id = msg.chat.id;
  bot.sendMessage(
    id,
    `\u{270B} Привіт, ${msg.from.first_name}, раді знову тебе бачити!`,
    {
      reply_markup: {
        inline_keyboard: startKeyboard
      }
    }
  );
});

// Handling button clicks
bot.on("callback_query", query => {
  const {
    message: { chat, message_id, text }
  } = query;
  const userId = query.message.chat.id;

  switch (query.data) {
    case COMMAND_VIEW_DEVICES:
      bot.sendMessage(chat.id, "\u{1F50E} Шукаю ваші полички...");

      axios
        .get(DEVICES_URL)
        .then(res => {
          const devices = res.data;

          if (devices.length === 0) {
            bot.sendMessage(chat.id, "У вас ще немає поличок!");
          }

          devices.forEach(elem => {
            bot.sendMessage(chat.id, patterns.devicePattern(elem));
          });
        })
        .catch(err => console.log(err));

      break;
    case COMMAND_SETTINGS:
      bot.editMessageText(`${text}`, {
        chat_id: chat.id,
        message_id: message_id,
        reply_markup: {
          inline_keyboard: settingsKeyboard
        }
      });
      break;
    case COMMAND_BACK_TO_START:
      bot.editMessageText(`${text}`, {
        chat_id: chat.id,
        message_id: message_id,
        reply_markup: {
          inline_keyboard: startKeyboard
        }
      });
      break;
    default:
      bot.sendMessage(chat.id, "Неправильна команда!");
      break;
  }

  bot.answerCallbackQuery({ callback_query_id: query.id });
});
