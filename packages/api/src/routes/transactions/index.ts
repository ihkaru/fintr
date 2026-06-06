import { Elysia } from "elysia";
import { authMiddleware } from "../../middleware/auth";
import { listRoute } from "./list";
import { createRoute } from "./create";
import { createSplitRoute } from "./createSplit";
import { ocrRoute } from "./ocr";
import { deleteRoute } from "./delete";

export const transactionRoutes = new Elysia({ prefix: "/transactions" })
  .use(authMiddleware)
  .use(listRoute)
  .use(createRoute)
  .use(createSplitRoute)
  .use(ocrRoute)
  .use(deleteRoute);
