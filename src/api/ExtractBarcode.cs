using Azure;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using Azure;
using Azure.AI.FormRecognizer.DocumentAnalysis;
using System.Text;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;

namespace api
{
    public class ExtractBarcode
    {
        private readonly ILogger<ExtractBarcode> _logger;
        private readonly string _apiKey;
        private readonly string _endpoint;
        public ExtractBarcode(ILogger<ExtractBarcode> logger, IConfiguration config)
        {
            _logger = logger;
            _apiKey = config["AOAI_DOC_APIKEY"] ?? string.Empty;
            _endpoint = config["AOAI_DOC_ENDPOINT"] ?? string.Empty;
        }

        [Function("ExtractBarcode")]
        public async Task<IActionResult> Run([HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequest req)
        {
            _logger.LogInformation("Entering Extract Barcode function.");

            if (string.IsNullOrEmpty(_apiKey) || string.IsNullOrEmpty(_endpoint))
            {
                return new BadRequestObjectResult("Please provide an API key and endpoint for the Form Recognizer service.");
            }
            try
            {
                AzureKeyCredential credential = new AzureKeyCredential(_apiKey);
                DocumentAnalysisClient client = new DocumentAnalysisClient(new Uri(_endpoint), credential);

                string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
                dynamic? data = JsonConvert.DeserializeObject(requestBody);
                string imageUri = data?.uri ?? string.Empty;

                //sample document
                Uri fileUri = new Uri(imageUri);
                AnalyzeDocumentOptions options = new()
                {
                    Features = { DocumentAnalysisFeature.Barcodes }
                };
                AnalyzeDocumentOperation operation = await client.AnalyzeDocumentFromUriAsync(WaitUntil.Completed, "prebuilt-read", fileUri, options);
                AnalyzeResult result = operation.Value;
                StringBuilder sb = new StringBuilder();

                foreach (DocumentPage page in result.Pages)
                {
                    sb.AppendLine($"Document Page {page.PageNumber} has {page.Lines.Count} line(s), {page.Words.Count} word(s),");
                    foreach (DocumentBarcode barcode in page.Barcodes)
                    {
                        sb.AppendLine($"  Barcode found with value: {barcode.Value}.");

                        sb.AppendLine($"    Its bounding box is:");
                        sb.AppendLine($"      Upper left => X: {barcode.BoundingPolygon[0].X}, Y= {barcode.BoundingPolygon[0].Y}");
                        sb.AppendLine($"      Upper right => X: {barcode.BoundingPolygon[1].X}, Y= {barcode.BoundingPolygon[1].Y}");
                        sb.AppendLine($"      Lower right => X: {barcode.BoundingPolygon[2].X}, Y= {barcode.BoundingPolygon[2].Y}");
                        sb.AppendLine($"      Lower left => X: {barcode.BoundingPolygon[3].X}, Y= {barcode.BoundingPolygon[3].Y}");
                    }
                }
                return new OkObjectResult(sb.ToString());
            }
            catch (Exception ex)
            {
                return new BadRequestObjectResult(ex.Message);
            }
        }
    }
}
