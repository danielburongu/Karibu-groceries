const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Karibu Groceries API",
      version: "1.0.0",
      description: "Enterprise RBAC API for Karibu Groceries internal system",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local Development",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  apis: ["./src/routes/*.js"], // auto-scan route files
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
