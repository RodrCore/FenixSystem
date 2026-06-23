"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
const prisma = new client_1.PrismaClient();
const rawProductos = [
    { nombre: 'OLE OLE', precio: 12.00 },
    { nombre: 'ACONCAGUA', precio: 15.60 },
    { nombre: 'AGOGO BOLSA', precio: 10.00 },
    { nombre: 'ALKA', precio: 16.00 },
    { nombre: 'ALKA CHERRY x 250 UNI', precio: 16.00 },
    { nombre: 'AMBERRIE', precio: 27.00 },
    { nombre: 'AMBROSITO', precio: 27.00 },
    { nombre: 'AMBROSOLI FLIPY', precio: 27.00 },
    { nombre: 'ANGELITO COPIX', precio: 9.50 },
    { nombre: 'ANGELITO FRUTAS', precio: 9.50 },
    { nombre: 'API MORADO TRADICIONAL 200g', precio: 3.50 },
    { nombre: 'API AMARILLO C/FRUTAS 200g', precio: 3.50 },
    { nombre: 'API DE QUINUA C/FRUTAS 200g', precio: 3.50 },
    { nombre: 'ARBOLITO NAVIDEÑO 50g', precio: 12.00 },
    { nombre: 'AVENTURA AMARILLO', precio: 2.225 },
    { nombre: 'AVENTURA VERDE', precio: 2.225 },
    { nombre: 'AVENTURA L/P', precio: 2.225 },
    { nombre: 'AVENTURA LILA', precio: 2.225 },
    { nombre: 'AVENTURA ROJO', precio: 2.225 },
    { nombre: 'AVENTURA BLANCO', precio: 2.225 },
    { nombre: 'AVENTURA SURTIDO', precio: 2.225 },
    { nombre: 'AVENTURA AMARILLO FAC', precio: 2.292 },
    { nombre: 'AVENTURA VERDE FAC', precio: 2.292 },
    { nombre: 'AVENTURA L/P FAC', precio: 2.292 },
    { nombre: 'AVENTURA LILA FAC', precio: 2.292 },
    { nombre: 'AVENTURA ROJO FAC', precio: 2.292 },
    { nombre: 'AVENTURA BLANCO FAC', precio: 2.292 },
    { nombre: 'AVENTURA SURTIDO FAC', precio: 2.292 },
    { nombre: 'BARRILETE BOLSA', precio: 15.00 },
    { nombre: 'BATON DE 30 UNI', precio: 35.00 },
    { nombre: 'BATON BLANCO', precio: 35.00 },
    { nombre: 'BATON CELESTE EXTRA MILK', precio: 35.00 },
    { nombre: 'BATON ROSADO CREMA FRUTILLA', precio: 35.00 },
    { nombre: 'BAZOOKA AMARILLO', precio: 36.00 },
    { nombre: 'BAZOOKA ROJO', precio: 36.00 },
    { nombre: 'BAZOOKA VERDE', precio: 36.00 },
    { nombre: 'BAZOOKA SURTIDO', precio: 36.00 },
    { nombre: 'BELDENT AZUL', precio: 38.00 },
    { nombre: 'BELDENT NEGRO', precio: 38.00 },
    { nombre: 'BELDENT ROJO', precio: 38.00 },
    { nombre: 'BELDENT VERDE', precio: 38.00 },
    { nombre: 'BELDENT SURTIDO', precio: 38.00 },
    { nombre: 'BIOOPS', precio: 13.00 },
    { nombre: 'BON NUIT', precio: 20.00 },
    { nombre: 'BON O BON AMARILLO', precio: 25.00 },
    { nombre: 'BON O BON BLANCO', precio: 25.00 },
    { nombre: 'BON O BON CHOCOLATE', precio: 25.00 },
    { nombre: 'BON O BON GALLETA', precio: 8.50 },
    { nombre: 'BON O BON OBLEA', precio: 22.00 },
    { nombre: 'BRUSOLITO AZUL', precio: 12.50 },
    { nombre: 'BUBALOO ACIDO', precio: 20.00 },
    { nombre: 'BUBALOO AMARILLO', precio: 20.00 },
    { nombre: 'BUBALOO MORADO', precio: 20.00 },
    { nombre: 'BUBALOO ROJO', precio: 20.00 },
    { nombre: 'BUBALOO ROSADO', precio: 20.00 },
    { nombre: 'BUBALOO SURTIDO', precio: 20.00 },
    { nombre: 'BURBUJITAS 50g', precio: 5.00 },
    { nombre: 'BUTER', precio: 25.00 },
    { nombre: 'BUUH TUTTI-FRUTTI 40uni X 12gr', precio: 15.00 },
    { nombre: 'BUUH MACA VERDE 40uni X 12gr', precio: 15.00 },
    { nombre: 'BUUH MORANGO 40uni X 12gr', precio: 15.00 },
    { nombre: 'CAFE ESTRELLA', precio: 15.00 },
    { nombre: 'CAFE COPACABANA 50g x20u', precio: 44.00 },
    { nombre: 'CAFE COPACABANA 250g', precio: 11.00 },
    { nombre: 'CAFE COPACABANA 500g', precio: 22.00 },
    { nombre: 'CAFE COPACABANA 1 Kg', precio: 44.00 },
    { nombre: 'CAFE COPACABANA 50g', precio: 8.00 },
    { nombre: 'CEIBO CORAZON', precio: 12.00 },
    { nombre: 'CEIBOLITO LECHE', precio: 12.50 },
    { nombre: 'CEIBOLITO MANI', precio: 12.50 },
    { nombre: 'CEIBOLITO QUINUA', precio: 12.50 },
    { nombre: 'CEIBOLITO AMARANTO', precio: 12.50 },
    { nombre: 'CEIBOLITO 1 Kilo', precio: 90.00 },
    { nombre: 'CEIBO ESTRELLITA 120g', precio: 20.00 },
    { nombre: 'CEIBO PAPANOEL 80g', precio: 16.00 },
    { nombre: 'CENTRO LIQUIDO ACIDO', precio: 20.00 },
    { nombre: 'CHAMPAGNE FERRARI', precio: 9.00 },
    { nombre: 'CHICLET AMARILLO', precio: 30.50 },
    { nombre: 'CHICLET NEGRO CUBO', precio: 30.50 },
    { nombre: 'CHICLET SURTIDO', precio: 30.50 },
    { nombre: 'CHIP AHOY', precio: 11.20 },
    { nombre: 'CHOCMAN', precio: 0.93 },
    { nombre: 'CHOCMAN BLACK', precio: 0.93 },
    { nombre: 'CHOCO SODA', precio: 10.00 },
    { nombre: 'CHOCOTONCITO 80g', precio: 8.00 },
    { nombre: 'CHOCOLATE DE COCINA 1', precio: 47.00 },
    { nombre: 'CHOCOLATE DE COCINA 2', precio: 45.00 },
    { nombre: 'CHOCOLATE COCINA 500g', precio: 24.00 },
    { nombre: 'CHOCOLATE COCINA 500g FC', precio: 25.00 },
    { nombre: 'CHUBI', precio: 29.00 },
    { nombre: 'CHUBITON x20', precio: 29.00 },
    { nombre: 'CHUPETE 50Uni Mujer', precio: 7.00 },
    { nombre: 'CHUPETE 50Uni Varon', precio: 7.00 },
    { nombre: 'CHOCLITO ENLATADO', precio: 4.00 },
    { nombre: 'CHOCO CHOCO MEGA', precio: 42.50 },
    { nombre: 'CHOCO CHOCO PEQUE 4G', precio: 18.00 },
    { nombre: 'KLEENEX ELITE', precio: 5.90 },
    { nombre: 'CLORETS', precio: 28.00 },
    { nombre: 'CLUB SOCIAL ORIGINAL', precio: 9.00 },
    { nombre: 'COBERTURA TROPICALIZADO', precio: 12.00 },
    { nombre: 'COBERTURA TROP X CAJA', precio: 60.00 },
    { nombre: 'COCOA MINI 50g', precio: 3.00 },
    { nombre: 'COCOA 150g Natural', precio: 8.50 },
    { nombre: 'COCOA 150g ORGANICA Pr', precio: 9.50 },
    { nombre: 'COCOA 150g ORGANICA', precio: 9.00 },
    { nombre: 'COCOA 250g Natural', precio: 14.00 },
    { nombre: 'COCOA 250g ORGANICA', precio: 16.00 },
    { nombre: 'COCOA 500g Natural', precio: 26.00 },
    { nombre: 'COCOA 500g ORGANICA', precio: 28.00 },
    { nombre: 'COCOA KILO', precio: 50.00 },
    { nombre: 'COCOA TARRO 250g ORGANICA', precio: 17.00 },
    { nombre: 'MICOA TARRO 400g', precio: 16.00 },
    { nombre: 'MICOA MILK TARRO 400g', precio: 16.00 },
    { nombre: 'QUINOCOA TARRO 400g', precio: 16.00 },
    { nombre: 'QUINUCOA 250g', precio: 8.50 },
    { nombre: 'MICOA 250g', precio: 8.50 },
    { nombre: 'MICOA MILK 250g', precio: 8.50 },
    { nombre: 'COCOA TROPICAL', precio: 2.65 },
    { nombre: 'COCOA INCADEX BREICK 250g', precio: 12.00 },
    { nombre: 'CHOCOLATE FIERAS', precio: 20.00 },
    { nombre: 'CHOCOLATE MINI SAURIO', precio: 20.00 },
    { nombre: 'CHOCOLATE PIRATAS', precio: 20.00 },
    { nombre: 'CHOCOLATE CACHORRITOS', precio: 20.00 },
    { nombre: 'CORAZON DULCE CORACAU', precio: 19.00 },
    { nombre: 'DINAMICO 30g', precio: 4.50 },
    { nombre: 'DOBLON', precio: 13.00 },
    { nombre: 'DOCIGOMA FRUTAS GRANDE', precio: 20.00 },
    { nombre: 'DOCIGOMA YOGURT GRANDE', precio: 20.00 },
    { nombre: 'DUCREM', precio: 20.00 },
    { nombre: 'GOMUCHO FRUTAS', precio: 20.00 },
    { nombre: 'GOMUCHO YOGURT', precio: 20.00 },
    { nombre: 'DONOFRIO', precio: 56.00 },
    { nombre: 'EMOTICON CEIBO', precio: 6.00 },
    { nombre: 'EMBARE CHOCOLATE', precio: 18.00 },
    { nombre: 'EMBARE LECHE', precio: 18.00 },
    { nombre: 'FRANCESA PANCREK', precio: 5.50 },
    { nombre: 'FRANCESA PANCREK 1/2 KILO', precio: 13.00 },
    { nombre: 'FRANCESA PANCREK KILO', precio: 25.50 },
    { nombre: 'FRANCESA NEVADA GR', precio: 7.00 },
    { nombre: 'FRANCESA NEVADA PQ', precio: 4.00 },
    { nombre: 'FRANCESA SALVADO NATURAL', precio: 6.50 },
    { nombre: 'FRANCESA SALVADO KILO', precio: 25.50 },
    { nombre: 'FRANCESA FESTIVAL', precio: 62.00 },
    { nombre: 'FRANCESA FESTIVAL X DOCENA', precio: 0.83 },
    { nombre: 'FRANCESA PARISINA', precio: 6.00 },
    { nombre: 'FRANCESA CARICIA', precio: 6.00 },
    { nombre: 'FRANCESA MINI SUCREM x50u', precio: 20.00 },
    { nombre: 'FRANCESA MINI PANCREK x50u', precio: 20.00 },
    { nombre: 'FRANCESA MONOLITO x100u', precio: 40.00 },
    { nombre: 'FRANCESA MINI SALVADO x50', precio: 20.00 },
    { nombre: 'FRANCESA G PARA MAMA', precio: 15.00 },
    { nombre: 'FILIPITO 200g A', precio: 13.00 },
    { nombre: 'FILIPITO 200g B', precio: 12.50 },
    { nombre: 'FILIPITO 200g POR MAYOR', precio: 12.33 },
    { nombre: 'FILIPITO 30g POR UNIDADES', precio: 2.00 },
    { nombre: 'FILIPITO 30g POR MEDIA BOLSA', precio: 1.90 },
    { nombre: 'FILIPITO 30g POR BOLSA', precio: 1.85 },
    { nombre: 'FIDOS 200g A', precio: 13.00 },
    { nombre: 'FIDOS 200g B', precio: 12.50 },
    { nombre: 'FIDOS 200g POR MAYOR', precio: 12.33 },
    { nombre: 'FIDOS 30g POR UNIDADES', precio: 2.00 },
    { nombre: 'FIDOS 30g POR MEDIA BOLSA', precio: 1.90 },
    { nombre: 'FIDOS 30g POR BOLSA', precio: 1.85 },
    { nombre: 'FRAC GRANDE AZUL 132g', precio: 5.25 },
    { nombre: 'FRAC GRANDE CAFE 132g', precio: 5.25 },
    { nombre: 'FRAC GRANDE ROJO 130g', precio: 5.25 },
    { nombre: 'FRAC PEQUEÑO AZUL', precio: 8.00 },
    { nombre: 'FRAC PEQUEÑO CAFE', precio: 8.00 },
    { nombre: 'FRAC PEQUEÑO ROJO', precio: 8.00 },
    { nombre: 'FRAC PEQUEÑO VERDE', precio: 8.00 },
    { nombre: 'FRUGELE', precio: 14.00 },
    { nombre: 'GENIO BLANCO', precio: 32.00 },
    { nombre: 'GENIO CHOCOLATE', precio: 32.00 },
    { nombre: 'GENIO SURTIDO', precio: 32.00 },
    { nombre: 'GAROTO', precio: 13.00 },
    { nombre: 'GOLAZO', precio: 19.00 },
    { nombre: 'GOLPE', precio: 32.00 },
    { nombre: 'GALLETA TODDY', precio: 8.20 },
    { nombre: 'GALLETA TODDY NEGRO', precio: 8.20 },
    { nombre: 'GALLETON BREICK x unidad', precio: 6.00 },
    { nombre: 'GALLETON BREICK x 10 UNI', precio: 60.00 },
    { nombre: 'GRAGEA ARROZ 500g', precio: 42.00 },
    { nombre: 'GRAGEA PASAS 500g', precio: 42.00 },
    { nombre: 'GRAGEA MANI 500g', precio: 42.00 },
    { nombre: 'GRAGEA ARROZ 100g', precio: 10.50 },
    { nombre: 'GRAGEA PASAS 100g', precio: 10.50 },
    { nombre: 'GRAGEA MANI 100g', precio: 10.50 },
    { nombre: 'GRAGEA ARROZ 100g FAC', precio: 11.00 },
    { nombre: 'GRAGEA PASAS 100g FAC', precio: 11.00 },
    { nombre: 'GRAGEA MANI 100g FAC', precio: 11.00 },
    { nombre: 'GRAGEA ARROZ 50g FAC', precio: 6.00 },
    { nombre: 'GRAGEA PASAS 50g FAC', precio: 6.00 },
    { nombre: 'GRAGEA MANI 50g FAC', precio: 6.00 },
    { nombre: 'GROSSO BANANA', precio: 34.00 },
    { nombre: 'GROSSO AZUL', precio: 34.00 },
    { nombre: 'GROSSO LILA', precio: 34.00 },
    { nombre: 'GROSSO SANDIA', precio: 34.00 },
    { nombre: 'GROSSO CELESTE', precio: 34.00 },
    { nombre: 'GROSSO ROSADO', precio: 34.00 },
    { nombre: 'GROSSO NUEVO', precio: 34.00 },
    { nombre: 'GROSSO ROJO', precio: 34.00 },
    { nombre: 'GROSSO SURTIDO', precio: 34.00 },
    { nombre: 'GROSSO VERDE', precio: 34.00 },
    { nombre: 'GROSSO BOLSA', precio: 17.00 },
    { nombre: 'HALLS SURTIDO', precio: 22.00 },
    { nombre: 'HALLS ROJO', precio: 22.00 },
    { nombre: 'HALLS AZUL', precio: 22.00 },
    { nombre: 'HALLS NEGRO', precio: 22.00 },
    { nombre: 'HALLS LILA', precio: 22.00 },
    { nombre: 'HALLS ROSADO', precio: 22.00 },
    { nombre: 'HALLS AMARILLO', precio: 22.00 },
    { nombre: 'HALLS VERDE', precio: 22.00 },
    { nombre: 'HUEVOS DINOVOS 300g', precio: 45.00 },
    { nombre: 'HUEVOS DE PASCUA GRANDE 40g', precio: 7.50 },
    { nombre: 'HUEVOS DE PASCUA PQ 8g', precio: 1.80 },
    { nombre: 'HUEVOS DE PASCUA DINOVITOS', precio: 18.00 },
    { nombre: 'NUEZ DE PASCUA 42g', precio: 7.00 },
    { nombre: 'CONEJOS BENNY 250g', precio: 34.50 },
    { nombre: 'CONEJOS BENNY 150g', precio: 24.50 },
    { nombre: 'CONEJOS BENNY 35g', precio: 9.50 },
    { nombre: 'CONEJOS DE PASCUA 350g', precio: 39.50 },
    { nombre: 'CONEJOS DE PASCUA 250g', precio: 29.50 },
    { nombre: 'CONEJOS DE PASCUA 80g', precio: 12.50 },
    { nombre: 'KILATE', precio: 15.00 },
    { nombre: 'KILOMBO', precio: 25.50 },
    { nombre: 'KRAPULITO', precio: 22.00 },
    { nombre: 'KRAPULCHOC x 60u', precio: 22.00 },
    { nombre: 'LECHE GLORIA NESTLE', precio: 8.50 },
    { nombre: 'LIDITA ATUN 170g', precio: 4.50 },
    { nombre: 'LOTE AMARILLO', precio: 15.00 },
    { nombre: 'LOTE BLANCO', precio: 15.00 },
    { nombre: 'LOTE LILA', precio: 15.00 },
    { nombre: 'LOTE ROJO', precio: 15.00 },
    { nombre: 'LOTE VERDE', precio: 15.00 },
    { nombre: 'LOTE SURTIDO', precio: 15.00 },
    { nombre: 'LUBA', precio: 15.00 },
    { nombre: 'LUX 85g SURTIDO', precio: 2.92 },
    { nombre: 'MANJAR PQ', precio: 12.50 },
    { nombre: 'MANJAR LARGO', precio: 24.50 },
    { nombre: 'MANJAR 1/4 KILO', precio: 6.56 },
    { nombre: 'MASMELO PEQUE', precio: 33.00 },
    { nombre: 'MASMELO MAS RICO', precio: 4.70 },
    { nombre: 'MASMELO MAS RICO x CAJA 25uni', precio: 4.40 },
    { nombre: 'MASMELO JUMBO', precio: 8.70 },
    { nombre: 'MASMELO JUMBO x 30uni', precio: 8.50 },
    { nombre: 'MASTICABLE YOGURT 175uni', precio: 11.50 },
    { nombre: 'MASTICABLE ARCOR', precio: 20.00 },
    { nombre: 'MASTICABLE VAINILLA Y FRUTILLA 110u', precio: 18.00 },
    { nombre: 'MASTICABLE FLORESTAL', precio: 10.00 },
    { nombre: 'MASTICABLE 100Uni', precio: 6.00 },
    { nombre: 'MENTA CHOCOLATE 135u', precio: 30.00 },
    { nombre: 'MENTA CHOCOLATE 73u', precio: 15.00 },
    { nombre: 'MENTA CRISTAL', precio: 25.00 },
    { nombre: 'MIEL DE ARCOR', precio: 25.00 },
    { nombre: 'MECANO', precio: 32.00 },
    { nombre: 'MINI COLA', precio: 13.00 },
    { nombre: 'MINTY AMARILLO', precio: 17.50 },
    { nombre: 'MINTY CEREZA', precio: 17.50 },
    { nombre: 'MINTY FRUTAS', precio: 17.50 },
    { nombre: 'MINTY NEGRO', precio: 17.50 },
    { nombre: 'MINTY ROJO', precio: 17.50 },
    { nombre: 'MINTY VERDE', precio: 17.50 },
    { nombre: 'MINTY SURTIDO', precio: 17.50 },
    { nombre: 'MINI OREO', precio: 27.00 },
    { nombre: 'MOMENTO', precio: 26.50 },
    { nombre: 'MONTERREY 100 UNI', precio: 55.00 },
    { nombre: 'NESCAFE 48 UNI', precio: 34.00 },
    { nombre: 'NESCAFE 96 UNI', precio: 58.00 },
    { nombre: 'NESCAFE 50g', precio: 8.00 },
    { nombre: 'NIKOLO', precio: 45.50 },
    { nombre: 'NUCITA', precio: 20.00 },
    { nombre: 'OSO TEDDY', precio: 55.00 },
    { nombre: 'OSO POO', precio: 25.00 },
    { nombre: 'OREO CHOCOLATE', precio: 8.70 },
    { nombre: 'OREO VAINILLA', precio: 8.70 },
    { nombre: 'OREO GALLETA VAINILLA AMARILLO', precio: 18.00 },
    { nombre: 'OREO COOKIES PLOMO', precio: 18.00 },
    { nombre: 'OREO NUEVO', precio: 9.00 },
    { nombre: 'OREO TUBO', precio: 5.00 },
    { nombre: 'OREO TUBO 182.5g AG', precio: 6.00 },
    { nombre: 'OKA LOKA FUSION', precio: 18.00 },
    { nombre: 'PALITOS DE TARHUI', precio: 10.00 },
    { nombre: 'AMARANTO', precio: 10.00 },
    { nombre: 'PASTA DE CACAO', precio: 75.00 },
    { nombre: 'PASTA DE CACAO X 5 UNI', precio: 15.00 },
    { nombre: 'PANATON CEIBO VAINILLA 750g', precio: 35.00 },
    { nombre: 'PANETON CEIBO CHOCOLATE 750g', precio: 36.00 },
    { nombre: 'PANATON CEIBO TRADICIONAL 750g', precio: 35.00 },
    { nombre: 'PANETTONE VAINILLA CON COBERTURA 750g', precio: 45.00 },
    { nombre: 'PANETTONE CHOCOLATE CON COBERTURA 750g', precio: 45.00 },
    { nombre: 'PANETONE EX FINO 750g', precio: 30.50 },
    { nombre: 'PANETONE EX FINO 610g', precio: 27.50 },
    { nombre: 'PANETONE CHOCO CHIP 750g', precio: 31.50 },
    { nombre: 'PANETONE CHIP CHOCOLATE 560g', precio: 28.00 },
    { nombre: 'PANETONE CHIP-CHOCOLATE EXTRA 560g', precio: 28.00 },
    { nombre: 'PANETONE MINI EX FINO 70g', precio: 5.50 },
    { nombre: 'PANETONE MINI MAGIC 70g', precio: 5.50 },
    { nombre: 'PANETONE MINI CHOCO CHIP', precio: 5.50 },
    { nombre: 'PARIS 1 KILO', precio: 29.00 },
    { nombre: 'PARIS 600g', precio: 14.00 },
    { nombre: 'PASCUERA 600g', precio: 16.90 },
    { nombre: 'BODAS DE ORO 600g', precio: 18.00 },
    { nombre: 'JO JO JO 250g', precio: 11.90 },
    { nombre: 'CHRISTMAS 500g', precio: 15.00 },
    { nombre: 'PIAZZA NAV X 12 UNI', precio: 8.00 },
    { nombre: 'PIAZZA BARQUILLO X 24 UNI', precio: 15.00 },
    { nombre: 'PICADILLO ZAFRA', precio: 2.67 },
    { nombre: 'PRIVILEGIO BOLSA', precio: 15.00 },
    { nombre: 'PRIVILEGIO BANDEJA PQ', precio: 6.00 },
    { nombre: 'PRIVILEGIO BANDEJA GR', precio: 13.00 },
    { nombre: 'POOSH SURTIDO', precio: 10.00 },
    { nombre: 'POP KISS BLACK COLA', precio: 10.00 },
    { nombre: 'POP KISS SELINHO', precio: 10.00 },
    { nombre: 'POPS DE BREICK LECHE 30g', precio: 18.00 },
    { nombre: 'POPS DE BREICK 200g', precio: 12.50 },
    { nombre: 'POPINC CHOC', precio: 39.00 },
    { nombre: 'PURO', precio: 11.00 },
    { nombre: 'RESERVADA', precio: 6.00 },
    { nombre: 'RELLENO WATTS SURTIDO', precio: 22.00 },
    { nombre: 'RITZ CON QUESO', precio: 8.00 },
    { nombre: 'SEMILLA', precio: 19.00 },
    { nombre: 'SEMILLON 60g', precio: 35.00 },
    { nombre: 'SPARKIES', precio: 29.00 },
    { nombre: 'SOPA DE MANI 200g', precio: 7.80 },
    { nombre: 'CHAIRITO PACEÑO C/CHARQUE 250g', precio: 7.80 },
    { nombre: 'LAGUA DE MAIZ JQANKAKIPA 100g', precio: 3.50 },
    { nombre: 'LAGUA DE CHOCLO 100g', precio: 3.50 },
    { nombre: 'SUBLIME TRADICIONAL', precio: 58.00 },
    { nombre: 'SUAVESITO', precio: 4.00 },
    { nombre: 'SURTIDAS DE FERRARI GHEZZI', precio: 29.50 },
    { nombre: 'SUPER HIPER ACIDO SHOK', precio: 33.50 },
    { nombre: 'TABLETA CEIBO ROJO', precio: 11.50 },
    { nombre: 'TABLETA CEIBO LILA', precio: 11.50 },
    { nombre: 'TABLETA CEIBO CELESTE', precio: 11.50 },
    { nombre: 'TABLETA CEIBO BLANCO', precio: 11.50 },
    { nombre: 'TABLETA CEIBO MENTA', precio: 11.50 },
    { nombre: 'TABLETA CEIBO ALMENDRA', precio: 11.50 },
    { nombre: 'TABLETA CEIBO ROJO FAC', precio: 12.00 },
    { nombre: 'TABLETA CEIBO LILA FAC', precio: 12.00 },
    { nombre: 'TABLETA CEIBO CELESTE FAC', precio: 12.00 },
    { nombre: 'TABLETA CEIBO BLANCO FAC', precio: 12.00 },
    { nombre: 'TABLETA CEIBO MENTA FAC', precio: 12.00 },
    { nombre: 'TABLETA CEIBO ALMENDRA FAC', precio: 12.00 },
    { nombre: 'TABLETA SUBMARINO', precio: 19.00 },
    { nombre: 'TABLETA AMARGO DARK', precio: 24.00 },
    { nombre: 'TENTACION ROSADO 156u A', precio: 0.75 },
    { nombre: 'TENTACION CAFE 156u A', precio: 0.75 },
    { nombre: 'TENTACION ROSADO 156u B', precio: 0.74 },
    { nombre: 'TENTACION CAFE 156u B', precio: 0.74 },
    { nombre: 'TE AMO CEIBO', precio: 20.00 },
    { nombre: 'TE QUIERO', precio: 25.00 },
    { nombre: 'BOMBONES DULCE AMOR', precio: 15.00 },
    { nombre: 'SELECTO CEIBO', precio: 30.00 },
    { nombre: 'INTENSO CEIBO', precio: 40.00 },
    { nombre: 'SEDUCCION AZUL', precio: 45.00 },
    { nombre: 'SEDUCCION ROJO', precio: 45.00 },
    { nombre: 'DULCE ENCANTO', precio: 50.00 },
    { nombre: 'BONBONES PARA MAMA', precio: 50.00 },
    { nombre: 'TODDY 200g', precio: 7.00 },
    { nombre: 'TODDY 400g', precio: 12.50 },
    { nombre: 'TODDY 800g', precio: 25.00 },
    { nombre: 'TODDY CAJA 2K', precio: 49.00 },
    { nombre: 'TOFFE EN BOLSA WATTS', precio: 23.00 },
    { nombre: 'TOFFEE MENTA', precio: 19.00 },
    { nombre: 'TOFFEE CHOCOLATE', precio: 17.50 },
    { nombre: 'TOFFEE SURTIDO', precio: 16.00 },
    { nombre: 'TOPLINE ROJO', precio: 27.00 },
    { nombre: 'TOPLINE NEGRO', precio: 27.00 },
    { nombre: 'TOPLINE AZUL', precio: 27.00 },
    { nombre: 'TOPLINE CELESTE', precio: 27.00 },
    { nombre: 'TOPLINE VERDE', precio: 27.00 },
    { nombre: 'TOPLINE SURTIDO', precio: 27.00 },
    { nombre: 'TRES NEGRITOS', precio: 28.00 },
    { nombre: 'TRIDENT ROJO', precio: 25.00 },
    { nombre: 'TRIDENT VERDE', precio: 25.00 },
    { nombre: 'TRIDENT AZUL', precio: 25.00 },
    { nombre: 'TRIDENT SURTIDO 18u', precio: 25.00 },
    { nombre: 'TURRON', precio: 44.00 },
    { nombre: 'VIZZIO GRANDE', precio: 11.00 },
    { nombre: 'VIZZIO MIX GRANDE', precio: 11.50 },
    { nombre: 'VIZZIO BOMBON', precio: 35.00 },
    { nombre: 'VIANDADA 320g', precio: 9.00 },
    { nombre: 'YOGUETA CHOCOLATE', precio: 10.00 },
    { nombre: 'YOGUETA GALLETA', precio: 10.00 },
    { nombre: 'YOGUETA SURTIDO', precio: 10.00 },
    { nombre: 'YUMMY MORITAS 30g', precio: 18.00 },
    { nombre: 'YUMMY PECECITOS 30g', precio: 18.00 },
    { nombre: 'YUMMY OSITOS 30g', precio: 18.00 },
    { nombre: 'YUREX 12uni 3/4 gordito', precio: 12.00 },
    { nombre: 'X-6', precio: 19.00 },
    { nombre: 'WONDER', precio: 20.00 },
    { nombre: 'ZAZUAGE AMARILLO', precio: 15.00 },
    { nombre: 'ZAZUAGE AZUL', precio: 15.00 },
    { nombre: 'ZAZUAGE CAFE', precio: 15.00 },
    { nombre: 'ZAZUAGE ROJO', precio: 15.00 },
    { nombre: 'SHOWPOP', precio: 8.00 },
    { nombre: 'TABLETA LECHE ROSA 100g BREICK', precio: 12.60 },
    { nombre: 'TABLETA PASAS CABERNET 100g BREICK', precio: 12.60 },
    { nombre: 'TABLETA BLANCO 100g BREICK', precio: 12.60 },
    { nombre: 'TABLETA BITTER SEMI AMARGO BREICK', precio: 12.60 },
    { nombre: 'TABLETA CROCANTE ARROZ', precio: 12.60 },
    { nombre: 'TABLETA MENTA AMARGO BREICK', precio: 12.60 },
    { nombre: 'TABLETA BREICK 6', precio: 12.60 },
    { nombre: 'TABLETA BREICK 7', precio: 12.60 },
    { nombre: 'TABLETA RELLENO FRUTILLA', precio: 12.60 },
    { nombre: 'TABLETA RELLENO CHERRY', precio: 12.60 },
    { nombre: 'TABLETA RELLENO FRAMBUESA', precio: 12.60 },
    { nombre: 'TABLETA RELLENO MORA', precio: 12.60 },
    { nombre: 'TABLETA RELLENO PIÑA', precio: 12.60 },
    { nombre: 'TABLETA RELLENO UVA', precio: 12.60 },
    { nombre: 'TABLETA RELLENO DAMASCO', precio: 12.60 },
    { nombre: 'TABLETA RELLENO 1', precio: 12.60 },
    { nombre: 'TABLETA RELLENO 2', precio: 12.60 },
    { nombre: 'TABLETA RELLENO 3', precio: 12.60 },
    { nombre: 'ARROZ DE BREICK 50g', precio: 5.00 },
    { nombre: 'SPACE ARROZ 10X25g', precio: 20.00 },
    { nombre: 'SPACE FIDEO 10X25g', precio: 20.00 },
    { nombre: 'SPACE QUINUA 10X25g', precio: 20.00 },
    { nombre: 'CHOCO PELOTITAS', precio: 18.00 },
    { nombre: 'POP MANIA X 50 UNI', precio: 18.00 },
    { nombre: 'PRIMAVERA', precio: 35.00 },
    { nombre: 'ANIMALITO', precio: 35.00 },
];
function inferirCategoria(nombre) {
    const n = nombre.toUpperCase();
    if (/CAFE|NESCAFE|COPACABANA/.test(n))
        return 'Café e Infusiones';
    if (/API|SOPA|CHAIRITO|LAGUA|VIANDADA/.test(n))
        return 'Alimentos Preparados';
    if (/COCOA|CHOCOLATE DE COCINA|COBERTURA|PASTA DE CACAO/.test(n))
        return 'Ingredientes y Repostería';
    if (/TABLETA|CHOCOLATE/.test(n))
        return 'Tabletas de Chocolate';
    if (/GALLETA|CLUB SOCIAL|CHIP AHOY|RITZ|OREO|FRANCESA|TODDY GALLETA|FRAC|GALLETON/.test(n))
        return 'Galletas y Bizcochos';
    if (/CHICLET|BELDENT|TRIDENT|TOPLINE|CLORETS|HALLS|MINTY|BUBALOO|GROSSO|BAZOOKA|CENTRO|ACIDO|MASTICABLE|MENTA|GELATIN|GOMA/.test(n))
        return 'Chicles y Gomas';
    if (/CARAMELO|CHUPETE|TENTACION|LOTE|AVENTURA|POOSH|PICADILLO|POP KISS|SPARKIES|LUX|RESERVADA|SUAVESITO|DINAMICO|CHOCLITO|OKA/.test(n))
        return 'Caramelos y Dulces';
    if (/ALFAJOR|BON O BON|BATON|NIKOLO|VIZZIO|DOBLON|KILATE|KILOMBO|KRAPUL|MECANO|MOMENTO|GOLPE|GOLAZO|GAROTO|GENIO|DONOFRIO|NUCITA|CHUBI/.test(n))
        return 'Alfajores y Bombones';
    if (/GRAGEA|MASMELO|MIEL|TOFFEE|TOFFE|TURRON|MANJAR|RELLENO WATTS/.test(n))
        return 'Confitería Especial';
    if (/PANATON|PANETON|PANETONE|PARIS|BODAS|PASCUERA|JO JO|CHRISTMAS|PIAZZA|FRANCESA/.test(n))
        return 'Panetones y Repostería';
    if (/HUEVO|CONEJO|BENNY|NUEZ DE PASCUA|DINOVOS/.test(n))
        return 'Temporada y Especiales';
    if (/FILIPITO|FIDOS|SPACE ARROZ|SPACE FIDEO|SPACE QUINUA|ARROZ DE BREICK|AMARANTO|PALITOS/.test(n))
        return 'Snacks y Cereales';
    if (/BUUH|YUMMY|AGOGO|BARRILETE|BURBUJITAS|PRIVILEGIO|ANGELITO|AMBROSITO|OLE OLE|ACONCAGUA|BON NUIT|BRUSOLITO/.test(n))
        return 'Golosinas Infantiles';
    if (/CEIBO|CEIBOLITO|TE AMO|TE QUIERO|BOMBONES|SELECTO|INTENSO|SEDUCCION|DULCE ENCANTO|CORAZON|EMOTICON|EMBARE/.test(n))
        return 'Chocolates Bolivianos Ceibo';
    if (/TODDY|COCOA/.test(n))
        return 'Polvos de Cacao y Malteadas';
    if (/LECHE GLORIA|NESTLE/.test(n))
        return 'Lácteos';
    if (/LIDITA|ATUN/.test(n))
        return 'Conservas';
    if (/KLEENEX/.test(n))
        return 'Higiene Personal';
    if (/YOGUETA|BIOOPS|CHOCMAN|DUCREM/.test(n))
        return 'Chocolates y Obleas';
    return 'Otros';
}
function inferirMarca(nombre) {
    const n = nombre.toUpperCase();
    if (/CEIBO|CEIBOLITO/.test(n))
        return 'Ceibo';
    if (/ARCOR|BAZOOKA|BON O BON|BELDENT|HALLS|GOLPE|GAROTO|GENIO|GROSSO|MASTICABLE ARCOR|MIEL DE ARCOR/.test(n))
        return 'Arcor';
    if (/NESTLE|NESCAFE|LECHE GLORIA|MILO|KIT KAT|OREO/.test(n))
        return 'Nestlé';
    if (/OREO|CHIPS AHOY|RITZ|CLUB SOCIAL|BELDENT/.test(n))
        return 'Mondelez';
    if (/FRANCESA/.test(n))
        return 'Francesa';
    if (/BREICK|POPS DE BREICK|COCOA INCADEX|GALLETON BREICK|ARROZ DE BREICK|TABLETA.*BREICK/.test(n))
        return 'Breick';
    if (/COPACABANA/.test(n))
        return 'Copacabana';
    if (/AMBROSOLI/.test(n))
        return 'Ambrosoli';
    if (/WATTS|TOFFE EN BOLSA WATTS|RELLENO WATTS/.test(n))
        return 'Watt\'s';
    if (/FERRARI/.test(n))
        return 'Ferrari Ghezzi';
    if (/TODDY|VIANDADA/.test(n))
        return 'Toddy';
    return 'Genérica';
}
async function main() {
    console.log('🌱 Iniciando seed de productos...\n');
    try {
        console.log('📂 Creando categorías...');
        const categoriasBase = [
            'Tabletas de Chocolate',
            'Chocolates Bolivianos Ceibo',
            'Alfajores y Bombones',
            'Galletas y Bizcochos',
            'Chicles y Gomas',
            'Caramelos y Dulces',
            'Golosinas Infantiles',
            'Confitería Especial',
            'Panetones y Repostería',
            'Temporada y Especiales',
            'Café e Infusiones',
            'Polvos de Cacao y Malteadas',
            'Ingredientes y Repostería',
            'Alimentos Preparados',
            'Snacks y Cereales',
            'Chocolates y Obleas',
            'Lácteos',
            'Conservas',
            'Higiene Personal',
            'Otros',
        ];
        const categoriaMap = {};
        for (let i = 0; i < categoriasBase.length; i++) {
            const cat = await prisma.categoria.upsert({
                where: { nombre: categoriasBase[i] },
                update: {},
                create: {
                    nombre: categoriasBase[i],
                    descripcion: `Categoría: ${categoriasBase[i]}`,
                    orden_visualizacion: i + 1,
                    activo: true,
                },
            });
            categoriaMap[categoriasBase[i]] = cat.id;
        }
        console.log(`  ✅ ${categoriasBase.length} categorías creadas\n`);
        console.log('📦 Creando presentaciones...');
        const presentacionesData = [
            { nombre: 'UNIDAD', siglas: 'UND', descripcion: 'Unidad individual', unidades: 1 },
            { nombre: 'CAJA', siglas: 'CJA', descripcion: 'Caja con unidades', unidades: 12 },
            { nombre: 'BOLSA', siglas: 'BLS', descripcion: 'Bolsa con unidades', unidades: 24 },
            { nombre: 'DISPLAY', siglas: 'DSP', descripcion: 'Display exhibidor', unidades: 6 },
            { nombre: 'FARDO', siglas: 'FRD', descripcion: 'Fardo de cajas', unidades: 4 },
        ];
        const presentacionMap = {};
        for (const p of presentacionesData) {
            const pres = await prisma.presentacion.upsert({
                where: { nombre: p.nombre },
                update: {},
                create: {
                    nombre: p.nombre,
                    siglas: p.siglas,
                    descripcion: p.descripcion,
                    es_presentacion_venta: true,
                },
            });
            presentacionMap[p.nombre] = pres.id;
        }
        console.log(`  ✅ ${presentacionesData.length} presentaciones creadas\n`);
        console.log('🏭 Creando proveedores...');
        const proveedores = [
            {
                razon_social: 'Distribuidora Central Bolivia S.R.L.',
                nombre_comercial: 'DistriBol',
                nit_rfc: '1234567890',
                contacto_nombres: 'Luis Mamani Quispe',
                contacto_telefono: '+591 67234567',
                contacto_email: 'ventas@distribol.bo',
                direccion_completa: 'Calle Oruro Nro. 345, Potosí, Bolivia',
                latitud: new library_1.Decimal('-19.5836'),
                longitud: new library_1.Decimal('-65.7531'),
                dias_entrega: 'Lunes, Miércoles, Viernes',
                condiciones_pago: '30 días',
                activo: true,
            },
            {
                razon_social: 'Importaciones Andinas S.A.',
                nombre_comercial: 'ImpAndinas',
                nit_rfc: '9876543210',
                contacto_nombres: 'Carmen Flores Gutierrez',
                contacto_telefono: '+591 72345678',
                contacto_email: 'comercial@impandinas.bo',
                direccion_completa: 'Av. Antofagasta Nro. 123, Potosí, Bolivia',
                latitud: new library_1.Decimal('-19.5900'),
                longitud: new library_1.Decimal('-65.7600'),
                dias_entrega: 'Martes, Jueves',
                condiciones_pago: '15 días',
                activo: true,
            },
        ];
        const proveedorIds = [];
        for (const prov of proveedores) {
            const p = await prisma.proveedor.upsert({
                where: { nit_rfc: prov.nit_rfc },
                update: {},
                create: prov,
            });
            proveedorIds.push(p.id);
        }
        console.log(`  ✅ ${proveedores.length} proveedores creados\n`);
        console.log(`🍬 Creando ${rawProductos.length} productos con presentaciones y lotes...\n`);
        let productosCreados = 0;
        const hoy = new Date();
        const fechaVencimiento = new Date(hoy);
        fechaVencimiento.setFullYear(hoy.getFullYear() + 1);
        for (let i = 0; i < rawProductos.length; i++) {
            const raw = rawProductos[i];
            const categoriaNombre = inferirCategoria(raw.nombre);
            const categoria_id = categoriaMap[categoriaNombre];
            const marca = inferirMarca(raw.nombre);
            const precioVenta = new library_1.Decimal(raw.precio.toFixed(2));
            const precioCompra = precioVenta.times(new library_1.Decimal('0.72')).toDecimalPlaces(2);
            const margen = new library_1.Decimal('28.00');
            const codigoInterno = `PRD-${String(i + 1).padStart(4, '0')}`;
            const producto = await prisma.producto.upsert({
                where: { codigo_interno: codigoInterno },
                update: { nombre: raw.nombre },
                create: {
                    codigo_interno: codigoInterno,
                    nombre: raw.nombre,
                    descripcion_corta: `${raw.nombre} — distribuidora FenixBd`,
                    categoria_id,
                    marca,
                    unidad_medida_base: 'UNIDAD',
                    precio_compra_promedio: precioCompra,
                    margen_ganancia_porcentaje: margen,
                    iva_porcentaje: new library_1.Decimal('0'),
                    ieps_porcentaje: new library_1.Decimal('0'),
                    stock_minimo: 10,
                    stock_maximo: 500,
                    dias_para_alerta_vencimiento: 30,
                    activo: true,
                },
            });
            const ppUnidad = await prisma.productoPresentacion.upsert({
                where: {
                    producto_id_presentacion_id: {
                        producto_id: producto.id,
                        presentacion_id: presentacionMap['UNIDAD'],
                    },
                },
                update: {},
                create: {
                    producto_id: producto.id,
                    presentacion_id: presentacionMap['UNIDAD'],
                    unidades_equivalentes: new library_1.Decimal('1'),
                    precio_venta: precioVenta,
                    precio_mayoreo: precioVenta.times(new library_1.Decimal('0.95')).toDecimalPlaces(2),
                    cantidad_minima_mayoreo: 12,
                    activo: true,
                },
            });
            await prisma.productoPresentacion.upsert({
                where: {
                    producto_id_presentacion_id: {
                        producto_id: producto.id,
                        presentacion_id: presentacionMap['CAJA'],
                    },
                },
                update: {},
                create: {
                    producto_id: producto.id,
                    presentacion_id: presentacionMap['CAJA'],
                    unidades_equivalentes: new library_1.Decimal('12'),
                    precio_venta: precioVenta.times(new library_1.Decimal('12')).toDecimalPlaces(2),
                    precio_mayoreo: precioVenta.times(new library_1.Decimal('12')).times(new library_1.Decimal('0.92')).toDecimalPlaces(2),
                    cantidad_minima_mayoreo: 3,
                    activo: true,
                },
            });
            const codigoLote = `LOTE-${codigoInterno}-2025-01`;
            await prisma.lote.upsert({
                where: {
                    producto_id_codigo_lote: {
                        producto_id: producto.id,
                        codigo_lote: codigoLote,
                    },
                },
                update: {},
                create: {
                    producto_id: producto.id,
                    proveedor_id: proveedorIds[i % 2],
                    codigo_lote: codigoLote,
                    fecha_ingreso: hoy,
                    fecha_fabricacion: new Date(hoy.getFullYear() - 1, hoy.getMonth(), 1),
                    fecha_vencimiento: fechaVencimiento,
                    presentacion_recibida_id: presentacionMap['CAJA'],
                    cantidad_recibida_presentacion: 100,
                    cantidad_unidades_inicial: 1200,
                    cantidad_unidades_disponible: 1200,
                    unidades_por_presentacion: 12,
                    costo_unitario: precioCompra,
                    costo_total: precioCompra.times(new library_1.Decimal('1200')).toDecimalPlaces(2),
                    estado: 'Disponible',
                    ubicacion_almacen: `A-${String(Math.floor(i / 20) + 1).padStart(2, '0')}`,
                    notas: 'Lote inicial — seed de datos',
                },
            });
            productosCreados++;
            if (productosCreados % 50 === 0) {
                console.log(`  ✅ ${productosCreados}/${rawProductos.length} productos procesados...`);
            }
        }
        console.log(`\n  ✅ ${productosCreados} productos creados`);
        console.log(`  ✅ ${productosCreados * 2} ProductoPresentacion creados (UNIDAD + CAJA)`);
        console.log(`  ✅ ${productosCreados} Lotes iniciales creados\n`);
        console.log('═══════════════════════════════════════════════');
        console.log('✅ SEED DE PRODUCTOS COMPLETADO');
        console.log('═══════════════════════════════════════════════\n');
        console.log(`📊 RESUMEN:`);
        console.log(`  Categorías:           ${categoriasBase.length}`);
        console.log(`  Presentaciones:       ${presentacionesData.length}`);
        console.log(`  Proveedores:          ${proveedores.length}`);
        console.log(`  Productos:            ${productosCreados}`);
        console.log(`  ProductoPresentacion: ${productosCreados * 2}`);
        console.log(`  Lotes:                ${productosCreados}`);
        console.log(`\n  Stock total inicial: ~${productosCreados * 1200} unidades\n`);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error('❌ Error durante el seed:', error.message);
        }
        else {
            console.error('❌ Error desconocido:', JSON.stringify(error));
        }
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=seed-productos.js.map