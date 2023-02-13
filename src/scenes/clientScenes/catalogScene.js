const {
  Telegraf,
  Composer,
  Scenes: { WizardScene, BaseScene },
} = require("telegraf");

const scene = new BaseScene("catalogScene");

const tOrmCon = require("../../db/connection");

async function getCategories() {
  const connection = await tOrmCon;

  return await connection
    .query(
      `select c.*, count(i.id)
    from categories c 
    left join subcategories sc on sc.category_id = c.id 
    left join items i on i.subcategory_id = sc.id 
    group by c.id,c.*`
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
      `select sc.*, count(i.id)
     from subcategories sc     
     left join items i on i.subcategory_id = sc.id 
     where category_id = $1
     group by sc.id,sc.*`,
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
      name: "categories_list_keyboard",
      args: [ctx.scene.state.items, "item"],
    };
    title = ctx.getTitle("CHOOSE_ITEM", [
      category_name ?? "",
      ctx.scene.state.subcategory_name ?? "",
    ]);
    if (!ctx.scene.state.items?.length) {
      await ctx.replyWithTitle("NO_ITEMS_ADDED");
      return ctx.scene.enter("clientScene");
    }
  } else if (category_id) {
    ctx.scene.state.subcategories =
      ctx.scene.state.subcategories ?? (await getSubCategories(category_id));

    keyboard = {
      name: "categories_list_keyboard",
      args: [ctx.scene.state.subcategories, "subcategory"],
    };
    title = ctx.getTitle("CHOOSE_SUBCATEGORY", [category_name ?? ""]);
    console.log(
      ctx.scene.state.subcategories?.length,
      ctx.scene.state.subcategories
    );
    if (!ctx.scene.state.subcategories?.length) {
      await ctx.replyWithTitle("NO_SUBCATEGORIES_ADDED");
      return ctx.scene.enter("clientScene");
    }

    if (ctx.scene.state.subcategories?.length === 1) {
      const subcategory_id = ctx.scene.state.subcategories[0].id;
      const item_id = (await getItems(subcategory_id))?.[0]?.id;
      console.log(subcategory_id, item_id);
      return ctx.scene.enter("itemScene", {
        item_id,
        subcategory_id,
        category_id,
        subcategory_name: ctx.scene.state.subcategories[0].name,
        category_name,
        from_category: true,
        edit: true,
      });
    }
  } else {
    ctx.scene.state.categories =
      ctx.scene.state.categories ?? (await getCategories());
    keyboard = {
      name: "categories_list_keyboard",
      args: [ctx.scene.state.categories, "category"],
    };
    title = ctx.getTitle("CHOOSE_CATEGORY");
    if (!ctx.scene.state.categories?.length) {
      return await ctx.replyWithTitle("NO_CATEGORIES_ADDED");
    }
  }

  if (edit) return ctx.editMenu(title, keyboard);

  await ctx.replyWithKeyboard("⚙️", "main_menu_back_keyboard");
  ctx.replyWithKeyboard(title, keyboard);
});

scene.action(/^category\-([0-9]+)$/g, async (ctx) => {
  ctx.answerCbQuery().catch(console.log);
  const category_id = ctx.match[1];

  const category_name = ctx.scene.state.categories.find(
    (el) => el.id === parseInt(ctx.match[1])
  )?.name;

  ctx.scene.enter("catalogScene", {
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

  const { subcategory_id, category_id, category_name } = ctx.scene.state;

  ctx.scene.enter("itemScene", {
    subcategory_id,
    category_id,
    subcategory_name,
    category_name,
    edit: true,
  });
});

scene.action(/^item\-([0-9]+)$/g, async (ctx) => {
  ctx.answerCbQuery().catch(console.log);
  const { subcategory_id, category_id, subcategory_name, category_name } =
    ctx.scene.state;

  console.log(category_name, ctx.match[1]);
  ctx.scene.enter("itemScene", {
    item_id: ctx.match[1],
    subcategory_id,
    category_id,
    subcategory_name,
    category_name,
    edit: true,
  });
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
