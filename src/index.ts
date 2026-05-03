//setup the http server
//then setup the socket io
import dotenv from "dotenv";
import { createServer } from "node:http";
import express, { Request, Response } from "express";
import { Server } from "socket.io";
import path from "node:path";
dotenv.configDotenv();

async function start() {
  try {
    const PORT = process.env.PORT || 8000;
    const app = express();
    const httpServer = createServer(app);
    const io = new Server(httpServer);
    const TOTAL = 500;
    const checkboxStates = new Array(TOTAL).fill(null);

    app.use(express.json());
    app.get("/", (req: Request, res: Response) => {
      return res.sendFile(path.resolve("public", "checkbox.html"));
    });

    app.post("/api/callback", async (req, res) => {
      const { code, redirectUri } = req.body;

      if (!code || !redirectUri) {
        return res.status(400).json({ error: "Missing code or redirectUri" });
      }

      try {
        const params = new URLSearchParams();
        params.append("grant_type", "authorization_code");
        params.append("code", code);
        params.append("client_id", process.env.CLIENT_ID!);
        params.append("client_secret", process.env.CLIENT_SECRET!);
        params.append("redirect_uri", redirectUri);

        const response = await fetch(process.env.OIDC_TOKEN_ENDPOINT!, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params,
        });

        const data = await response.json();

        console.log("TOKEN ENDPOINT RESPONSE:", data); // 🔥 DEBUG

        if (!response.ok) {
          return res.status(response.status).json(data);
        }

        return res.json(data);
      } catch (err) {
        console.error("TOKEN ERROR:", err);
        return res.status(500).json({ error: "Token exchange failed" });
      }
    });

    //io connection
    io.on("connection", (socket) => {
      console.log("A user connected:", socket.id);
      //emmit all the checkboxState for updated checkes
      socket.emit("server:checkboxStates", checkboxStates);

      //this will get the data proivded by client to server
      socket.on("client:checked", (data) => {
        //update the state in backend
        checkboxStates[data.index] = data.checked;
        //server sends msg to all sockets after taking states
        io.emit("server:checked", data);
        // console.log(`change from client:${socket.id} Data:`, data)
      });
    });

    httpServer.listen(PORT, () => {
      console.log(`server is running on ${PORT}`);
    });
  } catch (error) {
    throw new Error("server error", error.message);
  }
}
start();
