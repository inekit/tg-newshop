var EntitySchema = require("typeorm").EntitySchema;

module.exports = new EntitySchema({
  name: "Order",
  tableName: "orders",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    user_id: {
      primary: true,
      type: "bigint",
      nullable: false,
    },
    phone: {
      type: "varchar",
      length: 45,
      nullable: true,
    },
    address: {
      type: "varchar",
      length: 400,
      nullable: true,
    },
    status: {
      type: "enum",
      enum: ["created", "ordered", "paid", "finished"],
      default: "created",
    },
    order_date: {
      type: "date",
      nullable: true,
    },
  },
  relations: {
    user: {
      target: "User",
      type: "many-to-one",
      cascade: true,
      joinColumn: true,
      onDelete: "cascade",
      onUpdate: "cascade",
    },
  },
});
