# PandaPoss Alexa Integration

Alexa es una capa externa de voz. La logica principal sigue en PandaPoss AI.

## Backend PandaPoss

Endpoint interno:

```http
POST /api/alexa/dispatch
```

Headers:

```http
x-pandaposs-alexa-secret: <ALEXA_SHARED_SECRET>
```

Variables requeridas en PandaPoss:

```env
ALEXA_SHARED_SECRET=un-secreto-largo
ALEXA_DEFAULT_SUCURSAL_ID=1
ALEXA_SERVICE_USER_ID=1
```

## Lambda

Carpeta:

```text
alexa/lambda
```

Variables de Lambda:

```env
PANDA_API_BASE_URL=https://tu-dominio-pandaposs.com
PANDA_ALEXA_SECRET=el-mismo-secreto
PANDA_DEFAULT_SUCURSAL_ID=1
```

Instalar dependencias:

```bash
cd alexa/lambda
npm install
```

Test local:

```bash
npm run test:local
```

## Deploy AWS SAM

```bash
cd alexa
sam build
sam deploy --guided
```

Despues copia el ARN de Lambda en Alexa Developer Console como endpoint de la Custom Skill.

## Alexa Skill

Interaction model:

```text
alexa/skill-package/interactionModels/custom/es-US.json
```

Intents:

- `SalesTodayIntent`
- `KitchenStatusIntent`
- `StockQueryIntent`
- `AddOrderIntent`
- `CancelProductIntent`
- `RepeatUsualIntent`

Ejemplos:

```text
Alexa, pregunta a panda pos cuanto vendimos hoy
Alexa, pregunta a panda pos como va cocina
Alexa, pregunta a panda pos agrega 2 bebidas mesa 3
Alexa, pregunta a panda pos cancela coca cola mesa 2
```

## Seguridad

La primera version usa secreto server-to-server entre Lambda y PandaPoss. Para produccion publica, habilitar Account Linking OAuth en Alexa Skills Kit y mapear `accessToken` a usuario/sucursal PandaPoss.

Docs oficiales:

- Custom interaction model: https://developer.amazon.com/en-US/docs/alexa/custom-skills/create-the-interaction-model-for-your-skill.html
- Account linking: https://developer.amazon.com/en-US/docs/alexa/account-linking/account-linking-for-custom-skills.html
