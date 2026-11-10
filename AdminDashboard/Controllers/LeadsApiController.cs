using System.Text.RegularExpressions;
using AdminDashboard.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;

namespace AdminDashboard.Controllers;

public record CreateLeadRequest(
    string? Name,
    string? Phone,
    string? Email,
    string? HomeType,
    string? City,
    string? Message,
    string? Source
);

[ApiController]
[Route("api/leads")]
public partial class LeadsApiController(LeadDbContext db) : ControllerBase
{
    [GeneratedRegex(@"^[0-9]{10}$")]
    private static partial Regex PhonePattern();

    // Public endpoint — the marketing site (a different origin) posts new
    // consultation requests here. No auth required to submit a lead.
    [HttpPost]
    [AllowAnonymous]
    [EnableCors("SiteOrigins")]
    public async Task<IActionResult> Create([FromBody] CreateLeadRequest request)
    {
        var phone = request.Phone?.Trim() ?? "";
        if (!PhonePattern().IsMatch(phone))
        {
            return BadRequest(new { error = "A valid 10-digit phone number is required" });
        }

        var lead = new Lead
        {
            Name = request.Name?.Trim() ?? "",
            Phone = phone,
            Email = request.Email?.Trim() ?? "",
            HomeType = request.HomeType?.Trim() ?? "",
            City = request.City?.Trim() ?? "",
            Message = request.Message?.Trim() ?? "",
            Source = string.IsNullOrWhiteSpace(request.Source) ? "unknown" : request.Source,
        };

        db.Leads.Add(lead);
        await db.SaveChangesAsync();

        return StatusCode(201, lead);
    }
}
