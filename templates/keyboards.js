const commands = require("./commands");

module.exports = {
  // Keyboard on /start
  start: [
    [
      {
        text: "\u{1F50E}  Переглянути полички",
        callback_data: commands.VIEW_DEVICES
      }
    ],
    [{ text: "\u{1F527}  Налаштування", callback_data: commands.SETTINGS }]
  ],
  // Keyboard on settings message
  settings: [
    [
      { text: "Зареєструвати поличку", callback_data: commands.REGISTER_DEVICE }
    ],
    [{ text: "Редагувати поличку", callback_data: commands.EDIT_DEVICE }],
    [{ text: "Видалити поличку", callback_data: commands.DELETE_DEVICE }],
    [{ text: "Назад", callback_data: commands.BACK_TO_START }]
  ],
  // Keyboard on edit page
  edit: basicCallbackData => [
    [
      {
        text: "Ім'я",
        callback_data: JSON.stringify([
          ...basicCallbackData,
          commands.EDIT_DEVICE_NAME
        ])
      },
      {
        text: "Продукт",
        callback_data: JSON.stringify([
          ...basicCallbackData,
          commands.EDIT_DEVICE_PRODUCT_NAME
        ])
      }
    ],
    [
      {
        text: "Максимальна вага продукту",
        callback_data: JSON.stringify([
          ...basicCallbackData,
          commands.EDIT_DEVICE_MAX_WEIGHT
        ])
      }
    ]
  ]
};
