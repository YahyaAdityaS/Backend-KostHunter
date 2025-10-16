import express from "express";

import {getAllFacility, createFacility, updateFacility, deleteFacility, getFacilityByKosId} from "../controller/facilityController";
import { verifyAddFacility, verifyEditFacility } from "../middlewares/verifyFacility";
import { verifyToken, verifyRole } from "../middlewares/authorization";

const app = express();

app.get("/", getAllFacility);
app.get("/:kosId", getFacilityByKosId);
app.post("/create", [verifyToken, verifyRole(["owner"]), ...verifyAddFacility], createFacility);
app.put("/:id", [verifyToken, verifyRole(["owner"]), ...verifyEditFacility], updateFacility);
app.delete("/:id", [verifyToken, verifyRole(["owner"])], deleteFacility);

export default app;