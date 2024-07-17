## To run locally

Create .env file and copy everything from .env.example file.
Make sure to change value for WEBHOOK_URL varaible to get transactions data in your acc.

- Without correct WEBHOOK_URL operations with transactions will be unavailable and server throw InternalServerErrorException('Failed to send to Webhook') error

## Running the app
Before running command below pls check that entrypoint.sh file has line endings = LF. Otherwise change CRLF -> LF

```bash
$ docker-compose up -d

```

Then please wait until application startup and the database is pre-seeded with the default admin user.
You can check logs of api container to see app's initialization

```bash
$ docker-compose logs -f api

```

Server available on localhost:3000.
Swagger API docs available by adding /swagger to baseurl => localhost:3000/swagger

### Pre-seeded default admin:

- email: admin@example.com
- password: sudoadmin

### Transactions

- Deposit request create transaction with status SUCCESS
- Transfer request create transaction with status PENDING
- To cancel transfer transaction you should be the sender of a transfer or Admin
- Approve transfer can only Admin
