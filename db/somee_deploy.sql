-- ==========================================
-- Tên tệp: db/somee_deploy.sql
-- Mô tả: Script SQL dành riêng cho Somee.com
-- HƯỚNG DẪN: Chạy file này trong Somee SQL Manager
-- (Somee đã tạo sẵn database, KHÔNG cần CREATE DATABASE)
-- ==========================================

-- =====================
-- PHẦN 1: TẠO BẢNG
-- =====================

-- Tạo bảng Danh mục / Dự án (Categories)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Categories' AND xtype='U')
CREATE TABLE Categories (
    Id VARCHAR(50) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Color VARCHAR(50) NOT NULL,
    Icon VARCHAR(50) NOT NULL
);
GO

-- Tạo bảng Công việc chính (Tasks)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Tasks' AND xtype='U')
CREATE TABLE Tasks (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    Status VARCHAR(50) NOT NULL DEFAULT 'todo',
    Priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    CategoryId VARCHAR(50) NOT NULL,
    DueDate DATE NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Tasks_Categories FOREIGN KEY (CategoryId) REFERENCES Categories(Id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT CK_Tasks_Status CHECK (Status IN ('todo', 'inprogress', 'inreview', 'done')),
    CONSTRAINT CK_Tasks_Priority CHECK (Priority IN ('high', 'medium', 'low'))
);
GO

-- Tạo bảng Công việc con (Subtasks)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Subtasks' AND xtype='U')
CREATE TABLE Subtasks (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    TaskId INT NOT NULL,
    Text NVARCHAR(255) NOT NULL,
    Completed BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_Subtasks_Tasks FOREIGN KEY (TaskId) REFERENCES Tasks(Id)
        ON DELETE CASCADE
);
GO

-- Tạo Index tối ưu truy vấn
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Tasks_CategoryId')
    CREATE INDEX IX_Tasks_CategoryId ON Tasks(CategoryId);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Tasks_Status')
    CREATE INDEX IX_Tasks_Status ON Tasks(Status);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Subtasks_TaskId')
    CREATE INDEX IX_Subtasks_TaskId ON Subtasks(TaskId);
GO

-- =====================
-- PHẦN 2: STORED PROCEDURES
-- =====================

CREATE OR ALTER PROCEDURE sp_GetCategories
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Name, Color, Icon FROM Categories;
END;
GO

CREATE OR ALTER PROCEDURE sp_AddCategory
    @Id VARCHAR(50), @Name NVARCHAR(100), @Color VARCHAR(50), @Icon VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Categories (Id, Name, Color, Icon) VALUES (@Id, @Name, @Color, @Icon);
END;
GO

CREATE OR ALTER PROCEDURE sp_GetTasks
AS
BEGIN
    SET NOCOUNT ON;
    SELECT t.Id, t.Title, t.Description, t.Status, t.Priority, t.CategoryId, t.DueDate, t.CreatedAt,
        ISNULL((SELECT s.Id, s.Text, s.Completed FROM Subtasks s WHERE s.TaskId = t.Id FOR JSON PATH), '[]') AS SubtasksJson
    FROM Tasks t
    ORDER BY t.CreatedAt DESC;
END;
GO

CREATE OR ALTER PROCEDURE sp_GetTaskById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT t.Id, t.Title, t.Description, t.Status, t.Priority, t.CategoryId, t.DueDate, t.CreatedAt,
        ISNULL((SELECT s.Id, s.Text, s.Completed FROM Subtasks s WHERE s.TaskId = t.Id FOR JSON PATH), '[]') AS SubtasksJson
    FROM Tasks t WHERE t.Id = @Id;
END;
GO

CREATE OR ALTER PROCEDURE sp_AddTask
    @Title NVARCHAR(255), @Description NVARCHAR(MAX) = NULL,
    @Status VARCHAR(50) = 'todo', @Priority VARCHAR(50) = 'medium',
    @CategoryId VARCHAR(50), @DueDate DATE, @TaskId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Tasks (Title, Description, Status, Priority, CategoryId, DueDate)
    VALUES (@Title, @Description, @Status, @Priority, @CategoryId, @DueDate);
    SET @TaskId = SCOPE_IDENTITY();
END;
GO

CREATE OR ALTER PROCEDURE sp_UpdateTask
    @Id INT, @Title NVARCHAR(255), @Description NVARCHAR(MAX) = NULL,
    @Status VARCHAR(50), @Priority VARCHAR(50), @CategoryId VARCHAR(50), @DueDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Tasks SET Title=@Title, Description=@Description, Status=@Status,
        Priority=@Priority, CategoryId=@CategoryId, DueDate=@DueDate WHERE Id=@Id;
END;
GO

CREATE OR ALTER PROCEDURE sp_DeleteTask
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM Tasks WHERE Id = @Id;
END;
GO

CREATE OR ALTER PROCEDURE sp_UpdateTaskStatus
    @Id INT, @Status VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Tasks SET Status = @Status WHERE Id = @Id;
END;
GO

CREATE OR ALTER PROCEDURE sp_SyncSubtasks
    @TaskId INT, @SubtasksJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DELETE FROM Subtasks WHERE TaskId = @TaskId;
        IF @SubtasksJson IS NOT NULL AND ISJSON(@SubtasksJson) > 0
        BEGIN
            INSERT INTO Subtasks (TaskId, Text, Completed)
            SELECT @TaskId, Text, ISNULL(Completed, 0)
            FROM OPENJSON(@SubtasksJson)
            WITH (Text NVARCHAR(255) '$.text', Completed BIT '$.completed');
        END
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- =====================
-- PHẦN 3: DỮ LIỆU MẪU (tùy chọn)
-- =====================

-- Chèn danh mục nếu chưa có
IF NOT EXISTS (SELECT 1 FROM Categories WHERE Id = 'vr')
INSERT INTO Categories (Id, Name, Color, Icon) VALUES
('vr', N'Virtual Reality (VR)', 'work', 'Glasses'),
('ar', N'Augmented Reality (AR)', 'personal', 'Smartphone'),
('mr', N'Mixed Reality (MR)', 'fitness', 'Layers'),
('xr', N'Extended Reality (XR)', 'shopping', 'Cpu'),
('ai', N'Artificial Intelligence (AI)', 'other', 'Brain');
GO
