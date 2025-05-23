# Users

Provides user email storage and emailing functionality, ensuring that all emails are encrypted both at rest and in transit. Communicates with the [apps/backend](apps/backend/README.md) service through REST.

## Features
- Stores encrypted email addresses using the [`Encryption`](apps/users/src/Encryption.ts) class.
- Hashes email addresses with [`Hasher`](apps/users/src/Hasher.ts) to avoid duplication.
- Uses internal GUIDs to identify users and send emails, allowing the backend to store random IDs instead of email addresses or hashes.
- Accepts email addresses and emails to send via REST endpoints in [`apps/users/src/index.ts`](apps/users/src/index.ts).
- Delivers emails through Mailgun APIs.

## Example Usage Flow

1. **External Application Registers a New User:**
    - **Action:** The external application collects a new user's email address.
    - **Request:** It sends a POST request to the `/user` endpoint with the email address.
    - **Endpoint:** [`POST /user`](apps/users/src/index.ts#L54)
    
    ```sh
    curl -X POST https://yourapi.com/user \
      -H "Content-Type: application/json" \
      -d '{"emailAddress": "newuser@example.com"}'
    ```
    
    - **Process:**
        1. The Users service hashes the provided email address.
        2. It checks the database to see if the hashed email already exists.
        3. If the email does not exist:
            - Encrypts the email address.
            - Generates an internal GUID for the user.
            - Stores the encrypted email and GUID in the database.
        4. Returns the internal GUID to the external application.
    
    - **Response:**
    
    ```json
    {
      "userId": "generated-guid-1234-5678"
    }
    ```

2. **External Application Stores the Internal GUID:**
    - **Action:** Upon receiving the GUID, the external application stores it securely.
    - **Usage:** The GUID is used for sending emails without exposing the actual email address.

3. **Sending Emails to the User:**
    - **Action:** When the external application needs to send an email, it uses the stored internal GUID.
    - **Request:** Sends a POST request to the `/user/:userId/message` endpoint with the email content.
    - **Endpoint:** `POST /user/:userId/message`
    
    ```sh
    curl -X POST https://yourapi.com/user/generated-guid-1234-5678/message \
      -H "Content-Type: application/json" \
      -d '{
            "title": "Welcome!",
            "body": "Thank you for registering."
          }'
    ```
    
    - **Process:**
        1. The Users service retrieves the encrypted email using the provided GUID.
        2. Decrypts the email address.
        3. Sends the email via Mailgun APIs.
    
    - **Response:**
    
    ```json
    {
      "msg": "Message sent"
    }
    ```

4. **Checking if a User is Already Registered:**
    - **Action:** To verify if a user is already registered, the external application can use the `/user/find` endpoint.
    - **Request:** Sends a POST request with the email address.
    - **Endpoint:** `POST /user/find`
    
    ```sh
    curl -X POST https://yourapi.com/user/find \
      -H "Content-Type: application/json" \
      -d '{"emailAddress": "existinguser@example.com"}'
    ```
    
    - **Process:**
        1. The Users service hashes the provided email address.
        2. Searches the database for the hashed email.
        3. If found, returns the corresponding internal GUID.
        4. If not found, returns a 404 status.
    
    - **Response (User Found):**
    
    ```json
    {
      "userId": "existing-guid-1234-5678"
    }
    ```
    
    - **Response (User Not Found):**
    
    ```json
    {
      "msg": "User not found"
    }
    ```

## Encryption
- Every email is encrypted locally at rest with AES-based algorithms.
- Data is secured in transit with HTTPS when delivered to Mailgun.

## Database Migrations
- Uses [TypeORM](https://typeorm.io/) to manage database schema evolution.
- Generate new migrations with:
  
  ```sh
  pnpm typeorm migration:generate -n <MigrationName>
  ```

## Running

``` 
pnpm install
pnpm start
```

Be sure to set:

- ENCRYPTION_SECRET (base64-encoded 32-byte key, generate with `openssl rand -base64 32`)
- HASH_SECRET (base64-encoded 32-byte key, generate with `openssl rand -base64 32`)
- MAILGUN_SECRET, MAILGUN_FROM, MAILGUN_BASE_URL for sending emails
- CONSUMER_NAME, CONSUMER_SECRET for Basic Auth

See the full [cryptographic secrets documentation](/docs/cryptographic-secrets.md) for more details.

Logs and tests can be found in all.test.ts.