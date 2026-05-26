const Alexa = require("ask-sdk-core");

const PANDA_API_BASE_URL = process.env.PANDA_API_BASE_URL;
const PANDA_ALEXA_SECRET = process.env.PANDA_ALEXA_SECRET;
const DEFAULT_SUCURSAL_ID = process.env.PANDA_DEFAULT_SUCURSAL_ID;

function slotValue(handlerInput, name) {
  const slot = handlerInput.requestEnvelope.request.intent?.slots?.[name];
  return slot?.value;
}

async function dispatchToPanda(intentName, handlerInput, extra = {}) {
  if (!PANDA_API_BASE_URL || !PANDA_ALEXA_SECRET) {
    throw new Error("Lambda sin PANDA_API_BASE_URL o PANDA_ALEXA_SECRET");
  }

  const accessToken = handlerInput.requestEnvelope.context?.System?.user?.accessToken;
  const response = await fetch(`${PANDA_API_BASE_URL}/api/alexa/dispatch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-pandaposs-alexa-secret": PANDA_ALEXA_SECRET,
    },
    body: JSON.stringify({
      intentName,
      sucursalId: Number(DEFAULT_SUCURSAL_ID || 0) || undefined,
      accessToken,
      ...extra,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.speech || data.error || "PandaPoss no respondio");
  return data;
}

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest";
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak("PandaPoss listo. Puedes preguntar cuanto vendimos hoy, como va cocina, o agregar productos a una mesa.")
      .reprompt("Que necesitas hacer en PandaPoss?")
      .getResponse();
  },
};

const SalesTodayIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getIntentName(handlerInput.requestEnvelope) === "SalesTodayIntent";
  },
  async handle(handlerInput) {
    const data = await dispatchToPanda("SalesTodayIntent", handlerInput);
    return handlerInput.responseBuilder.speak(data.speech).getResponse();
  },
};

const KitchenStatusIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getIntentName(handlerInput.requestEnvelope) === "KitchenStatusIntent";
  },
  async handle(handlerInput) {
    const data = await dispatchToPanda("KitchenStatusIntent", handlerInput);
    return handlerInput.responseBuilder.speak(data.speech).getResponse();
  },
};

const StockQueryIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getIntentName(handlerInput.requestEnvelope) === "StockQueryIntent";
  },
  async handle(handlerInput) {
    const data = await dispatchToPanda("StockQueryIntent", handlerInput, {
      slots: {
        productName: slotValue(handlerInput, "productName"),
      },
    });
    return handlerInput.responseBuilder.speak(data.speech).getResponse();
  },
};

const AddOrderIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getIntentName(handlerInput.requestEnvelope) === "AddOrderIntent";
  },
  async handle(handlerInput) {
    const data = await dispatchToPanda("AddOrderIntent", handlerInput, {
      slots: {
        quantity: slotValue(handlerInput, "quantity"),
        productName: slotValue(handlerInput, "productName"),
        tableNumber: slotValue(handlerInput, "tableNumber"),
      },
    });
    return handlerInput.responseBuilder.speak(data.speech).getResponse();
  },
};

const CancelProductIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getIntentName(handlerInput.requestEnvelope) === "CancelProductIntent";
  },
  async handle(handlerInput) {
    const data = await dispatchToPanda("CancelProductIntent", handlerInput, {
      slots: {
        productName: slotValue(handlerInput, "productName"),
        tableNumber: slotValue(handlerInput, "tableNumber"),
      },
    });
    return handlerInput.responseBuilder.speak(data.speech).getResponse();
  },
};

const RepeatUsualIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getIntentName(handlerInput.requestEnvelope) === "RepeatUsualIntent";
  },
  async handle(handlerInput) {
    const data = await dispatchToPanda("RepeatUsualIntent", handlerInput, {
      slots: {
        tableNumber: slotValue(handlerInput, "tableNumber"),
      },
    });
    return handlerInput.responseBuilder.speak(data.speech).getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent";
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak("Puedes decir: cuanto vendimos hoy, agrega dos bebidas mesa tres, o como va cocina.")
      .reprompt("Que quieres hacer?")
      .getResponse();
  },
};

const StopIntentHandler = {
  canHandle(handlerInput) {
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
    return intentName === "AMAZON.CancelIntent" || intentName === "AMAZON.StopIntent";
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.speak("Listo.").getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.error(error);
    return handlerInput.responseBuilder
      .speak("No pude completar la accion en PandaPoss. Revisa la conexion o permisos.")
      .getResponse();
  },
};

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    SalesTodayIntentHandler,
    KitchenStatusIntentHandler,
    StockQueryIntentHandler,
    AddOrderIntentHandler,
    CancelProductIntentHandler,
    RepeatUsualIntentHandler,
    HelpIntentHandler,
    StopIntentHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
