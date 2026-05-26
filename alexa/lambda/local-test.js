const { handler } = require("./index");

const event = {
  version: "1.0",
  session: {
    new: true,
    sessionId: "local-session",
    application: { applicationId: "amzn1.ask.skill.local" },
    user: { userId: "local-user" },
  },
  context: {
    System: {
      application: { applicationId: "amzn1.ask.skill.local" },
      user: { userId: "local-user" },
      device: { deviceId: "local-device" },
      apiEndpoint: "https://api.amazonalexa.com",
    },
  },
  request: {
    type: "IntentRequest",
    requestId: "local-request",
    locale: "es-US",
    timestamp: new Date().toISOString(),
    intent: {
      name: "SalesTodayIntent",
      confirmationStatus: "NONE",
      slots: {},
    },
  },
};

handler(event, {}, (error, response) => {
  if (error) {
    console.error(error);
    process.exit(1);
  }

  console.log(JSON.stringify(response, null, 2));
});
