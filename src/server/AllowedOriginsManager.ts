/**
 * Clase para obtener el origen permitido según el entorno de ejecución.
 */
export class AllowedOriginsManager {
  /**
   * Origen permitido en modo de desarrollo.
   */
  private static readonly developmentOrigin = "http://localhost:4200"

  /**
   * Origen permitido en modo de producción.
   */
  private static readonly productionOrigin = "https://api-chatbot.cumandes.com"

  /**
   * Obtiene el origen permitido según el entorno de ejecución.
   * @returns {string} El origen permitido.
   * @throws {Error} Si la variable 'NODE_ENV' no está configurada correctamente.
   */
  public static get(): string {
    if (process.env.NODE_ENV === "development") {
      return AllowedOriginsManager.developmentOrigin
    } else if (process.env.NODE_ENV === "production") {
      return AllowedOriginsManager.productionOrigin
    } else {
      throw new Error("La variable 'NODE_ENV' no está configurada correctamente")
    }
  }
}
