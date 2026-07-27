import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.route";
import { UserRoutes } from "../modules/user/user.route";
import { LeadRoutes } from "../modules/lead/lead.route";

export const router = Router();

const moduleRoutes = [
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/auth",
    route: authRoutes,
  },
  {
    path: "/lead",
    route: LeadRoutes,
  },
 
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
