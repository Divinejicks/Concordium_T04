using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProtectsController : ControllerBase
    {
        readonly ILogger _logger;
        readonly IDbService _db;

        public ProtectsController(ILogger<ProtectsController> logger, IDbService db)
        {
            _logger = logger;
            _db = db;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> Get()
        {
            var uesrId = GetUserId();
            if(uesrId == null)
            {
                throw new Exception("UserId most not be null");
            }

            return Ok(uesrId);
        }



        private string? GetUserId()
        {
            var identity = HttpContext.User.Identity as ClaimsIdentity;
            if (identity != null)
            {
                var userClaims = identity.Claims;
                return userClaims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier)?.Value; 
            };

            return null;
        }
    }
}
