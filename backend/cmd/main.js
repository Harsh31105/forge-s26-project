"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const server_1 = require("../src/service/server");
const config_1 = require("../src/config/config");
const app = (0, server_1.initApp)();
app.listen(config_1.config.application.port);
//# sourceMappingURL=main.js.map