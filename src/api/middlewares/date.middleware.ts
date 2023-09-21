import { format } from "date-fns"
import { Request, Response, NextFunction } from "express"

/**
  Pasa los campos begin y end del body request al formato adecuado.
  @param req El objeto de solicitud de Express.
  @param res El objeto de respuesta de Express.
  @param next La función next del middleware.  
*/
export function formatDates(req: Request, res: Response, next: NextFunction): void {
  const begin: string = req.body.begin
  const end: string = req.body.end

  const dateRange = { begin: new Date(begin), end: new Date(end) }
  if (dateRange.begin > dateRange.end) res.status(400).json("La fecha de inicio no puede ser posterior a la fecha de finalización")
  if (dateRange.begin < new Date()) res.status(400).json("La fecha de inicio no puede ser anterior a la fecha actual")
  const formatGLPi = "yyyy-MM-dd HH:mm:ss"
  const beginGLPi = format(dateRange.begin, formatGLPi)
  const endGLPi = format(dateRange.end, formatGLPi)
  req.body.begin = beginGLPi
  req.body.end = endGLPi
  next()
}
