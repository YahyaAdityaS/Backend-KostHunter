import { Router } from 'express';
import { uploadKosPhotos, getKosPhotos, deleteKosPhoto } from '../controller/pictureController';
import { verifyToken, verifyRole } from '../middlewares/authorization';
import { uploadKosPhotos as multerUpload, validateKosAndPhotos } from '../middlewares/pictureUpload';
import { Role } from '@prisma/client';

const router = Router();

// Semua route butuh auth dan role owner
router.use(verifyToken);
router.use(verifyRole([Role.owner]));

router.get('/kos/:kosId/', getKosPhotos);
router.post('/kos/:kosId/', validateKosAndPhotos, multerUpload, uploadKosPhotos);
router.delete('/kos/:kosId/photos/:photoId', deleteKosPhoto);

export default router;