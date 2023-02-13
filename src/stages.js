const {
  Telegraf,
  Scenes: { Stage },
  Composer,
} = require("telegraf");
const titles = require("telegraf-steps").titlesGetter(__dirname + "/Titles");

const mainStage = new Stage(
  [
    ...require("./scenes/mainScene"),
    require("./scenes/clientScenes/catalogScene"),
    require("./scenes/clientScenes/cartScene"),
    require("./scenes/clientScenes/itemScene"),
    require("./scenes/clientScenes/ordersScene"),

    require("./scenes/adminScenes/adminScene"),
    require("./scenes/adminScenes/adminsScene"),
    require("./scenes/adminScenes/changeTextScene"),

    require("./scenes/adminScenes/categoriesScene"),
  ],
  {
    default: "clientScene",
  }
);

mainStage.start(async (ctx) =>
  ctx.scene.enter("clientScene", { greeting: true })
);
mainStage.command("web", (ctx) => ctx.scene.enter("catalogScene"));
mainStage.command("tasks", (ctx) => ctx.scene.enter("tasksScene"));
mainStage.command("refs", (ctx) => ctx.scene.enter("referalsScene"));
mainStage.command("help", (ctx) => ctx.scene.enter("helpScene"));
mainStage.command("lk", (ctx) => ctx.scene.enter("profileScene"));
mainStage.command("report", (ctx) => ctx.scene.enter("myReportsScene"));

mainStage.command("cashout", (ctx) => ctx.scene.enter("withdrawalScene"));
mainStage.hears(titles.getValues("BUTTON_BACK_USER"), (ctx) =>
  ctx.scene.enter("clientScene")
);
mainStage.hears(titles.getValues("BUTTON_CLIENT_MENU"), (ctx) =>
  ctx.scene.enter("clientScene")
);

const adminStage = new Stage([]);

mainStage.hears(titles.getValues("BUTTON_BACK_ADMIN"), (ctx) => {
  ctx.scene.enter("adminScene");
});

adminStage.hears(
  titles.getValues("BUTTON_ADMIN_MENU"),
  (ctx) =>
    store.isAdmin(ctx?.from?.id) &&
    ctx.scene.enter("adminScene", { edit: true })
);

const stages = new Composer();

stages.use(Telegraf.chatType("private", mainStage.middleware()));
stages.use(Telegraf.chatType("private", adminStage.middleware()));

module.exports = stages;
