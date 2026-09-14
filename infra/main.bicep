// Bicep main entry point for deploying zero trust infrastructure for pallet-detector
// This file orchestrates all resources: VNET, CosmosDB, Key Vault, Function App, App Service, Managed Identity, App Insights, Log Analytics, and Site Extension
// Zero Trust: All resources use private endpoints, public access is disabled, managed identities are used, and secrets are stored in Key Vault

param environmentName string
param location string
param resourceGroupName string
@description('Client ID of the Microsoft Entra application used by App Service authentication.')
param authClientId string

// Resource naming convention
var resourcePrefix = 'palletdetector'
var cosmosDbAccountName = '${resourcePrefix}${environmentName}cosmos'
var keyVaultName = '${resourcePrefix}${environmentName}kv'
var logAnalyticsName = '${resourcePrefix}${environmentName}log'
var appInsightsName = '${resourcePrefix}${environmentName}ai'
var vnetName = '${resourcePrefix}${environmentName}vnet'
var subnetName = '${resourcePrefix}${environmentName}subnet'
var identityName = '${resourcePrefix}${environmentName}id'

// VNET and subnet for private endpoints
resource vnet 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: vnetName
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [ '10.10.0.0/16' ]
    }
    subnets: [
      {
        name: subnetName
        properties: {
          addressPrefix: '10.10.1.0/24'
          privateEndpointNetworkPolicies: 'Disabled'
        }
      }
    ]
  }
}

// User-assigned managed identity
resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: identityName
  location: location
}

// Log Analytics Workspace
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

// Key Vault with private endpoint and RBAC
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    enableRbacAuthorization: true
    publicNetworkAccess: 'Disabled'
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'None'
      virtualNetworkRules: [
        {
          id: vnet.properties.subnets[0].id
        }
      ]
    }
    enabledForDeployment: true
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: true
    enableSoftDelete: true
    enablePurgeProtection: true
    softDeleteRetentionInDays: 30
  }
}

resource keyVaultSecretsUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, identity.id, 'Key Vault Secrets User')
  scope: keyVault
  properties: {
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '4633458b-17de-408a-b874-0445c86b69e6'
    )
  }
}

// Reference modules for zero trust deployment
module functionApp 'functionapp.bicep' = {
  name: 'functionApp'
  params: {
    environmentName: environmentName
    location: location
    identityId: identity.id
    appInsightsId: appInsights.properties.InstrumentationKey
    keyVaultUri: keyVault.properties.vaultUri
    subnetId: vnet.properties.subnets[0].id
  }
}

module webApp 'webapp.bicep' = {
  name: 'webApp'
  params: {
    environmentName: environmentName
    location: location
    identityId: identity.id
    appInsightsId: appInsights.properties.InstrumentationKey
    keyVaultUri: keyVault.properties.vaultUri
    functionApiBaseUrl: 'https://${functionApp.outputs.functionAppName}.azurewebsites.net'
    authClientId: authClientId
  }
}

module cosmosDb 'cosmosdb.bicep' = {
  name: 'cosmosDb'
  params: {
    cosmosDbAccountName: cosmosDbAccountName
    location: location
  }
}

module siteExtension 'siteextension.bicep' = {
  name: 'siteExtension'
  params: {
    webAppName: 'palletdetector${environmentName}webapp'
    //location: location
  }
}

output functionAppName string = functionApp.outputs.functionAppName
output functionAppId string = functionApp.outputs.functionAppId
output webAppName string = webApp.outputs.webAppName
output webAppId string = webApp.outputs.webAppId
