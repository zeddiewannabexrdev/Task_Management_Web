using TaskFlow.Models;

namespace TaskFlow.Services;

/// <summary>
/// Scoped singleton state — thay thế React Context. 
/// Mỗi tab/session trình duyệt có một instance riêng.
/// </summary>
public class AppState(TaskService db)
{
    // ─── DATA ─────────────────────────────────────────────────────────────────
    public List<TaskItem> Tasks { get; private set; } = [];
    public List<Category> Categories { get; private set; } = [];
    public List<ProjectItem> Projects { get; private set; } = [];
    public bool IsLoading { get; private set; }
    public string? ErrorMessage { get; private set; }

    // ─── UI STATE ─────────────────────────────────────────────────────────────
    public string Theme { get; private set; } = "dark";
    public string CurrentView { get; private set; } = "dashboard";

    // ─── FILTERS ──────────────────────────────────────────────────────────────
    public string SearchQuery { get; private set; } = "";
    public string PriorityFilter { get; private set; } = "all";
    public string DateFilter { get; private set; } = "all";
    public string CategoryFilter { get; private set; } = "all";
    public int? SelectedProjectId { get; private set; }

    // ─── DRAWER ───────────────────────────────────────────────────────────────
    public bool IsDrawerOpen { get; private set; }
    public TaskItem? EditingTask { get; private set; }
    public bool IsNewTask { get; private set; }
    public string DefaultStatus { get; private set; } = "todo";

    // ─── NOTIFICATION ─────────────────────────────────────────────────────────
    public event Action? OnChange;
    private void Notify() => OnChange?.Invoke();

    // ─── INIT ─────────────────────────────────────────────────────────────────
    public async Task InitializeAsync()
    {
        if (Tasks.Count > 0 || IsLoading) return; // Tránh gọi lại khi đã load
        IsLoading = true;
        Notify();
        try
        {
            Categories = await db.GetCategoriesAsync();
            Projects = await db.GetProjectsAsync();
            Tasks = await db.GetTasksAsync();
            ErrorMessage = null;
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Lỗi kết nối database: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
            Notify();
        }
    }

    // ─── FILTERED VIEW ────────────────────────────────────────────────────────
    public IReadOnlyList<TaskItem> GetFilteredTasks()
    {
        var today = DateTime.Today.ToString("yyyy-MM-dd");
        return Tasks.Where(t =>
        {
            if (!string.IsNullOrEmpty(SearchQuery) &&
                !t.Title.Contains(SearchQuery, StringComparison.OrdinalIgnoreCase) &&
                !t.Description.Contains(SearchQuery, StringComparison.OrdinalIgnoreCase))
                return false;

            if (SelectedProjectId.HasValue && t.ProjectId != SelectedProjectId.Value)
                return false;
            else if (!SelectedProjectId.HasValue && CategoryFilter != "all")
            {
                // Nếu không chọn Project mà chỉ lọc theo Category (ở Home)
                var catProjects = Projects.Where(p => p.CategoryId == CategoryFilter).Select(p => p.Id).ToList();
                if (!catProjects.Contains(t.ProjectId)) return false;
            }

            if (PriorityFilter != "all" && t.Priority != PriorityFilter)
                return false;

            return DateFilter switch
            {
                "today" => t.DueDate == today,
                "week" => DateTime.TryParse(t.DueDate, out var d) &&
                          d >= DateTime.Today && d <= DateTime.Today.AddDays(7),
                "overdue" => string.Compare(t.DueDate, today, StringComparison.Ordinal) < 0 &&
                             t.Status != "done",
                _ => true
            };
        }).ToList();
    }

    public int GetActiveTaskCount(int projectId) =>
        Tasks.Count(t => t.ProjectId == projectId && t.Status != "done");

    public int GetCategoryTaskCount(string catId)
    {
        if (catId == "all") return Tasks.Count(t => t.Status != "done");
        var pIds = Projects.Where(p => p.CategoryId == catId).Select(p => p.Id).ToList();
        return Tasks.Count(t => pIds.Contains(t.ProjectId) && t.Status != "done");
    }

    // ─── UI SETTERS ───────────────────────────────────────────────────────────
    public void SetTheme(string t) { Theme = t; Notify(); }
    public void SetView(string v) { CurrentView = v; Notify(); }
    public void SetSearch(string q) { SearchQuery = q; Notify(); }
    public void SetPriorityFilter(string f) { PriorityFilter = f; Notify(); }
    public void SetDateFilter(string f) { DateFilter = f; Notify(); }
    public void SetCategoryFilter(string f) { CategoryFilter = f; SelectedProjectId = null; Notify(); }
    public void SelectProject(int projectId) { SelectedProjectId = projectId; Notify(); }
    public void ClearFilters() { PriorityFilter = "all"; DateFilter = "all"; Notify(); }

    // ─── DRAWER ───────────────────────────────────────────────────────────────
    public void OpenNewTaskDrawer(string status = "todo")
    {
        IsNewTask = true;
        DefaultStatus = status;
        EditingTask = null;
        IsDrawerOpen = true;
        Notify();
    }

    public void OpenEditTaskDrawer(TaskItem task)
    {
        IsNewTask = false;
        EditingTask = task;
        IsDrawerOpen = true;
        Notify();
    }

    public void CloseDrawer()
    {
        IsDrawerOpen = false;
        EditingTask = null;
        Notify();
    }

    // ─── TASK MUTATIONS ───────────────────────────────────────────────────────
    public async Task AddTaskAsync(TaskInput input)
    {
        var created = await db.AddTaskAsync(input);
        if (created != null)
        {
            Tasks.Insert(0, created);
            Notify();
        }
    }

    public async Task UpdateTaskAsync(int id, TaskInput input)
    {
        var idx = Tasks.FindIndex(t => t.Id == id);
        TaskItem? oldTask = null;
        
        // Cập nhật giao diện ngay lập tức (Optimistic Update)
        if (idx >= 0)
        {
            oldTask = Tasks[idx];
            var tempTask = new TaskItem
            {
                Id = id,
                Title = input.Title,
                Description = input.Description ?? "",
                Status = input.Status,
                Priority = input.Priority,
                ProjectId = input.ProjectId,
                DueDate = input.DueDate,
                CreatedAt = oldTask.CreatedAt,
                Subtasks = input.Subtasks
            };
            Tasks[idx] = tempTask;
            Notify();
        }

        try
        {
            var updated = await db.UpdateTaskAsync(id, input);
            if (updated != null)
            {
                var newIdx = Tasks.FindIndex(t => t.Id == id);
                if (newIdx >= 0) Tasks[newIdx] = updated; // Cập nhật lại data chuẩn từ DB
                Notify();
            }
        }
        catch
        {
            if (oldTask != null)
            {
                var newIdx = Tasks.FindIndex(t => t.Id == id);
                if (newIdx >= 0) Tasks[newIdx] = oldTask; // Hoàn tác nếu lỗi
                Notify();
            }
        }
    }

    public async Task UpdateTaskStatusAsync(int id, string status)
    {
        var task = Tasks.FirstOrDefault(t => t.Id == id);
        if (task == null || task.Status == status) return;
        // Optimistic update
        task.Status = status;
        Notify();
        // Persist
        await db.UpdateTaskStatusAsync(id, status);
    }

    public async Task DeleteTaskAsync(int id)
    {
        var task = Tasks.FirstOrDefault(t => t.Id == id);
        if (task != null) Tasks.Remove(task);
        if (IsDrawerOpen && EditingTask?.Id == id)
            IsDrawerOpen = false;
        
        Notify(); // Cập nhật UI ngay lập tức

        try
        {
            await db.DeleteTaskAsync(id);
        }
        catch
        {
            if (task != null) Tasks.Add(task); // Hoàn tác nếu lỗi mạng
            Notify();
        }
    }

    // ─── CATEGORY MUTATIONS ───────────────────────────────────────────────────
    public async Task AddCategoryAsync(string name)
    {
        var id = name.Trim().ToLower().Replace(" ", "-");
        if (Categories.Any(c => c.Id == id)) return;

        var cat = new Category(
            id, name.Trim(),
            TaskLabels.CategoryColors[Categories.Count % TaskLabels.CategoryColors.Length],
            "FolderOpen"
        );
        await db.AddCategoryAsync(cat);
        Categories.Add(cat);
        Notify();
    }

    // ─── PROJECT MUTATIONS ────────────────────────────────────────────────────
    public async Task AddProjectAsync(string name, string categoryId)
    {
        var proj = await db.AddProjectAsync(name.Trim(), categoryId);
        Projects.Add(proj);
        Notify();
    }

    public async Task DeleteProjectAsync(int id)
    {
        var proj = Projects.FirstOrDefault(p => p.Id == id);
        if (proj != null) Projects.Remove(proj);
        
        // Remove tasks locally (DB does this via cascade)
        Tasks.RemoveAll(t => t.ProjectId == id);
        
        if (SelectedProjectId == id) SelectedProjectId = null;
        
        Notify();

        try
        {
            await db.DeleteProjectAsync(id);
        }
        catch (Exception ex)
        {
            Console.WriteLine("DELETE PROJECT ERROR: " + ex.ToString());
            if (proj != null) Projects.Add(proj);
            Notify();
        }
    }
}
