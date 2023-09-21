import { Request, Response, NextFunction } from "express"
import { HttpError } from "../../domain/API/HttpError"

/**
  Gestiona los posibles errores al momento de intentar proveer un servicio.
  @param req El objeto de solicitud de Express.
  @param res El objeto de respuesta de Express.
  @param next La función next del middleware.  
*/
export function handleErrors(req: Request, res: Response, next: NextFunction): void {
  try {
    next()
  } catch (error) {
    console.log(error)
    if (error instanceof HttpError) res.status(error.status).json(error.message)
  }
}
