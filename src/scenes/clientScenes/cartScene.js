const {
  Telegraf,
  Composer,
  Scenes: { WizardScene },
} = require("telegraf");

const deleteHandler = new Composer(),
  cityNameHandler = new Composer(),
  confirmHandler = new Composer();
const scene = new WizardScene(
  "cartScene",
  deleteHandler,
  cityNameHandler,
  confirmHandler
);

const tOrmCon = require("../../db/connection");

scene.enter(async (ctx) => {
  const {
    edit,
    main_menu_button,
    item_id,
    subcategory_id,
    category_id,
    order_id,
  } = ctx.scene.state;

  const connection = await tOrmCon;

  if (!order_id) {
    ctx.replyWithTitle("NO_SUCH_ORDER");
    return ctx.scene.enter("itemScene", {
      item_id,
      subcategory_id,
      category_id,
    });
  }

  ctx.scene.state.order = (
    await connection
      .query(`select * from orders where id = $1 and user_id = $2 limit 1`, [
        order_id,
        ctx.from?.id,
      ])
      .catch((e) => {
        console.log(e);
      })
  )?.[0];

  const cart = (ctx.scene.state.cart = await connection
    .query(
      `select item_id, count, i.*
     from orders_items oi
     left join items i on i.id = oi.item_id
     where oi.order_id = $1 and oi.order_user_id = $2`,
      [order_id, ctx.from?.id]
    )
    .catch((e) => {
      console.log(e);
      ctx.replyWithTitle("DB_ERROR");
    }));

  ctx.scene.state.page = 1;

  console.log(ctx.scene.state.cart);

  if (!ctx.scene.state.cart?.[0]) {
    ctx.replyWithTitle("NO_ITEMS_CART");
    return ctx.scene.enter("clientScene");
  }

  const total = countTotal(cart);

  const keyboard = {
    name: "cart_keyboard",
    args: [
      ctx.scene.state.cart?.[0],
      ctx.scene.state.page,
      ctx.scene.state.cart.length,
      total,
      !!item_id,
    ],
  };

  const { id, userId, status, phone, address } = ctx.scene.state.order;
  const title = ctx.getTitle("CART_CARD", [
    `${ctx.from?.id}-${ctx.scene.state.order.id}`,
    cart[0].name,
    cart[0].description,
    cart[0].price,
  ]);

  if (main_menu_button) await ctx.replyWithKeyboard("⚙️", main_menu_button);

  if (edit) return ctx.editMenu(title, keyboard);

  await ctx.replyWithKeyboard("⚙️", "main_menu_back_keyboard");
  ctx.replyWithKeyboard(title, keyboard);
});

function countTotal(cart) {
  return cart.reduce((p, c) => {
    console.log(c.price, c.count);
    return p + c.price * c.count;
  }, 0);
}

scene.action("order", async (ctx) => {
  const connection = await tOrmCon;

  const res = await connection
    .query(
      `update orders set status = 'ordered', order_date = now() where id = $1 and user_id = $2`,
      [ctx.scene.state.order_id, ctx.from?.id]
    )
    .catch((e) => {
      console.log(e);
    });

  if (!res) {
    ctx
      .answerCbQuery(ctx.getTitle("ORDER_HAS_NOT_BEEN_ADDED"))
      .catch(console.log);
    return ctx.scene.enter("clientScene");
  }

  ctx.answerCbQuery(ctx.getTitle("ORDER_HAS_BEEN_ADDED")).catch(console.log);

  function format(val) {
    return parseFloat(val).toFixed(8).replace(".", ",");
  }
  const total = countTotal(ctx.scene.state.cart);
  const btcTotal = total;
  const keyboard = {
    name: "order_keyboard",
    args: [`${ctx.from?.id}-${ctx.scene.state.order.id}`, total],
  };

  const orderStr = ctx.scene.state.cart.reduce((prev, cur) => {
    return prev + `<b>${cur.name}</b>:${cur.price}руб. ${cur.count} шт.\n`;
  }, "<b>Заказ:</b>\n");

  const admins = await connection.getRepository("Admin").find();
  for (admin of admins) {
    await ctx.telegram.sendMessage(
      admin.user_id,
      ctx.getTitle("NEW_ORDER", [ctx.from.username, ctx.from.id])
    );
  }

  ctx.replyWithTitle("ORDER_SENT");
});

scene.action("check_paid", async (ctx) => {
  const connection = await tOrmCon;

  const res = await connection
    .query(`update orders set status = 'paid' where id = $1 and user_id = $2`, [
      ctx.scene.state.order_id,
      ctx.from?.id,
    ])
    .catch((e) => {
      console.log(e);
    });

  if (!res?.affectedRows) {
    return ctx
      .answerCbQuery(ctx.getTitle("ORDER_HAS_NOT_BEEN_PAID"))
      .catch(console.log);
  }

  ctx.answerCbQuery(ctx.getTitle("ORDER_HAS_BEEN_PAID")).catch(console.log);

  const keyboard = { name: "another_order_keyboard", args: [] };
  const title = ctx.getTitle("ANOTHER_ORDER_CARD", []);
  ctx.editMenu(title, keyboard);
});

scene.action("another_order", async (ctx) => {
  ctx.answerCbQuery().catch(console.log);

  ctx.scene.enter("catalogScene");
});

scene.action(/^delete\_from\_cart\-([0-9]+)$/g, async (ctx) => {
  const { order_id } = ctx.scene.state;

  const connection = await tOrmCon;

  await connection
    .query(
      `delete from orders_items where item_id = $1 and order_id = $2 and order_user_id = $3`,
      [ctx.match[1], order_id, ctx.from.id]
    )
    .catch((e) => {
      console.log(e);
      return ctx.answerCbQuery(ctx.getTitle("ITEM_NOT_DELETED"));
    });

  await ctx.answerCbQuery(ctx.getTitle("ITEM_DELETED"));
  ctx.scene.reenter();
});

function sendCard(ctx, item) {
  const total = countTotal(ctx.scene.state.cart);
  const keyboard = {
    name: "cart_keyboard",
    args: [item, ctx.scene.state.page, ctx.scene.state.cart.length, total],
  };

  const { id } = ctx.scene.state.order;
  const { name, description, price } = item;

  const title = ctx.getTitle("CART_CARD", [
    `${ctx.from?.id}-${id}`,
    name,
    description,
    price,
  ]);

  return ctx.editMenu(title, keyboard);
}

scene.action(/^increace\_count\-([0-9]+)$/g, async (ctx) => {
  const { order_id } = ctx.scene.state;

  const item = ctx.scene.state.cart?.[ctx.scene.state.page - 1];

  if (!item) return;

  //if (item.count === 50)  return  ctx.answerCbQuery('CANT_DECREASE').catch(console.log);

  const connection = await tOrmCon;

  await connection
    .query(
      `update orders_items set count = count + 1 where item_id = $1 and order_id = $2 and order_user_id = $3`,
      [ctx.match[1], order_id, ctx.from.id]
    )
    .catch((e) => {
      console.log(e);
      return ctx.answerCbQuery(ctx.getTitle("ITEM_COUNT_NOT_INCREASED"));
    });

  await ctx.answerCbQuery(ctx.getTitle("ITEM_COUNT_INCREASED"));

  ctx.scene.state.cart[ctx.scene.state.page - 1].count++;

  sendCard(ctx, item);
});

scene.action(/^decreace\_count\-([0-9]+)$/g, async (ctx) => {
  const { order_id } = ctx.scene.state;

  const item = ctx.scene.state.cart?.[ctx.scene.state.page - 1];

  if (!item) return;

  if (item.count === 1)
    return ctx.answerCbQuery(ctx.getTitle("CANT_DECREASE")).catch(console.log);

  const connection = await tOrmCon;

  await connection
    .query(
      `update orders_items set count = count - 1 where item_id = $1 and order_id = $2 and order_user_id = $3`,
      [ctx.match[1], order_id, ctx.from.id]
    )
    .catch((e) => {
      console.log(e);
      return ctx.answerCbQuery("ITEM_COUNT_NOT_DECREASED");
    });

  await ctx.answerCbQuery(ctx.getTitle("ITEM_COUNT_DECREASED"));

  ctx.scene.state.cart[ctx.scene.state.page - 1].count--;

  sendCard(ctx, item);
});

scene.action("sum", async (ctx) => {
  ctx.answerCbQuery(ctx.getTitle("SUM")).catch(console.log);
});
scene.action("page", async (ctx) => {});

scene.action("next", async (ctx) => {
  const { order_id } = ctx.scene.state;

  if (ctx.scene.state.cart?.length <= ctx.scene.state.page)
    return ctx.answerCbQuery(ctx.getTitle("CANT_NEXT")).catch(console.log);

  ctx.scene.state.page++;

  const item = ctx.scene.state.cart?.[ctx.scene.state.page - 1];
  if (!item) return;

  ctx.answerCbQuery().catch(console.log);

  sendCard(ctx, item);
});

scene.action("previous", async (ctx) => {
  const { order_id } = ctx.scene.state;

  if (ctx.scene.state.page === 1)
    return ctx.answerCbQuery(ctx.getTitle("CANT_PREVIOUS")).catch(console.log);

  ctx.scene.state.page--;

  const item = ctx.scene.state.cart?.[ctx.scene.state.page - 1];
  if (!item) return;

  ctx.answerCbQuery().catch(console.log);

  sendCard(ctx, item);
});

scene.action("back", async (ctx) => {
  ctx.answerCbQuery().catch(console.log);

  const { item_id, category_id, subcategory_id } = ctx.scene.state;

  ctx.scene.enter("itemScene", {
    subcategory_id,
    item_id,
    category_id,
    edit: true,
  });
});

module.exports = scene;
