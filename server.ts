import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from 'url';
import { Resend } from 'resend';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let resendClient: Resend | null = null;

function getResend() {
  if (!resendClient) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      console.warn("RESEND_API_KEY is not set. Emails will not be sent.");
      return null;
    }
    resendClient = new Resend(key);
  }
  return resendClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/send-invite", async (req, res) => {
    const { email, projectName, inviterName, projectUrl } = req.body;
    
    if (!email || !projectName || !inviterName) {
      return res.status(400).json({ status: "error", error: "Missing required fields" });
    }

    const resend = getResend();
    if (!resend) {
      console.log(`[MOCK EMAIL] To: ${email}, Subject: Join ${projectName}, Body: ${inviterName} invited you to join ${projectName}. Join here: ${projectUrl}`);
      return res.json({ status: "mocked", message: "RESEND_API_KEY missing, email logged to console" });
    }

    try {
      const data = await resend.emails.send({
        from: 'TaskFlow <onboarding@resend.dev>',
        to: email,
        subject: `Join ${projectName} on TaskFlow`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #4f46e5;">You've been invited!</h2>
            <p><strong>${inviterName}</strong> has invited you to join the project <strong>${projectName}</strong> on TaskFlow.</p>
            <div style="margin-top: 24px;">
              <a href="${projectUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Join Project</a>
            </div>
            <p style="margin-top: 32px; font-size: 12px; color: #94a3b8;">If you don't have an account, you'll need to sign up with this email to access the project.</p>
          </div>
        `
      });

      if (data.error) {
        console.error("Resend API returned error:", data.error);
        return res.status(400).json({ status: "error", error: data.error.message, details: data.error });
      }

      res.json({ status: "success", data });
    } catch (error: any) {
      console.error("Failed to send email:", error);
      res.status(500).json({ status: "error", error: error.message || "Failed to send email" });
    }
  });

  // Example REST API for system stats (mocked since we use Firestore client side)
  app.get("/api/stats", (req, res) => {
    res.json({
      activeProjects: 12,
      totalTasks: 450,
      usersOnline: 5
    });
  });

  // Webhook endpoint to receive external events (e.g. from Resend or Stripe)
  app.post("/api/webhook", (req, res) => {
    const event = req.body;
    console.log("🚀 Webhook Received:", JSON.stringify(event, null, 2));

    if (event.type === 'email.received') {
      console.log(`📧 New email received from: ${event.data?.from}`);
      return res.json({ status: "processed", type: event.type, data: event.data });
    }

    res.json({ status: "received", timestamp: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
