console.log("MAIN.TS STARTED");
import "dotenv/config";
import { initApp } from "../src/service/server";
import { config } from "../src/config/config";



const app = initApp();
console.log("PORT FROM CONFIG =", config.application.port);
app.listen(config.application.port);