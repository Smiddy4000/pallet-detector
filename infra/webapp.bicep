// Bicep module for Web App (webapp) with zero trust
param environmentName string
param location string
param identityId string
param appInsightsId string
param keyVaultUri string
param functionApiBaseUrl string
param authClientId string
@secure()
param functionApiKey string

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
    keyVaultReferenceIdentity: identityId
    siteConfig: {
      appSettings: [
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsightsId
        }
        {
          name: 'FUNCTION_API_BASE_URL'
          value: functionApiBaseUrl
        }
        {
          name: 'FUNCTION_API_KEY'
          value: functionApiKey
        }
        {
          name: 'AZURE_MAPS_KEY'
          value: '@Microsoft.KeyVault(SecretUri=${keyVaultUri}secrets/AzureMapsKey)'
        }
      ]
      vnetRouteAllEnabled: true
      scmType: 'None'
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      publicNetworkAccess: 'Enabled'
    }
    httpsOnly: true
  }
}

resource authSettings 'Microsoft.Web/sites/config@2024-04-01' = {
  parent: webApp
  name: 'authsettingsV2'
  properties: {
    platform: {
      enabled: true
      runtimeVersion: '~1'
    }
    globalValidation: {
      requireAuthentication: true
      unauthenticatedClientAction: 'RedirectToLoginPage'
      redirectToProvider: 'azureActiveDirectory'
    }
    identityProviders: {
      azureActiveDirectory: {
        enabled: true
        registration: {
          clientId: authClientId
          openIdIssuer: '${environment().authentication.loginEndpoint}${tenant().tenantId}/v2.0'
        }
        validation: {
          allowedAudiences: [
            'api://${authClientId}'
          ]
        }
      }
    }
    httpSettings: {
      requireHttps: true
    }
  }
}

output webAppName string = webApp.name
output webAppId string = webApp.id
