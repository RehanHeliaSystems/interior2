using AdminDashboard.Data;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace AdminDashboard.Pages;

[Authorize]
public class IndexModel(LeadDbContext db) : PageModel
{
    public List<Lead> Leads { get; set; } = [];
    public int Total { get; set; }
    public int NewCount { get; set; }
    public int ContactedCount { get; set; }
    public int ClosedCount { get; set; }

    [BindProperty(SupportsGet = true)]
    public string Status { get; set; } = "all";

    [BindProperty(SupportsGet = true)]
    public string? Q { get; set; }

    public async Task OnGetAsync()
    {
        var all = await db.Leads.OrderByDescending(l => l.CreatedAt).ToListAsync();
        Total = all.Count;
        NewCount = all.Count(l => l.Status == "new");
        ContactedCount = all.Count(l => l.Status == "contacted");
        ClosedCount = all.Count(l => l.Status == "closed");

        var filtered = Status == "all" ? all : all.Where(l => l.Status == Status);

        if (!string.IsNullOrWhiteSpace(Q))
        {
            var q = Q.Trim();
            filtered = filtered.Where(l =>
                l.Name.Contains(q, StringComparison.OrdinalIgnoreCase) ||
                l.Phone.Contains(q, StringComparison.OrdinalIgnoreCase) ||
                l.Email.Contains(q, StringComparison.OrdinalIgnoreCase));
        }

        Leads = filtered.ToList();
    }

    public async Task<IActionResult> OnPostUpdateStatusAsync(string id, string newStatus, string status, string? q)
    {
        var lead = await db.Leads.FindAsync(id);
        if (lead is not null && newStatus is "new" or "contacted" or "closed")
        {
            lead.Status = newStatus;
            await db.SaveChangesAsync();
        }
        return RedirectToPage(new { status, q });
    }

    public async Task<IActionResult> OnPostDeleteAsync(string id, string status, string? q)
    {
        var lead = await db.Leads.FindAsync(id);
        if (lead is not null)
        {
            db.Leads.Remove(lead);
            await db.SaveChangesAsync();
        }
        return RedirectToPage(new { status, q });
    }

    public async Task<IActionResult> OnPostLogoutAsync()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return RedirectToPage("/Login");
    }
}
