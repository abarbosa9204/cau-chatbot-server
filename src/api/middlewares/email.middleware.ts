import { Request, Response, NextFunction } from "express"

/**
  Valida si una dirección de correo electrónico dada es válida y pertenece al dominio corporativo.
  @param req El objeto de solicitud de Express.
  @param res El objeto de respuesta de Express.
  @param next La función next del middleware.  
*/
export function validateEmail(req: Request, res: Response, next: NextFunction): void {
  const email: string = req.body.email ?? req.params.email ?? req.query.email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (email === undefined) res.status(400).json("El correo electrónico no fue proporcionado en los datos de la solicitud")
  else if (!emailRegex.test(email)) res.status(400).json(`El correo electrónico '${email}' no corresponde a una dirección válida.`)
  else if (!email.endsWith("@equitel.com.co")) res.status(400).json(`El correo electrónico '${email}' no pertenece al dominio corporativo.`)
  else next()
}
