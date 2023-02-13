var EntitySchema = require("typeorm").EntitySchema;

module.exports = new EntitySchema({
  name: "OrderItems",
  tableName: "orders_items",
  columns: {
    order_id: {
      primary: true,
      type: "int",
      nullable: false,
    },
    order_user_id: {
      primary: true,
      type: "bigint",
      nullable: false,
    },
    item_id: {
      type: "int",
      primary: true,
      nullable: false,
    },
    count: {
      type: "int",
      nullable: false,
      default: 1,
    },
  },
  relations: {
    order: {
      target: "Order",
      type: "many-to-one",
      cascade: true,
      joinColumn: true,
      onDelete: "cascade",
      onUpdate: "cascade",
    },
    item: {
      target: "Item",
      type: "many-to-one",
      cascade: true,
      joinColumn: true,
      onDelete: "cascade",
      onUpdate: "cascade",
    },
  },
});
