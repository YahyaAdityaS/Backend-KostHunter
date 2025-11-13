import express from 'express'
import cors from 'cors'
import userRoutes from './routes/userRoutes'
import kosRoutes from './routes/kosRoutes'
import bookRoutes from './routes/bookRoutes'
import riviewRoutes from './routes/riviewRoutes'
import facilityRoutes from './routes/facilityRoutes'
import pictureRoutes from './routes/pictureRoutes'

const app = express()

app.use(
  cors({
    origin: "http://localhost:3000", // URL frontend Next.js kamu
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json()); // ← WAJIB
app.use(express.urlencoded({ extended: true }));

app.use(express.json())
app.use('/user', userRoutes)
app.use('/kos', kosRoutes)
app.use('/book', bookRoutes)
app.use('/riview', riviewRoutes)
app.use('/facility', facilityRoutes)
app.use('/picture', pictureRoutes)

export default app;