// https://github.com/wireshark/wireshark/blob/master/epan/dissectors/packet-zbee.h
const knownManufacturerCodes = {
    PANASONIC_RF4CE: 0x0001,
    SONY_RF4CE: 0x0002,
    SAMSUNG_RF4CE: 0x0003,
    PHILIPS_RF4CE: 0x0004,
    FREESCALE_RF4CE: 0x0005,
    OKI_SEMI_RF4CE: 0x0006,
    TI_RF4CE: 0x0007,
    /** Cirronet */
    CIRRONET: 0x1000,
    /** Chipcon */
    CHIPCON: 0x1001,
    /** Ember */
    EMBER: 0x1002,
    /** National Tech */
    NTS: 0x1003,
    /** Freescale */
    FREESCALE: 0x1004,
    /** IPCom */
    IPCOM: 0x1005,
    /** San Juan Software */
    SAN_JUAN: 0x1006,
    /** TUV */
    TUV: 0x1007,
    /** CompXs */
    COMPXS: 0x1008,
    /** BM SpA */
    BM: 0x1009,
    /** AwarePoint */
    AWAREPOINT: 0x100a,
    /** Philips */
    PHILIPS: 0x100b,
    /** Luxoft */
    LUXOFT: 0x100c,
    /** Korvin */
    KORWIN: 0x100d,
    /** One RF */
    _1_RF: 0x100e,
    /** Software Technology Group */
    STG: 0x100f,
    /** Telegesis */
    TELEGESIS: 0x1010,
    /** Visionic */
    VISIONIC: 0x1011,
    /** Insta */
    INSTA: 0x1012,
    /** Atalum */
    ATALUM: 0x1013,
    /** Atmel */
    ATMEL: 0x1014,
    /** Develco */
    DEVELCO: 0x1015,
    HONEYWELL1: 0x1016,
    /** RadioPulse */
    RADIO_PULSE: 0x1017,
    /** Renesas */
    RENESAS: 0x1018,
    /** Xanadu Wireless */
    XANADU: 0x1019,
    /** NEC Engineering */
    NEC: 0x101a,
    /** Yamatake */
    YAMATAKE: 0x101b,
    /** Tendril */
    TENDRIL: 0x101c,
    /** Assa Abloy */
    ASSA: 0x101d,
    /** Maxstream */
    MAXSTREAM: 0x101e,
    /** Neurocom */
    NEUROCOM: 0x101f,
    /** Institute for Information Industry */
    III: 0x1020,
    /** Vantage Controls */
    VANTAGE: 0x1021,
    /** iControl */
    ICONTROL: 0x1022,
    /** Raymarine */
    RAYMARINE: 0x1023,
    /** LS Research */
    LSR: 0x1024,
    /** Onity */
    ONITY: 0x1025,
    /** Mono Products */
    MONO: 0x1026,
    /** RF Tech */
    RFT: 0x1027,
    /** Itron */
    ITRON: 0x1028,
    /** Tritech */
    TRITECH: 0x1029,
    /** Embedit */
    EMBEDIT: 0x102a,
    /** S3C */
    S3C: 0x102b,
    /** Siemens */
    SIEMENS: 0x102c,
    /** Mindtech */
    MINDTECH: 0x102d,
    /** LG Electronics */
    LGE: 0x102e,
    /** Mitsubishi */
    MITSUBISHI: 0x102f,
    /** Johnson Controls */
    JOHNSON: 0x1030,
    /** PRI */
    PRI: 0x1031,
    /** Knick */
    KNICK: 0x1032,
    /** Viconics */
    VICONICS: 0x1033,
    /** Flexipanel */
    FLEXIPANEL: 0x1034,
    /** Piasim Corporation */
    PIASIM: 0x1035,
    /** Trane */
    TRANE: 0x1036,
    /** Jennic */
    JENNIC: 0x1037,
    /** Living Independently */
    LIG: 0x1038,
    /** AlertMe */
    ALERTME: 0x1039,
    /** Daintree */
    DAINTREE: 0x103a,
    /** Aiji */
    AIJI: 0x103b,
    /** Telecom Italia */
    TEL_ITALIA: 0x103c,
    /** Mikrokrets */
    MIKROKRETS: 0x103d,
    /** Oki Semi */
    OKI_SEMI: 0x103e,
    /** Newport Electronics */
    NEWPORT: 0x103f,
    /** Control4 */
    C4: 0x1040,
    /** STMicro */
    STM: 0x1041,
    /** Ad-Sol Nissin */
    ASN: 0x1042,
    /** DCSI */
    DCSI: 0x1043,
    /** France Telecom */
    FRANCE_TEL: 0x1044,
    /** muNet */
    MUNET: 0x1045,
    /** Autani */
    AUTANI: 0x1046,
    /** Colorado vNet */
    COL_VNET: 0x1047,
    /** Aerocomm */
    AEROCOMM: 0x1048,
    /** Silicon Labs */
    SI_LABS: 0x1049,
    /** Inncom */
    INNCOM: 0x104a,
    /** Cannon */
    CANNON: 0x104b,
    /** Synapse */
    SYNAPSE: 0x104c,
    /** Fisher Pierce/Sunrise */
    FPS: 0x104d,
    /** CentraLite */
    CLS: 0x104e,
    /** Crane */
    CRANE: 0x104F,
    /** Mobilarm */
    MOBILARM: 0x1050,
    /** iMonitor */
    IMONITOR: 0x1051,
    /** Bartech */
    BARTECH: 0x1052,
    /** Meshnetics */
    MESHNETICS: 0x1053,
    /** LS Industrial */
    LS_IND: 0x1054,
    /** Cason */
    CASON: 0x1055,
    /** Wireless Glue */
    WLESS_GLUE: 0x1056,
    /** Elster */
    ELSTER: 0x1057,
    /** SMS Tec */
    SMS_TEC: 0x1058,
    /** Onset Computer */
    ONSET: 0x1059,
    /** Riga Development */
    RIGA: 0x105a,
    /** Energate */
    ENERGATE: 0x105b,
    /** ConMed Linvatec */
    CONMED: 0x105c,
    /** PowerMand */
    POWERMAND: 0x105d,
    /** Schneider Electric */
    SCHNEIDER: 0x105e,
    /** Eaton */
    EATON: 0x105f,
    /** Telular */
    TELULAR: 0x1060,
    /** Delphi Medical */
    DELPHI: 0x1061,
    /** EpiSensor */
    EPISENSOR: 0x1062,
    /** Landis+Gyr */
    LANDIS_GYR: 0x1063,
    /** Kaba Group */
    KABA: 0x1064,
    /** Shure */
    SHURE: 0x1065,
    /** Comverge */
    COMVERGE: 0x1066,
    /** DBS Lodging */
    DBS_LODGING: 0x1067,
    /** Energy Aware */
    ENERGY_AWARE: 0x1068,
    /** Hidalgo */
    HIDALGO: 0x1069,
    /** Air2App */
    AIR2APP: 0x106a,
    /** AMX */
    AMX: 0x106b,
    /** EDMI Pty */
    EDMI: 0x106c,
    /** Cyan Ltd */
    CYAN: 0x106d,
    /** System SPA */
    SYS_SPA: 0x106e,
    /** Telit */
    TELIT: 0x106f,
    /** Kaga Electronics */
    KAGA: 0x1070,
    /** 4-noks s.r.l. */
    _4_NOKS: 0x1071,
    /** Certicom */
    CERTICOM: 0x1072,
    /** Gridpoint */
    GRIDPOINT: 0x1073,
    /** Profile Systems */
    PROFILE_SYS: 0x1074,
    /** Compacta International */
    COMPACTA: 0x1075,
    /** Freestyle Technology */
    FREESTYLE: 0x1076,
    /** Alektrona */
    ALEKTRONA: 0x1077,
    /** Computime */
    COMPUTIME: 0x1078,
    /** Remote Technologies */
    REMOTE_TECH: 0x1079,
    /** Wavecom */
    WAVECOM: 0x107a,
    /** Energy Optimizers */
    ENERGY: 0x107b,
    /** GE */
    GE: 0x107c,
    /** Jetlun */
    JETLUN: 0x107d,
    /** Cipher Systems */
    CIPHER: 0x107e,
    /** Corporate Systems Eng */
    CORPORATE: 0x107f,
    /** ecobee */
    ECOBEE: 0x1080,
    /** SMK */
    SMK: 0x1081,
    /** Meshworks Wireless */
    MESHWORKS: 0x1082,
    /** Ellips B.V. */
    ELLIPS: 0x1083,
    /** Secure electrans */
    SECURE: 0x1084,
    /** CEDO */
    CEDO: 0x1085,
    /** Toshiba */
    TOSHIBA: 0x1086,
    /** Digi International */
    DIGI: 0x1087,
    /** Ubilogix */
    UBILOGIX: 0x1088,
    /** Echelon */
    ECHELON: 0x1089,
    /** Green Energy Options */
    GREEN_ENERGY: 0x1090,
    /** Silver Spring Networks */
    SILVER_SPRING: 0x1091,
    /** Black & Decker */
    BLACK: 0x1092,
    /** Aztech AssociatesInc. */
    AZTECH_ASSOC: 0x1093,
    /** A&D Co */
    A_AND_D: 0x1094,
    /** Rainforest Automation */
    RAINFOREST: 0x1095,
    /** Carrier Electronics */
    CARRIER: 0x1096,
    /** SyChip/Murata */
    SYCHIP: 0x1097,
    /** OpenPeak */
    OPEN_PEAK: 0x1098,
    /** Passive Systems */
    PASSIVE: 0x1099,
    /** MMBResearch */
    MMB: 0x109a,
    /** Leviton */
    LEVITON: 0x109b,
    /** Korea Electric Power Data Network */
    KOREA_ELEC: 0x109c,
    COMCAST1: 0x109d,
    /** NEC Electronics */
    NEC_ELEC: 0x109e,
    /** Netvox */
    NETVOX: 0x109f,
    /** U-Control */
    UCONTROL: 0x10a0,
    /** Embedia Technologies */
    EMBEDIA: 0x10a1,
    /** Sensus */
    SENSUS: 0x10a2,
    /** SunriseTechnologies */
    SUNRISE: 0x10a3,
    /** MemtechCorp */
    MEMTECH: 0x10a4,
    /** Freebox */
    FREEBOX: 0x10a5,
    /** M2 Labs */
    M2_LABS: 0x10a6,
    /** BritishGas */
    BRITISH_GAS: 0x10a7,
    /** Sentec */
    SENTEC: 0x10a8,
    /** Navetas */
    NAVETAS: 0x10a9,
    /** Lightspeed Technologies */
    LIGHTSPEED: 0x10aa,
    /** Oki Electric */
    OKI: 0x10ab,
    /** Sistemas Inteligentes */
    SISTEMAS: 0x10ac,
    /** Dometic */
    DOMETIC: 0x10ad,
    /** Alps */
    APLS: 0x10ae,
    /** EnergyHub */
    ENERGY_HUB: 0x10af,
    /** Kamstrup */
    KAMSTRUP: 0x10b0,
    /** EchoStar */
    ECHOSTAR: 0x10b1,
    /** EnerNOC */
    ENERNOC: 0x10b2,
    /** Eltav */
    ELTAV: 0x10b3,
    /** Belkin */
    BELKIN: 0x10b4,
    /** XStreamHD Wireless */
    XSTREAMHD: 0x10b5,
    /** Saturn South */
    SATURN_SOUTH: 0x10b6,
    /** GreenTrapOnline */
    GREENTRAP: 0x10b7,
    /** SmartSynch */
    SMARTSYNCH: 0x10b8,
    /** Nyce Control */
    NYCE: 0x10b9,
    /** ICM Controls */
    ICM_CONTROLS: 0x10ba,
    /** Millennium Electronics */
    MILLENNIUM: 0x10bb,
    /** Motorola */
    MOTOROLA: 0x10bc,
    /** EmersonWhite-Rodgers */
    EMERSON: 0x10bd,
    /** Radio Thermostat */
    RADIO_THERMOSTAT: 0x10be,
    /** OMRONCorporation */
    OMRON: 0x10bf,
    /** GiiNii GlobalLimited */
    GIINII: 0x10c0,
    /** Fujitsu GeneralLimited */
    FUJITSU: 0x10c1,
    /** Peel Technologies */
    PEEL: 0x10c2,
    /** Accent */
    ACCENT: 0x10c3,
    /** ByteSnap Design */
    BYTESNAP: 0x10c4,
    /** NEC TOKIN Corporation */
    NEC_TOKIN: 0x10c5,
    /** G4S JusticeServices */
    G4S_JUSTICE: 0x10c6,
    /** Trilliant Networks */
    TRILLIANT: 0x10c7,
    /** Electrolux Italia */
    ELECTROLUX: 0x10c8,
    /** OnzoLtd */
    ONZO: 0x10c9,
    /** EnTekSystems */
    ENTEK: 0x10ca,
    PHILIPS2: 0x10cb,
    /** MainstreamEngineering */
    MAINSTREAM: 0x10cc,
    /** IndesitCompany */
    INDESIT: 0x10cd,
    /** THINKECO */
    THINKECO: 0x10ce,
    /** 2D2C */
    _2D2C: 0x10cf,
    /** GreenPeak */
    GREENPEAK: 0x10d0,
    /** InterCEL */
    INTERCEL: 0x10d1,
    /** LG Electronics */
    LG: 0x10d2,
    /** Mitsumi Electric */
    MITSUMI1: 0x10d3,
    /** Mitsumi Electric */
    MITSUMI2: 0x10d4,
    /** Zentrum Mikroelektronik Dresden */
    ZENTRUM: 0x10d5,
    /** Nest Labs */
    NEST: 0x10d6,
    /** Exegin Technologies */
    EXEGIN: 0x10d7,
    HONEYWELL2: 0x10d8,
    /** Takahata Precision */
    TAKAHATA: 0x10d9,
    /** Sumitomo Electric Networks */
    SUMITOMO: 0x10da,
    /** GE Energy */
    GE_ENERGY: 0x10db,
    /** GE Appliances */
    GE_APPLIANCES: 0x10dc,
    /** Radiocrafts AS */
    RADIOCRAFTS: 0x10dd,
    /** Ceiva */
    CEIVA: 0x10de,
    /** TEC CO Co., Ltd */
    TEC_CO: 0x10df,
    /** Chameleon Technology (UK) Ltd */
    CHAMELEON: 0x10e0,
    /** Samsung */
    SAMSUNG: 0x10e1,
    /** ruwido austria gmbh */
    RUWIDO: 0x10e2,
    HUAWEI_1: 0x10e3,
    HUAWEI_2: 0x10e4,
    /** Greenwave Reality */
    GREENWAVE: 0x10e5,
    /** BGlobal Metering Ltd */
    BGLOBAL: 0x10e6,
    /** Mindteck */
    MINDTECK: 0x10e7,
    /** Ingersoll-Rand */
    INGERSOLL_RAND: 0x10e8,
    /** Dius Computing Pty Ltd */
    DIUS: 0x10e9,
    /** Embedded Automation, Inc. */
    EMBEDDED: 0x10ea,
    /** ABB */
    ABB: 0x10eb,
    /** Sony */
    SONY: 0x10ec,
    /** Genus Power Infrastructures Limited */
    GENUS: 0x10ed,
    UNIVERSAL1: 0x10ee,
    UNIVERSAL2: 0x10ef,
    /** Metrum Technologies, LLC */
    METRUM: 0x10f0,
    /** Cisco */
    CISCO: 0x10f1,
    /** Ubisys technologies GmbH */
    UBISYS: 0x10f2,
    /** Consert */
    CONSERT: 0x10f3,
    /** Crestron Electronics */
    CRESTRON: 0x10f4,
    /** Enphase Energy */
    ENPHASE: 0x10f5,
    /** Invensys Controls */
    INVENSYS: 0x10f6,
    /** Mueller Systems, LLC */
    MUELLER: 0x10f7,
    /** AAC Technologies Holding */
    AAC_TECH: 0x10f8,
    /** U-NEXT Co., Ltd */
    U_NEXT: 0x10f9,
    /** Steelcase Inc. */
    STEELCASE: 0x10fa,
    /** Telematics Wireless */
    TELEMATICS: 0x10fb,
    /** Samil Power Co., Ltd */
    SAMIL: 0x10fc,
    /** Pace Plc */
    PACE: 0x10fd,
    /** Osborne Coinage Co. */
    OSBORNE: 0x10fe,
    /** Powerwatch */
    POWERWATCH: 0x10ff,
    /** CANDELED GmbH */
    CANDELED: 0x1100,
    /** FlexGrid S.R.L */
    FLEXGRID: 0x1101,
    /** Humax */
    HUMAX: 0x1102,
    /** Universal Devices */
    UNIVERSAL: 0x1103,
    /** Advanced Energy */
    ADVANCED_ENERGY: 0x1104,
    /** BEGA Gantenbrink-Leuchten */
    BEGA: 0x1105,
    /** Brunel University */
    BRUNEL: 0x1106,
    /** Panasonic R&D Center Singapore */
    PANASONIC: 0x1107,
    /** eSystems Research */
    ESYSTEMS: 0x1108,
    /** Panamax */
    PANAMAX: 0x1109,
    /** Physical Graph Corporation */
    PHYSICAL: 0x110a,
    /** EM-Lite Ltd. */
    EM_LITE: 0x110b,
    /** Osram Sylvania */
    OSRAM: 0x110c,
    /** 2 Save Energy Ltd. */
    _2_SAVE: 0x110d,
    /** Planet Innovation Products Pty Ltd */
    PLANET: 0x110e,
    /** Ambient Devices, Inc. */
    AMBIENT: 0x110f,
    /** Profalux */
    PROFALUX: 0x1110,
    /** Billion Electric Company (BEC) */
    BILLION: 0x1111,
    /** Embertec Pty Ltd */
    EMBERTEC: 0x1112,
    /** IT Watchdogs */
    IT_WATCHDOGS: 0x1113,
    /** Reloc */
    RELOC: 0x1114,
    /** Intel Corporation */
    INTEL: 0x1115,
    /** Trend Electronics Limited */
    TREND: 0x1116,
    /** Moxa */
    MOXA: 0x1117,
    /** QEES */
    QEES: 0x1118,
    /** SAYME Wireless Sensor Networks */
    SAYME: 0x1119,
    /** Pentair Aquatic Systems */
    PENTAIR: 0x111a,
    /** Orbit Irrigation */
    ORBIT: 0x111b,
    /** California Eastern Laboratories */
    CALIFORNIA: 0x111c,
    COMCAST2: 0x111d,
    /** IDT Technology Limited */
    IDT: 0x111e,
    /** Pixela */
    PIXELA: 0x111f,
    /** TiVo */
    TIVO: 0x1120,
    /** Fidure */
    FIDURE: 0x1121,
    /** Marvell Semiconductor */
    MARVELL: 0x1122,
    /** Wasion Group */
    WASION: 0x1123,
    /** Jasco Products */
    JASCO: 0x1124,
    /** Shenzhen Kaifa Technology */
    SHENZHEN: 0x1125,
    /** Netcomm Wireless */
    NETCOMM: 0x1126,
    /** Define Instruments */
    DEFINE: 0x1127,
    /** In Home Displays */
    IN_HOME_DISP: 0x1128,
    /** Miele & Cie. KG */
    MIELE: 0x1129,
    /** Televes S.A. */
    TELEVES: 0x112a,
    /** Labelec */
    LABELEC: 0x112b,
    /** China Electronics Standardization Institute */
    CHINA_ELEC: 0x112c,
    /** Vectorform */
    VECTORFORM: 0x112d,
    /** Busch-Jaeger Elektro */
    BUSCH_JAEGER: 0x112e,
    /** Redpine Signals */
    REDPINE: 0x112f,
    /** Bridges Electronic Technology */
    BRIDGES: 0x1130,
    /** Sercomm */
    SERCOMM: 0x1131,
    /** WSH GmbH wirsindheller */
    WSH: 0x1132,
    /** Bosch Security Systems */
    BOSCH: 0x1133,
    /** eZEX Corporation */
    EZEX: 0x1134,
    /** Dresden Elektronik Ingenieurtechnik GmbH */
    DRESDEN: 0x1135,
    /** MEAZON S.A. */
    MEAZON: 0x1136,
    /** Crow Electronic Engineering */
    CROW: 0x1137,
    /** Harvard Engineering */
    HARVARD: 0x1138,
    /** Andson(Beijing) Technology */
    ANDSON: 0x1139,
    /** Adhoco AG */
    ADHOCO: 0x113a,
    /** Waxman Consumer Products Group */
    WAXMAN: 0x113b,
    /** Owon Technology */
    OWON: 0x113c,
    /** Hitron Technologies */
    HITRON: 0x113d,
    /** Scemtec Steuerungstechnik GmbH */
    SCEMTEC: 0x113e,
    /** Webee */
    WEBEE: 0x113f,
    /** Grid2Home */
    GRID2HOME: 0x1140,
    /** Telink Micro */
    TELINK: 0x1141,
    /** Jasmine Systems */
    JASMINE: 0x1142,
    /** Bidgely */
    BIDGELY: 0x1143,
    /** Lutron */
    LUTRON: 0x1144,
    /** IJENKO */
    IJENKO: 0x1145,
    /** Starfield Electronic */
    STARFIELD: 0x1146,
    /** TCP */
    TCP: 0x1147,
    /** Rogers Communications Partnership */
    ROGERS: 0x1148,
    /** Cree */
    CREE: 0x1149,
    /** Robert Bosch LLC */
    ROBERT_BOSCH_LLC: 0x114a,
    /** Ibis Networks */
    IBIS: 0x114b,
    /** Quirky */
    QUIRKY: 0x114c,
    /** Efergy Technologies */
    EFERGY: 0x114d,
    /** Smartlabs */
    SMARTLABS: 0x114e,
    /** Everspring Industry */
    EVERSPRING: 0x114f,
    /** Swann Communications */
    SWANN: 0x1150,
    /** Soneter */
    SONETER: 0x1151,
    /** Samsung SDS */
    SAMSUNG_SDS: 0x1152,
    /** Uniband Electronic Corporation */
    UNIBAND_ELECTRO: 0x1153,
    /** Accton Technology Corporation */
    ACCTON_TECHNOLOGY: 0x1154,
    /** Bosch Thermotechnik GmbH */
    BOSCH_THERMOTECH: 0x1155,
    /** Wincor Nixdorf Inc. */
    WINCOR_NIXDORF: 0x1156,
    /** Ohsung Electronics */
    OHSUNG_ELECTRO: 0x1157,
    /** Zen Within, Inc. */
    ZEN_WITHIN: 0x1158,
    /** Tech4home, Lda. */
    TECH_4_HOME: 0x1159,
    /** Nanoleaf */
    NANOLEAF: 0x115A,
    /** Keen Home, Inc. */
    KEEN_HOME: 0x115B,
    /** Poly-Control APS */
    POLY_CONTROL: 0x115C,
    /** Eastfield Lighting Co., Ltd Shenzhen */
    EASTFIELD_LIGHT: 0x115D,
    /** IP Datatel, Inc. */
    IP_DATATEL: 0x115E,
    /** Lumi United Techology, Ltd Shenzhen */
    LUMI_UNITED_TECH: 0x115F,
    /** Sengled Optoelectronics Corp */
    SENGLED_OPTOELEC: 0x1160,
    /** Remote Solution Co., Ltd. */
    REMOTE_SOLUTION: 0x1161,
    /** ABB Genway Xiamen Electrical Equipment Co., Ltd. */
    ABB_GENWAY_XIAMEN: 0x1162,
    /** Zhejiang Rexense Tech */
    ZHEJIANG_REXENSE: 0x1163,
    /** ForEE Technology */
    FOREE_TECHNOLOGY: 0x1164,
    /** Open Access Technology Intl. */
    OPEN_ACCESS_TECH: 0x1165,
    /** INNR Lighting BV */
    INNR_LIGHTNING: 0x1166,
    /** Techworld Industries */
    TECHWORLD: 0x1167,
    /** Leedarson Lighting Co., Ltd. */
    LEEDARSON_LIGHT: 0x1168,
    /** Arzel Zoning */
    ARZEL_ZONING: 0x1169,
    /** Holley Technology */
    HOLLEY_TECH: 0x116A,
    /** Beldon Technologies */
    BELDON_TECH: 0x116B,
    /** Flextronics */
    FLEXTRONICS: 0x116C,
    /** Shenzhen Meian */
    SHENZHEN_MEIAN: 0x116D,
    /** Lowes */
    LOWES: 0x116E,
    /** Sigma Connectivity */
    SIGMA_CONNECT: 0x116F,
    /** Wulian */
    WULIAN: 0x1171,
    /** Plugwise B.V. */
    PLUGWISE_BV: 0x1172,
    /** Titan Products */
    TITAN_PRODUCTS: 0x1173,
    /** Ecospectral */
    ECOSPECTRAL: 0x1174,
    /** D-Link */
    D_LINK: 0x1175,
    /** Technicolor Home USA */
    TECHNICOLOR_HOME: 0x1176,
    /** Opple Lighting */
    OPPLE_LIGHTING: 0x1177,
    /** Wistron NeWeb Corp. */
    WISTRON_NEWEB: 0x1178,
    /** QMotion Shades */
    QMOTION_SHADES: 0x1179,
    /** Insta Elektro GmbH */
    INSTA_ELEKTRO: 0x117A,
    /** Shanghai Vancount */
    SHANGHAI_VANCOUNT: 0x117B,
    /** Ikea of Sweden */
    IKEA_OF_SWEDEN: 0x117C,
    /** RT-RK */
    RT_RK: 0x117D,
    /** Shenzhen Feibit */
    SHENZHEN_FEIBIT: 0x117E,
    /** EuControls */
    EU_CONTROLS: 0x117F,
    /** Telkonet */
    TELKONET: 0x1180,
    /** Thermal Solution Resources */
    THERMAL_SOLUTION: 0x1181,
    /** PomCube */
    POM_CUBE: 0x1182,
    /** Ei Electronics */
    EI_ELECTRONICS: 0x1183,
    /** Optoga */
    OPTOGA: 0x1184,
    /** Stelpro */
    STELPRO: 0x1185,
    /** Lynxus Technologies Corp. */
    LYNXUS_TECH: 0x1186,
    /** Semiconductor Components */
    SEMICONDUCTOR_COM: 0x1187,
    /** TP-Link */
    TP_LINK: 0x1188,
    /** LEDVANCE LLC. */
    LEDVANCE_LLC: 0x1189,
    /** Nortek */
    NORTEK: 0x118A,
    /** iRevo/Assa Abbloy Korea */
    IREVO_ASSA_ABBLOY: 0x118B,
    /** Midea */
    MIDEA: 0x118C,
    /** ZF Friedrichshafen */
    ZF_FRIEDRICHSHAF: 0x118D,
    /** Checkit */
    CHECKIT: 0x118E,
    /** Aclara */
    ACLARA: 0x118F,
    /** Nokia */
    NOKIA: 0x1190,
    /** Goldcard High-tech Co., Ltd. */
    GOLDCARD_HIGHTECH: 0x1191,
    /** George Wilson Industries Ltd. */
    GEORGE_WILSON: 0x1192,
    /** EASY SAVER CO.,INC */
    EASY_SAVER_CO: 0x1193,
    /** ZTE Corporation */
    ZTE_CORPORATION: 0x1194,
    /** ARRIS */
    ARRIS: 0x1195,
    /** Reliance BIG TV */
    RELIANCE_BIG_TV: 0x1196,
    /** Insight Energy Ventures/Powerley */
    INSIGHT_ENERGY: 0x1197,
    /** Thomas Research Products (Hubbell Lighting Inc.) */
    THOMAS_RESEARCH: 0x1198,
    /** Li Seng Technology */
    LI_SENG_TECH: 0x1199,
    /** System Level Solutions Inc. */
    SYSTEM_LEVEL_SOLU: 0x119A,
    /** Matrix Labs */
    MATRIX_LABS: 0x119B,
    /** Sinope Technologies */
    SINOPE_TECH: 0x119C,
    /** Jiuzhou Greeble */
    JIUZHOU_GREEBLE: 0x119D,
    /** Guangzhou Lanvee Tech. Co. Ltd. */
    GUANGZHOU_LANVEE: 0x119E,
    /** Venstar */
    VENSTAR: 0x119F,
    /** SLV */
    SLV: 0x1200,
    /** Halo Smart Labs */
    HALO_SMART_LABS: 0x1201,
    /** Scout Security Inc. */
    SCOUT_SECURITY: 0x1202,
    /** Alibaba China Inc. */
    ALIBABA_CHINA: 0x1203,
    /** Resolution Products, Inc. */
    RESOLUTION_PROD: 0x1204,
    /** Smartlok Inc. */
    SMARTLOK_INC: 0x1205,
    /** Lux Products Corp. */
    LUX_PRODUCTS_CORP: 0x1206,
    /** Vimar SpA */
    VIMAR_SPA: 0x1207,
    /** Universal Lighting Technologies */
    UNIVERSAL_LIGHT: 0x1208,
    /** Robert Bosch, GmbH */
    ROBERT_BOSCH_GMBH: 0x1209,
    /** Accenture */
    ACCENTURE: 0x120A,
    /** Heiman Technology Co., Ltd. */
    HEIMAN_TECHNOLOGY: 0x120B,
    /** Shenzhen HOMA Technology Co., Ltd. */
    SHENZHEN_HOMA: 0x120C,
    /** Vision-Electronics Technology */
    VISION_ELECTRO: 0x120D,
    /** Lenovo */
    LENOVO: 0x120E,
    /** Presciense R&D */
    PRESCIENSE_RD: 0x120F,
    /** Shenzhen Seastar Intelligence Co., Ltd. */
    SHENZHEN_SEASTAR: 0x1210,
    /** Sensative AB */
    SENSATIVE_AB: 0x1211,
    /** SolarEdge */
    SOLAREDGE: 0x1212,
    /** Zipato */
    ZIPATO: 0x1213,
    /** China Fire & Security Sensing Manufacturing (iHorn) */
    CHINA_FIRE_SEC: 0x1214,
    /** Quby BV */
    QUBY_BV: 0x1215,
    /** Hangzhou Roombanker Technology Co., Ltd. */
    HANGZHOU_ROOMBANK: 0x1216,
    /** Amazon Lab126 */
    AMAZON_LAB126: 0x1217,
    /** Paulmann Licht GmbH */
    PAULMANN_LICHT: 0x1218,
    /** Shenzhen Orvibo Electronics Co. Ltd. */
    SHENZHEN_ORVIBO: 0x1219,
    /** TCI Telecommunications */
    TCI_TELECOMM: 0x121A,
    /** Mueller-Licht International Inc. */
    MUELLER_LICHT_INT: 0x121B,
    /** Aurora Limited */
    AURORA_LIMITED: 0x121C,
    /** SmartDCC */
    SMART_DCC: 0x121D,
    /** Shanghai UMEinfo Co. Ltd. */
    SHANGHAI_UMEINFO: 0x121E,
    /** carbonTRACK */
    CARBON_TRACK: 0x121F,
    /** Somfy */
    SOMFY: 0x1220,
    /** Viessmann Elektronik GmbH */
    VIESSMAN_ELEKTRO: 0x1221,
    /** Hildebrand Technology Ltd */
    HILDEBRAND_TECH: 0x1222,
    /** Onkyo Technology Corporation */
    ONKYO_TECH: 0x1223,
    /** Shenzhen Sunricher Technology Ltd. */
    SHENZHEN_SUNRICH: 0x1224,
    /** Xiu Xiu Technology Co., Ltd */
    XIU_XIU_TECH: 0x1225,
    /** Zumtobel Group */
    ZUMTOBEL_GROUP: 0x1226,
    /** Shenzhen Kaadas Intelligent Technology Co. Ltd */
    SHENZHEN_KAADAS: 0x1227,
    /** Shanghai Xiaoyan Technology Co. Ltd */
    SHANGHAI_XIAOYAN: 0x1228,
    /** Cypress Semiconductor */
    CYPRESS_SEMICOND: 0x1229,
    /** XAL GmbH */
    XAL_GMBH: 0x122A,
    /** Inergy Systems LLC */
    INERGY_SYSTEMS: 0x122B,
    /** Alfred Karcher GmbH & Co KG */
    ALFRED_KARCHER: 0x122C,
    /** Adurolight Manufacturing */
    ADUROLIGHT_MANU: 0x122D,
    /** Groupe Muller */
    GROUPE_MULLER: 0x122E,
    /** V-Mark Enterprises Inc. */
    V_MARK_ENTERPRI: 0x122F,
    /** Lead Energy AG */
    LEAD_ENERGY_AG: 0x1230,
    /** UIOT Group */
    UIOT_GROUP: 0x1231,
    /** Axxess Industries Inc. */
    AXXESS_INDUSTRIES: 0x1232,
    /** Third Reality Inc. */
    THIRD_REALITY_INC: 0x1233,
    /** DSR Corporation */
    DSR_CORPORATION: 0x1234,
    /** Guangzhou Vensi Intelligent Technology Co. Ltd. */
    GUANGZHOU_VENSI: 0x1235,
    /** Schlage Lock (Allegion) */
    SCHLAGE_LOCK_ALL: 0x1236,
    /** Net2Grid */
    NET2GRID: 0x1237,
    /** Airam Electric Oy Ab */
    AIRAM_ELECTRIC: 0x1238,
    /** IMMAX WPB CZ */
    IMMAX_WPB_CZ: 0x1239,
    /** ZIV Automation */
    ZIV_AUTOMATION: 0x123A,
    /** HangZhou iMagicTechnology Co., Ltd */
    HANGZHOU_IMAGIC: 0x123B,
    /** Xiamen Leelen Technology Co. Ltd. */
    XIAMEN_LEELEN: 0x123C,
    /** Overkiz SAS */
    OVERKIZ_SAS: 0x123D,
    /** Flonidan A/S */
    FLONIDAN: 0x123E,
    /** HDL Automation Co., Ltd. */
    HDL_AUTOATION: 0x123F,
    /** Ardomus Networks Corporation */
    ARDOMUS_NETWORKS: 0x1240,
    /** Samjin Co., Ltd. */
    SAMJIN_CO: 0x1241,
    /** Sprue Aegis PLC */
    SPRUE_AEGIS_PLC: 0x1242,
    /** Indra Sistemas, S.A. */
    INDRA_SISTEMAS: 0x1243,
    /** Shenzhen JBT Smart Lighting Co., Ltd. */
    JBT_SMART_LIGHT: 0x1244,
    /** GE Lighting & Current */
    GE_LIGHTING_CURRE: 0x1245,
    /** Danfoss A/S */
    DANFOSS: 0x1246,
    /** NIVISS PHP Sp. z o.o. Sp.k. */
    NIVISS_PHP_SP: 0x1247,
    /** Shenzhen Fengliyuan Energy Conservating Technology Co. Ltd */
    FENGLIYUAN_ENERGY: 0x1248,
    /** NEXELEC */
    NEXELEC: 0x1249,
    /** Sichuan Behome Prominent Technology Co., Ltd */
    SICHUAN_BEHOME_PR: 0x124A,
    /** Fujian Star-net Communication Co., Ltd. */
    FUJIAN_STARNET: 0x124B,
    /** Toshiba Visual Solutions Corporation */
    TOSHIBA_VISUAL_SO: 0x124C,
    /** Latchable, Inc. */
    LATCHABLE_INC: 0x124D,
    /** L&S Deutschland GmbH */
    LS_DEUTSCHLAND: 0x124E,
    /** Gledopto Co., Ltd. */
    GLEDOPTO_CO_LTD: 0x124F,
    /** The Home Depot */
    THE_HOME_DEPOT: 0x1250,
    /** Neonlite International Ltd. */
    NEONLITE_INTERNAT: 0x1251,
    /** Arlo Technologies, Inc. */
    ARLO_TECHNOLOGIES: 0x1252,
    /** Xingluo Technology Co., Ltd. */
    XINGLUO_TECH: 0x1253,
    /** Simon Electric (China) Co., Ltd. */
    SIMON_ELECTRIC_CH: 0x1254,
    /** Hangzhou Greatstar Industrial Co., Ltd. */
    HANGZHOU_GREATSTA: 0x1255,
    /** Sequentric Energy Systems, LLC */
    SEQUENTRIC_ENERGY: 0x1256,
    /** Solum Co., Ltd. */
    SOLUM_CO_LTD: 0x1257,
    /** Eaglerise Electric & Electronic (China) Co., Ltd. */
    EAGLERISE_ELEC: 0x1258,
    /** Fantem Technologies (Shenzhen) Co., Ltd. */
    FANTEM_TECH: 0x1259,
    /** Yunding Network Technology (Beijing) Co., Ltd. */
    YUNDING_NETWORK: 0x125A,
    /** Atlantic Group */
    ATLANTIC_GROUP: 0x125B,
    /** Xiamen Intretech, Inc. */
    XIAMEN_INTRETECH: 0x125C,
    /** Tuya Global Inc. */
    TUYA_GLOBAL_INC: 0x125D,
    /** Xiamen Dnake Intelligent Technology Co., Ltd */
    XIAMEN_DNAKE_INTE: 0x125E,
    /** Niko nv */
    NIKO_NV: 0x125F,
    /** Emporia Energy */
    EMPORIA_ENERGY: 0x1260,
    /** Sikom AS */
    SIKOM_AS: 0x1261,
    /** AXIS Labs, Inc. */
    AXIS_LABS_INC: 0x1262,
    /** Current Products Corporation */
    CURRENT_PRODUCTS: 0x1263,
    /** MeteRSit SRL */
    METERSIT_SRL: 0x1264,
    /** HORNBACH Baumarkt AG */
    HORNBACH_BAUMARKT: 0x1265,
    /** DiCEworld s.r.l. a socio unico */
    DICEWORLD_SRL_A: 0x1266,
    /** ARC Technology Co., Ltd */
    ARC_TECHNOLOGY: 0x1267,
    /** Hangzhou Konke Information Technology Co., Ltd. */
    KONKE_INFORMATION: 0x1268,
    /** SALTO Systems S.L. */
    SALTO_SYSTEMS_SL: 0x1269,
    /** Shenzhen Shyugj Technology Co., Ltd */
    SHYUGJ_TECHNOLOGY: 0x126A,
    /** Brayden Automation Corporation */
    BRAYDEN_AUTOMA: 0x126B,
    /** Environexus Pty. Ltd. */
    ENVIRONEXUS_PTY: 0x126C,
    /** Eltra nv/sa */
    ELTRA_NV_SA: 0x126D,
    /** Xiaomi Communications Co., Ltd. */
    XIAMOMI_COMMUNI: 0x126E,
    /** Shanghai Shuncom Electronic Technology Co., Ltd. */
    SHUNCOM_ELECTRON: 0x126F,
    /** Voltalis S.A */
    VOLTALIS_SA: 0x1270,
    /** FEELUX Co., Ltd. */
    FEELUX_CO_LTD: 0x1271,
    /** SmartPlus Inc. */
    SMARTPLUS_INC: 0x1272,
    /** Halemeier GmbH */
    HALEMEIER_GMBH: 0x1273,
    /** Trust International BBV */
    TRUST_INTL: 0x1274,
    /** Duke Energy Business Services LLC */
    DUKE_ENERGY: 0x1275,
    /** Calix, Inc. */
    CALIX: 0x1276,
    /** ADEO */
    ADEO: 0x1277,
    /** ELKO */
    ELKO: 0x1277,
    /** Sprut.device */
    SPRUT_DEVICE: 0x6666,
    /** NodOn */
    NODON: 0x128B,
};

export default {
    ...knownManufacturerCodes,
    Centralite: knownManufacturerCodes.CLS,
    Philips: knownManufacturerCodes.PHILIPS,
    Sinope: knownManufacturerCodes.SINOPE_TECH,
    Stelpro: knownManufacturerCodes.STELPRO,
    Ubisys: knownManufacturerCodes.UBISYS,
    LegrandNetatmo: knownManufacturerCodes.VANTAGE,
    SmartThings: knownManufacturerCodes.PHYSICAL,
    Heiman: knownManufacturerCodes.HEIMAN_TECHNOLOGY,
    Develco: knownManufacturerCodes.DEVELCO,
    SprutDevice: knownManufacturerCodes.SPRUT_DEVICE,
    Bosch: knownManufacturerCodes.ROBERT_BOSCH_GMBH,
    NodOn: knownManufacturerCodes.NODON,
};
