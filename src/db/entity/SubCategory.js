var EntitySchema = require("typeorm").EntitySchema;

module.exports = new EntitySchema({
  name: "SubCategory",
  tableName: "subcategories",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    name: {
      type: "varchar",
      length: 200,
      unique: true,
    },
    category_id: {
      type: "int",
      nullable: false,
    },
  },
  relations: {
    category: {
      target: "Category",
      type: "many-to-one",
      cascade: true,
      joinColumn: true,
      onDelete: "cascade",
      onUpdate: "cascade",
    },
  },
});
