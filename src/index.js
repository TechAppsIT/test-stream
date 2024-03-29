const express = require("express");
const dotenv = require("dotenv");
const { StreamChat } = require("stream-chat");
const { genSaltSync, hashSync } = require("bcrypt");

dotenv.config();

const client = StreamChat.getInstance(
  "2m874t2tj73j",
  "53aj5e4w4b2jrwnbymgjcny79xphweckpcbbz72mnqjxa37jvha29cvzc44pzqvw"
);

const app = express();
app.use(express.json());
const salt = genSaltSync(10);

const USERS = [];

// Create user in Stream Chat
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required.",
    });
  }

  // Minlength 6
  if (password.length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters.",
    });
  }

  const existingUser = USERS.find((user) => user.email === email);

  if (existingUser) {
    return res.status(400).json({
      message: "User already exists.",
    });
  }

  try {
    const hashed_password = hashSync(password, salt);
    // Generate random id and push to in memory users
    const id = Math.random().toString(36).substr(2, 9);
    const user = {
      id,
      email,
      hashed_password,
    };
    USERS.push(user);

    // Create user in Stream Chat
    await client.upsertUser({
      id,
      email,
      name: email,
    });

    // Create token for user
    const token = client.createToken(id);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (e) {
    return res.json({
      message: "User already exists.",
    });
  }
});

// Login user
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = USERS.find((user) => user.email === email);
  const hashed_password = hashSync(password, salt);

  if (!user || user.hashed_password !== hashed_password) {
    return res.status(400).json({
      message: "Invalid credentials.",
    });
  }
  // Create token for user
  const token = client.createToken(user.id);

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
    },
  });
});

app.listen(3000, () => {
  console.log(`App listening on port 3000`);
});
