import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import RecipientController from './app/controllers/RecipientController';
import FileController from './app/controllers/FileController';

import authMiddleware from './app/middlewares/auth';
import DeliveryManController from './app/controllers/DeliveryManController';
import DeliveryController from './app/controllers/DeliveryController';
import DeliveryStatusController from './app/controllers/DeliveryStatusController';
import DeliveryProblemController from './app/controllers/DeliveryProblemController';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/login', SessionController.store);

routes.get('/deliveryman/:id/deliveries', DeliveryStatusController.index);
routes.put(
  '/deliveryman/:deliverymanId/deliveries/:deliveryId',
  upload.single('file'),
  DeliveryStatusController.update
);

routes.use(authMiddleware);

routes.get('/users/:id?', UserController.index);
routes.post('/users', UserController.store);
routes.put('/user', UserController.update);
routes.delete('/users/:id', UserController.delete);

routes.get('/recipients/:id?', RecipientController.index);
routes.post('/recipients', RecipientController.store);
routes.put('/recipients/:id', RecipientController.update);
routes.delete('/recipients/:id', RecipientController.delete);

routes.post('/files', upload.single('file'), FileController.store);

routes.get('/deliveryman/:id?', DeliveryManController.index);
routes.post('/deliveryman', DeliveryManController.store);
routes.put('/deliveryman/:id', DeliveryManController.update);
routes.delete('/deliveryman/:id', DeliveryManController.delete);

routes.get('/deliveries/:id?', DeliveryController.index);
routes.post('/deliveries', DeliveryController.store);
routes.put('/deliveries/:id', DeliveryController.update);
routes.delete('/deliveries/:id', DeliveryController.delete);

routes.get('/delivery/:id?/problems', DeliveryProblemController.index);
routes.post('/delivery/:id/problems', DeliveryProblemController.store);
routes.delete('/problem/:id/cancel-delivery', DeliveryProblemController.delete);

export default routes;
