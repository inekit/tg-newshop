var EntitySchema = require("typeorm").EntitySchema;

module.exports = new EntitySchema({
  name: "Item",
  tableName: "items",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    name: {
      type: "varchar",
      length: 45,
      nullable: false,
    },
    vendor_code: {
      type: "varchar",
      length: 1000,
      default: "",
    },
    price: {
      type: "int",
      nullable: false,
    },
    sizes: {
      type: "varchar",
      length: 1000,
      default: "1",
      nullable: false,
    },
    subcategory_id: {
      type: "int",
      nullable: false,
    },
    description: {
      type: "varchar",
      length: 1000,
      default: "",
    },
    photo: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
  },
  relations: {
    subcategory: {
      target: "SubCategory",
      type: "many-to-one",
      cascade: true,
      joinColumn: true,
      onDelete: "cascade",
      onUpdate: "cascade",
    },
  },
});
