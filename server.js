import express from 'express';
import userRoutes from './routes/userRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import authRoutes from './routes/authRoutes.js';
import taskRoutesV2 from './routes/v2/taskRoutes.js';

import cors from 'cors';
// import { pool } from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
// If running behind a proxy (nginx, load balancer) enable trust proxy so req.ip is correct
app.set('trust proxy', true);
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Route
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/tasks', taskRoutes);

// v2
app.use('/api/v2/tasks', taskRoutesV2);

// Run Server!!
app.listen(PORT, () => {
    console.log(`Server is runing on port http://localhost:${PORT}`)
    console.log(`--------------------------------------------------`)
    console.log(`Login`)
    console.log(`--------------------------------------------------`)
    console.log(`POST                          api/v1/auth/register`)
    console.log(`POST                             api/v1/auth/login`)
    console.log(`POST                           api/v1/auth/refresh`)
    console.log(`POST                            api/v1/auth/logout`)
    console.log(`--------------------------------------------------`)
    console.log(`==================================================`)
    console.log(`--------------------------------------------------`)
    console.log(`USERS for Admin`)
    console.log(`--------------------------------------------------`)
    console.log(`GET: users                            api/v1/users`)
    console.log(`GET: userById                     api/v1/users/:id`)
    console.log(`PUT: updateUser                   api/v1/users/:id`)
    console.log(`DELETE: user                      api/v1/users/:id`)
    console.log(`--------------------------------------------------`)
    console.log(`==================================================`)
    console.log(`--------------------------------------------------`)
    console.log(`USERS`)
    console.log(`--------------------------------------------------`)
    console.log(`GET: get                           api/v1/users/me`)
    console.log(`PUT: update                        api/v1/users/me`)
    console.log(`DELETE: delete                     api/v1/users/me`)
    console.log(`--------------------------------------------------`)
    console.log(`==================================================`)
    console.log(`--------------------------------------------------`)
    console.log(`TASKS`)
    console.log(`--------------------------------------------------`)
    console.log(`GET: tasks                            api/v1/tasks`)
    console.log(`GET: taskById                      api/v1/task/:id`)
    console.log(`POST: createTask                       api/v1/task`)
    console.log(`PUT: updateTask                    api/v1/task/:id`)
    console.log(`PATCH: updateTaskStatus     api/v1/task/:id/status`)
    console.log(`DELETE: Deltask                    api/v1/task/:id`)
    console.log(`--------------------------------------------------`)
});