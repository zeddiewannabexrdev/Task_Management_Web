using Microsoft.Data.SqlClient;
using System.Data;
using System.Text.Json;
using TaskFlow.Models;

namespace TaskFlow.Services;

/// <summary>
/// Truy cập trực tiếp vào MSSQL qua stored procedures — không cần HTTP API riêng.
/// </summary>
public class TaskService(string connectionString)
{
    private SqlConnection Conn() => new(connectionString);

    // ─── CATEGORIES ──────────────────────────────────────────────────────────

    public async Task<List<Category>> GetCategoriesAsync()
    {
        var list = new List<Category>();
        using var conn = Conn();
        using var cmd = SP("sp_GetCategories", conn);
        await conn.OpenAsync();
        using var r = await cmd.ExecuteReaderAsync();
        while (await r.ReadAsync())
            list.Add(new Category(r.GetString(0), r.GetString(1), r.GetString(2), r.GetString(3)));
        return list;
    }

    public async Task<Category> AddCategoryAsync(Category cat)
    {
        using var conn = Conn();
        using var cmd = SP("sp_AddCategory", conn);
        cmd.Parameters.AddWithValue("@Id", cat.Id);
        cmd.Parameters.AddWithValue("@Name", cat.Name);
        cmd.Parameters.AddWithValue("@Color", cat.Color);
        cmd.Parameters.AddWithValue("@Icon", cat.Icon);
        await conn.OpenAsync();
        await cmd.ExecuteNonQueryAsync();
        return cat;
    }

    // ─── TASKS ───────────────────────────────────────────────────────────────

    public async Task<List<TaskItem>> GetTasksAsync()
    {
        var list = new List<TaskItem>();
        using var conn = Conn();
        using var cmd = SP("sp_GetTasks", conn);
        await conn.OpenAsync();
        using var r = await cmd.ExecuteReaderAsync();
        while (await r.ReadAsync())
            list.Add(MapTask(r));
        return list;
    }

    public async Task<TaskItem?> AddTaskAsync(TaskInput input)
    {
        using var conn = Conn();
        await conn.OpenAsync();

        int newId;
        using (var cmd = SP("sp_AddTask", conn))
        {
            cmd.Parameters.AddWithValue("@Title", input.Title);
            cmd.Parameters.AddWithValue("@Description", (object?)input.Description ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Status", input.Status);
            cmd.Parameters.AddWithValue("@Priority", input.Priority);
            cmd.Parameters.AddWithValue("@CategoryId", input.CategoryId);
            cmd.Parameters.AddWithValue("@DueDate", DateTime.Parse(input.DueDate));
            var p = new SqlParameter("@TaskId", SqlDbType.Int) { Direction = ParameterDirection.Output };
            cmd.Parameters.Add(p);
            await cmd.ExecuteNonQueryAsync();
            newId = (int)p.Value;
        }

        await SyncSubtasksAsync(conn, newId, input.Subtasks);
        return await GetByIdAsync(conn, newId);
    }

    public async Task<TaskItem?> UpdateTaskAsync(int id, TaskInput input)
    {
        using var conn = Conn();
        await conn.OpenAsync();

        using (var cmd = SP("sp_UpdateTask", conn))
        {
            cmd.Parameters.AddWithValue("@Id", id);
            cmd.Parameters.AddWithValue("@Title", input.Title);
            cmd.Parameters.AddWithValue("@Description", (object?)input.Description ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Status", input.Status);
            cmd.Parameters.AddWithValue("@Priority", input.Priority);
            cmd.Parameters.AddWithValue("@CategoryId", input.CategoryId);
            cmd.Parameters.AddWithValue("@DueDate", DateTime.Parse(input.DueDate));
            await cmd.ExecuteNonQueryAsync();
        }

        await SyncSubtasksAsync(conn, id, input.Subtasks);
        return await GetByIdAsync(conn, id);
    }

    public async Task UpdateTaskStatusAsync(int id, string status)
    {
        using var conn = Conn();
        using var cmd = SP("sp_UpdateTaskStatus", conn);
        cmd.Parameters.AddWithValue("@Id", id);
        cmd.Parameters.AddWithValue("@Status", status);
        await conn.OpenAsync();
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task DeleteTaskAsync(int id)
    {
        using var conn = Conn();
        using var cmd = SP("sp_DeleteTask", conn);
        cmd.Parameters.AddWithValue("@Id", id);
        await conn.OpenAsync();
        await cmd.ExecuteNonQueryAsync();
    }

    // ─── PRIVATE HELPERS ─────────────────────────────────────────────────────

    private static SqlCommand SP(string name, SqlConnection conn) =>
        new(name, conn) { CommandType = CommandType.StoredProcedure };

    private async Task SyncSubtasksAsync(SqlConnection conn, int taskId, List<Subtask> subtasks)
    {
        using var cmd = SP("sp_SyncSubtasks", conn);
        cmd.Parameters.AddWithValue("@TaskId", taskId);
        var json = JsonSerializer.Serialize(subtasks.Select(s => new { text = s.Text, completed = s.Completed }));
        cmd.Parameters.AddWithValue("@SubtasksJson", json);
        await cmd.ExecuteNonQueryAsync();
    }

    private async Task<TaskItem?> GetByIdAsync(SqlConnection conn, int id)
    {
        using var cmd = SP("sp_GetTaskById", conn);
        cmd.Parameters.AddWithValue("@Id", id);
        using var r = await cmd.ExecuteReaderAsync();
        return await r.ReadAsync() ? MapTask(r) : null;
    }

    private static TaskItem MapTask(SqlDataReader r)
    {
        var json = r.IsDBNull(8) ? "[]" : r.GetString(8);
        var subs = JsonSerializer.Deserialize<List<SubtaskRaw>>(json,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? [];

        return new TaskItem
        {
            Id = r.GetInt32(0),
            Title = r.GetString(1),
            Description = r.IsDBNull(2) ? "" : r.GetString(2),
            Status = r.GetString(3),
            Priority = r.GetString(4),
            CategoryId = r.GetString(5),
            DueDate = r.GetDateTime(6).ToString("yyyy-MM-dd"),
            CreatedAt = r.GetDateTime(7).ToString("yyyy-MM-dd HH:mm:ss"),
            Subtasks = subs.Select(s => new Subtask(s.Id, s.Text, s.Completed)).ToList()
        };
    }

    private record SubtaskRaw(int? Id, string Text, bool Completed);
}
