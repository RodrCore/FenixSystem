"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutingModule = void 0;
const common_1 = require("@nestjs/common");
const osrm_service_1 = require("./osrm.service");
const routing_controller_1 = require("./routing.controller");
let RoutingModule = class RoutingModule {
};
exports.RoutingModule = RoutingModule;
exports.RoutingModule = RoutingModule = __decorate([
    (0, common_1.Module)({
        controllers: [routing_controller_1.RoutingController],
        providers: [osrm_service_1.OsrmService],
        exports: [osrm_service_1.OsrmService],
    })
], RoutingModule);
//# sourceMappingURL=routing.module.js.map