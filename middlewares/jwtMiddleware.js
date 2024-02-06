const { expressjwt: jwt } = require("express-jwt");

const jwtMiddleware = jwt({ secret: "oussema-2024", algorithms: ["HS256"] });
module.exports = jwtMiddleware;
