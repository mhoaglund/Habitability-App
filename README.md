TODO expos

This is a Node+Express Single Page App which supports a simple upload-and-view posting system. It uses Azure table storage as a post database (since no relational depth is really necessary and it's cost effective) and Azure blob storage as an asset repository for flexibility and extensibility. This application also makes calls to an external VM running a browserless.io docker instance which functions as a renderer for new static assets, which use content posted by users.

The browserless.io docker container is at env.process.BROWSERLESS_HOST, secured with env.process.BROWSERLESS_TOKEN.

Docker run command for the browserless container:
docker run -p 3000:3000 -e "TOKEN={token}" -e "WORKSPACE_DELETE_EXPIRED=true" -e "WORKSPACE_EXPIRE_DAYS=3" --name renderer browserless/chrome

The workplace expiration stuff is important because it generates images on disk before adding them to the azure blob. They don't need to stick around on disk. The token stuff is important because of azure's pay-to-play NSG stuff: unless you want to pay out for a hefty App Service Plan, you can't use network security groups to ensure security and connectivity. As a result, the browserless vm's port is open to the world. Something to revise in the future.

Future Enhancements:

The express server app is happy to be cross-platform, but there is a little bit of vendor lock-in here with the azure storage integration. A good TODO in the future would be to develop an alternate serviceHandler for vanilla SQL, redis, or noSQL platforms from other providers like amazon and google. Another good TODO will be to break the structuredImport logic out of azureServiceHandler.