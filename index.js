const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const config = require("./config");
const patterns = require("./templates/patterns");
const commands = require("./templates/commands");
const keyboards = require("./templates/keyboards");
const statesReg = require("./templates/states").registration;
const statesEdit = require("./templates/states").edit;

const DEVICES_URL = "https://eliot-project.herokuapp.com/devices";

const bot = new TelegramBot(config.token, { polling: true });

const state = {
  registration: statesReg.NONE,
  registrationId: "",
  edit: statesEdit.NONE,
  editId: "",
  clear() {
    this.registration = statesReg.NONE;
    this.registrationId = "";
    this.edit = statesEdit.NONE;
    this.editId = "";
  }
};

// On START
bot.onText(/\/start/, msg => {
  state.clear();

  const id = msg.chat.id;

  bot.sendMessage(
    id,
    `\u{270B} Привіт, ${msg.from.first_name}, раді знову тебе бачити!`,
    {
      reply_markup: {
        inline_keyboard: keyboards.start
      }
    }
  );
});

// Handling button clicks
bot.on("callback_query", query => {
  // state must be cleared on every action
  state.clear();

  const {
    message: { chat, message_id, text }
  } = query;
  const userId = query.message.chat.id.toString();

  outer: switch (query.data) {
    case commands.VIEW_DEVICES:
      bot.sendMessage(chat.id, "\u{1F50E} Шукаю ваші полички...");

      axios
        .get(DEVICES_URL, {
          params: {
            telegramId: userId
          }
        })
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
    case commands.SETTINGS:
      bot.editMessageText(`${text}`, {
        chat_id: chat.id,
        message_id: message_id,
        reply_markup: {
          inline_keyboard: keyboards.settings
        }
      });

      break;
    case commands.BACK_TO_START:
      bot.editMessageText(`${text}`, {
        chat_id: chat.id,
        message_id: message_id,
        reply_markup: {
          inline_keyboard: keyboards.start
        }
      });

      break;
    case commands.REGISTER_DEVICE:
      state.registration = statesReg.ENTER_CODE;
      bot.sendMessage(
        chat.id,
        "Введіть ID полички (20 цифрове число), що зображене на її нижній стороні:"
      );

      break;
    case commands.EDIT_DEVICE:
      bot.sendMessage(chat.id, "\u{1F50E} Шукаю ваші полички...");

      axios
        .get(DEVICES_URL, {
          params: {
            telegramId: userId
          }
        })
        .then(res => {
          const devices = res.data;

          if (devices.length === 0) {
            bot.sendMessage(chat.id, "У вас ще немає поличок!");
            return;
          }

          bot.sendMessage(
            chat.id,
            "Ваші полички (оберіть ту, котру хочете редагувати): ",
            {
              reply_markup: {
                inline_keyboard: devices.map(device => [
                  {
                    text: `📁 Ім'я: ${device.name}, (ID: ${device._id})`,
                    callback_data: commands.EDIT_DEVICE_ID + device._id
                  }
                ])
              }
            }
          );
        })
        .catch(err => console.log(err));

      break;
    case commands.DELETE_DEVICE:
      bot.sendMessage(chat.id, "\u{1F50E} Шукаю ваші полички...");

      axios
        .get(DEVICES_URL, {
          params: {
            telegramId: userId
          }
        })
        .then(res => {
          const devices = res.data;

          if (devices.length === 0) {
            bot.sendMessage(chat.id, "У вас ще немає поличок!");
            return;
          }

          bot.sendMessage(
            chat.id,
            "Ваші полички (натисність на ту, котру хочете видалити): ",
            {
              reply_markup: {
                inline_keyboard: devices.map(device => [
                  {
                    text: `📁 Ім'я: ${device.name}, (ID: ${device._id})`,
                    callback_data: commands.DELETE_DEVICE_ID + device._id
                  }
                ])
              }
            }
          );
        })
        .catch(err => console.log(err));

      break;
    default:
      // Chosen device to EDIT
      if (query.data.startsWith(commands.EDIT_DEVICE_ID)) {
        const id = query.data.replace(commands.EDIT_DEVICE_ID, "");
        const basicCallbackData = [commands.EDIT_DEVICE, id];

        bot.editMessageText("Оберіть який параметр хочете змінити: ", {
          chat_id: chat.id,
          message_id: message_id,
          reply_markup: {
            inline_keyboard: keyboards.edit(basicCallbackData)
          }
        });

        break;
      }

      // Chosen device to DELETE
      if (query.data.startsWith(commands.DELETE_DEVICE_ID)) {
        const id = query.data.replace(commands.DELETE_DEVICE_ID, "");

        axios
          .patch(DEVICES_URL + "/" + id + "?deleteUser=true", {
            userIds: [
              {
                telegramId: userId
              }
            ]
          })
          .then(res => {
            if (res.status === 200) {
              // removing clicked button
              const oldMarkup = query.message.reply_markup.inline_keyboard;
              bot.editMessageText(`${text}`, {
                chat_id: chat.id,
                message_id: message_id,
                reply_markup: {
                  inline_keyboard: oldMarkup.filter(
                    button => button[0].callback_data !== query.data
                  )
                }
              });

              bot.sendMessage(chat.id, "Поличку успішно видалено");
            }
          })
          .catch(err => {
            console.log("ERROR: ", err);
            bot.sendMessage(
              chat.id,
              "Поличку не видалено, повторіть спробу пізніше"
            );
          });

        break;
      }

      // Handling edit device options
      try {
        const editInfo = JSON.parse(query.data);

        if (editInfo[0] === commands.EDIT_DEVICE) {
          state.editId = editInfo[1];

          switch (editInfo[2]) {
            case commands.EDIT_DEVICE_NAME:
              bot.sendMessage(chat.id, "Введіть нове ім'я для вашої полички");
              state.edit = statesEdit.NAME;

              break outer;
            case commands.EDIT_DEVICE_PRODUCT_NAME:
              bot.sendMessage(
                chat.id,
                "Введіть новий продукт для вашої полички"
              );
              state.edit = statesEdit.PRODUCT_NAME;

              break outer;
            case commands.EDIT_DEVICE_MAX_WEIGHT:
              bot.sendMessage(
                chat.id,
                "Введіть приблизну максимальну вагу для вашої полички в граммах \nНаприклад 1200"
              );
              state.edit = statesEdit.MAX_WEIGHT;

              break outer;
          }

          break;
        }
      } catch (err) {
        console.log("ERROR IN JSON.parse: ", err);
      }

      bot.sendMessage(chat.id, "Неправильна команда!");
      break;
  }

  bot.answerCallbackQuery(query.id);
});

// All other events
bot.on("message", msg => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Device registration (entering device code)
  if (state.registration === statesReg.ENTER_CODE) {
    const enteredId = text;
    const digitsRegexp = /^\d+$/;

    if (enteredId.length !== 20) {
      bot.sendMessage(chatId, "ID повинне містити 20 символів");
      return;
    }

    if (!digitsRegexp.test(enteredId)) {
      bot.sendMessage(chatId, "ID повинне містити лише цифри");
      return;
    }

    state.registration = statesReg.ENTER_NAME;
    state.registrationId = enteredId;
    bot.sendMessage(chatId, "Введіть назву полички");
  }
  // Device registration (entering device name)
  else if (state.registration === statesReg.ENTER_NAME) {
    const name = text;

    if (name.replace(/\s/g, "").length === 0) {
      bot.sendMessage(chatId, "Ім'я повинне містити хоча б один символ");
      return;
    }

    axios
      .patch(DEVICES_URL + "/" + state.registrationId, {
        name,
        userIds: [
          {
            telegramId: msg.from.id.toString()
          }
        ]
      })
      .then(
        res => {
          if (res.status === 200) {
            bot.sendMessage(chatId, "Поличку успішно додано!");
          }
        },
        err => {
          console.log("ERROR: ", err);
          if (err.response.status === 404) {
            bot.sendMessage(
              chatId,
              "Неправильне id полички! (такої полички не існує). \nПовторіть спробу."
            );
          }
        }
      );
    state.clear();
  }
  // Device edit (device name)
  else if (state.edit === statesEdit.NAME) {
    // if (text.replace(/\s/g, "").length === 0) {
    //   bot.sendMessage(chatId, "Ім'я повинне містити хоча б один символ");
    //   return;
    // }

    axios
      .patch(DEVICES_URL + "/" + state.editId, {
        name: text
      })
      .then(
        res => {
          if (res.status === 200) {
            bot.sendMessage(chatId, "Поличку успішно змінено!");
          }
        },
        err => {
          console.log("ERROR: ", err);
          if (err.response.status === 404) {
            bot.sendMessage(
              chatId,
              "Неправильне id полички! (такої полички не існує). \nПовторіть спробу."
            );
          }
        }
      );

    state.clear();
  }
  // Device edit (product name)
  else if (state.edit === statesEdit.PRODUCT_NAME) {
    // if (text.replace(/\s/g, "").length === 0) {
    //   bot.sendMessage(chatId, "Назва продукту повинна містити хоча б один символ");
    //   return;
    // }

    axios
      .patch(DEVICES_URL + "/" + state.editId, {
        productName: text
      })
      .then(
        res => {
          if (res.status === 200) {
            bot.sendMessage(chatId, "Поличку успішно змінено!");
          }
        },
        err => {
          console.log("ERROR: ", err);
          if (err.response.status === 404) {
            bot.sendMessage(
              chatId,
              "Неправильне id полички! (такої полички не існує). \nПовторіть спробу."
            );
          }
        }
      );

    state.clear();
  }
  // Device edit (maximum weight)
  else if (state.edit === statesEdit.MAX_WEIGHT) {
    if (isNaN(text)) {
      bot.sendMessage(chatId, "Вага повинна бути цілим або дробовим числом");
      return;
    }

    axios
      .patch(DEVICES_URL + "/" + state.editId, {
        maxWeight: Number(text)
      })
      .then(
        res => {
          if (res.status === 200) {
            bot.sendMessage(chatId, "Поличку успішно змінено!");
          }
        },
        err => {
          console.log("ERROR: ", err);
          if (err.response.status === 404) {
            bot.sendMessage(
              chatId,
              "Неправильне id полички! (такої полички не існує). \nПовторіть спробу."
            );
          }
        }
      );

    state.clear();
  }
});
