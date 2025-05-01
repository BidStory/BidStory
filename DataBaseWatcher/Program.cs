using System;
using System.Collections.Generic;
using System.Data.SQLite;
using System.IO;
using System.Text.Json;
using System.Threading;

class Program
{
    private static DateTime _lastWriteTime;
    private static readonly string _baseDir = Directory.GetParent(AppDomain.CurrentDomain.BaseDirectory).Parent.Parent.Parent.Parent.FullName;
    private static readonly string _dbPath = Path.Combine(_baseDir, "code", "lang", "data.db");

    private static readonly string _outPath = Path.Combine(_baseDir,"code", "lang","output.json");

    static void Main(string[] args)
    {
        Console.WriteLine(_dbPath);
        // تكوين نافذة الكونسول لتكون صغيرة
        Console.WindowHeight = 5;
        Console.WindowWidth = 60;
        Console.BufferHeight = 5;
        Console.BufferWidth = 60;
        Console.Title = "مراقب ملف SQLite";

        // الحصول على تاريخ آخر تعديل للملف أول مرة
        _lastWriteTime = File.GetLastWriteTime(_dbPath);
        Console.WriteLine($"last edit: {_lastWriteTime}");
        Console.WriteLine("Ctrl+C 2 stop");

        // إنشاء تايمر للمراقبة كل ثانية
        using var timer = new Timer(CheckFileChanges, null, 0, 1000);

        // منع البرنامج من الخروج
        while (true)
        {
            Thread.Sleep(1000);
        }
    }

    private static void CheckFileChanges(object state)
    {
        try
        {
            var currentWriteTime = File.GetLastWriteTime(_dbPath);

            if (currentWriteTime > _lastWriteTime)
            {
                Console.WriteLine($"\n found new change: {currentWriteTime}");
                ConvertDatabase();
                _lastWriteTime = currentWriteTime;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"\n error in watching: {ex.Message}");
        }
    }

    private static void ConvertDatabase()
    {
        try
        {
            if (!File.Exists(_dbPath))
            {
                Console.WriteLine("  file not found !");
                return;
            }

            var databaseData = new Dictionary<string, List<Dictionary<string, object>>>();

            using var connection = new SQLiteConnection($"Data Source={_dbPath};Version=3;");
            connection.Open();

            // الحصول على قائمة الجداول
            var tables = new List<string>();
            using (var command = new SQLiteCommand("SELECT name FROM sqlite_master WHERE type='table'", connection))
            using (var reader = command.ExecuteReader())
            {
                while (reader.Read())
                {
                    tables.Add(reader.GetString(0));
                }
            }

            // قراءة بيانات كل جدول
            foreach (var table in tables)
            {
                if (table == "sqlite_sequence") continue;

                var tableData = new List<Dictionary<string, object>>();
                using (var command = new SQLiteCommand($"SELECT * FROM {table}", connection))
                using (var reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        var rowData = new Dictionary<string, object>();
                        for (int i = 0; i < reader.FieldCount; i++)
                        {
                            rowData.Add(
                                reader.GetName(i),
                                reader.GetValue(i) == DBNull.Value ? null : reader.GetValue(i)
                            );
                        }
                        tableData.Add(rowData);
                    }
                }
                databaseData.Add(table, tableData);
            }

            // حفظ البيانات كملف JSON
            string json = JsonSerializer.Serialize(databaseData, new JsonSerializerOptions
            {
                WriteIndented = true,
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            });

            File.WriteAllText(_outPath, json);
            Console.WriteLine("   output.json  update sucssfule");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"   eroor during convert: {ex.Message}");
        }
    }
}