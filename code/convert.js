const sqlite3 = require("sqlite3").verbose();
const { debug } = require("console");
const fs = require("fs");

function convertSQLiteToJSON(sqliteFilePath, outputJsonPath) {
  console.log("🚀 بدأ التحويل...");

  const db = new sqlite3.Database(
    sqliteFilePath,
    sqlite3.OPEN_READONLY,
    (err) => {
      if (err) return console.error("خطأ في فتح قاعدة البيانات:", err.message);
    }
  );

  const databaseJson = {};

  db.serialize(() => {
    db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      (err, tables) => {
        if (err)
          return console.error("خطأ في قراءة أسماء الجداول:", err.message);

        let remaining = tables.length;

        tables.forEach((table) => {
          const tableName = table.name;

          db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
            if (err)
              return console.error(
                `خطأ في قراءة جدول ${tableName}:`,
                err.message
              );

            databaseJson[tableName] = rows;

            remaining--;
            if (remaining === 0) {
              fs.writeFileSync(
                outputJsonPath,
                JSON.stringify(databaseJson, null, 2),
                "utf8"
              );
              console.log("✅ تم إنشاء ملف JSON بنجاح:", outputJsonPath);
              db.close();
            }
          });
        });

        if (tables.length === 0) {
          fs.writeFileSync(outputJsonPath, JSON.stringify({}, null, 2), "utf8");
          console.log("✅ لا توجد جداول. تم إنشاء ملف JSON فارغ.");
          db.close();
        }
      }
    );
  });
}
convertSQLiteToJSON("code/data.db", "code/output.json");




