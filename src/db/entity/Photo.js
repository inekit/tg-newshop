var EntitySchema = require("typeorm").EntitySchema;

module.exports = new EntitySchema({
  name: "Photo",
  tableName: "photos",
  columns: {
    photo: {
      type: "varchar",
      length: 255,
      primary: true,
    },
    item_id: {
      type: "int",
      primary: true,
      nullable: false,
    },
  },
  relations: {
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
