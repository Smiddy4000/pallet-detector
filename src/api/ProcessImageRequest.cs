using Azure;
using Azure.AI.OpenAI;
using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using OpenAI.Chat;
using System.Net.Http;
using System.Text;

namespace RISM.DemoFunctions
{
    /// <summary>
    /// This class handles the processing of image requests.
    /// </summary>
    public class ProcessImageRequest
    {
        #region members
        private readonly ILogger<ProcessImageRequest> _logger;
        private readonly string _apiKey;
        private readonly string _endpoint;
        private readonly string _model;
        private readonly string _storageConnectionString;
        private readonly string _visionEndpoint;
        private readonly string _visionApiKey;
        private const string QUESTION = "what can you tell me about this image?";
        private readonly string _extractBarcodeFunctionUrl;
        private readonly HttpClient _httpClient;
        #endregion

        #region methods
        /// <summary>
        /// Initializes a new instance of the <see cref="ProcessImageRequest"/> class.
        /// </summary>
        /// <param name="logger">The logger instance.</param>
        /// <param name="config">The configuration instance.</param>
        public ProcessImageRequest(ILogger<ProcessImageRequest> logger, IConfiguration config)
        {
            _logger = logger;
            _apiKey = config["AOAI_KEY"] ?? string.Empty;
            _endpoint = config["AOAI_ENDPOINT"] ?? string.Empty;
            _model = config["AOAI_MODEL"] ?? string.Empty;
            _storageConnectionString = config["STORAGE_ACCOUNT"] ?? string.Empty;
            _visionEndpoint = config["VISION_ENDPOINT"] ?? string.Empty;
            _visionApiKey = config["VISION_APIKEY"] ?? string.Empty;
            _extractBarcodeFunctionUrl = config["EXTRACT_FUNCTION_URI"] ?? string.Empty;
            _httpClient = new HttpClient();
        }
        /// <summary>
        /// Processes the image request.
        /// </summary>
        /// <param name="req">The HTTP request.</param>
        /// <returns>An <see cref="IActionResult"/> representing the result of the operation.</returns>
        [Function("ProcessImageRequest")]
        public async Task<IActionResult> RunAsync([HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequest req)
        {
            _logger.LogInformation("C# HTTP trigger function processed a request.");

            using (var memoryStream = new MemoryStream())
            {
                string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
                dynamic? data = JsonConvert.DeserializeObject(requestBody);
                string base64Image = data?.photo ?? "";

                if (string.IsNullOrEmpty(base64Image))
                {
                    return new BadRequestObjectResult("Invalid image data.");
                }
                StringBuilder resultText = new StringBuilder();

                try
                {
                    var blobUriResult = CreateBlob(base64Image);
                    if (blobUriResult == null)
                    {
                        return new BadRequestObjectResult("Error creating blob uri.");
                    }

                    AzureOpenAIClient client = new AzureOpenAIClient(new Uri(_endpoint), new AzureKeyCredential(_apiKey));
                    ChatClient chatClient = client.GetChatClient(_model);

                    ChatMessage[] chatMessages = [
                        new UserChatMessage(ChatMessageContentPart.CreateTextPart(QUESTION)),
                            new UserChatMessage(ChatMessageContentPart.CreateImagePart(blobUriResult))
                    ];

                    var response = chatClient.CompleteChatAsync(chatMessages);
                    resultText.AppendLine($"Result: '{response.Result.Value.Content[0].Text}");
                    // call the extractbarcode function with the bloburiresult in the body
                    resultText.AppendLine(await CallExtractBarcodeFunction(blobUriResult));
                }
                catch (RequestFailedException ex)
                {
                    return new BadRequestObjectResult(ex.Message);
                }
                catch (Exception ex)
                {
                    return new BadRequestObjectResult(ex.Message);
                }
                finally
                {
                    memoryStream.Dispose();
                }
                return new OkObjectResult(JsonConvert.SerializeObject(resultText.ToString()));
            }
        }
        /// <summary>
        /// Creates a blob in Azure Blob Storage from a base64 encoded image string.
        /// </summary>
        /// <param name="base64Image">The base64 encoded image string.</param>
        /// <returns>The URI of the created blob.</returns>
        /// <exception cref="Exception">Thrown when there is an error creating the blob.</exception>
        private Uri CreateBlob(string base64Image)
        {
            try
            {
                byte[] imageBytes = Convert.FromBase64String(base64Image.Split(",".ToCharArray())[1]);
                var storageAccount = new BlobServiceClient(new Uri(_storageConnectionString));
                var containerClient = storageAccount.GetBlobContainerClient("images");
                var fileName = Guid.NewGuid().ToString() + ".jpeg";
                var blobClient = containerClient.GetBlobClient(fileName);

                using (var uploadStream = new MemoryStream(imageBytes))
                {
                    var blobResult = blobClient.Upload(uploadStream, true);
                }

                return blobClient.Uri;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating blob.");
                throw;
            }
        }

        private async Task<string> CallExtractBarcodeFunction(Uri blobUri)
        {
            var requestBody = JsonConvert.SerializeObject(new { uri = blobUri.ToString() });
            var content = new StringContent(requestBody, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(_extractBarcodeFunctionUrl, content);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsStringAsync();
        }


        #endregion
    }
}
