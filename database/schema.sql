-- 1. יצירת מסד הנתונים (אם לא קיים) ובחירתו
CREATE DATABASE IF NOT EXISTS jsonplaceholder_db;
USE jsonplaceholder_db;

-- ==========================================
-- 2. יצירת הטבלאות
-- ==========================================

-- טבלת משתמשים (Users) - כוללת סיסמאות לפי דרישת הפרויקט
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    website VARCHAR(100) NOT NULL
);

-- טבלת מטלות (Todos) - מקושרת למשתמש
CREATE TABLE IF NOT EXISTS todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- טבלת פוסטים (Posts) - מקושרת למשתמש
CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- טבלת תגובות (Comments) - מקושרת לפוסט (וגם למי שכתב אותה, במקרה שלנו user_id)
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL, -- הוספתי כדי שנדע מי הגיב (למרות שב-JSONPlaceholder המקורי יש רק שם ואימייל)
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================הוספות לברכי
ALTER TABLE users
ADD COLUMN blocked BOOLEAN DEFAULT FALSE;

ALTER TABLE users
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS albums (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  album_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);

UPDATE users
SET blocked = FALSE
WHERE id > 0;

UPDATE users
SET is_admin = FALSE
WHERE id > 0;

UPDATE users
SET is_admin = TRUE
WHERE id = 1;

