## To run locally

Create .env file and copy everything from .env.example file.
Make sure to change value for WEBHOOK_URL varaible to get transactions data in your acc

## Running the app

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
email: admin@example.com
password: sudoadmin
