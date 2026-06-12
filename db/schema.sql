-- ==========================================
-- Tên tệp: db/schema.sql
-- Mô tả: Tạo cơ sở dữ liệu TaskFlowDB và các bảng
-- ==========================================

USE master;
GO

-- 1. Xóa cơ sở dữ liệu cũ nếu đang tồn tại để tránh xung đột
IF EXISTS (SELECT * FROM sys.databases WHERE name = 'TaskFlowDB')
BEGIN
    ALTER DATABASE TaskFlowDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE TaskFlowDB;
END
GO

-- 2. Tạo mới cơ sở dữ liệu
CREATE DATABASE TaskFlowDB;
GO

USE TaskFlowDB;
GO

-- 3. Tạo bảng Danh mục (Categories)
CREATE TABLE Categories (
    Id VARCHAR(50) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Color VARCHAR(50) NOT NULL,
    Icon VARCHAR(50) NOT NULL
);
GO

-- 3.5. Tạo bảng Dự án (Projects)
CREATE TABLE Projects (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    CategoryId VARCHAR(50) NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Projects_Categories FOREIGN KEY (CategoryId) REFERENCES Categories(Id) 
        ON DELETE CASCADE ON UPDATE CASCADE
);
GO

-- 4. Tạo bảng Công việc chính (Tasks)
CREATE TABLE Tasks (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    Status VARCHAR(50) NOT NULL DEFAULT 'todo',
    Priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    ProjectId INT NOT NULL,
    DueDate DATE NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    
    -- Các ràng buộc
    CONSTRAINT FK_Tasks_Projects FOREIGN KEY (ProjectId) REFERENCES Projects(Id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT CK_Tasks_Status CHECK (Status IN ('todo', 'inprogress', 'inreview', 'done')),
    CONSTRAINT CK_Tasks_Priority CHECK (Priority IN ('high', 'medium', 'low'))
);
GO

-- 5. Tạo bảng Công việc con (Subtasks)
CREATE TABLE Subtasks (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    TaskId INT NOT NULL,
    Text NVARCHAR(255) NOT NULL,
    Completed BIT NOT NULL DEFAULT 0,
    
    -- Các ràng buộc
    CONSTRAINT FK_Subtasks_Tasks FOREIGN KEY (TaskId) REFERENCES Tasks(Id) 
        ON DELETE CASCADE
);
GO

-- 6. Tạo chỉ mục (Indexes)
CREATE INDEX IX_Projects_CategoryId ON Projects(CategoryId);
CREATE INDEX IX_Tasks_ProjectId ON Tasks(ProjectId);
CREATE INDEX IX_Tasks_Status ON Tasks(Status);
CREATE INDEX IX_Subtasks_TaskId ON Subtasks(TaskId);
GO
