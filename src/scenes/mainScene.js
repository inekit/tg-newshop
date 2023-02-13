const {
  Telegraf,
  Composer,
  Scenes: { WizardScene },
} = require("telegraf");

const { CustomWizardScene, createKeyboard } = require("telegraf-steps");
const tOrmCon = require("../db/connection");

const clientScene = new CustomWizardScene("clientScene").enter(async (ctx) => {
  const connection = await tOrmCon;

  let userObj = await connection
    .query(
      "SELECT id, user_id FROM users u left join admins a on a.user_id = u.id where u.id = $1 limit 1",
      [ctx.from?.id]
    )
    .catch((e) => {
      console.log(e);
      ctx.replyWithTitle("DB_ERROR");
    });

  userObj = userObj?.[0];

  if (!userObj) {
    //let kbtemp = {name: 'custom_bottom_keyboard', args: [menu]}

    await ctx
      .replyWithPhoto(ctx.getTitle("GREETING_PHOTO"), {
        caption: ctx.getTitle("GREETING") /*...createKeyboard(kbtemp, ctx)*/,
      })
      .catch(async (e) => {
        ctx.replyWithTitle("GREETING");
      });

    userObj = await connection
      .getRepository("User")
      .save({ id: ctx.from.id })
      .catch((e) => {
        console.log(e);
        ctx.replyWithTitle("DB_ERROR");
      });
  }

  ctx.replyWithKeyboard("HOME_MENU", {
    name: "main_keyboard",
    args: [userObj?.user_id],
  });
});

clientScene.hears(titles.getTitle("CATALOG_BUTTON", "ru"), (ctx) => {
  ctx.scene.enter("catalogScene");
});

async function getOrderId(con, userId) {
  let id;

  id = (
    await con.query(
      "select * from orders o where user_id = $1 and o.status = 'created' limit 1",
      [userId]
    )
  )?.[0]?.id;

  if (!id)
    id = (
      await con.query("insert into orders (user_id) values($1) returning id", [
        userId,
      ])
    )?.[0]?.id;

  console.log(id);

  return id;
}

clientScene.hears(titles.getTitle("СART_BUTTON", "ru"), async (ctx) => {
  const connection = await tOrmCon;

  const order_id = await getOrderId(connection, ctx.from.id);

  console.log(12, order_id);
  ctx.scene.enter("cartScene", {
    //item_id,
    //subcategory_id,
    //category_id,
    order_id,
  });
});

clientScene.hears(titles.getTitle("ADMIN_SCENE_BUTTON", "ru"), (ctx) => {
  ctx.scene.enter("adminScene");
});

clientScene.hears(titles.getTitle("ORDERS_BUTTON", "ru"), (ctx) => {
  ctx.scene.enter("ordersScene");
});

clientScene.hears(titles.getTitle("REVIEWS_BUTTON", "ru"), (ctx) => {
  ctx.replyWithKeyboard("REVIEWS_TITLE", "reviews_keyboard");
});

module.exports = [clientScene];
