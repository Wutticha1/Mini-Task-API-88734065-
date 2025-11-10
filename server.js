import express from 'express';
import userRoutes from './routes/userRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
// import { pool } from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Route
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/tasks', taskRoutes);

// Run Server!!
app.listen(PORT, () => {
    console.log(`Server is runing on port http://localhost:${PORT}`)
    console.log(`--------------------------------------------------`)
    console.log(`USERS`)
    console.log(`--------------------------------------------------`)
    console.log(`GET: users                             api/v1/users`)
    console.log(`GET: userById                      api/v1/users/:id`)
    console.log(`POST: createUser For Admin             api/v1/users`)
    console.log(`PUT: updateUser                    api/v1/users/:id`)
    console.log(`DELETE: user                       api/v1/users/:id`)
    console.log(`--------------------------------------------------`)
    console.log(`==================================================`)
    console.log(`--------------------------------------------------`)
    console.log(`TASKS`)
    console.log(`--------------------------------------------------`)
    console.log(`GET: tasks                             api/v1/tasks`)
    console.log(`GET: taskById                       api/v1/task/:id`)
    console.log(`POST: createTask                        api/v1/task`)
    console.log(`PUT: updateTask                     api/v1/task/:id`)
    console.log(`PATCH: updateTaskStatus      api/v1/task/:id/status`)
    console.log(`DELETE: Deltask                     api/v1/task/:id`)
    console.log(`--------------------------------------------------`)
});