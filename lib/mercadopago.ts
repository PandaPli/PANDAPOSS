import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

export function getMPClient(accessToken: string) {
  return new MercadoPagoConfig({ accessToken });
}

export function getPreferenceAPI(accessToken: string) {
  return new Preference(getMPClient(accessToken));
}

export function getPaymentAPI(accessToken: string) {
  return new Payment(getMPClient(accessToken));
}
