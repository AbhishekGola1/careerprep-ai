require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');

async function startServer() {
  await connectDB();

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error('Server startup failed:', error);
  process.exit(1);
});