import express from 'express';
import healthRouter from './health-api';
import moviesRouter from './movies-api';

export const app = express();

app.use('/api/health', healthRouter);
app.use('/api/movies', moviesRouter);
