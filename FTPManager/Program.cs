var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();

// allow 3rd party cookies
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.SameSite = SameSiteMode.None;
});

var app = builder.Build();

app.UseExceptionHandler("/Home/Error");

app.UseStatusCodePagesWithReExecute("/FTP/Index");

app.UseStaticFiles();

app.UseCookiePolicy(new CookiePolicyOptions
{
    MinimumSameSitePolicy = SameSiteMode.None,
});

app.UseRouting();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();