using Microsoft.Data.SqlClient;
using System.Data;
using System.Linq;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// 1. Cấu hình CORS (cho phép React Frontend cổng 5173 truy cập)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                // Local development
                "http://localhost:5173",
                "http://[::1]:5173",
                // GitHub Pages (production)
                "https://zeddiewannabexrdev.github.io"
              )
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Cấu hình cổng serialization JSON mặc định trả về camelCase
builder.Services.ConfigureHttpJsonOptions(options => {
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});

var app = builder.Build();

app.UseCors("AllowFrontend");

// Chuỗi kết nối Database lấy từ appsettings.json
string GetConnString() => 
    app.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=(localdb)\\MSSQLLocalDB;Database=TaskFlowDB;Trusted_Connection=True;TrustServerCertificate=True;";

// ==========================================
// API ENDPOINTS CHO DANH MỤC (CATEGORIES)
// ==========================================

// 1. Lấy toàn bộ danh mục công việc
app.MapGet("/api/categories", async () =>
{
    var categories = new List<Category>();
    using var conn = new SqlConnection(GetConnString());
    using var cmd = new SqlCommand("sp_GetCategories", conn);
    cmd.CommandType = CommandType.StoredProcedure;
    
    await conn.OpenAsync();
    using var reader = await cmd.ExecuteReaderAsync();
    while (await reader.ReadAsync())
    {
        categories.Add(new Category(
            reader.GetString(0),
            reader.GetString(1),
            reader.GetString(2),
            reader.GetString(3)
        ));
    }
    return Results.Ok(categories);
});

// 2. Thêm danh mục mới
app.MapPost("/api/categories", async (Category category) =>
{
    if (string.IsNullOrWhiteSpace(category.Id) || string.IsNullOrWhiteSpace(category.Name))
    {
        return Results.BadRequest("ID và tên danh mục không được để trống.");
    }

    using var conn = new SqlConnection(GetConnString());
    using var cmd = new SqlCommand("sp_AddCategory", conn);
    cmd.CommandType = CommandType.StoredProcedure;
    cmd.Parameters.AddWithValue("@Id", category.Id);
    cmd.Parameters.AddWithValue("@Name", category.Name);
    cmd.Parameters.AddWithValue("@Color", category.Color ?? "other");
    cmd.Parameters.AddWithValue("@Icon", category.Icon ?? "FolderOpen");

    await conn.OpenAsync();
    await cmd.ExecuteNonQueryAsync();
    
    return Results.Created($"/api/categories/{category.Id}", category);
});

// ==========================================
// API ENDPOINTS CHO CÔNG VIỆC CHÍNH (TASKS)
// ==========================================

// Helper chuyển đổi dữ liệu từ DB Reader sang đối tượng TaskOutput
TaskOutput ReadTaskOutput(SqlDataReader reader)
{
    int id = reader.GetInt32(0);
    string title = reader.GetString(1);
    string description = reader.IsDBNull(2) ? "" : reader.GetString(2);
    string status = reader.GetString(3);
    string priority = reader.GetString(4);
    string categoryId = reader.GetString(5);
    string dueDate = reader.GetDateTime(6).ToString("yyyy-MM-dd");
    string createdAt = reader.GetDateTime(7).ToString("yyyy-MM-dd HH:mm:ss");
    
    string subtasksJson = reader.IsDBNull(8) ? "[]" : reader.GetString(8);
    // Đọc từ DB: Id là INT nên dùng SubtaskDb
    var subtasksFromDb = JsonSerializer.Deserialize<List<SubtaskDb>>(subtasksJson, new JsonSerializerOptions
    {
        PropertyNameCaseInsensitive = true
    }) ?? new List<SubtaskDb>();
    // Convert sang Subtask (Id dùng int?) để trả về FE
    var subtasks = subtasksFromDb.Select(s => new Subtask(s.Id, s.Text, s.Completed)).ToList();

    return new TaskOutput(id, title, description, status, priority, categoryId, dueDate, createdAt, subtasks);
}

// 1. Lấy toàn bộ danh sách công việc kèm công việc con lồng nhau
app.MapGet("/api/tasks", async () =>
{
    var tasks = new List<TaskOutput>();
    using var conn = new SqlConnection(GetConnString());
    using var cmd = new SqlCommand("sp_GetTasks", conn);
    cmd.CommandType = CommandType.StoredProcedure;

    await conn.OpenAsync();
    using var reader = await cmd.ExecuteReaderAsync();
    while (await reader.ReadAsync())
    {
        tasks.Add(ReadTaskOutput(reader));
    }
    return Results.Ok(tasks);
});

// 2. Lấy chi tiết một công việc theo ID
app.MapGet("/api/tasks/{id:int}", async (int id) =>
{
    using var conn = new SqlConnection(GetConnString());
    using var cmd = new SqlCommand("sp_GetTaskById", conn);
    cmd.CommandType = CommandType.StoredProcedure;
    cmd.Parameters.AddWithValue("@Id", id);

    await conn.OpenAsync();
    using var reader = await cmd.ExecuteReaderAsync();
    if (await reader.ReadAsync())
    {
        return Results.Ok(ReadTaskOutput(reader));
    }
    return Results.NotFound($"Không tìm thấy công việc với ID: {id}");
});

// 3. Tạo mới một công việc (và đồng bộ các công việc con đi kèm)
app.MapPost("/api/tasks", async (TaskInput input) =>
{
    if (string.IsNullOrWhiteSpace(input.Title))
    {
        return Results.BadRequest("Tiêu đề công việc không được để trống.");
    }

    using var conn = new SqlConnection(GetConnString());
    await conn.OpenAsync();

    int newTaskId = 0;
    
    // Bước A: Thêm công việc chính
    using (var cmd = new SqlCommand("sp_AddTask", conn))
    {
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@Title", input.Title);
        cmd.Parameters.AddWithValue("@Description", (object)input.Description ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Status", input.Status ?? "todo");
        cmd.Parameters.AddWithValue("@Priority", input.Priority ?? "medium");
        cmd.Parameters.AddWithValue("@CategoryId", input.CategoryId);
        cmd.Parameters.AddWithValue("@DueDate", DateTime.Parse(input.DueDate));
        
        var taskIdParam = new SqlParameter("@TaskId", SqlDbType.Int)
        {
            Direction = ParameterDirection.Output
        };
        cmd.Parameters.Add(taskIdParam);

        await cmd.ExecuteNonQueryAsync();
        newTaskId = (int)taskIdParam.Value;
    }

    // Bước B: Đồng bộ các công việc con (Subtasks) nếu có
    if (input.Subtasks != null && input.Subtasks.Count > 0)
    {
        using var cmdSync = new SqlCommand("sp_SyncSubtasks", conn);
        cmdSync.CommandType = CommandType.StoredProcedure;
        cmdSync.Parameters.AddWithValue("@TaskId", newTaskId);
        
        // Chỉ gửi Text & Completed xuống DB (Id sẽ do DB tự sinh)
        var subtasksForDb = input.Subtasks.Select(s => new { text = s.Text, completed = s.Completed });
        string subtasksJson = JsonSerializer.Serialize(subtasksForDb);
        cmdSync.Parameters.AddWithValue("@SubtasksJson", subtasksJson);

        await cmdSync.ExecuteNonQueryAsync();
    }

    // Lấy lại công việc hoàn chỉnh từ DB để phản hồi
    using var cmdGet = new SqlCommand("sp_GetTaskById", conn);
    cmdGet.CommandType = CommandType.StoredProcedure;
    cmdGet.Parameters.AddWithValue("@Id", newTaskId);
    using var reader = await cmdGet.ExecuteReaderAsync();
    if (await reader.ReadAsync())
    {
        return Results.Created($"/api/tasks/{newTaskId}", ReadTaskOutput(reader));
    }
    
    return Results.StatusCode(500);
});

// 4. Cập nhật chi tiết một công việc (và đồng bộ lại danh sách công việc con)
app.MapPut("/api/tasks/{id:int}", async (int id, TaskInput input) =>
{
    if (string.IsNullOrWhiteSpace(input.Title))
    {
        return Results.BadRequest("Tiêu đề công việc không được để trống.");
    }

    using var conn = new SqlConnection(GetConnString());
    await conn.OpenAsync();

    // Bước A: Cập nhật công việc chính
    using (var cmd = new SqlCommand("sp_UpdateTask", conn))
    {
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@Id", id);
        cmd.Parameters.AddWithValue("@Title", input.Title);
        cmd.Parameters.AddWithValue("@Description", (object)input.Description ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Status", input.Status);
        cmd.Parameters.AddWithValue("@Priority", input.Priority);
        cmd.Parameters.AddWithValue("@CategoryId", input.CategoryId);
        cmd.Parameters.AddWithValue("@DueDate", DateTime.Parse(input.DueDate));

        int rowsAffected = await cmd.ExecuteNonQueryAsync();
    }

    // Bước B: Đồng bộ danh sách công việc con (xóa cũ, nạp mới theo JSON)
    using (var cmdSync = new SqlCommand("sp_SyncSubtasks", conn))
    {
        cmdSync.CommandType = CommandType.StoredProcedure;
        cmdSync.Parameters.AddWithValue("@TaskId", id);
        
        // Chỉ gửi Text & Completed xuống DB (Id sẽ do DB tự sinh)
        var subtasksForDb = (input.Subtasks ?? new List<SubtaskInput>()).Select(s => new { text = s.Text, completed = s.Completed });
        string subtasksJson = JsonSerializer.Serialize(subtasksForDb);
        cmdSync.Parameters.AddWithValue("@SubtasksJson", subtasksJson);

        await cmdSync.ExecuteNonQueryAsync();
    }

    // Lấy lại thông tin sau khi cập nhật để trả về
    using var cmdGet = new SqlCommand("sp_GetTaskById", conn);
    cmdGet.CommandType = CommandType.StoredProcedure;
    cmdGet.Parameters.AddWithValue("@Id", id);
    using var reader = await cmdGet.ExecuteReaderAsync();
    if (await reader.ReadAsync())
    {
        return Results.Ok(ReadTaskOutput(reader));
    }
    
    return Results.NotFound($"Không tìm thấy công việc với ID: {id}");
});

// 5. Xóa công việc
app.MapDelete("/api/tasks/{id:int}", async (int id) =>
{
    using var conn = new SqlConnection(GetConnString());
    using var cmd = new SqlCommand("sp_DeleteTask", conn);
    cmd.CommandType = CommandType.StoredProcedure;
    cmd.Parameters.AddWithValue("@Id", id);

    await conn.OpenAsync();
    int rows = await cmd.ExecuteNonQueryAsync();
    
    return Results.NoContent();
});

// 6. Cập nhật nhanh trạng thái (Dành cho tính năng kéo thả Kanban)
app.MapPatch("/api/tasks/{id:int}/status", async (int id, StatusUpdateInput input) =>
{
    if (string.IsNullOrWhiteSpace(input.Status))
    {
        return Results.BadRequest("Trạng thái không được để trống.");
    }

    using var conn = new SqlConnection(GetConnString());
    using var cmd = new SqlCommand("sp_UpdateTaskStatus", conn);
    cmd.CommandType = CommandType.StoredProcedure;
    cmd.Parameters.AddWithValue("@Id", id);
    cmd.Parameters.AddWithValue("@Status", input.Status);

    await conn.OpenAsync();
    await cmd.ExecuteNonQueryAsync();

    return Results.NoContent();
});

app.Run();

// ==========================================
// CÁC MÔ HÌNH DỮ LIỆU DTO (DATA TRANSFER OBJECTS)
// ==========================================

public record Category(string Id, string Name, string Color, string Icon);

// Subtask đọc từ DB (Id là INT do IDENTITY)
public record SubtaskDb(int? Id, string Text, bool Completed);

// Subtask nhận từ Frontend (Id có thể là chuỗi tạm như "sub-1")
public record SubtaskInput(string? Id, string Text, bool Completed);

// Subtask trả về cho Frontend (Id là int? từ DB)
public record Subtask(int? Id, string Text, bool Completed);

public record TaskInput(
    string Title, 
    string Description, 
    string Status, 
    string Priority, 
    string CategoryId, 
    string DueDate, 
    List<SubtaskInput> Subtasks
);

public record TaskOutput(
    int Id, 
    string Title, 
    string Description, 
    string Status, 
    string Priority, 
    string CategoryId, 
    string DueDate, 
    string CreatedAt, 
    List<Subtask> Subtasks
);

public record StatusUpdateInput(string Status);
