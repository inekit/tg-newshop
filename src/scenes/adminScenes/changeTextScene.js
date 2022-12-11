const {
  Telegraf,
  Composer,
  Scenes: { WizardScene },
} = require("telegraf");
const moment = require("moment");
const { CustomWizardScene } = require("telegraf-steps");
const tOrmCon = require("../../db/connection");
const authAdmin = require("../../Utils/authAdmin");
const FilesHandler = require("../../Utils/fileHandler");

const scene = new CustomWizardScene("changeTextScene");

scene.enter(async (ctx) => {
  const { edit, main_menu_button } = ctx.scene.state;

  const res = await authAdmin(ctx.from.id, true).catch(() => {
    ctx.answerCbQuery("CANT_AUTH");
    return ctx.scene.enter("clientScene");
  });

  if (!res) {
    return ctx.scene.enter("clientScene");
  }

  const keyboard = "change_text_actions_keyboard";
  const title = ctx.getTitle("CHANGE_TEXT", [ctx.getTitle("GREETING")]);

  if (main_menu_button) await ctx.replyWithKeyboard("⚙️", main_menu_button);

  //if (edit) return ctx.editMenu(title, keyboard)
  /*await ctx.replyWithPhoto(ctx.getTitle("GREETING_PHOTO")).catch((e) => {
    console.log("no photo to send");
  });*/
  ctx.replyWithKeyboard(title, keyboard);
});

scene.action(/change\_(.+)/g, (ctx) => {
  ctx.answerCbQuery().catch(console.log);

  const type = ctx.match[1];

  switch (type) {
    case "greeting": {
      ctx.replyStep(0);
      break;
    }
  }
});

scene
  .addStep({
    variable: "greeting_text",
    type: "confirm",
    cb: (ctx) => {
      ctx.answerCbQuery().catch(console.log);

      ctx.setTitle("GREETING", ctx.scene.state.input?.greeting_text);

      ctx.scene.reenter();
    },
  })
  .addStep({
    variable: "main_text",
    type: "confirm",
    cb: (ctx) => {
      ctx.answerCbQuery().catch(console.log);

      ctx.setTitle("HOME_MENU", ctx.scene.state.input?.main_text);

      ctx.scene.reenter();
    },
  })
  .addStep({
    variable: "photo",
    type: "action",
    handler: new FilesHandler(async (ctx) => {
      ctx.answerCbQuery().catch(console.log);

      ctx.setTitle("GREETING_PHOTO", ctx.scene.state.input?.photo);

      ctx.scene.reenter();
    }),
  })
  .addStep({
    variable: "card_text",
    type: "confirm",
    cb: (ctx) => {
      ctx.answerCbQuery().catch(console.log);

      ctx.setTitle("CATEGORY_ADD_TITLE", ctx.scene.state.input?.card_text);

      ctx.scene.reenter();
    },
  });

module.exports = scene;
