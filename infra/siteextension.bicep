param webAppName string

resource siteExtension 'Microsoft.Web/sites/siteextensions@2024-04-01' = {
  name: '${webAppName}/Microsoft.ApplicationInsights.AzureWebSites'
}
