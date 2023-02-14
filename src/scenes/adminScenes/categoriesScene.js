const {
  Telegraf,
  Composer,
  Scenes: { WizardScene, BaseScene },
} = require("telegraf");
const mediaGroup = require("telegraf-media-group");

const tOrmCon = require("../../db/connection");

const nameHandler = new Composer(),
  subCategoryHandler = new Composer(),
  itemHandler = new Composer();
const { CustomWizardScene } = require("telegraf-steps");
class FilesHandler extends Composer {
  constructor(confirmCb) {
    super();

    this.on("photo", (ctx) => inputFile(ctx, "photo"));

    //this.on("media_group", (ctx) => inputFile(ctx, "photo"));

    this.action("skip", async (ctx) => confirmCb(ctx));
  }
}

function inputFile(ctx, type) {
  const messages = ctx.mediaGroup ?? [ctx.message];

  console.log("mg", ctx.mediaGroup);

  for (mes of messages) {
    if (!type) type = mes.photo ? "photo" : mes.audio ? "audio" : "document";

    const file_id = mes[type]?.[0]?.file_id ?? mes[type]?.file_id;

    console.log(1, file_id, mes);

    if (!file_id) return ctx.replyWithTitle("TRY_AGAIN");

    if (!ctx.scene?.state?.input) ctx.scene.state.input = {};

    if (!ctx.scene.state.input?.[type + "s"])
      ctx.scene.state.input[type + "s"] = [];

    ctx.wizard.state.input?.[type + "s"].push(file_id);
  }

  if (
    !ctx.message.media_group_id ||
    ctx.scene.state.media_group_id !== ctx.message.media_group_id
  ) {
    ctx.scene.state.media_group_id = ctx.message.media_group_id;
    //ctx.wizard.state.input[type] = file_id;
    ctx.replyWithKeyboard("CONFIRM", {
      name: "custom_keyboard",
      args: [["CONFIRM"], ["skip"]],
    });
  }
}

nameHandler.on("text", (ctx) => {
  ctx.scene.state.input = { adding_name: ctx.message.text };
  if (ctx.scene.state.table === "category")
    ctx.replyStepByVariable("adding_category_description");
  else if (ctx.scene.state.table === "subcategory")
    ctx.replyWithKeyboard("CONFIRM", "confirm_keyboard");
  else ctx.replyStepByVariable("files");
});

const scene = new CustomWizardScene("categoriesScene")
  .addStep({
    variable: "adding_category_name",
    confines: ["string45"],
    handler: nameHandler,
  })
  .addStep({
    variable: "adding_category_description",
    confines: ["string1000"],
    cb: (ctx) => {
      ctx.wizard.state.input.adding_category_description = ctx.message.text;

      ctx.replyWithKeyboard("CONFIRM", "confirm_keyboard");
    },
  })
  .addStep({
    variable: "adding_subcategory_name",
    confines: ["string45"],
    handler: nameHandler,
  })
  .addStep({
    variable: "adding_name",
    confines: ["string45"],
    handler: nameHandler,
  })
  .addStep({
    variable: "files",
    type: "action",
    skipTo: "vendor_code",
    handler: new FilesHandler(async (ctx) => {
      ctx.answerCbQuery().catch(console.log);

      if (!ctx.scene.state.editStep) return ctx.replyNextStep();

      ctx.replyWithKeyboard(getUpdateHeader(ctx), "finish_updating_keyboard");
      ctx.wizard.selectStep(9);

      delete ctx.scene.state.editStep;
      delete ctx.scene.state.editHeaderFunc;
      delete ctx.scene.state.editKeyboard;
    }),
  })
  .addStep({ variable: "vendor_code", confines: ["string1000"] })
  .addStep({ variable: "adding_sizes", confines: ["string1000"] })
  .addStep({ variable: "adding_description", confines: ["string1000"] })
  .addStep({
    variable: "adding_price",
    confines: ["number"],
    cb: async (ctx) => {
      if (parseInt(ctx.message.text) != ctx.message.text)
        return ctx.replyWithTitle("ENTER_ADDING_PRICE");
      if (!ctx.wizard.state.input) ctx.wizard.state.input = {};

      ctx.wizard.state.input.adding_price = ctx.message.text;

      ctx.replyWithKeyboard(getUpdateHeader(ctx), "finish_updating_keyboard");
      ctx.wizard.selectStep(ctx.wizard.cursor + 1);

      delete ctx.scene.state.editStep;
      delete ctx.scene.state.editHeaderFunc;
      delete ctx.scene.state.editKeyboard;
    },
  })
  .addSelect({
    variable: "finish_updating",
    options: {
      "Сохранить изменения": "send",
      "Изменить поле имя": "adding_name",
      "Изменить превью": "files",
      "Изменить артикул": "vendor_code",
      "Изменить описание": "adding_description",
      "Изменить размеры": "adding_sizes",
      "Изменить цену": "adding_price",
    },
    cb: async (ctx) => {
      await ctx.answerCbQuery().catch((e) => {});

      const action = ctx.match[0];

      if (action !== "send") {
        if (action === "files") delete ctx.wizard.state.input.photo;
        await ctx.replyStepByVariable(action);

        return ctx.setEditStep(9, getUpdateHeader, "finish_updating_keyboard");
      }

      ctx.scene.state.table = "item";

      await confirmAction(ctx);
    },
  });

function getUpdateHeader(ctx) {
  const {
    adding_name,
    photo,
    adding_description,
    adding_sizes,
    vendor_code,
    adding_link,
    adding_price,
  } = ctx.wizard.state.input ?? {};

  ctx.replyWithPhoto(photo).catch((e) => {});

  return ctx.getTitle("ITEM_CARD", [
    vendor_code,
    adding_name, //?.toUpperCase(),
    adding_price,
    adding_sizes,
    adding_description,
  ]);
}

async function getCategories() {
  const connection = await tOrmCon;

  return await connection
    .query(
      `select *
    from categories c`
    )
    .catch((e) => {
      console.log(e);
    });
}

async function getItems(subCategoryId) {
  const connection = await tOrmCon;

  return await connection
    .query(
      `select i.id, i.name
    from items i where i.subcategory_id = $1`,
      [subCategoryId]
    )
    .catch((e) => {
      console.log(e);
    });
}

async function getSubCategories(categoryId) {
  const connection = await tOrmCon;

  return await connection
    .query(
      `select *
     from subcategories c where category_id = $1`,
      [categoryId]
    )
    .catch((e) => {
      console.log(e);
    });
}

scene.enter(async (ctx) => {
  const { edit, category_id, subcategory_id, category_name, subcategory_name } =
    ctx.scene.state;
  let keyboard;
  let title;
  if (subcategory_id) {
    console.log(subcategory_id, subcategory_name);
    ctx.scene.state.items =
      ctx.scene.state.items ?? (await getItems(subcategory_id));
    ctx.scene.state.subcategory_name =
      subcategory_name ??
      ctx.scene.state.subcategories.find((el) => {
        return el.id === parseInt(ctx.match[1]);
      })?.name;

    keyboard = {
      name: "categories_list_admin_keyboard",
      args: [ctx.scene.state.items, "item", subcategory_id],
    };
    title = ctx.getTitle("CHOOSE_ITEM", [
      category_name ?? "",
      ctx.scene.state.subcategory_name ?? "",
    ]);
  } else if (category_id) {
    ctx.scene.state.subcategories =
      ctx.scene.state.subcategories ?? (await getSubCategories(category_id));

    keyboard = {
      name: "categories_list_admin_keyboard",
      args: [ctx.scene.state.subcategories, "subcategory", category_id],
    };
    title = ctx.getTitle("CHOOSE_SUBCATEGORY", [category_name ?? ""]);
    console.log(
      ctx.scene.state.subcategories?.length,
      ctx.scene.state.subcategories
    );
  } else {
    ctx.scene.state.categories =
      ctx.scene.state.categories ?? (await getCategories());
    keyboard = {
      name: "categories_list_admin_keyboard",
      args: [ctx.scene.state.categories, "category"],
    };
    title = ctx.getTitle("CHOOSE_CATEGORY");
  }

  console.log(edit, title, keyboard);
  if (edit) return ctx.editMenu(title, keyboard);

  await ctx.replyWithKeyboard("⚙️", "admin_back_keyboard");
  ctx.replyWithKeyboard(title, keyboard);
});

scene.action(/^delete\-(category|item|subcategory)\-([0-9]+)$/g, (ctx) => {
  ctx.scene.state.action = "delete";
  ctx.scene.state.table = ctx.match[1];
  ctx.scene.state.selected_item = ctx.match[2];

  ctx.replyWithKeyboard("CONFIRM_DELETE", "confirm_keyboard");
});

scene.action(/^edit\-(category|subcategory)\-([0-9]+)$/g, (ctx) => {
  ctx.scene.state.action = "edit";
  ctx.scene.state.table = ctx.match[1];
  ctx.scene.state.selected_item = ctx.match[2];
  if (ctx.match[1] === "item") {
    ctx.replyStepByVariable("adding_name");
    ctx.scene.state.reference_id = ctx.scene.state.subcategory_id;
  } else if (ctx.match[1] === "subcategory") {
    ctx.replyStepByVariable("adding_subcategory_name");
    ctx.scene.state.reference_id = ctx.scene.state.category_id;
  } else ctx.replyStepByVariable("adding_category_name");
});

scene.action(/^edit\-(item)\-(.+)$/g, (ctx) => {
  ctx.answerCbQuery().catch(console.log);

  ctx.scene.state.table = ctx.match[1];
  ctx.scene.state.reference_id = ctx.match[2];
  ctx.scene.state.selected_item = ctx.match[2];
  ctx.scene.state.action = "edit";

  const {
    name: adding_name,
    photo,
    description: adding_description,
    sizes: adding_sizes,
    vendor_code,
    link: adding_link,
    price: adding_price,
  } = ctx.scene.state.item;

  ctx.scene.state.input = {
    adding_name,
    photo,
    adding_description,
    adding_sizes,
    vendor_code,
    adding_link,
    adding_price,
  };

  console.log(ctx.scene.state.input, ctx.scene.state.item);

  ctx.replyWithKeyboard(getUpdateHeader(ctx), "finish_updating_keyboard");
  ctx.wizard.selectStep(9);
});

scene.action(/^add\-(category|item|subcategory)\-([0-9]+)$/g, (ctx) => {
  console.log(222);
  ctx.scene.state.action = "add";
  ctx.scene.state.table = ctx.match[1];
  ctx.scene.state.reference_id = ctx.match[2];
  if (ctx.match[1] === "item") {
    ctx.replyStepByVariable("adding_name");
  } else if (ctx.match[1] === "subcategory") {
    ctx.replyStepByVariable("adding_subcategory_name");
  } else ctx.replyStepByVariable("adding_category_name");
});

async function confirmAction(ctx) {
  const connection = await tOrmCon;

  const { action, table, selected_item, reference_id } = ctx.scene.state;

  const {
    adding_name,
    adding_description,
    adding_category_description,
    adding_sizes,
    vendor_code,
    adding_price,
    photos,
  } = ctx.scene.state.input ?? {};

  console.log("fin", ctx.scene.state.input, action, table);
  switch (action) {
    case "delete": {
      async function deleteAction(query) {
        const res = await connection
          .query(query, [selected_item])
          .catch((e) => {
            console.log(e);
          });

        if (!res?.affectedRows) {
          return ctx
            .answerCbQuery(ctx.getTitle("NOT_AFFECTED"))
            .catch(console.log);
        }
        return ctx.answerCbQuery(ctx.getTitle("AFFECTED")).catch(console.log);
      }

      switch (table) {
        case "subcategory": {
          await deleteAction(`delete from  subcategories where id = $1`);
          break;
        }
        case "category": {
          await deleteAction(`delete from  categories where id = $1`);
          break;
        }
        case "item": {
          await deleteAction(`delete from  items where id = $1`);
          break;
        }
      }
      break;
    }
    case "add": {
      async function addAction(query, args) {
        const res = await connection.query(query, args).catch((e) => {
          console.log(e);
        });

        if (!res) {
          ctx.answerCbQuery(ctx.getTitle("NOT_AFFECTED")).catch(console.log);
        } else
          await ctx.answerCbQuery(ctx.getTitle("AFFECTED")).catch(console.log);
        return res;
      }
      switch (table) {
        case "subcategory": {
          await addAction(
            `insert into subcategories (name, category_id) values ($1,$2)`,
            [adding_name, reference_id]
          );
          break;
        }
        case "category": {
          await addAction(
            `insert into categories (name, description) values ($1,$2)`,
            [adding_name, adding_category_description]
          );
          break;
        }
        case "item": {
          const connection = await tOrmCon;

          const queryRunner = connection.createQueryRunner();

          try {
            await queryRunner.connect();

            const id = (
              await addAction(
                `insert into items (name, subcategory_id, vendor_code, price, photo, description) values ($1,$2,$3,$4,$5,$6) returning id`,
                [
                  adding_name,
                  reference_id,
                  vendor_code,
                  adding_price,
                  photos[0],
                  adding_description,
                ]
              )
            )?.[0]?.id;

            console.log(id);

            for (p of photos) {
              await connection.query(
                "insert into photos (photo, item_id) values ($1,$2)",
                [p, id]
              );
            }
          } catch {
            async (e) => {
              console.log(e);
              await queryRunner.rollbackTransaction();
            };
          } finally {
            async (res) => {
              await queryRunner.release();
            };
          }

          break;
        }
      }
      break;
    }
    case "edit": {
      async function editAction(query, args) {
        const res = await connection.query(query, args).catch((e) => {
          console.log(e);
        });

        if (!res?.affectedRows) {
          return ctx
            .answerCbQuery(ctx.getTitle("NOT_AFFECTED"))
            .catch(console.log);
        }
        await ctx.answerCbQuery(ctx.getTitle("AFFECTED")).catch(console.log);
        return res?.insertId;
      }
      switch (table) {
        case "subcategory": {
          await editAction(`update subcategories set name = $1 where id = $2`, [
            adding_name,
            selected_item,
          ]);
          break;
        }
        case "category": {
          await editAction(
            `update categories set name = $1, description = $3 where id = $2`,
            [adding_name, selected_item, adding_category_description]
          );
          break;
        }
        case "item": {
          const connection = await tOrmCon;

          const queryRunner = connection.createQueryRunner();
          try {
            await queryRunner.connect();

            await connection.query(
              `update items set name=$1, id=$2, vendor_code=$3, price=$4, photo = $5, sizes=$6, description = $7 where id = $2`,
              [
                adding_name,
                selected_item,
                vendor_code,
                adding_price,
                ctx.scene.state.item.photo,
                adding_sizes,
                adding_description,
              ]
            );

            if (photos?.length) {
              await connection.query("delete from photos where item_id = $1", [
                selected_item,
              ]);

              for (p of photos) {
                await connection.query(
                  "insert into photos (photo, item_id) values ($1,$2)",
                  [p, selected_item]
                );
              }
            }
          } catch (e) {
            console.log(e);
            await queryRunner.rollbackTransaction();
          } finally {
            await queryRunner.release();

            break;
          }
        }
      }
      break;
    }
  }

  delete ctx.scene.state.action,
    ctx.scene.state.table,
    ctx.scene.state.selected_item,
    ctx.scene.state.input,
    ctx.scene.state.reference_id,
    ctx.scene.state.categories,
    ctx.scene.state.subcategories,
    ctx.scene.state.items;

  ctx.scene.enter("categoriesScene");
}

scene.action("confirm", async (ctx) => {
  await confirmAction(ctx);
});

scene.action(/^category\-([0-9]+)$/g, async (ctx) => {
  ctx.answerCbQuery().catch(console.log);
  const category_id = ctx.match[1];

  const category_name = ctx.scene.state.categories.find(
    (el) => el.id === parseInt(ctx.match[1])
  )?.name;

  ctx.scene.enter("categoriesScene", {
    edit: true,
    category_id,
    category_name,
    categories: ctx.scene.state.categories,
  });
});

scene.action(/^subcategory\-([0-9]+)$/g, async (ctx) => {
  ctx.answerCbQuery().catch(console.log);

  ctx.scene.state.subcategory_id = ctx.match[1];
  const subcategory_name = ctx.scene.state.subcategories.find((el) => {
    return el.id === parseInt(ctx.match[1]);
  })?.name;

  console.log(
    1,
    ctx.scene.state.subcategories.find((el) => {
      return el.id === parseInt(ctx.match[1]);
    })?.name,
    subcategory_name
  );

  return ctx.scene.reenter({
    edit: true,
    category_id: ctx.scene.state.category_id,
    subcategories: ctx.scene.state.subcategories,
    category_name: ctx.scene.state.category_name,
    subcategory_name: subcategory_name,
    subcategory_id: ctx.scene.state.subcategory_id,
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

scene.action(/^item\-([0-9]+)$/g, async (ctx) => {
  ctx.answerCbQuery().catch(console.log);
  const { subcategory_id, category_id, subcategory_name, category_name } =
    ctx.scene.state;

  const item_id = ctx.match[1];

  const connection = await tOrmCon;

  ctx.scene.state.order_id = await getOrderId(connection, ctx.from?.id);

  const item = (ctx.scene.state.item = (
    await connection
      .query(
        `select i.*, CASE WHEN count.count is null THEN 0 ELSE count.count END AS count, subcategory_id
        from items i 
        left join (select count, oi.item_id id from orders_items oi 
            left join orders o on (o.id = oi.order_id and o.user_id = oi.order_user_id) or oi.order_id is null
            where ((oi.order_id =$1 and oi.order_user_id = $2) or oi.order_id is null) and oi.item_id = $3 limit 1) count
        on count.id = i.id or count.id is null
        where i.id = $4
    limit 1`,
        [ctx.scene.state.order_id, ctx.from?.id, item_id, item_id]
      )
      .catch((e) => {
        console.log(e);
        ctx.replyWithTitle("DB_ERROR");
      })
  )?.[0]);

  if (!ctx.scene.state.item) {
    ctx.replyWithTitle("NO_SUCH_ITEM");
    delete ctx.scene.state;
    return ctx.scene.enter("adminScene", { edit: true });
  }

  const keyboard = { name: "item_keyboard_admin", args: [item_id] };

  const { vendor_code, sizes, name, price, description } = item;

  const title = ctx.getTitle("ITEM_CARD", [
    vendor_code,
    name,
    price,
    sizes,
    description,
  ]);

  return ctx.editMenu(title, keyboard);
});

scene.action("back", async (ctx) => {
  ctx.answerCbQuery().catch(console.log);

  if (ctx.scene.state.subcategory_id) {
    delete ctx.scene.state.subcategory_id,
      ctx.scene.state.items,
      ctx.scene.state.subcategory_name;
    ctx.scene.enter("categoriesScene", {
      edit: true,
      category_id: ctx.scene.state.category_id,
      subcategories: ctx.scene.state.subcategories,
      category_name: ctx.scene.state.category_name,
    });
  } else if (ctx.scene.state.category_id) {
    delete ctx.scene.state;
    ctx.scene.enter("categoriesScene", { edit: true });
  }
});

module.exports = scene;
