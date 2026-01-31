import { initApp } from "../src/service/server";
import { config } from "config/config";

const app = initApp();
app.listen(config.application.port);