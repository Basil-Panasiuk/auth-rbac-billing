## To run locally

Create .env file and copy everything from .env.example file.
Make sure to change value for WEBHOOK_URL varaible to get transactions data in your acc

## Running the app

```bash
$ docker-compose up -d

```

then please wait until nestjs server initialized.
You can check logs of api container

```bash
$ docker-compose logs -f api

```

Server available on localhost:3000.
Swagger available by adding /swagger at localhost:3000/swagger
