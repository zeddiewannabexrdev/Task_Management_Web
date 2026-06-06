-- ==========================================
-- Tên tệp: db/seed.sql
-- Mô tả: Chèn dữ liệu thử nghiệm ban đầu (Seed Data) cho lĩnh vực XR & AI
-- ==========================================

USE TaskFlowDB;
GO

-- 1. Làm sạch dữ liệu cũ trong bảng để tránh chèn trùng
DELETE FROM Subtasks;
DELETE FROM Tasks;
DELETE FROM Categories;
GO

-- 2. Chèn dữ liệu vào bảng Danh mục / Dự án (Categories)
INSERT INTO Categories (Id, Name, Color, Icon) VALUES
('vr', N'Virtual Reality (VR)', 'work', 'Glasses'),
('ar', N'Augmented Reality (AR)', 'personal', 'Smartphone'),
('mr', N'Mixed Reality (MR)', 'fitness', 'Layers'),
('xr', N'Extended Reality (XR)', 'shopping', 'Cpu'),
('ai', N'Artificial Intelligence (AI)', 'other', 'Brain');
GO

-- 3. Khai báo biến lưu giữ ID của các công việc chính vừa được tạo
DECLARE @Task1Id INT, @Task2Id INT, @Task3Id INT, @Task4Id INT, @Task5Id INT, @Task6Id INT;
DECLARE @Today DATE = CAST(GETDATE() AS DATE);
DECLARE @Yesterday DATE = CAST(DATEADD(day, -1, GETDATE()) AS DATE);
DECLARE @Tomorrow DATE = CAST(DATEADD(day, 1, GETDATE()) AS DATE);
DECLARE @NextWeek DATE = CAST(DATEADD(day, 5, GETDATE()) AS DATE);

-- Task 1 (AI)
INSERT INTO Tasks (Title, Description, Status, Priority, CategoryId, DueDate, CreatedAt)
VALUES (
    N'Tích hợp nhận diện cử chỉ tay (Gesture Tracking) bằng MediaPipe',
    N'Thiết lập luồng xử lý dữ liệu camera trực tiếp, tải mô hình nhận dạng tay của MediaPipe và ánh xạ các cử chỉ tay (pinch, grab, point) thành các sự kiện điều khiển trong không gian ảo.',
    'inprogress', 'high', 'ai', @Today, DATEADD(day, -1, GETDATE())
);
SET @Task1Id = SCOPE_IDENTITY();

-- Task 2 (VR)
INSERT INTO Tasks (Title, Description, Status, Priority, CategoryId, DueDate, CreatedAt)
VALUES (
    N'Tối ưu hóa hiệu năng render (Draw Calls) trên Meta Quest 3',
    N'Phân tích hiệu năng bằng Oculus Profiler, kích hoạt static batching, bake lightmaps trong Unity và giảm thiểu các vật liệu không cần thiết để đạt tốc độ khung hình ổn định 90 FPS.',
    'done', 'high', 'vr', @Yesterday, DATEADD(day, -1, GETDATE())
);
SET @Task2Id = SCOPE_IDENTITY();

-- Task 3 (AR)
INSERT INTO Tasks (Title, Description, Status, Priority, CategoryId, DueDate, CreatedAt)
VALUES (
    N'Phát triển tính năng định vị không gian (Spatial Anchors)',
    N'Nghiên cứu API ARKit/ARCore Spatial Anchors, viết dịch vụ lưu trữ tọa độ mỏ neo không gian và thực nghiệm định vị đối tượng ảo tại các vị trí vật lý cố định.',
    'todo', 'medium', 'ar', @Tomorrow, DATEADD(day, -1, GETDATE())
);
SET @Task3Id = SCOPE_IDENTITY();

-- Task 4 (MR)
INSERT INTO Tasks (Title, Description, Status, Priority, CategoryId, DueDate, CreatedAt)
VALUES (
    N'Thiết kế tương tác vật lý với đối tượng ảo (Hand Physics)',
    N'Cấu hình các thuộc tính collider vật lý, tích hợp các cử chỉ tương tác chạm (poke) và cầm nắm (grab) của Meta Interaction SDK, sửa lỗi clipping hình ảnh khi cầm nắm.',
    'inreview', 'high', 'mr', @Today, DATEADD(day, -1, GETDATE())
);
SET @Task4Id = SCOPE_IDENTITY();

-- Task 5 (AI)
INSERT INTO Tasks (Title, Description, Status, Priority, CategoryId, DueDate, CreatedAt)
VALUES (
    N'Tinh chỉnh mô hình LLM làm hướng dẫn viên ảo trong phòng VR',
    N'Thu thập tập dữ liệu hội thoại hướng dẫn du lịch, tiến hành tinh chỉnh mô hình ngôn ngữ lớn (LLM) cục bộ và tích hợp kết nối WebSockets thời gian thực giữa ứng dụng VR và máy chủ AI.',
    'todo', 'medium', 'ai', @NextWeek, GETDATE()
);
SET @Task5Id = SCOPE_IDENTITY();

-- Task 6 (XR)
INSERT INTO Tasks (Title, Description, Status, Priority, CategoryId, DueDate, CreatedAt)
VALUES (
    N'Tích hợp OpenXR SDK cho dự án đa nền tảng',
    N'Cài đặt và thiết lập OpenXR Plugin, cấu hình ánh xạ hệ thống nút bấm của các loại tay cầm điều khiển (Quest, Index, Cosmos) và kiểm thử bản build trên Meta Quest và Apple Vision Pro.',
    'done', 'low', 'xr', @Yesterday, DATEADD(day, -1, GETDATE())
);
SET @Task6Id = SCOPE_IDENTITY();


-- 4. Chèn dữ liệu vào bảng Công việc con (Subtasks)
-- Subtasks cho Task 1 (AI)
INSERT INTO Subtasks (TaskId, Text, Completed) VALUES
(@Task1Id, N'Thiết lập luồng đầu vào Camera trực tiếp', 1),
(@Task1Id, N'Tải mô hình nhận dạng bàn tay MediaPipe', 1),
(@Task1Id, N'Ánh xạ cử chỉ tay thành sự kiện điều khiển', 0);

-- Subtasks cho Task 2 (VR)
INSERT INTO Subtasks (TaskId, Text, Completed) VALUES
(@Task2Id, N'Bật tính năng Static Batching & GPU Instancing', 1),
(@Task2Id, N'Thực hiện nướng bản đồ ánh sáng (Bake Lightmaps)', 1),
(@Task2Id, N'Kiểm tra tốc độ khung hình bằng Oculus Profiler', 1);

-- Subtasks cho Task 3 (AR)
INSERT INTO Subtasks (TaskId, Text, Completed) VALUES
(@Task3Id, N'Nghiên cứu tài liệu API Spatial Anchors của ARKit/ARCore', 0),
(@Task3Id, N'Viết mã dịch vụ lưu trữ tọa độ điểm neo không gian', 0),
(@Task3Id, N'Kiểm thử định vị đối tượng ảo tại vị trí vật lý cố định', 0);

-- Subtasks cho Task 4 (MR)
INSERT INTO Subtasks (TaskId, Text, Completed) VALUES
(@Task4Id, N'Cấu hình các thuộc tính collider vật lý cho đối tượng ảo', 1),
(@Task4Id, N'Tích hợp cử chỉ chạm và cầm nắm của Interaction SDK', 1),
(@Task4Id, N'Khắc phục lỗi xuyên vân (clipping) khi tương tác cầm nắm', 0);

-- Subtasks cho Task 5 (AI)
INSERT INTO Subtasks (TaskId, Text, Completed) VALUES
(@Task5Id, N'Thu thập tập dữ liệu hội thoại hướng dẫn viên', 0),
(@Task5Id, N'Tinh chỉnh mô hình ngôn ngữ lớn (LLM) cục bộ', 0),
(@Task5Id, N'Tích hợp kết nối WebSockets thời gian thực', 0);

-- Subtasks cho Task 6 (XR)
INSERT INTO Subtasks (TaskId, Text, Completed) VALUES
(@Task6Id, N'Cài đặt OpenXR Plugin và cấu hình đầu vào', 1),
(@Task6Id, N'Thiết lập bản build kiểm thử trên Meta Quest và Apple Vision Pro', 1);
GO
