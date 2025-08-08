import express from 'express'
import userRoutes from './routes/userRoutes'
import kosRoutes from './routes/kosRoutes'
import bookRoutes from './routes/bookRoutes'

const app = express()

app.use(express.json()); // ← WAJIB
app.use(express.urlencoded({ extended: true }));

app.use(express.json())
app.use('/user', userRoutes)
app.use('/kos', kosRoutes)
app.use('/book', bookRoutes)

export default app;