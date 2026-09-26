// Loaded before the tests (see "test" in package.json).
import { register } from "node:module";

register("./resolve-hooks.mjs", import.meta.url);
