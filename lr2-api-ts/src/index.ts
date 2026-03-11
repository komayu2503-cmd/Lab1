import express, { Request, Response } from "express"; 
 
const app = express(); 
app.use(express.json()); 
 
app.get("/health", (req: Request, res: Response) => { 
  res.status(200).json({ ok: true }); 
}); 
 
app.listen(3000, () => console.log("API started on http://localhost:3000")); 
