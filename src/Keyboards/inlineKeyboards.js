const { Markup } = require("telegraf");
//const store = require('../LocalStorage/store')
const moment = require("moment");
const { main_menu_back_keyboard } = require("./keyboards");

const callbackButton = Markup.button.callback;
const urlButton = Markup.button.url;

const { inlineKeyboard } = Markup;

exports.reviews_keyboard = (ctx, admins) => {
  const keyboard = inlineKeyboard([
    urlButton(ctx.getTitle("REVIEW_BUTTON"), "t.me/nicklzx"),
  ]);

  return keyboard;
};

exports.city_keyboard = (ctx) => {
  const keyboard = inlineKeyboard(
    [
      callbackButton(ctx.getTitle("BUTTON_ADD_POINT"), "add_point"),
      callbackButton(ctx.getTitle("BUTTON_POINTS"), "points"),
      callbackButton(ctx.getTitle("BUTTON_DELETE"), "delete"),
    ],
    { columns: 2 }
  );

  keyboard.reply_markup.inline_keyboard.push([
    callbackButton(ctx.getTitle("BUTTON_BACK"), "back"),
  ]);

  return keyboard;
};

exports.admins_actions_keyboard = (ctx) => {
  const keyboard = inlineKeyboard(
    [
      callbackButton(ctx.getTitle("BUTTON_ADD_ADMIN"), "addAdmin"),
      callbackButton(ctx.getTitle("BUTTON_DELETE_ADMIN"), "deleteAdmin"),
    ],
    { columns: 2 }
  );

  return keyboard;
};

exports.admins_list_keyboard = (ctx, admins) => {
  const keyboard = inlineKeyboard(
    admins.map(({ userId }) => callbackButton(userId, "admin-" + userId)),
    { columns: 2 }
  );

  return keyboard;
};

exports.add_delete_keyboard = (ctx) => {
  const keyboard = inlineKeyboard(
    [callbackButton("ADD", "add"), callbackButton("DELETE", "delete")],
    { columns: 2 }
  );

  return keyboard;
};

exports.custom_keyboard = (ctx, bNames, bLinks) => {
  let k = inlineKeyboard([]);

  if (bNames.length != bLinks.length) return k;

  bNames.forEach((name, id) => {
    k.reply_markup.inline_keyboard.push([
      callbackButton(ctx.getTitle(name), bLinks[id]),
    ]);
  });

  return k;
};

exports.custom_obj_keyboard = (ctx, bNamesObj) => {
  let k = inlineKeyboard([]);

  Object.entries(bNamesObj)?.forEach(([name, link]) => {
    // console.log(name, link)
    k.reply_markup.inline_keyboard.push([
      callbackButton(ctx.getTitle(name), link),
    ]);
  });

  return k;
};

exports.skip_keyboard = (ctx) => this.custom_keyboard(ctx, ["SKIP"], ["skip"]);

exports.t_opportunity_keyboard = (ctx) =>
  this.custom_keyboard(
    ctx,
    ["BUTTON_CITY", "BUTTON_REGION", "NO"],
    ["city", "region", "0"]
  );

exports.template_keyboard = (ctx) =>
  inlineKeyboard(
    [
      callbackButton(ctx.getTitle("START_NEW"), "start_new"),
      callbackButton(ctx.getTitle("CONTINUE"), "continue"),
    ],
    { columns: 1 }
  );

exports.choose_c_keyboard = (ctx) =>
  inlineKeyboard(
    [
      callbackButton(ctx.getTitle("BUTTON_CHANGE_REGION"), "region"),
      callbackButton(ctx.getTitle("BUTTON_CHANGE_CITY"), "city"),
      callbackButton(ctx.getTitle("BUTTON_CHANGE_DISTRICT"), "district"),
      callbackButton(ctx.getTitle("BUTTON_CHANGE_ADDRESS"), "address"),
      callbackButton(ctx.getTitle("BUTTON_CONFIRM"), "confirm"),
    ],
    { columns: 1 }
  );

exports.choose_city_keyboard = (ctx) =>
  inlineKeyboard(
    [
      callbackButton(ctx.getTitle("BUTTON_CHANGE_REGION"), "region"),
      callbackButton(ctx.getTitle("BUTTON_CHANGE_CITY"), "city"),
      callbackButton(ctx.getTitle("BUTTON_CONFIRM"), "confirm"),
    ],
    { columns: 1 }
  );

exports.rates_keyboard = (ctx) =>
  this.custom_keyboard(
    ctx,
    ["BUTTON_5S", "BUTTON_4S", "BUTTON_3S", "BUTTON_2S", "BUTTON_1S"],
    ["rate-5", "rate-4", "rate-3", "rate-2", "rate-1"]
  );

exports.previous_step_keyboard = (ctx) =>
  this.custom_keyboard(ctx, ["BUTTON_PREVIOUS"], ["previous_step"]);

exports.greetings_keyboard = (ctx) =>
  this.custom_keyboard(ctx, ["IUNDERSTOOD"], ["confirm"]);

exports.greetings_fin_keyboard = (ctx) =>
  this.custom_keyboard(ctx, ["FIN"], ["fin"]);

exports.skip_previous_keyboard = (ctx) =>
  inlineKeyboard(
    [
      callbackButton(ctx.getTitle("BUTTON_PREVIOUS"), "previous_step"),
      callbackButton(ctx.getTitle("BUTTON_SKIP"), "skip"),
    ],
    { columns: 2 }
  );

exports.client_actions_keyboard = (ctx) =>
  this.custom_keyboard(
    ctx,
    ["BUTTON_UPDATE", "BUTTON_DELETE"],
    ["update_client", "delete_client"]
  );

exports.fine_keyboard = (ctx) =>
  this.custom_keyboard(
    ctx,
    ["BUTTON_CONFIRM", "BUTTON_REFUSE", "BUTTON_CANCEL"],
    ["status-true", "status-false", "cancel"]
  );

exports.finish_updating_keyboard = (ctx) =>
  inlineKeyboard(
    [
      callbackButton("Сохранить изменения", "send"),
      callbackButton("Изменить поле имя", "adding_name"),
      callbackButton("Изменить превью", "files"),
      callbackButton("Изменить артикул", "vendor_code"),
      callbackButton("Изменить размеры", "adding_sizes"),
      callbackButton("Изменить цену", "adding_price"),
    ],
    { columns: 1 }
  );

exports.update_keyboard = (ctx) => {
  const keyboard = inlineKeyboard(
    [callbackButton(ctx.getTitle("UPDATE_BUTTON"), "reload")],
    { columns: 1 }
  );

  return keyboard;
};

exports.confirm_cancel_keyboard = (ctx) =>
  inlineKeyboard(
    [
      callbackButton(ctx.getTitle("BUTTON_CONFIRM"), "confirm"),
      callbackButton(ctx.getTitle("BUTTON_CANCEL"), "cancel"),
    ],
    { columns: 1 }
  );

exports.send_to_alp_keyboard = (ctx) =>
  inlineKeyboard(
    [
      callbackButton(ctx.getTitle("BUTTON_CONFIRM"), "back"),
      callbackButton(
        ctx.getTitle("BUTTON_SEND_TO_ALPINISTS"),
        "send_to_alpinists"
      ),
    ],
    { columns: 1 }
  );

exports.go_back_keyboard = (ctx) =>
  inlineKeyboard([callbackButton(ctx.getTitle("BUTTON_GO_BACK"), "go_back")]);

exports.skip_keyboard = (ctx) =>
  inlineKeyboard([callbackButton(ctx.getTitle("BUTTON_SKIP"), "skip")]);

exports.cancel_keyboard = (ctx) =>
  inlineKeyboard([callbackButton(ctx.getTitle("BUTTON_CANCEL"), "cancel")]);

exports.confirm_keyboard = (ctx) =>
  inlineKeyboard([callbackButton(ctx.getTitle("BUTTON_CONFIRM"), "confirm")]);

exports.confirm_bbo_keyboard = (ctx) =>
  inlineKeyboard([
    callbackButton(ctx.getTitle("BUTTON_CONFIRM"), "confirm_bbo"),
  ]);

exports.enough_keyboard = (ctx) =>
  inlineKeyboard([callbackButton(ctx.getTitle("BUTTON_ENOUGH"), "confirm")]);

exports.confirm_add_client_keyboard = (ctx) =>
  inlineKeyboard([
    //callbackButton(ctx.getTitle('BUTTON_CONFIRM'), 'confirm'),
    callbackButton(ctx.getTitle("BUTTON_ADD_CONTACT"), "addContact"),
  ]);

exports.confirm_add_contact_comm_keyboard = (ctx) =>
  inlineKeyboard(
    [
      callbackButton(ctx.getTitle("BUTTON_CONFIRM"), "confirm"),
      callbackButton(ctx.getTitle("BUTTON_ADD_METHOD"), "addMethod"),
      callbackButton(ctx.getTitle("BUTTON_ADD_CONTACT"), "addContact"),
    ],
    { columns: 1 }
  );

exports.change_text_actions_keyboard = (ctx) => {
  const keyboard = inlineKeyboard(
    [
      callbackButton(ctx.getTitle("BUTTON_CHANGE_GREETING"), "change_greeting"),
      callbackButton(ctx.getTitle("BUTTON_CHANGE_PHOTO"), "change_photo"),
    ],
    { columns: 1 }
  );

  return keyboard;
};

exports.orders_list_keyboard = (ctx, ads) => {
  const keyboard = inlineKeyboard(
    ads.map(({ id, order_date }) =>
      callbackButton(moment(order_date).format("MM.DD.YYYY"), "order-" + id)
    ),
    { columns: 1 }
  );

  return keyboard;
};

exports.categories_list_keyboard = (ctx, data, prefix) => {
  let keyboard;
  if (prefix === "item")
    keyboard = inlineKeyboard(
      data.map(({ name, id }) => callbackButton(name, prefix + "-" + id)),
      { columns: 1 }
    );
  else
    keyboard = inlineKeyboard(
      data.map(({ name, id, count }) =>
        callbackButton(`${name} [${count}]`, prefix + "-" + id)
      ),
      { columns: 2 }
    );

  if (prefix === "subcategory" || prefix === "item")
    keyboard.reply_markup.inline_keyboard.push([
      callbackButton(ctx.getTitle("BUTTON_BACK"), "back"),
    ]);
  return keyboard;
};

exports.categories_list_admin_keyboard = (ctx, data, prefix, cardId) => {
  const keyboard = inlineKeyboard(
    data?.map(({ name, id }) => callbackButton(name, prefix + "-" + id)),
    { columns: 2 }
  );

  keyboard.reply_markup.inline_keyboard.push([
    callbackButton(
      ctx.getTitle(`BUTTON_ADD_${prefix.toUpperCase()}`),
      `add-${prefix}-${cardId ?? 0}`
    ),
  ]);
  const p2 =
    prefix === "item"
      ? "subcategory"
      : prefix === "subcategory"
      ? "category"
      : "";

  if (prefix === "subcategory" || prefix === "item")
    keyboard.reply_markup.inline_keyboard.push(
      [
        callbackButton(ctx.getTitle("BUTTON_EDIT"), `edit-${p2}-${cardId}`),
        callbackButton(ctx.getTitle("BUTTON_DELETE"), `delete-${p2}-${cardId}`),
      ],
      [callbackButton(ctx.getTitle("BUTTON_BACK"), "back")]
    );
  return keyboard;
};

exports.item_keyboard = (ctx, count, offset) => {
  const keyboard = inlineKeyboard([
    [
      callbackButton(ctx.getTitle("BUTTON_PREV"), `get_${Number(offset) - 1}`),
      callbackButton(ctx.getTitle("BUTTON_NEXT"), `get_${Number(offset) + 1}`),
    ],
    [
      callbackButton(
        ctx.getTitle("BUTTON_ADD_TO_CART", [
          count && count > 0 ? ` (${count.toString()})` : "",
        ]),
        "add_to_cart"
      ),
    ],
    [callbackButton(ctx.getTitle("BUTTON_BACK"), "back")],
  ]);

  console.log(count);
  if (count && count > 0) {
    keyboard.reply_markup.inline_keyboard.push([
      callbackButton(ctx.getTitle("BUTTON_GO_TO_CART"), "go_to_cart"),
    ]);
  }

  return keyboard;
};

exports.item_keyboard_admin = (ctx, cardId) => {
  const keyboard = inlineKeyboard(
    [
      callbackButton(ctx.getTitle("BUTTON_EDIT"), `edit-item-${cardId}`),
      callbackButton(ctx.getTitle("BUTTON_DELETE"), `delete-item-${cardId}`),
      callbackButton(ctx.getTitle("BUTTON_BACK"), "back"),
    ],
    { columns: 2 }
  );

  return keyboard;
};

exports.cart_keyboard = (ctx, item, page, pagination, total, backButton) => {
  const keyboard = inlineKeyboard(
    [
      callbackButton(
        `${item.price} * ${item.count} = ${item.price * item.count} руб.`,
        "sum"
      ),
    ],
    { columns: 1 }
  );
  console.log(item.item_id);
  keyboard.reply_markup.inline_keyboard.push([
    callbackButton(
      ctx.getTitle("BUTTON_DELETE_FROM_CART"),
      "delete_from_cart-" + item.item_id
    ),
    callbackButton(
      ctx.getTitle("BUTTON_DECREASE_COUNT"),
      "decreace_count-" + item.item_id
    ),
    callbackButton(item.count.toString(), "count"),
    callbackButton(
      ctx.getTitle("BUTTON_INCREASE_COUNT"),
      "increace_count-" + item.item_id
    ),
  ]);

  if (pagination > 1)
    keyboard.reply_markup.inline_keyboard.push([
      callbackButton(ctx.getTitle("BUTTON_PREVIOUS"), "previous"),
      callbackButton(`${page} из ${pagination}`, "page"),
      callbackButton(ctx.getTitle("BUTTON_NEXT"), "next"),
    ]);

  let bGroup = [];

  if (backButton)
    bGroup.push(callbackButton(ctx.getTitle("BUTTON_BACK"), "back"));

  bGroup.push(
    callbackButton(ctx.getTitle("BUTTON_ORDER", [`${total}`]), "order")
  );

  keyboard.reply_markup.inline_keyboard.push(bGroup);

  return keyboard;
};

exports.order_keyboard = (ctx, count) =>
  inlineKeyboard(
    [
      callbackButton(
        ctx.getTitle("BUTTON_CHECK_PAID", [count ? ` (${count})` : ""]),
        "check_paid"
      ),
    ],
    { columns: 2 }
  );

exports.another_order_keyboard = (ctx, count) =>
  inlineKeyboard(
    [
      callbackButton(
        ctx.getTitle("BUTTON_ANOTHER_ORDER", [count ? ` (${count})` : ""]),
        "another_order"
      ),
    ],
    { columns: 2 }
  );
