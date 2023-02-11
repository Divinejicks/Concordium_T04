using backend.models;
using Concordium;
using ConcordiumNetSdk;
using ConcordiumNetSdk.Responses.AccountInfoResponse;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace backend.Controllers
{
    public class Auth
    {
        public string JWT { get; set; }
    }


    [Route("api/[controller]")]
    [ApiController]
    public class VerifiersController : ControllerBase
    {
        readonly ILogger _logger;
        readonly IDbService _db;
        readonly IConfiguration _config;

        public VerifiersController(ILogger<VerifiersController> logger, IDbService db, IConfiguration config)
        {
            _logger = logger;
            _db = db;
            _config = config;
        }

        [HttpGet("challenge/{address}")]
        public async Task<Verifier> GetChallenge(string address)
        {
            var randomWord = new Random().Next();
            var challenge = address + randomWord + DateTime.Now.Second + "colourbox" + DateTime.Now.Millisecond;
            byte[] challengeBytes = Encoding.Default.GetBytes(challenge);

            string challengeHexString = BitConverter.ToString(challengeBytes);
            challengeHexString = challengeHexString.Replace("-", "");

            var verifierCollection = _db.getCollection<Verifier>();
            var verifier = new Verifier();
            verifier.Challenge = challengeHexString;
            verifier.walletAddress = address;
            await verifierCollection.InsertOneAsync(verifier);

            return await GetVerifier(verifier.id);
        }

        [HttpGet("prove/{challenge}")]
        public async Task<IActionResult> GetAuth(string challenge)
        {
            // check the proof with the challenge and generate a jwt
            // delete the challenge generated above
            var verifierCollection = _db.getCollection<Verifier>();
            var verifier = await verifierCollection.Find(v => v.Challenge == challenge).FirstAsync();

            if (verifier != null)
            {
                var userCollection = _db.getCollection<User>();
                var user = new User();
                user = await userCollection.Find(u => u.walletAddress == verifier.walletAddress).FirstOrDefaultAsync();
                if (user == null)
                {
                    var _user = new User();
                    _user.walletAddress = verifier.walletAddress;
                    await userCollection.InsertOneAsync(_user);
                    user = await userCollection.Find(u => u.walletAddress == verifier.walletAddress).FirstOrDefaultAsync();
                }

                var token = GenerateToken(user);

                await Delete(challenge);
                return Ok(token);
            }
            else
            {
                throw new Exception("Challenge is not valid");
            }
        }

        [HttpDelete("{challenge}")]
        public async Task Delete(string challenge)
        {
            var verifierCollection = _db.getCollection<Verifier>();
            await verifierCollection.FindOneAndDeleteAsync(v => v.Challenge == challenge);
        }


        // Get verifier
        private async Task<Verifier> GetVerifier(string id)
        {
            var verifierCollection = _db.getCollection<Verifier>();
            var verifier = await verifierCollection.Find(v => v.id == id).FirstAsync();
            return verifier;
        }


        // To generate token
        private string GenerateToken(User user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier,user.id),
            };
            var token = new JwtSecurityToken(_config["Jwt:Issuer"],
                _config["Jwt:Audience"],
                claims,
                expires: DateTime.Now.AddMinutes(2),
                signingCredentials: credentials);


            return new JwtSecurityTokenHandler().WriteToken(token);

        }

    }
}
