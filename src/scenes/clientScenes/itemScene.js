const {
  Telegraf,
  Composer,
  Scenes: { WizardScene },
} = require("telegraf");

const deleteHandler = new Composer(),
  cityNameHandler = new Composer(),
  confirmHandler = new Composer();

const scene = new WizardScene(
  "itemScene",
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
    category_id,
    subcategory_id,
    m1,
    m2,
    offset = 0,
  } = ctx.scene.state;

  const connection = await tOrmCon;

  ctx.scene.state.order_id = await getOrderId(connection, ctx.from?.id);

  console.log(ctx.scene.state.order_id);

  const itemsCount = (ctx.scene.state.itemsCount = (
    await connection
      .query("select count(*) count from items i where subcategory_id = $1", [
        subcategory_id,
      ])
      .catch((e) => {})
  )?.[0]?.count);

  if (!itemsCount) {
    ctx.replyWithTitle("NO_SUCH_ITEM");
    return ctx.scene.enter("catalogScene");
  }

  let osCalc = offset % ctx.scene.state.itemsCount;

  osCalc = osCalc < 0 ? parseInt(itemsCount) - 1 : osCalc;
  console.log("os", offset, itemsCount, osCalc);

  const item = (ctx.scene.state.item = (
    await connection
      .query(
        `select i.*, json_agg(p.photo) photos, CASE WHEN count.count is null THEN 0 ELSE count.count END AS count, subcategory_id
          from items i 
          left join photos p on p.item_id = i.id
          left join (select count, oi.item_id id from orders_items oi 
              left join orders o on (o.id = oi.order_id and o.user_id = oi.order_user_id) or oi.order_id is null
              where ((oi.order_id = $1 and oi.order_user_id = $2) or oi.order_id is null) and oi.item_id = $3 limit 1) count
          on count.id = i.id or count.id is null
          where subcategory_id = $3
    group by i.id,count.count
      limit 1 offset $4`,
        [ctx.scene.state.order_id, ctx.from?.id, subcategory_id, osCalc]
      )
      .catch((e) => {
        console.log(e);
        ctx.replyWithTitle("DB_ERROR");
      })
  )?.[0]);

  if (!ctx.scene.state.item) {
    ctx.replyWithTitle("NO_SUCH_ITEM");
    return ctx.scene.enter("catalogScene");
  }

  ctx.scene.state.countItems = ctx.scene.state.item?.count;

  const keyboard = {
    name: "item_keyboard",
    args: [ctx.scene.state.item.count, offset],
  };

  console.log(item.photos);

  item.photo = item?.photos?.pop();

  const { vendor_code, sizes, name, price, description } = item;

  const title = ctx.getTitle("ITEM_CARD", [
    vendor_code,
    name,
    price,
    sizes,
    description,
  ]);

  if (main_menu_button) await ctx.replyWithKeyboard("⚙️", main_menu_button);

  //if (edit && !item.photo) return ctx.editMenu(title, keyboard);

  if (m1) {
    await ctx.deleteMessage(m1).catch((e) => {
      console.log(e);
    });
  }
  if (m2) {
    for (mm of m2)
      await ctx.deleteMessage(mm).catch((e) => {
        console.log(e);
      });
  }

  let mp;
  mp = await ctx.telegram
    .sendMediaGroup(
      ctx.from.id,
      item.photos?.map((el) => {
        return { type: "photo", media: el };
      })
    )
    .catch(console.log);

  let m;

  m = await ctx
    .replyPhotoWithKeyboard(item.photo, title, keyboard)
    .catch(async (e) => {
      return await ctx
        .replyPhotoWithKeyboard(item.photo, title, keyboard)
        .catch(async (e) => {
          return await ctx.replyWithKeyboard(title, keyboard);
        });
    });

  ctx.scene.state.m1 = m?.message_id;
  ctx.scene.state.m2 = mp?.map((el) => el.message_id);

  console.log(ctx.scene.state.m1, mp);

  ////await ctx.replyWithPhoto(item.photo).catch(console.log);

  //ctx.replyWithKeyboard(title, keyboard);
});

scene.action(/get\_(.+)/g, async (ctx) => {
  await ctx.answerCbQuery().catch(console.log);

  const offset = ctx.match[1];

  const { subcategory_id, category_id, m1, m2, from_category } =
    ctx.scene.state;

  ctx.scene.enter("itemScene", {
    offset,
    subcategory_id,
    category_id,
    from_category,
    m1,
    m2,
    edit: true,
  });
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
    id = (await con.query("insert into orders (user_id) values($1)", [userId]))
      ?.insertId;

  return id;
}

scene.action("add_to_cart", async (ctx) => {
  const connection = await tOrmCon;

  ctx.scene.state.countItems = ctx.scene.state.countItems ?? 1;

  const queryRunner = connection.createQueryRunner();

  let id;
  try {
    await queryRunner.connect();

    id =
      ctx.scene.state.order_id ?? (await getOrderId(queryRunner, ctx.from?.id));

    if (!id) {
      ctx
        .answerCbQuery(ctx.getTitle("ITEM_HAS_NOT_BEEN_ADDED_TO_CART"))
        .catch(console.log);
      return ctx.scene.enter("catalogScene", {
        subcategory_id,
        category_id,
        edit: true,
      });
    }

    ctx.scene.state.order_id = id;

    const isAffected = await queryRunner.query(
      "insert into orders_items  as oi  (order_id, order_user_id, item_id) values($1,$2,$3) ON CONFLICT (order_id, order_user_id, item_id) DO UPDATE SET count = oi.count + 1;",
      [id, ctx.from?.id, ctx.scene.state.item.id]
    );

    if (!isAffected) {
      //throw new Error("NOT AFFECTED");
    }

    ctx
      .answerCbQuery(ctx.getTitle("ITEM_HAS_BEEN_ADDED_TO_CART"))
      .catch(console.log);

    ctx.scene.state.countItems++;
  } catch (e) {
    console.log(e);
    await queryRunner.rollbackTransaction();

    await ctx
      .answerCbQuery(ctx.getTitle("ITEM_HAS_NOT_BEEN_ADDED_TO_CART"))
      .catch(console.log);
    await ctx.scene.enter("catalogScene", {
      subcategory_id,
      category_id,
      edit: true,
    });
  } finally {
    await queryRunner.release();

    console.log(12, ctx.scene.state.countItems);
    const { subcategory_id, category_id, m1, m2, from_category, offset } =
      ctx.scene.state;

    ctx.scene.enter("itemScene", {
      offset,
      subcategory_id,
      category_id,
      from_category,
      m1,
      m2,
      edit: true,
    });
  }
});

async function deleteLast(ctx) {
  const {
    subcategory_id,
    category_id,
    subcategory_name,
    category_name,
    from_category,
    m1,
    m2,
  } = ctx.scene.state;

  if (m1) {
    await ctx.deleteMessage(m1).catch((e) => {
      console.log(e);
    });
  }
  if (m2) {
    for (mm of m2)
      await ctx.deleteMessage(mm).catch((e) => {
        console.log(e);
      });
  }
}

scene.action("go_to_cart", async (ctx) => {
  ctx.answerCbQuery().catch(console.log);

  const { item_id, category_id, subcategory_id, order_id } = ctx.scene.state;

  if (!order_id) return;

  await deleteLast(ctx);

  ctx.scene.enter("cartScene", {
    //edit: true,
    item_id,
    subcategory_id,
    category_id,
    order_id,
  });
});

scene.action("back", async (ctx) => {
  ctx.answerCbQuery().catch(console.log);

  const {
    subcategory_id,
    category_id,
    subcategory_name,
    category_name,
    from_category,
    m1,
    m2,
  } = ctx.scene.state;

  const params = from_category
    ? {}
    : {
        category_id,
        subcategory_name,
        category_name,
        //edit: true,
      };

  ctx.scene.enter("catalogScene", params);
});

module.exports = scene;
