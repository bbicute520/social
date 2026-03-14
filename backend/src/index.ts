import "dotenv/config";
import express from "express";
import cors from "cors";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import webhookRoutes from "./routes/webhook.route";
import uploadRoutes from "./routes/upload.route";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());

// Webhooks should receive raw body, so we put it before express.json()
app.use("/api/webhooks", webhookRoutes);

// General middleware for parsing JSON
app.use(express.json());

// Routes
app.use("/api/uploadthing", uploadRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

import { RequireAuthProp } from "@clerk/clerk-sdk-node";

// A protected route example using Clerk
app.get("/api/protected", ClerkExpressRequireAuth() as any, (req: any, res) => {
  res.json({ message: "This is a protected route", auth: req.auth });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
