namespace TaskFlow.Services;

public static class TimeUtils
{
    // Giờ Việt Nam (UTC+7)
    public static DateTime VNNow => DateTime.UtcNow.AddHours(7);
    public static DateTime VNToday => VNNow.Date;
}
