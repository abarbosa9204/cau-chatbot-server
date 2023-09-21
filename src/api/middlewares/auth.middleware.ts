import { Request, Response, NextFunction } from "express"

function validateAppToken(req: Request, res: Response, next: NextFunction): void {
  if (req.headers["app-token"] !== process.env.APP_TOKEN) {
    res.status(401).json("No estás correctamente autenticado para ejecutar está acción")
  } else {
    next()
  }
}

export { validateAppToken }
