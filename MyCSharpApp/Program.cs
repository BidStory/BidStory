using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SQLite;
using System.IO;
using System.Text.Json;

class Program
{
    static void Main(string[] args)
    {
        string dbPath = @"C:\Users\hesham\Desktop\BidStory\code\data.db";
      string outPath =@"C:\Users\hesham\Desktop\BidStory\code\output.json";
        if (!File.Exists(dbPath))
        {
            Console.WriteLine("الملف غير موجود!");
            return;
        }

        try
        {
            // إنشاء قاموس لتخزين جميع الجداول وبياناتها
            var databaseData = new Dictionary<string, List<Dictionary<string, object>>>();

            // الاتصال بقاعدة البيانات
            string connectionString = $"Data Source={dbPath};Version=3;";
            using (var connection = new SQLiteConnection(connectionString))
            {
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
                    var tableData = new List<Dictionary<string, object>>();

                    using (var command = new SQLiteCommand($"SELECT * FROM {table}", connection))
                    using (var reader = command.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            var rowData = new Dictionary<string, object>();
                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                string columnName = reader.GetName(i);
                                object value = reader.GetValue(i);

                                // تحويل DBNull إلى null
                                if (value == DBNull.Value)
                                {
                                    value = null;
                                }

                                rowData.Add(columnName, value);
                            }
                            tableData.Add(rowData);
                        }
                    }

                    databaseData.Add(table, tableData);
                }
            }

            // تحويل البيانات إلى JSON وحفظها في ملف
            string json = JsonSerializer.Serialize(databaseData, new JsonSerializerOptions
            {
                WriteIndented = true,
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            });

            File.WriteAllText(outPath, json);
            Console.WriteLine("تم التحويل بنجاح إلى output.json");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"حدث خطأ: {ex.Message}");
        }
    }
}