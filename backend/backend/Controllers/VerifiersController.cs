using backend.models;
using Concordium;
using ConcordiumNetSdk;
using ConcordiumNetSdk.Responses.AccountInfoResponse;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
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

        public VerifiersController(ILogger<VerifiersController> logger, IDbService db)
        {
            _logger = logger;
            _db = db;
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
            await verifierCollection.InsertOneAsync(verifier);

            return await GetVerifier(verifier.id);
        }

        private async Task<Verifier> GetVerifier(string id)
        {
            var verifierCollection = _db.getCollection<Verifier>();
            var verifier = await verifierCollection.Find(v => v.id == id).FirstAsync();
            return verifier;
        }

        [HttpGet("statement/{address}/{txHash}")]
        public async Task<IActionResult> GetStatement(string address, string txHash)
        {
            //Connection connection = new Connection
            //{
            //    Address = "http://localhost:5146",
            //    AuthenticationToken = "rpcadmin"
            //};

            //ConcordiumNodeClient concordiumNodeClient = new ConcordiumNodeClient(connection);

            //AccountAddress accountAddress = AccountAddress.From("32gxbDZj3aCr5RYnKJFkigPazHinKcnAhkxpade17htB4fj6DN");
            //BlockHash blockHash = BlockHash.From("44c52f0dc89c5244b494223c96f037b5e312572b4dc6658abe23832e3e5494af");

            //AccountInfo? accountInfo = await concordiumNodeClient.GetAccountInfoAsync(accountAddress, blockHash);

            return Ok();
        }

        //[HttpGet("prove/{challenge}")]
        //public async Task<IActionResult> GetAuth(string challenge)
        //{
        //    // check the proof with the challenge and generate a jwt
        //    // delete the challenge generated above
        //    var verifierCollection = _db.getCollection<Verifier>();
        //    var verifier = await verifierCollection.Find(v => v.Challenge == challenge).FirstAsync();

        //    if (verifier != null)
        //    {

        //    }
        //    else
        //    {
        //        throw new Exception("Challenge is not valid");
        //    }
        //}

        [HttpDelete("{challenge}")]
        public async void Delete(string challenge)
        {
            var verifierCollection = _db.getCollection<Verifier>();
            await verifierCollection.FindOneAndDeleteAsync(v => v.Challenge == challenge);
        }

    }
}
