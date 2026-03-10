import cors from 'cors';
import express, { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import path from 'path';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import router from './routes';
import { Morgan } from './shared/morgen';
import { handleStripeWebhook } from './helpers/stripe/handleStripeWebHook';

const app = express();

// set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook,
);
// morgan logs
app.use(Morgan.successHandler);
app.use(Morgan.errorHandler);

// body parsers
app.use(
  cors({
    origin: [
      'https://admin.dutyhourapp.com',
      'https://www.admin.dutyhourapp.com',
      'https://business.dutyhourapp.com',
      'https://www.business.dutyhourapp.com',
      'https://api.dutyhourapp.com',
      'https://www.api.dutyhourapp.com',
      'http://10.10.7.62:5174',
      'http://10.10.7.62:5173',
    ],
    credentials: true,
  }),
);

app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve /uploads folder as static
//file retrieve
app.use(express.static('uploads'));
// (Optional) Serve public folder
app.use('/public', express.static(path.join(process.cwd(), 'public')));

// API routes
app.use('/api/v1', router);

// health check route
app.get('/', (_req: Request, res: Response) => {
  const date = new Date(Date.now());
  res.send(
    `<h1 style="text-align:center; color:#173616; font-family:Verdana;">Beep-beep! The server is alive and kicking.</h1>
     <p style="text-align:center; color:#173616; font-family:Verdana;">${date}</p>`,
  );
});

// global error handler
app.use(globalErrorHandler);

// handle 404 routes
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: 'Not found',
    errorMessages: [
      {
        path: req.originalUrl,
        message: "API DOESN'T EXIST",
      },
    ],
  });
});

export default app;
