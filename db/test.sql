-- ==========================================
-- Tên tệp: db/test.sql
-- Mô tả: Thử nghiệm hoạt động của các Stored Procedure
-- ==========================================

USE TaskFlowDB;
GO

PRINT '=======================================================';
PRINT '1. KIỂM TRA LẤY DANH SÁCH DANH MỤC (sp_GetCategories)';
PRINT '=======================================================';
EXEC sp_GetCategories;
GO

PRINT '=======================================================';
PRINT '2. KIỂM TRA LẤY TOÀN BỘ CÔNG VIỆC KÈM SUBTASKS JSON (sp_GetTasks)';
PRINT '=======================================================';
EXEC sp_GetTasks;
GO

PRINT '=======================================================';
PRINT '3. KIỂM TRA TẠO MỚI CÔNG VIỆC (sp_AddTask)';
PRINT '=======================================================';
DECLARE @NewTaskId INT;
DECLARE @Tomorrow DATE = CAST(DATEADD(day, 1, GETDATE()) AS DATE);

EXEC sp_AddTask 
    @Title = N'Kiểm thử Stored Procedure và Tích hợp API',
    @Description = N'Giai đoạn kiểm thử chất lượng dữ liệu và tốc độ thực thi truy vấn của SQL Server.',
    @Status = 'todo',
    @Priority = 'high',
    @CategoryId = 'work',
    @DueDate = @Tomorrow,
    @TaskId = @NewTaskId OUTPUT;

PRINT N'-> ID của công việc vừa tạo: ' + CAST(@NewTaskId AS VARCHAR(10));
GO

PRINT '=======================================================';
PRINT '4. KIỂM TRA LẤY CÔNG VIỆC THEO ID VỪA TẠO (sp_GetTaskById)';
PRINT '=======================================================';
-- Sử dụng lại ID vừa tạo ở bước trước (giả định là ID lớn nhất trong bảng Tasks)
DECLARE @LatestId INT = (SELECT MAX(Id) FROM Tasks);
EXEC sp_GetTaskById @Id = @LatestId;
GO

PRINT '=======================================================';
PRINT '5. KIỂM TRA ĐỒNG BỘ CÔNG VIỆC CON DẠNG JSON (sp_SyncSubtasks)';
PRINT '=======================================================';
DECLARE @LatestId INT = (SELECT MAX(Id) FROM Tasks);
DECLARE @SubtasksJson NVARCHAR(MAX) = N'[
    {"text": "Kiểm tra kết nối Database", "completed": 1},
    {"text": "Chạy thử lệnh EXEC SP", "completed": 0},
    {"text": "Đánh giá hiệu suất JSON", "completed": 0}
]';

PRINT N'-> Đồng bộ danh sách công việc con cho Task ID: ' + CAST(@LatestId AS VARCHAR(10));
EXEC sp_SyncSubtasks @TaskId = @LatestId, @SubtasksJson = @SubtasksJson;

-- Lấy lại để xác minh
EXEC sp_GetTaskById @Id = @LatestId;
GO

PRINT '=======================================================';
PRINT '6. KIỂM TRA CẬP NHẬT TRẠNG THÁI KÉO THẢ (sp_UpdateTaskStatus)';
PRINT '=======================================================';
DECLARE @LatestId INT = (SELECT MAX(Id) FROM Tasks);
PRINT N'-> Chuyển Task ID ' + CAST(@LatestId AS VARCHAR(10)) + N' sang "inprogress"';
EXEC sp_UpdateTaskStatus @Id = @LatestId, @Status = 'inprogress';

-- Xác minh cột Status
SELECT Id, Title, Status FROM Tasks WHERE Id = @LatestId;
GO

PRINT '=======================================================';
PRINT '7. KIỂM TRA XÓA CÔNG VIỆC VÀ CASCADE XÓA SUBTASKS (sp_DeleteTask)';
PRINT '=======================================================';
DECLARE @LatestId INT = (SELECT MAX(Id) FROM Tasks);
PRINT N'-> Xóa Task ID: ' + CAST(@LatestId AS VARCHAR(10));
EXEC sp_DeleteTask @Id = @LatestId;

-- Xác minh xem Task còn tồn tại không
IF NOT EXISTS (SELECT 1 FROM Tasks WHERE Id = @LatestId)
    PRINT N'-> Xác nhận: Công việc chính đã được xóa thành công.';
ELSE
    PRINT N'-> LỖI: Công việc chính chưa được xóa.';

-- Xác minh xem Subtasks tương ứng đã bị tự động xóa chưa
IF NOT EXISTS (SELECT 1 FROM Subtasks WHERE TaskId = @LatestId)
    PRINT N'-> Xác nhận: Toàn bộ công việc con liên quan cũng bị xóa sạch (Cascade Delete).';
ELSE
    PRINT N'-> LỖI: Công việc con vẫn chưa bị xóa.';
GO
PRINT '=======================================================';
PRINT 'HOÀN THÀNH BÀI THỬ NGHIỆM ĐÁNH GIÁ CHẤT LƯỢNG DATABASE';
PRINT '=======================================================';
GO
