import express, { urlencoded } from 'express'
import {config} from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import morgan from 'morgan';
import errorMiddleware from './middleware/errormiddleware.js';
import userRoutes from './routes/userRoutes.js';
import courseRoutes from './routes/courseRoutes.js'
import miscellaneous from './routes/miscellaneousRoutes.js'


const app = express();


config()
app.use(express.json())
app.use(cookieParser())
app.use(urlencoded({extended:true}))
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials:true
}))

app.use(morgan('dev'))
app.use('/ping',function(req,res){
    res.status(200)
    res.send('Pong')
})

// routes of 3 module

app.use('/api/v1/user',userRoutes);
app.use('/api/v1/courses',courseRoutes);
app.use('/api/v1/misc',miscellaneous)

app.all('*', (req,res)=>{
  res.status(404)
  res.send('page not found')
})

app.use(errorMiddleware)

export default app;