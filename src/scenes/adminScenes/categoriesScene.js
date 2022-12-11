const {
  Telegraf,
  Composer,
  Scenes: { WizardScene, BaseScene },
} = require("telegraf");
const moment = require("moment");
const nameHandler = new Composer(),
  linkHandler = new Composer(),
  itemHandler = new Composer();
const { CustomWizardScene } = require("telegraf-steps");
class FilesHandler extends Composer {
  constructor(confirmCb) {
    super();

    this.on("photo", (ctx) => inputFile(ctx, "photo"));

    this.action("skip", async (ctx) => confirmCb(ctx));
  }
}
const tOrmCon = require("../../db/connection");

function inputFile(ctx, type) {
  if (!type)
    type = ctx.message?.photo
      ? "photo"
      : ctx.message?.audio
      ? "audio"
      : "document";

  const file_id =
    ctx.message?.[type]?.[0]?.file_id ?? ctx.message?.[type]?.file_id;

  console.log(1, file_id, ctx.message);

  if (!file_id) return ctx.replyWithTitle("TRY_AGAIN");

  if (!ctx.scene?.state?.input) ctx.scene.state.input = {};

  if (!ctx.scene.state.input?.[type + "s"])
    ctx.scene.state.input[type + "s"] = [];

  //ctx.wizard.state.input?.[type+"s"].push(file_id)

  ctx.wizard.state.input[type] = file_id;
  ctx.replyWithKeyboard("CONFIRM", {
    name: "custom_keyboard",
    args: [["CONFIRM"], ["skip"]],
  });
}

nameHandler.on("text", (ctx) => {
  ctx.scene.state.input = { adding_name: ctx.message.text };
  ctx.replyStepByVariable("files");
});

linkHandler.on("text", (ctx) => {
  ctx.scene.state.input.adding_link = ctx.message.text;
  if (ctx.scene.state.table !== "item")
    ctx.replyWithKeyboard("CONFIRM", "confirm_keyboard");
  else ctx.replyStepByVariable("adding_price");
});

const scene = new CustomWizardScene("categoriesScene")
  .addStep({
    variable: "adding_category_name",
    confines: ["string45"],
    handler: nameHandler,
  })
  .addStep({
    variable: "adding_subcategory_name",
    confines: ["string45"],
    //handler: nameHandler,
  })
  .addStep({
    variable: "adding_name",
    confines: ["string45"],
    handler: nameHandler,
  })
  .addStep({
    variable: "files",
    type: "action",
    skipTo: "adding_description",
    handler: new FilesHandler(async (ctx) => {
      ctx.answerCbQuery().catch(console.log);

      ctx.replyNextStep();
    }),
  })
  .addStep({ variable: "adding_description", confines: ["string1000"] })
  .addStep({ variable: "adding_sizes", confines: ["string1000"] })
  .addStep({ variable: "vendor_code", confines: ["string1000"] })
  .addStep({ variable: "adding_link", handler: linkHandler })
  .addStep({ variable: "adding_price", confines: ["number"], type: "confirm" });

scene.enter(async (ctx) => {
  const { edit, offset = 0, category_id, category_name } = ctx.scene.state;
  const perPage = 10;
  let keyboard;
  let title;
  if (category_id) {
    console.log(category_id, category_name);
    ctx.scene.state.items =
      ctx.scene.state.items ?? (await getItems(category_id, offset, perPage));
    ctx.scene.state.category_name =
      category_name ??
      ctx.scene.state.categories?.find((el) => {
        return el.id === parseInt(ctx.match[1]);
      })?.name;

    keyboard = {
      name: "categories_list_admin_keyboard",
      args: [ctx.scene.state.items, "item", category_id, offset],
    };
    title = ctx.getTitle("CHOOSE_ITEM", [
      category_name ?? "",
      ctx.scene.state.category_name ?? "",
    ]);
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

scene.action(/^delete\-(category|item)\-(.+)$/g, (ctx) => {
  ctx.answerCbQuery().catch(console.log);

  ctx.scene.state.action = "delete";
  ctx.scene.state.table = ctx.match[1];
  ctx.scene.state.selected_item = ctx.match[2];

  ctx.replyWithKeyboard("CONFIRM_DELETE", "confirm_keyboard");
});

scene.action(/^edit\-(category|item)\-(.+)$/g, (ctx) => {
  ctx.answerCbQuery().catch(console.log);

  ctx.scene.state.action = "edit";
  ctx.scene.state.table = ctx.match[1];
  ctx.scene.state.selected_item = ctx.match[2];
  if (ctx.match[1] === "item") {
    ctx.replyStep(2);
    ctx.scene.state.reference_id = ctx.scene.state.subcategory_id;
  } else if (ctx.match[1] === "subcategory") {
    ctx.replyStep(1);
    ctx.scene.state.reference_id = ctx.scene.state.category_id;
  } else ctx.replyStep(0);
});

scene.action(/^add\-(category|item)\-(.+)$/g, (ctx) => {
  ctx.answerCbQuery().catch(console.log);

  ctx.scene.state.action = "add";
  ctx.scene.state.table = ctx.match[1];
  ctx.scene.state.reference_id = ctx.match[2];
  if (ctx.match[1] === "item") {
    ctx.replyStep(2);
  } else if (ctx.match[1] === "subcategory") {
    ctx.replyStep(1);
  } else ctx.replyStep(0);
});

scene.action("confirm", async (ctx) => {
  const connection = await tOrmCon;

  const { action, table, selected_item, reference_id } = ctx.scene.state;
  const {
    adding_name,
    adding_description,
    adding_sizes,
    vendor_code,
    adding_link,
    adding_price,
    photo,
  } = ctx.scene.state.input ?? {};
  switch (action) {
    case "delete": {
      async function deleteAction(query) {
        const res = await connection
          .query(query, [selected_item])
          .catch((e) => {
            console.log(e);
          });

        if (!res) {
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
          return ctx
            .answerCbQuery(ctx.getTitle("NOT_AFFECTED"))
            .catch(console.log);
        }
        await ctx.answerCbQuery(ctx.getTitle("AFFECTED")).catch(console.log);
        return res?.insertId;
      }
      switch (table) {
        case "subcategory": {
          await addAction(
            `insert into subcategories (name, categoryId) values ($1,$2)`,
            [adding_name, reference_id]
          );
          break;
        }
        case "category": {
          await addAction(
            `insert into categories (name, description, instruction,link, photo) values ($1,$2,$3,$4,$5)`,
            [
              adding_name,
              adding_description,
              adding_sizes,
              vendor_code,
              adding_link,
              photo,
            ]
          );
          break;
        }
        case "item": {
          await addAction(
            `insert into items 
            (name, category_name, description, sizes, vendor_code,link, price, photo) values ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
              adding_name,
              reference_id,
              adding_description,
              adding_sizes,
              vendor_code,
              adding_link,
              adding_price,
              photo,
            ]
          );
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

        if (!res) {
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
            `update categories set name = $1, description=$2, sizes=$3, vendor_code=$4, link=$5, photo = $6 where id = $7`,
            [
              adding_name,
              adding_description,
              adding_sizes,
              vendor_code,
              adding_link,
              photo,
              selected_item,
            ]
          );
          break;
        }
        case "item": {
          await editAction(
            `update items set name=$1, id=$2, description=$3, sizes=$4, vendor_code=$5, link=$6, price=$7, photo = $8 where id = $9`,
            [
              adding_name,
              selected_item,
              adding_description,
              adding_sizes,
              vendor_code,
              adding_link,
              adding_price,
              photo,
              selected_item,
            ]
          );
          break;
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
});

scene.action(/get\_(.+)\_(.+)/g, async (ctx) => {
  await ctx.answerCbQuery().catch(console.log);

  const offset = ctx.match[2];
  const category_id = ctx.match[1];

  console.log("get", offset, category_id);

  const category_name = category_id;

  if (offset < 0) return;

  ctx.scene.enter("categoriesScene", {
    edit: true,
    category_id,
    category_name,
    categories: ctx.scene.state.categories,
    offset,
  });
});

scene.action(/^category\-(.+)$/g, async (ctx) => {
  await ctx.answerCbQuery().catch(console.log);
  const category_id = ctx.match[1];

  const category_name = category_id;

  ctx.scene.enter("categoriesScene", {
    edit: true,
    category_id,
    category_name,
    categories: ctx.scene.state.categories,
  });
});

scene.action(/^subcategory\-(.+)$/g, async (ctx) => {
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

scene.action(/^item\-([0-9]+)$/g, async (ctx) => {
  ctx.answerCbQuery().catch(console.log);
  const { subcategory_id, category_id, subcategory_name, category_name } =
    ctx.scene.state;

  const item_id = (ctx.scene.state.item_id = ctx.match[1]);

  const connection = await tOrmCon;

  const item = (ctx.scene.state.item = (
    await connection
      .query(`select * from items where id = $1`, [item_id])
      .catch((e) => {
        console.log(e);
        ctx.replyWithTitle("DB_ERROR");
      })
  )?.[0]);

  if (!ctx.scene.state.item) {
    ctx.replyWithTitle("NO_SUCH_ITEM");
    delete ctx.scene.state;
    ctx.scene.enter("catalogScene", { edit: true });
  }

  const keyboard = { name: "item_keyboard_admin", args: [item_id] };

  await ctx.replyWithPhoto(item.photo).catch((e) => {});

  const title = ctx.getTitle("ITEM_CARD", [
    item.name?.toUpperCase(),
    item.description,
    item.price,
    item.sizes,
    item.vendor_code,
    item.link,
  ]);

  return ctx.replyWithKeyboard(title, keyboard);
});

scene.action("back", async (ctx) => {
  ctx.answerCbQuery().catch(console.log);

  if (ctx.scene.state.item_id) {
    delete ctx.scene.state;
    ctx.scene.enter("categoriesScene", {
      //edit: true,
      category_name: ctx.scene.state.category_name,
      category_id: ctx.scene.state.category_id,
      offset: ctx.scene.state.offset,
    });
  } else if (ctx.scene.state.category_id) {
    delete ctx.scene.state;
    ctx.scene.enter("categoriesScene", { edit: true });
  }
});

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

async function getItems(category_name, offset, perPage) {
  const connection = await tOrmCon;

  return await connection
    .query(
      `select *
      from items where category_name = $1 order by id DESC limit $2 offset $3`,
      [category_name, perPage, offset * perPage]
    )
    .catch((e) => {
      console.log(e);
    });
}

module.exports = scene;
