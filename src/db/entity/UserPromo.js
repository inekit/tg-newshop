var EntitySchema = require("typeorm").EntitySchema;

module.exports = new EntitySchema({
  name: "UserPromo",
  tableName: "users_promos",
  columns: {
    user_id: {
      type: "bigint",
      nullable: false,
      primary: true,
    },
    promo_code: {
      type: "varchar",
      nullable: false,
      primary: true,
    },
    used: {
      type: "boolean",
      nullable: false,
    },
  },
  relations: {
    user: {
      target: "User",
      type: "one-to-many",
      cascade: true,
      joinColumn: true,
      onDelete: "cascade",
      onUpdate: "cascade",
    },
    promo: {
      target: "Promo",
      type: "one-to-many",
      cascade: true,
      joinColumn: true,
      onDelete: "cascade",
      onUpdate: "cascade",
    },
  },
});
