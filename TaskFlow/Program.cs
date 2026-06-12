using TaskFlow.Services;

var builder = WebApplication.CreateBuilder(args);

// ── Blazor Server ──────────────────────────────────────────────────────────
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

// ── SignalR tuning (quan trọng cho Somee.com) ──────────────────────────────
builder.Services.AddServerSideBlazor(options =>
{
    options.DetailedErrors = builder.Environment.IsDevelopment();
    options.DisconnectedCircuitMaxRetained = 100;
    options.DisconnectedCircuitRetentionPeriod = TimeSpan.FromMinutes(3);
    options.JSInteropDefaultCallTimeout = TimeSpan.FromSeconds(60);
});

// ── Services ───────────────────────────────────────────────────────────────
var connStr = builder.Configuration.GetConnectionString("DefaultConnection") ?? "";
builder.Services.AddScoped(_ => new TaskService(connStr));
builder.Services.AddScoped<AppState>();

var app = builder.Build();

// ── Middleware ─────────────────────────────────────────────────────────────
if (!app.Environment.IsDevelopment())
    app.UseExceptionHandler("/Error");

app.UseStaticFiles();
app.UseAntiforgery();

app.MapRazorComponents<TaskFlow.Components.App>()
   .AddInteractiveServerRenderMode();

app.Run();
