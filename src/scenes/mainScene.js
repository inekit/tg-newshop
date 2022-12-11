const {
  CustomWizardScene,
  createKeyboard,
  handlers: { FilesHandler },
} = require("telegraf-steps");
const titles = require("telegraf-steps").titlesGetter(__dirname + "/../Titles");

const tOrmCon = require("../db/connection");
const getUser = require("../Utils/getUser");

const scene = new CustomWizardScene("clientScene").enter(async (ctx) => {
  const { visual = true, m1, greeting } = ctx.scene.state;

  if (m1) {
    await ctx.deleteMessage(m1).catch((e) => {});
  }

  let userObj = (ctx.scene.state.userObj = await getUser(ctx));

  const connection = await tOrmCon;

  if (!userObj) {
    userObj = await connection
      .getRepository("User")
      .save({
        id: ctx.from.id,
        username: ctx.from.username,
      })
      .catch(async (e) => {
        console.log(e);
        ctx.replyWithTitle("DB_ERROR");
      });
  }

  const categories = await connection
    .query("select * from categories")
    .catch((e) => {});

  visual &&
    ctx.replyWithKeyboard(
      greeting ? "GREETING" : "START_TITLE",
      {
        name: "main_keyboard",
        args: [categories, userObj?.user_id],
      },
      [ctx.from.first_name ?? ctx.from.username]
    );
});

scene.hears("Кроссовки", (ctx) =>
  ctx.scene.enter("catalogScene", { category_name: "Кроссовки" })
);

scene.on("text", async (ctx) => {
  const text = ctx.message.text;
  const connection = await tOrmCon;

  const category = (
    await connection
      .query("select * from categories where name = $1 limit 1", [text])
      .catch((e) => {})
  )?.[0];

  if (category) ctx.scene.enter("catalogScene", { category_name: text });
});

module.exports = [scene];
