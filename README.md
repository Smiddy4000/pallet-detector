# Pallet Detector

This project is a web application built with Next.js that utilizes the device camera and integrates with Azure Open AI Services.

## Features

- Access device camera using the MediaDevices API.
- Interact with Azure Open AI Services through a custom API route.
- Responsive and modern UI.

## Getting Started

To get started with this project, follow the instructions below.

### Prerequisites

- Node.js 20.9 or later
- npm 10 or later

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/Smiddy4000/pallet-detector.git
   ```

2. Navigate to the project directory:

   ```
   cd pallet-detector
   ```

3. Install the dependencies:

   ```
   npm install
   ```

4. Copy `.env.example` to `.env.local` and provide the backend Function App URL,
   a function key, and an Azure Maps key. These values are server-only and must
   never use a `NEXT_PUBLIC_` prefix.

### Running the Application

To run the application in development mode, use the following command:

```
npm run dev
```

Open your browser and navigate to `http://localhost:3000` to view the application.

## Production security

The infrastructure enables Microsoft Entra authentication for the web app and
loads service credentials from Azure Key Vault. Before deployment:

1. Set `AUTH_CLIENT_ID` to the App Service authentication application client ID.
2. Create `FunctionApiKey` and `AzureMapsKey` secrets in the deployed Key Vault.
3. Rotate the function and Azure Maps keys that were previously committed. Removing
   them from source does not revoke the exposed credentials.
4. Restrict the Azure Maps credential to the required APIs and deployment network.

### Usage

- The main landing page displays the camera feed and allows interaction with Azure Open AI Services.
- Follow the prompts on the UI to utilize the camera and AI features.

### Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

### License

This project is licensed under the MIT License. See the LICENSE file for more details.