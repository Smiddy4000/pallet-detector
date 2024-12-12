using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Azure.Cosmos;
using System.ComponentModel.DataAnnotations;
using Azure.Core;
using Azure.Identity;


namespace api
{
    public class GetLocation
    {
        private readonly ILogger<GetLocation> _logger;
        private readonly CosmosClient _cosmosClient;
        private readonly string _databaseId;
        private readonly string _containerId;

        public GetLocation(ILogger<GetLocation> logger, IConfiguration config)
        {
            _logger = logger;
            TokenCredential credential = new DefaultAzureCredential();
            _cosmosClient = new CosmosClient(config["CosmosDBConnectionString"], credential);
            _databaseId = config["CosmosDBDatabaseId"] ?? string.Empty;
            _containerId = config["CosmosDBContainerId"] ?? string.Empty;
        }

        [Function("GetLocation")]
        public async Task<IActionResult> Run([HttpTrigger(AuthorizationLevel.Function, "get")] HttpRequest req)
        {
            _logger.LogInformation("C# HTTP trigger function processed a request.");

            string? id = req.Query["id"];

            if (string.IsNullOrEmpty(id))
            {
                return new BadRequestObjectResult("Please provide an id in the query string.");
            }

            try
            {
                Container container = _cosmosClient.GetContainer(_databaseId, _containerId);
                ItemResponse<Location> response = await container.ReadItemAsync<Location>(id, new PartitionKey(id));
                Location location = response.Resource;

                return new OkObjectResult(location);
            }
            catch (CosmosException ex)
            {
                _logger.LogError(ex, "Error retrieving item from CosmosDB.");
                return new NotFoundObjectResult("Item not found.");
            }
        }
    }

    public class Location
    {
        public required string Id { get; set; }
        public required string Name { get; set; }
        public string? Address { get; set; }
        // Add other properties as needed
    }
}