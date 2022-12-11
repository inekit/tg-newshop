var EntitySchema = require("typeorm").EntitySchema;

module.exports = new EntitySchema({
  name: "Category",
  tableName: "categories",
  columns: {
    name: {
      primary: true,
      type: "varchar",
      length: 255,
      nullable: false,
    },
  },
});
