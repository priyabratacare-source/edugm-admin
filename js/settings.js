import { $, requireStaff, esc } from "./common.js"; const {user,profile}=await requireStaff("settings.html");
$("#settings-email").textContent=user.email||"—";$("#settings-role").textContent=profile.role||"—";$("#settings-uid").textContent=user.uid;$("#settings-status").textContent=profile.active===true?"Approved / active":"Inactive";
