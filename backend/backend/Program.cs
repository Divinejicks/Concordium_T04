using backend;

var builder = WebApplication.CreateBuilder(args);

var appConfig = builder.Configuration.GetSection("app").Get<Appconfig>() ?? new Appconfig();

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddTransient<IDbService, DbService>();

builder.Services.AddCors();

var app = builder.Build();

if (!string.IsNullOrWhiteSpace(appConfig?.allowCorsOrigin))
{
    app.UseCors(c =>
    {
        c.WithOrigins(appConfig.allowCorsOrigin)
        .AllowAnyHeader().AllowAnyMethod().AllowCredentials();
    });
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();

public class Appconfig
{
    public string? allowCorsOrigin { get; set; }
}
