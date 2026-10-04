# Postman setup

Import `Sri-Ranganayaka-Transport-Admin.postman_collection.json`.

Set collection variables:

- `baseUrl` = your Render service URL
- `adminApiKey` = the Render `ADMIN_API_KEY`
- `organizationId` = ID returned by Create organization
- `userId` = ID returned by Create user

The collection intentionally uses the admin key only in request headers. Do not commit a real key into the JSON file.
