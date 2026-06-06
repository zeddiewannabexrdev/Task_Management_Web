-- ==========================================
-- Tên tệp: db/procedures.sql
-- Mô tả: Định nghĩa các Stored Procedure cho TaskFlowDB
-- ==========================================

USE TaskFlowDB;
GO

-- ==========================================
-- I. THỦ TỤC LIÊN QUAN ĐẾN DANH MỤC (CATEGORIES)
-- ==========================================

-- 1. Lấy tất cả danh mục
CREATE OR ALTER PROCEDURE sp_GetCategories
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Name, Color, Icon 
    FROM Categories;
END;
GO

-- 2. Thêm danh mục mới
CREATE OR ALTER PROCEDURE sp_AddCategory
    @Id VARCHAR(50),
    @Name NVARCHAR(100),
    @Color VARCHAR(50),
    @Icon VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Categories (Id, Name, Color, Icon)
    VALUES (@Id, @Name, @Color, @Icon);
END;
GO


-- ==========================================
-- II. THỦ TỤC LIÊN QUAN ĐẾN CÔNG VIỆC CHÍNH (TASKS)
-- ==========================================

-- 1. Lấy tất cả công việc (kèm mảng subtasks dạng JSON)
CREATE OR ALTER PROCEDURE sp_GetTasks
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        t.Id, 
        t.Title, 
        t.Description, 
        t.Status, 
        t.Priority, 
        t.CategoryId, 
        t.DueDate, 
        t.CreatedAt,
        ISNULL(
            (SELECT s.Id, s.Text, s.Completed 
             FROM Subtasks s 
             WHERE s.TaskId = t.Id 
             FOR JSON PATH), 
            '[]'
        ) AS SubtasksJson
    FROM Tasks t
    ORDER BY t.CreatedAt DESC;
END;
GO

-- 2. Lấy công việc chi tiết theo ID (kèm mảng subtasks dạng JSON)
CREATE OR ALTER PROCEDURE sp_GetTaskById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        t.Id, 
        t.Title, 
        t.Description, 
        t.Status, 
        t.Priority, 
        t.CategoryId, 
        t.DueDate, 
        t.CreatedAt,
        ISNULL(
            (SELECT s.Id, s.Text, s.Completed 
             FROM Subtasks s 
             WHERE s.TaskId = t.Id 
             FOR JSON PATH), 
            '[]'
        ) AS SubtasksJson
    FROM Tasks t
    WHERE t.Id = @Id;
END;
GO

-- 3. Thêm công việc chính mới
CREATE OR ALTER PROCEDURE sp_AddTask
    @Title NVARCHAR(255),
    @Description NVARCHAR(MAX) = NULL,
    @Status VARCHAR(50) = 'todo',
    @Priority VARCHAR(50) = 'medium',
    @CategoryId VARCHAR(50),
    @DueDate DATE,
    @TaskId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Tasks (Title, Description, Status, Priority, CategoryId, DueDate)
    VALUES (@Title, @Description, @Status, @Priority, @CategoryId, @DueDate);
    
    SET @TaskId = SCOPE_IDENTITY();
END;
GO

-- 4. Cập nhật chi tiết công việc chính
CREATE OR ALTER PROCEDURE sp_UpdateTask
    @Id INT,
    @Title NVARCHAR(255),
    @Description NVARCHAR(MAX) = NULL,
    @Status VARCHAR(50),
    @Priority VARCHAR(50),
    @CategoryId VARCHAR(50),
    @DueDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Tasks
    SET Title = @Title,
        Description = @Description,
        Status = @Status,
        Priority = @Priority,
        CategoryId = @CategoryId,
        DueDate = @DueDate
    WHERE Id = @Id;
END;
GO

-- 5. Xóa công việc chính (tự động xóa subtasks nhờ CASCADE)
CREATE OR ALTER PROCEDURE sp_DeleteTask
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM Tasks 
    WHERE Id = @Id;
END;
GO

-- 6. Cập nhật nhanh trạng thái công việc (dành cho kéo thả Kanban)
CREATE OR ALTER PROCEDURE sp_UpdateTaskStatus
    @Id INT,
    @Status VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Tasks
    SET Status = @Status
    WHERE Id = @Id;
END;
GO


-- ==========================================
-- III. THỦ TỤC LIÊN QUAN ĐẾN CÔNG VIỆC CON (SUBTASKS)
-- ==========================================

-- 1. Thêm một công việc con mới
CREATE OR ALTER PROCEDURE sp_AddSubtask
    @TaskId INT,
    @Text NVARCHAR(255),
    @Completed BIT = 0,
    @SubtaskId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Subtasks (TaskId, Text, Completed)
    VALUES (@TaskId, @Text, @Completed);
    
    SET @SubtaskId = SCOPE_IDENTITY();
END;
GO

-- 2. Bật/tắt trạng thái hoàn thành công việc con
CREATE OR ALTER PROCEDURE sp_ToggleSubtask
    @Id INT,
    @Completed BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Subtasks
    SET Completed = @Completed
    WHERE Id = @Id;
END;
GO

-- 3. Xóa một công việc con
CREATE OR ALTER PROCEDURE sp_DeleteSubtask
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM Subtasks
    WHERE Id = @Id;
END;
GO

-- 4. Đồng bộ hóa danh sách công việc con bằng JSON
-- Nhận vào danh sách công việc con dạng mảng JSON và cập nhật lại tương ứng
CREATE OR ALTER PROCEDURE sp_SyncSubtasks
    @TaskId INT,
    @SubtasksJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Xóa toàn bộ subtasks cũ của Task này
        DELETE FROM Subtasks 
        WHERE TaskId = @TaskId;

        -- Thêm lại các subtasks từ mảng JSON
        IF @SubtasksJson IS NOT NULL AND ISJSON(@SubtasksJson) > 0
        BEGIN
            INSERT INTO Subtasks (TaskId, Text, Completed)
            SELECT 
                @TaskId, 
                Text, 
                ISNULL(Completed, 0)
            FROM OPENJSON(@SubtasksJson)
            WITH (
                Text NVARCHAR(255) '$.text',
                Completed BIT '$.completed'
            );
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
