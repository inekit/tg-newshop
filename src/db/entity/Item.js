var EntitySchema = require("typeorm").EntitySchema;

module.exports = new EntitySchema({
  name: "Item",
  tableName: "items",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    name: {
      type: "varchar",
      length: 1000,
      nullable: true,
    },
    description: {
      type: "varchar",
      length: 1000,
      nullable: true,
    },
    price: {
      type: "int",
      nullable: false,
    },
    photo: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    sizes: {
      type: "varchar",
      length: 1000,
      nullable: true,
    },
    link: {
      type: "varchar",
      length: 1000,
      nullable: true,
    },
    vendor_code: {
      type: "varchar",
      length: 1000,
      nullable: true,
    },
    category_name: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
  },
  relations: {
    category: {
      target: "Category",
      type: "one-to-many",
      cascade: true,
      joinColumn: true,
      onDelete: "cascade",
      onUpdate: "cascade",
    },
  },
});
