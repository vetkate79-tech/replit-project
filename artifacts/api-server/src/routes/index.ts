import { Router, type IRouter } from "express";
import healthRouter from "./health";
import wordsRouter from "./words";
import searchInferenceRouter from "./search-inference";

const router: IRouter = Router();

router.use(healthRouter);
router.use(wordsRouter);
router.use(searchInferenceRouter);

export default router;
