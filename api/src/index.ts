import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github";
import dotenv from "dotenv";
import Activity from "./models/Activity"; // Import the Activity model
import jwt from "jsonwebtoken";
import cors from "cors";

dotenv.config();

const main = async () => {
  const app = express();
  app.use(cors({ origin: "*" }));
  // Serialize user for session handling
  passport.serializeUser((user: any, done) => {
    done(null, user.accessToken);
  });

  // Initialize Passport
  app.use(passport.initialize());

  // GitHub OAuth Strategy
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID || "",
        clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
        callbackURL: "http://localhost:3002/auth/callback/github",
      },
      async (_, __, profile, cb) => {
        try {
          // Extract necessary user data from GitHub profile
          const userData = {
            userId: profile.id,
            email: profile._json.email || null, // Safely access the email
            name: profile.displayName || profile.username,
            image: profile.photos?.[0]?.value || "",
            track: {}, // Initialize track as an empty map for daily activities
          };

          // Check if user exists in the database
          let user = await Activity.findOne({ userId: profile.id });
          if (!user) {
            // Add new user to the database
            user = await Activity.create(userData);
            console.log("New user added:", user);
          } else {
            console.log("User already exists:", user);
          }

          // Generate a JWT token for the user
          const accessToken = jwt.sign({ userId: user.id }, "sadssadsadasdsadas", {
            expiresIn: "1yr",
          });

          cb(null, { accessToken });
        } catch (error) {
          console.error("Error during GitHub authentication:", error);
          cb(error);
        }
      }
    )
  );

  // GitHub authentication routes
  app.get("/auth/github", passport.authenticate("github", { session: false }));

  app.get(
    "/auth/github/callback",
    passport.authenticate("github", { session: false }),
    (req: any, res) => {
      res.redirect(`http://localhost:54321/auth/${req.user.accessToken}`);
    }
  );

  // Protected route to get user information based on token
  app.get("/me", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.send({ user: "unauthrized" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.send({ user: null });
    }

    let userId = "";

    try {
      const payload: any = jwt.verify(token, "sadssadsadasdsadas");
      userId = payload.userId;
    } catch (err) {
      return res.send({ user: null });
    }

    if (!userId) {
      return res.send({ user: null });
    }

    const user = await Activity.findById(userId);
    if (!user) {
      return res.send({ user: null });
    }

    res.send({ user });
  });

  // MongoDB Connection
  try {
    await mongoose.connect(process.env.MONGO_URI || "");
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1);
  }

  // Start the server
  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

main().catch((err) => {
  console.error("Error in server startup:", err);
});
