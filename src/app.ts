import express from 'express'
import userRoutes from './routes/userRoutes'
import kosRoutes from './routes/kosRoutes'
import bookRoutes from './routes/bookRoutes'
import riviewRoutes from './routes/riviewRoutes'

const app = express()

app.use(express.json()); // ← WAJIB
app.use(express.urlencoded({ extended: true }));

app.use(express.json())
app.use('/user', userRoutes)
app.use('/kos', kosRoutes)
app.use('/book', bookRoutes)
app.use('/riview', riviewRoutes)

export default app;