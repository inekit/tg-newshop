const tOrmCon = require("../db/connection");

module.exports = async function getUser(ctx) {
  const connection = await tOrmCon;

  let userObj = await connection
    .query(
      `SELECT u.id,user_id, u.username
          FROM users u left join admins a on a.user_id = u.id 
        where u.id = $1
          limit 1`,
      [ctx.from?.id]
    )
    .catch((e) => {
      console.log(e);
      ctx.replyWithTitle("DB_ERROR");
    });

  return userObj?.[0];
};
