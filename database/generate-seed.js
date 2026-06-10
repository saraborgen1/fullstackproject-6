// const fs = require("fs");

// const BASE_URL = "https://jsonplaceholder.typicode.com";

// async function generateSqlSeed() {
//   // הורדנו אלבומים ותמונות כרגע, לפי דרישות הבסיס של שלב א'
//   const resources = ["users", "todos", "posts", "comments"]; 
//   const data = {};

//   console.log("Fetching data from JSONPlaceholder...");
//   for (const resource of resources) {
//     const response = await fetch(`${BASE_URL}/${resource}`);
//     data[resource] = await response.json();
//   }

//   let sql = "USE jsonplaceholder_db;\n\n";

//   // פונקציית עזר לטיפול בתווים בעייתיים ב-SQL (כמו גרש בודד וירידות שורה)
//   const escapeSql = (str) => {
//     if (str === null || str === undefined) return "''";
//     let res = String(str).replace(/'/g, "''").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
//     return `'${res}'`;
//   };

//   // 1. Users
//   console.log("Generating Users SQL...");
//   sql += "-- Insert Users\n";
//   sql += "INSERT INTO users (id, name, username, email, password, phone, website) VALUES\n";
//   const userValues = data.users.map(u =>
//     `(${u.id}, ${escapeSql(u.name)}, ${escapeSql(u.username)}, ${escapeSql(u.email)}, '123456', ${escapeSql(u.phone)}, ${escapeSql(u.website)})`
//   );
//   sql += userValues.join(",\n") + ";\n\n";

//   // 2. Todos
//   console.log("Generating Todos SQL...");
//   sql += "-- Insert Todos\n";
//   sql += "INSERT INTO todos (id, user_id, title, completed) VALUES\n";
//   const todoValues = data.todos.map(t =>
//     `(${t.id}, ${t.userId}, ${escapeSql(t.title)}, ${t.completed ? "TRUE" : "FALSE"})`
//   );
//   sql += todoValues.join(",\n") + ";\n\n";

//   // 3. Posts
//   console.log("Generating Posts SQL...");
//   sql += "-- Insert Posts\n";
//   sql += "INSERT INTO posts (id, user_id, title, body) VALUES\n";
//   const postValues = data.posts.map(p =>
//     `(${p.id}, ${p.userId}, ${escapeSql(p.title)}, ${escapeSql(p.body)})`
//   );
//   sql += postValues.join(",\n") + ";\n\n";

//   // 4. Comments
//   console.log("Generating Comments SQL...");
//   sql += "-- Insert Comments\n";
//   sql += "INSERT INTO comments (id, post_id, user_id, name, email, body) VALUES\n";
//   const commentValues = data.comments.map(c => {
//     // הגרלת user_id עבור התגובה (בין 1 ל-10 המשתמשים הקיימים)
//     const randomUserId = Math.floor(Math.random() * 10) + 1;
//     return `(${c.id}, ${c.postId}, ${randomUserId}, ${escapeSql(c.name)}, ${escapeSql(c.email)}, ${escapeSql(c.body)})`;
//   });
//   sql += commentValues.join(",\n") + ";\n\n";

//   fs.writeFileSync("seed.sql", sql);
//   console.log("✅ seed.sql created successfully!");
// }

// generateSqlSeed();




//רק לאלבומים שפיספסנו
const fs = require("fs");

const BASE_URL = "https://jsonplaceholder.typicode.com";

async function generateAlbumsPhotosSeed() {
  const resources = ["albums", "photos"];
  const data = {};

  console.log("Fetching albums and photos from JSONPlaceholder...");

  for (const resource of resources) {
    const response = await fetch(`${BASE_URL}/${resource}`);
    data[resource] = await response.json();
  }

  let sql = "\n\n-- ==========================================\n";
  sql += "-- Albums and Photos\n";
  sql += "-- ==========================================\n\n";

  const escapeSql = (str) => {
    if (str === null || str === undefined) return "''";

    let res = String(str)
      .replace(/'/g, "''")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r");

    return `'${res}'`;
  };

  sql += "-- Insert Albums\n";
  sql += "INSERT INTO albums (id, user_id, title) VALUES\n";

  const albumValues = data.albums.map(
    (a) => `(${a.id}, ${a.userId}, ${escapeSql(a.title)})`
  );

  sql += albumValues.join(",\n") + ";\n\n";

  sql += "-- Insert Photos\n";
  sql += "INSERT INTO photos (id, album_id, title, url, thumbnail_url) VALUES\n";

  const photoValues = data.photos.map(
    (p) =>
      `(${p.id}, ${p.albumId}, ${escapeSql(p.title)}, ${escapeSql(
        p.url
      )}, ${escapeSql(p.thumbnailUrl)})`
  );

  sql += photoValues.join(",\n") + ";\n\n";

  fs.appendFileSync("seed.sql", sql);

  console.log("✅ Albums and Photos added to seed.sql successfully!");
}

generateAlbumsPhotosSeed();