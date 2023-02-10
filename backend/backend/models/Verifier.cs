using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson.Serialization.IdGenerators;

namespace backend.models
{
    [BsonIgnoreExtraElements]
    [MongoCollection("verifiers")]
    public class Verifier
    {
        [BsonId(IdGenerator = typeof(StringObjectIdGenerator))]
        [BsonRepresentation(BsonType.ObjectId)]
        public string id { get; set; } = "";
        public string Challenge { get; set; } = "";
    }
}
