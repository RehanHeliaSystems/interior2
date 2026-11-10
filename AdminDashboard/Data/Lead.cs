namespace AdminDashboard.Data;

public class Lead
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Email { get; set; } = "";
    public string HomeType { get; set; } = "";
    public string City { get; set; } = "";
    public string Message { get; set; } = "";
    public string Source { get; set; } = "unknown";
    public string Status { get; set; } = "new";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
