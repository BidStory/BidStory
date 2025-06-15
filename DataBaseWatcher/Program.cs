using System;
using System.Collections.Generic;
using System.Data.SQLite;
using System.IO;
using System.Text.Json;
using System.Threading;

class Program
{
    // أوقات آخر تعديل للملفات
    private static DateTime _lastWriteTimeLang;
    private static DateTime _lastWriteTimeImage;
    private static DateTime _lastWriteTimeLists;
    private static DateTime _lastWriteTimeCountry;

    // المسار الأساسي للمشروع (5 مستويات لأعلى من مجلد التنفيذ)
    private static readonly string _baseDir = Directory.GetParent(AppDomain.CurrentDomain.BaseDirectory).Parent.Parent.Parent.Parent.FullName;

    // مسارات قواعد البيانات
    private static readonly string _dbPathLang = Path.Combine(_baseDir, "code", "lang", "data_lang.db");
    private static readonly string _dbPathImage = Path.Combine(_baseDir, "code", "lang", "data_image.db");
    private static readonly string _dbPathLists = Path.Combine(_baseDir, "code", "lang", "data_lists.db");
    private static readonly string _dbPathCountry = Path.Combine(_baseDir, "code", "lang", "data_country.db");

    // مسارات ملفات الإخراج JSON
    private static readonly string _outPathLang = Path.Combine(_baseDir, "code", "lang", "data_lang.json");
    private static readonly string _outPathImage = Path.Combine(_baseDir, "code", "lang", "data_image.json");
    private static readonly string _outPathLists = Path.Combine(_baseDir, "code", "lang", "data_lists.json");
    private static readonly string _outPathCountry = Path.Combine(_baseDir, "code", "lang", "data_country.json");

    static void Main(string[] args)
    {
        Console.WriteLine($"=== SQLite Database Monitor ===");
        Console.WriteLine($"Monitoring:\n1. {_dbPathLang}\n2. {_dbPathImage}\n3. {_dbPathLists}\n4. {_dbPathCountry}");

        // إعدادات نافذة الكونسول
        if (OperatingSystem.IsWindows())
        {
            Console.WindowHeight = 16;
            Console.WindowWidth = 100;
            Console.Title = "SQLite Quad DB Monitor";
        }

        // الحصول على تاريخ آخر تعديل للملفات عند البدء
        _lastWriteTimeLang = File.GetLastWriteTime(_dbPathLang);
        _lastWriteTimeImage = File.GetLastWriteTime(_dbPathImage);
        _lastWriteTimeLists = File.GetLastWriteTime(_dbPathLists);
        _lastWriteTimeCountry = File.GetLastWriteTime(_dbPathCountry);

        Console.WriteLine($"\nLast modified times:");
        Console.WriteLine($"- Language DB: {_lastWriteTimeLang}");
        Console.WriteLine($"- Image DB:    {_lastWriteTimeImage}");
        Console.WriteLine($"- Lists DB:    {_lastWriteTimeLists}");
        Console.WriteLine($"- Country DB:  {_lastWriteTimeCountry}");
        Console.WriteLine("\nPress Ctrl+C to exit");

        // بدء المراقبة كل ثانية
        using var timer = new Timer(CheckFileChanges, null, 0, 1000);

        // حلقة لا نهائية لإبقاء البرنامج يعمل
        while (true)
        {
            Thread.Sleep(1000);
        }
    }

    /// <summary>
    /// تفحص التغييرات في الملفات كل ثانية
    /// </summary>
    private static void CheckFileChanges(object state)
    {
        try
        {
            CheckSingleFile(_dbPathLang, _outPathLang, ref _lastWriteTimeLang, "Language");
            CheckSingleFile(_dbPathImage, _outPathImage, ref _lastWriteTimeImage, "Image");
            CheckSingleFile(_dbPathLists, _outPathLists, ref _lastWriteTimeLists, "Lists");
            CheckSingleFile(_dbPathCountry, _outPathCountry, ref _lastWriteTimeCountry, "Country");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"\n[ERROR] Monitoring failed: {ex.Message}");
        }
    }

    /// <summary>
    /// تفحص ملف واحد وتحديثه إذا لزم الأمر
    /// </summary>
    private static void CheckSingleFile(string dbPath, string outPath, ref DateTime lastWriteTime, string dbType)
    {
        var currentWriteTime = File.GetLastWriteTime(dbPath);

        if (currentWriteTime > lastWriteTime)
        {
            Console.WriteLine($"\n[UPDATE] {dbType} DB changed at {currentWriteTime}");
            ConvertDatabase(dbPath, outPath);
            lastWriteTime = currentWriteTime;
            Console.WriteLine($"[SUCCESS] {dbType} JSON updated");
        }
    }

    /// <summary>
    /// تحويل قاعدة البيانات SQLite إلى ملف JSON
    /// </summary>
    private static void ConvertDatabase(string dbPath, string outPath)
    {
        try
        {
            if (!File.Exists(dbPath))
            {
                Console.WriteLine($"[ERROR] File not found: {dbPath}");
                return;
            }

            var databaseData = new Dictionary<string, List<Dictionary<string, object>>>();

            using var connection = new SQLiteConnection($"Data Source={dbPath};Version=3;");
            connection.Open();

            var tables = GetTables(connection);

            foreach (var table in tables)
            {
                if (table == "sqlite_sequence") continue;

                var tableData = ReadTableData(connection, table);
                databaseData.Add(table, tableData);
            }

            SaveAsJson(databaseData, outPath);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] Conversion failed: {ex.Message}");
        }
    }

    /// <summary>
    /// جلب أسماء الجداول من قاعدة البيانات
    /// </summary>
    private static List<string> GetTables(SQLiteConnection connection)
    {
        var tables = new List<string>();

        using var command = new SQLiteCommand("SELECT name FROM sqlite_master WHERE type='table'", connection);
        using var reader = command.ExecuteReader();

        while (reader.Read())
        {
            tables.Add(reader.GetString(0));
        }

        return tables;
    }

    /// <summary>
    /// قراءة بيانات الجدول وتحويلها لقوائم كائنات
    /// </summary>
    private static List<Dictionary<string, object>> ReadTableData(SQLiteConnection connection, string tableName)
    {
        var tableData = new List<Dictionary<string, object>>();

        using var command = new SQLiteCommand($"SELECT * FROM {tableName}", connection);
        using var reader = command.ExecuteReader();

        while (reader.Read())
        {
            var rowData = new Dictionary<string, object>();

            for (int i = 0; i < reader.FieldCount; i++)
            {
                rowData.Add(reader.GetName(i), reader.GetValue(i) == DBNull.Value ? null : reader.GetValue(i));
            }

            tableData.Add(rowData);
        }

        return tableData;
    }

    /// <summary>
    /// حفظ البيانات بصيغة JSON إلى ملف
    /// </summary>
    private static void SaveAsJson(Dictionary<string, List<Dictionary<string, object>>> data, string outPath)
    {
        var options = new JsonSerializerOptions
        {
            WriteIndented = true,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        };

        string json = JsonSerializer.Serialize(data, options);
        File.WriteAllText(outPath, json);
    }
}
