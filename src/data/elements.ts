export type Element = {
  atomicNumber: number
  symbol: string
  name: string
  atomicMass: number | null
  category: string
  period: number
  group: number | null
  electronConfiguration: string
  shells: number[]
  commonMassNumber: number | null
}

const rawElements: Array<
  [string, string, number | null, string, number, number | null, string, number | null]
> = [
  ['H','Hydrogen',1.008,'Nonmetal',1,1,'1s1',1],
  ['He','Helium',4.0026,'Noble gas',1,18,'1s2',4],
  ['Li','Lithium',6.94,'Alkali metal',2,1,'[He] 2s1',7],
  ['Be','Beryllium',9.0122,'Alkaline earth metal',2,2,'[He] 2s2',9],
  ['B','Boron',10.81,'Metalloid',2,13,'[He] 2s2 2p1',11],
  ['C','Carbon',12.011,'Nonmetal',2,14,'[He] 2s2 2p2',12],
  ['N','Nitrogen',14.007,'Nonmetal',2,15,'[He] 2s2 2p3',14],
  ['O','Oxygen',15.999,'Nonmetal',2,16,'[He] 2s2 2p4',16],
  ['F','Fluorine',18.998,'Halogen',2,17,'[He] 2s2 2p5',19],
  ['Ne','Neon',20.180,'Noble gas',2,18,'[He] 2s2 2p6',20],
  ['Na','Sodium',22.990,'Alkali metal',3,1,'[Ne] 3s1',23],
  ['Mg','Magnesium',24.305,'Alkaline earth metal',3,2,'[Ne] 3s2',24],
  ['Al','Aluminium',26.982,'Post-transition metal',3,13,'[Ne] 3s2 3p1',27],
  ['Si','Silicon',28.085,'Metalloid',3,14,'[Ne] 3s2 3p2',28],
  ['P','Phosphorus',30.974,'Nonmetal',3,15,'[Ne] 3s2 3p3',31],
  ['S','Sulfur',32.06,'Nonmetal',3,16,'[Ne] 3s2 3p4',32],
  ['Cl','Chlorine',35.45,'Halogen',3,17,'[Ne] 3s2 3p5',35],
  ['Ar','Argon',39.948,'Noble gas',3,18,'[Ne] 3s2 3p6',40],
  ['K','Potassium',39.098,'Alkali metal',4,1,'[Ar] 4s1',39],
  ['Ca','Calcium',40.078,'Alkaline earth metal',4,2,'[Ar] 4s2',40],
  ['Sc','Scandium',44.956,'Transition metal',4,3,'[Ar] 3d1 4s2',45],
  ['Ti','Titanium',47.867,'Transition metal',4,4,'[Ar] 3d2 4s2',48],
  ['V','Vanadium',50.942,'Transition metal',4,5,'[Ar] 3d3 4s2',51],
  ['Cr','Chromium',51.996,'Transition metal',4,6,'[Ar] 3d5 4s1',52],
  ['Mn','Manganese',54.938,'Transition metal',4,7,'[Ar] 3d5 4s2',55],
  ['Fe','Iron',55.845,'Transition metal',4,8,'[Ar] 3d6 4s2',56],
  ['Co','Cobalt',58.933,'Transition metal',4,9,'[Ar] 3d7 4s2',59],
  ['Ni','Nickel',58.693,'Transition metal',4,10,'[Ar] 3d8 4s2',58],
  ['Cu','Copper',63.546,'Transition metal',4,11,'[Ar] 3d10 4s1',63],
  ['Zn','Zinc',65.38,'Transition metal',4,12,'[Ar] 3d10 4s2',64],
  ['Ga','Gallium',69.723,'Post-transition metal',4,13,'[Ar] 3d10 4s2 4p1',69],
  ['Ge','Germanium',72.630,'Metalloid',4,14,'[Ar] 3d10 4s2 4p2',74],
  ['As','Arsenic',74.922,'Metalloid',4,15,'[Ar] 3d10 4s2 4p3',75],
  ['Se','Selenium',78.971,'Nonmetal',4,16,'[Ar] 3d10 4s2 4p4',80],
  ['Br','Bromine',79.904,'Halogen',4,17,'[Ar] 3d10 4s2 4p5',79],
  ['Kr','Krypton',83.798,'Noble gas',4,18,'[Ar] 3d10 4s2 4p6',84],
  ['Rb','Rubidium',85.468,'Alkali metal',5,1,'[Kr] 5s1',85],
  ['Sr','Strontium',87.62,'Alkaline earth metal',5,2,'[Kr] 5s2',88],
  ['Y','Yttrium',88.906,'Transition metal',5,3,'[Kr] 4d1 5s2',89],
  ['Zr','Zirconium',91.224,'Transition metal',5,4,'[Kr] 4d2 5s2',90],
  ['Nb','Niobium',92.906,'Transition metal',5,5,'[Kr] 4d4 5s1',93],
  ['Mo','Molybdenum',95.95,'Transition metal',5,6,'[Kr] 4d5 5s1',98],
  ['Tc','Technetium',98,'Transition metal',5,7,'[Kr] 4d5 5s2',98],
  ['Ru','Ruthenium',101.07,'Transition metal',5,8,'[Kr] 4d7 5s1',102],
  ['Rh','Rhodium',102.906,'Transition metal',5,9,'[Kr] 4d8 5s1',103],
  ['Pd','Palladium',106.42,'Transition metal',5,10,'[Kr] 4d10',106],
  ['Ag','Silver',107.868,'Transition metal',5,11,'[Kr] 4d10 5s1',107],
  ['Cd','Cadmium',112.414,'Transition metal',5,12,'[Kr] 4d10 5s2',114],
  ['In','Indium',114.818,'Post-transition metal',5,13,'[Kr] 4d10 5s2 5p1',115],
  ['Sn','Tin',118.710,'Post-transition metal',5,14,'[Kr] 4d10 5s2 5p2',120],
  ['Sb','Antimony',121.760,'Metalloid',5,15,'[Kr] 4d10 5s2 5p3',121],
  ['Te','Tellurium',127.60,'Metalloid',5,16,'[Kr] 4d10 5s2 5p4',130],
  ['I','Iodine',126.904,'Halogen',5,17,'[Kr] 4d10 5s2 5p5',127],
  ['Xe','Xenon',131.293,'Noble gas',5,18,'[Kr] 4d10 5s2 5p6',132],
  ['Cs','Caesium',132.905,'Alkali metal',6,1,'[Xe] 6s1',133],
  ['Ba','Barium',137.327,'Alkaline earth metal',6,2,'[Xe] 6s2',138],
  ['La','Lanthanum',138.905,'Lanthanide',6,3,'[Xe] 5d1 6s2',139],
  ['Ce','Cerium',140.116,'Lanthanide',6,null,'[Xe] 4f1 5d1 6s2',140],
  ['Pr','Praseodymium',140.908,'Lanthanide',6,null,'[Xe] 4f3 6s2',141],
  ['Nd','Neodymium',144.242,'Lanthanide',6,null,'[Xe] 4f4 6s2',142],
  ['Pm','Promethium',145,'Lanthanide',6,null,'[Xe] 4f5 6s2',145],
  ['Sm','Samarium',150.36,'Lanthanide',6,null,'[Xe] 4f6 6s2',152],
  ['Eu','Europium',151.964,'Lanthanide',6,null,'[Xe] 4f7 6s2',153],
  ['Gd','Gadolinium',157.25,'Lanthanide',6,null,'[Xe] 4f7 5d1 6s2',158],
  ['Tb','Terbium',158.925,'Lanthanide',6,null,'[Xe] 4f9 6s2',159],
  ['Dy','Dysprosium',162.500,'Lanthanide',6,null,'[Xe] 4f10 6s2',164],
  ['Ho','Holmium',164.930,'Lanthanide',6,null,'[Xe] 4f11 6s2',165],
  ['Er','Erbium',167.259,'Lanthanide',6,null,'[Xe] 4f12 6s2',166],
  ['Tm','Thulium',168.934,'Lanthanide',6,null,'[Xe] 4f13 6s2',169],
  ['Yb','Ytterbium',173.045,'Lanthanide',6,null,'[Xe] 4f14 6s2',174],
  ['Lu','Lutetium',174.967,'Lanthanide',6,3,'[Xe] 4f14 5d1 6s2',175],
  ['Hf','Hafnium',178.49,'Transition metal',6,4,'[Xe] 4f14 5d2 6s2',180],
  ['Ta','Tantalum',180.948,'Transition metal',6,5,'[Xe] 4f14 5d3 6s2',181],
  ['W','Tungsten',183.84,'Transition metal',6,6,'[Xe] 4f14 5d4 6s2',184],
  ['Re','Rhenium',186.207,'Transition metal',6,7,'[Xe] 4f14 5d5 6s2',187],
  ['Os','Osmium',190.23,'Transition metal',6,8,'[Xe] 4f14 5d6 6s2',192],
  ['Ir','Iridium',192.217,'Transition metal',6,9,'[Xe] 4f14 5d7 6s2',193],
  ['Pt','Platinum',195.084,'Transition metal',6,10,'[Xe] 4f14 5d9 6s1',195],
  ['Au','Gold',196.967,'Transition metal',6,11,'[Xe] 4f14 5d10 6s1',197],
  ['Hg','Mercury',200.592,'Transition metal',6,12,'[Xe] 4f14 5d10 6s2',202],
  ['Tl','Thallium',204.38,'Post-transition metal',6,13,'[Xe] 4f14 5d10 6s2 6p1',205],
  ['Pb','Lead',207.2,'Post-transition metal',6,14,'[Xe] 4f14 5d10 6s2 6p2',208],
  ['Bi','Bismuth',208.980,'Post-transition metal',6,15,'[Xe] 4f14 5d10 6s2 6p3',209],
  ['Po','Polonium',209,'Post-transition metal',6,16,'[Xe] 4f14 5d10 6s2 6p4',209],
  ['At','Astatine',210,'Halogen',6,17,'[Xe] 4f14 5d10 6s2 6p5',210],
  ['Rn','Radon',222,'Noble gas',6,18,'[Xe] 4f14 5d10 6s2 6p6',222],
  ['Fr','Francium',223,'Alkali metal',7,1,'[Rn] 7s1',223],
  ['Ra','Radium',226,'Alkaline earth metal',7,2,'[Rn] 7s2',226],
  ['Ac','Actinium',227,'Actinide',7,3,'[Rn] 6d1 7s2',227],
  ['Th','Thorium',232.038,'Actinide',7,null,'[Rn] 6d2 7s2',232],
  ['Pa','Protactinium',231.036,'Actinide',7,null,'[Rn] 5f2 6d1 7s2',231],
  ['U','Uranium',238.029,'Actinide',7,null,'[Rn] 5f3 6d1 7s2',238],
  ['Np','Neptunium',237,'Actinide',7,null,'[Rn] 5f4 6d1 7s2',237],
  ['Pu','Plutonium',244,'Actinide',7,null,'[Rn] 5f6 7s2',244],
  ['Am','Americium',243,'Actinide',7,null,'[Rn] 5f7 7s2',243],
  ['Cm','Curium',247,'Actinide',7,null,'[Rn] 5f7 6d1 7s2',247],
  ['Bk','Berkelium',247,'Actinide',7,null,'[Rn] 5f9 7s2',247],
  ['Cf','Californium',251,'Actinide',7,null,'[Rn] 5f10 7s2',251],
  ['Es','Einsteinium',252,'Actinide',7,null,'[Rn] 5f11 7s2',252],
  ['Fm','Fermium',257,'Actinide',7,null,'[Rn] 5f12 7s2',257],
  ['Md','Mendelevium',258,'Actinide',7,null,'[Rn] 5f13 7s2',258],
  ['No','Nobelium',259,'Actinide',7,null,'[Rn] 5f14 7s2',259],
  ['Lr','Lawrencium',266,'Actinide',7,null,'[Rn] 5f14 7s2 7p1',266],
  ['Rf','Rutherfordium',267,'Transition metal',7,4,'[Rn] 5f14 6d2 7s2',267],
  ['Db','Dubnium',268,'Transition metal',7,5,'[Rn] 5f14 6d3 7s2',268],
  ['Sg','Seaborgium',269,'Transition metal',7,6,'[Rn] 5f14 6d4 7s2',269],
  ['Bh','Bohrium',270,'Transition metal',7,7,'[Rn] 5f14 6d5 7s2',270],
  ['Hs','Hassium',277,'Transition metal',7,8,'[Rn] 5f14 6d6 7s2',277],
  ['Mt','Meitnerium',278,'Unknown properties',7,9,'[Rn] 5f14 6d7 7s2',278],
  ['Ds','Darmstadtium',281,'Unknown properties',7,10,'[Rn] 5f14 6d8 7s2',281],
  ['Rg','Roentgenium',282,'Unknown properties',7,11,'[Rn] 5f14 6d9 7s2',282],
  ['Cn','Copernicium',285,'Unknown properties',7,12,'[Rn] 5f14 6d10 7s2',285],
  ['Nh','Nihonium',286,'Unknown properties',7,13,'[Rn] 5f14 6d10 7s2 7p1',286],
  ['Fl','Flerovium',289,'Unknown properties',7,14,'[Rn] 5f14 6d10 7s2 7p2',289],
  ['Mc','Moscovium',290,'Unknown properties',7,15,'[Rn] 5f14 6d10 7s2 7p3',290],
  ['Lv','Livermorium',293,'Unknown properties',7,16,'[Rn] 5f14 6d10 7s2 7p4',293],
  ['Ts','Tennessine',294,'Unknown properties',7,17,'[Rn] 5f14 6d10 7s2 7p5',294],
  ['Og','Oganesson',294,'Unknown properties',7,18,'[Rn] 5f14 6d10 7s2 7p6',294],
]

const periods: number[] = []
const elements: Element[] = rawElements.map(
  ([symbol, name, atomicMass, category, period, group, electronConfiguration, commonMassNumber], index) => {
    const atomicNumber = index + 1
    periods.push(period)

    const shells: number[] = new Array<number>(period).fill(0)
    const shellRegex = /(\d)[spdf](\d+)/g
    let match: RegExpExecArray | null

    // Expand noble-gas shorthand so inner-shell electrons are included.
    const nobleGasCore: Record<string, string> = {
      He: '1s2',
      Ne: '1s2 2s2 2p6',
      Ar: '1s2 2s2 2p6 3s2 3p6',
      Kr: '1s2 2s2 2p6 3s2 3p6 4s2 3d10 4p6',
      Xe: '1s2 2s2 2p6 3s2 3p6 4s2 3d10 4p6 5s2 4d10 5p6',
      Rn: '1s2 2s2 2p6 3s2 3p6 4s2 3d10 4p6 5s2 4d10 5p6 6s2 4f14 5d10 6p6',
    }

    const coreMatch = electronConfiguration.match(/\[([^\]]+)\]/)
    const core = coreMatch ? nobleGasCore[coreMatch[1]] ?? '' : ''
    const valence = electronConfiguration.replace(/\[[^\]]+\]\s*/, '')
    const config = `${core} ${valence}`.trim()

    while ((match = shellRegex.exec(config)) !== null) {
      const shell = Number(match[1]) - 1
      shells[shell] = (shells[shell] ?? 0) + Number(match[2])
    }



    return {
      atomicNumber,
      symbol,
      name,
      atomicMass,
      category,
      period,
      group,
      electronConfiguration,
      shells,
      commonMassNumber,
    }
  },
)

export const ELEMENTS = elements
