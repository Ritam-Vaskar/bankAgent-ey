import { BlobServiceClient } from '@azure/storage-blob'
import { randomUUID } from 'crypto'

class AzureStorageService {
  constructor() {
    this.blobServiceClient = null
    this.initialized = false
  }

  // Initialize Azure Blob Service Client
  initialize() {
    if (this.initialized && this.blobServiceClient) {
      return this.blobServiceClient
    }

    try {
      if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
        // Validate connection string format
        const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING.trim()
        if (!connStr.includes('DefaultEndpointsProtocol=') || !connStr.includes('AccountName=')) {
          throw new Error('Invalid Azure connection string format. Must include DefaultEndpointsProtocol and AccountName')
        }
        
        this.blobServiceClient = BlobServiceClient.fromConnectionString(connStr)
        console.log('Azure Blob Service initialized with connection string')
      } else if (process.env.AZURE_STORAGE_ACCOUNT_NAME && process.env.AZURE_STORAGE_ACCOUNT_KEY) {
        const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME.trim()
        const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY.trim()
        
        if (!accountName || !accountKey) {
          throw new Error('Azure storage account name and key cannot be empty')
        }
        
        const connectionString = `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`
        this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
        console.log('Azure Blob Service initialized with account credentials')
      } else {
        throw new Error('Azure storage credentials not configured. Please set AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_NAME + AZURE_STORAGE_ACCOUNT_KEY')
      }
      
      this.initialized = true
      return this.blobServiceClient
    } catch (error) {
      console.error('Failed to initialize Azure Blob Service:', error)
      console.log('Environment variables check:', {
        hasConnectionString: !!process.env.AZURE_STORAGE_CONNECTION_STRING,
        hasAccountName: !!process.env.AZURE_STORAGE_ACCOUNT_NAME,
        hasAccountKey: !!process.env.AZURE_STORAGE_ACCOUNT_KEY,
        connectionStringLength: process.env.AZURE_STORAGE_CONNECTION_STRING?.length || 0
      })
      throw error
    }
  }

  // Upload file to Azure Blob Storage
  async uploadFile(fileBuffer, fileName, mimeType, containerName = 'uploads') {
    try {
      const blobServiceClient = this.initialize()
      
      // Get container client
      const containerClient = blobServiceClient.getContainerClient(containerName)
      
      // Create container if it doesn't exist
      await containerClient.createIfNotExists({
        access: 'blob' // Allow public read access to blobs
      })

      // Get blob client
      const blobClient = containerClient.getBlockBlobClient(fileName)
      
      // Upload the file
      const uploadResponse = await blobClient.uploadData(fileBuffer, {
        blobHTTPHeaders: {
          blobContentType: mimeType
        }
      })

      console.log(`File uploaded successfully to Azure: ${fileName}`, uploadResponse.requestId)

      return {
        success: true,
        url: blobClient.url,
        fileName: fileName,
        requestId: uploadResponse.requestId
      }

    } catch (error) {
      console.error('Error uploading to Azure:', error)
      throw new Error(`Failed to upload file to Azure storage: ${error.message}`)
    }
  }

  // Generate unique filename
  generateUniqueFileName(userId, prefix, originalFileName) {
    const fileExtension = originalFileName.split('.').pop()
    const timestamp = Date.now()
    const uuid = randomUUID().substring(0, 8)
    return `${prefix}-${userId}-${timestamp}-${uuid}.${fileExtension}`
  }

  // Test Azure connection
  async testConnection(containerName = 'test') {
    try {
      const blobServiceClient = this.initialize()
      const containerClient = blobServiceClient.getContainerClient(containerName)
      
      // Try to get container properties as a connection test
      try {
        await containerClient.getProperties()
      } catch (error) {
        // If container doesn't exist, try to create it
        if (error.statusCode === 404) {
          await containerClient.createIfNotExists()
        } else {
          throw error
        }
      }

      return {
        success: true,
        message: 'Azure connection successful',
        containerName: containerName
      }

    } catch (error) {
      console.error('Azure connection test failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Upload file with automatic container and filename generation
  async uploadDocument(fileBuffer, originalFileName, mimeType, userId, documentType) {
    const containerName = `${documentType}-uploads`
    const uniqueFileName = this.generateUniqueFileName(userId, documentType, originalFileName)
    
    return await this.uploadFile(fileBuffer, uniqueFileName, mimeType, containerName)
  }
}

// Create singleton instance
const azureStorage = new AzureStorageService()

export default azureStorage
