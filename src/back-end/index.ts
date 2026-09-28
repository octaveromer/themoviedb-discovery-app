import express from 'express';
import healthRouter from './health-api';
import moviesRouter from './movies-api';

// Define the port number for the server to listen on
const port: number = 3000;

// Create a new express application instance
const app = express();

// Register API routes from dedicated modules
app.use('/api/health', healthRouter);
app.use('/api/movies', moviesRouter);

// Start the server and listen on the specified port
app.listen(port, () => {
  console.log(`Example app in TypeScript listening on port ${port}`);
});
