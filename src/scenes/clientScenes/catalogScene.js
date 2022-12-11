const {
  CustomWizardScene,
  KBCreator,
  handlers: { FilesHandler },
} = require("telegraf-steps");
const titles = global.titles;
const scene = new CustomWizardScene("catalogScene");

const tOrmCon = require("../../db/connection");

scene.enter(async (ctx) => {
  const { edit, category_name, offset = 0, m1, m2 } = ctx.scene.state;
  let keyboard;
  let title;

  ctx.scene.state.offset = offset;

  if (!category_name) {
    ctx.replyWithTitle("NO_CATEGORY");
    return ctx.scene.enter("clientScene");
  }

  const connection = await tOrmCon;

  const item = (
    await connection
      .query(
        "select * from items where category_name = $1  order by id DESC limit 1 offset $2 ",
        [category_name, offset]
      )
      .catch((e) => {})
  )?.[0];

  const count_items = (
    await connection
      .query("select count(*) count from items where category_name = $1", [
        category_name,
      ])
      .catch((e) => {})
  )?.[0]?.count;

  if (!item || !count_items) {
    ctx.replyWithTitle("NO_ITEMS_IN_CATEGORY");
    return ctx.scene.enter("clientScene");
  }

  if (m1) {
    await ctx.deleteMessage(m1).catch((e) => {});
  }

  const { name, description, photo, price, link, sizes, vendor_code } = item;

  let m;

  m = await ctx
    .replyPhotoWithKeyboard(
      photo,
      "ITEM_TITLE",
      {
        name: "item_keyboard",
        args: [link, offset, count_items],
      },
      [name?.toUpperCase(), description, price, sizes, vendor_code, link]
    )
    .catch(async (e) => {
      return await ctx.replyWithKeyboard(
        "ITEM_TITLE",
        {
          name: "item_keyboard",
          args: [link, offset, count_items],
        },
        [name?.toUpperCase(), description, price, sizes, vendor_code, link]
      );
    });

  ctx.scene.state.m1 = m?.message_id;
});

scene.action(/get\_(.+)/g, async (ctx) => {
  await ctx.answerCbQuery().catch(console.log);

  const offset = ctx.match[1];

  const { category_name, m1 } = ctx.scene.state;

  if (offset < 0) return;

  ctx.scene.enter("catalogScene", {
    offset,
    category_name,
    m1,
  });
});

scene.action("hide", async (ctx) => {
  ctx.answerCbQuery().catch(console.log);

  ctx.scene.enter("clientScene", { edit: true, m1: ctx.scene.state.m1 });
});

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

module.exports = scene;
