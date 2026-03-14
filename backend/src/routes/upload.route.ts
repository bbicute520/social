import express from "express";
import { createRouteHandler } from "uploadthing/express";
import { uploadRouter } from "../lib/uploadthing";

const router = express.Router();

router.use(
  "/",
  createRouteHandler({
    router: uploadRouter
  })
);

export default router;
