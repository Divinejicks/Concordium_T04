using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson.Serialization.IdGenerators;

namespace backend.models
{
    [BsonIgnoreExtraElements]
    [MongoCollection("users")]
    public class User
    {
        [BsonId(IdGenerator = typeof(StringObjectIdGenerator))]
        [BsonRepresentation(BsonType.ObjectId)]
        public string id { get; set; } = "";
        public string walletAddress { get; set; } = "";
    }

}
