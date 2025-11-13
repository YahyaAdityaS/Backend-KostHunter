import { Router } from 'express';
import { uploadKosPhotos, getKosPhotos, deleteKosPhoto } from '../controller/pictureController';
import { verifyToken, verifyRole } from '../middlewares/authorization';
import { uploadKosPhotos as multerUpload, validateKosAndPhotos } from '../middlewares/pictureUpload';
import { Role } from '@prisma/client';

const app = Router();

// Semua route butuh auth dan role owner
app.use(verifyToken);
app.use(verifyRole([Role.owner]));

app.get('/kos/:kosId/', getKosPhotos);
app.post('/kos/:kosId/', validateKosAndPhotos, multerUpload, uploadKosPhotos);
app.delete('/kos/:kosId/photos/:photoId', deleteKosPhoto);

export default app;