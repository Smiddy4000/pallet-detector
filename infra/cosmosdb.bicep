param cosmosDbAccountName string
param location string

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-11-15' = {
  name: cosmosDbAccountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    publicNetworkAccess: 'Disabled' // Zero trust: disables public access
    enableFreeTier: true
    enableAutomaticFailover: false
    capabilities: [
      {
        name: 'EnableServerless'
      }
    ]
    // Add more properties as needed
  }
}

resource db 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-11-15' = {
  name: '${cosmosAccount.name}/palletdb'
  properties: {
    resource: {
      id: 'palletdb'
    }
    options: {}
  }
}

resource container 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-11-15' = {
  name: '${cosmosAccount.name}/palletdb/pallets'
  properties: {
    resource: {
      id: 'pallets'
      partitionKey: {
        paths: ['/id']
        kind: 'Hash'
      }
    }
    options: {}
  }
}

output cosmosDbAccountName string = cosmosAccount.name
output databaseName string = db.name
output containerName string = container.name
