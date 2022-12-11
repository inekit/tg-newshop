const {
  Composer,
  Scenes: { BaseScene },
} = require("telegraf");

const scene = new BaseScene("adminScene");
const main_menu_button = "admin_back_keyboard";

scene.enter(async (ctx) => {
  if (!ctx.session.registered) {
    const [{ exists }] = [{ true: 1 }];

    if (!exists) {
    }
  }

  return ctx.replyWithKeyboard("CHOOSE_ACTION", "admin_keyboard");
});

scene.hears(titles.getValues("BUTTON_REGISTER_ADMIN"), async (ctx) => {
  const agent_id = 1;

  if (agent_id) ctx.replyWithTitle("AGENT_ADDED");
  else ctx.replyWithTitle("AGENT_NOT_ADDED");
});

scene.hears(titles.getValues("BUTTON_ADD"), (ctx) =>
  ctx.scene.enter("adsLinkScene", { main_menu_button })
);

scene.hears(titles.getValues("BUTTON_ADMINS"), (ctx) =>
  ctx.scene.enter("adminsScene", { main_menu_button })
);

scene.hears(titles.getValues("BUTTON_CATALOG"), (ctx) =>
  ctx.scene.enter("categoriesScene", { main_menu_button })
);

scene.hears(titles.getValues("BUTTON_CHANGE_TEXT"), (ctx) =>
  ctx.scene.enter("changeTextScene", { main_menu_button })
);

module.exports = scene;
