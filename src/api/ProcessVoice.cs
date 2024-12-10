using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using static System.Net.Mime.MediaTypeNames;

namespace api
{
    public class ProcessVoice
    {
        private readonly ILogger<ProcessVoice> _logger;
        private readonly string _apiKey;
        private readonly string _region;
        private string _audioData = string.Empty;

        public ProcessVoice(ILogger<ProcessVoice> logger, IConfiguration config)
        {
            _logger = logger;
            _apiKey = config["AOAI_SPEECH_KEY"] ?? string.Empty;
            _region = config["AOAI_SPEECH_REGION"] ?? string.Empty;
        }

        [Function("ProcessVoice")]
        public async Task<IActionResult> Run([HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequest req)
        {
            _logger.LogInformation("C# HTTP trigger function processed a request.");
            try
            {
                var speechConfig = SpeechConfig.FromSubscription(_apiKey, _region);
                speechConfig.SpeechSynthesisVoiceName = "en-AU-AnnetteNeural";
                var synthesizer = new SpeechSynthesizer(speechConfig);
                var result = await synthesizer.SpeakTextAsync("text");
                _audioData = Convert.ToBase64String(result.AudioData);
            }
            catch (Exception ex)
            {
                return new BadRequestObjectResult(ex.Message);
            }
            if (!string.IsNullOrEmpty(_audioData))
            {
                return new OkObjectResult(_audioData);
            }
            else
            {
                return new BadRequestObjectResult("No audio data found.");
            }
        }
    }
}
