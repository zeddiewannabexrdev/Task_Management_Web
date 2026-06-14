namespace TaskFlow.Models;

// ─── Category ────────────────────────────────────────────────────────────────

public record Category(string Id, string Name, string Color, string Icon);

// ─── Project ──────────────────────────────────────────────────────────────────

public class ProjectItem
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string CategoryId { get; set; } = "";
    public string CreatedAt { get; set; } = "";
}

// ─── Subtask ──────────────────────────────────────────────────────────────────

public record Subtask(int? Id, string Text, bool Completed);

// ─── Task ─────────────────────────────────────────────────────────────────────

public class TaskItem
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Status { get; set; } = "todo";
    public string Priority { get; set; } = "medium";
    public int ProjectId { get; set; }
    public string DueDate { get; set; } = "";
    public string CreatedAt { get; set; } = "";
    public List<Subtask> Subtasks { get; set; } = [];
}

// ─── Input / Form Model ───────────────────────────────────────────────────────

public class TaskInput
{
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Status { get; set; } = "todo";
    public string Priority { get; set; } = "medium";
    public int ProjectId { get; set; }
    public string DueDate { get; set; } = TaskFlow.Services.TimeUtils.VNToday.ToString("yyyy-MM-dd");
    public List<Subtask> Subtasks { get; set; } = [];

    public static TaskInput FromTask(TaskItem t) => new()
    {
        Title = t.Title,
        Description = t.Description,
        Status = t.Status,
        Priority = t.Priority,
        ProjectId = t.ProjectId,
        DueDate = t.DueDate,
        Subtasks = [.. t.Subtasks]
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

public static class TaskLabels
{
    public static readonly Dictionary<string, string> Status = new()
    {
        ["todo"] = "Cần làm",
        ["inprogress"] = "Đang làm",
        ["inreview"] = "Đang duyệt",
        ["done"] = "Đã xong"
    };

    public static readonly Dictionary<string, string> Priority = new()
    {
        ["high"] = "Cao",
        ["medium"] = "Trung bình",
        ["low"] = "Thấp"
    };

    public static readonly List<(string Id, string Title, string Dot)> Columns =
    [
        ("todo", "Cần làm", "todo"),
        ("inprogress", "Đang làm", "inprogress"),
        ("inreview", "Đang duyệt", "inreview"),
        ("done", "Đã hoàn thành", "done"),
    ];

    public static readonly string[] CategoryColors = ["work", "personal", "shopping", "fitness", "other"];
}
