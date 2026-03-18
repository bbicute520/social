import express from "express";
import { Webhook } from "svix";
import bodyParser from "body-parser";
import { WebhookEvent } from "@clerk/clerk-sdk-node";
import { prisma } from "../lib/prisma";
import { ensureAuthUser } from "../services/user.service";

const router = express.Router();

router.post(
  "/clerk",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      throw new Error("Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env");
    }

    const svix_id = req.headers["svix-id"] as string;
    const svix_timestamp = req.headers["svix-timestamp"] as string;
    const svix_signature = req.headers["svix-signature"] as string;

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).json({ error: "Error occured -- no svix headers" });
    }

    const payload = req.body;
    const body = payload.toString();
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent;

    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return res.status(400).json({ Error: err });
    }

    const eventType = evt.type;

    if (eventType === "user.created") {
      const { id, email_addresses, username } = evt.data;
      const primaryEmail = email_addresses[0]?.email_address;

      try {
        await ensureAuthUser({
          userId: id,
          email: primaryEmail,
          usernameHint: username,
        });
        console.log(`User ${id} synced in database`);
      } catch (error) {
        console.error("Error syncing user in database:", error);
        return res.status(500).json({ error: "Database error" });
      }
    }

    if (eventType === "user.updated") {
      const { id, email_addresses, username } = evt.data;
      const primaryEmail = email_addresses[0]?.email_address;

      try {
        await ensureAuthUser({
          userId: id,
          email: primaryEmail,
          usernameHint: username,
        });
        console.log(`User ${id} auth metadata synced in database`);
      } catch (error) {
        console.error("Error updating user in database:", error);
      }
    }

    if (eventType === "user.deleted") {
      const { id } = evt.data;

      try {
        await prisma.user.delete({
          where: { id },
        });
        console.log(`User ${id} deleted from database`);
      } catch (error) {
        console.error("Error deleting user in database:", error);
      }
    }

    return res.status(200).json({ success: true });
  }
);

export default router;
