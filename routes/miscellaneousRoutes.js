import {Router} from 'express'
import contactInfo from '../controllers/contactContoller.js';

const router = Router();

router.route('/contact').post(contactInfo)
export default router;