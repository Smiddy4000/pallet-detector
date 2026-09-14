// Bicep module for Function App (api) with zero trust
param environmentName string
param location string
param identityId string
param appInsightsId string
param keyVaultUri string
param subnetId string
@secure()
param functionApiKey string

var functionAppName = 'palletdetector${environmentName}api'
var storageAccountName = 'palletdetector${environmentName}funcsa'
var planName = 'palletdetector${environmentName}plan'

resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'None'
      virtualNetworkRules: [
        {
          id: subnetId
        }
      ]
    }
    publicNetworkAccess: 'Disabled'
  }
}

resource plan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: planName
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  kind: 'functionapp'
}

resource functionApp 'Microsoft.Web/sites@2024-04-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identityId}': {}
    }
  }
  tags: {
    'azd-service-name': 'api'
    'azd-env-name': environmentName
  }
  properties: {
    serverFarmId: plan.id
    keyVaultReferenceIdentity: identityId
    siteConfig: {
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: storage.properties.primaryEndpoints.blob
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'dotnet-isolated'
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsightsId
        }
        {
          name: 'CosmosDbConnectionString'
          value: '@Microsoft.KeyVault(SecretUri=${keyVaultUri}secrets/CosmosDbConnectionString)'
        }
        {
          name: 'FUNCTION_API_KEY'
          value: functionApiKey
        }
        {
          name: 'EXTRACT_FUNCTION_URI'
          value: 'https://${functionAppName}.azurewebsites.net/api/ExtractBarcode'
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

resource functionApiHostKey 'Microsoft.Web/sites/host/functionKeys@2024-04-01' = {
  name: '${functionApp.name}/default/pallet-detector'
  properties: {
    name: 'pallet-detector'
    value: functionApiKey
  }
}

output functionAppName string = functionApp.name
output functionAppId string = functionApp.id
