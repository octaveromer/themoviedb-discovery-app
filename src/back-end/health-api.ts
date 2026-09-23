import express, { type Router } from 'express';

const healthRouter: Router = express.Router();

healthRouter.get('/', (_request, response) => {
  response.json({ status: 'ok' });
});

export default healthRouter;
