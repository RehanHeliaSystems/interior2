using Microsoft.EntityFrameworkCore;

namespace AdminDashboard.Data;

public class LeadDbContext(DbContextOptions<LeadDbContext> options) : DbContext(options)
{
    public DbSet<Lead> Leads => Set<Lead>();
}
