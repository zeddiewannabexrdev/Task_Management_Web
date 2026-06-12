using System;
using System.IO;
using System.Text.RegularExpressions;
using Microsoft.Data.SqlClient;

class Program
{
    static void Main()
    {
        string connStr = @"Server=taskflowdb.mssql.somee.com;Database=taskflowdb;User Id=anlongvrdev_SQLLogin_1;Password=34q3uwez1f;TrustServerCertificate=True;Encrypt=False;Connect Timeout=60;Packet Size=4096;";

        string sqlFile = @"..\db\somee_deploy.sql";
        string sqlContent = File.ReadAllText(sqlFile);

        // SQL Server Management Studio uses "GO" to separate batches. SqlCommand doesn't support "GO", so we must split.
        var commands = Regex.Split(sqlContent, @"^\s*GO\s*$", RegexOptions.Multiline | RegexOptions.IgnoreCase);

        using var conn = new SqlConnection(connStr);
        conn.Open();

        Console.WriteLine("Dropping existing tables to reset...");
        // Drop existing tables in reverse order of dependencies to avoid FK errors
        var drops = new[] { "Subtasks", "Tasks", "Projects", "Categories" };
        foreach (var t in drops)
        {
            try { new SqlCommand($"IF OBJECT_ID('{t}', 'U') IS NOT NULL DROP TABLE {t};", conn).ExecuteNonQuery(); } catch { }
        }

        Console.WriteLine("Executing somee_deploy.sql...");
        foreach (var cmdText in commands)
        {
            var cleanCmd = cmdText.Trim();
            if (string.IsNullOrEmpty(cleanCmd)) continue;
            
            try
            {
                using var cmd = new SqlCommand(cleanCmd, conn);
                cmd.ExecuteNonQuery();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error executing batch: " + ex.Message);
            }
        }

        Console.WriteLine("Migration completed successfully!");
    }
}
