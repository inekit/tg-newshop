const {
  Telegraf,
  Composer,
  Scenes: { WizardScene, BaseScene },
} = require("telegraf");

const scene = new BaseScene("ordersScene");
const moment = require("moment");
const tOrmCon = require("../../db/connection");

async function getOrders(userId, offset) {
  const connection = await tOrmCon;

  return await connection
    .query(
      `select o.id, o.order_date, json_agg(oi.*) order_items
      from orders o left join (select * from orders_items oi 
        left join items i on oi.item_id = i.id) oi on o.id = oi.order_id 
      where o.user_id = $1 group by o.id, o.order_date, order_id
      order by order_date desc
      limit 10 offset $2`,
      [userId, offset]
    )
    .catch((e) => {
      console.log(e);
    });
}

scene.enter(async (ctx) => {
  const { edit } = ctx.scene.state;
  let keyboard;
  let title;

  const orders = (ctx.scene.state.orders = await getOrders(ctx.from.id, 0));

  keyboard = {
    name: "orders_list_keyboard",
    args: [orders],
  };
  title = ctx.getTitle("CHOOSE_ORDER");
  if (!orders?.length) {
    await ctx.replyWithTitle("NO_ORDERS_ADDED");
    return ctx.scene.enter("clientScene");
  }

  if (edit) return ctx.editMenu(title, keyboard);

  await ctx.replyWithKeyboard("⚙️", "main_menu_back_keyboard");
  ctx.replyWithKeyboard(title, keyboard);
});

scene.action(/^order\-([0-9]+)$/g, async (ctx) => {
  ctx.answerCbQuery().catch(console.log);
  const { orders } = ctx.scene.state;

  const order = orders.find((el) => el.id == ctx.match[1]);
  const orderStr = order?.order_items
    ?.map((el) => `${el?.name}: ${el?.price} руб. * ${el?.count} шт.`)
    ?.join("\n");

  const sum = order?.order_items.reduce((prev, cur, i) => prev + cur.price, 0);

  const orderDate = moment(order?.order_date);

  ctx.editMenu("ORDER_CARD", "go_back_keyboard", [
    orderDate.isValid() ? orderDate.format("hh:mm MM.DD.YYYY") : "Корзина",
    orderStr,
    sum,
  ]);
});

scene.action("go_back", async (ctx) => {
  await ctx.answerCbQuery().catch(console.log);

  await ctx.scene.enter("ordersScene", { edit: true });
});

scene.action("back", async (ctx) => {
  ctx.answerCbQuery().catch(console.log);

  if (ctx.scene.state.subcategory_id) {
    delete ctx.scene.state.subcategory_id,
      ctx.scene.state.items,
      ctx.scene.state.subcategory_name;
    ctx.scene.enter("catalogScene", {
      edit: true,
      category_id: ctx.scene.state.category_id,
      subcategories: ctx.scene.state.subcategories,
      category_name: ctx.scene.state.category_name,
    });
  } else if (ctx.scene.state.category_id) {
    delete ctx.scene.state;
    ctx.scene.enter("catalogScene", { edit: true });
  }
});

module.exports = scene;
