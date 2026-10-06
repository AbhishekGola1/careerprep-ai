const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');


const app = express();
const allowedOrigins = [
    'http://localhost:5173',
    'https://careerprep-ai-01.vercel.app',
    ...(process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
];

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true
}))


/* require all the routes here */
const authRouter = require('./routes/auth.routes');
const interviewRouter = require('./routes/interview.routes');


/* using all the routes here */
app.use('/api/auth', authRouter);

app.use('/api/interview', interviewRouter);



module.exports = app;