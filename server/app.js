require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const usersRoutes = require("./routes/usersRoutes");
const todosRoutes = require("./routes/todosRoutes");
const postsRoutes = require("./routes/postsRoutes");
const commentsRoutes = require("./routes/commentsRoutes");
const albumsRoutes = require("./routes/albumsRoutes");
const photosRoutes = require("./routes/photosRoutes");
const adminRoutes = require("./routes/adminRoutes");

require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/todos", todosRoutes);
app.use("/posts", postsRoutes);
app.use("/comments", commentsRoutes);
app.use("/albums", albumsRoutes);
app.use("/photos", photosRoutes);
app.use("/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("Server is running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});