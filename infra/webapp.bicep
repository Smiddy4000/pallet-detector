// Bicep module for Web App (webapp) with zero trust
param environmentName string
param location string
param identityId string
param appInsightsId string

var webAppName = 'palletdetector${environmentName}webapp'
var planName = 'palletdetector${environmentName}webplan'

resource plan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: planName
  location: location
  sku: {
    name: 'P1v3'
    tier: 'PremiumV3'
  }
  kind: 'app'
}

resource webApp 'Microsoft.Web/sites@2024-04-01' = {
  name: webAppName
  location: location
  kind: 'app'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identityId}': {}
    }
  }
  tags: {
    'azd-service-name': 'webapp'
    'azd-env-name': environmentName
  }
  properties: {
    serverFarmId: plan.id
    siteConfig: {
      appSettings: [
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsightsId
        }
        {
          name: 'ApiBaseUrl'
          value: 'https://<api-url>'
        }
      ]
      vnetRouteAllEnabled: true
      scmType: 'None'
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      publicNetworkAccess: 'Disabled'
    }
    httpsOnly: true
  }
}

output webAppName string = webApp.name
output webAppId string = webApp.id
